# Playbook: hooks, retention, volume

What actually moves the money on a Shorts channel, in order (from the 19-video Ricks study in the kit, docs/07):
1. **Idea and title.** The same craft got 123K views on an explainer and 8M+ on a story. Pick from `IDEAS.md`.
2. **The first 2.5 seconds.** Most viewers who leave, leave here.
3. **Holding to the end, plus loops.** Retention and rewatches decide distribution.
4. **Volume.** Ricks posts about 6 per week. The engine here exists so each new video is a script, a cast and sets, not a rebuild.

Honest money note: Shorts ad revenue is low per view, typically cents per 1,000 views depending on the audience's country. Shorts money comes from volume, plus what the audience unlocks: long-form versions of the best stories, sponsors, and a channel big enough to sell. Treat Shorts as the funnel.

## The loop for every video (about 1 day each once the engine is reused)
| Step | Tool | Pass bar |
|---|---|---|
| 1. Pick the story | `IDEAS.md` + YouTube search for copycats | A story with a person, a trick and a twist; not saturated in the last 6 months |
| 2. Three titles, pick one | Patterns in `IDEAS.md` | Sounds impossible, not like a school lesson |
| 3. Write the script | `growth/tools/script_lint.py script.txt` | SHIP IT (0 fail), 40–55 s |
| 4. One voice take | ElevenLabs, state the credit cost first | Lively, no clipped words |
| 5. Animate | `projects/<slug>/web` (this engine) | Every clause gets a story action and a camera move |
| 6. Check the hook | `growth/tools/hook_check.py preview.mp4` | HOOK PASS: moving from frame 0, voice ≤ 0.15 s, second beat ≤ 2.5 s |
| 7. Check motion and framing | kit `qa_motion.py` + `projects/triple-six-fix/tools/audit_cards.js` | PASS, no characters cut off |
| 8. Render and post | Render page, then upload the original MP4 | Title, description, music credit |
| 9. After 48 h | `growth/tools/retention_map.py retention.csv words.json` | Read the 5 steepest drops and fix that pattern in the next video |

## Hook rules (first 2.5 s)
- **Frame 0 is the hook happening**, mid-action, camera already moving. Never an establishing shot.
- **Context in the first 3 words of audio**, matching what's on screen and in the caption.
- **Lean, then snapback:** "rigged a lottery with house paint… *and on live TV, it worked perfectly*."
- **A second visual beat by 2.5 s:** a reveal, impact, glow or a follow move.
- **The voice starts at 0.0 s.** No music intro, no logo.

## Retention rules (the middle)
- **Re-hook at least every 15 s:** a question, a "Wait…?", "you", or a number reveal. `script_lint` warns when a stretch runs longer.
- **New composition every ≤ 2.2 s,** and something new happens about every second (qa_motion enforces this).
- **No abstract sentences:** every clause has to be something a character does or the camera can show.
- **Jokes about every 10 s,** mostly hyperbolic comparisons.

## Ending rules
- **The ending is the biggest spectacle**, then cut 0.3 s after the last word. No CTA and no outro, because any outro shows up as a cliff in retention.
- **Loop it:** the last image echoes the first shot so the rewatch feels seamless. `hook_check` reports a loop-match score.

## After posting: reading the data
- **A drop in 0–3 s:** the hook or the first frame is the problem. Try a stronger paradox line, or move the most impossible image to frame 0.
- **A steady slope in the middle:** a dead stretch. Find the line in `retention_map` output and add an action or a "Wait…?" there next time.
- **A cliff at the end:** the ending drags.
- **Over 100% at the end:** people rewatch. Copy that ending style.
- Keep a sheet with: video, title, 3-second hold %, average % viewed, views at 48 h, and what you changed. Change one thing per video.
