import subprocess, json, sys, os, numpy as np
S = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(S, 'sfx')
def load(id):
    raw = subprocess.run(['ffmpeg','-v','error','-i',f'{D}/{id}.mp3','-ac','1','-ar','48000','-f','f32le','-'],capture_output=True).stdout
    return np.frombuffer(raw, np.float32)
info = {}
# cue: (time_s, id, align 'on'|'peak', max_len_s, gain_db)  gain is relative to the clip normalised to -13 dBFS peak
W, P = 'peak', 'on'
CUES = [
 (0.00,2209,P,0.7,-6),(0.76,2150,P,0.9,-2),(2.16,1489,W,1.0,-7),(2.24,1989,P,1.0,-7),(3.64,1490,W,0.8,-5),(4.28,2358,P,0.6,-3),(4.64,2358,P,0.6,-3),(4.70,2364,P,1.0,-11),
 (5.12,1491,W,0.8,-6),(5.45,2876,P,0.3,-7),(5.60,2876,P,0.3,-7),(5.75,2876,P,0.3,-7),(5.90,2876,P,0.3,-6),(6.05,2876,P,0.3,-6),(5.82,2150,P,0.8,-4),
 (6.48,1489,W,1.0,-6),(7.14,1999,P,1.0,-5),(7.70,1490,W,0.8,-5),(8.32,2656,P,1.2,-4),(9.06,2608,P,1.0,-6),(9.66,1491,W,0.8,-6),(10.00,2656,P,0.6,-6),(10.42,744,P,0.8,-4),
 (11.02,1489,W,1.0,-6),(11.94,1989,P,1.0,-4),(11.98,2073,P,1.0,-8),(12.52,1490,W,0.8,-6),(13.30,2876,P,0.3,-9),(13.60,2876,P,0.3,-9),(13.90,2876,P,0.3,-9),(14.20,2876,P,0.3,-9),
 (14.84,1491,W,0.8,-6),(15.50,2358,P,0.6,-3),(16.02,2358,P,0.6,-3),(16.92,2358,P,0.6,-3),(17.48,1490,W,0.8,-6),(18.94,2876,P,0.5,-3),(19.54,1489,W,1.0,-6),(19.98,1101,P,0.4,-5),(20.30,1101,P,0.4,-6),
 (21.18,1491,W,0.8,-6),(21.76,1368,P,0.8,-6),(22.40,2209,P,0.5,-5),(22.90,2958,P,1.0,-3),(23.52,1490,W,0.8,-5),(24.76,92,P,1.6,-5),
 (25.38,1489,W,1.0,-6),(25.60,2623,P,1.6,-7),(26.70,1996,P,1.4,-6),(27.80,1491,W,0.8,-6),(28.86,1490,W,0.8,-5),(30.70,1489,W,1.0,-7),(32.26,492,P,1.2,-5),
 (33.20,1490,W,0.8,-5),(33.26,2958,P,1.4,-2),(33.30,1321,P,1.4,-6),(33.92,1489,W,1.0,-6),(34.60,2358,P,0.6,-3),(35.38,2150,P,0.8,-3),(35.42,1321,P,1.0,-8),
 (36.58,1491,W,0.8,-6),(36.70,2364,P,1.0,-7),(37.98,1490,W,0.8,-5),(38.02,518,P,2.4,-7),(38.06,2073,P,1.0,-8),(38.20,2623,P,2.0,-8),(41.12,1489,W,1.0,-6),(41.90,92,P,1.0,-5),
]
SR = 48000; END = 42.9; N = int(END * SR) + SR
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
out = os.path.join(S, 'sfx_bus.wav')
import wave
pcm = (np.clip(bus, -1, 1) * 32767).astype('<i2')
with wave.open(out, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('cues', len(CUES), 'per 10 s', round(len(CUES) / END * 10, 1), out)
