# Copilot Instructions – AI-kinator Project

## 📦 Project Setup & Dependencies

**UV Package Manager** is used for Python dependency management in this project.

- **Installation:** `pip3 install uv`
- **Verification:** `uv --version`
- **Usage in project:** UV is automatically invoked during `npm install` via the `prepare` script

### Automatic Setup Flow

```bash
npm install
# → Triggers: cd backend && uv sync
# → Creates Python virtual environment at backend/.venv
# → Installs 22+ Python packages (FastAPI, SQLAlchemy, LangChain, etc.)
# → Frontend dependencies installed with npm
```

---

## 🚀 Build & Run Commands

### Setup (from root directory)

```bash
# Install dependencies (backend uses uv manager, automatically triggered)
npm install

# Run both backend and frontend in parallel
npm run dev
```

### Backend (Python + FastAPI + UV)

```bash
# Run development server (auto-reload enabled) - from root
npm run backend

# Or directly from backend folder
cd backend && uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run production server
cd backend && uv run uvicorn main:app --host 0.0.0.0 --port 8000

# Sync dependencies with uv (if needed)
cd backend && uv sync
```

### Frontend (React)

```bash
# Run development server - from root
npm run frontend

# Or directly from frontend folder
cd frontend && npm start

# Build for production
npm run build

# Run tests
npm test

# Run specific test file
npm test -- GameView
```

### Linting & Code Quality

**Backend:**
```bash
cd backend

# Format code with Black (if installed)
black .

# Run type checking with mypy (if installed)
mypy .

# Run linting with flake8 (if installed)
flake8 .
```

**Frontend:**
```bash
cd frontend

# Run ESLint
npm run lint

# Format code with Prettier (if installed)
npm run format
```

**Key endpoints to test:**
- `GET /` → `{"status": "ok"}`
- `GET /health` → `{"status": "healthy"}`
- `POST /games/solo` – Create solo game
- `POST /games/duel` – Create duel room
- `POST /games/battle-royale` – Create battle royale room

---

## Project Identity & Core Goals

**AI-kinator** is a web-based multiplayer game inspired by Akinator. The player asks questions to guess a secret character selected by the system from a predefined pool of ~1000 popular figures (e.g., from Wikipedia). The system responds exclusively with:

- **Tak** (Yes)
- **Nie** (No)
- **Nie wiem** (Don't know)

The game uses a Large Language Model (LLM) to generate responses dynamically, providing flexibility and a more natural interaction compared to rule‑based engines.

**Primary objective:** Deliver a fully functional web application supporting single‑player and real‑time multiplayer modes (duel, battle royale). Multiplayer functionality is the key distinguishing feature; user accounts and statistics are secondary enhancements.

**Team:** Hajsownicy Gimpera (6 members).  
**Development methodology:** Agile with Kanban board on GitHub, tracked working hours in a repository table.

---

## Technology Stack (Fixed)

| Layer          | Technology                   |
|----------------|------------------------------|
| **Frontend**   | React (JavaScript)           |
| **Backend**    | Python + FastAPI             |
| **Package Mgr**| UV (Python dependency mgr)   |
| **AI Module**  | LLM integrated via LangChain |
| **Database**   | SQLite / JSON / lightweight  |
| **Real‑time**  | Polling (no WebSockets)      |
| **API Style**  | REST                        |

---

## Architecture Overview

The system is split into three logical layers:

1. **Presentation Layer (Frontend)**  
   - React SPA handling UI, game state polling, and REST calls.

2. **Business Logic Layer (Backend)**  
   - FastAPI application managing game sessions, rooms, player turns, and LLM communication.
   - Maintains game state: secret character, conversation history, player scores.

3. **AI Layer**  
   - LangChain wrapper around an LLM.
   - Receives conversation context (system prompt with character definition + history) and returns one of the three allowed answers.

### Communication Patterns

- **REST API** – used for synchronous operations: create game, join room, submit question/guess, fetch initial state.
- **Polling** – clients periodically (`GET /room/{room_id}/state`) to receive updates in multiplayer modes. WebSockets are explicitly **not** required.

---

## Functional Specification (as Defined)

### Game Modes

1. **Solo**  
   - One player vs. AI.  
   - Immediate feedback; no waiting for other players.

2. **Duel**  
   - Two players compete against the same secret character.  
   - Each player asks questions independently; the first to guess correctly wins.

3. **Battle Royale**  
   - Multiple players (≥3) compete simultaneously.  
   - Speed matters – the first correct guess ends the game.

### Core Game Loop

- System randomly selects a character from the fixed pool (provided in system prompt).
- Player sends a question via REST endpoint.
- Backend appends question to conversation history and requests answer from LLM.
- LLM responds with **Tak / Nie / Nie wiem**.
- Backend stores updated history and broadcasts state change (via polling).
- Game ends when a player submits a correct character name.

### Additional Features (Secondary Priority)

- Basic user authentication (login).
- Player ranking per multiplayer session.
- Simple user statistics (games played, wins, etc.).

---

## Implementation Roadmap (High‑Level)

| Phase | Focus                                      |
|-------|--------------------------------------------|
| 1     | **MVP Solo Mode** – core gameplay with LLM |
| 2     | **Multiplayer Modes** – rooms, polling, turn management, ranking |
| 3     | **User System & Statistics** – login, basic stats |
| 4     | **Testing & Polish** – bug fixes, documentation |

**Note:** Multiplayer is the priority after the solo core is stable. User accounts are an add‑on and may be simplified.

---

## Key Design Decisions & Constraints

- **Polling over WebSockets** – Simpler to implement and sufficient for expected player count. Polling interval should be configurable (e.g., 2–3 seconds).
- **Character Pool Management** – All 1000 characters are embedded in the LLM system prompt; no external database for characters is strictly necessary, though a lightweight JSON/SQLite store may be used for easy maintenance.
- **LLM Response Restriction** – The system prompt must strictly enforce the three‑answer limitation. LangChain output parsers should be used to validate responses.
- **State Isolation** – Each game room maintains its own conversation history and secret character.

---

## Team Roles & Responsibilities

| Subteam                | Members                                             |
|------------------------|-----------------------------------------------------|
| **Frontend + DevOps**  | Wojciech Ochman (Lead/PO), Paweł Głowacki, Stanisław Madziara |
| **Backend + AI**       | Dominik Godek, Filip Matracki, Mariusz Wątroba      |

All team members collaborate via **GitHub Organization**, using a **Kanban board** for task tracking and a dedicated table in the repository for time logging.

---

## Working with GitHub CLI & Repository

- **Repository:** Part of a GitHub Organization (name to be provided).
- **Branching:** Feature branches off `main` (or `develop`). Use pull requests for code review.
- **Issue Tracking:** Use GitHub Issues linked to the Kanban board.
- **CI/CD:** Not specified – can be added later if needed.

### Recommended Copilot Prompts for This Project

- `Create a FastAPI endpoint for creating a new solo game session.`
- `Write a React hook that polls the backend every 3 seconds and updates game state.`
- `Implement a LangChain chain that takes conversation history and returns only 'Tak', 'Nie', or 'Nie wiem'.`
- `Design the SQLite schema for game rooms and players in multiplayer mode.`

---

## Potential Pitfalls & Mitigations

| Risk                                      | Mitigation                                                      |
|-------------------------------------------|-----------------------------------------------------------------|
| LLM may answer outside the allowed set    | Use strict output parser + fallback to "Nie wiem" if invalid.   |
| Polling overhead at scale                 | Keep polling interval reasonable; add cache headers.            |
| Race conditions in battle royale guessing | Timestamp each guess server‑side; first valid guess wins.       |
| Character pool not diverse enough         | Pre‑curate list from Wikipedia categories; allow easy updates.  |

---

## Document Change Log

| Date       | Author            | Description                        |
|------------|-------------------|------------------------------------|
| 2026‑03‑xx | Hajsownicy Gimpera| Initial version based on project spec |

*This instruction file is authoritative for the AI‑kinator project. All contributions must align with the specifications outlined above.*