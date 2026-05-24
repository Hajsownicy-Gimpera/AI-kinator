# Copilot Development Guide – AI-kinator

**Last Updated:** 2026-05-17
**Status:** In Development – MVP Reached

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
- `GET /rooms/{room_id}/join` – Full room state + conversation history (initial load only)
- `GET /rooms/{room_id}/state` – Current game state for polling (NO conversation history)
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
- `RoomDB` – Persistent room state for both solo and multiplayer: `room_id`, `game_mode`, `phase`, `secret_character`, `players_json`, `history_json`, `winner_id`, `created_at`, `invite_code`, `max_players`
- `LLMChain` – Wrapped LLM interface ensuring responses are `Tak`, `Nie`, or `Nie wiem`
- Response models: `RoomState` (state without history), `GameState` (state with history), `QuestionResponse` (answer + updated_history), `GuessResponse` (result + updated_history)

**Frontend Structure:**
- Direct state management with React Hooks (`useState`, `useEffect`, `useRef`, `useCallback`)
- No global context; each component manages its own state
- Polling interval: **3 seconds** (`GET /rooms/{room_id}/state`)
- Local state: UI state, user input, client-side validation, conversation history

### Communication Flow

1. **Solo Mode:**
   - Player creates game → `POST /games/solo` returns `room_id`
   - Player gets initial state → `GET /rooms/{room_id}/join` (with conversation history)
   - Player submits question → `POST /rooms/{room_id}/question` returns AI answer
   - Player can guess → `POST /rooms/{room_id}/guess`
   - Backend appends to history, returns updated history with each action

2. **Multiplayer (Duel/Battle Royale):**
   - Player creates room → `POST /games/duel` or `POST /games/battle-royale` returns `room_id`
   - Other players join → `POST /rooms/{room_id}/join` with username (returns full state + history + player_id)
   - When room is full, phase becomes `active`
   - Players poll for state updates → `GET /rooms/{room_id}/state` every 3 seconds (returns state without history)
   - Questions/guesses submitted → `POST /rooms/{room_id}/question` or `POST /rooms/{room_id}/guess`
   - Each response includes `updated_history` with the new entries
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
    "invite_code": str,
    "max_players": int,
    "phase": "waiting" | "active" | "ended",
    "players": [
        {
            "player_id": str,
            "username": str,
            "guess_count": int,
            "hint_used": bool,
            "penalty_seconds": int,
            "has_guessed": bool,
            "guessed_at": timestamp | null
        }
    ],
    "winner_id": str | null,
    "created_at": timestamp,
    "secret_character": str | null  # Only in /join, not in /state
}
```

**Conversation Entry:**
```python
{
    "role": "player" | "ai",
    "question": str | null,
    "answer": str | null
}
```

### Polling & State Updates

- **Initial load:** `GET /rooms/{room_id}/join` fetches full room state + conversation history (called once on component mount)
- **Polling endpoint:** `GET /rooms/{room_id}/state` polls every 3 seconds for game state updates (returns room state WITHOUT `conversation_history`)
- **Question submission:** `POST /rooms/{room_id}/question` submits question and immediately returns AI answer
- **Conversation updates:** Frontend maintains separate `conversationHistory` state, only updated by question submissions and initial load
- **Security contract:** `/state` response excludes `secret_character` and `conversation_history`; returned fields include `room_id`, `game_mode`, `players`, `phase`, `winner_id`, `created_at`, `invite_code`, `max_players`
- **Current implementation:** `/state` returns room state WITHOUT conversation_history; `/join` includes conversation_history from `RoomDB`
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

**Response Example (submit question):**
```json
{
    "question_id": "q_abc123",
    "answer": "Tak",
    "updated_history": [
        {"role": "player", "question": "Czy ta osoba jest znana z polityki?"},
        {"role": "ai", "answer": "Tak"}
    ]
}
```

**Request Example (submit guess):**
```json
POST /rooms/{room_id}/guess
{
    "player_id": "player_1",
    "guess": "Albert Einstein"
}
```

**Response Example (submit guess):**
```json
{
    "correct": true,
    "winner_id": "player_1",
    "message": "Brawo! Albert Einstein to faktycznie sekretna postać.",
    "updated_history": [
        {"role": "player", "question": "[Zgaduję] Albert Einstein"},
        {"role": "ai", "answer": "Tak"}
    ]
}
```

**Frontend behavior:**
- On question/guess submission, responses include `updated_history` which contains the new Q&A entry
- Frontend should merge `updated_history` into local `conversationHistory` state
- Polling updates `roomState` (game phase, players, etc.) but never touches conversation history (to avoid duplication)
- Conversation history is loaded only once from `/join` on initial load

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
│   ├── main.py                 # FastAPI app – all endpoints, Pydantic models, DB setup
│   ├── pyproject.toml          # Python project config (uv)
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Env var template (GOOGLE_API_KEY)
│   ├── ai/
│   │   ├── __init__.py
│   │   ├── config.py           # LLM model config
│   │   ├── llm_chain.py        # LangChain wrapper, validation, dummy mode
│   │   └── prompts.py          # System prompt, EXAMPLE_CHARACTERS list
│   └── tests/
│       ├── test_full_flow.py
│       ├── test_room_state.py
│       ├── test_llm_chain.py
│       ├── test_question_endpoint.py
│       ├── test_guess_endpoint.py
│       ├── test_invite_code.py
│       └── __init__.py
├── frontend/
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js              # Main component + routing
│   │   ├── App.css
│   │   ├── index.js
│   │   ├── index.css
│   │   ├── components/
│   │   │   └── WinScreen/      # Win screen component
│   │   │       ├── WinScreen.js
│   │   │       └── WinScreen.css
│   │   └── pages/
│   │       └── GameView/       # Game room interface
│   │           ├── GameView.js # Room state polling, chat, input
│   │           └── GameView.css
├── docs/
│   └── AIKINATOR-PROTOTYPE.md  # Implementation tasks
├── .github/
│   ├── copilot-instructions.md # (This file)
│   └── workflows/
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
GOOGLE_API_KEY=your-google-api-key-here  # Google AI Studio (Gemini)
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
  - Polling: `GET /rooms/{room_id}/state` every 3 seconds (state only, no conversation history)
- **Separate State Management:**
  - `roomState` – Players, game phase, winner (updated by polling)
  - `conversationHistory` – Chat messages (loaded from `/join`, updated by question submissions only)
  - `avatarIndex` – Player avatar state (0-1: idle, 3-4: thinking/animating)
- **Avatar Animation:**
  - Idle states (0 or 1): Randomly selected when game is waiting for user input
  - Thinking states (3 or 4): Randomly selected when user submits question/guess
  - Thinking animation persists for minimum 1 second before returning to idle
  - Uses `avatarThinkingStartTimeRef` to track animation timing independently from server response time
  - Smart timing: waits for server response + ensures minimum 1 second thinking animation
- **Theme Support:**
  - Dark/light theme toggle via ThemeToggle component
  - All styled-components use theme tokens for consistency
  - Theme context provider wraps entire app (ThemeContext.js)
- **Layout:** 30% left (player avatar sprite + placeholder), 70% right (scrollable chat)
  - Uses styled-components for all styling (no separate CSS file)
  - Responsive design: stacks vertically on screens < 1024px
- **Chat Display:** Messages from `conversationHistory` with player/AI distinction
- **User Input:** Text input with validation (max 200 chars), "Pytam" and "Zgaduję" buttons, auto-disables when empty
- **Auto-scroll:** Smoothly scrolls to latest messages when conversation updates
- **Error Handling:** Displays user-friendly error messages and loading states
- **Win Screen:** Dedicated WinScreen component displays when game ends

**Key Dependencies:**
- `react-router-dom` (for `useParams`, `useNavigate`)
- `PlayerAvatar` component for sprite-based avatar rendering (indices 0-5)
- `AIAvatar` component for AI expression display
- `ThemeToggle` component for dark/light mode
- `styled-components` for all styling
- React Hooks: `useState`, `useEffect`, `useRef`, `useCallback`

**Avatar Spritesheet (Avatars_background_free.png):**
- 3 columns × 2 rows = 6 sprites
- 0: Idle (arms crossed)
- 1: Idle (hands together)
- 2: Happy (thumbs up)
- 3: Thinking (chin)
- 4: Thinking (laughing)
- 5: Thinking (hands spread)
- Background positioning: 0% 0%, 48% 0%, 96% 0% (row 1) and 0% 103%, 42% 103%, 96% 103% (row 2)

**State Flow:**
1. Component mount → Fetch history from `/join` → Set `roomState` + `conversationHistory` → Avatar to idle (0 or 1)
2. Polling starts → Every 3 seconds fetch `/state` → Update `roomState` only
3. User submits question/guess:
   - POST to `/question` → Add Q&A to `conversationHistory` locally
   - Avatar immediately changes to thinking (3 or 4)
   - Record submission time in `avatarThinkingStartTimeRef`
4. Server responds:
   - Calculate elapsed time since submission
   - If < 1 second: wait remaining time, then return to idle
   - If >= 1 second: immediately return to idle
5. Avatar returns to random idle state (0 or 1)

**To Use:**
```javascript
// Add route to App.js with theme provider
import { ThemeProvider } from '../../context/ThemeContext';

<ThemeProvider>
  <Route path="/room/:roomId" element={<GameView />} />
</ThemeProvider>

// Navigate to game
navigate(`/game/${roomId}`);
```

### Recent backend updates

- **BE-5 implemented (2026-04-29):** `POST /rooms/{room_id}/question` now exists in the backend. Current behaviour: returns a dummy answer (`Tak|Nie|Nie wiem`), persists question+answer to `history_json`, and includes validation (empty question -> 400, player not in room -> 404). Tests added: `backend/tests/test_question_endpoint.py`.
- **BE-6 implemented (2026-05-17):** Room creation now exposes `invite_code` and `max_players` (`solo` = 1, `duel` = 2, `battle_royale` = 10). `POST /rooms/{room_id}/join` accepts `username` and returns `player_id`, full room state, and history. `GET /rooms/{room_id}/state` returns room state with players but no conversation history, while `guess`/`question`/`join` reject actions after `phase=ended`. Tests updated in `backend/tests/test_room_state.py` and `backend/tests/test_guess_endpoint.py`.
- **BE-7 implemented (2026-05-17):** `GET /rooms/{room_id}/state` polling endpoint now returns `RoomState` (no conversation_history). Conversation history is loaded only from `/join` endpoint on initial load. Frontend polling updates room state separately from conversation history. Tests updated: `backend/tests/test_room_state.py`.


### Recent frontend updates

- **FE-6 implemented (2026-05-18):** Major UI overhaul with styled-components. Introduced ThemeContext for dark/light theme, added AIAvatar component, completely refactored GameView with styled-components replacing CSS file. Added PlayerAvatar component and avatar asset files (Avatars.jpg, Avatars2.png). Implemented theme toggle functionality.
- **FE-7 implemented (2026-05-18):** Smart avatar animation system. Added high-quality avatar spritesheet (Avatars_background_free.png) with 6 sprite frames (0-5). Implemented `avatarThinkingStartTimeRef` for intelligent animation timing that ensures minimum 1 second thinking animation regardless of server response time. Avatar changes immediately to thinking state (3-4) on submit, waits for response, then returns to idle state (0-1) after ensuring 1-second minimum display.
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

*Last updated: 2026-05-17. Update this file as project structure and conventions evolve.*
