#!/usr/bin/env bash
# Start a new short from the house template: tools/new_video.sh <project-name> ["Title"]
set -euo pipefail
name="$1"; title="${2:-$1}"; root="$(cd "$(dirname "$0")/.." && pwd)"; dst="$root/projects/$name/web"
[ -e "$dst" ] && { echo "projects/$name already exists"; exit 1; }
mkdir -p "$root/projects/$name/audio" && cp -r "$root/template/web" "$dst" && cp "$root/lib/scenery.js" "$dst/scenery.js"
slug="$(echo "$name" | tr '-' '_')"
sed -i "s#<title>New Short Render</title>#<title>$title Render</title>#; s#<i></i>New Short<i></i>#<i></i>$title<i></i>#" "$dst/index.html"
sed -i "s/new_short_/${slug}_/" "$dst/app.js"
cp "$root/projects/sinking-tower/audio/sfx_cues.py" "$root/projects/$name/audio/sfx_cues.py"
echo "Created projects/$name (template + scenery kit + Gus). Next: words.js from the voice, then world.js set pieces, story.js beats, audio/sfx_cues.py."
