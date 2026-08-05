import uuid
from datetime import datetime

from sqlalchemy import text
from sqlalchemy.orm import Session

EXPIRE_SQL = text(
    "UPDATE sessions SET status='expired' "
    "WHERE status='assigned' AND expires_at < now()"
)

# SKIP LOCKED: a concurrent claimant skips the block row another open
# transaction holds and takes the next-best block, so two live participants
# never share a block. Only b is locked (the non-nullable side of the join).
CLAIM_SQL = text(
    """
    SELECT b.block_index
    FROM blocks b
    LEFT JOIN LATERAL (
      SELECT count(*) AS active
      FROM sessions s
      WHERE s.block_index = b.block_index AND s.status = 'assigned'
    ) a ON true
    ORDER BY b.submitted_count + a.active, b.block_index
    LIMIT 1
    FOR UPDATE OF b SKIP LOCKED
    """
)

# expires_at uses DB now() so it is consistent with EXPIRE_SQL's predicate.
INSERT_SESSION_SQL = text(
    """
    INSERT INTO sessions (block_index, expires_at)
    VALUES (:block_index, now() + make_interval(mins => :ttl))
    RETURNING id, expires_at
    """
)


class NoBlockAvailable(Exception):
    pass


def claim_block(db: Session, ttl_minutes: int) -> tuple[uuid.UUID, datetime, int]:
    """Claim the best available block and create a session reservation.

    Runs on the caller's transaction; the caller commits.
    """
    db.execute(EXPIRE_SQL)
    row = db.execute(CLAIM_SQL).first()
    if row is None:
        raise NoBlockAvailable
    session_id, expires_at = db.execute(
        INSERT_SESSION_SQL,
        {"block_index": row.block_index, "ttl": ttl_minutes},
    ).one()
    return session_id, expires_at, row.block_index
