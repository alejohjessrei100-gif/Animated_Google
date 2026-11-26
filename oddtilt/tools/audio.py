"""Synthesise frame-accurate foley + a pizzicato music bed and mix with the voiceover.
Usage: python3 tools/audio.py public/voice.wav public/mix.wav
Levels follow the style bible: VO ~-2 dB, foley ~-8 dB, music ~-20 dB."""
import sys, wave, numpy as np
SR = 44100; FPS = 30
rng = np.random.default_rng(7)

def read(p):
    with wave.open(p) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        if w.getnchannels() == 2: a = a.reshape(-1, 2).mean(1)
        return a
def t(d): return np.arange(int(d * SR)) / SR
def env(n, a=0.002, d=0.2):
    x = np.arange(n) / SR; return np.minimum(1, x / a) * np.exp(-x / d)
def lp(x, k=8):  # cheap low-pass
    return np.convolve(x, np.ones(k) / k, mode='same')
def noise(d): return rng.uniform(-1, 1, int(d * SR))

def knock(): x = t(0.12); return (np.sin(2*np.pi*140*x) * 0.8 + lp(noise(0.12), 20)) * env(len(x), 0.001, 0.025)
def step(): x = t(0.08); return lp(noise(0.08), 30) * env(len(x), 0.001, 0.02) * 0.5
def bell(f0=880, d=1.2, amp=1.0):
    x = t(d); parts = [(1, 1), (2.76, 0.5), (5.4, 0.25), (8.9, 0.12)]
    return amp * sum(a * np.sin(2*np.pi*f0*r*x) * np.exp(-x * (2 + r)) for r, a in parts) * np.minimum(1, x / 0.002)
def ding(): return bell(1320, 0.7, 0.6)
def pop(): x = t(0.09); f = 300 + 900 * x / 0.09; return np.sin(2*np.pi*np.cumsum(f)/SR) * env(len(x), 0.001, 0.03)
def whoosh(d, up=True):
    n = noise(d); x = t(d); e = np.sin(np.pi * x / d) ** 2
    return lp(n, 12) * e * 0.8
def crash(): x = t(0.6); return (lp(noise(0.6), 6) * 0.9 + np.sin(2*np.pi*70*x)) * env(len(x), 0.002, 0.15)
def zap(d):
    x = t(d); sq = np.sign(np.sin(2*np.pi*120*x)) * 0.4 + noise(d) * (rng.uniform(0, 1, len(x)) > 0.7) * 0.8
    return sq * np.minimum(1, x / 0.01) * np.minimum(1, (d - x) / 0.03)
def thud(): x = t(0.35); return (np.sin(2*np.pi*55*x) + lp(noise(0.35), 40) * 0.6) * env(len(x), 0.002, 0.08)
def snap(): x = t(0.12); return noise(0.12) * env(len(x), 0.0005, 0.015) * 1.2
def fallwhistle(d):
    x = t(d); f = 1800 - 1300 * x / d; return np.sin(2*np.pi*np.cumsum(f)/SR) * 0.35
def click(): x = t(0.03); return noise(0.03) * env(len(x), 0.0005, 0.004) * 0.8
def hum(d): x = t(d); return (np.sin(2*np.pi*60*x) + 0.5*np.sin(2*np.pi*120*x)) * 0.25 * np.minimum(1, x/0.05) * np.minimum(1, (d-x)/0.05)
def ringer(d, rate=16):
    out = np.zeros(int(d*SR)); b = bell(1000, 0.25, 0.5)
    for k in range(int(d * rate)):
        i = int(k / rate * SR); seg = b[:len(out)-i]; out[i:i+len(seg)] += seg
    return out
def gasp(): x = t(0.25); return lp(noise(0.25), 5) * np.sin(np.pi*x/0.25) * 0.5

L = lambda fr: int(fr / FPS * SR)
voice = read(sys.argv[1]); N = len(voice)
fx = np.zeros(N)
def add(fr, s, g=1.0):
    i = L(fr); s = np.asarray(s)[:max(0, N - i)]; fx[i:i+len(s)] += s * g

for fr in (3, 11, 19, 27): add(fr, step())
for fr in (40, 47, 54): add(fr, knock())
add(84, knock(), 0.6)
add(104, whoosh(0.8), 0.5)             # inhale
add(134, whoosh(1.0), 1.0)             # blow
add(141, crash())
add(167, ding())                       # Genius!
add(232, zap(0.4))
add(245, thud())
for fr in (275, 311, 442, 466, 518, 604, 722): add(fr, pop(), 0.8)
add(326, bell(700, 1.4, 0.9))
add(335, ding())                       # Clever!
add(367, snap())
add(387, fallwhistle(10/30))
add(397, np.pad(thud(), (0, SR))[:SR] + bell(520, 1.0, 1.0))
for fr in range(449, 470, 2): add(fr, click(), 0.4)
for fr in range(487, 516, 3): add(fr, click(), 0.6)
add(557, hum(79/30), 0.8)
add(619, bell(1000, 0.9, 0.8))
add(638, ding())                       # Genius!
for fr in (665, 684, 694): add(fr, click())
add(668, bell(1000, 0.9, 0.7))
for fr in (740, 760): add(fr, click()); add(fr + 3, bell(1000, 0.5, 0.5)); add(fr + 3, zap(0.08), 0.5)
add(776, ringer((960 - 776) / 30), 0.55)
add(862, pop(), 0.6)
add(870, gasp())
add(895, thud(), 0.6)
add(915, click(), 1.0)

# pizzicato music bed (C major, 120 bpm), ducked under VO
def pluck(freq, d=0.35):
    x = t(d); return (np.sin(2*np.pi*freq*x) + 0.3*np.sin(4*np.pi*freq*x)) * env(len(x), 0.003, 0.09)
notes = [261.6, 329.6, 392.0, 329.6, 293.7, 349.2, 440.0, 349.2, 261.6, 329.6, 392.0, 523.3, 493.9, 392.0, 293.7, 246.9]
mus = np.zeros(N); beat = 0.25
for k in range(int(N / SR / beat)):
    i = int(k * beat * SR); s = pluck(notes[k % len(notes)] * (0.5 if k % 4 == 0 else 1))[:N-i]; mus[i:i+len(s)] += s
    if k % 4 == 0: b = pluck(65.4 * (1 if (k // 16) % 2 == 0 else 1.122), 0.5)[:N-i]; mus[i:i+len(b)] += b * 0.8
fade = np.ones(N); fade[-int(1.5*SR):] = np.linspace(1, 0, int(1.5*SR)); mus *= fade
venv = np.convolve(np.abs(voice), np.ones(4410)/4410, mode='same'); duck = 1 - 0.5 * np.clip(venv / (venv.max() * 0.3), 0, 1)

def db(x): return 10 ** (x / 20)
def norm(x): m = np.abs(x).max(); return x / m if m > 0 else x
mix = norm(voice) * db(-2) + norm(fx) * db(-8) + norm(mus) * duck * db(-20)
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
with wave.open(sys.argv[2], 'w') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
print('wrote', sys.argv[2], round(N / SR, 2), 's')
