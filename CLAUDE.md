# Animated_Google: house rules for every new short

These are the user's standing decisions. Apply them to every new video without being asked.

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
- Captions: 1–2 words, Lilita One, 61 px at 1080 wide, y = 1300/1920, white with black outline.

## Scripts
- Escalation format: "If you X, you have Y", then "But… So you…" cycles, naming anchors, a trio, "not there by mistake", and "Congratulations. You have built…", with the ending calling back to the hook.
- Follow `growth/WINNER_FORMULA.md`: copy the engine, never the premise (no repeating gold, vaults or hiding). Aim for 150–170 words; the voice is sped to 1.25x.
- When delivering a script, give a one-line version with no spaces between sentences (for ElevenLabs).

## Audio
- Voice: `ffmpeg -af atempo=1.25`, then faster-whisper word timings (`HF_HUB_DISABLE_XET=1`) into `words.js`. Write numbers as digits.
- SFX: `audio/sfx_cues.py` cue table, with a whoosh on every cut and a sound on every pop-in.
- Mix: music at −21 dB, voice compressed, loudnorm I = −14, TP = −2.

## Delivery
- Check the video with stills (scratchpad `stills.cjs`) before publishing.
- Publish the render page as an Artifact with the `downloads` capability. The user renders on their phone GPU.
- Tell the user to upload the exact saved MP4. Gallery or chat sharing re-encodes it to 720p with a rotation flag.
- No emoji in titles or descriptions.
- Commit and push to the working branch after each step.
