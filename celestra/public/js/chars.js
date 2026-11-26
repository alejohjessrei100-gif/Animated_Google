// Celestra Chronicles — roster data (1 Basic chain + 3 Skills each).
// Pure data: frame data, boxes, looks. Behaviour hooks live in sim.js.
// Units: pixels at 480x270 internal res; frames at 60fps.
// box: [forwardX, topY (negative = up from feet), w, h]

const D = (o) => ({
  kind: "melee", startup: 6, active: 3, recovery: 10, dmg: 30, hs: 16, bs: 10,
  kb: [2.2, 0], lvl: "M", box: [8, -56, 28, 14], stop: 4, sfx: "punch", anim: "jab",
  ...o,
});

// Shared basic templates (overridden per fighter)
const jab = (o) => D({ name: "Jab", startup: 5, active: 3, recovery: 9, dmg: 28, hs: 16, kb: [2, 0], lvl: "H", box: [8, -64, 26, 12], anim: "jab", chain: "b2", ...o });
const cross = (o) => D({ name: "Cross", startup: 6, active: 3, recovery: 11, dmg: 30, hs: 18, kb: [2.5, 0], lvl: "M", box: [8, -58, 28, 14], anim: "cross", chain: "b3", ...o });
const fin = (o) => D({ name: "Finisher", startup: 10, active: 4, recovery: 18, dmg: 52, hs: 24, bs: 14, kb: [5.5, 0], lvl: "M", box: [8, -56, 32, 18], stop: 7, anim: "hook", heavy: true, ...o });
const air = (o) => D({ name: "Air Strike", isAir: true, startup: 5, active: 8, recovery: 6, dmg: 40, hs: 18, kb: [3, 0], lvl: "M", box: [4, -46, 28, 24], anim: "airkick", sfx: "kick", ...o });

export const PARRY = { window: 10, whiff: 22, counter: 50, stagger: 38 };

export const CHARS = {
  jiross: {
    id: "jiross", name: "JIROSS", title: "The Smack-Talk Brawler", color: "#ff9a3c",
    hp: 1000, walk: 1.7, back: 1.35, jump: 6.2, scale: 1.0, hurtH: 68,
    voice: "am_puck",
    look: { skin: "#d9a066", hair: "#2b1a12", hairStyle: "spike", top: "#e2722b", top2: "#ffd08a", bottom: "#3b3047", shoes: "#f2f2f2", accent: "#ffcf5a", prop: "mug", bodyW: 8 },
    passive: { name: "Smack Talk", desc: "Every 10s Jiross taunts: foe is RATTLED (-15% dmg) for 3s. Landing hits builds MOMENTUM (+4% dmg per stack, max 5)." },
    basic: ["b1", "b2", "b3"], air: "air",
    moves: {
      b1: jab({ name: "Quick Jab" }),
      b2: cross({ name: "Coffee Cross" }),
      b3: fin({ name: "Big-Mouth Haymaker", anim: "hook", dmg: 56 }),
      air: air({ name: "Flying Knee", anim: "airknee" }),
      s1: D({ name: "Brew Rush", skill: 1, cd: 330, startup: 9, active: 12, recovery: 16, dmg: 68, hs: 22, bs: 14, kb: [6, -1.5], box: [6, -60, 26, 44], stop: 7, vel: [[8, 21, 5.4]], anim: "shoulder", sfx: "heavy", desc: "Charging shoulder rush that crosses half the screen." }),
      s2: D({ name: "Shut-Up Uppercut", skill: 2, cd: 420, startup: 8, active: 5, recovery: 22, dmg: 62, hs: 40, kb: [1.6, -7.2], launch: true, box: [4, -76, 26, 52], stop: 8, vel: [[1, 8, 1.4]], anim: "uppercut", sfx: "heavy", desc: "Rising uppercut launcher — juggle starter." }),
      s3: D({ name: "Javatar", skill: 3, ult: true, cd: 900, kind: "cast", startup: 14, active: 0, recovery: 4, hook: "javatar", anim: "cast", sfx: "cast", desc: "STEALS the foe's last used skill (or Skill 1), casts it as his own and locks theirs for +3s." }),
    },
  },

  lian: {
    id: "lian", name: "LIAN ANGELO", title: "Frisbee Ace", color: "#3fe0d0",
    hp: 960, walk: 1.95, back: 1.6, jump: 6.4, scale: 0.98, hurtH: 67,
    voice: "am_eric",
    look: { skin: "#e8b88a", hair: "#16141c", hairStyle: "cap", top: "#1fb5a8", top2: "#f4f7ff", bottom: "#1e2a44", shoes: "#ff4f6d", accent: "#fff36b", prop: "disc", bodyW: 7 },
    passive: { name: "Clean Catch", desc: "Catching a returning Boomerang Disc refunds 2s of its cooldown." },
    basic: ["b1", "b2", "b3"], air: "air",
    moves: {
      b1: jab({ name: "Disc Chop", sfx: "slash" }),
      b2: cross({ name: "Disc Backhand", sfx: "slash", anim: "backhand" }),
      b3: fin({ name: "Spin Slice", sfx: "slash", anim: "spin", dmg: 48, kb: [6, -1] }),
      air: air({ name: "Air Disc", anim: "airslash", sfx: "slash" }),
      s1: D({ name: "Frisbee Toss", skill: 1, kind: "proj", cd: 270, startup: 10, active: 1, recovery: 14, anim: "throw", sfx: "disc",
        proj: [{ at: 10, kind: "disc", vx: 7.2, y: -56, w: 16, h: 8, life: 90, dmg: 58, hs: 18, kb: [3, 0], lvl: "M", stop: 4 }],
        desc: "Fast straight frisbee throw." }),
      s2: D({ name: "Boomerang Ricochet", skill: 2, kind: "proj", cd: 450, startup: 12, active: 1, recovery: 16, anim: "throw", sfx: "disc",
        proj: [{ at: 12, kind: "boomer", vx: 5.2, y: -50, w: 18, h: 10, life: 200, ret: 34, dmg: 46, hs: 20, kb: [2, -2], lvl: "M", stop: 4 }],
        desc: "Disc ricochets off walls and boomerangs back — hits going out AND coming back." }),
      s3: D({ name: "Dash Catch", skill: 3, ult: true, cd: 960, startup: 8, active: 26, recovery: 18, dmg: 26, hs: 22, kb: [1.2, 0], rehit: 5, maxHits: 5, finalKb: [5, -6.5],
        box: [-4, -64, 34, 60], stop: 4, vel: [[8, 22, 6.2]], projInv: [1, 30], passThrough: false, anim: "dashcatch", sfx: "disc",
        desc: "Hurls the disc and sprints after it — catching it through the foe for a 5-hit spinning combo." }),
    },
  },

  dumdum: {
    id: "dumdum", name: "DUMDUM", title: "Laceration Maniac", color: "#ff3355",
    hp: 980, walk: 1.8, back: 1.45, jump: 6.2, scale: 1.0, hurtH: 68,
    voice: "am_onyx",
    look: { skin: "#c98b5e", hair: "#0d0b10", hairStyle: "long", top: "#2a1520", top2: "#ff3355", bottom: "#17131c", shoes: "#3a3a44", accent: "#ff3355", prop: "blades", bodyW: 7 },
    passive: { name: "Open Wounds", desc: "Slashes stack BLEED (max 6). Each stack ticks damage over time." },
    basic: ["b1", "b2", "b3"], air: "air",
    moves: {
      b1: jab({ name: "Nick", sfx: "slash", anim: "slashA" }),
      b2: cross({ name: "Cut", sfx: "slash", anim: "slashB" }),
      b3: fin({ name: "Gash", sfx: "slash", anim: "slashUp", dmg: 46, fx: { bleed: 1 } }),
      air: air({ name: "Falling Rend", anim: "airslash", sfx: "slash", fx: { bleed: 1 } }),
      s1: D({ name: "Lacerate", skill: 1, cd: 300, startup: 7, active: 10, recovery: 14, dmg: 30, hs: 18, kb: [1.8, 0], rehit: 6, maxHits: 2, box: [6, -62, 34, 30], stop: 5, fx: { bleed: 1 }, anim: "xslash", sfx: "slash", desc: "Quick twin slash — +1 BLEED per hit." }),
      s2: D({ name: "Rend Dash", skill: 2, cd: 420, startup: 9, active: 12, recovery: 18, dmg: 52, hs: 24, kb: [-3, 0], box: [-10, -62, 40, 50], stop: 6, vel: [[9, 21, 7.4]], passThrough: true, fx: { bleed: 1 }, anim: "dashslash", sfx: "slash", desc: "Blitzing dash strike that passes THROUGH the foe. +1 BLEED." }),
      s3: D({ name: "Hemorrhage", skill: 3, ult: true, cd: 840, startup: 15, active: 5, recovery: 22, dmg: 50, hs: 30, kb: [4.5, -3], box: [6, -66, 40, 54], stop: 12, hook: "hemorrhage", anim: "finisher", sfx: "heavyslash", heavy: true, desc: "Detonates ALL bleed stacks: +45 dmg per stack. 4+ stacks also STUNS." }),
    },
  },

  gayle: {
    id: "gayle", name: "GAYLE MONANA", title: "Softball Slugger", color: "#ffd23f",
    hp: 1080, walk: 1.5, back: 1.25, jump: 5.9, scale: 1.04, hurtH: 70,
    voice: "af_bella",
    look: { skin: "#e3a77c", hair: "#5a2c16", hairStyle: "pony", top: "#ffd23f", top2: "#1c2a5c", bottom: "#1c2a5c", shoes: "#f5f5f5", accent: "#ff6b3d", prop: "bat", bodyW: 8 },
    passive: { name: "Clutch Hitter", desc: "Batter Up's stance has 1-hit ARMOR. Heavy swings wall-bounce." },
    basic: ["b1", "b2", "b3"], air: "air",
    moves: {
      b1: jab({ name: "Bat Poke", anim: "batpoke", sfx: "bat", box: [8, -60, 36, 12], startup: 6, dmg: 30 }),
      b2: cross({ name: "Bat Swing", anim: "batswing", sfx: "bat", box: [6, -60, 42, 22], startup: 8, dmg: 34 }),
      b3: fin({ name: "Overhead Bonk", anim: "batover", sfx: "bat", box: [8, -70, 40, 50], startup: 13, dmg: 62, kb: [4, 0] }),
      air: air({ name: "Air Bunt", anim: "airbat", sfx: "bat", box: [4, -48, 36, 26] }),
      s1: D({ name: "Power Swing", skill: 1, cd: 360, startup: 15, active: 5, recovery: 20, dmg: 92, hs: 28, bs: 16, kb: [9, -2], wallBounce: true, box: [4, -64, 48, 34], stop: 10, anim: "batswing", sfx: "heavybat", heavy: true, desc: "Full-power swing with massive knockback & wall bounce." }),
      s2: D({ name: "Batter Up", skill: 2, cd: 510, startup: 20, active: 4, recovery: 18, dmg: 48, hs: 20, kb: [1, 0], stun: 72, box: [8, -62, 40, 20], stop: 8, armor: [1, 20], anim: "batterup", sfx: "bat", desc: "Armored batting stance into a bunt that STUNS (dizzy)." }),
      s3: D({ name: "Home Run", skill: 3, ult: true, cd: 960, startup: 22, active: 5, recovery: 26, dmg: 168, hs: 46, bs: 22, kb: [13, -7.5], launch: true, wallBounce: true, box: [2, -70, 52, 56], stop: 16, anim: "homerun", sfx: "homerun", heavy: true, hook: "homerun", desc: "Huge windup — launches the foe across the stage. HOME RUN!" }),
    },
  },

  dapsay: {
    id: "dapsay", name: "DAPSAY", title: "Two-Stance Hybrid", color: "#d65cff",
    hp: 1000, walk: 1.75, back: 1.45, jump: 6.3, scale: 0.96, hurtH: 66,
    voice: "af_nicole",
    look: { skin: "#ddaa82", hair: "#1b161d", hairStyle: "bun", top: "#d63848", top2: "#5a32a3", bottom: "#1d2233", shoes: "#edeff7", accent: "#b56bff", prop: "none", bodyW: 8, split: true },
    passive: { name: "DAP ⇄ APSAY", desc: "Using a DAP or APSAY skill switches stance (changes basics). Deals +30% damage to STUNNED foes." },
    basic: ["b1", "b2", "b3"], air: "air",
    basicByStance: { dap: ["d1", "d2", "d3"], apsay: ["a1", "a2", "a3"] },
    moves: {
      // DAP stance basics — heavier
      d1: jab({ name: "DAP Jab", chain: "d2", dmg: 32, startup: 6 }),
      d2: cross({ name: "DAP Knee", chain: "d3", anim: "knee", sfx: "kick", dmg: 36 }),
      d3: fin({ name: "DAP Stomp Kick", anim: "kick", sfx: "kick", dmg: 60, kb: [6.5, 0] }),
      // APSAY stance basics — faster but nerfed damage
      a1: jab({ name: "APSAY Snap", chain: "a2", dmg: 20, startup: 4, recovery: 8 }),
      a2: cross({ name: "APSAY Snap", chain: "a3", dmg: 22, startup: 4, recovery: 9 }),
      a3: fin({ name: "APSAY Spin", anim: "spin", dmg: 36, startup: 8, kb: [4, 0] }),
      b1: jab({}), b2: cross({}), b3: fin({}), // placeholders (resolved by stance)
      air: air({ name: "Dive Kick", anim: "airkick" }),
      s1: D({ name: "DAP Kick", skill: 1, stance: "dap", cd: 420, startup: 13, active: 14, recovery: 22, dmg: 120, hs: 26, bs: 18, kb: [3, -1], stun: 112, box: [0, -56, 40, 30], stop: 13, vel: [[12, 26, 5.6]], anim: "dropkick", sfx: "heavy", heavy: true, desc: "BUFFED: flying two-leg dropkick — big damage + LONG STUN (1.9s)." }),
      s2: D({ name: "APSAY Punch", skill: 2, stance: "apsay", cd: 540, startup: 20, active: 4, recovery: 22, dmg: 40, hs: 18, kb: [2.5, 0], box: [4, -62, 30, 20], stop: 5, hook: "teleport", tpAt: 9, anim: "tppunch", sfx: "punch", desc: "NERFED: vanishes & reappears behind the foe for a light cross-up punch." }),
      s3: D({ name: "DAPSAY Fusion", skill: 3, ult: true, cd: 1020, startup: 22, active: 14, recovery: 22, dmg: 130, hs: 28, kb: [3.5, -1], stun: 120, box: [0, -58, 42, 32], stop: 14, vel: [[20, 34, 5.0]], hook: "teleport", tpAt: 10, tpBack: 46, anim: "fusion", sfx: "heavy", heavy: true, desc: "APSAY teleport + DAP dropkick from behind. Stuns for 2s." }),
    },
  },

  william: {
    id: "william", name: "WILLIAM", title: "Gravity Professor", color: "#7c7cff",
    hp: 990, walk: 1.6, back: 1.4, jump: 6.0, scale: 1.02, hurtH: 69,
    voice: "am_michael",
    look: { skin: "#e0b08a", hair: "#3a2a20", hairStyle: "neat", top: "#2c2f7a", top2: "#a7a9ff", bottom: "#232433", shoes: "#2b2b2b", accent: "#9b8cff", prop: "glasses", bodyW: 7 },
    passive: { name: "Confusion — \"wait class\"", desc: "Every 4s William says \"wait class\" — foe is CONFUSED (left/right reversed) for 0.75s." },
    basic: ["b1", "b2", "b3"], air: "air",
    moves: {
      b1: jab({ name: "Palm Tap", anim: "palm", sfx: "gravity" }),
      b2: cross({ name: "Palm Strike", anim: "palm2", sfx: "gravity" }),
      b3: fin({ name: "Force Push", anim: "push", sfx: "gravity", dmg: 46, kb: [8, -1] }),
      air: air({ name: "Gravity Drop", anim: "airpalm", sfx: "gravity", kb: [1, 3] }),
      s1: D({ name: "Gravity Well", skill: 1, kind: "cast", cd: 420, startup: 12, active: 1, recovery: 18, hook: "well", anim: "cast", sfx: "gravity", desc: "Spawns a singularity that PULLS the foe in, then implodes." }),
      wellBurst: D({ name: "Implosion", dmg: 62, hs: 26, kb: [0, -5.5], launch: true, lvl: "M", stop: 8, sfx: "gravity" }),
      s2: D({ name: "Graviton Slam", skill: 2, cd: 480, startup: 18, active: 6, recovery: 22, dmg: 84, hs: 30, bs: 16, kb: [3, -3], kd: true, lvl: "L", box: [8, -18, 116, 18], stop: 9, anim: "slam", sfx: "slam", heavy: true, desc: "Ground slam shockwave (LOW) that knocks down. Crouch-guard to block." }),
      s3: D({ name: "Anti-Gravity Field", skill: 3, ult: true, kind: "cast", cd: 1020, startup: 16, active: 1, recovery: 18, hook: "antigrav", anim: "cast2", sfx: "gravity", desc: "Field under the foe: lifts them, SLOWS 50% & makes them floaty for long juggles (4s)." }),
      agLift: D({ name: "Lift", dmg: 40, hs: 30, kb: [0, -4.6], launch: true, stop: 6, sfx: "gravity", unblock: true }),
    },
  },

  tanoy: {
    id: "tanoy", name: "TANOY", title: "Smoke & Embers", color: "#ff7a29",
    hp: 990, walk: 1.75, back: 1.45, jump: 6.2, scale: 1.0, hurtH: 68,
    voice: "am_liam",
    look: { skin: "#c99168", hair: "#262323", hairStyle: "messy", top: "#4a4d57", top2: "#8a8f9c", bottom: "#24252c", shoes: "#5a3a26", accent: "#ff7a29", prop: "cig", bodyW: 7 },
    passive: { name: "Chain Burn", desc: "Embers BURN (stacks to Lv3). Inside his smoke Tanoy is harder to see and 15% faster." },
    basic: ["b1", "b2", "b3"], air: "air",
    moves: {
      b1: jab({ name: "Jab" }),
      b2: cross({ name: "Elbow", anim: "elbow" }),
      b3: fin({ name: "Ash Flick", anim: "flick", sfx: "fire", dmg: 44, fx: { burn: 1 } }),
      air: air({ name: "Smoke Kick" }),
      s1: D({ name: "Ember Flick", skill: 1, kind: "proj", cd: 270, startup: 9, active: 1, recovery: 14, anim: "flick", sfx: "fire",
        proj: [{ at: 9, kind: "ember", vx: 5.6, y: -60, w: 10, h: 8, life: 100, dmg: 40, hs: 16, kb: [2, 0], lvl: "M", stop: 3, fx: { burn: 1 } }],
        desc: "Flicks a burning ember — applies BURN." }),
      s2: D({ name: "Smoke Screen", skill: 2, kind: "cast", cd: 600, startup: 10, active: 1, recovery: 12, hook: "smoke", anim: "exhale", sfx: "smoke", desc: "Exhales a smoke cloud (3.5s). Foes inside are BLINDED (-30% dmg)." }),
      s3: D({ name: "Chain Smoker", skill: 3, ult: true, kind: "proj", cd: 900, startup: 12, active: 1, recovery: 26, anim: "volley", sfx: "fire",
        proj: [
          { at: 12, kind: "ash", vx: 6, y: -60, w: 12, h: 10, life: 90, dmg: 38, hs: 18, kb: [2, 0], lvl: "M", stop: 4, fx: { burn: 1 } },
          { at: 20, kind: "ash", vx: 6, y: -46, w: 12, h: 10, life: 90, dmg: 38, hs: 18, kb: [2, 0], lvl: "M", stop: 4, fx: { burn: 1 } },
          { at: 28, kind: "bigember", vx: 5, y: -54, w: 18, h: 16, life: 100, dmg: 64, hs: 28, kb: [5, -3], lvl: "M", stop: 9, fx: { burn: 2 } },
        ],
        desc: "Three-ember volley — stacks BURN to Lv3." }),
    },
  },

  acar: {
    id: "acar", name: "ACAR", title: "Foot Fetish Kickboxer", color: "#5cff7a",
    hp: 970, walk: 1.9, back: 1.55, jump: 6.5, scale: 0.99, hurtH: 67,
    voice: "am_echo",
    look: { skin: "#d4a07a", hair: "#121015", hairStyle: "buzz", top: "#1d1d24", top2: "#5cff7a", bottom: "#2e7d3a", shoes: "barefoot", accent: "#5cff7a", prop: "none", bodyW: 7 },
    passive: { name: "Foot Fetish", desc: "Kick specialist: every basic is a kick. Landing Stomp Frenzy refreshes Sole Barrage." },
    basic: ["b1", "b2", "b3"], air: "air",
    moves: {
      b1: jab({ name: "Snap Kick", anim: "lowkick", sfx: "kick", lvl: "M", box: [8, -40, 30, 14], startup: 5 }),
      b2: cross({ name: "Knee Kick", anim: "kick", sfx: "kick", box: [8, -54, 32, 16] }),
      b3: fin({ name: "Roundhouse", anim: "highkick", sfx: "kick", lvl: "H", box: [8, -70, 34, 18], dmg: 54, kb: [6, -1] }),
      air: air({ name: "Axe Heel", anim: "airkick" }),
      s1: D({ name: "Sole Barrage", skill: 1, cd: 330, startup: 7, active: 24, recovery: 16, dmg: 16, hs: 14, kb: [0.8, 0], rehit: 4, maxHits: 6, finalKb: [5, -1], box: [8, -60, 34, 36], stop: 3, anim: "barrage", sfx: "kick", desc: "Tekken-style flurry — 6 rapid kicks." }),
      s2: D({ name: "Toe Sweep", skill: 2, cd: 360, startup: 9, active: 5, recovery: 20, dmg: 62, hs: 30, bs: 14, kb: [3, -3.5], kd: true, lvl: "L", box: [6, -16, 42, 16], stop: 6, anim: "sweep", sfx: "kick", desc: "LOW sweep that knocks down." }),
      s3: D({ name: "Stomp Frenzy", skill: 3, ult: true, cd: 900, startup: 25, active: 8, recovery: 22, dmg: 118, hs: 30, bs: 18, kb: [2, -2], stun: 64, box: [-12, -36, 58, 36], stop: 12, vel: [[4, 28, 3.1]], hook: "leap", anim: "stomp", sfx: "slam", heavy: true, desc: "Leaping overhead stomp + ground stomps — STUNS and refreshes Sole Barrage." }),
    },
  },
  // ======== Original Batch 30 fighters, rebuilt for the 1 + 3 kit ========
  apsay: {
    id: "apsay", name: "APSAY", title: "Teleport Rushdown", color: "#b56bff",
    hp: 960, walk: 2.0, back: 1.7, jump: 6.5, scale: 0.98, hurtH: 67, dashMul: 1.2,
    voice: "am_puck",
    look: { skin: "#e3b796", hair: "#1b161d", hairStyle: "spike", top: "#5a32a3", top2: "#b56bff", bottom: "#1d2233", shoes: "#edeff7", accent: "#b56bff", prop: "none", bodyW: 7 },
    passive: { name: "Afterimage", desc: "Dashes are 20% faster and pass through projectiles." },
    basic: ["b1", "b2", "b3"], air: "air",
    moves: {
      b1: jab({ name: "Snap Jab", startup: 4, recovery: 8, dmg: 26 }),
      b2: cross({ name: "Snap Kick", anim: "kick", sfx: "kick", box: [8, -54, 30, 16] }),
      b3: fin({ name: "Rising Heel", anim: "highkick", sfx: "kick", lvl: "H", box: [6, -72, 32, 20], dmg: 50 }),
      air: air({ name: "Dive Heel" }),
      s1: D({ name: "Apsay Punch", skill: 1, cd: 450, startup: 18, active: 4, recovery: 20, dmg: 72, hs: 24, kb: [5, -1], box: [4, -62, 32, 22], stop: 8, hook: "teleport", tpAt: 9, anim: "tppunch", sfx: "heavy", heavy: true, desc: "Vanishes and reappears BEHIND the foe for a cross-up punch." }),
      s2: D({ name: "Shadow Step", skill: 2, cd: 420, startup: 14, active: 5, recovery: 22, dmg: 56, hs: 40, kb: [1.5, -7], launch: true, box: [2, -72, 28, 52], stop: 8, hook: "teleport", tpAt: 7, tpBack: -30, anim: "uppercut", sfx: "kick", desc: "Teleports IN FRONT of the foe into a rising launcher." }),
      s3: D({ name: "Phantom Barrage", skill: 3, ult: true, cd: 960, startup: 18, active: 28, recovery: 20, dmg: 24, hs: 20, kb: [0.8, 0], rehit: 5, maxHits: 5, finalKb: [5, -6.5], box: [4, -64, 34, 40], stop: 4, hook: "teleport", tpAt: 9, anim: "barrage", sfx: "punch", desc: "Teleports behind and unloads a 5-hit phantom flurry." }),
    },
  },

  dap: {
    id: "dap", name: "DAP", title: "Heavy Dive Bruiser", color: "#ff5a6a",
    hp: 1060, walk: 1.55, back: 1.3, jump: 5.9, scale: 0.94, hurtH: 65,
    voice: "af_nicole",
    look: { skin: "#d8a37c", hair: "#211917", hairStyle: "bun", top: "#d63848", top2: "#ff7a33", bottom: "#252b3b", shoes: "#222530", accent: "#ff7a33", prop: "none", bodyW: 9 },
    passive: { name: "Thick Skin", desc: "Takes 10% less damage from everything." },
    basic: ["b1", "b2", "b3"], air: "air",
    moves: {
      b1: jab({ name: "Bruiser Jab", dmg: 32, startup: 6 }),
      b2: cross({ name: "Gut Check", dmg: 36, startup: 7 }),
      b3: fin({ name: "Heavy Haymaker", dmg: 64, startup: 12, kb: [7, -1] }),
      air: air({ name: "Belly Drop", anim: "airknee" }),
      s1: D({ name: "DAP Kick", skill: 1, cd: 450, startup: 14, active: 14, recovery: 22, dmg: 110, hs: 28, bs: 20, kb: [9, -2], wallBounce: true, stun: 80, box: [0, -56, 40, 30], stop: 12, vel: [[12, 27, 5.8]], anim: "dropkick", sfx: "heavy", heavy: true, desc: "Two-legged flying dropkick: wall bounce + STUN." }),
      s2: D({ name: "Belly Uppercut", skill: 2, cd: 420, startup: 10, active: 6, recovery: 22, dmg: 70, hs: 40, kb: [1.5, -7.5], launch: true, box: [4, -76, 28, 54], stop: 9, anim: "uppercut", sfx: "heavy", heavy: true, desc: "Huge launcher uppercut." }),
      s3: D({ name: "Bulldozer Dive", skill: 3, ult: true, cd: 1020, startup: 16, active: 16, recovery: 26, dmg: 150, hs: 40, bs: 22, kb: [12, -6], launch: true, wallBounce: true, armor: [1, 32], box: [0, -60, 34, 48], stop: 15, vel: [[14, 32, 6.6]], anim: "shoulder", sfx: "slam", heavy: true, desc: "ARMORED full-body dive across the stage — massive launch." }),
    },
  },

  jog: {
    id: "jog", name: "JOG", title: "Chair Lockdown", color: "#60d7ff",
    hp: 1020, walk: 1.65, back: 1.45, jump: 6.0, scale: 1.04, hurtH: 70,
    voice: "bm_george",
    look: { skin: "#d9b08c", hair: "#a9b2c2", hairStyle: "neat", top: "#3e4b63", top2: "#60d7ff", bottom: "#1b1f2a", shoes: "#18181f", accent: "#60d7ff", prop: "chair", bodyW: 7 },
    passive: { name: "Detention", desc: "SILENCED foes (can't use skills) take +15% damage from JOG." },
    basic: ["b1", "b2", "b3"], air: "air",
    moves: {
      b1: jab({ name: "Stern Backhand", anim: "backhand" }),
      b2: cross({ name: "Grumpy Side Kick", anim: "kick", sfx: "kick", box: [8, -54, 34, 16] }),
      b3: fin({ name: "Cane Sweep", anim: "sweep", sfx: "kick", lvl: "L", box: [6, -16, 40, 16], dmg: 48, kb: [3, -3], kd: true }),
      air: air({ name: "Chair Drop", anim: "airbat", sfx: "bat" }),
      s1: D({ name: "JOG Smash: Encore", skill: 1, cd: 480, startup: 13, active: 6, recovery: 24, dmg: 64, hs: 40, kb: [1.5, 0], box: [6, -70, 44, 50], stop: 9, followup: "s1b", anim: "chairover", sfx: "heavybat", heavy: true, desc: "Folding-chair smash. Press S1 again on hit for Hit 2: SILENCE (5s)." }),
      s1b: D({ name: "JOG Smash: Silence", startup: 9, active: 6, recovery: 22, dmg: 80, hs: 28, kb: [9, -4], wallBounce: true, box: [6, -66, 46, 40], stop: 12, fx: { silence: 300 }, anim: "chairswing", sfx: "heavybat", heavy: true }),
      s2: D({ name: "Detention Grab", skill: 2, cd: 480, startup: 7, active: 3, recovery: 28, dmg: 92, hs: 34, kb: [5, -4], kd: true, unblock: true, box: [6, -62, 24, 52], stop: 10, anim: "push", sfx: "slam", desc: "UNBLOCKABLE short-range grab & slam (beats guarding)." }),
      s3: D({ name: "Pop Quiz", skill: 3, ult: true, kind: "cast", cd: 960, startup: 18, active: 1, recovery: 22, hook: "quiz", anim: "cast2", sfx: "slam", desc: "Slams the desk: foes within range take damage, are SILENCED (4s) and SLOWED." }),
      quizHit: D({ name: "Pop Quiz", dmg: 60, hs: 30, kb: [3, -4], launch: true, stop: 12, fx: { silence: 240, slow: 240 }, sfx: "slam", unblock: true, heavy: true }),
    },
  },

  jaguilar: {
    id: "jaguilar", name: "JAGUILAR", title: "Laptop DoT Specialist", color: "#32f0ff",
    hp: 990, walk: 1.8, back: 1.5, jump: 6.2, scale: 1.06, hurtH: 71,
    voice: "am_adam",
    look: { skin: "#dfb594", hair: "#1d1c24", hairStyle: "neat", top: "#1f5a78", top2: "#32f0ff", bottom: "#232631", shoes: "#d8dce6", accent: "#32f0ff", prop: "laptop", bodyW: 7 },
    passive: { name: "Firewall", desc: "Immune to BURN and BLIND." },
    basic: ["b1", "b2", "b3"], air: "air",
    moves: {
      b1: jab({ name: "Keycap Jab" }),
      b2: cross({ name: "Trackpad Poke", box: [8, -58, 32, 14] }),
      b3: fin({ name: "Laptop Bash", anim: "batswing", sfx: "bat", box: [6, -64, 40, 26], dmg: 54 }),
      air: air({ name: "Lid Slam", anim: "airslash", sfx: "bat" }),
      s1: D({ name: "Vein Cut", skill: 1, cd: 330, startup: 11, active: 6, recovery: 18, dmg: 70, hs: 24, kb: [5, -2], box: [6, -64, 52, 30], stop: 8, fx: { bleed: 2 }, anim: "slashA", sfx: "slash", desc: "Long laptop-edge slash — +2 BLEED." }),
      s2: D({ name: "Blue Screen", skill: 2, kind: "proj", cd: 480, startup: 11, active: 1, recovery: 16, anim: "throw", sfx: "disc",
        proj: [{ at: 11, kind: "bsod", vx: 5, y: -56, w: 14, h: 12, life: 110, dmg: 44, hs: 18, kb: [2, 0], lvl: "M", stop: 4, fx: { blind: 210 } }],
        desc: "Throws a crash window — BLINDS the foe (-30% dmg) for 3.5s." }),
      s3: D({ name: "Overclock Beam", skill: 3, ult: true, cd: 960, startup: 16, active: 18, recovery: 22, dmg: 34, hs: 22, kb: [1, 0], rehit: 4, maxHits: 4, finalKb: [8, -3], box: [12, -64, 190, 20], stop: 5, fx: { bleed: 1 }, anim: "beam", sfx: "gravity", desc: "Full-screen laptop laser — 4 hits, each +1 BLEED." }),
    },
  },

  paulite: {
    id: "paulite", name: "PAULITE", title: "Body-Slam Debuff Tank", color: "#ffd24c",
    hp: 1100, walk: 1.45, back: 1.2, jump: 5.6, scale: 0.86, hurtH: 60,
    voice: "am_santa",
    look: { skin: "#6d4534", hair: "#171418", hairStyle: "buzz", top: "#e09f2d", top2: "#ffd24c", bottom: "#2d3b4e", shoes: "#231f20", accent: "#ffd24c", prop: "none", bodyW: 11 },
    passive: { name: "Bad Jokes", desc: "Every 12s tells a terrible joke: nearby foes get SAD (-25% speed, -20% dmg) for 2s." },
    basic: ["b1", "b2", "b3"], air: "air",
    moves: {
      b1: jab({ name: "Belly Bump", anim: "push", dmg: 30, box: [4, -50, 26, 20] }),
      b2: cross({ name: "Elbow Wobble", anim: "elbow", dmg: 32 }),
      b3: fin({ name: "Hip Check", anim: "shoulder", dmg: 60, kb: [7, -1], box: [2, -54, 34, 30] }),
      air: air({ name: "Cannonball", anim: "airknee" }),
      s1: D({ name: "Belly Fat Flap", skill: 1, cd: 420, startup: 25, active: 8, recovery: 22, dmg: 98, hs: 30, bs: 18, kb: [3, -3], kd: true, box: [-10, -40, 56, 40], stop: 12, vel: [[4, 28, 2.8]], hook: "leap", anim: "stomp", sfx: "slam", heavy: true, desc: "Leaps and crashes down in a full-body belly slam (overhead)." }),
      s2: D({ name: "Bad Joke", skill: 2, kind: "cast", cd: 540, startup: 10, active: 1, recovery: 14, hook: "joke", anim: "cast", sfx: "cast", desc: "Tells a joke so bad the foe is SAD for 4s (-25% speed, -20% dmg)." }),
      s3: D({ name: "Body Slam Tsunami", skill: 3, ult: true, cd: 1020, startup: 14, active: 18, recovery: 26, dmg: 145, hs: 40, bs: 22, kb: [10, -6], launch: true, wallBounce: true, armor: [1, 32], box: [0, -54, 36, 52], stop: 15, vel: [[12, 30, 5.8]], fx: { sad: 240 }, anim: "shoulder", sfx: "slam", heavy: true, desc: "ARMORED belly charge — launches and leaves the foe SAD." }),
    },
  },

  johan: {
    id: "johan", name: "JOHAN BACORRO", title: "Rolling Juggernaut", color: "#65ff6e",
    hp: 1160, walk: 1.4, back: 1.2, jump: 5.6, scale: 0.92, hurtH: 64,
    voice: "am_fenrir",
    look: { skin: "#e7be9e", hair: "#2b2320", hairStyle: "messy", top: "#4e8f52", top2: "#65ff6e", bottom: "#353d4b", shoes: "#2b2b33", accent: "#65ff6e", prop: "none", bodyW: 10 },
    passive: { name: "Stench Poison", desc: "Toxic aura: foes standing close are POISONED (tick damage)." },
    basic: ["b1", "b2", "b3"], air: "air",
    moves: {
      b1: jab({ name: "Shove", anim: "push", dmg: 30 }),
      b2: cross({ name: "Shoulder Bump", anim: "shoulder", dmg: 34 }),
      b3: fin({ name: "Wide Swing", anim: "hook", dmg: 62, kb: [7, -1] }),
      air: air({ name: "Belly Drop", anim: "airknee" }),
      s1: D({ name: "Boulder Roll", skill: 1, cd: 420, startup: 10, active: 30, recovery: 20, dmg: 58, hs: 26, kb: [6, -3.5], kd: true, rehit: 12, maxHits: 2, armor: [1, 40], box: [-14, -34, 40, 34], stop: 7, vel: [[10, 40, 5.6]], anim: "roll", sfx: "slam", desc: "Tucks into a spinning boulder with ARMOR and barrels across the stage." }),
      s2: D({ name: "Stink Cloud", skill: 2, kind: "cast", cd: 540, startup: 12, active: 1, recovery: 14, hook: "stink", anim: "exhale", sfx: "smoke", desc: "Leaves a toxic cloud (4s): foes inside are POISONED and SLOWED." }),
      s3: D({ name: "Avalanche", skill: 3, ult: true, cd: 1020, startup: 14, active: 44, recovery: 22, dmg: 46, hs: 26, kb: [2, -2], rehit: 8, maxHits: 4, finalKb: [9, -7], wallBounce: true, armor: [1, 58], box: [-16, -40, 46, 40], stop: 7, vel: [[14, 58, 6.8]], fx: { poison: 240 }, anim: "roll", sfx: "slam", heavy: true, desc: "Giant ARMORED boulder rampage — 4 hits, poisons, launches." }),
    },
  },
};

export const ROSTER = ["jiross", "lian", "dumdum", "gayle", "dapsay", "william", "tanoy", "acar", "apsay", "dap", "jog", "jaguilar", "paulite", "johan"];

export function getMove(ref) {
  const i = ref.indexOf(":");
  return CHARS[ref.slice(0, i)].moves[ref.slice(i + 1)];
}

export const SMACK_TALK = [
  "Is that all you got?",
  "My grandma hits harder!",
  "You fight like a loading screen!",
  "Too slow, try again!",
  "Sit down, rookie!",
];

export const STAGES = [
  { id: "skyline", name: "Celestra Skyline" },
  { id: "arcade", name: "Neon Arcade" },
  { id: "classroom", name: "Batch 30 Classroom" },
];

export const PAULITE_JOKES = [
  "Why did the CSS break? No class!",
  "My code has no bugs, just surprise features!",
  "I'm on a seafood diet. I see food and crash!",
  "Batch 30? More like 30 FPS on your main!",
  "Why did the array break up? Too many arguments!",
  "You call that a combo? Internet Explorer loads faster!",
];
