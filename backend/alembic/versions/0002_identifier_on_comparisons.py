"""Drop submissions.user_agent; record identifier on each comparison row

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-05

"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "comparison_responses",
        sa.Column("identifier", sa.Text(), nullable=False, server_default=sa.text("''")),
    )
    # Backfill rows that were submitted before this migration.
    op.execute(
        "UPDATE comparison_responses cr SET identifier = s.identifier "
        "FROM submissions s WHERE s.session_id = cr.session_id"
    )
    op.drop_column("submissions", "user_agent")


def downgrade() -> None:
    op.add_column("submissions", sa.Column("user_agent", sa.Text(), nullable=True))
    op.drop_column("comparison_responses", "identifier")
