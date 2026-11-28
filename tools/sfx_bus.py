#!/usr/bin/env python3
"""Build the SFX bus from a project's cue table. Usage: sfx_bus.py <cues.py> <out.wav> <END seconds>
cues.py defines CUES = [(time_s, mixkit_id, 'on'|'peak', max_len_s, gain_db), ...] (old sfx_cues.py files work: only CUES is read)."""
import sys, os, re, subprocess, wave, numpy as np
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); D = os.path.join(R, "assets", "sfx")
src = open(sys.argv[1]).read(); W, P = "peak", "on"
m = re.search(r"CUES = \[.*?\n\]", src, re.S); CUES = eval(m.group(0)[7:], {"W": W, "P": P})
SR = 48000; END = float(sys.argv[3]); N = int(END * SR) + SR; bus = np.zeros(N, np.float32); cache = {}
def load(i):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f"{D}/{i}.mp3", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    x = np.frombuffer(raw, np.float32); return x / (np.abs(x).max() + 1e-9) * 10 ** (-13 / 20)
for t, i, al, ml, g in CUES:
    if not os.path.exists(f"{D}/{i}.mp3"): print("missing sfx", i); continue
    x = cache.get(i); x = cache.setdefault(i, load(i)) if x is None else x
    env = np.abs(x); on = int(np.argmax(env > env.max() * 0.08)); pk = int(np.argmax(env)); a = on if al == P else pk
    s0 = max(0, on - int(0.01 * SR)); seg = x[s0:s0 + int(ml * SR)].copy(); fade = min(len(seg), int(0.12 * SR)); seg[-fade:] *= np.linspace(1, 0, fade)
    start = int(t * SR) - (a - s0)
    if start < 0: seg = seg[-start:]; start = 0
    e = min(N, start + len(seg)); bus[start:e] += seg[: e - start] * 10 ** (g / 20)
with wave.open(sys.argv[2], "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(bus, -1, 1) * 32767).astype("<i2").tobytes())
print(f"{len(CUES)} cues ({len(CUES) / END * 10:.1f} per 10 s) -> {sys.argv[2]}")
