// Roster Definitions, Frame Data, and Procedural Canvas Sprite Renderer

export const PAULITE_JOKES = [
  "Why did the CSS break? No class!",
  "My code doesn't have bugs, just surprise features!",
  "I'm on a seafood diet... I see food and crash!",
  "Batch 30? More like Batch 30 FPS on your main!",
  "Why did the array break up? Too many arguments!",
  "You call that a combo? Even IE6 loads faster!"
];

export const ROSTER = [
  {
    id: "apsay",
    name: "APSAY",
    heightLabel: "5'5\"",
    heightPx: 157,
    widthPx: 54,
    archetype: "Teleport Mixup / Rushdown",
    stats: { power: 68, speed: 95, defense: 58, special: 92 },
    walkSpeed: 4.9,
    backSpeed: 4.3,
    jumpForce: -14.2,
    maxHp: 960,
    colors: {
      skin: "#e3b796",
      hair: "#1b161d",
      top: "#5a32a3",
      bottom: "#1d2233",
      accent: "#b56bff",
      shoes: "#edeff7"
    },
    abilityTitle: "Signature: Apsay Punch",
    abilityDesc:
      "Vanishes in a smoke/afterimage burst and teleports behind the opponent for a cross-up punch. Defender must block opposite; punishable on whiff/block.",
    passiveTitle: null,
    passiveDesc: null,
    moves: {
      light: {
        name: "Snap Jab",
        startup: 8, active: 4, recovery: 10,
        damage: 38, guardDamage: 4, hitstun: 15, blockstun: 10,
        hitLevel: "HIGH", knockbackX: 4.5, launchY: 0, hitstop: 3,
        range: 78, hitboxY: -108, hitboxH: 34, chainable: true
      },
      crouchLight: {
        name: "Low Shin Poke",
        startup: 9, active: 4, recovery: 11,
        damage: 34, guardDamage: 4, hitstun: 14, blockstun: 10,
        hitLevel: "LOW", knockbackX: 4, launchY: 0, hitstop: 3,
        range: 76, hitboxY: -36, hitboxH: 32, chainable: true
      },
      heavy: {
        name: "Snap Kick",
        startup: 13, active: 5, recovery: 16,
        damage: 78, guardDamage: 10, hitstun: 21, blockstun: 14,
        hitLevel: "MID", knockbackX: 8.5, launchY: -2, hitstop: 5,
        range: 92, hitboxY: -96, hitboxH: 44
      },
      sweep: {
        name: "Low Sweep",
        startup: 15, active: 6, recovery: 20,
        damage: 68, guardDamage: 8, hitstun: 28, blockstun: 15,
        hitLevel: "LOW", knockbackX: 6, launchY: -5.5, hitstop: 5, knockdown: true,
        range: 96, hitboxY: -32, hitboxH: 32
      },
      launcher: {
        name: "Rising Heel",
        startup: 14, active: 6, recovery: 21,
        damage: 74, guardDamage: 9, hitstun: 36, blockstun: 13,
        hitLevel: "MID", knockbackX: 3.5, launchY: -12.6, hitstop: 6, launches: true,
        range: 84, hitboxY: -116, hitboxH: 72
      },
      throw: {
        name: "Back-Alley Shove",
        startup: 9, active: 4, recovery: 20,
        damage: 95, guardDamage: 0, hitstun: 34, blockstun: 0,
        hitLevel: "UNBLOCKABLE", knockbackX: 11, launchY: -7.5, hitstop: 6, knockdown: true,
        range: 82, hitboxY: -100, hitboxH: 60
      },
      signature: {
        name: "Apsay Punch",
        startup: 19, active: 6, recovery: 25,
        damage: 108, guardDamage: 14, hitstun: 28, blockstun: 12,
        hitLevel: "MID", knockbackX: 9.5, launchY: -5, hitstop: 7,
        range: 90, hitboxY: -110, hitboxH: 52, cooldown: 95, specialType: "apsay_tp"
      }
    }
  },
  {
    id: "dap",
    name: "DAP",
    heightLabel: "5'2\"",
    heightPx: 149,
    widthPx: 72,
    archetype: "Heavy Dive / Launcher Bruiser",
    stats: { power: 92, speed: 66, defense: 84, special: 88 },
    walkSpeed: 3.9,
    backSpeed: 3.4,
    jumpForce: -13.4,
    maxHp: 1060,
    colors: {
      skin: "#d8a37c",
      hair: "#211917",
      top: "#d63848",
      bottom: "#252b3b",
      accent: "#ff7a33",
      shoes: "#222530"
    },
    abilityTitle: "Signature: DAP Kick",
    abilityDesc:
      "Launches her body horizontally into a two-legged flying dropkick with heavy knockback, massive guard damage, and corner wall-bounce potential.",
    passiveTitle: null,
    passiveDesc: null,
    moves: {
      light: {
        name: "Bruiser Jab",
        startup: 10, active: 4, recovery: 11,
        damage: 45, guardDamage: 6, hitstun: 16, blockstun: 11,
        hitLevel: "HIGH", knockbackX: 5.2, launchY: 0, hitstop: 4,
        range: 80, hitboxY: -104, hitboxH: 36, chainable: true
      },
      crouchLight: {
        name: "Gut Check",
        startup: 10, active: 4, recovery: 12,
        damage: 42, guardDamage: 5, hitstun: 15, blockstun: 11,
        hitLevel: "LOW", knockbackX: 4.5, launchY: 0, hitstop: 4,
        range: 78, hitboxY: -36, hitboxH: 32, chainable: true
      },
      heavy: {
        name: "Heavy Haymaker",
        startup: 15, active: 6, recovery: 18,
        damage: 94, guardDamage: 14, hitstun: 23, blockstun: 15,
        hitLevel: "MID", knockbackX: 10.5, launchY: -3, hitstop: 6,
        range: 94, hitboxY: -100, hitboxH: 48
      },
      sweep: {
        name: "Bulldozer Sweep",
        startup: 17, active: 6, recovery: 22,
        damage: 80, guardDamage: 10, hitstun: 30, blockstun: 16,
        hitLevel: "LOW", knockbackX: 7, launchY: -5.8, hitstop: 6, knockdown: true,
        range: 96, hitboxY: -34, hitboxH: 34
      },
      launcher: {
        name: "Belly Uppercut",
        startup: 15, active: 6, recovery: 22,
        damage: 88, guardDamage: 12, hitstun: 38, blockstun: 14,
        hitLevel: "MID", knockbackX: 4, launchY: -13.2, hitstop: 7, launches: true,
        range: 86, hitboxY: -116, hitboxH: 74
      },
      throw: {
        name: "Hip Toss",
        startup: 10, active: 4, recovery: 21,
        damage: 112, guardDamage: 0, hitstun: 36, blockstun: 0,
        hitLevel: "UNBLOCKABLE", knockbackX: 12, launchY: -8, hitstop: 7, knockdown: true,
        range: 86, hitboxY: -102, hitboxH: 60
      },
      signature: {
        name: "DAP Kick",
        startup: 16, active: 15, recovery: 22,
        damage: 132, guardDamage: 32, hitstun: 34, blockstun: 20,
        hitLevel: "MID", knockbackX: 16.5, launchY: -6.5, hitstop: 8,
        wallBounce: true,
        range: 105, hitboxY: -96, hitboxH: 56, cooldown: 110, specialType: "dap_kick"
      }
    }
  },
  {
    id: "jog",
    name: "JOG",
    heightLabel: "5'6\"",
    heightPx: 160,
    widthPx: 60,
    archetype: "Control / Lockdown Fighter",
    stats: { power: 78, speed: 70, defense: 80, special: 96 },
    walkSpeed: 4.1,
    backSpeed: 3.7,
    jumpForce: -13.6,
    maxHp: 1020,
    colors: {
      skin: "#d9b08c",
      hair: "#a9b2c2",
      top: "#3e4b63",
      bottom: "#1b1f2a",
      accent: "#60d7ff",
      shoes: "#18181f"
    },
    abilityTitle: "Signature: JOG Smash (2-Hit Chair)",
    abilityDesc:
      "Hit 1 (Encore): Swings a folding chair that staggers & re-stands foes. Press Signature again on hit to chain Hit 2 (Silence): smashes a second chair inflicting SILENCE for 10s!",
    passiveTitle: null,
    passiveDesc: null,
    moves: {
      light: {
        name: "Stern Backhand",
        startup: 9, active: 4, recovery: 11,
        damage: 40, guardDamage: 5, hitstun: 16, blockstun: 11,
        hitLevel: "HIGH", knockbackX: 4.8, launchY: 0, hitstop: 4,
        range: 82, hitboxY: -112, hitboxH: 36, chainable: true
      },
      crouchLight: {
        name: "Ankle Tap",
        startup: 10, active: 4, recovery: 12,
        damage: 36, guardDamage: 5, hitstun: 15, blockstun: 10,
        hitLevel: "LOW", knockbackX: 4.2, launchY: 0, hitstop: 3,
        range: 80, hitboxY: -36, hitboxH: 32, chainable: true
      },
      heavy: {
        name: "Grumpy Side Kick",
        startup: 14, active: 5, recovery: 17,
        damage: 84, guardDamage: 11, hitstun: 22, blockstun: 14,
        hitLevel: "MID", knockbackX: 9, launchY: -2, hitstop: 5,
        range: 96, hitboxY: -102, hitboxH: 46
      },
      sweep: {
        name: "Cane Sweep",
        startup: 16, active: 6, recovery: 21,
        damage: 72, guardDamage: 9, hitstun: 28, blockstun: 15,
        hitLevel: "LOW", knockbackX: 6.5, launchY: -5.4, hitstop: 5, knockdown: true,
        range: 98, hitboxY: -32, hitboxH: 34
      },
      launcher: {
        name: "Chair Lift",
        startup: 14, active: 6, recovery: 21,
        damage: 78, guardDamage: 10, hitstun: 36, blockstun: 13,
        hitLevel: "MID", knockbackX: 3.5, launchY: -12.6, hitstop: 6, launches: true,
        range: 90, hitboxY: -118, hitboxH: 74
      },
      throw: {
        name: "Detention Slam",
        startup: 10, active: 4, recovery: 20,
        damage: 100, guardDamage: 0, hitstun: 35, blockstun: 0,
        hitLevel: "UNBLOCKABLE", knockbackX: 11, launchY: -7.5, hitstop: 6, knockdown: true,
        range: 84, hitboxY: -106, hitboxH: 60
      },
      signature: {
        name: "JOG Smash: Encore",
        startup: 13, active: 6, recovery: 20,
        damage: 72, guardDamage: 12, hitstun: 36, blockstun: 15,
        hitLevel: "MID", knockbackX: 3.0, launchY: 0, hitstop: 7,
        restand: true, canChainSig2: true,
        range: 116, hitboxY: -118, hitboxH: 68, cooldown: 95, specialType: "jog_chair_1"
      },
      signature2: {
        name: "JOG Smash: Silence",
        startup: 11, active: 7, recovery: 22,
        damage: 90, guardDamage: 16, hitstun: 28, blockstun: 16,
        hitLevel: "MID", knockbackX: 11.5, launchY: -5.5, hitstop: 9,
        inflictsSilence: 600, // 10 seconds at 60fps
        range: 124, hitboxY: -124, hitboxH: 76, specialType: "jog_chair_2"
      }
    }
  },
  {
    id: "jaguilar",
    name: "JAGUILAR",
    heightLabel: "5'8\"",
    heightPx: 166,
    widthPx: 58,
    archetype: "Mid-Range / DoT Pressure",
    stats: { power: 76, speed: 78, defense: 68, special: 92 },
    walkSpeed: 4.4,
    backSpeed: 4.0,
    jumpForce: -14.0,
    maxHp: 990,
    colors: {
      skin: "#dfb594",
      hair: "#1d1c24",
      top: "#1f5a78",
      bottom: "#232631",
      accent: "#32f0ff",
      shoes: "#d8dce6"
    },
    abilityTitle: "Signature: Jaguilar Vein Cut",
    abilityDesc:
      "Slashes forward with the edge of his open glowing laptop, dealing crisp mid-range damage and inflicting BLEED (tick damage every second for 5s).",
    passiveTitle: null,
    passiveDesc: null,
    moves: {
      light: {
        name: "Keycap Jab",
        startup: 9, active: 4, recovery: 10,
        damage: 39, guardDamage: 5, hitstun: 15, blockstun: 10,
        hitLevel: "HIGH", knockbackX: 4.8, launchY: 0, hitstop: 3,
        range: 84, hitboxY: -116, hitboxH: 36, chainable: true
      },
      crouchLight: {
        name: "Trackpad Poke",
        startup: 10, active: 4, recovery: 11,
        damage: 36, guardDamage: 5, hitstun: 14, blockstun: 10,
        hitLevel: "LOW", knockbackX: 4.2, launchY: 0, hitstop: 3,
        range: 82, hitboxY: -36, hitboxH: 32, chainable: true
      },
      heavy: {
        name: "Laptop Bash",
        startup: 14, active: 5, recovery: 17,
        damage: 82, guardDamage: 11, hitstun: 21, blockstun: 14,
        hitLevel: "MID", knockbackX: 9, launchY: -2, hitstop: 5,
        range: 104, hitboxY: -108, hitboxH: 48
      },
      sweep: {
        name: "Cable Trip",
        startup: 16, active: 6, recovery: 21,
        damage: 70, guardDamage: 9, hitstun: 28, blockstun: 15,
        hitLevel: "LOW", knockbackX: 6.2, launchY: -5.5, hitstop: 5, knockdown: true,
        range: 100, hitboxY: -32, hitboxH: 34
      },
      launcher: {
        name: "Kernel Panic Upper",
        startup: 14, active: 6, recovery: 21,
        damage: 78, guardDamage: 10, hitstun: 37, blockstun: 13,
        hitLevel: "MID", knockbackX: 3.5, launchY: -12.8, hitstop: 6, launches: true,
        range: 90, hitboxY: -120, hitboxH: 76
      },
      throw: {
        name: "Force Push",
        startup: 10, active: 4, recovery: 20,
        damage: 98, guardDamage: 0, hitstun: 34, blockstun: 0,
        hitLevel: "UNBLOCKABLE", knockbackX: 11.5, launchY: -7.5, hitstop: 6, knockdown: true,
        range: 84, hitboxY: -108, hitboxH: 60
      },
      signature: {
        name: "Jaguilar Vein Cut",
        startup: 14, active: 7, recovery: 20,
        damage: 88, guardDamage: 14, hitstun: 24, blockstun: 14,
        hitLevel: "MID", knockbackX: 8.5, launchY: -3.5, hitstop: 7,
        inflictsBleed: 300, // 5 seconds at 60fps
        range: 128, hitboxY: -116, hitboxH: 60, cooldown: 105, specialType: "vein_cut"
      }
    }
  },
  {
    id: "paulite",
    name: "PAULITE",
    heightLabel: "4'9\"",
    heightPx: 136,
    widthPx: 72,
    archetype: "Body-Slam & Debuff Tank",
    stats: { power: 90, speed: 62, defense: 88, special: 90 },
    walkSpeed: 3.7,
    backSpeed: 3.2,
    jumpForce: -13.0,
    maxHp: 1100,
    colors: {
      skin: "#6d4534",
      hair: "#171418",
      top: "#e09f2d",
      bottom: "#2d3b4e",
      accent: "#ffd24c",
      shoes: "#231f20"
    },
    abilityTitle: "Signature: Belly Fat Flap",
    abilityDesc:
      "Leaps upward and crashes down with a full-body belly slam causing heavy ground-pound impact & overhead pressure.",
    passiveTitle: "Passive: Bad Jokes",
    passiveDesc:
      "Periodically tells terrible jokes with speech bubbles that inflict SADNESS on nearby foes, reducing movement speed (-25%) and attack damage (-20%).",
    moves: {
      light: {
        name: "Long-Arm Slap",
        startup: 10, active: 4, recovery: 11,
        damage: 44, guardDamage: 6, hitstun: 16, blockstun: 11,
        hitLevel: "HIGH", knockbackX: 5.5, launchY: 0, hitstop: 4,
        range: 102, hitboxY: -96, hitboxH: 38, chainable: true
      },
      crouchLight: {
        name: "Knuckle Drag",
        startup: 10, active: 4, recovery: 12,
        damage: 40, guardDamage: 5, hitstun: 15, blockstun: 11,
        hitLevel: "LOW", knockbackX: 4.8, launchY: 0, hitstop: 4,
        range: 98, hitboxY: -36, hitboxH: 34, chainable: true
      },
      heavy: {
        name: "Troll Clobber",
        startup: 15, active: 6, recovery: 18,
        damage: 92, guardDamage: 14, hitstun: 23, blockstun: 15,
        hitLevel: "MID", knockbackX: 10, launchY: -2.5, hitstop: 6,
        range: 112, hitboxY: -98, hitboxH: 50
      },
      sweep: {
        name: "Long-Arm Trip",
        startup: 17, active: 6, recovery: 22,
        damage: 78, guardDamage: 10, hitstun: 30, blockstun: 16,
        hitLevel: "LOW", knockbackX: 6.5, launchY: -5.6, hitstop: 6, knockdown: true,
        range: 108, hitboxY: -34, hitboxH: 34
      },
      launcher: {
        name: "Ape Uppercut",
        startup: 15, active: 6, recovery: 22,
        damage: 84, guardDamage: 12, hitstun: 38, blockstun: 14,
        hitLevel: "MID", knockbackX: 3.8, launchY: -13.0, hitstop: 7, launches: true,
        range: 100, hitboxY: -110, hitboxH: 74
      },
      throw: {
        name: "Bear Hug Drop",
        startup: 10, active: 4, recovery: 21,
        damage: 114, guardDamage: 0, hitstun: 36, blockstun: 0,
        hitLevel: "UNBLOCKABLE", knockbackX: 11, launchY: -8.5, hitstop: 7, knockdown: true,
        range: 94, hitboxY: -96, hitboxH: 60
      },
      signature: {
        name: "Belly Fat Flap",
        startup: 18, active: 18, recovery: 22,
        damage: 136, guardDamage: 24, hitstun: 34, blockstun: 18,
        hitLevel: "MID", knockbackX: 12, launchY: -7.5, hitstop: 9, knockdown: true,
        range: 104, hitboxY: -88, hitboxH: 72, cooldown: 115, specialType: "belly_flap"
      }
    }
  },
  {
    id: "johan",
    name: "JOHAN BACORRO",
    heightLabel: "5'1\"",
    heightPx: 146,
    widthPx: 84,
    archetype: "Rolling Juggernaut / Hazard",
    stats: { power: 94, speed: 58, defense: 96, special: 92 },
    walkSpeed: 3.4,
    backSpeed: 3.0,
    jumpForce: -12.6,
    maxHp: 1160,
    colors: {
      skin: "#e7be9e",
      hair: "#2b2320",
      top: "#4e8f52",
      bottom: "#353d4b",
      accent: "#65ff6e",
      shoes: "#2b2b33"
    },
    abilityTitle: "Signature: Boulder Roll",
    abilityDesc:
      "Tucks into a spinning boulder and barrels across the stage with heavy momentum and 1-hit Super Armor.",
    passiveTitle: "Passive: Stench Poison",
    passiveDesc:
      "Emits a visible green toxic aura around himself; enemies standing close automatically suffer POISON tick damage while Johan waves cheerfully.",
    moves: {
      light: {
        name: "Friendly Pat",
        startup: 10, active: 5, recovery: 12,
        damage: 46, guardDamage: 6, hitstun: 16, blockstun: 11,
        hitLevel: "HIGH", knockbackX: 5.5, launchY: 0, hitstop: 4,
        range: 84, hitboxY: -102, hitboxH: 38, chainable: true
      },
      crouchLight: {
        name: "Roundhouse Toe",
        startup: 11, active: 4, recovery: 12,
        damage: 42, guardDamage: 5, hitstun: 15, blockstun: 11,
        hitLevel: "LOW", knockbackX: 4.5, launchY: 0, hitstop: 4,
        range: 82, hitboxY: -34, hitboxH: 34, chainable: true
      },
      heavy: {
        name: "Gut Bump",
        startup: 15, active: 6, recovery: 19,
        damage: 98, guardDamage: 15, hitstun: 24, blockstun: 16,
        hitLevel: "MID", knockbackX: 11.5, launchY: -3, hitstop: 6,
        range: 96, hitboxY: -98, hitboxH: 54
      },
      sweep: {
        name: "Stubby Sweep",
        startup: 17, active: 6, recovery: 22,
        damage: 82, guardDamage: 10, hitstun: 30, blockstun: 16,
        hitLevel: "LOW", knockbackX: 7, launchY: -5.6, hitstop: 6, knockdown: true,
        range: 94, hitboxY: -32, hitboxH: 34
      },
      launcher: {
        name: "Boulder Heave",
        startup: 16, active: 6, recovery: 23,
        damage: 88, guardDamage: 12, hitstun: 38, blockstun: 14,
        hitLevel: "MID", knockbackX: 4, launchY: -13.0, hitstop: 7, launches: true,
        range: 90, hitboxY: -112, hitboxH: 74
      },
      throw: {
        name: "Friendly Hug",
        startup: 11, active: 4, recovery: 22,
        damage: 118, guardDamage: 0, hitstun: 36, blockstun: 0,
        hitLevel: "UNBLOCKABLE", knockbackX: 12, launchY: -8.5, hitstop: 7, knockdown: true,
        range: 90, hitboxY: -98, hitboxH: 64
      },
      signature: {
        name: "Boulder Roll",
        startup: 14, active: 22, recovery: 20,
        damage: 126, guardDamage: 22, hitstun: 32, blockstun: 18,
        hitLevel: "MID", knockbackX: 14, launchY: -6.5, hitstop: 8,
        hasArmor: true, knockdown: true,
        range: 88, hitboxY: -94, hitboxH: 76, cooldown: 115, specialType: "boulder_roll"
      }
    }
  }
];

export function getRosterFighter(id) {
  return ROSTER.find((f) => f.id === id) || ROSTER[0];
}

// Procedural Sprite Renderer
export function drawFighter(ctx, fighter, time, { isPreview = false } = {}) {
  const def = fighter.def || fighter;
  const x = isPreview ? 0 : fighter.x;
  const y = isPreview ? 0 : fighter.y;
  const facing = isPreview ? 1 : fighter.facing;
  const state = isPreview ? "idle" : fighter.state;
  const moveId = isPreview ? null : fighter.currentMoveId;
  const stateFrame = isPreview ? 0 : fighter.stateFrame;

  const H = def.heightPx;
  const scale = H / 155;
  const isCrouching = !isPreview && (fighter.crouching || state === "crouch_block");
  const crouchScaleY = isCrouching ? 0.72 : 1;
  const isRolling = !isPreview && state === "attack" && moveId === "signature" && def.id === "johan";
  const isBellyFlap = !isPreview && state === "attack" && moveId === "signature" && def.id === "paulite";
  const isDapKick = !isPreview && state === "attack" && moveId === "signature" && def.id === "dap";
  const isKnockdown = !isPreview && (state === "knockdown" || state === "ko");

  // Johan's passive Stench Poison aura behind him
  if (def.id === "johan" && !isPreview) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.08);
    ctx.save();
    const grad = ctx.createRadialGradient(x, y - 62, 18, x, y - 62, 152);
    grad.addColorStop(0, `rgba(90, 235, 95, ${0.18 + pulse * 0.09})`);
    grad.addColorStop(0.65, `rgba(60, 200, 75, ${0.09 + pulse * 0.05})`);
    grad.addColorStop(1, "rgba(60, 200, 75, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y - 62, 152, 0, Math.PI * 2);
    ctx.fill();

    // Wavy stink lines
    ctx.strokeStyle = `rgba(120, 255, 110, ${0.35 + pulse * 0.25})`;
    ctx.lineWidth = 2.2;
    for (let i = -2; i <= 2; i++) {
      const lx = x + i * 32;
      const ly = y - 120 - ((time * 1.1 + i * 17) % 35);
      ctx.beginPath();
      ctx.moveTo(lx, ly + 20);
      ctx.quadraticCurveTo(lx + Math.sin(time * 0.12 + i) * 9, ly + 10, lx, ly);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Ground shadow
  if (!isPreview) {
    const groundDist = Math.max(0, 595 - y);
    const shadowScale = Math.max(0.45, 1 - groundDist / 320);
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
    ctx.beginPath();
    ctx.ellipse(x, 600, (def.widthPx * 0.65) * shadowScale, 11 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);

  // Apsay teleport vanish opacity during early startup
  if (!isPreview && state === "attack" && moveId === "signature" && def.id === "apsay") {
    if (stateFrame >= 4 && stateFrame <= 14) {
      ctx.globalAlpha = 0.22;
    }
  }

  // Knockdown rotation
  if (isKnockdown) {
    ctx.translate(0, -18);
    ctx.rotate(-Math.PI / 2);
  } else if (isBellyFlap && stateFrame > 8) {
    // Paulite horizontal belly dive
    ctx.translate(0, -48);
    ctx.rotate(Math.PI / 2.25);
  } else if (isDapKick && stateFrame >= 6 && stateFrame <= 31) {
    // Dap flying two-legged dropkick tilt
    ctx.translate(0, -56);
    ctx.rotate(-0.55);
    ctx.translate(0, 56);
  } else if (state === "hitstun") {
    ctx.rotate(-0.18);
  } else if (state === "juggle") {
    ctx.translate(0, -65);
    ctx.rotate(time * 0.22);
    ctx.translate(0, 65);
  }

  // Boulder Roll special form for Johan
  if (isRolling) {
    const rot = time * 0.48;
    ctx.save();
    ctx.translate(0, -56);
    ctx.rotate(rot);
    ctx.fillStyle = "#56635b";
    ctx.strokeStyle = "#1d2420";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Green shirt stripe & boulder cracks
    ctx.strokeStyle = def.colors.top;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0.2, 2.2);
    ctx.stroke();
    ctx.strokeStyle = "#95ff9a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 53, -0.5, 1.3);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
    return;
  }

  ctx.scale(1, crouchScaleY);

  const bob = state === "idle" ? Math.sin(time * 0.14) * 3 : 0;
  const walkSwing = (state === "walk_f" || state === "walk_b") ? Math.sin(time * 0.34) * 14 : 0;
  const isAttack = state === "attack";
  const isBlock = state === "block" || state === "crouch_block";

  // Body proportions per fighter
  const isBoulder = def.id === "johan";
  const isBelly = def.id === "dap" || def.id === "paulite";
  const isSkinnyFat = def.id === "apsay" || def.id === "jaguilar";
  const longArms = def.id === "paulite";

  const torsoW = isBoulder ? 68 : isBelly ? 50 : isSkinnyFat ? 38 : 40;
  const torsoH = isBoulder ? 62 : 54 * scale;
  const legH = isBoulder ? 34 : 50 * scale;
  const headR = isBoulder ? 27 : 18 * scale;

  const hipY = -legH;
  const shoulderY = hipY - torsoH + bob;
  const headY = shoulderY - headR * 0.9;

  // --- BACK LEG ---
  ctx.save();
  ctx.fillStyle = def.colors.bottom;
  ctx.strokeStyle = "#10131c";
  ctx.lineWidth = 2.5;
  const backLegX = -10 - walkSwing * 0.6;
  ctx.beginPath();
  ctx.roundRect(backLegX - 8, hipY - 4, 16, legH + 2, 6);
  ctx.fill();
  ctx.stroke();
  // Shoe
  ctx.fillStyle = def.colors.shoes;
  ctx.beginPath();
  ctx.roundRect(backLegX - 9, -10, 20, 10, 4);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // --- BACK ARM ---
  ctx.save();
  const armLen = longArms ? 64 : 42 * scale;
  const armThick = longArms ? 14 : 11;
  ctx.strokeStyle = "#10131c";
  ctx.lineWidth = 2.5;
  ctx.fillStyle = def.colors.skin;
  ctx.translate(-torsoW * 0.35, shoulderY + 10);
  let backArmAngle = 0.25;
  if (isBlock) backArmAngle = -1.2;
  else if (def.id === "johan" && state === "idle") {
    // Cheerful waving!
    backArmAngle = -2.3 + Math.sin(time * 0.22) * 0.45;
  } else if (def.id === "jaguilar") {
    backArmAngle = -0.75; // holding laptop
  }
  ctx.rotate(backArmAngle);
  ctx.beginPath();
  ctx.roundRect(-armThick / 2, 0, armThick, armLen, 6);
  ctx.fill();
  ctx.stroke();
  // Fist
  ctx.beginPath();
  ctx.arc(0, armLen, armThick * 0.65, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // --- FRONT LEG ---
  ctx.save();
  ctx.fillStyle = def.colors.bottom;
  ctx.strokeStyle = "#10131c";
  ctx.lineWidth = 2.5;
  let frontLegAngle = 0;
  if (isDapKick && stateFrame >= 6) {
    frontLegAngle = -1.38;
  } else if (isAttack && (moveId === "heavy" || moveId === "sweep")) {
    frontLegAngle = moveId === "sweep" ? -1.25 : -1.48;
  }
  ctx.translate(10 + walkSwing * 0.6, hipY);
  ctx.rotate(frontLegAngle);
  ctx.beginPath();
  ctx.roundRect(-8, -4, 17, legH + 2, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = def.colors.shoes;
  ctx.beginPath();
  ctx.roundRect(-7, legH - 10, 22, 10, 4);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // --- TORSO ---
  ctx.save();
  ctx.fillStyle = def.colors.top;
  ctx.strokeStyle = "#10131c";
  ctx.lineWidth = 3;
  if (isBoulder) {
    // Obese boulder-shaped body
    ctx.beginPath();
    ctx.ellipse(2, hipY - torsoH * 0.48 + bob, torsoW * 0.55, torsoH * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.roundRect(-torsoW * 0.48, shoulderY, torsoW * 0.96, torsoH + 8, 12);
    ctx.fill();
    ctx.stroke();

    // Prominent belly fat / skinny-fat gut protrusion
    if (isBelly || isSkinnyFat) {
      ctx.fillStyle = def.colors.top;
      ctx.beginPath();
      const bellyR = def.id === "dap" ? 21 : def.id === "paulite" ? 20 : 12;
      ctx.arc(torsoW * 0.34, hipY - 14 + bob, bellyR, -Math.PI * 0.52, Math.PI * 0.52);
      ctx.fill();
      ctx.stroke();
    }

    // Accent stripe / collar detail
    ctx.fillStyle = def.colors.accent;
    if (def.id === "jog") {
      // Collared shirt V
      ctx.beginPath();
      ctx.moveTo(-6, shoulderY + 2);
      ctx.lineTo(12, shoulderY + 2);
      ctx.lineTo(4, shoulderY + 18);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(-torsoW * 0.3, shoulderY + 12, torsoW * 0.6, 5);
    }
  }
  ctx.restore();

  // --- HEAD & HAIR & FACIAL TRAITS ---
  ctx.save();
  ctx.translate(4, headY);

  // Back hair for Apsay (long flowing dark hair!)
  if (def.id === "apsay") {
    const hairSway = Math.sin(time * 0.16) * 5 - (state === "walk_f" ? 8 : 0);
    ctx.fillStyle = def.colors.hair;
    ctx.strokeStyle = "#0e0b12";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, -headR * 0.8);
    ctx.quadraticCurveTo(-headR * 1.5 + hairSway, 12, -headR * 1.2 + hairSway, 54);
    ctx.lineTo(-2, 46);
    ctx.quadraticCurveTo(-8, 12, 4, -headR * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Head circle
  ctx.fillStyle = def.colors.skin;
  ctx.strokeStyle = "#10131c";
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.arc(0, 0, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Hair styles
  ctx.fillStyle = def.colors.hair;
  if (def.id === "apsay") {
    // Bangs / top hair
    ctx.beginPath();
    ctx.arc(0, -4, headR + 1, Math.PI * 0.92, Math.PI * 2.08);
    ctx.lineTo(headR * 0.55, -2);
    ctx.lineTo(0, -headR * 0.3);
    ctx.closePath();
    ctx.fill();
  } else if (def.id === "dap") {
    // Tied hair + headband
    ctx.beginPath();
    ctx.arc(-2, -3, headR, Math.PI * 0.95, Math.PI * 2.05);
    ctx.fill();
    ctx.fillStyle = def.colors.accent;
    ctx.fillRect(-headR, -headR * 0.45, headR * 2, 6);
  } else if (def.id === "jog") {
    // Older man gray swept hair + sideburns
    ctx.beginPath();
    ctx.arc(-1, -4, headR + 1, Math.PI * 0.88, Math.PI * 2.02);
    ctx.fill();
    ctx.fillRect(-headR, -4, 6, 14);
  } else if (def.id === "jaguilar") {
    // Nerd parted dark hair
    ctx.beginPath();
    ctx.arc(0, -4, headR + 1, Math.PI * 0.95, Math.PI * 2.05);
    ctx.fill();
  } else if (def.id === "paulite") {
    // Short curly/cropped dark hair
    ctx.beginPath();
    ctx.arc(0, -5, headR + 1, Math.PI * 0.92, Math.PI * 2.08);
    ctx.fill();
  } else if (def.id === "johan") {
    // Clean tuft on oversized cheerful head
    ctx.beginPath();
    ctx.arc(0, -6, headR, Math.PI * 1.1, Math.PI * 1.9);
    ctx.fill();
  }

  // Pimples on Apsay and Paulite
  if (def.id === "apsay" || def.id === "paulite") {
    ctx.fillStyle = "#d93b48";
    const spots = [
      [5, 4, 1.9],
      [9, 7, 1.6],
      [2, 9, 1.5],
      [-4, -3, 1.7]
    ];
    for (const [sx, sy, sr] of spots) {
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Facial expressions & Glasses
  if (def.id === "johan") {
    // Cheerful friendly smiling expression + rosy cheeks
    ctx.fillStyle = "rgba(255, 110, 120, 0.45)";
    ctx.beginPath();
    ctx.arc(10, 5, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#1b1817";
    ctx.lineWidth = 2.5;
    // Happy curved eye
    ctx.beginPath();
    ctx.arc(8, -3, 4, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    // Big friendly smile
    ctx.beginPath();
    ctx.arc(7, 4, 8, 0.15, Math.PI * 0.85);
    ctx.stroke();
  } else if (def.id === "jog") {
    // Sad/angry scowl + furrowed brows
    ctx.strokeStyle = "#1a1a22";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(2, -7);
    ctx.lineTo(12, -4);
    ctx.stroke();
    ctx.fillStyle = "#1a1a22";
    ctx.beginPath();
    ctx.arc(8, -1, 2.3, 0, Math.PI * 2);
    ctx.fill();
    // Downturned scowl
    ctx.beginPath();
    ctx.arc(8, 12, 6, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  } else {
    // Standard focused fighter eyes
    ctx.fillStyle = "#16161d";
    ctx.beginPath();
    ctx.arc(8, -2, 2.3, 0, Math.PI * 2);
    ctx.fill();

    // Glasses for Jaguilar
    if (def.id === "jaguilar") {
      ctx.strokeStyle = "#101420";
      ctx.lineWidth = 2.2;
      ctx.fillStyle = "rgba(50, 240, 255, 0.25)";
      ctx.fillRect(2, -6, 13, 8);
      ctx.strokeRect(2, -6, 13, 8);
      ctx.beginPath();
      ctx.moveTo(-headR * 0.6, -2);
      ctx.lineTo(2, -2);
      ctx.stroke();
    }

    // Mouth
    ctx.strokeStyle = "#2b1c18";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, 7);
    ctx.lineTo(11, 7);
    ctx.stroke();
  }
  ctx.restore();

  // --- FRONT ARM & WEAPONS (Laptop / Folding Chair) ---
  ctx.save();
  ctx.translate(torsoW * 0.28, shoulderY + 10);
  let frontArmAngle = -0.35;
  if (isBlock) frontArmAngle = -1.35;
  else if (isAttack && (moveId === "light" || moveId === "crouchLight" || moveId === "throw")) {
    frontArmAngle = -1.55;
  } else if (isAttack && moveId === "launcher") {
    frontArmAngle = -2.45;
  } else if (isAttack && moveId === "signature") {
    if (def.id === "apsay") frontArmAngle = -1.6;
    else if (def.id === "jog") frontArmAngle = -1.3 + Math.sin(stateFrame * 0.4) * 0.9;
    else if (def.id === "jaguilar") frontArmAngle = -1.45;
  }

  ctx.rotate(frontArmAngle);
  ctx.fillStyle = def.colors.skin;
  ctx.strokeStyle = "#10131c";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-armThick / 2, 0, armThick, armLen, 6);
  ctx.fill();
  ctx.stroke();

  // Fist
  ctx.beginPath();
  ctx.arc(0, armLen, armThick * 0.68, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // JAGUILAR's Glowing Open Laptop
  if (def.id === "jaguilar") {
    ctx.save();
    ctx.translate(2, armLen + 2);
    ctx.rotate(isAttack && moveId === "signature" ? 0.35 : 0.7);
    // Laptop base
    ctx.fillStyle = "#cfd8e3";
    ctx.strokeStyle = "#161a24";
    ctx.lineWidth = 2;
    ctx.fillRect(-4, -3, 28, 5);
    ctx.strokeRect(-4, -3, 28, 5);
    // Glowing open screen
    ctx.fillStyle = "#32f0ff";
    ctx.shadowColor = "#32f0ff";
    ctx.shadowBlur = 10;
    ctx.fillRect(-4, -22, 4, 20);
    ctx.strokeRect(-4, -22, 4, 20);
    ctx.restore();
  }

  // JOG's Metallic Folding Chair during JOG Smash
  if (def.id === "jog" && isAttack && (moveId === "signature" || moveId === "signature2" || moveId === "launcher")) {
    ctx.save();
    ctx.translate(4, armLen + 4);
    ctx.rotate(0.4);
    ctx.strokeStyle = "#d5dde8";
    ctx.lineWidth = 4;
    // Chair frame
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(36, 12);
    ctx.moveTo(14, 4);
    ctx.lineTo(14, -28);
    ctx.moveTo(28, 8);
    ctx.lineTo(28, -22);
    ctx.stroke();
    // Seat & Backrest
    ctx.fillStyle = moveId === "signature2" ? "#60d7ff" : "#8b98ad";
    ctx.fillRect(10, -28, 22, 10);
    ctx.fillRect(6, 0, 26, 6);
    ctx.restore();
  }
  ctx.restore();

  ctx.restore();

  // --- ACTIVE STATUS OVERLAYS ON FIGHTER (in Arena) ---
  if (!isPreview) {
    drawStatusEffectsOnFighter(ctx, fighter, time);
  }
}

function drawStatusEffectsOnFighter(ctx, fighter, time) {
  const topY = fighter.y - fighter.def.heightPx - 28;

  // Armor flash on Johan Boulder Roll
  if (fighter.armorHits > 0) {
    ctx.save();
    ctx.strokeStyle = "#ffdf5e";
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.65 + 0.3 * Math.sin(time * 0.4);
    ctx.beginPath();
    ctx.arc(fighter.x, fighter.y - 58, 58, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Active status badges above fighter head
  const badges = [];
  if (fighter.statuses.silence > 0) badges.push({ label: "SILENCED", color: "#5ce1ff", sec: Math.ceil(fighter.statuses.silence / 60) });
  if (fighter.statuses.bleed > 0) badges.push({ label: "BLEED", color: "#ff3b5c", sec: Math.ceil(fighter.statuses.bleed / 60) });
  if (fighter.statuses.sad > 0) badges.push({ label: "SAD", color: "#76a9ff", sec: Math.ceil(fighter.statuses.sad / 60) });
  if (fighter.statuses.poison > 0) badges.push({ label: "POISON", color: "#65ff6e", sec: Math.ceil(fighter.statuses.poison / 60) });

  if (badges.length > 0) {
    ctx.save();
    ctx.font = "900 11px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    badges.forEach((b, idx) => {
      const by = topY - idx * 18;
      const text = `${b.label} ${b.sec}s`;
      const w = ctx.measureText(text).width + 12;
      ctx.fillStyle = "rgba(10, 12, 20, 0.85)";
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(fighter.x - w / 2, by - 11, w, 15, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = b.color;
      ctx.fillText(text, fighter.x, by);
    });
    ctx.restore();
  }

  // Sadness raincloud visual
  if (fighter.statuses.sad > 0) {
    ctx.save();
    const cy = topY - badges.length * 18 - 14;
    ctx.fillStyle = "#5f7ba8";
    ctx.beginPath();
    ctx.arc(fighter.x - 8, cy, 8, 0, Math.PI * 2);
    ctx.arc(fighter.x + 4, cy - 3, 10, 0, Math.PI * 2);
    ctx.arc(fighter.x + 14, cy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#8ac0ff";
    ctx.lineWidth = 1.5;
    for (let i = -1; i <= 1; i++) {
      const dropY = cy + 10 + ((time * 1.8 + i * 7) % 14);
      ctx.beginPath();
      ctx.moveTo(fighter.x + i * 8, dropY);
      ctx.lineTo(fighter.x + i * 8 - 1, dropY + 5);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function drawPortrait(canvas, fighterId, time = 0) {
  const ctx = canvas.getContext("2d");
  const def = getRosterFighter(fighterId);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  const s = canvas.width / 220;
  ctx.translate(canvas.width * 0.5, canvas.height * 0.88);
  ctx.scale(s, s);
  drawFighter(ctx, { def }, time, { isPreview: true });
  ctx.restore();
}
