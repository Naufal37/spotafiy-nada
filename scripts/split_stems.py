"""Pisahkan vokal dan instrumen dari MP3 di public/audio/imports.

Contoh:
    python scripts/split_stems.py public/audio/imports/illit-magnetic.mp3

Output:
    public/audio/imports/illit-magnetic_vocals.mp3
    public/audio/imports/illit-magnetic_no_vocals.mp3
    + cuplikan JSON untuk manifest.json
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMPORTS = ROOT / "public" / "audio" / "imports"


def ffmpeg_exe() -> str | None:
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return shutil.which("ffmpeg")


def to_mp3(source: Path, target: Path) -> None:
    ffmpeg = ffmpeg_exe()
    if ffmpeg:
        subprocess.run(
            [
                ffmpeg,
                "-y",
                "-loglevel",
                "error",
                "-i",
                str(source),
                "-codec:a",
                "libmp3lame",
                "-b:a",
                "192k",
                str(target),
            ],
            check=True,
        )
    else:
        # Fallback: WAV tetap bisa diputar browser, tapi ukurannya jauh lebih besar.
        fallback = target.with_suffix(".wav")
        shutil.copy2(source, fallback)
        print(f"ffmpeg tidak ada; pakai WAV: {fallback.name}")


def main() -> int:
    if len(sys.argv) != 2:
        print("Pakai: python scripts/split_stems.py <file.mp3>")
        return 1

    source = Path(sys.argv[1]).resolve()
    if not source.is_file():
        print(f"File tidak ditemukan: {source}")
        return 1

    work = ROOT / ".demucs-tmp"
    work.mkdir(exist_ok=True)

    subprocess.run(
        [
            sys.executable,
            "-m",
            "demucs",
            "--two-stems=vocals",
            "-n",
            "htdemucs",
            "--out",
            str(work),
            str(source),
        ],
        check=True,
    )

    stem_dir = work / "htdemucs" / source.stem
    vocals = stem_dir / "vocals.wav"
    instrumental = stem_dir / "no_vocals.wav"
    if not vocals.is_file() or not instrumental.is_file():
        print("Demucs tidak menghasilkan kedua stem.")
        return 1

    base = source.stem
    vocals_out = IMPORTS / f"{base}_vocals.mp3"
    instrumental_out = IMPORTS / f"{base}_no_vocals.mp3"
    to_mp3(vocals, vocals_out)
    to_mp3(instrumental, instrumental_out)

    print("\nTambahkan ke entri manifest.json:")
    print(
        json.dumps(
            {
                "stems": {
                    "vocals": vocals_out.name,
                    "instrumental": instrumental_out.name,
                }
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
