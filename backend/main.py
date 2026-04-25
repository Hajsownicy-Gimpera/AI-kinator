from typing import Literal
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import uuid
from datetime import datetime

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
    winner_id: str | None
    created_at: datetime


class RoomHistoryResponse(RoomStateResponse):
    conversation_history: list[ConversationEntry]

class QuestionRequest(BaseModel):
    player_id: str
    question: str


class QuestionResponse(BaseModel):
    question_id: str
    answer: Literal["Tak", "Nie", "Nie wiem"]

# --- HELPER FUNCTIONS ---
def get_room_logic(room_id: str, db: Session):
    room = db.query(RoomDB).filter(RoomDB.room_id == room_id).first()
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


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
        status="waiting"
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
def get_room_state_polling(room_id: str, db: Session = Depends(get_db)):
    """Get current game state for polling (no conversation history)."""
    room = get_room_logic(room_id, db)

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
        "game_phase": "waiting" if room.status == "waiting" else "active",
        "winner_id": None,
        "created_at": room.created_at,
    }

@app.get("/rooms/{room_id}/join", response_model=RoomHistoryResponse)
def get_room_history(room_id: str, db: Session = Depends(get_db)):
    """Get full room history including all conversation (initial load only)."""
    room = get_room_logic(room_id, db)

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
        "conversation_history": [
            {
                "role": "player",
                "question": "Czy ta postac jest prawdziwa?",
            },
            {
                "role": "ai",
                "answer": "Tak",
            },
        ],
        "game_phase": "waiting" if room.status == "waiting" else "active",
        "winner_id": None,
        "created_at": room.created_at,
    }



@app.post("/rooms/{room_id}/question", response_model=QuestionResponse)
def submit_question(room_id: str, request: QuestionRequest, db: Session = Depends(get_db)):
    """Submit a question and get AI response (Tak/Nie/Nie wiem)."""
    room = db.query(RoomDB).filter(RoomDB.room_id == room_id).first()
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")

    # TODO: Integrate LangChain for LLM response
    # Example implementation:
    # 1. Fetch room's secret_character from database
    # 2. Get conversation history from database
    # 3. Call LLM with system prompt: "You are Akinator's mind. Secret character: {secret}. Conversation: {history}. Answer: {question}"
    # 4. Parse response to ensure it's only "Tak", "Nie", or "Nie wiem"
    # 5. Save question and answer to database
    # 6. Return response

    # Mock implementation for now
    mock_answers = ["Tak", "Nie", "Nie wiem"]
    import random
    answer = random.choice(mock_answers)

    return {
        "question_id": f"q_{uuid.uuid4()}",
        "answer": answer,
    }