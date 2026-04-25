import json
import logging
import random
import uuid
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

from ai.llm_chain import LLMChain
from ai.prompts import EXAMPLE_CHARACTERS

logger = logging.getLogger(__name__)

# --- KONFIGURACJA BAZY DANYCH ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./akinator.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Model bazy danych
class RoomDB(Base):
    __tablename__ = "rooms"
    room_id = Column(String, primary_key=True, index=True)
    game_mode = Column(String)
    status = Column(String, default="waiting")
    secret_character = Column(String, nullable=False)
    conversation_history = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow)

# Utworzenie tabel
Base.metadata.create_all(bind=engine)

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


class RoomStateResponse(BaseModel):
    room_id: str
    game_mode: str
    game_phase: str
    players: list[PlayerState]
    conversation_history: list[ConversationEntry]
    winner_id: str | None
    created_at: datetime

class QuestionRequest(BaseModel):
    player_id: str
    question: str


class QuestionResponse(BaseModel):
    answer: str
    raw_response: str
    updated_history: list[ConversationEntry]


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
        secret_character=random.choice(EXAMPLE_CHARACTERS),
        conversation_history="[]",
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


@app.get("/rooms/{room_id}/state", response_model=RoomStateResponse)
def get_room_state(room_id: str, db: Session = Depends(get_db)):
    room = db.query(RoomDB).filter(RoomDB.room_id == room_id).first()
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")

    history = json.loads(room.conversation_history or "[]")

    return {
        "room_id": room.room_id,
        "game_mode": room.game_mode,
        "players": [
            {
                "player_id": "p1",
                "username": "Gracz1",
                "guess_count": 0,
                "has_guessed": False,
                "guessed_at": None,
            },
        ],
        "conversation_history": history,
        "game_phase": "waiting" if room.status == "waiting" else "active",
        "winner_id": None,
        "created_at": room.created_at,
    }


@app.post("/rooms/{room_id}/question", response_model=QuestionResponse)
def ask_question(
    room_id: str,
    request: QuestionRequest,
    db: Session = Depends(get_db),
):
    room = db.query(RoomDB).filter(RoomDB.room_id == room_id).first()
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")

    history = json.loads(room.conversation_history or "[]")

    chain = LLMChain(character_name=room.secret_character)
    try:
        result = chain.get_answer(request.question, history)
    except Exception:
        logger.exception("LLM timeout / error for room %s", room_id)
        result = {"answer": "Nie wiem", "raw_response": "[timeout]"}

    history.append({"role": "player", "question": request.question})
    history.append({"role": "ai", "answer": result["answer"]})

    room.conversation_history = json.dumps(history, ensure_ascii=False)
    room.status = "active"
    db.commit()

    return {
        "answer": result["answer"],
        "raw_response": result["raw_response"],
        "updated_history": history,
    }
