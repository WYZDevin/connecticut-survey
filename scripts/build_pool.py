"""
Build a 500-image pool from Processed_SVI_NEUS for the survey.

Strategy: at least 2 images per county, then distribute the remainder
randomly across counties so every county is represented and the total
hits TARGET_COUNT.

Filters: size == (1920, 1080), mode == 'RGB'.
Transform: center-crop to 80% (-> 1536 x 864).
Output: public/svi_neus/1.jpg ... 500.jpg, with DPI=(96, 96), JPEG quality 92.

Source images are not modified. Existing public/svi/ pool is untouched.
The destination directory is cleared at the start of each run.
"""

import random
import sys
from pathlib import Path

from PIL import Image

SOURCE = Path(r"C:\Users\21139\Downloads\Processed_SVI_NEUS")
DEST = Path(__file__).resolve().parent.parent / "public" / "svi_neus"

TARGET_COUNT = 500
PER_COUNTY = 2
TARGET_SIZE = (1920, 1080)
CROP_RATIO = 0.8
JPEG_QUALITY = 92
OUTPUT_DPI = (96, 96)
SEED = 42


def collect_county_jpgs(root: Path) -> dict[Path, list[Path]]:
    counties: dict[Path, list[Path]] = {}
    for state in root.iterdir():
        if not state.is_dir():
            continue
        for county in state.iterdir():
            if not county.is_dir():
                continue
            jpgs = list(county.glob("*.jpg"))
            if jpgs:
                counties[county] = jpgs
    return counties


def is_eligible(path: Path) -> bool:
    try:
        with Image.open(path) as im:
            return im.size == TARGET_SIZE and im.mode == "RGB"
    except Exception:
        return False


def pick_n_eligible(
    jpgs: list[Path], n: int, rng: random.Random, exclude: set[Path] | None = None
) -> list[Path]:
    """Shuffle then take first n eligible images, skipping any in `exclude`."""
    pool = [p for p in jpgs if exclude is None or p not in exclude]
    rng.shuffle(pool)
    picked: list[Path] = []
    for p in pool:
        if len(picked) >= n:
            break
        if is_eligible(p):
            picked.append(p)
    return picked


def center_crop(im: Image.Image, ratio: float) -> Image.Image:
    w, h = im.size
    nw, nh = int(round(w * ratio)), int(round(h * ratio))
    left = (w - nw) // 2
    top = (h - nh) // 2
    return im.crop((left, top, left + nw, top + nh))


def main() -> None:
    if not SOURCE.exists():
        sys.exit(f"Source not found: {SOURCE}")

    rng = random.Random(SEED)

    print(f"Scanning {SOURCE}...", flush=True)
    county_files = collect_county_jpgs(SOURCE)
    counties = sorted(county_files.keys())
    total_jpgs = sum(len(v) for v in county_files.values())
    print(f"  {len(counties)} counties, {total_jpgs:,} jpg files", flush=True)

    selected_by_county: dict[Path, list[Path]] = {}
    print(f"\nBase pass: {PER_COUNTY} per county...", flush=True)
    short_counties: list[Path] = []
    for i, c in enumerate(counties, 1):
        picks = pick_n_eligible(county_files[c], PER_COUNTY, rng)
        selected_by_county[c] = picks
        if len(picks) < PER_COUNTY:
            short_counties.append(c)
        if i % 25 == 0:
            base = sum(len(v) for v in selected_by_county.values())
            print(f"  ... {i}/{len(counties)} counties (running base: {base})", flush=True)

    base_count = sum(len(v) for v in selected_by_county.values())
    print(f"  base total: {base_count} images", flush=True)
    if short_counties:
        print(
            f"  WARN: {len(short_counties)} counties had < {PER_COUNTY} eligible "
            f"({[c.name for c in short_counties]})",
            flush=True,
        )

    remainder = TARGET_COUNT - base_count
    if remainder > 0:
        print(f"\nFilling remainder: {remainder} extras...", flush=True)
        candidates = [
            c for c in counties if len(county_files[c]) > len(selected_by_county[c])
        ]
        rng.shuffle(candidates)
        added = 0
        for c in candidates:
            if added >= remainder:
                break
            extra = pick_n_eligible(
                county_files[c],
                1,
                rng,
                exclude=set(selected_by_county[c]),
            )
            if extra:
                selected_by_county[c].extend(extra)
                added += 1
        print(f"  added {added}", flush=True)

    all_selected = [p for picks in selected_by_county.values() for p in picks]
    rng.shuffle(all_selected)
    print(f"\nFinal selection: {len(all_selected)} images", flush=True)

    if len(all_selected) < TARGET_COUNT:
        sys.exit(
            f"Only got {len(all_selected)}/{TARGET_COUNT}; not enough eligible images"
        )
    all_selected = all_selected[:TARGET_COUNT]

    print(f"\nClearing {DEST}...", flush=True)
    DEST.mkdir(parents=True, exist_ok=True)
    for old in DEST.glob("*.jpg"):
        old.unlink()

    out_w = int(round(TARGET_SIZE[0] * CROP_RATIO))
    out_h = int(round(TARGET_SIZE[1] * CROP_RATIO))
    print(f"Processing {len(all_selected)} images -> {DEST}", flush=True)
    for i, src in enumerate(all_selected, 1):
        with Image.open(src) as im:
            cropped = center_crop(im, CROP_RATIO)
            cropped.save(
                DEST / f"{i}.jpg",
                "JPEG",
                quality=JPEG_QUALITY,
                dpi=OUTPUT_DPI,
                optimize=True,
            )
        if i % 50 == 0:
            print(f"  saved {i}/{TARGET_COUNT}", flush=True)

    counts = sorted((len(v) for v in selected_by_county.values()), reverse=True)
    distribution = {n: counts.count(n) for n in sorted(set(counts))}
    print(
        f"\nDone. Pool ready at: {DEST}\n"
        f"  {TARGET_COUNT} images, {out_w}x{out_h}, 96 DPI, JPEG q{JPEG_QUALITY}\n"
        f"  per-county distribution: {distribution}",
        flush=True,
    )


if __name__ == "__main__":
    main()
