from .test_room_state import _bootstrap_app
import json


def _set_secret_character(main, room_id: str, secret: str) -> None:
    with main.SessionLocal() as session:
        room = session.query(main.RoomDB).filter(main.RoomDB.room_id == room_id).first()
        room.secret_character = secret
        session.add(room)
        session.commit()


def _read_room(main, room_id: str):
    with main.SessionLocal() as session:
        return session.query(main.RoomDB).filter(main.RoomDB.room_id == room_id).first()


def test_three_players_join_and_one_wins(tmp_path, monkeypatch):
    main, client = _bootstrap_app(tmp_path, monkeypatch)

    # create a room and then set a custom max_players = 5
    create_resp = client.post("/games/battle-royale")
    assert create_resp.status_code == 200
    room_payload = create_resp.json()
    room_id = room_payload["room_id"]

    # override max_players to 5 for this test
    with main.SessionLocal() as session:
        room = session.query(main.RoomDB).filter(main.RoomDB.room_id == room_id).first()
        room.max_players = 5
        session.add(room)
        session.commit()

    # Two additional players join (initial p1 exists already)
    join_a = client.post(
        f"/rooms/{room_id}/join",
        json={"username": "Ala", "invite_code": room_payload["invite_code"]},
    )
    assert join_a.status_code == 200
    player_a_id = join_a.json()["player_id"]

    join_b = client.post(
        f"/rooms/{room_id}/join",
        json={"username": "Bob", "invite_code": room_payload["invite_code"]},
    )
    assert join_b.status_code == 200
    player_b_id = join_b.json()["player_id"]

    # Verify there are 3 players and room is still waiting (max_players=5)
    state = client.get(f"/rooms/{room_id}/state").json()
    assert len(state["players"]) == 3
    assert state["phase"] in ("waiting", "active")

    # Set a known secret character
    _set_secret_character(main, room_id, "Sherlock Holmes")

    # p1 (default) makes an incorrect guess
    g1 = client.post(f"/rooms/{room_id}/guess", json={"player_id": "p1", "guess": "Batman"})
    assert g1.status_code == 200
    assert g1.json()["correct"] is False

    # p2 (Ala) guesses correctly
    g2 = client.post(f"/rooms/{room_id}/guess", json={"player_id": player_a_id, "guess": "Sherlock Holmes"})
    assert g2.status_code == 200
    d2 = g2.json()
    assert d2["correct"] is True
    assert d2["winner_id"] == player_a_id

    # verify DB state updated: room ended and winner set to Ala
    room = _read_room(main, room_id)
    assert room.phase == "ended"
    assert room.winner_id == player_a_id

    players = json.loads(room.players_json)
    winner = next(p for p in players if p["player_id"] == player_a_id)
    assert winner["has_guessed"] is True
    assert winner["guess_count"] >= 1

    # Bob should observe the room is ended and cannot guess anymore
    state_after = client.get(f"/rooms/{room_id}/state").json()
    assert state_after["phase"] == "ended"
    assert state_after["winner_id"] == player_a_id

    # Bob's attempt to guess after the end should be rejected
    guess_after_end = client.post(f"/rooms/{room_id}/guess", json={"player_id": player_b_id, "guess": "Sherlock Holmes"})
    assert guess_after_end.status_code == 400
    assert guess_after_end.json()["detail"] == "Game has already ended"
