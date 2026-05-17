from .test_room_state import _bootstrap_app


def test_invite_code_format_and_uniqueness(tmp_path, monkeypatch):
    main, client = _bootstrap_app(tmp_path, monkeypatch)

    codes = []
    for _ in range(10):
        resp = client.post("/games/duel")
        assert resp.status_code == 200
        code = resp.json().get("invite_code")
        assert code
        assert isinstance(code, str)
        assert len(code) == 8
        # _generate_invite_code uses uuid4().hex[:8].upper() -> hex chars
        assert all(c in "0123456789ABCDEF" for c in code)
        codes.append(code)

    assert len(set(codes)) == len(codes)


def test_join_with_invalid_invite_code_rejected(tmp_path, monkeypatch):
    main, client = _bootstrap_app(tmp_path, monkeypatch)

    create = client.post("/games/duel")
    assert create.status_code == 200
    room = create.json()

    bad = client.post(
        f"/rooms/{room['room_id']}/join",
        json={"username": "Intruder", "invite_code": "BADCODE1"},
    )
    assert bad.status_code == 400
    assert bad.json()["detail"] == "Invalid invite code"
