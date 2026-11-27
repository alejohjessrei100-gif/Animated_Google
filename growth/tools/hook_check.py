#!/usr/bin/env python3
"""Measure the first seconds and the ending of a rendered Short (the swipe-away zone and the rewatch loop).

Usage: python3 hook_check.py video.mp4
Targets (Ricks study, docs/03 + docs/07): frame 0 already moving, voice starts <= 0.15 s, a new visual beat by 2.5 s,
composition change every <= 2.2 s in the first 5 s, no black/blank opening, ending <= 0.5 s after the last word,
last frame looks like the first frame (seamless loop = free rewatches; optional but powerful).
"""
import subprocess, sys, re, numpy as np

def frames(v, w=72, h=128):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', v, '-vf', f'scale={w}:{h}', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3).astype(np.float32)

def main():
    v = sys.argv[1]; F = frames(v); n = len(F); fps = 30
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', v], capture_output=True, text=True).stdout)
    G = F.mean(3); d = np.abs(G[1:] - G[:-1]).mean((1, 2))
    hist = np.array([np.concatenate([np.histogram(f[..., c], 16, (0, 256))[0] for c in range(3)]) / (f.shape[0] * f.shape[1]) for f in F])
    d8 = np.abs(hist[8:] - hist[:-8]).sum(1)
    changes = [i for i in range(1, len(d8)) if d8[i] > 0.6 and d8[i - 1] <= 0.6]
    err = subprocess.run(['ffmpeg', '-i', v, '-af', 'silencedetect=n=-35dB:d=0.08', '-f', 'null', '-'], capture_output=True, text=True).stderr
    ss = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', err)]; se = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', err)]
    voice0 = se[0] if ss and ss[0] < 0.05 and se else 0.0
    tail = dur - ss[-1] if ss and (len(se) < len(ss)) else 0.0
    res = []
    def chk(name, ok, detail): res.append(('PASS' if ok else 'FAIL', name, detail))
    chk('opening frame not blank', 20 < G[0].mean() < 235 and G[0].std() > 12, f'luma {G[0].mean():.0f}, contrast {G[0].std():.0f}')
    chk('moving from frame 0', d[:6].mean() > 1.0, f'mean frame diff first 0.2 s = {d[:6].mean():.2f}')
    chk('voice starts <= 0.15 s', voice0 <= 0.15, f'{voice0:.2f} s')
    first_beat = next((c / fps for c in changes if c / fps > 0.3), None)
    chk('second visual beat by 2.5 s', first_beat is not None and first_beat <= 2.5, f'first composition change at {first_beat if first_beat is None else round(first_beat, 2)} s')
    c5 = [c / fps for c in changes if c / fps <= 5.0]; gaps = np.diff([0] + c5 + [5.0])
    chk('new composition every <= 2.2 s (0-5 s)', gaps.max() <= 2.2, f'{len(c5)} changes, longest hold {gaps.max():.2f} s')
    chk('ends <= 0.5 s after last word', tail <= 0.5, f'{tail:.2f} s of tail')
    loop = 1 - np.abs(hist[-1] - hist[0]).sum() / 6
    res.append(('INFO', 'loop match (last vs first frame)', f'{loop:.2f}  (>= 0.80 = seamless loop; consider matching the final shot to the hook shot)'))
    w = max(len(r[1]) for r in res)
    for st, name, det in res: print(f'{st:5} {name:<{w}}  {det}')
    fails = sum(r[0] == 'FAIL' for r in res)
    print(f'\nHOOK {"PASS" if not fails else "FAIL"} ({fails} fail)'); sys.exit(1 if fails else 0)

if __name__ == '__main__': main()
