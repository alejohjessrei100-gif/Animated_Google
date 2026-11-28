#!/usr/bin/env bash
# tools/script.sh <script.txt>  -> word count, length at the 1.25x voice, lint, and the one-line ElevenLabs version (script_oneline.txt)
set -euo pipefail; R="$(cd "$(dirname "$0")/.." && pwd)"; f="$1"; o="${f%.txt}_oneline.txt"
n=$(wc -w < "$f"); echo "$n words = about $(python3 -c "print(round($n/3.55))") s at the 1.25x voice (target 210-220 words / 60 s)"
python3 "$R/growth/tools/script_lint.py" "$f" 2>&1 | grep -E "FAIL|WARN" | grep -vE "You see|context in first|length 40-55|Wait\.\.\.|mockery" || echo "lint: no issues for this template"
tr '\n' ' ' < "$f" | sed 's/ $//; s/\([.?!"]\) /\1/g' > "$o"; echo >> "$o"; echo "--- one-line ($o):"; cat "$o"
