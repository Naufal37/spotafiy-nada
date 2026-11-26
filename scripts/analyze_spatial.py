#!/usr/bin/env python3
"""Ukur ciri spasial (10D/HRTF) sebuah file audio.

Dipakai untuk men-model efek dari lagu referensi. Butuh numpy + imageio-ffmpeg:

    python -m pip install numpy imageio-ffmpeg
    python scripts/analyze_spatial.py public/audio/imports/a2o-lite-neon-10d.mp3
"""

import argparse
import subprocess

import imageio_ffmpeg
import numpy as np

SR = 44100


def decode(path: str) -> np.ndarray:
    raw = subprocess.check_output(
        [
            imageio_ffmpeg.get_ffmpeg_exe(),
            "-v",
            "error",
            "-i",
            path,
            "-f",
            "f32le",
            "-ac",
            "2",
            "-ar",
            str(SR),
            "pipe:1",
        ]
    )
    return np.frombuffer(raw, dtype="<f4").reshape(-1, 2)


def lag_corr(a: np.ndarray, b: np.ndarray, max_ms: float) -> tuple[float, float]:
    size = 1 << int(np.ceil(np.log2(len(a) * 2)))
    corr = np.fft.irfft(np.fft.rfft(a, size) * np.conj(np.fft.rfft(b, size)), size)
    lags = np.arange(size)
    lags[lags > size // 2] -= size
    mask = np.abs(lags) <= int(max_ms / 1000 * SR)
    idx = int(np.argmax(np.abs(corr[mask])))
    norm = np.sqrt(np.sum(a * a) * np.sum(b * b)) + 1e-12
    return lags[mask][idx] / SR * 1000, float(corr[mask][idx] / norm)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("file", help="Path file audio yang mau dianalisis")
    args = parser.parse_args()

    x = decode(args.file)
    left, right = x[:, 0], x[:, 1]
    print(f"durasi: {len(x) / SR:.2f}s")

    hop = SR // 2
    count = len(left) // hop
    itds, pans = [], []
    for i in range(count):
        a = left[i * hop : (i + 1) * hop]
        b = right[i * hop : (i + 1) * hop]
        lag, _ = lag_corr(a, b, 2)
        ea, eb = np.sum(a * a), np.sum(b * b)
        itds.append(lag)
        pans.append((eb - ea) / (ea + eb + 1e-12))

    itds = np.array(itds)
    pans = np.array(pans)
    print(f"ITD: {itds.min():+.2f} .. {itds.max():+.2f} ms (std {itds.std():.2f})")
    print(f"pan: {pans.min():+.2f} .. {pans.max():+.2f} (std {pans.std():.2f})")

    for name, values in (("ITD", itds), ("pan", pans)):
        spectrum = np.abs(np.fft.rfft((values - values.mean()) * np.hanning(len(values))))
        freqs = np.fft.rfftfreq(len(values), d=0.5)
        peak = int(np.argmax(spectrum[1:])) + 1
        period = 1 / freqs[peak] if freqs[peak] > 0 else float("inf")
        print(f"{name}: {freqs[peak]:.3f} Hz -> {period:.1f}s per putaran")

    start, end = int(20 * SR), int(40 * SR)
    a, b = left[start:end], right[start:end]
    freqs = np.fft.rfftfreq(len(a), 1 / SR)
    for low, high in ((20, 200), (200, 1000), (1000, 4000), (4000, 12000)):
        fa, fb = np.fft.rfft(a).copy(), np.fft.rfft(b).copy()
        mask = (freqs < low) | (freqs > high)
        fa[mask] = 0
        fb[mask] = 0
        band_a = np.fft.irfft(fa, len(a))
        band_b = np.fft.irfft(fb, len(b))
        lag, coef = lag_corr(band_a, band_b, 2)
        print(f"{low:5d}-{high:5d}Hz: lag {lag:+.2f}ms, korelasi {coef:.2f}")


if __name__ == "__main__":
    main()
