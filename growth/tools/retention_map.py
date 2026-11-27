#!/usr/bin/env python3
"""Turn a YouTube retention curve into a fix list: which LINE and which SHOT lost viewers.

Usage: python3 retention_map.py retention.csv words.json [--dur 52.9] [--shots shots.json]
  retention.csv : export from YouTube Studio > Analytics > Advanced mode > (video) > Audience retention, or the Analytics API
                  (columns: a time column in seconds OR a 0-1 / 0-100 position column, and a retention % column; header names are auto-detected)
  words.json    : the word timings this pipeline already makes ([[word, start, end], ...] or [{"w","s","e"}])
  shots.json    : optional [{"t": start_s, "set": "studio"}, ...] (STORY.SHOTS) to name the shot at each drop
Prints: the swipe-away rate in the first 3 s, the 5 steepest drops with the sentence being spoken, and the rewatch spikes.
"""
import csv, json, sys, re

def load_curve(p, dur):
    rows = list(csv.reader(open(p, encoding='utf-8-sig'))); head = [h.lower() for h in rows[0]]; data = [r for r in rows[1:] if r and r[0].strip()]
    ti = next((i for i, h in enumerate(head) if re.search(r'time|second|elapsed|position|ratio|moment', h)), 0)
    ri = next((i for i, h in enumerate(head) if re.search(r'retention|watch|audience|%', h) and i != ti), 1)
    pts = []
    for r in data:
        try: x = float(r[ti].replace('%', '').replace(':', '.')); y = float(r[ri].replace('%', ''))
        except ValueError: continue
        pts.append([x, y])
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    if max(xs) <= 1.0: xs = [x * dur for x in xs]
    elif max(xs) <= 100 and dur < 95 and max(xs) > dur * 1.2: xs = [x / 100 * dur for x in xs]
    if max(ys) <= 2.5: ys = [y * 100 for y in ys]
    return list(zip(xs, ys))

def main():
    a = sys.argv[1:]; opt = lambda k, d=None: (a[a.index(k) + 1] if k in a else d)
    raw = open(a[1]).read(); raw = raw[raw.index('['):raw.rindex(']') + 1]; W = json.loads(raw); W = [[w['w'], w['s'], w['e']] if isinstance(w, dict) else w for w in W]
    dur = float(opt('--dur', W[-1][2] + 0.3)); shots = json.load(open(opt('--shots'))) if opt('--shots') else []
    C = load_curve(a[0], dur)
    sents, cur = [], []
    for w in W:
        cur.append(w)
        if re.search(r'[.?!]$', w[0]): sents.append(cur); cur = []
    if cur: sents.append(cur)
    line_at = lambda t: next((' '.join(x[0] for x in s) for s in sents if s[0][1] - 0.3 <= t <= s[-1][2] + 0.3), '(between lines)')
    shot_at = lambda t: max([s for s in shots if s['t'] <= t], key=lambda s: s['t'], default={'set': '?'})['set'] if shots else '-'
    at = lambda t: min(C, key=lambda p: abs(p[0] - t))[1]
    print(f'Start {C[0][1]:.0f}%  |  at 3 s {at(3):.0f}%  (swipe-away in the hook: {C[0][1] - at(3):.0f} pts)  |  end {C[-1][1]:.0f}%  |  avg {sum(y for _, y in C) / len(C):.0f}%')
    drops = []
    for i in range(1, len(C)):
        (x0, y0), (x1, y1) = C[i - 1], C[i]
        if x1 > x0: drops.append(((y0 - y1) / (x1 - x0), x0, x1, y0 - y1))
    print('\nSteepest drops (fix these lines/shots first):')
    for slope, x0, x1, dy in sorted(drops, reverse=True)[:5]:
        print(f'  {x0:5.1f}-{x1:5.1f} s  -{dy:4.1f} pts  shot: {shot_at(x0):10}  line: "{line_at(x0)}"')
    ups = [(x1, y1 - y0) for (x0, y0), (x1, y1) in zip(C, C[1:]) if y1 > y0 + 0.5]
    if ups: print('\nRewatch spikes (keep / copy these):'); [print(f'  {x:5.1f} s  +{dy:.1f} pts  "{line_at(x)}"') for x, dy in sorted(ups, key=lambda u: -u[1])[:3]]
    print('\nRules of thumb: a drop in 0-3 s = hook/thumbnail-frame problem; a slope in the middle = a dead stretch (no new action or re-hook);'
          ' a cliff at the end = the ending drags or there is an outro. Over 100% at the end = people rewatch (loop).')

if __name__ == '__main__': main()
