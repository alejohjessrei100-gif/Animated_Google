# How you invented the doorbell!

- **Runtime:** 32.0 s (960 frames @ 30 fps), 1080 × 1920 (9:16)
- **Format:** Odd Tilt problem → fix → complication escalation, flat-shaded low-poly 3D
- **Main character:** a grey low-poly wolf in a royal-blue suit (`#2457C5`), white shirt, red tie (`#E0262B`), black shoes, amber eyes and a brown briefcase. Injuries carry over between shots: a neck brace from F247 (after the tasing) and a head bandage from F423 (after the bell).

## Voiceover (zero dead air, about 0.12 s between clauses)

> You're selling insurance door to door, but nobody hears you knock. So you huff and puff, and blow the door down. Genius! Except that's a felony, and you get tased. So you hang a brass bell by the door, with a rope to pull. Clever! But the rope snaps, and the bell lands on your skull. So you wire a push button to a battery, and wrap the wire around an iron nail. That makes an electromagnet, which yanks a tiny hammer into the bell. Genius! Except it only dings once. So you add a spring contact that breaks the circuit, so the hammer buzzes back and forth. Now the pigs can hear you ring, and they still pretend they're not home.

## Beat sheet (30 fps)

| Frames | VO | Low-poly visual & camera | Part highlight / VFX | Captions | SFX |
|---|---|---|---|---|---|
| F000–F056 | "You're selling insurance door to door," | 3/4 side tracking: wolf walks up to the pigs' brick house with his briefcase, turns to the door; snappy push-in at F34 | — | `You're selling insurance` / `door to door,` | footsteps |
| F056–F096 | "but nobody hears you knock." | Hard cut, push-in through the window: pig on the sofa, bopping in red headphones | small white knock rings at the door (F40/47/54/84) | `but nobody hears` / `you KNOCK.` | three weak knocks |
| F096–F140 | "So you huff and puff," | 3/4 close-up on the wolf's face: cheeks inflate (F106–128) | — | `So you huff` / `and puff,` | rising inhale |
| F140–F186 | "and blow the door down. Genius!" | Hard cut to wide: wind ribbons, the door flies into the house (F141); at F167 a snap push-in as the wolf turns to camera, smug | white low-poly wind ribbons; camera shake | `and BLOW the` / `door DOWN.` / `GENIUS!` | whoosh, wood crash, *ding* |
| F186–F247 | "Except that's a felony, and you get tased." | Hard cut: a cop pig is in the doorway; at F232, cut closer: taser bolts, the wolf jitters and falls flat (F238) | jagged yellow bolts; red impact flash on the wolf | `Except that's a` / `FELONY,` / `and you get` / `TASED.` | electric zap, body thud |
| F247–F300 | "So you hang a brass bell by the door," | Hard cut: wolf in a neck brace, door boarded up; bracket and bell pop in at F275 | 5-frame pop + green flash on the bell | `So you hang` / `a brass bell` / `by the door,` | pop |
| F300–F352 | "with a rope to pull. Clever!" | High close-up on the bell: rope pops in (F311), wolf pulls (F322) and the bell swings; snap pull-back at F335 | green flash on the rope; gold sound rings | `with a rope` / `to pull.` / `CLEVER!` | big bell *DONG*, *ding* |
| F352–F423 | "But the rope snaps, and the bell lands on your skull." | Hard cut, wide: yank, rope snaps (F367), bell falls (F387) and lands on his head like a helmet (F397); dizzy wobble | red flash on the rope and the head; red impact rings; shake | `But the rope` / `SNAPS,` / `and the bell` / `lands on your` / `SKULL.` | snap, falling whistle, clang + thud |
| F423–F480 | "So you wire a push button to a battery," | Hard cut to a tight mechanism close-up on the wall: button (F442), copper wire draws itself, battery (F466) | pop + green flash on the button, then the battery | `So you wire` / `a push button` / `to a battery,` | pops, wire clicks |
| F480–F539 | "and wrap the wire around an iron nail." | Macro: coil turns wrap one by one (F487–515), then the nail slides in (F518) | green flash on the coil and on the nail | `and wrap the` / `wire around an` / `iron nail.` | ratchet clicks, pop |
| F539–F600 | "That makes an electromagnet," | Board close-up: X-ray coil (about 30% alpha) shows the glowing nail; blue field loops; yellow current dots flow | X-ray shell, green flash, field-line metaphor | `That makes an` / `ELECTROMAGNET,` | 60 Hz hum |
| F600–F636 | "which yanks a tiny hammer into the bell." | Macro on the bell: the hammer pops in (F604) and gets yanked into the bell (F613–619) | green flash on the hammer; white sound rings | `which YANKS a` / `tiny hammer into` / `the bell.` | pop, *ding* |
| F636–F657 | "Genius!" | Medium: bandaged, braced wolf gives a smug thumbs-up; snappy push-in | — | `GENIUS!` | *ding* |
| F657–F704 | "Except it only dings once." | Hard cut, wide: he presses the button: one ding, then two dead presses. Deadpan look to camera | — | `Except it only` / `dings ONCE.` | click + ding, click, click |
| F704–F776 | "So you add a spring contact that breaks the circuit," | Board close-up: the spring contact pops in (F722); demo: press, current, hammer yanks, the contact opens with a red spark, current stops | green flash on the contact; current dots; red spark | `So you add` / `a spring contact` / `that breaks the` / `circuit,` | pop, clicks, sparks |
| F776–F830 | "so the hammer buzzes back and forth." | Macro on the hammer vibrating every frame; snap pull-back at F794 | continuous sound rings, flickering spark | `so the hammer` / `BUZZES back and` / `forth.` | electric bell *RRRRING* |
| F830–F880 | "Now the pigs can hear you ring," | Hard cut, wide front of the house: wolf holds the button; through the window the pig hears it and pulls off the headphones (F862) | — | `Now the pigs` / `can hear you` / `RING,` | ringing, gasp |
| F880–F960 | "and they still pretend they're not home." | Window close-up: the pig dives below the sill (F892) and the lights click off (F915); slow pull-back to a wide of the wolf still ringing, deadpan look to camera | — | `and they still` / `pretend they're NOT` / `HOME.` | thud, light switch, ringing; music fades out |

## Production notes

- Voice: Piper TTS (`en_US-ryan-high`), clause by clause, with silence trimmed (`tools/` + `public/voice.wav`).
- Foley and pizzicato music bed are synthesised in `tools/audio.py`; mix levels: VO −2 dB, foley −8 dB, music −20 dB, ducked under the VO.
- Every new part (bell, rope, button, battery, coil, nail, hammer, spring contact) pops in with 0 → 1.08 → 1.0 over 5 frames and flashes green `#38E54D` for 10 frames on the frame its word is spoken. Pain beats flash red `#FF3B30`.
