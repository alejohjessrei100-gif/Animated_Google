"""Voice + frame-timed effects + felt-piano bed for the wolf doorbell explainer.
   python3 -I tools/mix.py   (run from wolf-explainer/)  ->  build/mix.wav, build/mix.mp3"""
import sys, os, subprocess; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__))))
from synth import *
import numpy as np
os.makedirs('build', exist_ok=True)
voice = mono('voice.mp3'); END = 41.2
buf = track(END); fx = track(END); bed = track(END)
v = np.zeros(len(buf)); v[:min(len(voice), len(v))] = voice[:len(v)]
def ding(f=1320, d=0.8):
    n = int(d * SR); t = np.arange(n) / SR
    return sum(a * np.sin(2*np.pi*f*r*t) * np.exp(-t*(2+r)) for r, a in [(1,1),(2.76,.5),(5.4,.25)]) * np.minimum(1, t/.002)
def zap(d=.6):
    n = int(d*SR); t = np.arange(n)/SR; x = np.sign(np.sin(2*np.pi*110*t))*.5 + bp(rng.standard_normal(n), 2000, 8000)*(rng.random(n) > .6)
    return x * np.minimum(1, (d-t)/.05)
def hum(d): n=int(d*SR); t=np.arange(n)/SR; return (np.sin(2*np.pi*60*t)+.5*np.sin(2*np.pi*120*t))*.3*np.minimum(1,t/.1)*np.minimum(1,(d-t)/.1)
def ringer(d, rate=16):
    out = np.zeros(int(d*SR)); b = ding(1000, .25) * .6
    for k in range(int(d*rate)): i = int(k/rate*SR); s = b[:len(out)-i]; out[i:i+len(s)] += s
    return out
def snap(): n=int(.1*SR); return rng.standard_normal(n)*env(n,.0005,.012)*1.3
for t in (3.36, 3.5, 3.64): put(fx, t, thud(), .7)
put(fx, 4.45, whoosh(.9, up=True, lo=300, hi=2500), .4)
put(fx, 5.84, whoosh(.7, up=False), 1.0); put(fx, 6.4, thud(), 1.0); put(fx, 6.45, snap(), .5)
put(fx, 7.48, ding(), .7)
put(fx, 10.56, zap(), .8); put(fx, 11.2, thud(), .7)
put(fx, 12.44, poof(), .8); put(fx, 12.5, ding(700, 1.4), .6); put(fx, 13.9, pop(), .8)
put(fx, 15.06, ding(), .7)
put(fx, 16.3, snap(), 1); put(fx, 17.2, whoosh(.4, up=False, lo=600, hi=3000), .5); put(fx, 17.6, ding(520, 1.2), .9); put(fx, 17.6, thud(), 1)
put(fx, 19.18, poof(), .8); put(fx, 19.5, whoosh(.35), .8); put(fx, 19.6, thud(), .5)
for t in (20.26, 20.98, 23.08, 26.84, 32.22): put(fx, t, pop(), .8)
for k in range(14): put(fx, 21.74 + k * .11, tick(1800, .02), .35)
put(fx, 24.72, hum(3.4), .6); put(fx, 27.76, ding(1000, .9), .8)
put(fx, 28.6, ding(), .7)
put(fx, 30.36, tick(), .6); put(fx, 30.4, ding(1000, .9), .6); put(fx, 30.9, tick(), .5); put(fx, 31.3, tick(), .5)
put(fx, 33.4, zap(.12), .5); put(fx, 33.45, ding(1000, .4), .5)
put(fx, 35.12, ringer(39.96 - 35.12), .45)
put(fx, 36.88, whoosh(.35, up=False), .6)
put(fx, 39.96, tick(900, .05), 1.0)
# felt piano bed: C - Am - F - G, one chord per 2 s
prog = [[48, 60, 64, 67], [45, 57, 60, 64], [41, 57, 60, 65], [43, 55, 59, 62]]
for i in range(int(END / 2)):
    for k, m in enumerate(prog[i % 4]): put(bed, i * 2 + k * .04, felt(m, .5, 2.4), .35, (k - 1.5) * .3)
    put(bed, i * 2 + 1, mbox(prog[i % 4][-1] + 12, .4), .12, .4)
fade = np.ones(len(bed)); n = int(1.2 * SR); fade[-n:] = np.linspace(1, 0, n)
bed = carve(bed) * duck(v, .5) * fade[:, None]
db = lambda x: 10 ** (x / 20)
nz = lambda x: x / max(1e-9, np.abs(x).max())
mixd = nz(v)[:, None] * db(-1) + nz(fx) * db(-9) + nz(bed) * db(-19)
write('build/mix_raw.wav', mixd); loudnorm('build/mix_raw.wav', 'build/mix.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'build/mix.wav', '-c:a', 'libmp3lame', '-b:a', '128k', 'build/mix.mp3'], check=True)
print('ok', os.path.getsize('build/mix.mp3'))
