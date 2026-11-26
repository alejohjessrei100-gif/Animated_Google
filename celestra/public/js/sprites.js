// Celestra Chronicles — procedural 16-bit pixel sprite rig.
// Every body part is rasterised with integer fillRects (no anti-aliasing) and
// outlined, so fighters read as crisp pixel-art at 480x270.
import { CHARS, getMove } from "./chars.js";

// ---------- pixel primitives ----------
const SPANS = [];
for (let r = 0; r <= 12; r++) {
  const rows = [];
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r + r * 0.8 - y * y));
    rows.push([y, w]);
  }
  SPANS[r] = rows;
}
export function disc(ctx, x, y, r, col) {
  x = Math.round(x); y = Math.round(y); r = Math.max(0, Math.round(r));
  ctx.fillStyle = col;
  if (r === 0) { ctx.fillRect(x, y, 1, 1); return; }
  for (const [dy, w] of SPANS[Math.min(r, 12)]) ctx.fillRect(x - w, y + dy, w * 2 + 1, 1);
}
export function capsule(ctx, x1, y1, x2, y2, r1, r2, col) {
  const dx = x2 - x1, dy = y2 - y1;
  const n = Math.max(1, Math.ceil(Math.hypot(dx, dy)));
  for (let i = 0; i <= n; i++) { const k = i / n; disc(ctx, x1 + dx * k, y1 + dy * k, r1 + (r2 - r1) * k, col); }
}
export function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (k < 1) { r *= k; g *= k; b *= k; } else { r += (255 - r) * (k - 1); g += (255 - g) * (k - 1); b += (255 - b) * (k - 1); }
  return "#" + ((1 << 24) | (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)).toString(16).slice(1);
}
const OUT = "#120e18";

// ---------- poses ----------
// angles in degrees. limbs measured from straight-down, + = toward facing.
// torso measured from straight-up, + = lean forward. knee/elbow are relative.
const BASE = { hx: 0, hd: 0, hy: null, tor: 6, hed: 0, bu: 25, be: 100, fu: 45, fe: 95, blu: -12, blk: 6, flu: 16, flk: -14, pa: 0, rot: 0 };
const P = (o) => ({ ...BASE, ...o });
const lerpPose = (a, b, k) => {
  const o = {};
  for (const key in BASE) o[key] = key === "hy" ? (a.hy == null || b.hy == null ? (k < 0.5 ? a.hy : b.hy) : a.hy + (b.hy - a.hy) * k) : a[key] + (b[key] - a[key]) * k;
  return o;
};

const IDLE = [P({}), P({ hd: 1, fu: 47, bu: 27 }), P({ hd: 2, fu: 49, bu: 29, tor: 7 }), P({ hd: 1, fu: 47, bu: 27 })];
const WALK = [
  P({ flu: 28, flk: -8, blu: -22, blk: 10, hd: 0 }),
  P({ flu: 14, flk: -30, blu: -10, blk: 0, hd: 1 }),
  P({ flu: -4, flk: -22, blu: 8, blk: -12, hd: 2 }),
  P({ flu: -18, flk: -6, blu: 24, blk: -10, hd: 0 }),
  P({ flu: -6, flk: 0, blu: 12, blk: -34, hd: 1 }),
  P({ flu: 12, flk: -6, blu: -8, blk: -20, hd: 2 }),
];
const POSES = {
  dash: [P({ tor: 30, hed: -10, flu: 50, flk: -40, blu: -40, blk: 30, fu: 10, fe: 70, bu: -30, be: 60, hd: 4 }), P({ tor: 34, hed: -12, flu: 36, flk: -60, blu: -30, blk: 10, fu: 0, fe: 70, bu: -40, be: 70, hd: 5 })],
  bdash: [P({ tor: -12, hed: 6, flu: 30, flk: -10, blu: -30, blk: -20, fu: 60, fe: 100 }), P({ tor: -8, flu: 20, flk: -30, blu: -10, blk: -40, fu: 55, fe: 100 })],
  jumpUp: P({ flu: 60, flk: -100, blu: 20, blk: -110, tor: 4, fu: 70, fe: 80, bu: 50, be: 90 }),
  jumpDown: P({ flu: 30, flk: -40, blu: -10, blk: -30, tor: 2, fu: 80, fe: 60, bu: 40, be: 90 }),
  crouch: P({ hd: 16, tor: 22, flu: 75, flk: -120, blu: 30, blk: -115, fu: 55, fe: 100, bu: 40, be: 110 }),
  block: P({ tor: -2, hed: 4, fu: 80, fe: 120, bu: 65, be: 125, flu: 10, flk: -10, blu: -18, blk: 8 }),
  cblock: P({ hd: 16, tor: 18, flu: 75, flk: -120, blu: 30, blk: -115, fu: 85, fe: 120, bu: 70, be: 125 }),
  hit: [P({ tor: -22, hed: -16, fu: -10, fe: 40, bu: -30, be: 30, flu: 20, flk: -6, blu: -20, blk: 4 }), P({ tor: -14, hed: -8, fu: 10, fe: 60, bu: -10, be: 50 })],
  stagger: [P({ tor: -26, hed: -18, fu: -40, fe: 20, bu: -60, be: 20, flu: 30, flk: -10, blu: -26 }), P({ tor: -20, hed: -12, fu: -30, fe: 30, bu: -50, be: 30 })],
  air: [P({ hy: -30, tor: -70, hed: -20, fu: -60, fe: 20, bu: -90, be: 10, flu: 70, flk: -30, blu: 40, blk: -40 }), P({ hy: -30, tor: -95, hed: -10, fu: -80, fe: 30, bu: -110, be: 20, flu: 90, flk: -20, blu: 60, blk: -50 })],
  down: P({ hy: -5, tor: -90, hed: 10, fu: -150, fe: 10, bu: -130, be: 20, flu: 92, flk: -4, blu: 86, blk: -10 }),
  wake: [P({ hd: 18, tor: 30, flu: 80, flk: -130, blu: 40, blk: -120, fu: 10, fe: 20, bu: 20, be: 30 }), P({ hd: 8, tor: 14, flu: 50, flk: -80, blu: 10, blk: -60, fu: 40, fe: 80, bu: 30, be: 90 })],
  dizzy: [P({ tor: -8, hed: 14, fu: 8, fe: 12, bu: -6, be: 10, flu: 8, blu: -8 }), P({ tor: -2, hed: 6, fu: 4, fe: 8, bu: -2, be: 8, hd: 1 }), P({ tor: 4, hed: -10, fu: 0, fe: 6, bu: 2, be: 12 }), P({ tor: -2, hed: 4, fu: 4, fe: 8, bu: -2, be: 8, hd: 1 })],
  parry: P({ tor: 2, hed: 2, fu: 78, fe: 78, bu: 40, be: 120, flu: 24, flk: -26, blu: -22, blk: 12, hd: 3 }),
  parryOk: P({ tor: -6, hed: -4, fu: 120, fe: 30, bu: -40, be: 40, flu: 26, flk: -20, blu: -24, blk: 10, hd: 2 }),
  win: [P({ fu: 175, fe: 0, bu: 20, be: 90, tor: -4, hed: -10 }), P({ fu: 170, fe: 10, bu: 25, be: 95, tor: -2, hed: -8, hd: 1 })],
};

// attack anims: s = startup key, a = active keys (cycled for multi-hit), r = recovery
const A = {
  jab: { s: P({ fu: 40, fe: 110, tor: 4 }), a: [P({ fu: 92, fe: 0, tor: 12, hed: -2, flu: 24, flk: -20 })], r: P({ fu: 70, fe: 50, tor: 8 }) },
  cross: { s: P({ bu: 30, be: 110, tor: 0 }), a: [P({ bu: 94, be: 0, tor: 20, fu: 30, fe: 110, flu: 28, flk: -24, blu: -24 })], r: P({ bu: 60, be: 60, tor: 10 }) },
  hook: { s: P({ fu: -20, fe: 100, tor: -8, hed: 2 }), a: [P({ fu: 96, fe: 40, tor: 24, flu: 30, flk: -30, blu: -26, blk: 14 })], r: P({ fu: 60, fe: 70, tor: 14 }) },
  uppercut: { s: P({ hd: 8, tor: 18, fu: 20, fe: 120, flu: 40, flk: -60 }), a: [P({ hd: -6, tor: -10, hed: -14, fu: 172, fe: 6, bu: 10, be: 40, flu: 10, flk: -4, blu: -8, blk: 0 })], r: P({ tor: -4, fu: 140, fe: 30 }) },
  shoulder: { s: P({ tor: 20, hd: 6, fu: 20, fe: 80, bu: 10, be: 90 }), a: [P({ tor: 38, hed: -10, fu: 25, fe: 50, bu: -20, be: 60, flu: 50, flk: -40, blu: -40, blk: 20, hd: 6 }), P({ tor: 38, hed: -10, fu: 25, fe: 50, bu: -20, be: 60, flu: 20, flk: -60, blu: -10, blk: 0, hd: 5 })], r: P({ tor: 14, fu: 40, fe: 80 }) },
  cast: { s: P({ tor: -4, fu: 60, fe: 120, bu: 50, be: 130, hed: -4 }), a: [P({ tor: -6, fu: 118, fe: 20, bu: 108, be: 30, hed: -6 })], r: P({ fu: 90, fe: 50, bu: 80, be: 60 }) },
  cast2: { s: P({ tor: -2, hd: 4, fu: 30, fe: 40, bu: 20, be: 40 }), a: [P({ tor: -10, hed: -14, fu: 170, fe: 6, bu: 160, be: 10, hd: -2 })], r: P({ fu: 140, fe: 30, bu: 130, be: 40 }) },
  kick: { s: P({ flu: 70, flk: -115, tor: -6, fu: 60, fe: 80 }), a: [P({ flu: 92, flk: 0, tor: -22, hed: 6, fu: 20, fe: 60, bu: -20, be: 60, blu: -10, blk: 4 })], r: P({ flu: 50, flk: -70, tor: -8 }) },
  highkick: { s: P({ flu: 80, flk: -120, tor: -10 }), a: [P({ flu: 124, flk: 0, tor: -34, hed: 10, fu: 0, fe: 50, bu: -30, be: 50, blu: -6, blk: 4 })], r: P({ flu: 60, flk: -80, tor: -10 }) },
  lowkick: { s: P({ flu: 50, flk: -90, tor: 0 }), a: [P({ flu: 66, flk: 0, tor: -12, hed: 4, fu: 50, fe: 90 })], r: P({ flu: 30, flk: -50 }) },
  knee: { s: P({ flu: 50, flk: -90 }), a: [P({ flu: 98, flk: -125, tor: -6, fu: 60, fe: 110, bu: 50, be: 110 })], r: P({ flu: 40, flk: -60 }) },
  sweep: { s: P({ hd: 16, tor: 26, flu: 70, flk: -120, blu: 30, blk: -115 }), a: [P({ hd: 20, tor: 34, flu: 86, flk: 0, blu: 30, blk: -120, fu: 30, fe: 40, bu: 10, be: 40 })], r: P({ hd: 16, tor: 26, flu: 70, flk: -110, blu: 30, blk: -115 }) },
  airkick: { s: P({ flu: 60, flk: -100, blu: 10, blk: -100 }), a: [P({ flu: 70, flk: 0, blu: 10, blk: -110, tor: -14, fu: 30, fe: 60 })], r: P({ flu: 40, flk: -60, blu: 0, blk: -60 }) },
  airknee: { s: P({ flu: 60, flk: -100 }), a: [P({ flu: 92, flk: -130, blu: -10, blk: -40, tor: -4, fu: 60, fe: 100 })], r: P({ flu: 40, flk: -70 }) },
  airslash: { s: P({ fu: 160, fe: 10, flu: 50, flk: -90, blu: 20, blk: -90 }), a: [P({ fu: 60, fe: 0, tor: 16, flu: 40, flk: -80, blu: 10, blk: -80 })], r: P({ fu: 40, fe: 40, flu: 40, flk: -70 }) },
  airbat: { s: P({ fu: 160, fe: 10, bu: 150, be: 10, pa: 0 }), a: [P({ fu: 60, fe: 0, bu: 55, be: 0, tor: 18 })], r: P({ fu: 40, fe: 40, bu: 40, be: 40 }) },
  airpalm: { s: P({ fu: 150, fe: 20 }), a: [P({ fu: 40, fe: 0, tor: 20, flu: 40, flk: -60 })], r: P({ fu: 50, fe: 50 }) },
  throw: { s: P({ fu: -50, fe: 70, tor: -10, hed: 4 }), a: [P({ fu: 96, fe: 0, tor: 18, flu: 30, flk: -30, blu: -24, blk: 10 })], r: P({ fu: 80, fe: 20, tor: 10 }) },
  backhand: { s: P({ fu: 40, fe: 150, tor: 10 }), a: [P({ fu: 84, fe: -6, tor: -4, flu: 24, flk: -20 })], r: P({ fu: 70, fe: 30 }) },
  spin: { s: P({ fu: 10, fe: 90, bu: 10, be: 90, tor: 0 }), a: [P({ fu: 92, fe: 0, bu: -92, be: 0, tor: 4, flu: 24, flk: -16 }), P({ fu: -92, fe: 0, bu: 92, be: 0, tor: 4, flu: 20, flk: -20 })], r: P({ fu: 60, fe: 60, bu: 20, be: 80 }) },
  dashcatch: { s: P({ fu: -40, fe: 60, tor: 10 }), a: [P({ tor: 32, hed: -10, fu: 92, fe: 0, bu: -40, be: 40, flu: 50, flk: -40, blu: -40, blk: 30, hd: 5 }), P({ tor: 10, fu: -92, fe: 0, bu: 92, be: 0, flu: 30, flk: -20, blu: -30, blk: 10 })], r: P({ fu: 60, fe: 40, tor: 6 }) },
  slashA: { s: P({ fu: 150, fe: 20, tor: -4 }), a: [P({ fu: 62, fe: 0, tor: 18, flu: 26, flk: -24 })], r: P({ fu: 40, fe: 40, tor: 10 }) },
  slashB: { s: P({ bu: 10, be: 10, fu: 20, fe: 10 }), a: [P({ bu: 120, be: 0, fu: 30, fe: 90, tor: 16 })], r: P({ bu: 60, be: 50 }) },
  slashUp: { s: P({ hd: 6, fu: 10, fe: 20, tor: 16 }), a: [P({ fu: 168, fe: 0, tor: -10, hed: -10, hd: -4, flu: 8 })], r: P({ fu: 120, fe: 30 }) },
  xslash: { s: P({ fu: 150, fe: 10, bu: 140, be: 10 }), a: [P({ fu: 50, fe: 0, bu: 140, be: 0, tor: 16 }), P({ fu: 140, fe: 0, bu: 50, be: 0, tor: 16 })], r: P({ fu: 60, fe: 40, bu: 50, be: 40 }) },
  dashslash: { s: P({ tor: 20, hd: 8, fu: -40, fe: 30, bu: -50, be: 20 }), a: [P({ tor: 40, hed: -10, hd: 8, fu: 100, fe: 0, bu: -60, be: 10, flu: 60, flk: -40, blu: -50, blk: 30 })], r: P({ tor: 20, fu: 60, fe: 30 }) },
  finisher: { s: P({ hd: 10, tor: 28, fu: -60, fe: 40, bu: -70, be: 40, flu: 40, flk: -60 }), a: [P({ tor: 30, hed: -6, fu: 100, fe: 0, bu: 96, be: 0, flu: 40, flk: -40, blu: -40, blk: 20, hd: 4 })], r: P({ tor: 14, fu: 60, fe: 40, bu: 60, be: 40 }) },
  batpoke: { s: P({ fu: 40, fe: 60, bu: 35, be: 70, pa: 0 }), a: [P({ fu: 88, fe: 4, bu: 84, be: 8, tor: 16, flu: 26, flk: -24 })], r: P({ fu: 60, fe: 40, bu: 55, be: 40 }) },
  batswing: { s: P({ fu: -40, fe: 70, bu: -50, be: 70, tor: -14, hed: 4 }), a: [P({ fu: 96, fe: 0, bu: 90, be: 4, tor: 24, flu: 30, flk: -30, blu: -26, blk: 12 })], r: P({ fu: 130, fe: 20, bu: 120, be: 20, tor: 16 }) },
  batover: { s: P({ fu: 170, fe: 10, bu: 165, be: 10, tor: -10, hed: -6 }), a: [P({ fu: 70, fe: 0, bu: 66, be: 4, tor: 26, hd: 4, flu: 34, flk: -40 })], r: P({ fu: 40, fe: 30, bu: 40, be: 30, tor: 18 }) },
  batterup: { s: P({ fu: 20, fe: 140, bu: 14, be: 150, tor: -6, flu: 22, flk: -26, hd: 3 }), a: [P({ fu: 84, fe: 10, bu: 80, be: 14, tor: 20, flu: 30, flk: -30 })], r: P({ fu: 60, fe: 40, bu: 55, be: 50 }) },
  homerun: { s: P({ fu: -70, fe: 50, bu: -80, be: 50, tor: -20, hed: 8, hd: 4, flu: 30, flk: -40 }), a: [P({ fu: 104, fe: 0, bu: 98, be: 0, tor: 30, flu: 40, flk: -40, blu: -36, blk: 20 })], r: P({ fu: 150, fe: 10, bu: 140, be: 10, tor: 10 }) },
  palm: { s: P({ fu: 40, fe: 110 }), a: [P({ fu: 90, fe: 0, tor: 14, flu: 24, flk: -22 })], r: P({ fu: 70, fe: 40 }) },
  palm2: { s: P({ bu: 30, be: 110 }), a: [P({ bu: 92, be: 0, tor: 16, flu: 26, flk: -24 })], r: P({ bu: 60, be: 40 }) },
  push: { s: P({ fu: 30, fe: 120, bu: 30, be: 120, tor: -6 }), a: [P({ fu: 90, fe: 0, bu: 88, be: 0, tor: 20, flu: 30, flk: -30, blu: -26, blk: 12 })], r: P({ fu: 70, fe: 40, bu: 70, be: 40 }) },
  slam: { s: P({ hd: -6, tor: -8, fu: 170, fe: 0, bu: 165, be: 0, hed: -10 }), a: [P({ hd: 14, tor: 40, hed: 10, fu: 40, fe: 0, bu: 36, be: 0, flu: 60, flk: -100, blu: 20, blk: -90 })], r: P({ hd: 8, tor: 24, fu: 50, fe: 40, bu: 50, be: 40 }) },
  flick: { s: P({ fu: 60, fe: 100, tor: 0 }), a: [P({ fu: 100, fe: 10, tor: 12 })], r: P({ fu: 70, fe: 50 }) },
  exhale: { s: P({ hed: -16, fu: 30, fe: 140, tor: -6 }), a: [P({ hed: -6, fu: 60, fe: 90, tor: 10 })], r: P({ fu: 45, fe: 100 }) },
  volley: { s: P({ fu: 60, fe: 100 }), a: [P({ fu: 100, fe: 10, tor: 12 }), P({ bu: 100, be: 10, tor: 14, fu: 50, fe: 100 })], r: P({ fu: 70, fe: 50 }) },
  elbow: { s: P({ fu: 60, fe: 150 }), a: [P({ fu: 100, fe: 150, tor: 22, flu: 28, flk: -26 })], r: P({ fu: 60, fe: 110 }) },
  barrage: { s: P({ flu: 60, flk: -100, tor: -8, fu: 60, fe: 90 }), a: [P({ flu: 90, flk: 0, tor: -24, fu: 20, fe: 60, bu: -20, be: 60 }), P({ flu: 110, flk: -20, tor: -28, fu: 30, fe: 60, bu: -10, be: 60 }), P({ flu: 70, flk: -10, tor: -18, fu: 20, fe: 70, bu: -20, be: 70 })], r: P({ flu: 40, flk: -60 }) },
  stomp: { s: P({ hd: 12, tor: 20, flu: 60, flk: -110, blu: 30, blk: -110 }), a: [P({ tor: -4, flu: 4, flk: 0, blu: 50, blk: -100, fu: 120, fe: 20, bu: 110, be: 20, hed: 8 }), P({ hd: 10, tor: 10, flu: 30, flk: -40, blu: -10, blk: -40, fu: 60, fe: 60 })], r: P({ hd: 8, tor: 10, flu: 40, flk: -70, blu: 10, blk: -60 }), air: P({ flu: 90, flk: -120, blu: 60, blk: -120, tor: 6, fu: 130, fe: 20, bu: 120, be: 20 }) },
  dropkick: { s: P({ hd: 8, tor: 10, flu: 60, flk: -110, blu: 40, blk: -110, fu: 60, fe: 90 }), a: [P({ hy: -32, tor: -82, hed: 20, flu: 92, flk: 0, blu: 88, blk: 0, fu: -120, fe: 20, bu: -140, be: 20 })], r: P({ hd: 10, tor: 20, flu: 50, flk: -90, blu: 20, blk: -80 }) },
  tppunch: { s: P({ hd: 10, tor: 20, fu: 30, fe: 120 }), a: [P({ fu: 94, fe: 0, tor: 16, flu: 26, flk: -24 })], r: P({ fu: 70, fe: 40 }) },
  fusion: { s: P({ hd: 10, tor: 20, flu: 60, flk: -110, blu: 40, blk: -110 }), a: [P({ hy: -32, tor: -82, hed: 20, flu: 92, flk: 0, blu: 88, blk: 0, fu: -120, fe: 20, bu: -140, be: 20 })], r: P({ hd: 10, tor: 20, flu: 50, flk: -90 }) },
};

// ---------- pose selection ----------
export function poseFor(f, S) {
  const t = f.anim;
  switch (f.st) {
    case "walk": {
      const back = Math.sign(f.vx) !== f.face;
      const i = Math.floor(t / 6) % 6;
      return WALK[back ? 5 - i : i];
    }
    case "dash": return POSES.dash[Math.floor(f.t / 4) % 2];
    case "bdash": return POSES.bdash[Math.floor(f.t / 5) % 2];
    case "jump": return f.vy < 0 ? POSES.jumpUp : POSES.jumpDown;
    case "crouch": return POSES.crouch;
    case "block": return f.crouch ? POSES.cblock : POSES.block;
    case "hit": return POSES.hit[f.stun > 8 ? 0 : 1];
    case "stagger": return POSES.stagger[Math.floor(t / 8) % 2];
    case "air": return POSES.air[f.vy < 0 ? 0 : 1];
    case "down": return POSES.down;
    case "wake": return POSES.wake[f.t < 7 ? 0 : 1];
    case "dizzy": return POSES.dizzy[Math.floor(t / 10) % 4];
    case "parry": return f.act && f.act.parried ? POSES.parryOk : POSES.parry;
    case "win": return POSES.win[Math.floor(t / 18) % 2];
    case "act": {
      const m = getMove(f.act.ref), an = A[m.anim] || A.jab;
      const at = f.act.t;
      if (an.air && f.y < -6 && at <= m.startup) return an.air;
      if (at <= m.startup) {
        const k = at / Math.max(1, m.startup);
        return k < 0.45 ? lerpPose(IDLE[0], an.s, 0.55) : an.s;
      }
      if (at <= m.startup + m.active) {
        const n = an.a.length;
        const idx = m.maxHits ? f.act.hits % n : Math.floor((at - m.startup - 1) / 4) % n;
        return an.a[idx];
      }
      const k = (at - m.startup - m.active) / Math.max(1, m.recovery);
      return k < 0.5 ? an.r : lerpPose(an.r, IDLE[0], 0.5);
    }
    default: return IDLE[Math.floor(t / 12) % 4];
  }
}

// ---------- skeleton ----------
const L = { hip: 36, torso: 23, neck: 3, head: 7, ua: 12, fa: 12, th: 18, sh: 18 };
const D2R = Math.PI / 180;
function limbDir(a, face) { return [Math.sin(a * D2R) * face, Math.cos(a * D2R)]; }

export function skeleton(pose, face, scale = 1) {
  const s = scale;
  const tor = pose.tor * D2R;
  const legs = (u, k) => {
    const d1 = limbDir(u, face), d2 = limbDir(u + k, face);
    return [d1, d2];
  };
  const [bl1, bl2] = legs(pose.blu, pose.blk), [fl1, fl2] = legs(pose.flu, pose.flk);
  let hipX = pose.hx * face, hipY;
  if (pose.hy != null) hipY = pose.hy;
  else {
    // auto-ground: lowest foot rests on y=0
    const bf = (bl1[1] * L.th + bl2[1] * L.sh) * s, ff = (fl1[1] * L.th + fl2[1] * L.sh) * s;
    hipY = -Math.max(bf, ff) + pose.hd * 0.15;
    hipY += 0;
  }
  const H = [hipX, hipY];
  const S = [H[0] + Math.sin(tor) * face * L.torso * s, H[1] - Math.cos(tor) * L.torso * s];
  const hd = (pose.tor + pose.hed) * D2R;
  const Hd = [S[0] + Math.sin(hd) * face * (L.neck + L.head) * s, S[1] - Math.cos(hd) * (L.neck + L.head) * s];
  const arm = (u, e) => {
    const d1 = limbDir(u, face), d2 = limbDir(u + e, face);
    const E = [S[0] + d1[0] * L.ua * s, S[1] + d1[1] * L.ua * s];
    const W = [E[0] + d2[0] * L.fa * s, E[1] + d2[1] * L.fa * s];
    return [E, W, d2];
  };
  const leg = (d1, d2) => {
    const K = [H[0] + d1[0] * L.th * s, H[1] + d1[1] * L.th * s];
    const F = [K[0] + d2[0] * L.sh * s, K[1] + d2[1] * L.sh * s];
    return [K, F, d2];
  };
  return { H, S, Hd, tor, hd, bArm: arm(pose.bu, pose.be), fArm: arm(pose.fu, pose.fe), bLeg: leg(bl1, bl2), fLeg: leg(fl1, fl2) };
}

// ---------- drawing ----------
function partPair(ctx, x1, y1, x2, y2, r1, r2, col, out = OUT) {
  capsule(ctx, x1, y1, x2, y2, r1 + 1, r2 + 1, out);
  capsule(ctx, x1, y1, x2, y2, r1, r2, col);
}

export function drawFighter(ctx, f, ox, oy, opts = {}) {
  const c = CHARS[f.ch], lk = c.look, face = f.face;
  const pose = opts.pose || poseFor(f, opts.S);
  const sk = skeleton(pose, face, c.scale);
  const X = (p) => ox + f.x + p[0], Y = (p) => oy + f.y + p[1];
  const white = opts.flash;
  const col = (hex, k = 1) => (white ? "#ffffff" : k === 1 ? hex : shade(hex, k));
  let top = lk.top, top2 = lk.top2;
  if (c.id === "dapsay") { if (f.stance === "apsay") { top = "#6b3fc4"; top2 = "#d63848"; } else { top = "#d63848"; top2 = "#6b3fc4"; } }
  const skin = lk.skin, shoes = lk.shoes === "barefoot" ? lk.skin : lk.shoes;
  const bw = lk.bodyW;

  // --- back arm ---
  const [bE, bW, bD] = sk.bArm;
  partPair(ctx, X(sk.S), Y(sk.S) + 2, X(bE), Y(bE), 3, 3, col(top, 0.7));
  partPair(ctx, X(bE), Y(bE), X(bW), Y(bW), 3, 2, col(skin, 0.78));
  disc(ctx, X(bW), Y(bW), 2, col(skin, 0.78));
  drawProp(ctx, f, lk, bW, bD, X, Y, true, pose, white);

  // --- back leg ---
  const [bK, bF, bLD] = sk.bLeg;
  partPair(ctx, X(sk.H), Y(sk.H), X(bK), Y(bK), 4, 3, col(lk.bottom, 0.72));
  partPair(ctx, X(bK), Y(bK), X(bF), Y(bF), 3, 3, col(lk.bottom, 0.72));
  foot(ctx, X(bF), Y(bF), face, bLD, col(shoes, 0.75));

  // --- torso ---
  const tx1 = X(sk.H), ty1 = Y(sk.H) - 2, tx2 = X(sk.S), ty2 = Y(sk.S) + 2;
  capsule(ctx, tx1, ty1, tx2, ty2, bw - 1 + 1, bw + 1, OUT);
  capsule(ctx, tx1, ty1, tx2, ty2, bw - 1, bw, col(top));
  // shirt detail stripe / logo
  const mx = (tx1 + tx2) / 2, my = (ty1 + ty2) / 2;
  capsule(ctx, tx1 + (tx2 - tx1) * 0.25, ty1 + (ty2 - ty1) * 0.25, tx2, ty2, 2, 3, col(top2));
  disc(ctx, mx - face * (bw - 3), my, 1, col(top, 1.3));
  // belt / hips
  disc(ctx, tx1, ty1 + 1, bw - 2, col(lk.bottom));
  ctx.fillStyle = col(lk.accent); ctx.fillRect(Math.round(tx1 - bw + 2), Math.round(ty1 - 3), bw * 2 - 3, 2);

  // --- front leg ---
  const [fK, fF, fLD] = sk.fLeg;
  partPair(ctx, X(sk.H), Y(sk.H), X(fK), Y(fK), 4, 3, col(lk.bottom));
  partPair(ctx, X(fK), Y(fK), X(fF), Y(fF), 3, 3, col(lk.bottom));
  foot(ctx, X(fF), Y(fF), face, fLD, col(shoes));

  // --- head ---
  drawHead(ctx, X(sk.Hd), Y(sk.Hd), face, sk.hd, lk, c, f, white);

  // --- front arm ---
  const [fE, fW, fD] = sk.fArm;
  partPair(ctx, X(sk.S), Y(sk.S) + 2, X(fE), Y(fE), 3, 3, col(top));
  ctx.fillStyle = col(top2); ctx.fillRect(Math.round(X(fE)) - 1, Math.round(Y(fE)) - 1, 2, 2);
  partPair(ctx, X(fE), Y(fE), X(fW), Y(fW), 3, 2, col(skin));
  disc(ctx, X(fW), Y(fW), 2 + (pose === POSES.parry ? 0 : 0), col(skin, 1.08));
  drawProp(ctx, f, lk, fW, fD, X, Y, false, pose, white);

  return { hand: [X(fW), Y(fW)], foot: [X(fF), Y(fF)], head: [X(sk.Hd), Y(sk.Hd)], chest: [mx, my] };
}

function foot(ctx, x, y, face, d, colr) {
  // small boot pointing forward along ground
  const fx = x + face * 3, fy = y + 1;
  ctx.fillStyle = OUT;
  ctx.fillRect(Math.round(Math.min(x, fx) - 3), Math.round(fy - 3), 9, 5);
  ctx.fillStyle = colr;
  ctx.fillRect(Math.round(Math.min(x, fx) - 2), Math.round(fy - 2), 7, 3);
}

function drawHead(ctx, x, y, face, ang, lk, c, f, white) {
  const hc = white ? "#fff" : lk.hair, sk = white ? "#fff" : lk.skin;
  x = Math.round(x); y = Math.round(y);
  disc(ctx, x, y, 8, OUT);
  // hair back layers
  const st = lk.hairStyle;
  if (st === "long") { capsule(ctx, x - face * 3, y, x - face * 6, y + 12, 5, 3, OUT); capsule(ctx, x - face * 3, y, x - face * 6, y + 12, 4, 2, hc); }
  if (st === "pony") { const sw = Math.sin(f.anim * 0.15) * 2; capsule(ctx, x - face * 6, y - 3, x - face * (12 + sw), y + 6, 3, 2, OUT); capsule(ctx, x - face * 6, y - 3, x - face * (12 + sw), y + 6, 2, 1, hc); }
  if (st === "bun") { disc(ctx, x - face * 4, y - 8, 4, OUT); disc(ctx, x - face * 4, y - 8, 3, hc); ctx.fillStyle = white ? "#fff" : lk.accent; ctx.fillRect(x - face * 4 - 1, y - 6, 3, 1); }
  disc(ctx, x, y, 7, sk);
  // jaw shade
  ctx.fillStyle = white ? "#fff" : shade(lk.skin, 0.82);
  ctx.fillRect(x - face * 5 - (face < 0 ? 1 : 0), y + 2, 2, 3);
  // hair top
  ctx.fillStyle = hc;
  const fl = (dx, dy, w, h) => ctx.fillRect(face === 1 ? x + dx : x - dx - w + 1, y + dy, w, h);
  switch (st) {
    case "spike": fl(-7, -8, 13, 5); fl(-8, -4, 4, 6); fl(-3, -11, 3, 3); fl(1, -12, 3, 4); fl(-7, -10, 3, 3); fl(5, -9, 2, 2); break;
    case "cap": ctx.fillStyle = white ? "#fff" : lk.top; fl(-7, -9, 14, 5); fl(3, -5, 8, 2); ctx.fillStyle = hc; fl(-8, -4, 3, 5); break;
    case "long": fl(-7, -8, 14, 5); fl(-8, -4, 4, 10); fl(4, -6, 3, 3); break;
    case "pony": fl(-7, -8, 14, 4); fl(-8, -4, 3, 5); ctx.fillStyle = white ? "#fff" : lk.accent; fl(-9, -4, 2, 2); break;
    case "bun": fl(-7, -8, 14, 4); fl(-8, -5, 3, 6); fl(3, -6, 4, 2); break;
    case "neat": fl(-7, -8, 14, 4); fl(-8, -5, 3, 5); fl(0, -9, 6, 2); break;
    case "messy": fl(-7, -9, 14, 5); fl(-8, -5, 4, 6); fl(2, -10, 2, 2); fl(-4, -11, 2, 2); fl(5, -6, 2, 2); break;
    case "buzz": fl(-7, -7, 14, 3); fl(-7, -5, 2, 4); break;
  }
  // eye + brow + mouth
  const ex = face === 1 ? x + 3 : x - 4;
  const dizzy = f.st === "dizzy", hurt = f.st === "hit" || f.st === "air" || f.st === "stagger" || f.st === "down";
  ctx.fillStyle = white ? "#fff" : OUT;
  if (dizzy) { ctx.fillRect(ex - 1, y - 2, 1, 1); ctx.fillRect(ex + 1, y - 2, 1, 1); ctx.fillRect(ex, y - 1, 1, 1); ctx.fillRect(ex - 1, y, 1, 1); ctx.fillRect(ex + 1, y, 1, 1); }
  else if (hurt) { ctx.fillRect(ex - 1, y - 1, 3, 1); }
  else { ctx.fillRect(ex, y - 2, 2, 3); ctx.fillStyle = white ? "#fff" : "#ffffff"; ctx.fillRect(ex + (face === 1 ? 1 : 0), y - 2, 1, 1); }
  ctx.fillStyle = white ? "#fff" : OUT; ctx.fillRect(ex - (face === 1 ? 1 : 0), y - 4, 3, 1);
  ctx.fillStyle = white ? "#fff" : shade(lk.skin, 0.55); ctx.fillRect(face === 1 ? x + 2 : x - 4, y + 4, 3, 1);
  if (lk.prop === "glasses") { ctx.fillStyle = white ? "#fff" : "#e9f0ff"; ctx.fillRect(ex - 2, y - 3, 5, 1); ctx.fillRect(ex - 2, y - 3, 1, 3); ctx.fillRect(ex + 2, y - 3, 1, 3); ctx.fillRect(ex - 2, y, 5, 1); }
  if (lk.prop === "cig" && f.st !== "down") {
    ctx.fillStyle = "#f2f2f2"; ctx.fillRect(face === 1 ? x + 5 : x - 8, y + 4, 4, 1);
    ctx.fillStyle = (f.anim >> 3) & 1 ? "#ff7a29" : "#ffd27a"; ctx.fillRect(face === 1 ? x + 9 : x - 9, y + 4, 1, 1);
  }
}

function drawProp(ctx, f, lk, W, d, X, Y, isBack, pose, white) {
  const x = X(W), y = Y(W);
  if (lk.prop === "bat" && !isBack) {
    // bat extends from front hand along forearm direction
    const len = 24, ax = d[0], ay = d[1];
    const ex = x + ax * len, ey = y + ay * len;
    capsule(ctx, x, y, ex, ey, 2, 3, OUT);
    capsule(ctx, x, y, ex, ey, 1, 2, white ? "#fff" : "#c98a4b");
    disc(ctx, ex, ey, 2, white ? "#fff" : "#e0a868");
    ctx.fillStyle = white ? "#fff" : "#3a2414"; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
  } else if (lk.prop === "blades") {
    const ax = d[0], ay = d[1];
    const ex = x + ax * 9, ey = y + ay * 9;
    capsule(ctx, x, y, ex, ey, 1, 1, OUT);
    capsule(ctx, x, y, ex, ey, 0, 0, white ? "#fff" : isBack ? "#9aa3b5" : "#dfe6f5");
    ctx.fillStyle = white ? "#fff" : "#ff3355"; ctx.fillRect(Math.round(ex), Math.round(ey), 1, 1);
  } else if (lk.prop === "disc" && !isBack && !f._discOut) {
    ctx.fillStyle = OUT; ctx.fillRect(Math.round(x) - 5, Math.round(y) - 2, 11, 4);
    ctx.fillStyle = white ? "#fff" : lk.accent; ctx.fillRect(Math.round(x) - 4, Math.round(y) - 1, 9, 2);
    ctx.fillStyle = white ? "#fff" : "#ff4f6d"; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 1);
  }
}

// silhouette used for afterimages / select screen shadows
export function drawGhost(ctx, f, ox, oy, colr, pose) {
  const c = CHARS[f.ch];
  const sk = skeleton(pose || poseFor(f), f.face, c.scale);
  const X = (p) => ox + f.x + p[0], Y = (p) => oy + f.y + p[1];
  capsule(ctx, X(sk.H), Y(sk.H), X(sk.S), Y(sk.S), 6, 7, colr);
  disc(ctx, X(sk.Hd), Y(sk.Hd), 7, colr);
  for (const [E, W] of [sk.bArm, sk.fArm]) { capsule(ctx, X(sk.S), Y(sk.S), X(E), Y(E), 3, 3, colr); capsule(ctx, X(E), Y(E), X(W), Y(W), 2, 2, colr); }
  for (const [K, F] of [sk.bLeg, sk.fLeg]) { capsule(ctx, X(sk.H), Y(sk.H), X(K), Y(K), 4, 3, colr); capsule(ctx, X(K), Y(K), X(F), Y(F), 3, 3, colr); }
}

// portrait (head + shoulders) into a small canvas
export function drawPortrait(canvas, ch, flip = false) {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const f = { ch, x: 0, y: 0, face: flip ? -1 : 1, st: "idle", anim: 0, stance: "dap", sx: {} };
  const c = CHARS[ch];
  const pose = { ...BASE, fu: 30, fe: 60, bu: 20, be: 60 };
  ctx.save();
  const sc = canvas.width / 32;
  ctx.scale(sc, sc);
  drawFighter(ctx, f, flip ? 18 : 14, 82 + (c.scale - 1) * 70, { pose });
  ctx.restore();
}

export function drawFull(canvas, ch, anim = 0, flip = false) {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const f = { ch, x: 0, y: 0, face: flip ? -1 : 1, st: "idle", anim, stance: "dap", sx: {} };
  const sc = Math.floor(canvas.height / 96);
  ctx.save(); ctx.scale(sc, sc);
  drawFighter(ctx, f, canvas.width / sc / 2, canvas.height / sc - 6, {});
  ctx.restore();
}
