# Copilot Development Guide – AI-kinator

**Last Updated:** 2026-04-29  
**Status:** In Development (12/21 Tasks Completed) – Room state persistence + question endpoint (BE-5 implemented) + optimized data fetching

## 📊 Current Sprint Status

**Full task details:** See `docs/AIKINATOR-PROTOTYPE.md`

---

## Quick Reference for Building, Testing, and Understanding the AI-kinator Codebase.

## Project Overview

**AI-kinator** is a web-based multiplayer guessing game using LLM-powered responses. Users ask yes/no questions to guess a secret character, competing in solo or multiplayer modes (duel, battle royale).

**Tech Stack:**
- **Frontend:** React (JavaScript)
- **Backend:** Python + FastAPI
- **AI:** LangChain + LLM integration
- **Database:** SQLite or JSON
- **Real-time:** Polling (no WebSockets)

---

## Build & Run Commands

### Setup (from root directory)

```bash
# Install dependencies (backend uses uv manager, automatically triggered)
npm install

# Run both backend and frontend in parallel
npm run dev
```

### Backend (Python + FastAPI)

```bash
# Run development server (auto-reload enabled) - from root
npm run backend

# Or directly from backend folder
cd backend && uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run production server
cd backend && uv run uvicorn main:app --host 0.0.0.0 --port 8000

# Sync dependencies with uv
cd backend && uv sync
```

**Key endpoints to test:**
- `GET /health` – Server status
- `POST /games/solo` – Create solo game
- `POST /games/duel` – Create duel room
- `POST /games/battle-royale` – Create battle royale room
- `GET /rooms/{room_id}/join` – Full room history with conversation (initial load)
- `GET /rooms/{room_id}/state` – Current game state for polling (no conversation history)
- `POST /rooms/{room_id}/question` – Submit question and get AI response

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
npm test -- GameRoom.test.js
```

### Linting & Code Quality

**Backend:**
```bash
cd backend

# Format code with Black
black .

# Run type checking with mypy
mypy .

# Run linting with flake8
flake8 .
```

**Frontend:**
```bash
cd frontend

# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

---

## High-Level Architecture

### Three-Layer Design

```
┌─────────────────────────────┐
│   Frontend (React SPA)      │  – Game UI, state polling, REST calls
├─────────────────────────────┤
│  Backend (FastAPI)          │  – Session management, game logic, room state
├─────────────────────────────┤
│  AI Layer (LangChain)       │  – LLM communication, response validation
└─────────────────────────────┘
```

### Game State Management

**Backend Structure:**
- `GameSession` – Tracks solo game: secret character, conversation history, guess count
- `GameRoom` – Tracks multiplayer game: players, shared secret, per-player guesses, ranked leaderboard
- `LLMChain` – Wrapped LLM interface ensuring responses are `Tak`, `Nie`, or `Nie wiem`
- `RoomDB` – Persistent room state columns for `phase`, `secret_character`, `players_json`, and `history_json`

**Frontend Structure:**
- `GameContext` – Global game state (current room, player info, game phase)
- Polling interval: **2–3 seconds** (`GET /rooms/{room_id}/state`)
- Local state: UI state, user input, client-side validation

### Communication Flow

1. **Solo Mode:**
   - Player submits question → `POST /games/{session_id}/question`
   - Backend appends to history, calls LLM, returns answer
   - Frontend displays answer, player can guess or ask again

2. **Multiplayer (Duel/Battle Royale):**
   - Player joins/creates room → `POST /games/duel` or `POST /games/battle-royale`
   - Backend generates secret character, initializes room state
   - Players poll for state updates → `GET /rooms/{room_id}/state`
   - Questions/guesses submitted → `POST /rooms/{room_id}/question` or `POST /rooms/{room_id}/guess`
   - First correct guess ends game; backend timestamps guesses to ensure fairness

---

## Key Conventions & Patterns

### LLM Response Handling

**System Prompt Pattern:**
```
Your task is to answer ONLY with one of these three Polish phrases:
- "Tak" (Yes)
- "Nie" (No)
- "Nie wiem" (I don't know)

The secret character is: [CHARACTER_NAME]
Conversation history: [PREVIOUS_EXCHANGES]

User's question: [QUESTION]
Your answer:
```

**Output Validation:**
- Use LangChain output parsers to enforce the three-answer constraint
- If LLM returns anything else, fall back to `"Nie wiem"` and log the incident
- Never accept partial matches; trim whitespace and compare exact strings

### Game Room State Schema

**Minimal fields for room consistency:**
```python
{
    "room_id": str,
    "game_mode": "duel" | "battle_royale" | "solo",
    "players": [
        {
            "player_id": str,
            "username": str,
            "guess_count": int,
            "has_guessed": bool,
            "guessed_at": timestamp  # For ranking
        }
    ],
    "conversation_history": [
        {"role": "player", "question": str},
        {"role": "ai", "answer": str}
    ],
    "game_phase": "waiting" | "active" | "ended",
    "winner_id": str | null,
    "created_at": timestamp
}
```

### Polling & State Updates

- **Initial load:** `GET /rooms/{room_id}/join` fetches full room state + conversation history (called once on component mount)
- **Polling endpoint:** `GET /rooms/{room_id}/state` polls every 3 seconds for game state updates (no conversation history)
- **Question submission:** `POST /rooms/{room_id}/question` submits question and immediately returns AI answer
- **Conversation updates:** Frontend maintains separate `conversationHistory` state, only updated by question submissions and initial load
- **Security contract:** state response must omit `secret_character`; returned fields are `room_id`, `game_mode`, `players`, `game_phase`, `winner_id`, `created_at`
- **Current implementation:** `GET /rooms/{room_id}/state` returns the persisted room state without `conversation_history`, while `GET /rooms/{room_id}/join` includes the full conversation history from `RoomDB`
- **Timeout:** Game rooms expire after 30 minutes of inactivity

### API Request/Response Format

**Request Example (submit question):**
```json
POST /rooms/{room_id}/question
{
    "player_id": "player_1",
    "question": "Czy ta osoba jest znana z polityki?"
}
```

**Response Example:**
```json
{
    "question_id": "q_abc123",
    "answer": "Tak"
}
```

**Frontend behavior:**
- On question submission, add both question and answer to `conversationHistory` immediately
- Polling updates `roomState` (game phase, players, etc.) but never touches conversation history

### Error Handling

- **Invalid character name on guess:** Return `{ "error": "invalid_guess", "message": "..." }`
- **LLM timeout:** Retry up to 2 times; if still fails, respond `Nie wiem`
- **Room not found:** Return 404 with clear message
- **Concurrent guesses in multiplayer:** Accept all submissions, rank by server timestamp

---

## Project Structure (Expected)

```
ai-kinator/
├── backend/
│   ├── main.py                 # FastAPI app entry
│   ├── requirements.txt        # Python dependencies
│   ├── models/
│   │   ├── game.py            # GameSession, GameRoom classes
│   │   └── player.py          # Player model
│   ├── routes/
│   │   ├── games.py           # Solo game endpoints
│   │   ├── rooms.py           # Multiplayer room endpoints
│   │   └── health.py          # Health check
│   ├── ai/
│   │   ├── llm_chain.py       # LangChain wrapper
│   │   └── prompts.py         # System prompts
│   ├── db/
│   │   └── store.py           # SQLite/JSON persistence
│   └── tests/
│       ├── test_game.py
│       └── test_llm_chain.py
├── frontend/
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js                  # Main component
│   │   ├── App.css
│   │   ├── index.js
│   │   ├── index.css
│   │   ├── pages/
│   │   │   └── GameView/           # Game room interface
│   │   │       ├── GameView.js     # Room state polling, chat, input
│   │   │       └── GameView.css    # Responsive game UI
│   │   ├── components/             # (Planned)
│   │   │   ├── GameRoom.js
│   │   │   ├── QuestionInput.js
│   │   │   └── Leaderboard.js
│   │   ├── hooks/                  # (Planned)
│   │   │   ├── useGameState.js     # Polling logic
│   │   │   └── useGameSession.js
│   │   ├── context/                # (Planned)
│   │   │   └── GameContext.js
│   │   ├── api/                    # (Planned)
│   │   │   └── client.js           # REST client
│   │   └── tests/                  # (Planned)
│   │       └── GameRoom.test.js
│   └── .eslintrc.json
├── .github/
│   ├── copilot-instructions.md      # (This file)
│   └── workflows/                   # CI/CD pipelines (if added)
└── README.md
```

---

## Testing Strategy

### Backend Unit Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_llm_chain.py

# Run with coverage
pytest --cov=. tests/

# Run specific test
pytest tests/test_llm_chain.py::test_parse_valid_answer -v
```

**Test priorities:**
1. LLM chain output validation (must only produce 3 allowed answers)
2. Game state transitions (solo → guess → win/loss)
3. Multiplayer race conditions (timestamp ordering, fair winner detection)
4. Room expiration and cleanup

### Frontend Component Tests

```bash
# Run all tests
npm test

# Watch mode for active development
npm test -- --watch

# Run specific component
npm test -- GameRoom
```

**Test priorities:**
1. Polling hook fetches state every 2–3 seconds
2. User input validation (no empty questions)
3. Game phase transitions (waiting → active → ended)

---

## Environment Variables

**Backend (.env or env vars):**
```
OPENAI_API_KEY=sk_...           # or other LLM provider key
DATABASE_URL=sqlite:///game.db  # or file path
POLLING_INTERVAL=3              # Suggested default (seconds)
ROOM_TIMEOUT=1800              # Room expiration (seconds)
```

**Frontend (.env):**
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_POLLING_INTERVAL=3000  # milliseconds
```

---

## Implementation Status & Notes

### ✅ GameView Component (Complete)

**Location:** `frontend/src/pages/GameView/`

**Features Implemented:**
- **Dual Data Fetching Strategy:**
  - Initial load: `GET /rooms/{room_id}/join` (full state + conversation history)
  - Polling: `GET /rooms/{room_id}/state` every 3 seconds (game status only)
- **Separate State Management:**
  - `roomState` – Players, game phase, winner (updated by polling)
  - `conversationHistory` – Chat messages (updated only by question submissions)
- **Layout:** 30% left (akinator image placeholder), 70% right (scrollable chat)
- **Chat Display:** Messages from `conversationHistory` with player/AI distinction
- **User Input:** Text input with validation, send button, auto-disables when empty
- **Auto-scroll:** Smoothly scrolls to latest messages when conversation updates
- **Error Handling:** Displays user-friendly error messages and loading states
- **Responsive:** Adapts to mobile/tablet (stacks vertically on smaller screens)

**Key Dependencies:**
- `react-router-dom` (for `useParams`, `useNavigate`)
- React Hooks: `useState`, `useEffect`, `useRef`, `useCallback`

**State Flow:**
1. Component mount → Fetch history from `/join` → Set `roomState` + `conversationHistory`
2. Polling starts → Every 3 seconds fetch `/state` → Update `roomState` only
3. User submits question → POST to `/question` → Add Q&A to `conversationHistory`

**To Use:**
```javascript
// Add route to App.js
<Route path="/room/:roomId" element={<GameView />} />

// Navigate to game
navigate(`/room/${roomId}`);

### Recent backend updates

- **BE-5 implemented (2026-04-29):** `POST /rooms/{room_id}/question` now exists in the backend. Current behaviour: returns a dummy answer (`Tak|Nie|Nie wiem`), persists question+answer to `history_json`, and includes validation (empty question -> 400, player not in room -> 404). Tests added: `backend/tests/test_question_endpoint.py`.

```

---

## Git Workflow & Branching

### Branch Naming Convention

Follow the ticket ID format for branch names:

**Format:** `{TICKET_ID}-{description}`

**Examples:**
- Ticket: `FE-3: Szkielet programu` → Branch: `FE-3-skeleton-setup`
- Ticket: `BE-5: API endpoints` → Branch: `BE-5-api-endpoints`
- Ticket: `AI-2: LLM integration` → Branch: `AI-2-llm-integration`

**Guidelines:**
- Use kebab-case (hyphens, no spaces)
- Start with ticket ID (e.g., `FE-3`, `BE-5`)
- Follow with short descriptive slug (2-4 words)
- Use English lowercase
- No special characters except hyphens
- Keep it under 50 characters total when possible

**Workflow:**
1. Create local branch: `git checkout -b FE-3-feature-name`
2. Commit with ticket reference: `FE-3 Added feature X`
3. Push branch: `git push origin FE-3-feature-name`
4. Create pull request with ticket link in description

---

## Common Development Tasks

### Adding a New Endpoint

1. Create route function in `backend/routes/`
2. Add request/response Pydantic models in `backend/models/`
3. Update game state in backend as needed
4. Add corresponding fetch call in frontend `api/client.js`
5. Create component or hook to consume the endpoint

### Adding a New Game Mode

1. Define new game phase logic in `backend/models/game.py`
2. Add state machine transitions
3. Create new React component or extend existing `GameRoom.js`
4. Update polling logic to handle new phase

### Debugging LLM Chain Issues

- Check `backend/ai/prompts.py` for correct system prompt format
- Test LLM response directly: `python -m pytest tests/test_llm_chain.py -v`
- Log all LLM inputs/outputs to `debug.log` for analysis
- Use fallback answer `"Nie wiem"` if LLM behaves unexpectedly

### Implementing LLM Integration (Next)

The `/rooms/{room_id}/question` endpoint has been created with mock implementation. To integrate LangChain:

1. Create `backend/ai/llm_chain.py` with LangChain wrapper
2. Create `backend/ai/prompts.py` with system prompts
3. Update `POST /rooms/{room_id}/question` to:
   - Fetch room's secret character from database
   - Fetch conversation history from database
   - Call LLM with system prompt + context
   - Validate response (must be "Tak", "Nie", or "Nie wiem")
   - Save Q&A to database
   - Return response to frontend

---

## Performance & Scaling Notes

- **Polling overhead:** At 100 concurrent players with 3-second polling = ~33 requests/sec. Monitor backend response time.
- **Character pool:** All 1000 characters in system prompt should fit in token limits; if not, switch to retrieval-based approach.
- **Concurrent games:** SQLite may bottleneck; migrate to PostgreSQL if scaling beyond 50+ concurrent games.
- **LLM cost:** Batch API calls or use smaller models for cost optimization.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend fails to start | Check Python version (3.9+), install all deps from `requirements.txt` |
| LLM returns invalid answer | Verify API key, check system prompt in `backend/ai/prompts.py` |
| Frontend can't reach backend | Ensure backend is running on `localhost:8000`; check `REACT_APP_API_URL` |
| Tests fail with database errors | Clear `game.db`, ensure write permissions in backend directory |
| Polling shows stale state | Verify `REACT_APP_POLLING_INTERVAL` is set correctly (default 3000ms) |

---

## Quick Links

- **Project Spec:** `copilot-instructions.md` (project requirements & team roles)

*Last updated: 2026-04-25. Update this file as project structure and conventions evolve.*
