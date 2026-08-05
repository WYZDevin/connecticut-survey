from sqlalchemy import text

from app.constants import PAIRS_PER_BLOCK, PROMPT_IDS
from app.db import SessionLocal
from tests.conftest import make_payload
from tests.test_assignment import backdate

CELLS = PAIRS_PER_BLOCK * len(PROMPT_IDS)


def create_session(client) -> tuple[str, list[str]]:
    body = client.post("/api/sessions").json()
    return body["sessionId"], [p["pairId"] for p in body["pairs"]]


def db_scalar(sql: str, **params):
    with SessionLocal() as db:
        return db.execute(text(sql), params).scalar()


def test_submit_happy_path(client, seed_blocks):
    seed_blocks(1)
    sid, pair_ids = create_session(client)
    res = client.post(
        f"/api/sessions/{sid}/submit",
        json=make_payload(pair_ids),
        headers={"User-Agent": "pytest-agent"},
    )
    assert res.status_code == 201
    assert res.json() == {"ok": True}
    assert db_scalar("SELECT count(*) FROM submissions") == 1
    assert db_scalar("SELECT count(*) FROM comparison_responses") == CELLS
    assert db_scalar("SELECT status FROM sessions WHERE id = :sid", sid=sid) == "submitted"
    assert (
        db_scalar("SELECT submitted_at FROM sessions WHERE id = :sid", sid=sid)
        is not None
    )
    assert db_scalar("SELECT submitted_count FROM blocks WHERE block_index = 0") == 1
    assert (
        db_scalar("SELECT user_agent FROM submissions WHERE session_id = :sid", sid=sid)
        == "pytest-agent"
    )


def test_double_submit_409(client, seed_blocks):
    seed_blocks(1)
    sid, pair_ids = create_session(client)
    assert client.post(f"/api/sessions/{sid}/submit", json=make_payload(pair_ids)).status_code == 201
    assert client.post(f"/api/sessions/{sid}/submit", json=make_payload(pair_ids)).status_code == 409
    assert db_scalar("SELECT count(*) FROM submissions") == 1
    assert db_scalar("SELECT submitted_count FROM blocks WHERE block_index = 0") == 1


def test_unknown_session_404(client, seed_blocks):
    seed_blocks(1)
    _, pair_ids = create_session(client)
    res = client.post(
        "/api/sessions/00000000-0000-0000-0000-000000000000/submit",
        json=make_payload(pair_ids),
    )
    assert res.status_code == 404


def test_malformed_uuid_422(client, seed_blocks):
    seed_blocks(1)
    _, pair_ids = create_session(client)
    res = client.post("/api/sessions/not-a-uuid/submit", json=make_payload(pair_ids))
    assert res.status_code == 422


def test_pair_not_in_block_422(client, seed_blocks):
    seed_blocks(2)
    sid, pair_ids = create_session(client)
    wrong = pair_ids[:-1] + [f"p{PAIRS_PER_BLOCK + 5:04d}"]  # a block-1 pair
    res = client.post(f"/api/sessions/{sid}/submit", json=make_payload(wrong))
    assert res.status_code == 422
    assert db_scalar("SELECT count(*) FROM submissions") == 0


def test_missing_cell_422(client, seed_blocks):
    seed_blocks(1)
    sid, pair_ids = create_session(client)
    payload = make_payload(pair_ids)
    payload["comparisons"] = payload["comparisons"][:-1]  # 59 cells
    assert client.post(f"/api/sessions/{sid}/submit", json=payload).status_code == 422


def test_duplicate_cell_422(client, seed_blocks):
    seed_blocks(1)
    sid, pair_ids = create_session(client)
    payload = make_payload(pair_ids)
    payload["comparisons"].append(dict(payload["comparisons"][0]))  # 61 with a dupe
    assert client.post(f"/api/sessions/{sid}/submit", json=payload).status_code == 422


def test_bad_choice_422(client, seed_blocks):
    seed_blocks(1)
    sid, pair_ids = create_session(client)
    payload = make_payload(pair_ids)
    payload["comparisons"][0]["choice"] = "middle"
    assert client.post(f"/api/sessions/{sid}/submit", json=payload).status_code == 422


def test_bad_prompt_422(client, seed_blocks):
    seed_blocks(1)
    sid, pair_ids = create_session(client)
    payload = make_payload(pair_ids)
    payload["comparisons"][0]["promptId"] = "earthquake"
    assert client.post(f"/api/sessions/{sid}/submit", json=payload).status_code == 422


def test_submit_after_expiry_accepted(client, seed_blocks):
    seed_blocks(2)
    sid, pair_ids = create_session(client)  # block 0
    backdate(sid)
    client.post("/api/sessions")  # triggers lazy expire; reclaims block 0
    assert (
        db_scalar("SELECT status FROM sessions WHERE id = :sid", sid=sid) == "expired"
    )
    res = client.post(f"/api/sessions/{sid}/submit", json=make_payload(pair_ids))
    assert res.status_code == 201
    assert db_scalar("SELECT status FROM sessions WHERE id = :sid", sid=sid) == "submitted"
    assert db_scalar("SELECT submitted_count FROM blocks WHERE block_index = 0") == 1
