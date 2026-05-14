# AI-kinator Prototype v0.1 – Implementation Tasks

**Last Updated:** 2026-05-10  
**Status:** MVP Reached, Still InDev

### ✅ Completed Tasks 
- **BE-1** (2026-04-08): Backend setup + FastAPI with health check
- **BE-2** (2026-04-12): Room creation endpoints (solo, duel, battle-royale)
- **BE-3** (2026-04-18): `GET /rooms/{room_id}/state` returns dummy room state
- **BE-4** (2026-04-29): RoomDB expanded with persisted phase/player/history state
- **BE-5** (2026-04-29): `POST /rooms/{room_id}/question` implemented with LLMChain
- **FE-1** (2026-04-13): Frontend initialization + React
- **FE-2** (2026-04-15): Home screen with game mode selection
- **FE-3**: GameView component with polling
- **LLM-5**: Implement /guess endpoint with character validation
- **FE-5**: Win screen + guess handler response logic
- **DEVOPS-1** (2026-04-19): GitHub Actions CI workflow with backend/frontend tests
- **Spotkanie 1** (2026-04-08): Architecture discussion + roles
- **Project Spec** (2026-04-12): Complete specification
- **TRIVIAL** (2026-04-10): Setup command fixes


---

## General Development Guidelines

- **Keep it simple**: Minimal viable features, no premature optimization.
- **Backend**: FastAPI + SQLite (persistent storage), LangChain for LLM.
- **Frontend**: React functional components, polling every 3s for game state updates.
- **LLM**: Only respond with "Tak" / "Nie" / "Nie wiem".
- **Testing**: Unit tests required for all critical logic.
- **Focus**: Core game flow first, polish later.

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

