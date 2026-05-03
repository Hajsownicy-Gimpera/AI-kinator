from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_get_room_state_returns_state_for_existing_room():
    create_response = client.post("/games/duel")
    assert create_response.status_code == 200
    room_id = create_response.json()["room_id"]

    response = client.get(f"/rooms/{room_id}/state")

    assert response.status_code == 200
    payload = response.json()
    assert payload["room_id"] == room_id
    assert "secret_character" not in payload
    assert payload["game_mode"] == "duel"
    assert payload["game_phase"] == "waiting"
    assert len(payload["players"]) == 1
    assert payload["players"][0]["has_guessed"] is False
    assert payload["players"][0]["guessed_at"] is None
    assert payload["winner_id"] is None
    assert isinstance(payload["created_at"], str)


def test_get_room_state_returns_404_for_unknown_room_id():
    response = client.get("/rooms/non-existing-room/state")

    assert response.status_code == 404
    assert response.json() == {"detail": "Room not found"}
