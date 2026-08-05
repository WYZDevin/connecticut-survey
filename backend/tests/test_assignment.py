from sqlalchemy import text

from app.assignment import claim_block
from app.constants import PAIRS_PER_BLOCK
from app.db import SessionLocal
from tests.conftest import block_of_response, make_payload


def backdate(session_id: str) -> None:
    with SessionLocal() as db:
        db.execute(
            text(
                "UPDATE sessions SET expires_at = now() - interval '1 second' "
                "WHERE id = :sid"
            ),
            {"sid": session_id},
        )
        db.commit()


def test_sequential_claims_get_blocks_in_order(client, seed_blocks):
    seed_blocks(3)
    blocks_seen = []
    for _ in range(3):
        res = client.post("/api/sessions")
        assert res.status_code == 201
        body = res.json()
        assert len(body["pairs"]) == PAIRS_PER_BLOCK
        pair_ids = [p["pairId"] for p in body["pairs"]]
        assert pair_ids == sorted(pair_ids)  # csv_index order
        for p in body["pairs"]:
            assert p["leftImageUrl"].startswith("http://testserver/static/images/")
            assert p["rightImageUrl"].startswith("http://testserver/static/images/")
        blocks_seen.append(block_of_response(body))
    assert blocks_seen == [0, 1, 2]


def test_concurrent_claims_never_share_block(seed_blocks):
    seed_blocks(3)
    db1, db2 = SessionLocal(), SessionLocal()
    try:
        # db1 holds an uncommitted lock on its block row; SKIP LOCKED means db2
        # takes a different block without waiting.
        _, _, block1 = claim_block(db1, 60)
        _, _, block2 = claim_block(db2, 60)
        assert block1 != block2
        db1.commit()
        db2.commit()
    finally:
        db1.close()
        db2.close()


def test_expired_reservation_frees_block(client, seed_blocks):
    seed_blocks(3)
    res = client.post("/api/sessions")
    sid = res.json()["sessionId"]
    assert block_of_response(res.json()) == 0

    backdate(sid)
    res2 = client.post("/api/sessions")
    # Expired reservation no longer counts as active, so block 0 wins the tie.
    assert block_of_response(res2.json()) == 0
    with SessionLocal() as db:
        status = db.execute(
            text("SELECT status FROM sessions WHERE id = :sid"), {"sid": sid}
        ).scalar()
    assert status == "expired"


def test_reserved_blocks_reused_only_when_all_busy(client, seed_blocks):
    seed_blocks(2)
    assert block_of_response(client.post("/api/sessions").json()) == 0
    assert block_of_response(client.post("/api/sessions").json()) == 1
    # Every block has a live reservation: fall back to lowest index.
    assert block_of_response(client.post("/api/sessions").json()) == 0


def test_cycle2_starts_after_all_blocks_submitted(client, seed_blocks):
    seed_blocks(2)
    for _ in range(2):
        res = client.post("/api/sessions")
        body = res.json()
        pair_ids = [p["pairId"] for p in body["pairs"]]
        submit = client.post(
            f"/api/sessions/{body['sessionId']}/submit", json=make_payload(pair_ids)
        )
        assert submit.status_code == 201
    res = client.post("/api/sessions")
    assert block_of_response(res.json()) == 0


def test_claim_with_no_blocks_returns_503(client):
    res = client.post("/api/sessions")
    assert res.status_code == 503
