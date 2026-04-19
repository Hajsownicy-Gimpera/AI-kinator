from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_get_room_state_returns_hardcoded_state_for_existing_room():
    create_response = client.post("/games/duel")
    assert create_response.status_code == 200
    room_id = create_response.json()["room_id"]

    response = client.get(f"/rooms/{room_id}/state")

    assert response.status_code == 200
    payload = response.json()
    assert payload["room_id"] == room_id
    assert payload["game_mode"] == "solo"
    assert payload["phase"] == "active"
    assert len(payload["players"]) == 1
    assert len(payload["conversation_history"]) == 2
    assert payload["conversation_history"][0]["role"] == "player"
    assert payload["conversation_history"][1]["role"] == "ai"
    assert payload["conversation_history"][0]["content"] == "Czy ta postac jest prawdziwa?"
    assert payload["conversation_history"][1]["content"] == "Tak"
    assert payload["winner"] is None


def test_get_room_state_returns_404_for_unknown_room_id():
    response = client.get("/rooms/non-existing-room/state")

    assert response.status_code == 404
    assert response.json() == {"detail": "Room not found"}
