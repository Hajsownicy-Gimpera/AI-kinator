import json

from .test_room_state import _bootstrap_app as bootstrap_app


def _set_secret_character(main, room_id: str, secret: str) -> None:
    with main.SessionLocal() as session:
        room = session.query(main.RoomDB).filter(main.RoomDB.room_id == room_id).first()
        room.secret_character = secret
        session.add(room)
        session.commit()


def _read_room(main, room_id: str):
    with main.SessionLocal() as session:
        return session.query(main.RoomDB).filter(main.RoomDB.room_id == room_id).first()


def test_correct_guess_ends_room_and_sets_winner(tmp_path, monkeypatch):
    main, client = bootstrap_app(tmp_path, monkeypatch)
    room_id = client.post("/games/duel").json()["room_id"]
    _set_secret_character(main, room_id, "Albert Einstein")

    resp = client.post(
        f"/rooms/{room_id}/guess",
        json={"player_id": "p1", "guess": "Albert Einstein"},
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["correct"] is True
    assert data["winner_id"] == "p1"
    assert data["updated_history"][-1]["answer"] == "Tak"

    room = _read_room(main, room_id)
    assert room.phase == "ended"
    players = json.loads(room.players_json)
    p1 = next(p for p in players if p["player_id"] == "p1")
    assert p1["has_guessed"] is True
    assert p1["guessed_at"] is not None
    assert p1["guess_count"] == 1

    state_payload = client.get(f"/rooms/{room_id}/state").json()
    assert state_payload["phase"] == "ended"
    assert state_payload["winner_id"] == "p1"


def test_correct_guess_normalizes_case_spaces_and_diacritics(tmp_path, monkeypatch):
    main, client = bootstrap_app(tmp_path, monkeypatch)

    cases = [
        ("Albert Einstein", "alberteinstein"),
        ("Albert Einstein", "Albert einstein"),
        ("Albert Einstein", "  ALBERT   EINSTEIN  "),
        ("Frida Kahlo", "frida kahlo"),
        ("Frida Kahlo", "FRIDAKAHLO"),
    ]

    for secret, guess in cases:
        room_id = client.post("/games/duel").json()["room_id"]
        _set_secret_character(main, room_id, secret)

        resp = client.post(
            f"/rooms/{room_id}/guess",
            json={"player_id": "p1", "guess": guess},
        )
        assert resp.status_code == 200, (secret, guess, resp.text)
        assert resp.json()["correct"] is True, (secret, guess)


def test_typo_does_not_count_as_correct(tmp_path, monkeypatch):
    main, client = bootstrap_app(tmp_path, monkeypatch)
    room_id = client.post("/games/duel").json()["room_id"]
    _set_secret_character(main, room_id, "Albert Einstein")

    resp = client.post(
        f"/rooms/{room_id}/guess",
        json={"player_id": "p1", "guess": "albrt einsin"},
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["correct"] is False
    assert data["winner_id"] is None


def test_incorrect_guess_keeps_game_active_and_no_winner(tmp_path, monkeypatch):
    main, client = bootstrap_app(tmp_path, monkeypatch)
    room_id = client.post("/games/duel").json()["room_id"]
    _set_secret_character(main, room_id, "Albert Einstein")

    resp = client.post(
        f"/rooms/{room_id}/guess",
        json={"player_id": "p1", "guess": "Sherlock Holmes"},
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["correct"] is False
    assert data["winner_id"] is None
    assert data["updated_history"][-1]["answer"] == "Nie"

    room = _read_room(main, room_id)
    assert room.phase == "active"
    players = json.loads(room.players_json)
    p1 = next(p for p in players if p["player_id"] == "p1")
    assert p1["has_guessed"] is False
    assert p1["guess_count"] == 1


def test_can_continue_asking_questions_after_incorrect_guess(tmp_path, monkeypatch):
    main, client = bootstrap_app(tmp_path, monkeypatch)
    room_id = client.post("/games/duel").json()["room_id"]
    _set_secret_character(main, room_id, "Albert Einstein")

    bad = client.post(
        f"/rooms/{room_id}/guess",
        json={"player_id": "p1", "guess": "Batman"},
    )
    assert bad.status_code == 200
    assert bad.json()["correct"] is False

    follow_up = client.post(
        f"/rooms/{room_id}/question",
        json={"player_id": "p1", "question": "Czy to mężczyzna?"},
    )
    assert follow_up.status_code == 200
    assert follow_up.json()["answer"] in ["Tak", "Nie", "Nie wiem"]


def test_no_more_guesses_after_game_ends(tmp_path, monkeypatch):
    main, client = bootstrap_app(tmp_path, monkeypatch)
    room_id = client.post("/games/duel").json()["room_id"]
    _set_secret_character(main, room_id, "Albert Einstein")

    first = client.post(
        f"/rooms/{room_id}/guess",
        json={"player_id": "p1", "guess": "Albert Einstein"},
    )
    assert first.status_code == 200
    assert first.json()["correct"] is True

    second = client.post(
        f"/rooms/{room_id}/guess",
        json={"player_id": "p1", "guess": "Albert Einstein"},
    )
    assert second.status_code == 400
    assert second.json()["detail"] == "Game has already ended"

    question_after_end = client.post(
        f"/rooms/{room_id}/question",
        json={"player_id": "p1", "question": "Czy to mężczyzna?"},
    )
    assert question_after_end.status_code == 400
    assert question_after_end.json()["detail"] == "Game has already ended"

    join_after_end = client.post(
        f"/rooms/{room_id}/join",
        json={"username": "Nowy gracz"},
    )
    assert join_after_end.status_code == 400
    assert join_after_end.json()["detail"] == "Game has already ended"


def test_guess_404_for_unknown_room(tmp_path, monkeypatch):
    _, client = bootstrap_app(tmp_path, monkeypatch)

    resp = client.post(
        "/rooms/non-existing-room/guess",
        json={"player_id": "p1", "guess": "Batman"},
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Room not found"


def test_guess_404_for_player_not_in_room(tmp_path, monkeypatch):
    main, client = bootstrap_app(tmp_path, monkeypatch)
    room_id = client.post("/games/duel").json()["room_id"]

    resp = client.post(
        f"/rooms/{room_id}/guess",
        json={"player_id": "unknown", "guess": "Batman"},
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Player not in room"


def test_guess_400_for_empty_guess(tmp_path, monkeypatch):
    main, client = bootstrap_app(tmp_path, monkeypatch)
    room_id = client.post("/games/duel").json()["room_id"]

    resp = client.post(
        f"/rooms/{room_id}/guess",
        json={"player_id": "p1", "guess": "   "},
    )
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Guess cannot be empty"


def test_guess_400_for_too_long_guess(tmp_path, monkeypatch):
    main, client = bootstrap_app(tmp_path, monkeypatch)
    room_id = client.post("/games/duel").json()["room_id"]

    resp = client.post(
        f"/rooms/{room_id}/guess",
        json={"player_id": "p1", "guess": "a" * 101},
    )
    assert resp.status_code == 400


def test_normalize_for_guess_helper():
    from main import _normalize_for_guess

    assert _normalize_for_guess("Albert Einstein") == "alberteinstein"
    assert _normalize_for_guess("alberteinstein") == "alberteinstein"
    assert _normalize_for_guess("  ALBERT   EINSTEIN  ") == "alberteinstein"
    assert _normalize_for_guess("Frida Kahlo") == "fridakahlo"
    assert _normalize_for_guess("albrt einsin") == "albrteinsin"
