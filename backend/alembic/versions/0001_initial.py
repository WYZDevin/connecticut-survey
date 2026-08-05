"""Initial schema: pairs, blocks, sessions, submissions, comparison_responses

Revision ID: 0001
Revises:
Create Date: 2026-08-04

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "pairs",
        sa.Column("pair_id", sa.Text(), primary_key=True),
        sa.Column("csv_index", sa.Integer(), nullable=False, unique=True),
        sa.Column("block_index", sa.Integer(), nullable=False),
        sa.Column("left_image", sa.Text(), nullable=False),
        sa.Column("right_image", sa.Text(), nullable=False),
        sa.Column("source_csv", sa.Text(), nullable=False),
    )
    op.create_index("ix_pairs_block_index", "pairs", ["block_index"])

    op.create_table(
        "blocks",
        sa.Column("block_index", sa.Integer(), primary_key=True),
        sa.Column(
            "submitted_count", sa.Integer(), nullable=False, server_default=sa.text("0")
        ),
    )

    op.create_table(
        "sessions",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "block_index",
            sa.Integer(),
            sa.ForeignKey("blocks.block_index"),
            nullable=False,
        ),
        sa.Column(
            "status", sa.Text(), nullable=False, server_default=sa.text("'assigned'")
        ),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("expires_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("submitted_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.create_index("ix_sessions_status_expires", "sessions", ["status", "expires_at"])

    op.create_table(
        "submissions",
        sa.Column(
            "session_id", UUID(as_uuid=True), sa.ForeignKey("sessions.id"), primary_key=True
        ),
        sa.Column("consent_initials", sa.Text(), nullable=False),
        sa.Column(
            "payment_optout_initials",
            sa.Text(),
            nullable=False,
            server_default=sa.text("''"),
        ),
        sa.Column("identifier", sa.Text(), nullable=False),
        sa.Column("survey_phase", sa.Integer(), nullable=False),
        sa.Column("demographic", JSONB(), nullable=False),
        sa.Column("climate", JSONB(), nullable=False),
        sa.Column("stress", JSONB(), nullable=False),
        sa.Column("duration_seconds", sa.Integer(), nullable=False),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column(
            "submitted_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    op.create_table(
        "comparison_responses",
        sa.Column(
            "session_id", UUID(as_uuid=True), sa.ForeignKey("sessions.id"), primary_key=True
        ),
        sa.Column(
            "pair_id", sa.Text(), sa.ForeignKey("pairs.pair_id"), primary_key=True
        ),
        sa.Column("prompt_id", sa.Text(), primary_key=True),
        sa.Column("choice", sa.Text(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("comparison_responses")
    op.drop_table("submissions")
    op.drop_table("sessions")
    op.drop_table("pairs")
    op.drop_table("blocks")
