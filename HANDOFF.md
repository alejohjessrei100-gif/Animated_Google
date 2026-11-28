# Handoff: where we are (session of 2026-11-28)

Branch: `claude/new-session-fcw8h5` (everything is committed and pushed). Read `CLAUDE.md` first: it has the user's standing rules and the one-command tools.

## The task in progress
**Render "The Tax Bunker" to a full 1080×1920 MP4 on the user's PC (with their graphics card) and save it in their folder.** Not the render page, and not a cloud render: the user explicitly does not want cloud rendering or any alternatives they didn't ask for. Do exactly what they ask.

- Project: `projects/tax-bunker/web` (`index.html`, `story.js`, `world.js`, `scenery.js`, `toon.js`, `engine.js`, `app.js`, `words.js`, `mix.mp3`, `LilitaOne.ttf`). Length 56.8 s, 1704 frames at 30 fps.
- It passes `node tools/autocheck.cjs projects/tax-bunker/web` (ALL CLEAR) and a visual still pass. Captions dodge faces.
- How to render on the PC:
  - Needs Node.js, `npm i playwright` (Chromium, or `CHANNEL=chrome` for installed Chrome) and ffmpeg.
  - Render the frames with the GPU: `GPU=1 PW=1080 PH=1920 Q=0.95 node tools/stills.cjs projects/tax-bunker/web <outdir> "0-1703"`. VENDOR is not needed when online, because three.js loads from jsdelivr. Offline, set `VENDOR=tools/vendor`, and `tools/stills.cjs` serves `test.html`, so copy `index.html` to `test.html` first.
  - Then mux: `ffmpeg -framerate 30 -i <outdir>/f%04d.jpg -i projects/tax-bunker/web/mix.mp3 -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart tax_bunker_1080x1920.mp4`.
  - `tools/render_cloud.sh tax-bunker 4 1080` does both steps (bash; on Windows use Git Bash, and add `GPU=1`).
  - Or drive the page's own exporter: `app.js` `render()` uses WebCodecs and writes the MP4 with audio. In headless mode, call it via Playwright and capture the blob.
- Render page (the user's previous method, on phone): https://claude.ai/artifact/Fj1qwhviCCFZBmjSgFt6eZ

## Other videos (all built, pushed, render pages published)
| Project | Status | Render page |
|---|---|---|
| `projects/escalation-test` "The Well That Was Never Yours" | the hit: 102% retention, 80% stayed | https://claude.ai/artifact/QqPRBDjL8RwntKmikRaFqs |
| `projects/toll-road` "The Toll Road" (Gus) | done | https://claude.ai/artifact/EG3az5DXZspMYBRTTbDYHX |
| `projects/sinking-tower` "The Sinking Tower" (Gus) | done; user called the story weak (no stakes or payoff) | https://claude.ai/artifact/Wi5dLvqyVigM654ELpDwEL |
| `projects/tax-bunker` "The Tax Bunker" (Gus) | current; written to the user's 7-step template | https://claude.ai/artifact/Fj1qwhviCCFZBmjSgFt6eZ |
| `projects/dragon-egg` | script only (older format) | - |

## Key decisions the user made (also in CLAUDE.md)
- Scripts follow the 7-step template in `growth/ESCALATION_TEMPLATE.md`. Check stakes, real threats, a fair twist built on a planted feature, and a payoff.
- Gus (box head, flat-top, gold tooth, red sleeves, blue overalls) is the star, and cousin Steve is in every trio.
- No floating text signs. Solid ground unless digging or the underground matters. Painted storybook clouds. Detailed houses from `lib/scenery.js`.
- Voice is ElevenLabs "Lane", sped to 1.25x with `tools/voice.sh`. Audio with `tools/mix.sh`.
- Don't take actions or offer alternatives the user didn't ask for. No emoji in titles or descriptions.
