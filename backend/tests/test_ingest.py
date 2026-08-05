import pytest
from sqlalchemy import select, text

from app.constants import PAIRS_PER_BLOCK
from app.db import SessionLocal
from app.models import Block, Pair
from scripts.ingest_pairs import build_filename_index, read_pairs, upsert


def write_csv(path, rows):
    # utf-8-sig mirrors the BOM in the real source CSV
    with open(path, "w", encoding="utf-8-sig", newline="") as fh:
        fh.write("pair_id,left_id,right_id\n")
        for pair_id, left, right in rows:
            fh.write(f"{pair_id},{left},{right}\n")


def make_images(dirpath, names):
    for name in names:
        (dirpath / name).write_bytes(b"x")


def test_extension_resolution_and_ignores_non_images(tmp_path):
    make_images(tmp_path, ["a.jpg", "b.png", "desktop.ini", "notes.txt"])
    csv_path = tmp_path / "pairs.csv"
    write_csv(csv_path, [("pair_1", "a", "b")])

    index, ambiguous = build_filename_index(tmp_path)
    assert ambiguous == set()
    assert "desktop" not in index and "notes" not in index

    rows = read_pairs(csv_path, index, ambiguous)
    assert rows[0].left_image == "a.jpg"
    assert rows[0].right_image == "b.png"
    assert rows[0].block_index == 0


def test_missing_id_aborts(tmp_path):
    make_images(tmp_path, ["a.jpg"])
    csv_path = tmp_path / "pairs.csv"
    write_csv(csv_path, [("pair_1", "a", "nonexistent")])
    index, ambiguous = build_filename_index(tmp_path)
    with pytest.raises(SystemExit, match="nonexistent"):
        read_pairs(csv_path, index, ambiguous)


def test_ambiguous_id_aborts(tmp_path):
    make_images(tmp_path, ["a.jpg", "a.png", "b.jpg"])
    csv_path = tmp_path / "pairs.csv"
    write_csv(csv_path, [("pair_1", "a", "b")])
    index, ambiguous = build_filename_index(tmp_path)
    assert ambiguous == {"a"}
    with pytest.raises(SystemExit, match="ambiguous"):
        read_pairs(csv_path, index, ambiguous)


def test_ingest_idempotent_preserves_submitted_count(tmp_path):
    n_rows = 2 * PAIRS_PER_BLOCK
    names = [f"i{n}.jpg" for n in range(4)]
    make_images(tmp_path, names)
    csv_path = tmp_path / "pairs.csv"
    write_csv(
        csv_path,
        [(f"pair_{n}", f"i{n % 4}", f"i{(n + 1) % 4}") for n in range(n_rows)],
    )

    index, ambiguous = build_filename_index(tmp_path)
    rows = read_pairs(csv_path, index, ambiguous)
    assert len(rows) == n_rows

    with SessionLocal() as db:
        upsert(db, rows, "pairs.csv")
        db.commit()
        db.execute(text("UPDATE blocks SET submitted_count = 7 WHERE block_index = 0"))
        db.commit()

        upsert(db, rows, "pairs.csv")
        db.commit()

        pairs = db.execute(select(Pair)).scalars().all()
        blocks = db.execute(select(Block).order_by(Block.block_index)).scalars().all()
        assert len(pairs) == n_rows
        assert [b.block_index for b in blocks] == [0, 1]
        assert blocks[0].submitted_count == 7


def test_reingest_smaller_set_removes_stale_pairless_blocks(tmp_path):
    names = [f"i{n}.jpg" for n in range(4)]
    make_images(tmp_path, names)
    big_csv = tmp_path / "big.csv"
    write_csv(
        big_csv,
        [(f"pair_{n}", f"i{n % 4}", f"i{(n + 1) % 4}") for n in range(2 * PAIRS_PER_BLOCK)],
    )
    small_csv = tmp_path / "small.csv"
    write_csv(
        small_csv,
        [(f"pair_{n}", f"i{n % 4}", f"i{(n + 1) % 4}") for n in range(PAIRS_PER_BLOCK)],
    )

    index, ambiguous = build_filename_index(tmp_path)
    with SessionLocal() as db:
        upsert(db, read_pairs(big_csv, index, ambiguous), "big.csv")
        db.commit()
        # Shrinking to one block re-chunks every pair into block 0; the DELETE
        # for stale pairs isn't ingest's job (pair_1x rows keep block 0 here),
        # but block 1 loses all pairs and must go.
        db.execute(text(f"DELETE FROM pairs WHERE csv_index >= {PAIRS_PER_BLOCK}"))
        db.commit()
        upsert(db, read_pairs(small_csv, index, ambiguous), "small.csv")
        db.commit()
        blocks = db.execute(select(Block).order_by(Block.block_index)).scalars().all()
        assert [b.block_index for b in blocks] == [0]
