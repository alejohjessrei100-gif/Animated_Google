#!/usr/bin/env bash
# tools/qa_render.sh <video.mp4>  -> format check (re-encode / rotation), motion QA, 2 fps contact sheets in <video dir>/qa_<name>/
set -euo pipefail; R="$(cd "$(dirname "$0")/.." && pwd)"; v="$1"; out="$(dirname "$v")/qa_$(basename "${v%.*}")"; mkdir -p "$out"
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,bit_rate,r_frame_rate:stream_side_data=rotation -of json "$v" | python3 -c "import json,sys;s=json.load(sys.stdin)['streams'][0];r=[d.get('rotation') for d in s.get('side_data_list',[]) if 'rotation' in d];print(f\"{s['width']}x{s['height']} @ {s['r_frame_rate']} fps, {int(s.get('bit_rate',0))//1000} kbps, rotation {r[0] if r else 0}\")"
ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0 "$v" | grep -q "^1080,1920" || echo "WARNING: not 1080x1920; this file was re-encoded after export (upload the original saved MP4)"
python3 "$R/tools/qa/qa_motion.py" "$v" 2>&1 | tail -11
rm -f "$out"/f*.jpg; ffmpeg -v error -i "$v" -vf "fps=2,scale=270:-1" "$out/f%03d.jpg"
python3 - "$out" <<'PY'
import glob, sys
from PIL import Image
d = sys.argv[1]; fs = sorted(glob.glob(d + '/f*.jpg')); w, h = Image.open(fs[0]).size; n = 12
for part in range(0, len(fs), 48):
    sub = fs[part:part + 48]; rows = (len(sub) + n - 1) // n; S = Image.new('RGB', (w * n, h * rows), 'white')
    for i, f in enumerate(sub): S.paste(Image.open(f), ((i % n) * w, (i // n) * h))
    S.save(f'{d}/sheet{part // 48}.jpg', quality=85)
print('sheets:', sorted(glob.glob(d + '/sheet*.jpg')), '(each tile = 0.5 s)')
PY
