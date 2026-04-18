# AI-kinator Prototype v0.1 – Implementation Tasks

**Last Updated:** 2026-04-18  
**Status:** In Development (2/7 Core Tasks Completed + 6 LLM Tasks Ready)

This document contains the complete roadmap for AI-kinator development, including completed tasks, in-progress work, and upcoming LLM integration.

## Sprint Status Overview

### ✅ Completed Tasks (2/13)
- **BE-1** (2026-04-08): Backend setup + FastAPI with health check
- **BE-2** (2026-04-12): Room creation endpoints (solo, duel, battle-royale) with SQLite

### 🔄 In Progress / Ready to Start (7 Core + 6 LLM)
- **BE-3 to BE-5**: Backend room state, model expansion, question handling
- **FE-2 to FE-5**: Frontend GameView, polling, styling
- **LLM-1 to LLM-6**: LLM configuration, prompts, chain wrapper, tests, integration
- **INT-1**: End-to-end integration testing

---

## General Development Guidelines

- **Keep it simple**: Minimal viable features, no premature optimization.
- **Backend**: FastAPI + SQLite (persistent storage), LangChain for LLM.
- **Frontend**: React functional components, polling every 3s, Axios for API calls.
- **LLM**: Only respond with "Tak" / "Nie" / "Nie wiem".
- **Testing**: Unit tests required for critical logic (LLM validation, game state transitions).
- **Focus**: Connectivity first, polish later.

---

## Task 1: Project Setup & Repository Structure

**Objective:** Create the basic folder layout and configuration files for both backend and frontend.

**Backend:**
- Create `backend/` folder.
- Add `requirements.txt` with:
  ```
  fastapi==0.115.6
  uvicorn==0.34.0
  pydantic==2.10.4
  ```
- Create `backend/main.py` with a minimal FastAPI app including a root endpoint (`/`) that returns `{"status": "ok"}` and a `/health` endpoint.
- Add CORS middleware to allow requests from `http://localhost:3000`.

**Frontend:**
- Create `frontend/` folder using `create-react-app` (or equivalent).
- Clean up default boilerplate: keep only `App.js` and `index.js`.
- Install `axios` for API calls (`npm install axios`).
- Set up a proxy in `package.json` to `http://localhost:8000` (optional, but simplifies development).

**Acceptance Criteria:**
- Running `uvicorn main:app --reload --port 8000` starts the backend without errors.
- Running `npm start` in `frontend/` launches the React dev server.
- Frontend can fetch data from backend `/health` and display it.

---

## Task 2: Backend – Basic Room Creation Endpoints (Dummy)

**Objective:** Implement three POST endpoints for creating game rooms (solo, duel, battle royale). They should return a unique room ID and a hardcoded dummy state.

**Implementation Details:**
- Use a simple in‑memory dictionary to store rooms: `rooms = {}`.
- Generate room IDs with `uuid.uuid4()`.
- Each room object should contain minimal fields:
  ```python
  {
      "room_id": str,
      "game_mode": "solo" | "duel" | "battle_royale",
      "status": "waiting",
      "players": [],
      "created_at": datetime.utcnow().isoformat()
  }
  ```
- Endpoints:
  - `POST /games/solo` → creates a solo room, returns `{ "room_id": "...", "game_mode": "solo" }`
  - `POST /games/duel` → creates a duel room, returns `{ "room_id": "...", "game_mode": "duel" }`
  - `POST /games/battle-royale` → creates a battle royale room, returns `{ "room_id": "...", "game_mode": "battle_royale" }`

**Acceptance Criteria:**
- Each POST request returns a 200 OK with a JSON body containing `room_id` and `game_mode`.
- The room is stored in the `rooms` dictionary and can be retrieved later.

---

## Task 3: Backend – Dummy Room State Endpoint

**Objective:** Provide an endpoint that returns the current state of a given room. For the prototype, return a hardcoded dummy state (ignoring actual room data except `room_id`).

**Implementation:**
- `GET /rooms/{room_id}/state`
- If `room_id` does not exist, return 404.
- For existing rooms, return a hardcoded dummy state:
  ```json
  {
    "room_id": "<actual_id>",
    "game_mode": "solo",
    "phase": "active",
    "players": [
      { "player_id": "p1", "username": "Gracz1", "guess_count": 0 }
    ],
    "conversation_history": [
      { "role": "player", "content": "Czy ta postać jest prawdziwa?" },
      { "role": "ai", "content": "Tak" }
    ],
    "winner": null
  }
  ```
- The response should always be the same dummy data, except the `room_id` field which must match the requested ID.

**Acceptance Criteria:**
- `GET /rooms/{room_id}/state` returns 200 with dummy JSON for valid IDs.
- Returns 404 for unknown IDs.

---

## Task 4: Frontend – Home Screen with Game Mode Selection

**Objective:** Build a simple home page (`Home.js`) that presents three buttons: "Solo", "Duel", "Battle Royale". Clicking a button should call the corresponding backend creation endpoint and navigate to a game room view.

**Implementation:**
- Use `axios` to POST to the backend endpoints.
- On success, store the returned `room_id` and `game_mode` in React state (or context).
- Navigate to `/game` route (use `react-router-dom` if you prefer, or simple conditional rendering).
- Display the room ID on the game screen.

**Acceptance Criteria:**
- Clicking "Solo" calls `/games/solo` and transitions to the game view.
- The game view shows the room ID and game mode.
- No errors in console.

---

## Task 5: Frontend – Game Room Skeleton with Polling

**Objective:** Create a `GameRoom.js` component that:
- Polls `GET /rooms/{room_id}/state` every 3 seconds.
- Displays the dummy conversation history.
- Shows placeholder UI for asking a question and guessing (buttons that do not actually send requests yet).

**Implementation:**
- Use `useEffect` and `setInterval` for polling.
- Store dummy state in local component state.
- Render:
  - Game mode and room ID.
  - A scrollable list of conversation history (dummy data).
  - An input field (disabled for now) with a "Zadaj pytanie" button.
  - A "Zgaduję postać" button.
- Clean up interval on unmount.

**Acceptance Criteria:**
- The component polls the backend every 3 seconds.
- The UI updates with the dummy history from the endpoint.
- Buttons are present but do not trigger any action (or trigger a `console.log`).

---

## Task 6: Frontend – Placeholder Actions (Question & Guess)

**Objective:** Add two buttons in the game room that send dummy POST requests to (not yet implemented) endpoints. For prototype, they can just log to console or show an alert.

**Implementation:**
- "Zadaj pytanie" button calls `POST /rooms/{room_id}/question` with a hardcoded body `{ "player_id": "demo", "question": "Testowe pytanie" }`. Backend does not exist yet; frontend should handle 404 gracefully (console.warn).
- "Zgaduję postać" button calls `POST /rooms/{room_id}/guess` with `{ "player_id": "demo", "guess": "Testowa postać" }`.
- Both buttons can be disabled or just show an alert "Funkcjonalność w przygotowaniu".

**Acceptance Criteria:**
- Clicking the buttons attempts to send a request (network tab visible).
- No unhandled errors break the UI.

---

## Task 7: Integration & Final Polish

**Objective:** Ensure that the entire flow works from start to finish:
- User selects game mode → backend creates room → frontend navigates to game room → polling starts → dummy data is displayed.

**Additional checks:**
- Add a "Powrót do menu" button that resets the app state and returns to home.
- Basic styling (optional, but at least make it readable).

**Acceptance Criteria:**
- The prototype can be demonstrated end-to-end.
- All buttons and navigation work without errors.
- The code is committed to the repository in a branch named `prototype-v0.1`.

---

---

## Complete Task Roadmap (13 Tasks Total)

### Phase 1: Backend Core (BE-3, BE-4, BE-5)

**BE-3: Dummy Room State Endpoint** (High Priority)
- Implement `GET /rooms/{room_id}/state`
- Return full room state (room_id, game_mode, phase, players, conversation_history, winner_id)
- Return 404 for non-existent rooms
- Dummy conversation data

**BE-4: Room Model Expansion** (High Priority)
- Add columns to RoomDB: `phase`, `secret_character`, `players_json`, `history_json`
- Create Pydantic schema `GameState`
- Helper function: `get_room_with_state(room_id)`
- Persist in SQLite

**BE-5: Question Submission Endpoint** (High Priority)
- Implement `POST /rooms/{room_id}/question`
- Request: `{"player_id": "str", "question": "str"}`
- Response: `{"answer": "Tak|Nie|Nie wiem", "updated_history": [...]}`
- Dummy logic: random answer from 3 options
- Store in room history

### Phase 2: Frontend Core (FE-3, FE-4)


**FE-3: GameView Component with Polling** (High Priority)
- Routing: `/game/:roomId`
- Poll `GET /rooms/{room_id}/state` every 3 seconds
- Display: header, conversation history, input field, buttons
- Error handling: 404, network errors
- Loading spinner during polling

**FE-4: Question & Guess Buttons** (High Priority)
- Connect "Zadaj pytanie" → `POST /rooms/{room_id}/question`
- Connect "Zgaduję postać" → `POST /rooms/{room_id}/guess`
- Handle 404 gracefully (endpoint not yet implemented)
- Disable buttons during sending
- Trigger next poll on success

### Phase 3: Integration (INT-1)

**INT-1: End-to-End Testing** (High Priority)
- Complete flow: select mode → create room → display GameView → polling → ask questions
- "Powrót do menu" button works
- No console errors
- All game modes work (Solo, Duel, Battle Royale)
- Clean network tab (proper error handling)

---

## Parallel Stream: LLM Integration (LLM-1 to LLM-6)

These tasks can be done **independently** without blocking BE/FE work. Team can work on LLM while others handle core features.

### Phase 1: LLM Setup (LLM-1, LLM-2)

**LLM-1: Configure LangChain & Environment**
- Install: `langchain`, `langchain-openai`, `python-dotenv`, `requests`
- Create `.env` file with `OPENAI_API_KEY` (in .gitignore)
- Create `./backend/ai/` directory
- Create `./backend/ai/config.py` to load environment variables
- Test connection to LLM (simple test script)

**LLM-2: System Prompts**
- Create `./backend/ai/prompts.py`
- System prompt (Polish):
  - Instruction: respond ONLY with "Tak", "Nie", or "Nie wiem"
  - ~10 example characters (e.g., Jan Kowalski, Maria Skłodowska-Curie, Albert Einstein)
  - Placeholders: `{secret_character}`, `{conversation_history}`
- Dummy mode: random response from 3 options

### Phase 2: LLM Chain & Testing (LLM-3, LLM-4)

**LLM-3: LLMChain Wrapper Class**
- Create `./backend/ai/llm_chain.py`
- Class `LLMChain`:
  - `__init__(model, system_prompt, character_name)`
  - `get_answer(question, conversation_history)` → `{"answer": "Tak|Nie|Nie wiem", "raw_response": "..."}`
- Validation: ensure response is one of 3 words
- Fallback: if LLM returns anything else → log warning + return "Nie wiem"
- Dummy mode: if no API key → random response

**LLM-4: Unit Tests**
- Create `./backend/tests/test_llm_chain.py`
- Tests:
  1. `test_valid_answer_tak()` - "Tak" response
  2. `test_valid_answer_nie()` - "Nie" response
  3. `test_valid_answer_nie_wiem()` - "Nie wiem" response
  4. `test_invalid_answer_fallback()` - Invalid → "Nie wiem"
  5. `test_dummy_mode()` - No API key → random
  6. `test_conversation_history()` - History accumulation
- Use pytest, minimum 80% coverage

### Phase 3: Integration & Production (LLM-5, LLM-6)

**LLM-5: Integrate with BE-5 Question Endpoint** (Depends on BE-5)
- Modify `POST /rooms/{room_id}/question`:
  - Replace dummy logic with `LLMChain.get_answer()`
  - Sequence:
    1. Get room from DB
    2. Get `secret_character` and history
    3. Call `LLMChain.get_answer(question, history)`
    4. Append to history
    5. Save to DB
    6. Return updated history
- Error handling: LLM timeout → 504 or fallback "Nie wiem"
- Test in Swagger UI

**LLM-6: Production Configuration**
- Create `.env.example` with template values (no secrets)
- Documentation in README:
  - How to install API key
  - How to set variables for dev/prod
  - Cost estimation (optional)
- Ensure API key is NOT logged in console/logs
- Secret management for CI/CD (optional)

---

## Task Dependencies & Recommended Sequence

### Dependency Graph
```
BE-3 ← BE-2 (already done)
BE-4 ← BE-3
BE-5 ← BE-4
FE-3 ← BE-3
FE-4 ← FE-3 + BE-5
INT-1 ← all of above

LLM-1 → LLM-2 → LLM-3 → LLM-4 (sequential)
LLM-5 ← BE-5 (integrate after BE-5)
LLM-6 (anytime)
```

### Suggested Phase Execution

**Week 1:**
- BE-3, BE-4, BE-5 (sequential)
- LLM-1, LLM-2 (parallel, independent)

**Week 1-2:**
- FE-2 (quick)
- FE-3, FE-4 (dependent on BE-3, BE-5)
- LLM-3, LLM-4 (parallel, independent)

**Week 2:**
- FE-5 (styling, can start anytime)
- LLM-5 (after BE-5 ready)
- LLM-6 (optional, anytime)
- INT-1 (after everything above)

**WIP Limit:** 2-3 tasks per person simultaneously

---

## Acceptance Criteria Summary

### All Tasks Must Have:
1. ✅ Code written and tested
2. ✅ Git commit with descriptive message
3. ✅ PR created and reviewed
4. ✅ Merged to `main` branch
5. ✅ No console errors/warnings
6. ✅ Acceptance criteria met

### Testing Requirements:
- Backend endpoints: Test in Swagger UI (`/docs`)
- Frontend: No console errors, buttons work
- LLM: Unit tests pass, coverage ≥80%
- Integration: Full flow without errors

---

## Additional Notes

- **Dummy Data:** All endpoints return hardcoded dummy responses initially (except room creation).
- **Database:** SQLite for persistence (auto-created in `akinator.db`).
- **LLM Fallback:** If API fails → return "Nie wiem" (safe default).
- **No WebSockets:** Use polling only (3-second intervals).
- **Team Coordination:** Use GitHub Projects/Trello for task assignment and tracking.
- **Documentation:** Keep README.md and copilot-instructions.md updated as work progresses.

---

## How to Access Task Details

1. **Full Kanban Details:** See `.github/copilot-instructions.md` for development guide
2. **Project Overview:** See `README.md` for quickstart and architecture
3. **Task Tracking:** All tasks tracked in GitHub Projects Kanban board

