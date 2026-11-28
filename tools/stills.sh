#!/usr/bin/env bash
# tools/stills.sh <project> "<frames: 0,120,300 | 0-149 | mid>" [width=540] [cols=6]  -> projects/<p>/stills/sheet.jpg
set -euo pipefail; R="$(cd "$(dirname "$0")/.." && pwd)"; P="$R/projects/$1"; W=${3:-540}; H=$((W * 16 / 9)); out="$P/stills"
rm -rf "$out"; mkdir -p "$out"; cp "$P/web/index.html" "$P/web/test.html"
VENDOR="$R/tools/vendor" PW=$W PH=$H node "$R/tools/stills.cjs" "$P/web" "$out" "$2" 2>&1 | grep -v "404" | tail -3
rm -f "$P/web/test.html"; python3 "$R/tools/sheet.py" "$out" "${4:-6}"; echo "sheet: $out/sheet.jpg"
