from .test_room_state import _bootstrap_app


def test_submit_hint_marks_hint_used_and_adds_penalty_in_multiplayer(tmp_path, monkeypatch):
    main, client = _bootstrap_app(tmp_path, monkeypatch)
    monkeypatch.setattr(
        main.LLMChain,
        "get_hint",
        lambda self: {"hint_text": "To jest podpowiedź."},
    )

    create_response = client.post("/games/duel")
    room_id = create_response.json()["room_id"]

    resp = client.post(f"/rooms/{room_id}/hint", json={"player_id": "p1"})

    assert resp.status_code == 200
    assert resp.json()["hint_text"] == "To jest podpowiedź."

    with main.SessionLocal() as session:
        room = session.query(main.RoomDB).filter(main.RoomDB.room_id == room_id).first()
        players = main.json.loads(room.players_json)
        player = next(p for p in players if p["player_id"] == "p1")

    assert player["hint_used"] is True
    assert player["penalty_seconds"] == 30


def test_submit_hint_in_solo_does_not_add_penalty(tmp_path, monkeypatch):
    main, client = _bootstrap_app(tmp_path, monkeypatch)
    monkeypatch.setattr(
        main.LLMChain,
        "get_hint",
        lambda self: {"hint_text": "Podpowiedź solo."},
    )

    room_id = client.post("/games/solo").json()["room_id"]

    resp = client.post(f"/rooms/{room_id}/hint", json={"player_id": "p1"})

    assert resp.status_code == 200
    with main.SessionLocal() as session:
        room = session.query(main.RoomDB).filter(main.RoomDB.room_id == room_id).first()
        players = main.json.loads(room.players_json)
        player = next(p for p in players if p["player_id"] == "p1")

    assert player["hint_used"] is True
    assert player["penalty_seconds"] == 0


def test_submit_hint_only_once_per_player(tmp_path, monkeypatch):
    main, client = _bootstrap_app(tmp_path, monkeypatch)
    monkeypatch.setattr(
        main.LLMChain,
        "get_hint",
        lambda self: {"hint_text": "Jedna podpowiedź."},
    )

    room_id = client.post("/games/duel").json()["room_id"]

    first = client.post(f"/rooms/{room_id}/hint", json={"player_id": "p1"})
    assert first.status_code == 200

    second = client.post(f"/rooms/{room_id}/hint", json={"player_id": "p1"})
    assert second.status_code == 400
    assert second.json()["detail"] == "Hint already used"


def test_submit_hint_player_not_in_room_returns_404(tmp_path, monkeypatch):
    main, client = _bootstrap_app(tmp_path, monkeypatch)
    monkeypatch.setattr(
        main.LLMChain,
        "get_hint",
        lambda self: {"hint_text": "Nie powinno się to pojawić."},
    )

    room_id = client.post("/games/duel").json()["room_id"]

    resp = client.post(f"/rooms/{room_id}/hint", json={"player_id": "unknown"})

    assert resp.status_code == 404
    assert resp.json()["detail"] == "Player not in room"


def test_submit_hint_unknown_room_returns_404(tmp_path, monkeypatch):
    main, client = _bootstrap_app(tmp_path, monkeypatch)
    monkeypatch.setattr(
        main.LLMChain,
        "get_hint",
        lambda self: {"hint_text": "Nie powinno się to pojawić."},
    )

    resp = client.post("/rooms/non-existing-room/hint", json={"player_id": "p1"})

    assert resp.status_code == 404
    assert resp.json()["detail"] == "Room not found"