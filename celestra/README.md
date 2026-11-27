# Celestra Chronicles

16-bit pixel-art arcade fighter with online 1v1 rollback netcode, running on Cloudflare Workers + Durable Objects.

**Live:** https://play.batch30-chronicles.workers.dev

## Modes
- **Online PvP**: private rooms (5-letter code / invite link `/?room=CODE`) or **Quick Match**.
- **VS CPU** (Easy / Normal / Hard), **Local 2P** (shared keyboard or 2 gamepads), **Training** (HP refills; dummy can stand, block, parry or fight).

## Features
- Name prompt on every visit, player profiles and an online **leaderboard** (wins/losses, main fighter, recent matches).
- **Open rooms** list in Online PvP, plus private codes / invite links and quick match.
- **Replays**: save any match and share `/?replay=ID` (matches are deterministic, so a replay is just inputs).
- **Tutorial** mode (10 steps), **customizable controls**, phone mode (thumbstick, big buttons, vibration, fullscreen, rotate prompt).
- **Concerns & ideas** form; read them at `/admin.html?key=ADMIN_KEY` (Worker secret).
- Every fighter: double jump, air slam (Down+Attack in the air), 3 stances (Balanced / Aggressive / Defensive), intro and victory animations.

- **Combat systems**: super meter (EX skills, combo breaker), throws + throw techs, comeback RAGE, first-attack bonus, tech rolls, guard break, taunts.
- **Stage hazards** (toggleable): rooftop smash-through to the street, arcade jackpot power-ups, breakable classroom desks.
- **Tag Team** 2v2 (vs CPU or local), **rival intros**, **daily challenges** with evolution rewards, **titles**, unlockable **alt colors** (mirror matches auto-swap), and **weekly tournament brackets** that run on the server and advance automatically.

## Controls
| Action | P1 / solo | Solo alt | P2 (local) | Gamepad |
|---|---|---|---|---|
| Move / jump / crouch | WASD | Arrows | Arrows | D-pad / stick |
| Basic attack (3-hit chain) | F | J | Num1 / K | X |
| Parry | G | K | Num2 / L | B |
| Skill 1 / 2 / 3 (ult) | R / T / Y | U / I / O | Num4-6 / I O P | A / Y / RB |
| Dash | H or double-tap | L | Num3 / ; | LB |
| Stance | V | P | Num0 / ' | Back |

Hold back to guard (down-back for lows). Esc pauses, M mutes. Touch controls can be enabled in Settings.

## Roster (1 basic + 3 skills each)
Jirox (Javatar skill-steal, Smack Talk passive) · Lian Aero (frisbee) · Dumblade (bleed/laceration) · Gale Slugger (softball bat) · Dap-Sai (DAP/APSAY stances: DAP buffed with long stun, APSAY nerfed) · Gravilliam (gravity, "wait class" confusion every 4s) · TanoHaze (smoke & burn) · Sole-Car (kicks).

Original Batch 30 fighters, rebuilt in the pixel style: Apsurge (teleports) · Dap-Krush (dropkick, armored dive) · Joggernaut (chair smash, Silence) · Jaguaro (laptop bleed, Blue Screen blind) · Polite (belly slam, Bad Jokes → Sad) · Jobacur (boulder roll, stench poison aura).

Internal ids (e.g. `jiross`, `dapsay`) keep the original names; only display names changed.

## Architecture
- `public/js/sim.js`: deterministic 60 fps simulation (no trig or `Math.random`; seeded PRNG), so peers stay bit-identical.
- `public/js/net.js`: GGPO-style rollback (input delay adapts to ping, prediction, resimulation, time-sync, desync checksums every 120 frames).
- `src/worker.js`: Worker routes + `Room` Durable Object (WebSocket hibernation, lobby/select/rematch, input relay) + `Matchmaker` Durable Object (quick-match queue).
- `public/js/sprites.js`, `render.js`, `stage.js`: procedural pixel rig rasterised with integer `fillRect`s at 480×270, plus parallax stages and VFX.
- `public/voice/`: announcer and character lines pre-generated with **Kokoro-82M** ([hexgrad/kokoro](https://github.com/hexgrad/kokoro), Apache-2.0) via `kokoro-js`, then run through a retro filter (band-limit, 8-bit crush, echo). Regenerate with `tools/gen_voices.mjs` (lines in `tools/voices.json`).

## Develop / deploy
```sh
npm install
npm test          # determinism across all 64 matchups + rollback vs ground truth under lag/jitter
npm run dev       # wrangler dev on http://localhost:8787
npm run deploy    # packs public/ into the Worker (tools/build-assets.mjs) and deploys "play"
```
`legacy/` holds the previous Batch 30 Chronicles build that this replaced.
