#!/usr/bin/env bash
# tools/save.sh "commit message"  -> git add -A, commit with the session attribution, push to the working branch (retries)
set -euo pipefail; cd "$(dirname "$0")/.."; b=$(git rev-parse --abbrev-ref HEAD)
git add -A; git diff --cached --quiet && { echo "nothing to commit"; exit 0; }
git commit -qm "$1

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BkBa4Pm4vkFjYmz8kn8L7a"
for i in 1 2 3 4; do git push -q -u origin "$b" && { echo "pushed $b"; exit 0; } || sleep $((2**i)); done; echo "push failed"; exit 1
