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

---

## Task 2.1: Backend – rozszerzenie GameRoom dla trybów multiplayer

**Cel:** Model pokoju musi obsługiwać wielu graczy, śledzenie ich postępów, zgadywania, kar czasowych.

**Wymagania:**
- Dodaj pole `players`: lista obiektów {player_id, username, guess_count, hint_used (bool), penalty_seconds (int), guessed_at (timestamp|null), has_guessed (bool)}.
- Dodaj pole `game_phase`: "waiting" → "active" → "ended".
- Dodaj `max_players`: 2 dla duel, 10 dla battle royale.
- Po dołączeniu gracza (`POST /rooms/{room_id}/join`) dodaj go do listy, przejdź do "active" gdy liczba graczy = max_players.
- Zaimplementuj wykrywanie końca gry: gdy któryś gracz poprawnie odgadnie postać (przez `/guess`), ustaw phase na "ended", winner_id.
- Backend utrzymuje słownik pokoi w pamięci (jak dotychczas).

---

## Task 2.2: Backend – endpointy dołączania i stanu dla multiplayer

**Cel:** Umożliwienie dołączania graczy do pokoju i pobieranie wspólnego stanu.

- `POST /rooms/{room_id}/join` – body: {username: str}. Zwraca player_id (uuid) i stan pokoju.
- `GET /rooms/{room_id}/state` – rozszerz odpowiedź o listę graczy z ich postępem (bez ujawniania secret_character). Tylko dla graczy w room.
- W stanie zwracaj `phase`, `players`, `conversation_history` (wspólna dla duel? Dla battle royale każdy gracz może mieć osobną historię? Decyzja projektowa: wspólna historia dla uproszczenia, ale osobne liczniki pytań).
- Zadbaj, by polling zwracał aktualny stan, aby frontend mógł reagować na zgadywania innych.

---

## Task 2.3: Backend – system podpowiedzi (Hint)

**Cel:** Nowy endpoint `/hint`, który zwraca podpowiedź od LLM (cechę postaci), rejestruje użycie.

- `POST /rooms/{room_id}/hint` – body: {player_id: str}. Sprawdź, czy gracz już użył podpowiedzi – jeśli tak, zwróć błąd 400.
- Wywołaj LLM z promptem: "Podaj jedną charakterystyczną cechę postaci, nie zdradzając jej nazwy. Postać: [CHARACTER]."
- Odpowiedź LLM zwróć jako `hint_text`.
- W trybach multiplayer (duel, battle royale) dodaj karę 30 sekund do `penalty_seconds` gracza.
- Zaktualizuj stan gracza (hint_used=true) i zwróć nowy stan pokoju.

---

## Task 2.4: Backend – pokoje tematyczne

**Cel:** Możliwość wyboru kategorii przy tworzeniu pokoju, dynamiczny system prompt.

- Dodaj opcjonalny parametr `category` w `POST /games/solo`, `/duel`, `/battle-royale`.
- Zapisz kategorię w obiekcie pokoju.
- Przy generowaniu promptu dla LLM dodaj linię: `"The secret character belongs to the category: {category}."`.
- Jeśli kategoria nie podana, użyj domyślnej szerokiej puli.
- Zaktualizuj endpointy `/question` i `/guess`, aby przekazywały kategorię do LLM.

---

## Task 2.5: Frontend – przebudowa UI (globalny overhaul)

**Cel:** Nowy wygląd zgodny z wytycznymi: minimalistyczny, zaokrąglone rogi (border-radius: 12–16px), wyśrodkowanie, nowoczesna czcionka (np. Inter, Poppins), awatar AI.

- Usuń niebiesko-różowy gradient. Zastosuj ciemne tło (#1a1a2e) z akcentem (np. #e94560).
- Wszystkie przyciski i karty: border-radius: 12px, cień, brak ostrych krawędzi.
- Wyśrodkuj kontener główny (max-width: 600px, margin auto).
- Dodaj awatar AI (stały element graficzny – może być obrazek duszka/genie) w górnej części ekranu gry. Awatar powinien reagować: neutralny wyraz przy oczekiwaniu, myślący podczas odpowiedzi, zadowolony po wygranej. Można to uprościć do zmiany ikony/tekstu.
- Ujednolić styl ekranu logowania/rejestracji (jeśli istnieje) z ekranem gry.
- Zastosuj czcionkę z Google Fonts (import w index.html).

---

## Task 2.6: Frontend – obsługa trybów multiplayer (duel/battle royale)

**Cel:** Rozszerzenie komponentu GameRoom o możliwość gry z wieloma graczami.

- Po wyborze trybu duel/battle royale, wyświetl ekran oczekiwania ("Waiting for opponent...").
- Pobieraj stan pokoju (polling) i renderuj listę graczy z ich statusem (liczba pytań, czy użyli podpowiedzi).
- Gdy faza "active", każdy gracz może zadawać pytania i zgadywać.
- W przypadku zakończenia gry (phase "ended"), pokaż zwycięzcę i ranking (kto pierwszy zgadł, z uwzględnieniem kar).
- Obsłuż przypadek, gdy inny gracz zgadnie poprawnie – twój interfejs powinien zareagować (np. zablokować dalsze pytania).

---

## Task 2.7: Frontend – implementacja podpowiedzi

**Cel:** Dodanie przycisku "Podpowiedź" w widoku gry, który wywołuje endpoint `/hint`.

- Przycisk dostępny raz na sesję; po użyciu szarzeje.
- Odpowiedź z backendu wyświetl w dedykowanym polu (np. dymek z podpowiedzią).
- W multiplayer pokaż komunikat o karze (+30s) po użyciu.

---

## Task 2.8: Frontend – wybór kategorii przy tworzeniu pokoju

**Cel:** Na ekranie wyboru trybu gry dodaj rozwijaną listę kategorii.

- Kategorie: "Wszystkie", "Marvel", "Polski YouTube", "Nobliści", "Postacie historyczne" (przykładowe).
- Przekaż wybraną kategorię w body POST przy tworzeniu pokoju.
- Komponent Home musi obsługiwać nowy parametr.

---

## Task 2.9: Integracja i testy końcowe

**Cel:** Sprawdzenie całości przepływu z nowymi funkcjami.

- Przetestuj scenariusze: solo z kategorią + podpowiedź, duel dwóch graczy z podpowiedziami i karami, battle royale z wieloma graczami.
- Upewnij się, że polling odświeża stan dla wszystkich graczy.
- Poprawki UI i responsywności.