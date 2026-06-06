import json
import logging
import os
import random
import unicodedata
import uuid
from datetime import datetime
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import Column, DateTime, Integer, String, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker

from ai.llm_chain import LLMChain
from ai.prompts import EXAMPLE_CHARACTERS

logger = logging.getLogger(__name__)

# --- KONFIGURACJA BAZY DANYCH ---
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./akinator.db")
ENGINE_CONNECT_ARGS = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=ENGINE_CONNECT_ARGS)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

DEFAULT_PLAYERS = [
    {
        "player_id": "p1",
        "username": "Gracz1",
        "guess_count": 0,
        "hint_used": False,
        "penalty_seconds": 0,
        "has_guessed": False,
        "guessed_at": None,
    }
]

MODE_MAX_PLAYERS = {
    "solo": 1,
    "duel": 2,
    "battle_royale": 10,
}

DEFAULT_HISTORY = [
    {
        "role": "player",
        "question": "Czy ta postac jest prawdziwa?",
    },
    {
        "role": "ai",
        "answer": "Tak",
    },
]

# Model bazy danych
class RoomDB(Base):
    __tablename__ = "rooms"
    room_id = Column(String, primary_key=True, index=True)
    invite_code = Column(String, unique=True, index=True)
    game_mode = Column(String)
    max_players = Column(Integer, nullable=False, default=2)
    status = Column(String, default="waiting")
    phase = Column(String, default="waiting", nullable=False)
    winner_id = Column(String, nullable=True)
    secret_character = Column(String, nullable=True)
    players_json = Column(String, default="[]", nullable=False)
    history_json = Column(String, default="[]", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# Utworzenie tabel
Base.metadata.create_all(bind=engine)

# --- MODELE PYDANTIC ---
class RoomResponse(BaseModel):
    room_id: str
    invite_code: str
    game_mode: str
    max_players: int
    phase: str
    status: str

    class Config:
        from_attributes = True


class ConversationEntry(BaseModel):
    role: str
    question: str | None = None
    answer: str | None = None


class PlayerState(BaseModel):
    player_id: str
    username: str
    guess_count: int
    hint_used: bool
    penalty_seconds: int
    has_guessed: bool
    guessed_at: datetime | None


class RoomState(BaseModel):
    room_id: str
    game_mode: str
    invite_code: str
    max_players: int
    phase: Literal["waiting", "active", "ended"]
    players: list[PlayerState]
    winner_id: str | None
    created_at: datetime
    secret_character: str | None = None

    class Config:
        from_attributes = True


class GameState(RoomState):
    conversation_history: list[ConversationEntry]


class JoinRequest(BaseModel):
    username: str
    invite_code: str | None = None


class JoinResponse(GameState):
    player_id: str


class CreateGameRequest(BaseModel):
    username: str | None = None


class CreateRoomResponse(RoomResponse):
    player_id: str | None = None


class QuestionRequest(BaseModel):
    player_id: str
    question: str


class QuestionResponse(BaseModel):
    question_id: str
    answer: Literal["Tak", "Nie", "Nie wiem"]
    updated_history: list[ConversationEntry]


class GuessRequest(BaseModel):
    player_id: str
    guess: str


class HintRequest(BaseModel):
    player_id: str


class GuessResponse(BaseModel):
    correct: bool
    winner_id: str | None
    message: str
    updated_history: list[ConversationEntry]


class HintResponse(BaseModel):
    hint_text: str


# --- HELPER FUNCTIONS ---
def get_room_logic(room_id: str, db: Session):
    room = db.query(RoomDB).filter(RoomDB.room_id == room_id).first()
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")
    if not room.invite_code:
        room.invite_code = _generate_invite_code()
    if not room.max_players:
        room.max_players = _default_max_players(room.game_mode)
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


def _normalize_for_guess(value: str) -> str:
    """Lowercase, strip whitespace, remove diacritics for forgiving guess comparison."""
    decomposed = unicodedata.normalize("NFKD", value or "")
    no_accents = "".join(ch for ch in decomposed if not unicodedata.combining(ch))
    return "".join(no_accents.lower().split())


def _json_list_value(raw_value, fallback):
    if not raw_value:
        return fallback

    try:
        parsed_value = json.loads(raw_value)
    except (TypeError, json.JSONDecodeError):
        return fallback

    if not isinstance(parsed_value, list) or not parsed_value:
        return fallback

    return parsed_value


def _default_max_players(game_mode: str) -> int:
    return MODE_MAX_PLAYERS.get(game_mode, MODE_MAX_PLAYERS["duel"])


def _generate_invite_code() -> str:
    return uuid.uuid4().hex[:8].upper()


def _normalize_players(players: list[dict]) -> list[dict]:
    normalized_players: list[dict] = []
    for player in players:
        normalized_players.append(
            {
                "player_id": player.get("player_id", str(uuid.uuid4())),
                "username": player.get("username", "Gracz"),
                "guess_count": int(player.get("guess_count", 0) or 0),
                "hint_used": bool(player.get("hint_used", False)),
                "penalty_seconds": int(player.get("penalty_seconds", 0) or 0),
                "has_guessed": bool(player.get("has_guessed", False)),
                "guessed_at": player.get("guessed_at"),
            }
        )
    return normalized_players or [dict(player) for player in DEFAULT_PLAYERS]


def _normalize_room_state(room: RoomDB, db: Session) -> RoomDB:
    changed = False

    if not room.invite_code:
        room.invite_code = _generate_invite_code()
        changed = True

    if not room.max_players:
        room.max_players = _default_max_players(room.game_mode)
        changed = True

    if changed:
        db.add(room)
        db.commit()
        db.refresh(room)

    return room


def _ensure_secret_character(room: RoomDB, room_id: str, db: Session) -> str:
    secret_character = (room.secret_character or "").strip()
    if not secret_character:
        secret_character = random.choice(EXAMPLE_CHARACTERS)
        room.secret_character = secret_character
        logger.warning(
            "Room %s had no secret_character; assigned fallback character for legacy/migrated room",
            room_id,
        )
        db.add(room)
        db.commit()
        db.refresh(room)
    return secret_character


def get_room_with_state(room_id: str, db: Session) -> RoomState:
    room = _normalize_room_state(get_room_logic(room_id, db), db)
    room_phase = room.phase or room.status or "waiting"

    if room_phase not in {"waiting", "active", "ended"}:
        room_phase = "waiting"

    players = _normalize_players(_json_list_value(room.players_json, DEFAULT_PLAYERS))
    winner_id = room.winner_id or next(
        (p.get("player_id") for p in players if p.get("has_guessed")),
        None,
    )

    return RoomState(
        room_id=room.room_id,
        game_mode=room.game_mode,
        invite_code=room.invite_code,
        max_players=int(room.max_players or _default_max_players(room.game_mode)),
        phase=room_phase,
        players=players,
        winner_id=winner_id,
        created_at=room.created_at,
        secret_character=room.secret_character,
    )


def get_room_with_history(room_id: str, db: Session) -> GameState:
    room = get_room_logic(room_id, db)
    room_state = get_room_with_state(room_id, db)

    return GameState(
        **room_state.model_dump(),
        conversation_history=_json_list_value(room.history_json, DEFAULT_HISTORY),
    )


# --- APLIKACJA ---
app = FastAPI(title="AI-kinator Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Zależność bazy danych
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ENDPOINTY ---

@app.get("/")
def root():
    return {"message": "AI-kinator API is running", "status": "ok"}

@app.get("/health")
def health():
    return {"status": "healthy"}

# Logika tworzenia pokoju
def create_room_logic(mode: str, db: Session, creator_username: str | None = None):
    max_players = _default_max_players(mode)
    creator_name = creator_username.strip() if creator_username and creator_username.strip() else "Gracz1"
    initial_players = _normalize_players([
        {
            "player_id": "p1",
            "username": creator_name,
            "guess_count": 0,
            "hint_used": False,
            "penalty_seconds": 0,
            "has_guessed": False,
            "guessed_at": None,
        }
    ])
    phase = "active" if len(initial_players) >= max_players else "waiting"
    new_room = RoomDB(
        room_id=str(uuid.uuid4()),
        invite_code=_generate_invite_code(),
        game_mode=mode,
        max_players=max_players,
        status=phase,
        phase=phase,
        winner_id=None,
        secret_character=random.choice(EXAMPLE_CHARACTERS),
        players_json=json.dumps(initial_players, ensure_ascii=False),
        history_json=json.dumps(DEFAULT_HISTORY),
    )
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room

@app.post("/games/solo", response_model=CreateRoomResponse)
def create_solo_game(request: CreateGameRequest = Body(default_factory=CreateGameRequest), db: Session = Depends(get_db)):
    room = create_room_logic("solo", db, creator_username=request.username)
    return {
        "room_id": room.room_id,
        "invite_code": room.invite_code,
        "game_mode": room.game_mode,
        "max_players": room.max_players,
        "phase": room.phase,
        "status": room.status,
        "player_id": "p1",
    }

@app.post("/games/duel", response_model=CreateRoomResponse)
def create_duel_game(request: CreateGameRequest = Body(default_factory=CreateGameRequest), db: Session = Depends(get_db)):
    room = create_room_logic("duel", db, creator_username=request.username)
    return {
        "room_id": room.room_id,
        "invite_code": room.invite_code,
        "game_mode": room.game_mode,
        "max_players": room.max_players,
        "phase": room.phase,
        "status": room.status,
        "player_id": "p1",
    }

@app.post("/games/battle-royale", response_model=CreateRoomResponse)
def create_br_game(request: CreateGameRequest = Body(default_factory=CreateGameRequest), db: Session = Depends(get_db)):
    room = create_room_logic("battle_royale", db, creator_username=request.username)
    return {
        "room_id": room.room_id,
        "invite_code": room.invite_code,
        "game_mode": room.game_mode,
        "max_players": room.max_players,
        "phase": room.phase,
        "status": room.status,
        "player_id": "p1",
    }

@app.get("/rooms/{room_id}/state", response_model=RoomState, response_model_exclude={"secret_character"})
def get_room_state_polling(room_id: str, db: Session = Depends(get_db)):
    """Get current game state for polling (no conversation history)."""
    return get_room_with_state(room_id, db)

@app.get("/rooms/{room_id}/join", response_model=GameState, response_model_exclude={"secret_character"})
def get_room_history(room_id: str, db: Session = Depends(get_db)):
    """Get full room history including all conversation (initial load only)."""
    return get_room_with_history(room_id, db)


@app.post("/rooms/{room_id}/join", response_model=JoinResponse, response_model_exclude={"secret_character"})
def join_room(room_id: str, request: JoinRequest, db: Session = Depends(get_db)):
    room = _normalize_room_state(get_room_logic(room_id, db), db)

    if room.phase == "ended":
        raise HTTPException(status_code=400, detail="Game has already ended")

    username = request.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Username cannot be empty")
    if len(username) > 100:
        raise HTTPException(status_code=400, detail="Username must be between 1 and 100 characters")
    if request.invite_code and request.invite_code != room.invite_code:
        raise HTTPException(status_code=400, detail="Invalid invite code")

    players = _normalize_players(_json_list_value(room.players_json, DEFAULT_PLAYERS))
    if len(players) >= int(room.max_players or _default_max_players(room.game_mode)):
        raise HTTPException(status_code=400, detail="Room is full")

    player_id = str(uuid.uuid4())
    players.append(
        {
            "player_id": player_id,
            "username": username,
            "guess_count": 0,
            "hint_used": False,
            "penalty_seconds": 0,
            "has_guessed": False,
            "guessed_at": None,
        }
    )

    room.players_json = json.dumps(players, ensure_ascii=False)
    if len(players) >= int(room.max_players or _default_max_players(room.game_mode)):
        room.phase = "active"
        room.status = "active"

    db.add(room)
    db.commit()
    db.refresh(room)

    state = get_room_with_history(room_id, db)
    return {
        **state.model_dump(),
        "player_id": player_id,
    }


@app.post("/rooms/{room_id}/start", response_model=RoomState, response_model_exclude={"secret_character"})
def start_room(room_id: str, db: Session = Depends(get_db)):
    room = _normalize_room_state(get_room_logic(room_id, db), db)

    if room.phase == "ended":
        raise HTTPException(status_code=400, detail="Game has already ended")

    players = _normalize_players(_json_list_value(room.players_json, DEFAULT_PLAYERS))
    required_players = 2 if room.game_mode == "duel" else 3 if room.game_mode == "battle_royale" else 1

    if len(players) < required_players:
        raise HTTPException(
            status_code=400,
            detail=f"Potrzebnych jest co najmniej {required_players} graczy, aby rozpocząć tę grę.",
        )

    room.phase = "active"
    room.status = "active"
    db.add(room)
    db.commit()
    db.refresh(room)

    return get_room_with_state(room_id, db)


@app.get("/rooms/invite/{invite_code}")
def get_room_by_invite(invite_code: str, db: Session = Depends(get_db)):
    normalized_code = invite_code.strip().upper()
    room = db.query(RoomDB).filter(RoomDB.invite_code == normalized_code).first()
    if room is None:
        raise HTTPException(status_code=404, detail="Invite code not found")
    return {"room_id": room.room_id}


@app.post("/rooms/{room_id}/question", response_model=QuestionResponse)
def submit_question(room_id: str, request: QuestionRequest, db: Session = Depends(get_db)):
    """Submit a question and get AI response (Tak/Nie/Nie wiem)."""
    room = _normalize_room_state(get_room_logic(room_id, db), db)

    if room.phase == "ended":
        raise HTTPException(status_code=400, detail="Game has already ended")

    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    if len(question) > 500:
        raise HTTPException(status_code=400, detail="Question must be between 1 and 500 characters")

    # Ensure player is part of the room
    players = _normalize_players(_json_list_value(room.players_json, DEFAULT_PLAYERS))
    if not any(p.get("player_id") == request.player_id for p in players):
        raise HTTPException(status_code=404, detail="Player not in room")

    history = _json_list_value(room.history_json, DEFAULT_HISTORY)

    secret_character = _ensure_secret_character(room, room_id, db)

    chain = LLMChain(character_name=secret_character)
    try:
        result = chain.get_answer(question, history)
    except Exception:
        logger.exception("LLM timeout / error for room %s", room_id)
        result = {"answer": "Nie wiem"}

    for p in players:
        if p.get("player_id") == request.player_id:
            p["guess_count"] = p.get("guess_count", 0) + 1
            break

    room.players_json = json.dumps(players, ensure_ascii=False)
    history.append({"role": "player", "question": question})
    history.append({"role": "ai", "answer": result["answer"]})

    room.history_json = json.dumps(history, ensure_ascii=False)
    room.phase = "active"
    room.status = "active"
    db.add(room)
    db.commit()
    db.refresh(room)

    return {
        "question_id": str(uuid.uuid4()),
        "answer": result["answer"],
        "updated_history": history,
    }


@app.post("/rooms/{room_id}/guess", response_model=GuessResponse)
def submit_guess(room_id: str, request: GuessRequest, db: Session = Depends(get_db)):
    """Submit a guess; compare normalized strings against the secret character."""
    room = _normalize_room_state(get_room_logic(room_id, db), db)

    if room.phase == "ended":
        raise HTTPException(status_code=400, detail="Game has already ended")

    guess = request.guess.strip()
    if not guess:
        raise HTTPException(status_code=400, detail="Guess cannot be empty")
    if len(guess) > 100:
        raise HTTPException(status_code=400, detail="Guess must be between 1 and 100 characters")

    players = _normalize_players(_json_list_value(room.players_json, DEFAULT_PLAYERS))
    if not any(p.get("player_id") == request.player_id for p in players):
        raise HTTPException(status_code=404, detail="Player not in room")

    secret_character = _ensure_secret_character(room, room_id, db)

    correct = _normalize_for_guess(guess) == _normalize_for_guess(secret_character)
    history = _json_list_value(room.history_json, DEFAULT_HISTORY)
    winner_id: str | None = None

    if correct:
        room.phase = "ended"
        room.status = "ended"
        room.winner_id = request.player_id
        for p in players:
            if p.get("player_id") == request.player_id:
                p["has_guessed"] = True
                p["guessed_at"] = datetime.utcnow().isoformat()
                p["guess_count"] = p.get("guess_count", 0) + 1
        room.players_json = json.dumps(players, ensure_ascii=False)
        winner_id = request.player_id
        message = f"Brawo! {guess} to faktycznie sekretna postać."
        history_answer = "Tak"
    else:
        room.phase = "active"
        room.status = "active"
        for p in players:
            if p.get("player_id") == request.player_id:
                p["guess_count"] = p.get("guess_count", 0) + 1
        room.players_json = json.dumps(players, ensure_ascii=False)
        message = "To nie ta postać. Spróbuj jeszcze raz!"
        history_answer = "Nie"

    history.append({"role": "player", "question": f"[Zgaduję] {guess}"})
    history.append({"role": "ai", "answer": history_answer})

    room.history_json = json.dumps(history, ensure_ascii=False)
    db.add(room)
    db.commit()
    db.refresh(room)

    return {
        "correct": correct,
        "winner_id": winner_id,
        "message": message,
        "updated_history": history,
    }


@app.post("/rooms/{room_id}/hint", response_model=HintResponse)
def submit_hint(room_id: str, request: HintRequest, db: Session = Depends(get_db)):
    """Submit a hint request and return one short clue about the secret character."""
    room = _normalize_room_state(get_room_logic(room_id, db), db)

    if room.phase == "ended":
        raise HTTPException(status_code=400, detail="Game has already ended")

    players = _normalize_players(_json_list_value(room.players_json, DEFAULT_PLAYERS))
    player = next((p for p in players if p.get("player_id") == request.player_id), None)
    if player is None:
        raise HTTPException(status_code=404, detail="Player not in room")
    if player.get("hint_used"):
        raise HTTPException(status_code=400, detail="Hint already used")

    secret_character = _ensure_secret_character(room, room_id, db)
    chain = LLMChain(character_name=secret_character)
    result = chain.get_hint()
    hint_text = result.get("hint_text", "").strip() or "To postać z wyraźną, rozpoznawalną cechą."

    player["hint_used"] = True
    if room.game_mode in {"duel", "battle_royale"}:
        player["penalty_seconds"] = int(player.get("penalty_seconds", 0) or 0) + 30

    room.players_json = json.dumps(players, ensure_ascii=False)
    db.add(room)
    db.commit()
    db.refresh(room)

    return {"hint_text": hint_text}
