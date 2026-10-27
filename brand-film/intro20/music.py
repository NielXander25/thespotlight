"""Original 20s score for The Spotlight brand intro.
100 BPM, A-minor pad world lifting to a C-major reveal at 15.5s.

Sections (s):
  0.0-3.0    intro: low drone + airy pad + sparse glassy plucks (the hook)
  3.0-5.5    turn: pad swells, a soft sub pulse enters
  5.5-12.5   drive: four-on-floor kick, hats, arpeggio + accents on each card
  12.5-15.5  breakdown: pad thins, riser sweeps up into the reveal
  15.5-20.0  reveal: impact hit, full chord, bell motif, slow fade by 20
"""
import sys, wave
import numpy as np

SR = 48000
DUR = 20.0
BEAT = 60 / 100.0        # 0.6 s
BAR = BEAT * 4           # 2.4 s
REVEAL = 15.5
N = int(SR * DUR)
rng = np.random.default_rng(11)
L = np.zeros(N); R = np.zeros(N)

def midi(n): return 440.0 * 2 ** ((n - 69) / 12)

def add(sig, start, pan=0.0, gain=1.0):
    i = int(start * SR)
    if i >= N: return
    sig = sig[: N - i] * gain
    L[i : i + len(sig)] += sig * np.cos((pan + 1) * np.pi / 4)
    R[i : i + len(sig)] += sig * np.sin((pan + 1) * np.pi / 4)

def env(a, d, s, r, length):
    total = int(length * SR)
    e = np.full(total, s, dtype=float)
    ai, di, ri = int(a*SR), int(d*SR), int(r*SR)
    if ai: e[:ai] = np.linspace(0, 1, ai, endpoint=False)
    if di: e[ai:ai+di] = np.linspace(1, s, di, endpoint=False)
    if ri: e[-ri:] *= np.linspace(1, 0, ri)
    return e

def lowpass(x, cutoff):
    a = np.exp(-2*np.pi*cutoff/SR); y = np.empty_like(x); acc = 0.0
    for k in range(len(x)):
        acc = (1-a)*x[k] + a*acc; y[k] = acc
    return y

def pad(freq, length):
    tt = np.arange(int(length*SR))/SR
    x = sum(sum(np.sin(2*np.pi*freq*(1+d/100)*h*tt + rng.random()*6)/h for h in range(1,7))
            for d in (-0.1,-0.04,0,0.05,0.12)) / 5
    return x * env(0.8, 0.5, 0.75, 1.1, length)

def pluck(freq, length=0.9, bright=1.0):
    tt = np.arange(int(length*SR))/SR
    x = (np.sin(2*np.pi*freq*tt)
         + 0.45*bright*np.sin(2*np.pi*freq*2*tt)*np.exp(-tt*9)
         + 0.2*bright*np.sin(2*np.pi*freq*3.01*tt)*np.exp(-tt*14))
    return x * np.exp(-tt*4.5) * np.minimum(1, tt*400)

def bell(freq, length=3.0):
    tt = np.arange(int(length*SR))/SR
    x = sum(a*np.sin(2*np.pi*freq*r*tt)*np.exp(-tt*d)
            for r,a,d in [(1,1.0,1.5),(2.76,0.5,3.0),(5.4,0.25,5.0),(8.93,0.12,7.0)])
    return x * np.minimum(1, tt*300)

def kick():
    tt = np.arange(int(0.4*SR))/SR
    f = 48 + 110*np.exp(-tt*28); ph = 2*np.pi*np.cumsum(f)/SR
    return np.sin(ph)*np.exp(-tt*7.5) + 0.3*np.sin(ph*2)*np.exp(-tt*30)

def noise_hit(length, decay, cutoff):
    n = rng.standard_normal(int(length*SR)); hp = n - lowpass(n, cutoff)
    tt = np.arange(len(n))/SR
    return hp*np.exp(-tt*decay)

# Chords (one per bar): Am - F - C - G
PROG = [[57,60,64,69],[53,57,60,65],[55,60,64,67],[55,59,62,67]]
BASS = [45,41,48,43]

bar = 0
while bar*BAR < REVEAL:
    start = bar*BAR; chord = PROG[bar % 4]
    length = min(BAR+0.8, REVEAL-start+0.4)
    for j,n in enumerate(chord):
        add(pad(midi(n), length), start, pan=(j-1.5)*0.33, gain=0.05)
    if 5.5 <= start < 12.5:
        tt = np.arange(int(BAR*SR))/SR
        add(np.sin(2*np.pi*midi(BASS[bar%4])*tt)*env(0.02,0.3,0.8,0.3,BAR), start, gain=0.2)
    bar += 1

# Low drone under the intro
dl = 6.0; tt = np.arange(int(dl*SR))/SR
add((np.sin(2*np.pi*midi(33)*tt)+0.3*np.sin(2*np.pi*midi(45)*tt))*env(2.2,0.1,1.0,2.0,dl), 0.0, gain=0.16)

# Glassy plucks in the intro / turn
for when,note,pan in [(1.4,76,-0.4),(2.3,72,0.35),(3.6,81,0.3),(4.6,69,-0.3)]:
    add(pluck(midi(note),1.4,0.7), when, pan=pan, gain=0.085)

# Drive 5.5 - 12.5
for k in range(int((12.5-5.5)/BEAT)):
    s = 5.5 + k*BEAT
    if k % 2 == 0: add(kick(), s, gain=0.4)
    if k % 4 in (1,3) and s >= 7.0: add(noise_hit(0.3,18,900), s, gain=0.08)   # clap
    for half in (0.0, BEAT/2):
        add(noise_hit(0.07,60,6000), s+half, pan=0.25, gain=0.03 if half else 0.018)

# Arpeggio 6.5 - 12.5
step = BEAT/2; k = 0
while 6.5 + k*step < 12.5:
    s = 6.5 + k*step; chord = PROG[int(s/BAR)%4]
    note = chord[[0,2,1,3,2,1][k%6]] + 12
    add(pluck(midi(note),0.5,1.0), s, pan=0.5 if k%2 else -0.5, gain=0.05)
    k += 1

# Card accents (6 cards, ~1.1s apart from 6.0)
for i,when in enumerate([6.3,7.4,8.5,9.6,10.7,11.8]):
    add(bell(midi([72,76,79,72,76,81][i]),1.2), when, pan=(i%2*2-1)*0.3, gain=0.045)

# Breakdown riser 13.0 -> reveal
rl = REVEAL-13.0; tt = np.arange(int(rl*SR))/SR
ramp = (tt/rl)**2; n = rng.standard_normal(len(tt))
riser = (n - lowpass(n, 300+4000*ramp.mean()))*ramp
sweep = np.sin(2*np.pi*np.cumsum(220+700*ramp)/SR)*ramp*0.4
add(riser*0.6 + sweep, 13.0, gain=0.12)

# Reveal
add(kick(), REVEAL, gain=0.6)
tt = np.arange(int(4.5*SR))/SR
add(np.sin(2*np.pi*38*tt)*np.exp(-tt*1.3), REVEAL, gain=0.34)
add(noise_hit(2.5,2.2,1500), REVEAL, gain=0.08)
final = [[53,57,60,67,72],[48,55,60,64,67,72]]
for idx,chord in enumerate(final):
    s = REVEAL + idx*BAR; length = BAR + (4.5 if idx==1 else 0.8)
    for j,n in enumerate(chord):
        add(pad(midi(n), length), s, pan=(j-2)*0.3, gain=0.05)
    tt2 = np.arange(int(length*SR))/SR
    add(np.sin(2*np.pi*midi(chord[0]-12)*tt2)*env(0.02,0.5,0.7,2.0,length), s, gain=0.2)
for when,note in [(REVEAL,84),(REVEAL+BEAT,79),(REVEAL+2*BEAT,76),(REVEAL+BAR,72)]:
    add(bell(midi(note),3.0), when, pan=0.12, gain=0.07)

def room(x, other):
    y = x.copy()
    for d,g in [(0.031,0.22),(0.053,0.16),(0.089,0.11),(0.137,0.07)]:
        i = int(d*SR); y[i:] += other[:-i]*g
    return y

mix = np.stack([room(L,R), room(R,L)], axis=1)
fade = np.ones(N); fs = int(18.2*SR); fade[fs:] = np.linspace(1,0,N-fs)**1.5
mix *= fade[:,None]; mix /= np.max(np.abs(mix))+1e-9; mix *= 0.89
with wave.open(sys.argv[1],"wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix*32767).astype("<i2").tobytes())
print("wrote", sys.argv[1])
