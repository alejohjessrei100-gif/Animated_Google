"""Write solved camera numbers (build/shots.json) back into src/story.js, keeping each shot's word-based start time."""
import json, re, pathlib
p = pathlib.Path('src/story.js'); s = p.read_text()
a = s.index('const SHOTS = [\n') + len('const SHOTS = [\n'); b = s.index('];', a)
lines = [l for l in s[a:b].split('\n') if l.strip()]
shots = json.load(open('build/shots.json'))
out = []
for line, sh in zip(lines, shots):
    start = re.match(r'\s*\[([^,]+),', line).group(1)
    mv = re.search(r'\[\s*(T\.[a-zA-Z0-9]+(?:\s*[+-]\s*[\d.]+)?|[\d.]+)\s*,\s*\[[^\]]*\]\s*,\s*\[[^\]]*\]\s*,\s*([\d.]+)\]\]', line)
    j = lambda v: '[' + ', '.join(str(x) for x in v) + ']'
    move = f", [{mv.group(1)}, {j(sh[4][1])}, {j(sh[4][2])}, {mv.group(2)}]" if sh[4] and mv else ''
    out.append(f"  [{start}, {j(sh[1])}, {j(sh[2])}, {sh[3]}{move}],")
assert len(out) == len(lines) == len(shots)
p.write_text(s[:a] + '\n'.join(out) + '\n' + s[b:]); print('applied', len(out), 'shots')
