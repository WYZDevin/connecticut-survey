import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Index, Integer, Text, text
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP, UUID
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class Pair(Base):
    __tablename__ = "pairs"

    pair_id: Mapped[str] = mapped_column(Text, primary_key=True)
    csv_index: Mapped[int] = mapped_column(Integer, unique=True)
    block_index: Mapped[int] = mapped_column(Integer)
    left_image: Mapped[str] = mapped_column(Text)
    right_image: Mapped[str] = mapped_column(Text)
    source_csv: Mapped[str] = mapped_column(Text)

    __table_args__ = (Index("ix_pairs_block_index", "block_index"),)


class Block(Base):
    __tablename__ = "blocks"

    block_index: Mapped[int] = mapped_column(Integer, primary_key=True)
    submitted_count: Mapped[int] = mapped_column(Integer, server_default=text("0"))


class SurveySession(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    block_index: Mapped[int] = mapped_column(ForeignKey("blocks.block_index"))
    status: Mapped[str] = mapped_column(Text, server_default=text("'assigned'"))
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()")
    )
    expires_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True))
    submitted_at: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )

    __table_args__ = (Index("ix_sessions_status_expires", "status", "expires_at"),)


class Submission(Base):
    __tablename__ = "submissions"

    session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("sessions.id"), primary_key=True
    )
    consent_initials: Mapped[str] = mapped_column(Text)
    payment_optout_initials: Mapped[str] = mapped_column(Text, server_default=text("''"))
    identifier: Mapped[str] = mapped_column(Text)
    survey_phase: Mapped[int] = mapped_column(Integer)
    demographic: Mapped[dict] = mapped_column(JSONB)
    climate: Mapped[dict] = mapped_column(JSONB)
    stress: Mapped[dict] = mapped_column(JSONB)
    duration_seconds: Mapped[int] = mapped_column(Integer)
    submitted_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()")
    )


class ComparisonResponse(Base):
    __tablename__ = "comparison_responses"

    session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("sessions.id"), primary_key=True
    )
    pair_id: Mapped[str] = mapped_column(ForeignKey("pairs.pair_id"), primary_key=True)
    prompt_id: Mapped[str] = mapped_column(Text, primary_key=True)
    choice: Mapped[str] = mapped_column(Text)
    identifier: Mapped[str] = mapped_column(Text, server_default=text("''"))
