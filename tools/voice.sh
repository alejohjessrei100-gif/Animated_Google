#!/usr/bin/env bash
# tools/voice.sh <elevenlabs.mp3> <project> ["prompt words"]  -> projects/<p>/audio/voice_125.wav + projects/<p>/web/words.js
set -euo pipefail; R="$(cd "$(dirname "$0")/.." && pwd)"; P="$R/projects/$2"; mkdir -p "$P/audio" "$P/web"
cp "$1" "$P/audio/voice_raw.mp3"; ffmpeg -v error -y -i "$P/audio/voice_raw.mp3" -af atempo=1.25 -ar 48000 "$P/audio/voice_125.wav"
echo "voice 1.25x: $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$P/audio/voice_125.wav") s"
python3 "$R/tools/words_from_voice.py" "$P/audio/voice_125.wav" "$P/web/words.js" "${3:-Gus, Steve, kingdom.}"
