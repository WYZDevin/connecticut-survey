"""Export completed survey responses to CSV files for analysis.

Usage:
    python scripts/export_responses.py [--out-dir DIR]

Writes submissions.csv (one row per participant, JSONB answers flattened) and
comparisons.csv (one row per pair x prompt judgment, joined with pair images).
Only sessions with status='submitted' are exported.
"""

import argparse
import csv
import os
import sys
from pathlib import Path

from sqlalchemy import create_engine, text

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

SUBMISSIONS_SQL = text(
    """
    SELECT s.id AS session_id, s.block_index, s.created_at, s.submitted_at,
           sub.consent_initials, sub.payment_optout_initials, sub.identifier,
           sub.survey_phase, sub.duration_seconds, sub.user_agent,
           sub.demographic, sub.climate, sub.stress
    FROM sessions s
    JOIN submissions sub ON sub.session_id = s.id
    WHERE s.status = 'submitted'
    ORDER BY s.submitted_at
    """
)

COMPARISONS_SQL = text(
    """
    SELECT cr.session_id, cr.pair_id, cr.prompt_id, cr.choice,
           p.left_image, p.right_image, s.submitted_at
    FROM comparison_responses cr
    JOIN pairs p ON p.pair_id = cr.pair_id
    JOIN sessions s ON s.id = cr.session_id
    WHERE s.status = 'submitted'
    ORDER BY s.submitted_at, p.csv_index, cr.prompt_id
    """
)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out-dir", type=Path, default=Path("export"))
    args = parser.parse_args()

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        from app.config import settings

        database_url = settings.database_url

    args.out_dir.mkdir(parents=True, exist_ok=True)
    engine = create_engine(database_url)

    with engine.connect() as conn:
        rows = conn.execute(SUBMISSIONS_SQL).mappings().all()
        question_ids: list[str] = sorted(
            {k for r in rows for d in (r["demographic"], r["climate"], r["stress"]) for k in d},
            key=lambda q: (len(q), q),  # Q1..Q9 before Q10..
        )
        sub_path = args.out_dir / "submissions.csv"
        with open(sub_path, "w", newline="") as fh:
            writer = csv.writer(fh)
            writer.writerow(
                [
                    "session_id", "block_index", "created_at", "submitted_at",
                    "consent_initials", "payment_optout_initials", "identifier",
                    "survey_phase", "duration_seconds", "user_agent", *question_ids,
                ]
            )
            for r in rows:
                answers = {**r["demographic"], **r["climate"], **r["stress"]}
                writer.writerow(
                    [
                        r["session_id"], r["block_index"], r["created_at"],
                        r["submitted_at"], r["consent_initials"],
                        r["payment_optout_initials"], r["identifier"],
                        r["survey_phase"], r["duration_seconds"], r["user_agent"],
                        *[answers.get(q, "") for q in question_ids],
                    ]
                )

        comp_rows = conn.execute(COMPARISONS_SQL).mappings().all()
        comp_path = args.out_dir / "comparisons.csv"
        with open(comp_path, "w", newline="") as fh:
            writer = csv.writer(fh)
            writer.writerow(
                [
                    "session_id", "pair_id", "prompt_id", "choice",
                    "left_image", "right_image", "submitted_at",
                ]
            )
            for r in comp_rows:
                writer.writerow(
                    [
                        r["session_id"], r["pair_id"], r["prompt_id"], r["choice"],
                        r["left_image"], r["right_image"], r["submitted_at"],
                    ]
                )

    print(f"Wrote {len(rows)} submissions to {sub_path}")
    print(f"Wrote {len(comp_rows)} comparison responses to {comp_path}")


if __name__ == "__main__":
    main()
