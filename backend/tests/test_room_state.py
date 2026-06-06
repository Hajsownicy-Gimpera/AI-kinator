import importlib
import sys

import pytest
from fastapi.testclient import TestClient


ROOM_ID = "room-test"


def _bootstrap_app(tmp_path, monkeypatch):
    db_path = tmp_path / "rooms.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path.as_posix()}")
    sys.modules.pop("main", None)

    main = importlib.import_module("main")
    client = TestClient(main.app)
    return main, client


@pytest.fixture
def client_and_main(tmp_path, monkeypatch):
    main, client = _bootstrap_app(tmp_path, monkeypatch)

    try:
        yield client, main
    finally:
        client.close()


def test_new_room_schema_and_state_shape(client_and_main):
    client, main = client_and_main

    create_response = client.post("/games/duel")
    assert create_response.status_code == 200
    room_id = create_response.json()["room_id"]

    response = client.get(f"/rooms/{room_id}/state")

    assert response.status_code == 200
    payload = response.json()
    assert payload["room_id"] == room_id
    assert payload["game_mode"] == "duel"
    assert payload["phase"] == "waiting"
    assert payload["max_players"] == 2
    assert payload["invite_code"]
    assert "secret_character" not in payload
    assert len(payload["players"]) == 1
    assert payload["players"][0]["player_id"] == "p1"
    assert payload["players"][0]["hint_used"] is False
    assert payload["players"][0]["penalty_seconds"] == 0
    assert payload["players"][0]["has_guessed"] is False
    assert payload["players"][0]["guessed_at"] is None
    assert payload["winner_id"] is None
    assert isinstance(payload["created_at"], str)
    assert "conversation_history" not in payload


def test_join_endpoint_returns_full_history(client_and_main):
    client, _ = client_and_main

    create_response = client.post("/games/duel")
    assert create_response.status_code == 200
    room_id = create_response.json()["room_id"]

    response = client.get(f"/rooms/{room_id}/join")

    assert response.status_code == 200
    payload = response.json()
    assert payload["room_id"] == room_id
    assert payload["game_mode"] == "duel"
    assert payload["phase"] == "waiting"
    assert "secret_character" not in payload
    assert len(payload["conversation_history"]) == 2
    assert payload["conversation_history"][0]["role"] == "player"
    assert payload["conversation_history"][1]["role"] == "ai"
    assert payload["conversation_history"][0]["question"] == "Czy ta postac jest prawdziwa?"
    assert payload["conversation_history"][1]["answer"] == "Tak"


def test_create_room_with_username_returns_player_id(client_and_main):
    client, _ = client_and_main

    create_response = client.post("/games/duel", json={"username": "Hero"})
    assert create_response.status_code == 200
    payload = create_response.json()
    assert payload["room_id"]
    assert payload["player_id"] == "p1"
    assert payload["invite_code"]

    state = client.get(f"/rooms/{payload['room_id']}/state").json()
    assert state["players"][0]["player_id"] == "p1"
    assert state["players"][0]["username"] == "Hero"


def test_room_lookup_by_invite_code(client_and_main):
    client, _ = client_and_main

    create_response = client.post("/games/duel", json={"username": "Hero"})
    payload = create_response.json()

    invite_response = client.get(f"/rooms/invite/{payload['invite_code']}")
    assert invite_response.status_code == 200
    assert invite_response.json()["room_id"] == payload["room_id"]


def test_join_endpoint_creates_player_and_activates_room_when_full(client_and_main):
    client, _ = client_and_main

    create_response = client.post("/games/duel")
    assert create_response.status_code == 200
    room_payload = create_response.json()

    join_response = client.post(
        f"/rooms/{room_payload['room_id']}/join",
        json={"username": "Ala", "invite_code": room_payload["invite_code"]},
    )

    assert join_response.status_code == 200
    join_payload = join_response.json()
    assert join_payload["player_id"]
    assert join_payload["phase"] == "active"
    assert join_payload["winner_id"] is None
    assert len(join_payload["players"]) == 2
    assert join_payload["players"][1]["username"] == "Ala"

    state_payload = client.get(f"/rooms/{room_payload['room_id']}/state").json()
    assert state_payload["phase"] == "active"
    assert len(state_payload["players"]) == 2
    assert "conversation_history" not in state_payload


def test_start_room_endpoint_requires_minimum_players(client_and_main):
    client, _ = client_and_main

    create_response = client.post("/games/duel")
    assert create_response.status_code == 200
    room_payload = create_response.json()

    start_response = client.post(f"/rooms/{room_payload['room_id']}/start")
    assert start_response.status_code == 400
    assert "Potrzebnych jest co najmniej" in start_response.json()["detail"]


def test_start_room_endpoint_activates_room_when_minimum_players_are_present(client_and_main):
    client, _ = client_and_main

    create_response = client.post("/games/battle-royale", json={"username": "Host"})
    assert create_response.status_code == 200
    room_payload = create_response.json()

    join_response = client.post(
        f"/rooms/{room_payload['room_id']}/join",
        json={"username": "Ala", "invite_code": room_payload["invite_code"]},
    )
    assert join_response.status_code == 200

    join_response_two = client.post(
        f"/rooms/{room_payload['room_id']}/join",
        json={"username": "Marek", "invite_code": room_payload["invite_code"]},
    )
    assert join_response_two.status_code == 200

    start_response = client.post(f"/rooms/{room_payload['room_id']}/start")
    assert start_response.status_code == 200
    start_payload = start_response.json()
    assert start_payload["phase"] == "active"
    assert start_payload["status"] == "active"
    assert len(start_payload["players"]) == 3


def test_get_room_state_returns_404_for_unknown_room_id(client_and_main):
    client, _ = client_and_main

    response = client.get("/rooms/non-existing-room/state")

    assert response.status_code == 404
    assert response.json() == {"detail": "Room not found"}


def test_get_room_history_returns_404_for_unknown_room_id(client_and_main):
    client, _ = client_and_main

    response = client.get("/rooms/non-existing-room/join")

    assert response.status_code == 404
    assert response.json() == {"detail": "Room not found"}