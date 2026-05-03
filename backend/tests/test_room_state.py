import importlib
import sqlite3
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import inspect


LEGACY_ROOM_ID = "legacy-room"


def _create_legacy_database(db_path):
    connection = sqlite3.connect(db_path)
    connection.execute(
        """
        CREATE TABLE rooms (
            room_id VARCHAR PRIMARY KEY,
            game_mode VARCHAR,
            status VARCHAR DEFAULT 'waiting',
            created_at DATETIME
        )
        """
    )
    connection.execute(
        "INSERT INTO rooms (room_id, game_mode, status, created_at) VALUES (?, ?, ?, ?)",
        (LEGACY_ROOM_ID, "duel", "waiting", "2026-04-29 12:00:00"),
    )
    connection.commit()
    connection.close()


@pytest.fixture
def client_and_main(tmp_path, monkeypatch):
    db_path = tmp_path / "rooms.db"
    _create_legacy_database(db_path)
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path.as_posix()}")
    sys.modules.pop("main", None)

    main = importlib.import_module("main")
    client = TestClient(main.app)

    try:
        yield client, main
    finally:
        client.close()


def test_room_state_migration_adds_new_columns_and_preserves_legacy_room(client_and_main):
    client, main = client_and_main

    inspector = inspect(main.engine)
    columns = {column["name"] for column in inspector.get_columns("rooms")}

    assert {"phase", "secret_character", "players_json", "history_json"}.issubset(columns)

    response = client.get(f"/rooms/{LEGACY_ROOM_ID}/state")

    assert response.status_code == 200
    payload = response.json()
    assert payload["room_id"] == LEGACY_ROOM_ID
    assert payload["game_mode"] == "duel"
    assert payload["phase"] == "waiting"
    assert "game_phase" not in payload
    assert "secret_character" not in payload
    assert len(payload["players"]) == 1
    assert payload["players"][0]["player_id"] == "p1"
    assert payload["players"][0]["has_guessed"] is False
    assert payload["players"][0]["guessed_at"] is None
    assert payload["winner_id"] is None
    assert isinstance(payload["created_at"], str)
    assert "conversation_history" not in payload


def test_join_endpoint_returns_full_history(client_and_main):
    client, _ = client_and_main

    response = client.get(f"/rooms/{LEGACY_ROOM_ID}/join")

    assert response.status_code == 200
    payload = response.json()
    assert payload["room_id"] == LEGACY_ROOM_ID
    assert payload["game_mode"] == "duel"
    assert payload["phase"] == "waiting"
    assert "secret_character" not in payload
    assert len(payload["conversation_history"]) == 2
    assert payload["conversation_history"][0]["role"] == "player"
    assert payload["conversation_history"][1]["role"] == "ai"
    assert payload["conversation_history"][0]["question"] == "Czy ta postac jest prawdziwa?"
    assert payload["conversation_history"][1]["answer"] == "Tak"


def test_new_room_state_returns_persisted_shape(client_and_main):
    client, _ = client_and_main

    create_response = client.post("/games/duel")
    assert create_response.status_code == 200
    room_id = create_response.json()["room_id"]

    response = client.get(f"/rooms/{room_id}/state")

    assert response.status_code == 200
    payload = response.json()
    assert payload["room_id"] == room_id
    assert payload["game_mode"] == "duel"
    assert payload["phase"] == "waiting"
    assert "game_phase" not in payload
    assert "secret_character" not in payload
    assert len(payload["players"]) == 1
    assert "conversation_history" not in payload


def test_get_room_state_returns_404_for_unknown_room_id(client_and_main):
    client, _ = client_and_main

    response = client.get("/rooms/non-existing-room/state")

    assert response.status_code == 404
    assert response.json() == {"detail": "Room not found"}