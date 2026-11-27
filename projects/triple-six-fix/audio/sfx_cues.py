import subprocess, json, sys, os, numpy as np
S = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(S, 'sfx')
def load(id):
    raw = subprocess.run(['ffmpeg','-v','error','-i',f'{D}/{id}.mp3','-ac','1','-ar','48000','-f','f32le','-'],capture_output=True).stdout
    return np.frombuffer(raw, np.float32)
info = {}
# cue: (time_s, id, align 'on'|'peak', max_len_s, gain_db)  gain is relative to the clip normalised to -13 dBFS peak
W, P = 'peak', 'on'
CUES = [
 (0.00,1490,P,1.0,-3),(0.72,2364,P,0.4,-2),(1.15,2925,P,0.6,-3),
 (2.20,1490,W,1.0,-2),(2.30,1991,P,2.6,-4),(2.62,518,P,2.4,-5),(4.12,600,P,1.2,-5),
 (6.54,2358,P,0.5,0),(6.56,601,P,1.0,-7),(7.16,2358,P,0.5,0),(7.90,2358,P,0.5,0),(7.92,110,P,1.4,-6),
 (8.80,1490,W,1.0,-3),(9.45,1104,P,0.5,-2),
 (13.24,1490,W,1.0,-3),(13.9,2265,P,1.6,-8),(14.5,92,P,1.0,-10),(14.95,1490,W,1.0,-3),
 (16.3,2073,P,0.3,-2),(16.82,2073,P,0.3,-3),(17.40,2608,P,1.2,-3),
 (18.70,1490,W,1.0,-3),(20.26,2656,P,1.3,-3),(21.62,2150,P,0.6,0),
 (23.14,2209,P,1.1,-4),(24.08,1530,P,0.9,-3),(24.92,2364,P,0.4,-1),
 (25.86,343,P,1.3,-6),(26.50,2894,P,1.0,-5),(29.40,579,P,1.6,-5),
 (30.10,1490,W,1.0,-3),(30.85,2358,P,0.5,-1),(32.08,1491,W,0.8,-5),
 (33.00,2925,P,0.4,-6),(33.62,2925,P,0.4,-6),(34.98,2350,P,1.6,-5),(35.56,600,P,1.2,-6),
 (36.30,1490,W,1.0,-3),(36.40,3220,P,1.8,-4),(37.50,2653,P,1.5,-6),
 (38.95,1490,W,1.0,-3),(39.10,1104,P,0.5,-2),(41.14,1939,P,1.1,-3),(41.45,931,P,1.0,-6),(42.40,1530,P,0.9,-4),(43.50,1102,P,1.2,-5),
 (45.10,1490,W,1.0,-3),(45.54,1808,P,0.8,-1),(45.70,2608,P,1.2,-4),(46.60,2358,P,0.5,0),(47.18,2358,P,0.5,0),(47.98,2358,P,0.5,0),(48.00,1991,P,2.2,-5),(48.10,518,P,2.2,-6),
 (48.72,2876,P,1.5,-4),
 (51.20,1490,W,1.0,-3),(52.60,1101,P,0.5,-4),(53.18,1101,P,0.5,-5),(53.60,600,P,1.2,-6),(54.20,1491,W,0.9,-4),(54.92,2364,P,0.4,-3),
 (56.22,2623,P,1.6,-7),
 (58.60,1490,W,1.0,-3),(59.00,492,P,1.6,-6),(61.82,1864,P,0.9,-2),(62.0,744,P,2.0,-7),
 (62.60,1490,W,1.0,-3),(64.28,2182,P,0.5,1),(64.64,2894,P,0.9,-6),
 (65.30,2608,P,1.2,-4),(65.40,2653,P,1.9,-7),(65.55,395,P,0.8,-5),(66.36,746,P,1.0,-2),(66.55,424,P,0.8,-6),
]
SR = 48000; END = 67.35; N = int(END * SR) + SR
bus = np.zeros(N, np.float32); cache = {}
for t, id, al, ml, g in CUES:
    x = cache.get(id)
    if x is None:
        x = load(id); x = x / (np.abs(x).max() + 1e-9) * 10 ** (-13 / 20); cache[id] = x
    env = np.abs(x); th = env.max() * 0.08
    on = int(np.argmax(env > th)); pk = int(np.argmax(env))
    a = on if al == P else pk
    seg = x[max(0, on - int(0.01 * SR)):]
    seg = seg[: int(ml * SR)].copy()
    fade = min(len(seg), int(0.12 * SR)); seg[-fade:] *= np.linspace(1, 0, fade)
    start = int(t * SR) - (a - max(0, on - int(0.01 * SR)))
    if start < 0: seg = seg[-start:]; start = 0
    e = min(N, start + len(seg)); bus[start:e] += seg[: e - start] * 10 ** (g / 20)
out = os.path.join(S, 'audio', 'sfx_bus.wav')
import wave
pcm = (np.clip(bus, -1, 1) * 32767).astype('<i2')
with wave.open(out, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('cues', len(CUES), 'per 10 s', round(len(CUES) / END * 10, 1), out)
