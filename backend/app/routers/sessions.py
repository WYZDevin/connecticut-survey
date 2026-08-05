import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from ..assignment import claim_block
from ..config import image_url, settings
from ..constants import PAIRS_PER_BLOCK, PROMPT_IDS
from ..db import get_db
from ..models import ComparisonResponse, Pair, Submission, SurveySession
from ..schemas import PairOut, SessionCreateResponse, SubmitRequest, SubmitResponse

router = APIRouter()


@router.post("/sessions", status_code=201, response_model=SessionCreateResponse)
def create_session(db: Session = Depends(get_db)) -> SessionCreateResponse:
    session_id, expires_at, block_index = claim_block(db, settings.session_ttl_minutes)
    pairs = (
        db.execute(
            select(Pair).where(Pair.block_index == block_index).order_by(Pair.csv_index)
        )
        .scalars()
        .all()
    )
    if len(pairs) != PAIRS_PER_BLOCK:
        raise HTTPException(
            status_code=500,
            detail=f"Block {block_index} has {len(pairs)} pairs, expected {PAIRS_PER_BLOCK}",
        )
    db.commit()
    return SessionCreateResponse(
        sessionId=session_id,
        expiresAt=expires_at,
        pairs=[
            PairOut(
                pairId=p.pair_id,
                leftImageUrl=image_url(p.left_image),
                rightImageUrl=image_url(p.right_image),
            )
            for p in pairs
        ],
    )


@router.post(
    "/sessions/{session_id}/submit", status_code=201, response_model=SubmitResponse
)
def submit_survey(
    session_id: uuid.UUID,
    payload: SubmitRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> SubmitResponse:
    session = db.get(SurveySession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status == "submitted":
        raise HTTPException(status_code=409, detail="Session already submitted")
    # An 'expired' session is still accepted: the participant finished late.

    block_pair_ids = (
        db.execute(select(Pair.pair_id).where(Pair.block_index == session.block_index))
        .scalars()
        .all()
    )
    expected = {(pid, prompt) for pid in block_pair_ids for prompt in PROMPT_IDS}
    got: set[tuple[str, str]] = set()
    for c in payload.comparisons:
        cell = (c.pairId, c.promptId)
        if cell in got:
            raise HTTPException(
                status_code=422, detail=f"Duplicate comparison cell: {cell}"
            )
        got.add(cell)
    if got != expected:
        missing = sorted(expected - got)
        extra = sorted(got - expected)
        raise HTTPException(
            status_code=422,
            detail={
                "error": "Comparisons do not match the session's assigned pairs",
                "missing": [f"{p}:{q}" for p, q in missing[:10]],
                "extra": [f"{p}:{q}" for p, q in extra[:10]],
            },
        )

    db.add(
        Submission(
            session_id=session_id,
            consent_initials=payload.consentInitials,
            payment_optout_initials=payload.paymentOptOutInitials,
            identifier=payload.identifier,
            survey_phase=payload.surveyPhase,
            demographic=payload.demographic,
            climate=payload.climate,
            stress=payload.stress,
            duration_seconds=payload.durationSeconds,
            user_agent=request.headers.get("user-agent"),
        )
    )
    for c in payload.comparisons:
        db.add(
            ComparisonResponse(
                session_id=session_id,
                pair_id=c.pairId,
                prompt_id=c.promptId,
                choice=c.choice,
            )
        )
    db.execute(
        text(
            "UPDATE sessions SET status='submitted', submitted_at=now() WHERE id=:sid"
        ),
        {"sid": session_id},
    )
    db.execute(
        text(
            "UPDATE blocks SET submitted_count = submitted_count + 1 "
            "WHERE block_index = :b"
        ),
        {"b": session.block_index},
    )
    db.commit()
    return SubmitResponse()
