# Issue 1: LLM-5 – Implement /guess endpoint with LLM character validation

## Problem
Gra aktualnie nie ma `/guess` endpoint'a. Frontend wysyła POST do `/rooms/{room_id}/guess`, ale backend nie ma tej logiki. Potrzebujemy:
1. Endpoint `/guess` który sprawdza czy odgadnięta postać to `secret_character` 
2. Aktualizacja `roomState` z `winner_id` gdy gracz wygra
3. Kontynuacja gry jeśli odgadnięcie było błędne

## Details

### Current State
- **Backend:** `POST /rooms/{room_id}/question` jest zaimplementowany (linie 260-310 w `main.py`)
  - Używa `LLMChain(character_name=secret_character)` do otrzymania odpowiedzi
  - Historia jest persystowana w `room.history_json`
  - Pracuje prawidłowo, zwraca `answer` z zakresu ["Tak", "Nie", "Nie wiem"]
- **Tests:** `backend/tests/test_llm_chain.py` (42 linie) pokrywa 5 scenariuszy:
  - Dummy mode returns valid answer
  - Dummy mode with history
  - Validation exact match (Tak/Nie/Nie wiem)
  - Validation case insensitive
  - Validation fallback on invalid
- **RoomState schema** (linia 113-123 w `main.py`): zawiera `winner_id: str | None`

### What You Need to Do
1. **Implement `POST /rooms/{room_id}/guess` endpoint:**
   - Request: `{"player_id": "str", "guess": "str"}`
   - Response: `{"correct": bool, "winner_id": "str|null", "message": "str"}`
   
2. **Guess validation logic:**
   - Retrieve room by `room_id`
   - Get `secret_character` from room
   - Compare user's `guess` with `secret_character` (case-insensitive, trim whitespace)
   - Direct string comparison (simpler, recommended)

3. **Update room state on correct guess:**
   - Set `room.phase = "ended"`
   - Set `room.winner_id = request.player_id`
   - Persist in DB
   - Return response with `correct: true` and `winner_id`

4. **Return incorrect guess gracefully:**
   - Response: `{"correct": false, "winner_id": null, "message": "To nie ta postać. Spróbuj jeszcze raz!"}`
   - Do NOT end game on incorrect guess
   - Allow continued conversation

5. **Error handling:**
   - Room not found → 404
   - Player not in room → 404
   - Empty guess → 400
   - Guess longer than 100 chars → 400

6. **Add unit test:**
   - Test successful guess (room ends, winner_id set)
   - Test incorrect guess (room continues, no winner)
   - Test 404 for non-existent room
   - File: `backend/tests/test_guess_endpoint.py`

## Acceptance Criteria
- [ ] POST /rooms/{room_id}/guess endpoint exists and returns proper response
- [ ] Correct guess sets room.phase="ended" and room.winner_id
- [ ] Incorrect guess doesn't end game, allows retry
- [ ] Player can continue asking questions after incorrect guess
- [ ] All tests in test_guess_endpoint.py pass
- [ ] Error handling (404, 400) works correctly
- [ ] Endpoint works in Swagger UI (/docs)

## Dependencies
- BE-4 ✅ (RoomDB schema complete)
- BE-5 ✅ (LLMChain working)
- LLM-1 ✅ (LLMChain installed)

## Notes
- Use `LLMChain` pattern established in `/question` endpoint (lines 289-294) for consistency
- Do NOT break existing `POST /question` endpoint functionality
- Consider: Should frontend show remaining guesses? (Not in scope for this task)

---

# Issue 2: FE-5 – Implement win screen and guess handler response logic

## Problem
Frontend wysyła guess do `/guess` endpoint'a, ale:
1. Nie wyświetla win screen gdy `roomState.winner_id` istnieje
2. Handler `handleGuess` nie sprawdza response'a aby zaktualizować UI
3. Gracz nie widzi czy odgadł prawidłową postać czy nie

## Details

### Current State
- **File:** `frontend/src/pages/GameView/GameView.js` (286 linii)
  - `handleGuess` (linie 125-159) robi fetch do `/guess`
  - Nie sprawdza `correct` w response'ie
  - Nie aktualizuje UI na podstawie wyniku
  - Render (linie 196-282) nie ma warunkowego UI dla win screen'u
  - Brak sprawdzenia czy `roomState.winner_id !== null`

### What You Need to Do
1. **Create WinScreen component:**
   - File: `frontend/src/components/WinScreen/WinScreen.js`
   - Display: 
     - "Gratulacje!" heading
     - Postać którą guessnął (z `roomState.secret_character`)
     - Liczba pytań (z `conversationHistory.length`)
     - Button "Powrót do menu" → `navigate('/')`
   - Style in: `frontend/src/components/WinScreen/WinScreen.css`

2. **Update GameView.js main render:**
   - Check: `if (roomState.winner_id) { return <WinScreen /> }`
   - This should be before main game UI render (lines 196-282)
   - Pass: `roomState` and `conversationHistory` to WinScreen

3. **Update handleGuess logic:**
   - Check `response.correct` from `/guess` endpoint:
     - If `correct === true`: Display success message, trigger polling to get updated `winner_id`
     - If `correct === false`: Display message "To nie ta postać. Spróbuj jeszcze raz!" and clear input
   - Clear `guess` input after submission (line 153)
   - Call `fetchRoomState()` immediately after correct guess (to get `winner_id`)

4. **Error handling in handleGuess:**
   - 404 endpoint (guess not implemented yet): console.warn() and show message
   - 400 (empty/too long): Already handled, same as before
   - Network error: Show error message

5. **Fix guess validation check:**
   - Line 128: Currently checks `!question.trim()` but should check `!guess.trim()`
   - This bug prevents guess submission if question is empty

## Acceptance Criteria
- [ ] WinScreen component created and styled
- [ ] GameView shows WinScreen when roomState.winner_id is not null
- [ ] handleGuess reads response.correct and updates UI accordingly
- [ ] Correct guess triggers immediate roomState poll
- [ ] Incorrect guess shows message and clears input
- [ ] Win screen shows secret_character and question count
- [ ] "Powrót do menu" button navigates to home page
- [ ] No console errors
- [ ] Guess validation bug (line 128) is fixed

## Dependencies
- BE-5: /question endpoint ✅ (already working)
- LLM-5: /guess endpoint (waiting - this task depends on it)
- FE-3: GameView component ✅ (already working)

## Notes
- You can test with mock response before LLM-5 is done: assume `/guess` returns `{"correct": bool, "winner_id": "str|null"}`
- Consider: Show "guess_count" from player state? (Not in scope, but could be enhancement)
- Design tip: Use same styling as chat messages for consistency (GameView.css pattern)
