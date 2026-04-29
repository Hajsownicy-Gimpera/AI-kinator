import importlib
import sqlite3
import sys

import pytest
from fastapi.testclient import TestClient


from .test_room_state import _create_legacy_database


def test_submit_question_persists_history_and_returns_answer(tmp_path, monkeypatch):
    db_path = tmp_path / "rooms.db"
    # create a minimal legacy db so app will run migrations
    _create_legacy_database(db_path)
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path.as_posix()}")
    sys.modules.pop("main", None)

    main = importlib.import_module("main")
    client = TestClient(main.app)

    # create new room which has default player p1 and default history length 2
    create_response = client.post("/games/duel")
    assert create_response.status_code == 200
    room_id = create_response.json()["room_id"]

    payload = {"player_id": "p1", "question": "Czy to postać z filmu?"}
    resp = client.post(f"/rooms/{room_id}/question", json=payload)

    assert resp.status_code == 200
    data = resp.json()
    assert "question_id" in data
    assert data["answer"] in ["Tak", "Nie", "Nie wiem"]
    assert "updated_history" in data
    # original history 2 + (player, ai) => 4
    assert len(data["updated_history"]) >= 4
    # last ai entry should match returned answer
    last_ai = next((h for h in reversed(data["updated_history"]) if h.get("role") == "ai"), None)
    assert last_ai is not None
    assert last_ai.get("answer") == data["answer"]


def test_submit_question_empty_question_returns_400(tmp_path, monkeypatch):
    db_path = tmp_path / "rooms.db"
    _create_legacy_database(db_path)
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path.as_posix()}")
    sys.modules.pop("main", None)

    main = importlib.import_module("main")
    client = TestClient(main.app)

    create_response = client.post("/games/duel")
    room_id = create_response.json()["room_id"]

    payload = {"player_id": "p1", "question": "   "}
    resp = client.post(f"/rooms/{room_id}/question", json=payload)

    assert resp.status_code == 400
    assert resp.json()["detail"] == "Question cannot be empty"


def test_submit_question_unknown_room_returns_404(tmp_path, monkeypatch):
    db_path = tmp_path / "rooms.db"
    _create_legacy_database(db_path)
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path.as_posix()}")
    sys.modules.pop("main", None)

    main = importlib.import_module("main")
    client = TestClient(main.app)

    payload = {"player_id": "p1", "question": "Czy to test?"}
    resp = client.post(f"/rooms/non-existing-room/question", json=payload)

    assert resp.status_code == 404
    assert resp.json()["detail"] == "Room not found"


def test_submit_question_player_not_in_room_returns_404(tmp_path, monkeypatch):
    db_path = tmp_path / "rooms.db"
    _create_legacy_database(db_path)
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path.as_posix()}")
    sys.modules.pop("main", None)

    main = importlib.import_module("main")
    client = TestClient(main.app)

    create_response = client.post("/games/duel")
    room_id = create_response.json()["room_id"]

    payload = {"player_id": "unknown", "question": "Czy to test?"}
    resp = client.post(f"/rooms/{room_id}/question", json=payload)

    assert resp.status_code == 404
    assert resp.json()["detail"] == "Player not in room"
