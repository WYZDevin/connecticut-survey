import os
from pathlib import Path

# Must be set before any `app.*` import: Settings and the engine are created at
# import time. Real env vars override values from backend/.env.
TEST_DATABASE_URL = "postgresql+psycopg://survey:survey@localhost:5434/survey_test"
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["IMAGE_BASE_URL"] = "http://testserver/static/images"
os.environ["SESSION_TTL_MINUTES"] = "60"

import psycopg  # noqa: E402
import pytest  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app.constants import PAIRS_PER_BLOCK, PROMPT_IDS  # noqa: E402
from app.db import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Block, Pair  # noqa: E402

BACKEND_DIR = Path(__file__).resolve().parent.parent


@pytest.fixture(scope="session", autouse=True)
def _database():
    with psycopg.connect(
        "postgresql://survey:survey@localhost:5434/survey", autocommit=True
    ) as conn:
        exists = conn.execute(
            "SELECT 1 FROM pg_database WHERE datname = 'survey_test'"
        ).fetchone()
        if not exists:
            conn.execute("CREATE DATABASE survey_test")
    cfg = Config(str(BACKEND_DIR / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    command.upgrade(cfg, "head")


@pytest.fixture(autouse=True)
def _clean_tables(_database):
    yield
    with SessionLocal() as db:
        db.execute(
            text(
                "TRUNCATE comparison_responses, submissions, sessions, pairs, blocks CASCADE"
            )
        )
        db.commit()


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def seed_blocks():
    def _seed(n_blocks: int) -> None:
        with SessionLocal() as db:
            for b in range(n_blocks):
                db.add(Block(block_index=b))
                for i in range(PAIRS_PER_BLOCK):
                    idx = b * PAIRS_PER_BLOCK + i
                    db.add(
                        Pair(
                            pair_id=f"p{idx:04d}",
                            csv_index=idx,
                            block_index=b,
                            left_image=f"img{idx}_L.jpg",
                            right_image=f"img{idx}_R.jpg",
                            source_csv="test.csv",
                        )
                    )
            db.commit()

    return _seed


def make_payload(pair_ids: list[str]) -> dict:
    return {
        "paymentOptOutInitials": "",
        "identifier": "test@example.com",
        "surveyPhase": 1,
        "demographic": {"Q1": "25-34", "Q2": "Female", "Q3": "Bachelor's degree"},
        "climate": {"Q4": 4, "Q5": 3, "Q6": 1},
        "stress": {"Q10": 2, "Q11": 3, "Q12": 2, "Q13": 1, "Q14": 4},
        "durationSeconds": 800,
        "comparisons": [
            {"pairId": pid, "promptId": prompt, "choice": "left"}
            for pid in pair_ids
            for prompt in PROMPT_IDS
        ],
    }


def block_of_response(body: dict) -> int:
    """Infer the assigned block from seeded pair ids (p0000..p0009 -> block 0)."""
    first = body["pairs"][0]["pairId"]
    return int(first[1:]) // PAIRS_PER_BLOCK
