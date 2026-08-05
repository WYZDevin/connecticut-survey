"""Load a pairing CSV into the database and upload referenced images to blob storage.

Usage:
    python scripts/ingest_pairs.py --csv PATH --image-dir PATH [--no-upload] [--source-name NAME]

Idempotent: pairs are upserted by pair_id; blocks are inserted only if missing
(submitted_count is never reset); image uploads skip blobs that already exist
with the same size.
"""

import argparse
import csv
import os
import sys
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy import create_engine, func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.constants import PAIRS_PER_BLOCK  # noqa: E402
from app.models import Block, Pair  # noqa: E402

VALID_EXTS = {".jpg", ".jpeg", ".png"}
CONTENT_TYPES = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png"}


@dataclass
class PairRow:
    pair_id: str
    csv_index: int
    block_index: int
    left_image: str
    right_image: str


def build_filename_index(image_dir: Path) -> tuple[dict[str, str], set[str]]:
    """Map image ID (stem) -> filename; also return stems seen with multiple extensions."""
    index: dict[str, str] = {}
    ambiguous: set[str] = set()
    for f in image_dir.iterdir():
        if not f.is_file() or f.suffix.lower() not in VALID_EXTS:
            continue
        if f.stem in index:
            ambiguous.add(f.stem)
        index[f.stem] = f.name
    return index, ambiguous


def read_pairs(csv_path: Path, index: dict[str, str], ambiguous: set[str]) -> list[PairRow]:
    rows: list[PairRow] = []
    missing: list[str] = []
    ambiguous_used: set[str] = set()
    # utf-8-sig: the source CSV starts with a UTF-8 BOM
    with open(csv_path, encoding="utf-8-sig", newline="") as fh:
        for i, row in enumerate(csv.DictReader(fh)):
            for key in ("left_id", "right_id"):
                image_id = row[key].strip()
                if image_id in ambiguous:
                    ambiguous_used.add(image_id)
                elif image_id not in index:
                    missing.append(image_id)
            rows.append(
                PairRow(
                    pair_id=row["pair_id"].strip(),
                    csv_index=i,
                    block_index=i // PAIRS_PER_BLOCK,
                    left_image=index.get(row["left_id"].strip(), ""),
                    right_image=index.get(row["right_id"].strip(), ""),
                )
            )
    problems = []
    if missing:
        problems.append(f"{len(missing)} image IDs not found: {sorted(set(missing))}")
    if ambiguous_used:
        problems.append(
            f"{len(ambiguous_used)} image IDs ambiguous (multiple extensions): "
            f"{sorted(ambiguous_used)}"
        )
    if problems:
        raise SystemExit("Ingest aborted, nothing written:\n" + "\n".join(problems))
    return rows


def upsert(db: Session, rows: list[PairRow], source_name: str) -> None:
    pair_values = [
        {
            "pair_id": r.pair_id,
            "csv_index": r.csv_index,
            "block_index": r.block_index,
            "left_image": r.left_image,
            "right_image": r.right_image,
            "source_csv": source_name,
        }
        for r in rows
    ]
    stmt = pg_insert(Pair).values(pair_values)
    db.execute(
        stmt.on_conflict_do_update(
            index_elements=["pair_id"],
            set_={
                "csv_index": stmt.excluded.csv_index,
                "block_index": stmt.excluded.block_index,
                "left_image": stmt.excluded.left_image,
                "right_image": stmt.excluded.right_image,
                "source_csv": stmt.excluded.source_csv,
            },
        )
    )
    block_values = [
        {"block_index": b} for b in sorted({r.block_index for r in rows})
    ]
    # DO NOTHING: never reset submitted_count on re-ingest
    db.execute(pg_insert(Block).values(block_values).on_conflict_do_nothing())


def upload_images(image_dir: Path, filenames: set[str]) -> tuple[int, int]:
    from azure.storage.blob import BlobServiceClient, ContentSettings

    conn = os.environ.get("AZURE_STORAGE_CONNECTION_STRING")
    if not conn:
        raise SystemExit(
            "AZURE_STORAGE_CONNECTION_STRING is required to upload (or pass --no-upload)"
        )
    service = BlobServiceClient.from_connection_string(conn)
    container = service.get_container_client("svi")
    uploaded = skipped = 0
    for name in sorted(filenames):
        path = image_dir / name
        blob = container.get_blob_client(name)
        if blob.exists() and blob.get_blob_properties().size == path.stat().st_size:
            skipped += 1
            continue
        with open(path, "rb") as fh:
            blob.upload_blob(
                fh,
                overwrite=True,
                content_settings=ContentSettings(
                    content_type=CONTENT_TYPES[path.suffix.lower()]
                ),
            )
        uploaded += 1
    return uploaded, skipped


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", required=True, type=Path)
    parser.add_argument("--image-dir", required=True, type=Path)
    parser.add_argument("--no-upload", action="store_true")
    parser.add_argument("--source-name", default=None)
    args = parser.parse_args()

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        from app.config import settings

        database_url = settings.database_url

    index, ambiguous = build_filename_index(args.image_dir)
    rows = read_pairs(args.csv, index, ambiguous)
    source_name = args.source_name or args.csv.name

    engine = create_engine(database_url)
    with Session(engine) as db:
        upsert(db, rows, source_name)
        db.commit()
        pair_count = db.scalar(select(func.count()).select_from(Pair))
        block_count = db.scalar(select(func.count()).select_from(Block))

    referenced = {r.left_image for r in rows} | {r.right_image for r in rows}
    jpg = sum(1 for f in referenced if f.lower().endswith((".jpg", ".jpeg")))
    png = sum(1 for f in referenced if f.lower().endswith(".png"))
    print(
        f"Ingested {len(rows)} pairs from {source_name} "
        f"(DB now: {pair_count} pairs, {block_count} blocks); "
        f"{len(referenced)} unique images referenced ({jpg} jpg, {png} png)"
    )

    if args.no_upload:
        print("Skipping blob upload (--no-upload)")
    else:
        uploaded, skipped = upload_images(args.image_dir, referenced)
        print(f"Blob upload: {uploaded} uploaded, {skipped} already present")


if __name__ == "__main__":
    main()
