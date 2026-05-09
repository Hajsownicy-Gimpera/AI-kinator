import json
import logging
import os
import random
import uuid
from datetime import datetime
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import Column, DateTime, String, create_engine, inspect
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
        "has_guessed": False,
        "guessed_at": None,
    }
]

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
    game_mode = Column(String)
    status = Column(String, default="waiting")
    phase = Column(String, default="waiting", nullable=False)
    secret_character = Column(String, nullable=True)
    players_json = Column(String, default="[]", nullable=False)
    history_json = Column(String, default="[]", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# Utworzenie tabel
Base.metadata.create_all(bind=engine)


def ensure_room_state_columns():
    with engine.begin() as connection:
        inspector = inspect(connection)

        if "rooms" not in inspector.get_table_names():
            return

        existing_columns = {column["name"] for column in inspector.get_columns("rooms")}
        column_definitions = {
            "phase": "VARCHAR NOT NULL DEFAULT 'waiting'",
            "secret_character": "VARCHAR",
            "players_json": "VARCHAR NOT NULL DEFAULT '[]'",
            "history_json": "VARCHAR NOT NULL DEFAULT '[]'",
        }

        for column_name, column_definition in column_definitions.items():
            if column_name not in existing_columns:
                connection.exec_driver_sql(
                    f"ALTER TABLE rooms ADD COLUMN {column_name} {column_definition}"
                )


ensure_room_state_columns()

# --- MODELE PYDANTIC ---
class RoomResponse(BaseModel):
    room_id: str
    game_mode: str
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
    has_guessed: bool
    guessed_at: datetime | None


class RoomState(BaseModel):
    room_id: str
    game_mode: str
    phase: Literal["waiting", "active", "ended"]
    players: list[PlayerState]
    winner_id: str | None
    created_at: datetime
    secret_character: str | None = None

    class Config:
        from_attributes = True


class GameState(RoomState):
    conversation_history: list[ConversationEntry]


class QuestionRequest(BaseModel):
    player_id: str
    question: str


class QuestionResponse(BaseModel):
    question_id: str
    answer: Literal["Tak", "Nie", "Nie wiem"]
    updated_history: list[ConversationEntry]


# --- HELPER FUNCTIONS ---
def get_room_logic(room_id: str, db: Session):
    room = db.query(RoomDB).filter(RoomDB.room_id == room_id).first()
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


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


def get_room_with_state(room_id: str, db: Session) -> RoomState:
    room = get_room_logic(room_id, db)
    room_phase = room.phase or room.status or "waiting"

    if room_phase not in {"waiting", "active", "ended"}:
        room_phase = "waiting"

    return RoomState(
        room_id=room.room_id,
        game_mode=room.game_mode,
        phase=room_phase,
        players=_json_list_value(room.players_json, DEFAULT_PLAYERS),
        winner_id=None,
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
def create_room_logic(mode: str, db: Session):
    new_room = RoomDB(
        room_id=str(uuid.uuid4()),
        game_mode=mode,
        status="waiting",
        phase="waiting",
        secret_character=random.choice(EXAMPLE_CHARACTERS),
        players_json=json.dumps(DEFAULT_PLAYERS),
        history_json=json.dumps(DEFAULT_HISTORY),
    )
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room

@app.post("/games/solo", response_model=RoomResponse)
def create_solo_game(db: Session = Depends(get_db)):
    return create_room_logic("solo", db)

@app.post("/games/duel", response_model=RoomResponse)
def create_duel_game(db: Session = Depends(get_db)):
    return create_room_logic("duel", db)

@app.post("/games/battle-royale", response_model=RoomResponse)
def create_br_game(db: Session = Depends(get_db)):
    return create_room_logic("battle_royale", db)

@app.get("/rooms/{room_id}/state", response_model=RoomState, response_model_exclude={"secret_character"})
def get_room_state_polling(room_id: str, db: Session = Depends(get_db)):
    """Get current game state for polling (no conversation history)."""
    return get_room_with_state(room_id, db)

@app.get("/rooms/{room_id}/join", response_model=GameState, response_model_exclude={"secret_character"})
def get_room_history(room_id: str, db: Session = Depends(get_db)):
    """Get full room history including all conversation (initial load only)."""
    return get_room_with_history(room_id, db)


@app.post("/rooms/{room_id}/question", response_model=QuestionResponse)
def submit_question(room_id: str, request: QuestionRequest, db: Session = Depends(get_db)):
    """Submit a question and get AI response (Tak/Nie/Nie wiem)."""
    room = db.query(RoomDB).filter(RoomDB.room_id == room_id).first()
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")

    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    if len(question) > 500:
        raise HTTPException(status_code=400, detail="Question must be between 1 and 500 characters")

    # Ensure player is part of the room
    players = _json_list_value(room.players_json, DEFAULT_PLAYERS)
    if not any(p.get("player_id") == request.player_id for p in players):
        raise HTTPException(status_code=404, detail="Player not in room")

    history = _json_list_value(room.history_json, DEFAULT_HISTORY)

    secret_character = (room.secret_character or "").strip()
    if not secret_character:
        secret_character = random.choice(EXAMPLE_CHARACTERS)
        room.secret_character = secret_character
        logger.warning(
            "Room %s had no secret_character; assigned fallback character for legacy/migrated room",
            room_id,
        )

    chain = LLMChain(character_name=secret_character)
    try:
        result = chain.get_answer(question, history)
    except Exception:
        logger.exception("LLM timeout / error for room %s", room_id)
        result = {"answer": "Nie wiem"}

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
