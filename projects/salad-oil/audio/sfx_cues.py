import subprocess, json, sys, os, numpy as np
S = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(S, 'sfx')
def load(id):
    raw = subprocess.run(['ffmpeg','-v','error','-i',f'{D}/{id}.mp3','-ac','1','-ar','48000','-f','f32le','-'],capture_output=True).stdout
    return np.frombuffer(raw, np.float32)
info = {}
# cue: (time_s, id, align 'on'|'peak', max_len_s, gain_db)  gain is relative to the clip normalised to -13 dBFS peak
W, P = 'peak', 'on'
CUES = [
 (0.00,1490,W,1.0,-3),(0.10,1989,P,0.8,-2),(0.40,1993,P,1.0,-6),(0.78,600,P,1.2,-5),(1.6,1996,P,1.4,-9),
 (2.32,1490,W,1.0,-3),(2.4,1185,P,2.6,-14),(5.08,1490,W,1.0,-3),(5.4,1321,P,1.6,-7),(6.40,2884,P,1.0,-4),
 (7.30,1489,W,1.2,-5),(8.34,1104,P,0.5,-3),(9.2,1491,W,0.9,-5),(10.64,2980,P,0.9,-9),(11.6,1939,P,1.1,-4),(12.36,1993,P,0.9,-6),(13.22,1989,P,0.8,-4),
 (14.0,1489,W,1.2,-5),(14.42,2858,P,0.5,-6),(14.75,2858,P,0.5,-8),(15.1,201,P,0.8,-5),(15.94,3000,P,0.8,-4),(18.4,27,P,0.8,-8),(19.88,579,P,1.6,-5),
 (20.5,1490,W,1.0,-3),(21.5,1321,P,1.4,-7),(22.8,600,P,1.2,-6),(24.6,1198,P,1.2,-5),
 (25.95,1490,W,1.0,-3),(26.3,1996,P,1.3,-8),(26.7,1989,P,0.8,-4),(27.2,1993,P,0.9,-6),
 (27.55,1490,W,1.0,-3),(28.58,1382,P,0.4,-2),(29.22,1382,P,0.4,-3),(29.54,1382,P,0.4,-2),(29.62,1368,P,1.0,-5),(30.58,2876,P,1.5,-4),
 (31.3,1490,W,1.0,-3),(31.4,2623,P,1.4,-8),(33.7,1490,W,1.0,-3),(34.6,2364,P,0.4,-2),(36.5,2364,P,0.4,-4),(37.9,2350,P,1.4,-6),
 (38.7,1490,W,1.0,-3),(38.98,2958,P,1.4,-1),(39.0,1311,P,1.0,-2),(39.2,1198,P,1.0,-4),
 (39.9,1490,W,1.0,-3),(40.0,458,P,2.3,-11),(40.64,744,P,2.0,-5),(42.24,1489,W,1.2,-4),
 (43.55,1490,W,1.0,-3),(43.62,110,P,1.4,-5),(44.66,1382,P,0.4,0),(44.7,1368,P,1.0,-5),(45.0,1999,P,1.0,-5),(45.6,1996,P,1.4,-6),(46.3,518,P,2.5,-9),
 (47.36,1489,W,1.2,-5),(48.18,1321,P,1.0,-6),(48.7,600,P,0.9,-6),
]
SR = 48000; END = 49.38; N = int(END * SR) + SR
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
out = os.path.join(S, 'so', 'sfx_bus.wav')
import wave
pcm = (np.clip(bus, -1, 1) * 32767).astype('<i2')
with wave.open(out, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('cues', len(CUES), 'per 10 s', round(len(CUES) / END * 10, 1), out)
