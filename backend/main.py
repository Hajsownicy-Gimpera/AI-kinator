from fastapi import FastAPI, Depends
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