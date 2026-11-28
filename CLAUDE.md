# Animated_Google: house rules for every new short

These are the user's standing decisions. Apply them to every new video without being asked.

## One-command tools (use these, don't redo the steps by hand)
- `tools/new_video.sh <name> "Title"`: new project from the template.
- `tools/script.sh <script.txt>`: word count, length at the 1.25x voice, lint, one-line ElevenLabs version.
- `tools/voice.sh <voice.mp3> <name> ["prompt words"]`: speeds to 1.25x, gets whisper timings and writes `words.js` (digits, But/So), and prints END.
- `tools/mix.sh <name> [MusicName]`: SFX bus from `audio/sfx_cues.py`, then voice + music + SFX into `web/mix.mp3`. Assets live in `assets/sfx` (Mixkit ids) and `assets/music`.
- `tools/stills.sh <name> "<frames>" [width] [cols]`: renders frames into `projects/<name>/stills/sheet.jpg`.
- `node tools/autocheck.cjs projects/<name>/web`: steps through every frame and flags a caption over a face, a character cut off at the frame edge, a character buried inside a solid, the camera inside a solid, the camera static for 1.5 s, and Gus off-screen for 1.2 s. **Run it before every publish and keep fixing until it prints ALL CLEAR.** Mark intentional exceptions on the camera key: `noGus: true` (a shot about someone else), `reveal: true` (a tilt or pan that deliberately brings a character in), `whipIn: true` (cut on the beat).
- `tools/qa_render.sh <video.mp4>`: format check (flags re-encodes), motion QA and 2 fps contact sheets for a user's uploaded render.
- `tools/save.sh "message"`: commits with attribution and pushes to the working branch.

## Start every video from the template
- Run `tools/new_video.sh <name> "Title"`. It copies `template/web` (engine, toon with Gus, render page, demo story) plus `lib/scenery.js` into `projects/<name>/web`.
- Build the world with the scenery kit (`lib/scenery.js`, `SCENERY.create()`): `backdrop()`, `clouds()`, `farTown()`, `houseRow()` (two rows: one along the street, one behind it), `street()`, `tree()`, `smoke()`. Call `S.tick(t)` every frame.
- Improve the kit in `lib/scenery.js` (and re-copy it into the project) rather than writing one-off scenery.

## Look (the "Sinking Tower" standard is the minimum)
- **No floating text signs, labels or naming boards.** Beats play through action, props and pop-ins. Story props that carry text (a letter, a note) are fine.
- **Solid ground by default.** Show the soil cutaway only when digging or something underground matters, and reveal it on the word (the ground "lid" drops away).
- **Painted storybook clouds** (`S.clouds`/`S.cloud`): soft shaded cumulus, flat bottoms, thin outline. Never 3D sphere clouds.
- **Detailed buildings.** Textured walls (timber, brick or plaster), shingle gable roofs, dormers, chimneys with soft smoke, framed windows with shutters and flower boxes, doors with steps and porches, hedges and gardens. Merge repeated trim into one vertex-coloured mesh with `S.parts()` so it stays cheap.
- **Layered background every time:** sky gradient with sun glow, 3 mountain ranges, hills with trees, fields, far town, plus life (windmill, balloon, birds, smoke).
- **Characters:** the 2D card style from `toon.js`. The star is **Gus** (box head, flat-top, gold tooth, red sleeves, blue overalls; config `C.gus` in `story.js`). **Cousin Steve** is in every trio.
- Frame 0 is mid-action. The camera is never static for more than about 1.5 s; big re-aims are 0.14 s whips. Never cut characters off at the frame edge.
- **Rendering (engine.js, keep it):** MSAA, half-res ambient occlusion in the crevices, ink edges tinted by the surface hue and thinned with distance, ACES tone mapping, emissive-only bloom, depth of field, grain and vignette, a soft sky-dome environment (envMapIntensity 0.25), PCF soft sun shadows with tuned bias, blob contact shadows under every character, and a cool sky-blue hemisphere fill (sky `#b4d8f4`, ground `#8a9458`).
- **Underground mood:** when the camera goes below ground, dim the sky bounce, add a warm lantern fill, deepen the vignette and show floating dust motes (see `frame()` in `projects/sinking-tower/web/story.js`).
- Captions: 1–2 words, Lilita One, 61 px at 1080 wide, white with black outline. Default y = 1300/1920, but `drawCaption` (template `story.js`) moves each caption to the first slot that covers no face (1300, 1580, 1060, 380), decided once per caption.

## Scripts
- **Use the user's 7-step template in `growth/ESCALATION_TEMPLATE.md` for every script:** seed, 4 escalation loops (obvious flaw, counter-measure, hidden or technical threat, survival or scale), a counter-intuitive twist (relocate or flip; "that [planted feature] is not there to X, it's there to Y"), then dressing and a dry "Congratulations, you have built…". Use visual-only nouns. About 210–220 words for 60 s.
- Before delivering, check: the hook has stakes, every "But" is a real threat that the "So you" visibly solves, the twist uses a feature planted earlier and doesn't contradict what was shown, and the payoff lands.
- Follow `growth/WINNER_FORMULA.md`: copy the engine, never the premise (no repeating gold, vaults or hiding). The voice is sped to 1.25x.
- When delivering a script, give a one-line version with no spaces between sentences (for ElevenLabs).

## Audio
- Voice: `ffmpeg -af atempo=1.25`, then faster-whisper word timings (`HF_HUB_DISABLE_XET=1`) into `words.js`. Write numbers as digits.
- SFX: `audio/sfx_cues.py` cue table, with a whoosh on every cut and a sound on every pop-in.
- Mix: music at −21 dB, voice compressed, loudnorm I = −14, TP = −2.

## Delivery
- Before publishing: `node tools/autocheck.cjs` until ALL CLEAR, then a visual pass with `tools/stills.sh` (the checker can't judge looks: smoke, fog, empty shots).
- Publish the render page as an Artifact with the `downloads` capability. The user renders on their phone GPU.
- Tell the user to upload the exact saved MP4. Gallery or chat sharing re-encodes it to 720p with a rotation flag.
- No emoji in titles or descriptions.
- Commit and push to the working branch after each step.
