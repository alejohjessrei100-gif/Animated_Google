"""Sound design + mix + master for the PS1 doorbell story.
   python3 -I tools/sound.py   (from wolf-story/)  ->  build/mix.mp3 (+ build/mix.wav, build/report.txt)

Every effect is layered: transient (click) + body + short tail, band-limited, with a little 32 kHz / 12-bit
retro colour, 5-20 ms fades on every clip, +-3-8 % pitch/level variation on repeats. Times come from the same
word timings the animation uses (voice.words.json), so hits land on the visual events.
Mix: voice on top; SFX and music carved at 1-4 kHz and side-chain ducked under the voice; everything near
centre so it survives phone mono. Master: -14 LUFS integrated, true peak <= -1.0 dBTP (4x oversampled limiter).
"""
import json, subprocess, os, sys
import numpy as np
from scipy.signal import butter, sosfilt, resample_poly

SR = 48000
rng = np.random.default_rng(11)
os.makedirs('build', exist_ok=True)

# ---------------- dsp helpers ----------------
def sos(kind, f, o=2):
    f = np.atleast_1d(f) / (SR / 2); f = np.clip(f, 1e-4, .999)
    return butter(o, f if len(f) > 1 else f[0], kind, output='sos')
lp = lambda x, f, o=2: sosfilt(sos('low', f, o), x)
hp = lambda x, f, o=2: sosfilt(sos('high', f, o), x)
bp = lambda x, a, b, o=2: sosfilt(sos('band', [a, b], o), x)
def tt(d): return np.arange(int(d * SR)) / SR
def env(n, a, d): t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
def fade(x, fi=.005, fo=.015):
    x = x.copy(); n1, n2 = int(fi * SR), int(fo * SR)
    if n1: x[:n1] *= np.linspace(0, 1, n1)
    if n2: x[-n2:] *= np.linspace(1, 0, n2)
    return x
def noise(d): return rng.standard_normal(int(d * SR))
def retro(x, rate=32000, bits=12):
    """PS1-ish colour: resample to 32 kHz and 12-bit, band-limited first so nothing aliases."""
    y = lp(x, rate * .45, 4); y = resample_poly(y, rate // 1000, SR // 1000)
    q = 2 ** (bits - 1); y = np.round(y * q) / q
    return resample_poly(y, SR // 1000, rate // 1000)[:len(x)]
def norm(x, peak=1.0): m = np.abs(x).max(); return x / m * peak if m > 0 else x
def var(): return 1 + rng.uniform(-.06, .06)   # +-6 % pitch / level variation
def sine(f, d, decay, ph=0): t = tt(d); return np.sin(2 * np.pi * f * t + ph) * np.exp(-t / decay)
def room(x, amt=.18, d=.12):
    """tiny room tail: a few early reflections + short diffuse decay (mono-safe)."""
    out = np.concatenate([x, np.zeros(int(.25 * SR))])
    for ms, g in ((11, .5), (17, .35), (29, .25), (41, .18)):
        k = int(ms / 1000 * SR); out[k:k + len(x)] += x * g * amt
    tail = lp(noise(.25), 3500) * env(int(.25 * SR), .002, d) * amt * .15 * np.abs(x).max()
    out[:len(tail)] += tail
    return out

# ---------------- sound library (layered) ----------------
def footstep():
    v = var(); click = bp(noise(.03), 1800 * v, 5000) * env(int(.03 * SR), .0005, .004) * .5
    body = lp(noise(.12), 260 * v) * env(int(.12 * SR), .002, .03) * 2.2 + sine(95 * v, .12, .03) * .6
    x = body; x[:len(click)] += click
    return fade(room(norm(x) * .9 * v, .12), .002, .02)
def knock():
    v = var(); n = int(.25 * SR)
    trans = bp(noise(.02), 2000, 6000) * env(int(.02 * SR), .0003, .003)
    body = sine(185 * v, .25, .045) + .6 * sine(410 * v, .25, .03) + .3 * sine(760 * v, .25, .02)
    body[:len(trans)] += trans * .8
    return fade(room(norm(body) * v, .25), .001, .02)
def inhale(d):
    t = tt(d); x = bp(noise(d), 600, 2200) * (t / d) ** 1.6 * np.minimum(1, (d - t) / .05)
    return fade(norm(x) * .7, .02, .03)
def blow(d=.8):
    t = tt(d); x = np.zeros(len(t)); nz = noise(d)
    for k, f in enumerate(np.geomspace(2600, 500, 10)):
        seg = slice(k * len(t) // 10, (k + 1) * len(t) // 10); x[seg] = bp(nz, f * .6, f * 1.5)[seg]
    rumble = lp(noise(d), 120, 4) * 3
    return fade(norm(x * np.sin(np.pi * t / d) ** .6 + rumble * np.exp(-t / .3)) * .9, .01, .05)
def crash():
    crack = bp(noise(.05), 1500, 7000) * env(int(.05 * SR), .0003, .008)
    thud = sine(70, .5, .12) * 1.4 + lp(noise(.5), 400) * env(int(.5 * SR), .002, .08) * 2
    x = thud.copy(); x[:len(crack)] += crack
    for k in range(6):  # debris rattles
        i = int(rng.uniform(.06, .4) * SR); r = bp(noise(.02), 2500, 6000) * env(int(.02 * SR), .0003, .004) * rng.uniform(.2, .5)
        x[i:i + len(r)] += r[:len(x) - i]
    return fade(room(norm(x), .3, .2), .001, .03)
def thud(weight=1.0):
    v = var(); x = sine(60 * v, .4, .09) * 1.5 + lp(noise(.4), 500) * env(int(.4 * SR), .002, .05) * 1.6
    tr = bp(noise(.015), 900, 3500) * env(int(.015 * SR), .0003, .003); x[:len(tr)] += tr * .5
    return fade(room(norm(x) * weight, .2), .001, .03)
def chime(f0=1046.5, d=1.1, bright=1.0):
    """soft praise ding: warm inharmonic bell, low-passed, with a breathy onset."""
    t = tt(d); x = sum(a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t * (1.6 + 1.4 * r)) for r, a in ((1, 1), (2.0, .35), (2.76, .22), (5.4, .06 * bright)))
    x = lp(x * np.minimum(1, t / .003), 7000) + bp(noise(d), 3000, 8000) * env(len(t), .001, .01) * .08
    return fade(room(norm(x) * .9, .25, .3), .002, .05)
def brass_bell(f0=620, d=1.6):
    t = tt(d); x = sum(a * np.sin(2 * np.pi * f0 * r * t + rng.uniform(0, 6)) * np.exp(-t * (1.0 + 1.1 * r)) for r, a in ((.5, .35), (1, 1), (1.19, .45), (1.56, .3), (2.0, .25), (2.74, .15), (3.76, .06)))
    strike = bp(noise(.02), 1500, 6000) * env(int(.02 * SR), .0003, .004)
    x[:len(strike)] += strike * .6
    return fade(room(norm(lp(x, 8000)), .25, .35), .001, .08)
def elec_bell(v=1.0, d=.5):
    return brass_bell(1180 * v, d) * .9
def pop():
    v = var(); t = tt(.14); f = (520 * v) * np.exp(-t / .035) + 140 * v
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), .001, .045)
    x += bp(noise(.14), 1500, 5000) * env(len(t), .0004, .006) * .5 + lp(noise(.14), 1200) * env(len(t), .004, .04) * .4
    return fade(norm(x) * .9 * v, .001, .02)
def zap(d=.5):
    t = tt(d); saw = 2 * ((118 * t) % 1) - 1
    buzz = lp(saw, 2200) * (.65 + .35 * np.sin(2 * np.pi * 31 * t))
    crackle = bp(noise(d), 2500, 7000) * (rng.random(len(t)) > .93) * 1.2
    trans = bp(noise(.02), 1000, 7000) * env(int(.02 * SR), .0003, .004)
    x = buzz * .7 + lp(crackle, 7000); x[:len(trans)] += trans
    return fade(norm(x) * .85, .003, .04)
def snap():
    crack = bp(noise(.03), 1200, 7000) * env(int(.03 * SR), .0002, .005)
    twang = sine(196, .35, .08) * .5 + sine(392, .35, .05) * .25
    x = twang.copy(); x[:len(crack)] += crack * 1.4
    return fade(room(norm(x), .2), .001, .03)
def whistle_fall(d=.3):
    t = tt(d); f = 1700 - 1100 * (t / d); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) ** .5
    return fade(lp(x, 5000) * .35, .01, .02)
def bonk():
    x = brass_bell(480, 1.3) * .9; th = thud(1.0); x[:len(th)] += th * .9
    return norm(x)
def boing(d=.6):
    t = tt(d); f = 260 * (1 + .25 * np.sin(2 * np.pi * 9 * t) * np.exp(-t / .25)); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), .002, .2)
    return fade(lp(x, 3000) * .6, .003, .04)
def whoosh(d=.35, up=True, lo=350, hi=4000, amp=.6):
    t = tt(d); nz = noise(d); x = np.zeros(len(t)); fs = np.geomspace(lo, hi, 10) if up else np.geomspace(hi, lo, 10)
    for k, f in enumerate(fs): seg = slice(k * len(t) // 10, (k + 1) * len(t) // 10); x[seg] = bp(nz, f * .6, f * 1.5)[seg]
    shape = (t / d) ** 2 if up else np.sin(np.pi * t / d) ** .7
    return fade(norm(x * shape) * amp, .01, .03)
def tick():
    v = var(); x = bp(noise(.04), 2500 * v, 7000) * env(int(.04 * SR), .0003, .003) + sine(1900 * v, .04, .006) * .4
    return fade(norm(x) * .5 * v, .0005, .01)
def click():
    a = bp(noise(.03), 1500, 6000) * env(int(.03 * SR), .0003, .003); b = np.zeros(int(.07 * SR)); b[int(.035 * SR):int(.035 * SR) + len(a)] += a * .6
    b[:len(a)] += a; return fade(norm(b + np.pad(sine(900, .03, .004), (0, len(b) - int(.03 * SR))) * .3) * .7, .0005, .01)
def scrape(d=.25):
    t = tt(d); x = bp(noise(d), 2500, 6000) * (.6 + .4 * np.sin(2 * np.pi * 40 * t)) + sine(3100, d, 1) * .08
    return fade(norm(x) * .4, .01, .03)
def rumble(d=.6):
    t = tt(d); x = lp(noise(d), 110, 4) * np.sin(np.pi * t / d) + lp(noise(d), 600) * np.sin(np.pi * t / d) * .3
    return fade(norm(x) * .9, .02, .05)
def hum(d):
    t = tt(d); x = np.sin(2 * np.pi * 60 * t) + .5 * np.sin(2 * np.pi * 120 * t + 1) + .2 * np.sin(2 * np.pi * 180 * t + 2)
    return fade(x * .3 * (1 + .1 * np.sin(2 * np.pi * 3 * t)), .12, .12)
def spark():
    x = bp(noise(.06), 3000, 9000) * (rng.random(int(.06 * SR)) > .75) * env(int(.06 * SR), .0005, .02)
    return fade(norm(lp(x, 9000)) * .5, .001, .01)
def ringer(d, rate=15.0):
    out = np.zeros(int(d * SR) + SR)
    for k in range(int(d * rate)):
        i = int(k / rate * SR); s = elec_bell(1 + rng.uniform(-.03, .03), .22) * rng.uniform(.7, 1.0); out[i:i + len(s)] += s[:len(out) - i]
    out = out[:int(d * SR)]
    return fade(norm(out) * .8, .005, .015)    # hard stop on "home" (15 ms fade, no click)
def gasp():
    t = tt(.28); x = bp(noise(.28), 700, 1700) * np.sin(np.pi * t / .28) ** .8 + bp(noise(.28), 2200, 3200) * np.sin(np.pi * t / .28) * .3
    return fade(norm(x) * .55, .01, .03)
def birds(d):
    out = np.zeros(int(d * SR))
    for k in range(int(d * .7)):
        i = int(rng.uniform(0, d - .4) * SR); f0 = rng.uniform(2600, 3600); t = tt(.12)
        ch = np.sin(2 * np.pi * np.cumsum(f0 * (1 + .25 * np.sin(2 * np.pi * 18 * t))) / SR) * np.sin(np.pi * t / .12)
        for r in range(rng.integers(1, 4)): j = i + int(r * .15 * SR); out[j:j + len(ch)] += ch * rng.uniform(.3, .6)
    return out
def ambience(d):
    t = tt(d); wind = bp(noise(d), 180, 900) * (.6 + .4 * np.sin(2 * np.pi * .13 * t))
    return lp(wind, 1200) * .5 + lp(birds(d), 5000) * .25

# ---------------- timing (mirrors story.js) ----------------
W = json.load(open('voice.words.json'))
def at(word, n=1):
    k = 0
    for w in W:
        if ''.join(c for c in w['word'].lower() if c.isalpha() or c == "'") == word:
            k += 1
            if k == n: return w['start']
    raise KeyError(word)
T = {k: at(*v) if isinstance(v, tuple) else at(v) for k, v in dict(
    selling='selling', hears='hears', knock='knock', so1='so', huff='huff', puff='puff', blow='blow', down='down', genius1='genius', except1='except', felony='felony', tased='tased',
    so2=('so', 2), bell='bell', rope='rope', pull='pull', clever='clever', but2=('but', 2), snaps='snaps', lands='lands', skull='skull', so3=('so', 3), wire='wire', button='button', battery='battery',
    wrap='wrap', nail='nail', that='that', magnet='electromagnet', which='which', hammer='hammer', intoBell=('bell', 3), genius2=('genius', 2), except2=('except', 2), dings='dings', once='once',
    so4=('so', 4), spring='spring', breaks='breaks', buzzes='buzzes', now='now', hear='hear', ring='ring', and9='they', pretend='pretend', not_='not', home='home').items()}
END = 41.2
CUTS = [T['hears'] - .05, T['so1'], T['blow'], T['except1'], T['tased'] + .3, T['so2'], T['clever'], T['but2'], T['so3'], T['that'], T['which'], T['genius2'], T['except2'], T['so4'], T['now'], T['and9']]

# ---------------- place everything ----------------
N = int(END * SR) + 1
sfx = np.zeros((N, 2)); amb = np.zeros((N, 2)); events = []
def put(buf, t, sig, g=1.0, pan=0.0, name=None):
    i = int(round(t * SR)); s = sig[:max(0, N - i)]
    if i < 0 or not len(s): return
    L, R = np.sqrt(.5 * (1 - pan)), np.sqrt(.5 * (1 + pan))   # equal power, mono-safe (no phase tricks)
    buf[i:i + len(s), 0] += g * L * s; buf[i:i + len(s), 1] += g * R * s
    if name: events.append((round(t, 3), name))
P = lambda t, sig, g=1.0, pan=0.0, name=None: put(sfx, t, retro(sig), g, pan, name)

for k in range(1, 7): P(k * np.pi / 9, footstep(), .45 * var(), (-.15 if k % 2 else .15), 'step')
for k, d in enumerate((-.25, 0, .25)): P(T['knock'] + d, knock(), .8 * var(), .1, 'knock')
P(T['huff'] - .05, inhale(T['puff'] - T['huff'] + .25), .5, 0, 'inhale')
P(T['blow'], blow(.75), .8, 0, 'blow')
P(T['blow'] + .15, crash(), .9, .1, 'door crash'); P(T['blow'] + .45, thud(.7), .6, .1, 'door lands')
P(T['genius1'], chime(1046.5), .55, 0, 'genius ding')
P(T['except1'] + .1, footstep(), .5, .2, 'cop step'); P(T['except1'] + .32, footstep(), .5, .2, 'cop step')
P(T['tased'] - .05, zap(.5), .75, 0, 'taser'); P(T['tased'] + .02, whoosh(.3, True, 600, 5000, .4), .5, 0, 'shatter air')
P(T['tased'] + .8, thud(1), .8, 0, 'body fall')
P(T['bell'], pop(), .7, -.1, 'bell pop'); P(T['rope'], pop(), .6, -.1, 'rope pop')
P(T['pull'] + .15, brass_bell(620), .7, -.1, 'bell ring')
P(T['clever'], chime(1174.7), .55, 0, 'clever ding')
P(T['snaps'], snap(), .8, -.1, 'rope snap')
P(T['lands'] - .28, whistle_fall(.3), .5, -.05, 'fall whistle'); P(T['lands'] + .02, bonk(), .85, 0, 'bonk')
P(T['skull'], boing(), .5, 0, 'skull boing')
P(T['so3'] - .05, pop(), .7, -.15, 'box pop'); P(T['wire'] + .1, whoosh(.3, True, 500, 4500, .6), .7, 0, 'slice open'); P(T['wire'] + .4, thud(.4), .35, 0, 'slice settle')
P(T['button'], pop(), .6, -.15, 'button pop'); P(T['battery'], pop(), .6, -.15, 'battery pop')
for k in range(int((T['nail'] - T['wrap']) / .11)): P(T['wrap'] + k * .11, tick(), .45, -.1, 'coil tick' if k == 0 else None)
P(T['nail'], scrape(.25), .5, -.1, 'nail slide')
P(T['that'], rumble(.6), .7, 0, 'ground drops'); P(T['that'], whoosh(.4, False, 300, 2500, .4), .4, 0, None)
P(T['magnet'], hum(T['now'] - T['magnet']), .35, 0, 'magnet hum')
P(T['hammer'], pop(), .6, -.1, 'hammer pop'); P(T['intoBell'] - .05, elec_bell(1.0, .9), .7, -.1, 'hammer ding')
P(T['genius2'], chime(1046.5 * 1.122), .55, 0, 'genius ding 2')
for p_ in (T['except2'] + .3, T['dings'] - .05, T['once'] + .2, T['spring'] - .3, T['breaks'] - .2): P(p_, click(), .7, -.1, 'button click')
P(T['dings'] - .05, elec_bell(1.0, .9), .7, -.1, 'single ding')
P(T['spring'], pop(), .6, -.1, 'spring pop')
k = 0
while T['breaks'] + k * .5 < T['buzzes']:
    t0 = T['breaks'] + k * .5; P(t0, elec_bell(1 + rng.uniform(-.03, .03), .4), .55, -.1, 'demo ding'); P(t0 + .02, spark(), .5, -.1, 'spark'); k += 1
P(T['buzzes'], ringer(T['home'] - T['buzzes']), .5, -.05, 'bell buzzing')
P(T['now'], whoosh(.3, False, 400, 3500, .5), .55, 0, 'slice close'); P(T['now'] + .33, thud(.5), .45, 0, 'ground back')
P(T['hear'], gasp(), .55, .2, 'pig gasp'); P(T['hear'] + .15, pop(), .4, .2, 'headphones off')
P(T['pretend'] + .15, thud(.6), .5, .2, 'pig ducks'); P(T['home'], click(), .9, .15, 'light switch')
# scene-cut air: a quiet whoosh on cuts that have no hit of their own
hits = [e[0] for e in events]
for c in CUTS:
    if min(abs(c - h) for h in hits) > .12: P(c - .12, whoosh(.24, True, 500, 3000, .3), .3, 0, 'cut air')
# room tone / ambience bed (stereo, decorrelated noise sums fine to mono), dips with the lights at the end
for ch in (0, 1): a_ = ambience(END + .1)[:N]; amb[:len(a_), ch] = a_
amb *= .18; amb[int(T['home'] * SR):] *= .45

# felt-piano bed, then a sad two-note button after "home"
def felt(m, vel, d=2.4):
    f = 440 * 2 ** ((m - 69) / 12); t = tt(d); x = sum(.55 ** (k - 1) * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (.9 + .8 * k)) for k in range(1, 6))
    return fade(lp(x, 2200) * vel, .008, .1)
bed = np.zeros((N, 2)); prog = [[48, 60, 64, 67], [45, 57, 60, 64], [41, 57, 60, 65], [43, 55, 59, 62]]
for i in range(int(T['home'] / 2) + 1):
    for k, m in enumerate(prog[i % 4]): put(bed, i * 2 + k * .04, felt(m, .5), .35, (k - 1.5) * .2)
bed[int(T['home'] * SR):] *= 0
for k, m in enumerate((64, 60)): put(bed, T['home'] + .35 + k * .45, felt(m, .6, 1.6), .5, 0)

# ---------------- mix ----------------
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', 'voice.mp3', '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
v = np.frombuffer(raw, '<i2').astype(float) / 32767; voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]
voice = hp(voice, 80)
def follower(x, win=.05):
    k = int(win * SR); e = np.sqrt(np.convolve(x ** 2, np.ones(k) / k, 'same')); return np.clip(e / (np.percentile(e, 98) + 1e-9), 0, 1)
act = np.convolve(follower(voice), np.ones(int(.08 * SR)) / int(.08 * SR), 'same')
carve = lambda x, d: x - d * np.stack([bp(x[:, c], 1000, 4000) for c in (0, 1)], 1)
sfx_m = carve(sfx, .35) * (1 - .35 * act)[:, None]        # SFX: ~-3.5 dB presence dip + up to -3.7 dB duck under voice
bed_m = carve(bed, .6) * (1 - .55 * act)[:, None]         # music: deeper carve + duck
amb_m = carve(amb, .3) * (1 - .3 * act)[:, None]
db = lambda x: 10 ** (x / 20)
mix = voice[:, None] * db(-3) + norm(sfx_m) * db(-9) + norm(bed_m) * db(-21) + norm(amb_m) * db(-30)
mix = hp(mix.T, 30).T

# ---------------- master: loudness to -14 LUFS, true peak <= -1.0 dBTP ----------------
def tp_limit(x, ceil_db=-1.2, look=.004, rel=.08):
    os_ = np.stack([resample_poly(x[:, c], 4, 1) for c in (0, 1)], 1)       # 4x oversampled peak detection
    pk = np.abs(os_).max(1).reshape(-1, 4).max(1)[:len(x)]
    ceil = db(ceil_db); need = np.minimum(1, ceil / np.maximum(pk, 1e-9))
    k = int(look * SR); g = np.minimum.accumulate(need[::-1])[::-1] if False else need.copy()
    g = np.array([need[max(0, i - k):i + k + 1].min() for i in range(0, len(need), 64)]).repeat(64)[:len(need)]  # look-ahead min
    a = np.exp(-1 / (rel * SR / 64)); sm = np.empty_like(g[::64]); gg = g[::64]; cur = 1.0
    for i, val in enumerate(gg): cur = val if val < cur else a * cur + (1 - a) * val; sm[i] = cur
    gain = np.interp(np.arange(len(x)), np.arange(len(sm)) * 64, sm)
    return x * gain[:, None]
def write(path, x):
    import wave
    with wave.open(path, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())
def measure(path):
    m = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'loudnorm=I=-14:TP=-1:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
    j = json.loads(m[m.rindex('{'):m.rindex('}') + 1]); return float(j['input_i']), float(j['input_tp'])
x = mix / np.abs(mix).max() * .5
for it in range(6):
    write('build/_m.wav', tp_limit(x)); I, tp = measure('build/_m.wav')
    if abs(I + 14) < .3: break
    x *= db(-14 - I)
final = tp_limit(x); write('build/mix.wav', final); I, tp = measure('build/mix.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'build/mix.wav', '-c:a', 'libmp3lame', '-b:a', '192k', 'build/mix.mp3'], check=True)
I2, tp2 = measure('build/mix.mp3')
mono = final.mean(1); corr = float(np.corrcoef(final[:, 0], final[:, 1])[0, 1])
rep = [f'integrated loudness: {I:.1f} LUFS (wav), {I2:.1f} LUFS (mp3)', f'true peak: {tp:.2f} dBTP (wav), {tp2:.2f} dBTP (mp3)',
       f'sample peak: {20 * np.log10(np.abs(final).max()):.2f} dBFS', f'L/R correlation: {corr:.2f} (1 = mono-identical; >0.5 is phone-safe)',
       f'mono sum peak: {20 * np.log10(np.abs(mono).max()):.2f} dBFS', f'{len(events)} SFX events']
open('build/report.txt', 'w').write('\n'.join(rep + [f'{t:7.3f}  {n}' for t, n in sorted(events)]))
print('\n'.join(rep))
