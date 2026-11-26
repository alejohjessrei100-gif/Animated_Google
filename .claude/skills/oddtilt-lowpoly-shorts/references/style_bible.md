# Low-Poly 30fps Shorts Style Bible (OddTilt Format)

A production spec for adapting **Odd Tilt's** iterative engineering-comedy Shorts format into a clean, fast-rendering **low-poly 3D** visual pipeline.

---

## 1. Format & 30fps Timing Grid

| Parameter | Spec | Notes |
| :--- | :--- | :--- |
| **Aspect Ratio & Resolution** | `9:16` (`1080 × 1920`) | Keep focal action inside the center `80%` vertical safe zone (avoid YouTube Shorts UI on bottom `20%` and right edge). |
| **Frame Rate** | `30 fps` | All cuts, camera snaps, and foley cues align to exact frame counts. |
| **Target Runtime** | `28–34 seconds` (`840–1,020 frames`) | Sweet spot for loopable retention; never exceed `45s`. |
| **Beat Cycle Length** | `3.0–5.0 seconds` (`90–150 frames`) | Every cycle contains: **Problem → Naive Fix → Complication → Engineering Step**. |
| **Shot / Angle Change** | Every `1.5–3.0 seconds` (`45–90 frames`) | Never hold a static camera for more than `90 frames`. |
| **Intro / Outro** | `0 frames` | Frame `0` starts mid-problem. Final frame ends on the callback punchline. |

---

## 2. Scriptwriting Formula

Write every script in **second-person present tense (`"you"`)** with zero filler words.

### The 5-Stage Skeleton
1. **Inciting Problem (`0:00–0:03` | `F000–F090`):** Drop straight into an absurd, relatable, or slightly unhinged problem.
   - *Rule:* No backstory, no "Have you ever wondered..."
2. **Naive Fix (`0:03–0:06` | `F090–F180`):** `"So you [obvious brute-force fix]."`
3. **Escalation Loop (Repeat `4–5×`, `~4–5s` each):**
   - **Complication:** `"But..."` or `"Except..."` — alternate between real mechanical bottlenecks and sudden slapstick consequences.
   - **Engineering Step:** `"So you [add specific real-world mechanism]."`
   - **Micro-Praise (every 1–2 loops):** Drop a deadpan `"Clever!"` or `"Genius!"` right before undercutting it with the next `"Except..."`.
4. **Callback Punchline (Final `2–3s` | `60–90 frames`):** End with a deadpan callback to the opening premise (`"Now you can [do the absurd opening goal] in peace!"`) rather than a generic `"Congratulations, you've invented X."`

### Voiceover Pacing Rules
- **Zero dead air:** Trim all breath gaps between sentences so `"Except..."` or `"Clever!"` lands within `2–4 frames` of the prior clause.
- **Delivery:** Deadpan, slightly smug narrator energy—treat ridiculous injuries and normal engineering steps with the exact same matter-of-fact tone.

---

## 3. Low-Poly Visual & Shading Spec

Replacing Odd Tilt's realism with low-poly makes mechanics **clearer** and renders **faster**, as long as part changes read instantly on a phone screen.

### Geometry & Materials
- **Shading:** Flat-shaded / faceted low-poly (`Flat` normals, zero smooth bevels on hero props unless needed for silhouette).
- **Color Hierarchy:**
  - **Environment / Background:** Desaturated, matte low-poly tones (soft sky blue, muted grass green, warm wood, light concrete) so foreground props pop.
  - **Hero Props & Characters:** Saturated, distinct solid colors with clear silhouette separation.
- **Character Design:** Blocky/low-poly stylized rig with simple limbs and expressive head/torso tilts—skip facial micro-animation and sell comedy through **snappy body poses** (e.g., instant ragdoll collapse, instant wheelchair swap).

### Mechanic Readability (Crucial)
Because Shorts viewers watch fast on small screens, every newly added part must stand out on the frame it appears:
- **Emissive Part Flash:** When `"So you add [new part]"` hits, briefly flash the new part with a bright emissive tint (green `#38E54D` for upgrades, red `#FF3B30` for broken/painful parts) for `8–12 frames`, then settle to its base color.
- **X-Ray / Ghosted Housings:** When showing internal parts (springs, hinges, channels, circuits), switch the outer casing to a `25–35%` alpha transparent shell or clean wireframe overlay.
- **Literal Geometric Metaphors:** Visualize invisible forces (sound, wind, heat, rain) using simple low-poly meshes—color-coded sine tubes, extruded arrows, or blocky particles.

---

## 4. Camera & Animation Rules (30fps)

- **Hard Cuts vs. Whip Moves:** Prefer **1-frame hard cuts** between angles on `"But..."` / `"Except..."`. When moving the camera within a shot, use snappy `6–10 frame` ease-out moves—avoid slow floaty pans.
- **Two-Angle Alternation:** Alternate between:
  1. **Wide / 3/4 Establishing Shot** (shows character + full contraption).
  2. **Tight Mechanic Close-Up** (fills `70%+` of frame with the exact hinge, groove, or joint being added).
- **Snappy Pop-In:** New parts scale from `0 → 1.08 → 1.0` over `5 frames` (`F0: 0.0`, `F3: 1.08`, `F5: 1.0`) with a crisp pop SFX.

---

## 5. Captions & Typography

- **Font:** Heavy geometric sans-serif (e.g., *Montserrat ExtraBold*, *Poppins Black*, or *Inter Black*).
- **Style:** White fill (`#FFFFFF`), thick black outline/stroke (`4–6 px`), subtle drop shadow.
- **Chunking:** **2–4 words per caption** max—never display a full sentence at once.
- **Placement:** Centered horizontally, positioned just above the lower third (`~32–36%` from bottom) so it never collides with Shorts titles or action.
- **Emphasis:** Use **ALL-CAPS** (and optional yellow `#FFD60A` or red `#FF3B30` tint) on shock words, profanity, or `"CLEVER!"` / `"GENIUS!"`.

---

## 6. Audio & Foley Mix

| Layer | Level | Guidelines |
| :--- | :--- | :--- |
| **Voiceover (VO)** | `-1 dB` to `-3 dB` (Hero) | Dry, compressed, zero room reverb, tight breath cuts. |
| **Foley & Slapstick SFX** | `-6 dB` to `-10 dB` | Frame-accurate (`±0 frames`) on every pop-in, hit, snap, crunch, or splash. |
| **Background Music** | `-18 dB` to `-22 dB` | Upbeat, quirky pizzicato or light synth loop; duck slightly under VO. |
