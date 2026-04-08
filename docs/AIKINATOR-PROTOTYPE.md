# AI-kinator Prototype v0.1 – Implementation Tasks for LLM

This document contains a structured list of implementation tasks for building the absolute minimal prototype of AI-kinator. The goal is to establish a working client-server skeleton with placeholder UI elements and dummy API endpoints. **No real game logic or LLM integration is required yet.**

## General Guidelines for Code Generation

- Keep everything **extremely simple**.
- Backend: Use FastAPI with in-memory storage (Python dicts).
- Frontend: Use React functional components with hooks.
- All endpoints should return hardcoded dummy responses (except basic CRUD for room creation).
- Focus on **connectivity** and **basic UI structure**.
- Do not implement actual AI calls, game rules, or multiplayer synchronization.

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

## Notes for LLM

- When generating code for these tasks, **do not overcomplicate**.
- Use simple, functional code; avoid premature optimization.
- Backend storage can be plain Python dictionaries; no database needed.
- Frontend state management can be local component state or simple Context.
- The dummy responses should be static and identical for all rooms.
```

---

## 2. Wersja do Kanbana – lista zadań do przypisania członkom zespołu

Poniższe zadania możesz skopiować bezpośrednio jako karty w GitHub Projects / Trello / Jira. Każde zawiera tytuł, krótki opis i kryteria akceptacji.

### 📋 Backlog – Prototyp v0.1

| ID | Tytuł | Opis | Kryteria akceptacji | Przypisane do |
|----|-------|------|---------------------|---------------|
| **BE‑1** | Inicjalizacja projektu backend | Stwórz strukturę katalogów `backend/`, plik `requirements.txt` (fastapi, uvicorn, pydantic) oraz podstawowy plik `main.py` z endpointami `/` i `/health`. Dodaj CORS dla localhost:3000. | Uruchomienie `uvicorn` działa. Przeglądarka widzi `{"status":"ok"}` pod `localhost:8000`. | Backend team |
| **BE‑2** | Endpointy tworzenia pokoi (dummy) | Zaimplementuj `POST /games/solo`, `/duel`, `/battle-royale`. Zwracaj unikalne `room_id` (uuid) i tryb gry. Przechowuj pokoje w słowniku w pamięci. | Każdy POST zwraca JSON z `room_id`. Pokoje są zapamiętywane. | Backend team |
| **BE‑3** | Endpoint stanu pokoju (dummy) | Dodaj `GET /rooms/{room_id}/state`. Dla istniejącego ID zwróć zahardcodowany stan (historia rozmowy, faza, gracze). Dla nieistniejącego – 404. | Odpowiedź zawiera przykładowe dane. Test przez Postmana / przeglądarkę. | Backend team |
| **FE‑1** | Inicjalizacja projektu frontend | Stwórz aplikację React (`create-react-app`), wyczyść boilerplate, zainstaluj `axios`. Skonfiguruj proxy do backendu (opcjonalnie). | `npm start` uruchamia apkę. Można wywołać backend. | Frontend team |
| **FE‑2** | Ekran główny z wyborem trybu gry | Komponent `Home` z trzema przyciskami: Solo, Duel, Battle Royale. Po kliknięciu wywołaj odpowiedni endpoint BE, zapisz `room_id` i przejdź do widoku gry. | Kliknięcie przycisku tworzy pokój i przenosi do `/game`. Wyświetla się ID pokoju. | Frontend team |
| **FE‑3** | Szkielet komponentu GameRoom + polling | Komponent `GameRoom` odpytuje co 3s `GET /rooms/{room_id}/state`. Wyświetla historię rozmowy (dummy), pole tekstowe (disabled) i przyciski "Zadaj pytanie", "Zgaduję postać". | Polling działa, dane się wyświetlają. Przyciski widoczne. | Frontend team |
| **FE‑4** | Placeholder dla akcji pytania/zgadywania | Podłącz przyciski "Zadaj pytanie" i "Zgaduję postać" do (nieistniejących jeszcze) endpointów POST. Obsłuż błędy 404 w konsoli lub alertem. | Kliknięcie wywołuje żądanie sieciowe. Aplikacja nie crashuje. | Frontend team |
| **INT‑1** | Integracja i test przepływu | Połącz wszystkie elementy: wybór trybu → utworzenie pokoju → wyświetlenie GameRoom → polling. Dodaj przycisk "Powrót do menu". | Można przejść pełną ścieżkę demo bez błędów. Kod w gałęzi `prototype-v0.1`. | Cały zespół |

### 📌 Uwagi do Kanbana

- Zadania **BE-1, BE-2, BE-3** mogą być realizowane równolegle lub sekwencyjnie.
- Zadania **FE-1, FE-2, FE-3, FE-4** również.
- **INT-1** wymaga ukończenia wszystkich poprzednich.
- Proponowany limit WIP (Work In Progress): 2 zadania na osobę.

Możesz dodać etykiety: `backend`, `frontend`, `prototype`, `high-priority`.