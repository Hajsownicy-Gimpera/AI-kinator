from fastapi.testclient import TestClient

from ai.prompts import VALID_ANSWERS
from main import app


client = TestClient(app)


def test_ask_question_returns_valid_answer():
    room = client.post("/games/solo").json()
    room_id = room["room_id"]

    response = client.post(
        f"/rooms/{room_id}/question",
        json={"player_id": "p1", "question": "Czy ta postac jest fikcyjna?"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["answer"] in VALID_ANSWERS
    assert "raw_response" in data
    assert len(data["updated_history"]) == 2
    assert data["updated_history"][0]["role"] == "player"
    assert data["updated_history"][0]["question"] == "Czy ta postac jest fikcyjna?"
    assert data["updated_history"][1]["role"] == "ai"
    assert data["updated_history"][1]["answer"] in VALID_ANSWERS


def test_ask_question_appends_to_history():
    room = client.post("/games/solo").json()
    room_id = room["room_id"]

    client.post(
        f"/rooms/{room_id}/question",
        json={"player_id": "p1", "question": "Pytanie 1?"},
    )
    response = client.post(
        f"/rooms/{room_id}/question",
        json={"player_id": "p1", "question": "Pytanie 2?"},
    )

    data = response.json()
    assert len(data["updated_history"]) == 4
    assert data["updated_history"][2]["question"] == "Pytanie 2?"


def test_ask_question_room_not_found():
    response = client.post(
        "/rooms/nonexistent/question",
        json={"player_id": "p1", "question": "Test?"},
    )
    assert response.status_code == 404


def test_room_state_reflects_question_history():
    room = client.post("/games/solo").json()
    room_id = room["room_id"]

    client.post(
        f"/rooms/{room_id}/question",
        json={"player_id": "p1", "question": "Czy to czlowiek?"},
    )

    state = client.get(f"/rooms/{room_id}/state").json()
    assert len(state["conversation_history"]) == 2
    assert state["conversation_history"][0]["question"] == "Czy to czlowiek?"
    assert state["game_phase"] == "active"
