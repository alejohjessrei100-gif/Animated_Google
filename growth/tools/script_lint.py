#!/usr/bin/env python3
"""Score a Shorts script against the hook + retention rules (Ricks study, docs/02-03) BEFORE paying for a voice take.

Usage: python3 script_lint.py script.txt [--wps 2.98]
  --wps  words per second of the final edit (default 2.98 = this channel's ElevenLabs voice at 1.25x)
Exit code 0 = ship it, 1 = fix the FAILs first.
"""
import re, sys

ABSTRACT = {'concept', 'process', 'system', 'factor', 'factors', 'various', 'important', 'significant', 'aspect', 'aspects', 'phenomenon',
            'mechanism', 'essentially', 'basically', 'generally', 'typically', 'numerous', 'overall', 'utilize', 'individuals'}
CTA = re.compile(r'\b(subscribe|follow for|like and|comment below|link in bio|part 2|stay tuned)\b', re.I)
ANALOGY = re.compile(r"\b(it'?s like|like a|like an|imagine|ever (?:tried|seen|blown|noticed|wondered))\b", re.I)
SNAP = re.compile(r'\b(but|yet|and then|until|except|only|still|instead|turns out|perfectly|never)\b', re.I)

def main():
    a = sys.argv[1:]; wps = 2.98
    if '--wps' in a: i = a.index('--wps'); wps = float(a[i + 1]); del a[i:i + 2]
    raw = open(a[0]).read()
    text = re.sub(r'\[[^\]]*\]', '', raw); text = re.sub(r'\s+', ' ', text).strip()
    words = re.findall(r"[A-Za-z0-9][A-Za-z0-9'\-,]*", text)
    sents = [s.strip() for s in re.split(r'(?<=[.?!])["\u201d]?\s+', text) if s.strip()]
    n = len(words); dur = n / wps
    hook = []
    for s in sents:
        hook.append(s)
        if len(' '.join(hook).split()) >= 8: break
    hook_t = ' '.join(hook); hook_n = len(hook_t.split())
    first3 = ' '.join(words[:int(3 * wps)])
    res = []
    def chk(name, ok, detail, warn=False): res.append(('PASS' if ok else ('WARN' if warn else 'FAIL'), name, detail))
    chk('length 40-55 s', 40 <= dur <= 55, f'{n} words = {dur:.1f} s at {wps} w/s')
    chk('hook 8-20 words', 8 <= hook_n <= 20, f'{hook_n} words: "{hook_t}"')
    chk('context in first 3 s', bool(re.search(r'\d|lottery|bank|casino|money|\$|heist|law|million|rule', first3, re.I)), f'first 3 s: "{first3}"')
    chk('snapback in hook (contrarian turn)', bool(SNAP.search(' '.join(sents[:3]))), 'needs a turn word (but / yet / perfectly / until...) in the first 2-3 sentences')
    chk('"You see," context beat', len(re.findall(r'you see', text, re.I)) >= 1, f'{len(re.findall(r"you see", text, re.I))}x (Ricks uses 1-2)')
    chk('mockery line in quotes', '"' in raw or '“' in raw, 'a short quoted joke line from a doubter', warn=True)
    chk('"Wait..." mystery beat', bool(re.search(r'\bwait\b', text, re.I)), 'voices the viewer\'s confusion mid-video (retention re-hook)')
    chk('one everyday analogy', bool(ANALOGY.search(text)), 'it\'s like / imagine / ever ...?')
    nums = re.findall(r'\b\d[\d,]*\b|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million)\b', text, re.I)
    chk('specific numbers (>= 4)', len(nums) >= 4, f'{len(nums)} found')
    chk('no CTA / outro', not CTA.search(text), 'CTAs cut retention at the end')
    last = sents[-1].lower(); hook_kw = {w.lower().strip('.,?!') for w in words[:25] if len(w) > 4}
    loop = hook_kw & {w.strip('.,?!') for w in last.split()}
    chk('ending calls back to the hook', bool(loop) or bool(re.search(r'number|again|first|never', last)), f'shared words: {sorted(loop) or "none"} | last line: "{sents[-1]}"', warn=True)
    longs = [s for s in sents if len(s.split()) > 16]
    chk('no long sentences (> 16 words)', not longs, '; '.join(f'"{s[:60]}..."' for s in longs) or 'ok')
    ab = sorted({w.lower() for w in words if w.lower().strip(",") in ABSTRACT})
    chk('no abstract words (unanimatable)', not ab, ', '.join(ab) or 'ok', warn=True)
    gaps = []; ws = [w.lower() for w in text.split()]; prev = 0; n2 = len(ws)
    for i, w in enumerate(ws):
        if w.strip('.,!"') in ('wait', 'you') or '?' in w: gaps.append((i - prev) / wps); prev = i
    worst = max([(n2 - prev) / wps] + gaps) if n2 else 0
    chk('re-hook at least every 15 s', worst <= 15, f'longest stretch without a question / "you" / wait: {worst:.1f} s', warn=True)
    w = max(len(r[1]) for r in res)
    for st, name, d in res: print(f'{st:5} {name:<{w}}  {d}')
    fails = sum(r[0] == 'FAIL' for r in res); warns = sum(r[0] == 'WARN' for r in res)
    score = round(100 * sum(r[0] == 'PASS' for r in res) / len(res))
    print(f'\nSCORE {score}/100  ({fails} fail, {warns} warn)  ->  {"SHIP IT" if not fails else "FIX FAILS BEFORE RECORDING"}')
    sys.exit(1 if fails else 0)

if __name__ == '__main__': main()
