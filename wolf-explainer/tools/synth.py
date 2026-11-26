"""Small synth + sound-effect kit for scoring a short from its own event list (no samples, no licensing).

Import it from your episode's music script:
    import sys; sys.path.insert(0, 'scripts'); from synth import *
    buf = track(20.0)                          # stereo float buffer, 48 kHz
    put(buf, 1.25, kick(), 0.8)                # time in seconds, gain, pan -1..1
    for t in beat_times: put(buf, t, hat(), 0.2)
    write('build/music.wav', buf)
    loudnorm('build/music.wav', 'build/sfx.wav')   # -16 LUFS / -1.5 dBTP, what the platforms expect

Rule of thumb: every on-screen event gets its own sound at the same timestamp; a bed that steps aside under a voice
(see carve() and duck()); one hard silence is worth more than any hit.
"""
import json, subprocess, wave
import numpy as np
from scipy.signal import butter, lfilter

SR = 48000
rng = np.random.default_rng(7)
NOTE = lambda m: 440 * 2 ** ((m - 69) / 12)          # MIDI note -> Hz (A4 = 69)

def track(seconds): return np.zeros((int(round(seconds * SR)) + 1, 2))
def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
def lp(x, f, o=2): b, a = butter(o, min(f, SR / 2 - 100) / (SR / 2)); return lfilter(b, a, x)
def hp(x, f, o=2): b, a = butter(o, f / (SR / 2), 'high'); return lfilter(b, a, x)
def bp(x, f1, f2): b, a = butter(2, [f1 / (SR / 2), min(f2, SR / 2 - 100) / (SR / 2)], 'band'); return lfilter(b, a, x)
def put(buf, t, sig, g=1.0, pan=0.0):
    i0 = int(round(t * SR)); seg = sig[:max(0, len(buf) - i0)]
    if i0 < 0 or not len(seg): return
    buf[i0:i0 + len(seg), 0] += g * np.sqrt(0.5 * (1 - pan)) * seg; buf[i0:i0 + len(seg), 1] += g * np.sqrt(0.5 * (1 + pan)) * seg

# ---------- instruments ----------
def piano(m, dur=1.2, vel=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; f = NOTE(m); x = np.zeros(n)
    for k in range(1, 9):
        fk = f * k * np.sqrt(1 + 0.0004 * k * k)
        if fk > 12000: break
        x += 0.7 ** (k - 1) * np.sin(2 * np.pi * fk * t) * np.exp(-t * (1.6 + 0.9 * k))
    return vel * x * np.minimum(1, t / 0.003) * np.minimum(1, (dur - t) / 0.05)
def felt(m, vel=1.0, dur=2.5):        # soft felt piano
    n = int(dur * SR); t = np.arange(n) / SR; f = NOTE(m); x = np.zeros(n)
    for k in range(1, 6): x += 0.55 ** (k - 1) * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (0.9 + 0.8 * k))
    return vel * lp(x, 2200) * np.minimum(1, t / 0.008) * np.minimum(1, (dur - t) / 0.1)
def mbox(m, vel=1.0, dur=2.2):        # music box tine
    n = int(dur * SR); t = np.arange(n) / SR; f = NOTE(m)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.9) + 0.35 * np.sin(2 * np.pi * f * 3.98 * t) * np.exp(-t / 0.18) + 0.18 * np.sin(2 * np.pi * f * 7.1 * t) * np.exp(-t / 0.06)
    return vel * x * np.minimum(1, t / 0.0015)
def pad(ms, dur, vel=1.0, bright=1400):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for m in ms:
        for det in (-0.07, 0.07): x += np.sin(2 * np.pi * NOTE(m) * (1 + det / 12) * t + rng.random() * 6)
    return vel * lp(x, bright) / len(ms) * np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.5)
def pluck(m, dur=0.22, vel=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; f = NOTE(m); saw = 2 * ((f * t) % 1) - 1
    return vel * lp(saw, 2500) * env(n, 0.002, dur * 0.4)
def bass(m, dur):
    n = int(dur * SR); t = np.arange(n) / SR; f = NOTE(m)
    x = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 2 * f * t) + 0.15 * np.sin(2 * np.pi * 3 * f * t)
    return lp(x, 1100) * env(n, 0.004, dur * 0.8) * np.minimum(1, (dur - t) / 0.02)
def kick(n=int(0.4 * SR)):
    t = np.arange(n) / SR; f = 46 + 110 * np.exp(-t / 0.028)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.17) + 0.22 * hp(rng.standard_normal(n), 3000) * env(n, 0.0005, 0.004)
def clap(n=int(0.3 * SR)):
    x = bp(rng.standard_normal(n), 900, 4800); e = sum(env(n, 0.0005, 0.012) * (np.arange(n) >= int(k * SR)) for k in (0, 0.011, 0.022))
    return x * (e + 0.5 * env(n, 0.002, 0.09))
def hat(d=0.02, n=int(0.15 * SR)): return hp(rng.standard_normal(n), 7500) * env(n, 0.0005, d)

# ---------- effects ----------
def whoosh(dur=0.3, up=True, lo=400, hi=5000):
    n = int(dur * SR); t = np.arange(n) / SR; x = rng.standard_normal(n); out = np.zeros(n)
    fs = np.geomspace(lo, hi, 12) if up else np.geomspace(hi, lo, 12)
    for k, f in enumerate(fs): seg = slice(k * n // 12, (k + 1) * n // 12); out[seg] = bp(x, f * 0.7, f * 1.4)[seg]
    return out * ((t / dur) ** 2 if up else np.sin(np.pi * t / dur) ** 0.7)
def tick(f=1500, d=0.03):
    n = int(0.12 * SR); t = np.arange(n) / SR
    return 0.8 * np.sin(2 * np.pi * f * t) * env(n, 0.0005, d) + 0.5 * bp(rng.standard_normal(n), 1500, 5000) * env(n, 0.0003, 0.004)
def thud():
    n = int(0.35 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * (70 + 60 * np.exp(-t / 0.03)) * t) * env(n, 0.001, 0.09) + 0.4 * lp(rng.standard_normal(n), 900) * env(n, 0.001, 0.04)
def poof():                            # something appears: breathy puff + small wooden tick
    n = int(0.45 * SR); t = np.arange(n) / SR
    x = lp(rng.standard_normal(n), 1400) * np.minimum(1, t / 0.02) * np.exp(-t / 0.12)
    return 0.9 * x / np.abs(x).max() + 0.35 * np.sin(2 * np.pi * 1180 * t) * env(n, 0.0005, 0.03)
def pop():
    n = int(0.12 * SR); t = np.arange(n) / SR
    return bp(rng.standard_normal(n), 400, 3500) * env(n, 0.0004, 0.018) + 0.5 * np.sin(2 * np.pi * rng.uniform(170, 260) * t) * env(n, 0.001, 0.04)
def rain(dur, amt=1.0):
    n = int(dur * SR); x = 0.5 * bp(rng.standard_normal(n), 900, 7000) + 0.3 * lp(rng.standard_normal(n), 500)
    for _ in range(int(dur * 60 * amt)):
        i = rng.integers(0, max(1, n - 2000)); k = int(SR * 0.01)
        x[i:i + k] += rng.uniform(0.3, 1) * bp(rng.standard_normal(k), 2000, 9000) * env(k, 0.0002, 0.002)
    return amt * x
def thunder(dur=3.0):
    n = int(dur * SR); t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 1500) * env(n, 0.0005, 0.05) + lp(rng.standard_normal(n), 180, 4) * 6 * np.minimum(1, t / 0.08) * np.exp(-t / 1.1)
def wind(dur):
    n = int(dur * SR); t = np.arange(n) / SR; x = rng.standard_normal(n); out = np.zeros(n)
    f = 500 + 350 * np.sin(2 * np.pi * 0.23 * t) + 220 * np.sin(2 * np.pi * 0.61 * t + 1)
    for k in range(16): seg = slice(k * n // 16, (k + 1) * n // 16); out[seg] = bp(x, f[seg.start] * 0.6, f[seg.start] * 1.6)[seg]
    return out * (0.75 + 0.25 * np.sin(2 * np.pi * 0.37 * t))
def shimmer(dur=3.0, notes=(81, 85, 88, 93, 97)):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for i, m in enumerate(notes): x += np.sin(2 * np.pi * NOTE(m) * t) * np.minimum(1, np.maximum(0, t - i * 0.12) / 0.5) * np.exp(-t / 2.2)
    return 0.25 * x

# ---------- mixing ----------
def mono(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, '<i2').astype(float) / 32767
def carve(x, depth=0.6):               # cut 1-4 kHz (where speech lives) out of a music/effects buffer
    return x - depth * np.stack([bp(x[:, c], 1000, 4000) for c in (0, 1)], 1)
def duck(voice, amount=0.45):           # gain curve that dips while the voice is talking
    k = int(0.06 * SR); e = np.convolve(voice ** 2, np.ones(k) / k, 'same') ** 0.5
    act = np.convolve(np.clip(e / (0.25 * e.max() + 1e-9), 0, 1), np.ones(k) / k, 'same')
    return (1 - amount * act)[:, None]
def write(path, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.89
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype('<i2').tobytes())
def loudnorm(src, dst, lufs=-16, tp=-1.5):
    m = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(src), '-af', f'loudnorm=I={lufs}:TP={tp}:LRA=11:print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    j = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
    af = (f"loudnorm=I={lufs}:TP={tp}:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
          f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-af', af, '-ar', str(SR), str(dst)], check=True)
