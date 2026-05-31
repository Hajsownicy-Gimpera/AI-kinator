# AI-kinator Prototype v0.1 – Implementation Tasks

**Last Updated:** 2026-05-10  
**Status:** MVP Reached, Still InDev

### ✅ Completed Tasks 
- **BE-1** (2026-04-08): Backend setup + FastAPI with health check
- **BE-2** (2026-04-12): Room creation endpoints (solo, duel, battle-royale)
- **BE-3** (2026-04-18): `GET /rooms/{room_id}/state` returns dummy room state
- **BE-4** (2026-04-29): RoomDB expanded with persisted phase/player/history state
- **BE-5** (2026-04-29): `POST /rooms/{room_id}/question` implemented with LLMChain
- **LLM-5**: Implement /guess endpoint with character validation
- **FE-1** (2026-04-13): Frontend initialization + React
- **FE-2** (2026-04-15): Home screen with game mode selection
- **FE-3**: GameView component with polling
- **FE-5**: Win screen + guess handler response logic
- **FE-6** (2026-05-18): UI overhaul with styled-components, dark/light theme, ThemeContext, GameView redesign
- **FE-7** (2026-05-18): Avatar animation system with smart timing, spritesheet-based rendering
- **FE-8** (2026-05-31): Obsługa trybów duel/battle royale w UI
- **INT‑2** (2026-05-31): Integracja multiplayer + UI
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

# AI-kinator Sprint 2 – Multiplayer & UI Overhaul

Nowe zadania według aneksu do specyfikacji. Skupiamy się na trybach wieloosobowych (duel, battle royale) oraz całkowitej przebudowie interfejsu użytkownika. Dodatkowo wprowadzamy system podpowiedzi i pokoje tematyczne jako funkcje opcjonalne, ale wymagane w finalnym produkcie.

## Priorytety sprintu
1. Tryby wieloosobowe (duel, battle royale) z synchronizacją przez polling.
2. Nowy, minimalistyczny interfejs użytkownika (UI overhaul).
3. System podpowiedzi (Hint) zintegrowany z LLM i karami w multiplayer.
4. Pokoje tematyczne z dynamicznym system promptem.

## Uwagi do generowania kodu
- Backend: rozbudowa modelu GameRoom o obsługę wielu graczy, tur, odgadnięć, kar.
- Frontend: przebudowa komponentów zgodnie z wytycznymi UI (zaokrąglone rogi, wyśrodkowanie, awatar AI, spójność wizualna). Użyj React, axios, stan przez Context API.
- Komunikacja: polling co 3 sekundy (GET /rooms/{room_id}/state). W trybach multiplayer endpoint zwraca stan wszystkich graczy.
- Podpowiedzi: nowy endpoint POST /rooms/{room_id}/hint, który wymusza odpowiedź LLM (cecha postaci) i zapisuje użycie podpowiedzi dla gracza.
- Pokoje tematyczne: endpoint POST /games/{mode} przyjmuje dodatkowy parametr `category`. Backend przechowuje kategorię i używa jej do modyfikacji promptu (np. "The secret character is from category: Marvel").

## Task BE-8: Backend – system podpowiedzi (Hint)

**Cel:** Nowy endpoint `/hint`, który zwraca podpowiedź od LLM (cechę postaci), rejestruje użycie.

- `POST /rooms/{room_id}/hint` – body: {player_id: str}. Sprawdź, czy gracz już użył podpowiedzi – jeśli tak, zwróć błąd 400.
- Wywołaj LLM z promptem: "Podaj jedną charakterystyczną cechę postaci, nie zdradzając jej nazwy. Postać: [CHARACTER]."
- Odpowiedź LLM zwróć jako `hint_text`.
- W trybach multiplayer (duel, battle royale) dodaj karę 30 sekund do `penalty_seconds` gracza.
- Zaktualizuj stan gracza (hint_used=true) i zwróć nowy stan pokoju.


## Task FE-9: Frontend – implementacja podpowiedzi

**Cel:** Dodanie przycisku "Podpowiedź" w widoku gry, który wywołuje endpoint `/hint`.

- Przycisk dostępny raz na sesję; po użyciu szarzeje.
- Odpowiedź z backendu wyświetl w dedykowanym polu (np. dymek z podpowiedzią).
- W multiplayer pokaż komunikat o karze (+30s) po użyciu.
