#!/usr/bin/env bash
# tools/render_cloud.sh <project> [workers=4] [width=1080]  -> projects/<p>/<p>_1080x1920.mp4 (headless render, no page, audio muxed)
set -euo pipefail; R="$(cd "$(dirname "$0")/.." && pwd)"; P="$R/projects/$1"; N=${2:-4}; W=${3:-1080}; H=$((W * 16 / 9)); out="$P/render_frames"
TOTAL=$(node -e "const s=require('fs').readFileSync('$P/web/story.js','utf8'); const m=s.match(/END = ([0-9.]+)/); console.log(Math.round(m[1]*30))")
mkdir -p "$out"; cp "$P/web/index.html" "$P/web/test.html"; echo "rendering $TOTAL frames at ${W}x${H} with $N workers"
pids=(); for i in $(seq 0 $((N - 1))); do a=$((TOTAL * i / N)); b=$((TOTAL * (i + 1) / N - 1));
  todo=$(python3 -c "import os;print(','.join(str(f) for f in range($a,$b+1) if not os.path.exists('$out/f%04d.jpg'%f)))")
  [ -z "$todo" ] && continue; (VENDOR="$R/tools/vendor" PW=$W PH=$H Q=0.95 node "$R/tools/stills.cjs" "$P/web" "$out" "$todo" > "$out/worker$i.log" 2>&1) & pids+=($!); done
for p in "${pids[@]}"; do wait $p; done; rm -f "$P/web/test.html"
n=$(ls "$out"/f*.jpg | wc -l); [ "$n" -lt "$TOTAL" ] && { echo "only $n/$TOTAL frames; rerun to resume"; exit 1; }
ffmpeg -v error -y -framerate 30 -i "$out/f%04d.jpg" -i "$P/web/mix.mp3" -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "$P/$1_${W}x${H}.mp4"
echo "done: $P/$1_${W}x${H}.mp4 ($(du -h "$P/$1_${W}x${H}.mp4" | cut -f1))"
