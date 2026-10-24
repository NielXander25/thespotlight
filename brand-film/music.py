"""Original score for The Spotlight brand film. 96 BPM, 40 s, A minor -> C major lift.

Sections (seconds):
  0-10     intro: drone + pad + sparse glassy plucks
  10-25    groove: kick/clap/hats + arpeggio enters
  25-31.25 breakdown: pad only + riser into the reveal
  31.25-   reveal: impact hit, full chord, bell motif, fade out by 40
"""
import sys
import wave

import numpy as np

SR = 48000
DUR = 40.0
BPM = 96
BEAT = 60 / BPM          # 0.625 s
BAR = BEAT * 4           # 2.5 s
N = int(SR * DUR)
t_all = np.arange(N) / SR
rng = np.random.default_rng(7)

L = np.zeros(N)
R = np.zeros(N)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def add(sig, start, pan=0.0, gain=1.0):
    i = int(start * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i : i + len(sig)] += sig * np.cos((pan + 1) * np.pi / 4)
    R[i : i + len(sig)] += sig * np.sin((pan + 1) * np.pi / 4)


def env(n, a, d, s, r, length):
    """ADSR envelope in seconds over `length` seconds."""
    total = int(length * SR)
    e = np.full(total, s, dtype=float)
    ai, di, ri = int(a * SR), int(d * SR), int(r * SR)
    e[:ai] = np.linspace(0, 1, ai, endpoint=False) if ai else e[:ai]
    e[ai : ai + di] = np.linspace(1, s, di, endpoint=False)
    if ri:
        e[-ri:] *= np.linspace(1, 0, ri)
    return e


def lowpass(x, cutoff):
    """One-pole low-pass, cheap and smooth."""
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for k in range(len(x)):
        acc = (1 - a) * x[k] + a * acc
        y[k] = acc
    return y


def pad_note(freq, length):
    tt = np.arange(int(length * SR)) / SR
    detunes = [-0.12, -0.05, 0.0, 0.06, 0.13]
    x = sum(
        # band-limited-ish saw from a few harmonics
        sum(np.sin(2 * np.pi * freq * (1 + d / 100) * h * tt + rng.random() * 6) / h for h in range(1, 7))
        for d in detunes
    ) / len(detunes)
    return x * env(None, 0.9, 0.5, 0.75, 1.2, length)


def pluck(freq, length=0.9, bright=1.0):
    tt = np.arange(int(length * SR)) / SR
    x = (np.sin(2 * np.pi * freq * tt)
         + 0.45 * bright * np.sin(2 * np.pi * freq * 2 * tt) * np.exp(-tt * 9)
         + 0.2 * bright * np.sin(2 * np.pi * freq * 3.01 * tt) * np.exp(-tt * 14))
    return x * np.exp(-tt * 4.5) * np.minimum(1, tt * 400)


def bell(freq, length=3.0):
    tt = np.arange(int(length * SR)) / SR
    ratios = [(1, 1.0, 1.6), (2.76, 0.5, 3.0), (5.4, 0.25, 5.0), (8.93, 0.12, 7.0)]
    x = sum(a * np.sin(2 * np.pi * freq * r * tt) * np.exp(-tt * d) for r, a, d in ratios)
    return x * np.minimum(1, tt * 300)


def kick():
    tt = np.arange(int(0.45 * SR)) / SR
    f = 48 + 110 * np.exp(-tt * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-tt * 7.5) + 0.3 * np.sin(ph * 2) * np.exp(-tt * 30)


def noise_hit(length, decay, cutoff):
    n = rng.standard_normal(int(length * SR))
    hp = n - lowpass(n, cutoff)
    tt = np.arange(len(n)) / SR
    return hp * np.exp(-tt * decay)


def clap():
    x = noise_hit(0.3, 18, 900)
    for off in (0.008, 0.017):  # flam for a clap feel
        i = int(off * SR)
        x[i:] += noise_hit(0.3, 22, 900)[: len(x) - i] * 0.6
    return x


# Chord progression (one chord per bar): Am - F - C - G, lifting to F - C at the end.
PROG = [
    [57, 60, 64, 69],   # Am
    [53, 57, 60, 65],   # F
    [55, 60, 64, 67],   # C
    [55, 59, 62, 67],   # G
]
BASS = [45, 41, 48, 43]

# --- Pad + bass across the whole piece (except the reveal, handled below)
reveal = 12.5 * BAR  # 31.25 s
bar = 0
while bar * BAR < reveal:
    start = bar * BAR
    chord = PROG[bar % 4]
    length = min(BAR + 1.0, reveal - start + 0.4)
    for j, n in enumerate(chord):
        add(pad_note(midi(n), length), start, pan=(j - 1.5) * 0.35, gain=0.05)
    if start >= 10.0 and start < 25.0:
        tt = np.arange(int(BAR * SR)) / SR
        b = np.sin(2 * np.pi * midi(BASS[bar % 4]) * tt) * env(None, 0.02, 0.3, 0.8, 0.3, BAR)
        add(b, start, gain=0.22)
    bar += 1

# Low drone under the intro
drone_len = 10.5
tt = np.arange(int(drone_len * SR)) / SR
drone = (np.sin(2 * np.pi * midi(33) * tt) + 0.3 * np.sin(2 * np.pi * midi(45) * tt)) * env(None, 3.0, 0.1, 1.0, 2.0, drone_len)
add(drone, 0.0, gain=0.16)

# Sparse glassy plucks in the intro, on key VO moments
for when, note, pan in [(2.0, 76, -0.4), (3.25, 72, 0.4), (4.5, 69, -0.2), (6.5, 81, 0.3), (8.75, 64, -0.3)]:
    add(pluck(midi(note), 1.6, bright=0.7), when, pan=pan, gain=0.09)

# --- Groove 10 - 25 s
for k in range(int((25.0 - 10.0) / BEAT)):
    s = 10.0 + k * BEAT
    if k % 4 in (0, 2):
        add(kick(), s, gain=0.42)
    if k % 4 in (1, 3) and s >= 12.5:
        add(clap(), s, gain=0.10)
    for half in (0.0, BEAT / 2):
        add(noise_hit(0.08, 60, 6000), s + half, pan=0.25, gain=0.035 if half else 0.02)

# Arpeggio (16ths) 12.5 - 25 s, follows the chord
step = BEAT / 2
k = 0
while 12.5 + k * step < 25.0:
    s = 12.5 + k * step
    chord = PROG[int(s / BAR) % 4]
    note = chord[[0, 2, 1, 3, 2, 1][k % 6]] + 12
    add(pluck(midi(note), 0.5, bright=1.0), s, pan=0.5 if k % 2 else -0.5, gain=0.055)
    k += 1

# Accent plucks on "builders / creators / researchers / leaders"
for when, note in [(16.71, 76), (17.67, 79), (18.84, 81), (19.92, 84)]:
    add(bell(midi(note), 1.5), when, pan=0.0, gain=0.05)

# --- Breakdown riser 28.0 -> reveal
rise_len = reveal - 28.0
tt = np.arange(int(rise_len * SR)) / SR
n = rng.standard_normal(len(tt))
ramp = (tt / rise_len) ** 2
riser = (n - lowpass(n, 300 + 5000 * ramp.mean())) * ramp
sweep = np.sin(2 * np.pi * np.cumsum(220 + 660 * ramp) / SR) * ramp * 0.4
add(riser * 0.6 + sweep, 28.0, gain=0.12)

# --- Reveal at 31.25 s: impact + big F(add9) -> C chord + bell motif
add(kick(), reveal, gain=0.6)
tt = np.arange(int(4.0 * SR)) / SR
boom = np.sin(2 * np.pi * 38 * tt) * np.exp(-tt * 1.4)
add(boom, reveal, gain=0.35)
add(noise_hit(2.5, 2.2, 1500), reveal, gain=0.08)

final = [[53, 57, 60, 67, 72], [48, 55, 60, 64, 67, 72]]
for idx, chord in enumerate(final):
    s = reveal + idx * BAR
    length = BAR + (5.0 if idx == 1 else 1.0)
    for j, n in enumerate(chord):
        add(pad_note(midi(n), length), s, pan=(j - 2) * 0.3, gain=0.05)
    tt2 = np.arange(int(length * SR)) / SR
    add(np.sin(2 * np.pi * midi(chord[0] - 12) * tt2) * env(None, 0.02, 0.5, 0.7, 2.0, length), s, gain=0.2)

for when, note in [(reveal, 84), (reveal + BEAT, 79), (reveal + 2 * BEAT, 76), (reveal + BAR, 72), (reveal + BAR + 1.5 * BEAT, 76), (reveal + BAR + 3 * BEAT, 79)]:
    add(bell(midi(note), 3.0), when, pan=0.15, gain=0.07)

# --- Simple stereo "room": a few short delays, then normalize + fade out
def room(x, other):
    y = x.copy()
    for d, g in [(0.031, 0.22), (0.053, 0.16), (0.089, 0.11), (0.137, 0.07)]:
        i = int(d * SR)
        y[i:] += other[:-i] * g
    return y

L2, R2 = room(L, R), room(R, L)
mix = np.stack([L2, R2], axis=1)
fade = np.ones(N)
fade_start = int(37.0 * SR)
fade[fade_start:] = np.linspace(1, 0, N - fade_start) ** 1.5
mix *= fade[:, None]
mix /= np.max(np.abs(mix)) + 1e-9
mix *= 0.89

out = sys.argv[1]
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("wrote", out)
