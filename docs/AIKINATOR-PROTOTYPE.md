# AI-kinator Prototype v0.1 – Implementation Tasks

**Last Updated:** 2026-04-29  
**Status:** In Development (12/21 Tasks Completed)

### ✅ Completed Tasks (12/21)
- **BE-1** (2026-04-08): Backend setup + FastAPI with health check
- **BE-2** (2026-04-12): Room creation endpoints (solo, duel, battle-royale)
- **BE-3** (2026-04-18): `GET /rooms/{room_id}/state` returns dummy room state
- **BE-4** (2026-04-29): RoomDB expanded with persisted phase/player/history state and migrated room-state endpoints
- **BE-5** (2026-04-29): `POST /rooms/{room_id}/question` implemented (dummy LLM, persists history, tests added)
- **FE-1** (2026-04-13): Frontend initialization + React
- **FE-2** (2026-04-15): Home screen with game mode selection
- **DEVOPS-1** (2026-04-19): GitHub Actions CI workflow with backend/frontend tests
- **Spotkanie 1** (2026-04-08): Architecture discussion + roles
- **Project Spec** (2026-04-12): Complete specification
- **TRIVIAL** (2026-04-10): Setup command fixes

### 🔄 In Progress (2/21)
- **FE-3**: GameRoom component with 3-second polling of room state
- **LLM-1**: LangChain configuration + OpenAI API environment variables

### ⏳ Backlog (7/21)
- **FE-4**: Question input & guess submission buttons
- **LLM-2**: System prompts for AI-kinator (Polish, three-answer constraint)
- **LLM-3**: LLMChain wrapper class with output validation
- **LLM-4**: Integration of LLM-3 with BE-5 question endpoint
- **INT-1**: End-to-end integration testing & flow verification
- **FE-BUGS**: Fix ESLint no-unused-vars warnings

---

## General Development Guidelines

- **Keep it simple**: Minimal viable features, no premature optimization.
- **Backend**: FastAPI + SQLite (persistent storage), LangChain for LLM.
- **Frontend**: React functional components, polling every 3s, Axios for API calls.
- **LLM**: Only respond with "Tak" / "Nie" / "Nie wiem".
- **Testing**: Unit tests required for critical logic (LLM validation, game state transitions).
- **Focus**: Connectivity first, polish later.

---

## Active & Backlog Tasks

### 🔄 IN PROGRESS

**BE-4: Expand Room model with game phase & player state**
- Done: added columns to RoomDB: `phase`, `secret_character`, `players_json`, `history_json`
- Done: created Pydantic schema `GameState`
- Done: created helper function `get_room_with_state(room_id)`
- Done: added SQLite migration for older room rows
- Done: `GET /rooms/{room_id}/state` and `GET /rooms/{room_id}/join` use the persisted room state format

**FE-3: GameRoom component with polling**
- Routing: `/game/:roomId`
- Poll `GET /rooms/{room_id}/state` every 3 seconds
- Display: header, conversation history, input field, buttons
- Error handling: 404, network errors
- Loading spinner during polling

**LLM-1: LangChain configuration + environment setup**
- Install: `langchain`, `langchain-openai`, `python-dotenv`
- Create `.env` file with `OPENAI_API_KEY` (in .gitignore)
- Create `./backend/ai/` directory with config setup
- Test connection to LLM

---

### ⏳ BACKLOG

**BE-5: Question submission endpoint**
- Implement `POST /rooms/{room_id}/question`
- Request: `{"player_id": "str", "question": "str"}`
- Response: `{"answer": "Tak|Nie|Nie wiem", "updated_history": [...]}`
- Dummy logic: random answer from 3 options
- Store in room history

Note: BE-5 has been implemented (dummy LLM). The endpoint now:
- validates non-empty questions (400)
- ensures `player_id` belongs to the room (404)
- appends both player question and AI answer to `history_json` and persists it
- returns `updated_history` in the response

Next steps for BE-5 -> LLM integration: replace dummy answer with `LLMChain.get_answer()` (LLM-4).

Note: BE-5 has been implemented (dummy LLM). The endpoint now:
- validates non-empty questions (400)
- ensures `player_id` belongs to the room (404)
- appends both player question and AI answer to `history_json` and persists it
- returns `updated_history` in the response

Next steps for BE-5 -> LLM integration: replace dummy answer with `LLMChain.get_answer()` (LLM-4).

**FE-4: Question input & guess submission buttons**
- Connect "Zadaj pytanie" → `POST /rooms/{room_id}/question`
- Connect "Zgaduję postać" → `POST /rooms/{room_id}/guess`
- Handle 404 gracefully (endpoint may not be implemented)
- Disable buttons during sending
- Trigger next poll on success

**LLM-2: System prompts for AI-kinator**
- Create `./backend/ai/prompts.py`
- System prompt (Polish):
  - Instruction: respond ONLY with "Tak", "Nie", or "Nie wiem"
  - ~10 example characters
  - Placeholders: `{secret_character}`, `{conversation_history}`
- Dummy mode: random response from 3 options

**LLM-3: LLMChain wrapper class**
- Create `./backend/ai/llm_chain.py`
- Class `LLMChain` with `get_answer(question, conversation_history)` method
- Validation: ensure response is one of 3 words
- Fallback: if LLM returns anything else → log warning + return "Nie wiem"
- Dummy mode: if no API key → random response

**LLM-4: LLM integration with BE-5 question endpoint**
- Modify `POST /rooms/{room_id}/question`:
  - Replace dummy logic with `LLMChain.get_answer()`
  - Get room, character, and history from DB
  - Call LLMChain, append to history, save
  - Return updated history
- Error handling: LLM timeout → return "Nie wiem"
- Test in Swagger UI

**INT-1: End-to-end integration testing & flow**
- Complete flow: select mode → create room → display GameRoom → polling → ask questions
- "Powrót do menu" button works
- No console errors
- All game modes work (Solo, Duel, Battle Royale)
- Clean network tab (proper error handling)

**FE-BUGS: Fix ESLint no-unused-vars warnings**
- Remove unused imports and variables from all components

---

## Dependencies & Key Notes

- **BE-4** requires BE-3 completion ✅
- **BE-5** requires BE-4 completion (in progress)
- **FE-3** requires BE-3 completion ✅
- **FE-4** requires FE-3 + BE-5 (can start after both ready)
- **LLM-2** requires LLM-1 completion (in progress)
- **LLM-3** requires LLM-2 completion
- **LLM-4** requires LLM-3 completion
- **INT-1** requires all above complete

**LLM tasks are independent** and can be worked on in parallel with BE/FE tasks.

---

## General Notes

- **Dummy Data:** All endpoints return hardcoded dummy responses initially (except room creation).
- **Database:** SQLite for persistence (auto-created in `akinator.db`).
- **LLM Fallback:** If API fails → return "Nie wiem" (safe default).
- **No WebSockets:** Use polling only (3-second intervals).
- **Testing:** Unit tests required for all critical logic.
- **Documentation:** Keep README.md and copilot-instructions.md updated as work progresses.

---

## How to Access Complete Reference

1. **Development Guide:** See `.github/copilot-instructions.md` for build commands and architecture
2. **Project Overview:** See `README.md` for quickstart and current sprint status
3. **Task Tracking:** All tasks listed above; full details in `.github/copilot-instructions.md`

