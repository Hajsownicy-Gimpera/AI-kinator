from fastapi.testclient import TestClient

from ai.prompts import VALID_ANSWERS
from main import app


client = TestClient(app)


def test_ask_question_returns_valid_answer():
    room = client.post("/games/solo").json()
    room_id = room["room_id"]

    response = client.post(
        f"/rooms/{room_id}/question",
        json={"question": "Czy ta postac jest fikcyjna?"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["answer"] in VALID_ANSWERS
    assert "raw_response" not in data
    assert "question_id" in data


def test_ask_question_appends_to_history():
    room = client.post("/games/solo").json()
    room_id = room["room_id"]

    client.post(
        f"/rooms/{room_id}/question",
        json={"question": "Pytanie 1?"},
    )
    client.post(
        f"/rooms/{room_id}/question",
        json={"question": "Pytanie 2?"},
    )

    history = client.get(f"/rooms/{room_id}/join").json()["conversation_history"]
    assert len(history) == 4
    assert history[2]["question"] == "Pytanie 2?"


def test_ask_question_room_not_found():
    response = client.post(
        "/rooms/nonexistent/question",
        json={"question": "Test?"},
    )
    assert response.status_code == 404


def test_ask_question_rejects_empty():
    room = client.post("/games/solo").json()
    room_id = room["room_id"]

    response = client.post(
        f"/rooms/{room_id}/question",
        json={"question": "   "},
    )
    assert response.status_code == 400


def test_ask_question_rejects_too_long():
    room = client.post("/games/solo").json()
    room_id = room["room_id"]

    response = client.post(
        f"/rooms/{room_id}/question",
        json={"question": "a" * 501},
    )
    assert response.status_code == 400


def test_room_state_reflects_question_history():
    room = client.post("/games/solo").json()
    room_id = room["room_id"]

    client.post(
        f"/rooms/{room_id}/question",
        json={"question": "Czy to czlowiek?"},
    )

    history = client.get(f"/rooms/{room_id}/join").json()["conversation_history"]
    assert len(history) == 2
    assert history[0]["question"] == "Czy to czlowiek?"

    state = client.get(f"/rooms/{room_id}/state").json()
    assert state["game_phase"] == "active"
