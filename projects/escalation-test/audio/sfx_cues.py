import subprocess, json, sys, os, numpy as np
S = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(S, 'sfx')
def load(id):
    raw = subprocess.run(['ffmpeg','-v','error','-i',f'{D}/{id}.mp3','-ac','1','-ar','48000','-f','f32le','-'],capture_output=True).stdout
    return np.frombuffer(raw, np.float32)
info = {}
# cue: (time_s, id, align 'on'|'peak', max_len_s, gain_db)  gain is relative to the clip normalised to -13 dBFS peak
W, P = 'peak', 'on'
CUES = [
 (0.00,1993,P,1.0,-5),(0.30,2073,P,0.8,-12),(0.58,1939,P,1.0,-3),(0.60,2073,P,1.0,-6),(1.20,1489,W,1.0,-7),
 (2.24,2350,P,0.6,-2),(2.30,110,P,1.2,-8),(3.00,1490,W,0.9,-4),(3.00,1864,P,1.2,-3),(3.66,2364,P,0.9,-11),
 (3.64,2209,P,0.75,-4),(4.26,1490,W,0.6,-7),(4.32,2980,P,0.8,-1),(4.34,744,P,0.9,-4),(4.45,343,P,0.6,-8),
]
SR = 48000; END = 5.0; N = int(END * SR) + SR
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
