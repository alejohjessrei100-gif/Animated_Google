#!/usr/bin/env bash
# tools/mix.sh <project> [MusicName=MonkeysSpinningMonkeys]  -> projects/<p>/web/mix.mp3 (voice + music -21 dB + SFX, loudnorm -14 LUFS)
set -euo pipefail; R="$(cd "$(dirname "$0")/.." && pwd)"; P="$R/projects/$1"; M="$R/assets/music/${2:-MonkeysSpinningMonkeys}.mp3"
END=$(python3 -c "import json,re;w=json.loads(re.search(r'\[.*\]',open('$P/web/words.js').read(),re.S).group(0));print(round(w[-1][2]+0.4,2))")
python3 "$R/tools/sfx_bus.py" "$P/audio/sfx_cues.py" "$P/audio/sfx_bus.wav" "$END"
ffmpeg -v error -y -i "$P/audio/voice_125.wav" -stream_loop 2 -i "$M" -i "$P/audio/sfx_bus.wav" -filter_complex "[0:a]aformat=channel_layouts=stereo,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,volume=2dB[v];[1:a]atrim=0:$END,asetpts=N/SR/TB,volume=-21dB,afade=t=out:st=$(python3 -c "print($END-1.0)"):d=0.9[m];[2:a]aformat=channel_layouts=stereo,volume=-1dB[s];[v][m][s]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-2:LRA=11,atrim=0:$END[o]" -map "[o]" -ar 48000 -ac 2 -b:a 192k "$P/web/mix.mp3"
echo "mix.mp3: $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$P/web/mix.mp3") s (END $END); set STORY END to $END"
