// Celestra Chronicles — deterministic fighting simulation.
// Pure state + inputs -> next state. No Math.sin/random/Date here so that both
// online peers compute bit-identical results (required for rollback netcode).
import { CHARS, getMove, PARRY, SMACK_TALK, PAULITE_JOKES, COMMON, STANCES } from "./chars.js";

export const VIEW_W = 480, VIEW_H = 270, STAGE_W = 768;
export const B = { L: 1, R: 2, U: 4, D: 8, A: 16, P: 32, S1: 64, S2: 128, S3: 256, DASH: 512, ST: 1024 };
const BTN = [["A", B.A], ["P", B.P], ["S1", B.S1], ["S2", B.S2], ["S3", B.S3], ["DASH", B.DASH], ["U", B.U], ["ST", B.ST]];
const BUF = 8; // input buffer frames
const GRAV = 0.34;
const MAX_SEP = VIEW_W - 56;
const ROUND_TIME = 99 * 60;
const INTRO_LEN = 120, KO_LEN = 170, TIMEUP_LEN = 130;

// ---------------- RNG (mulberry32, integer math only) ----------------
export function rnd(S) {
  let t = (S.rng = (S.rng + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function newFighter(ch, side) {
  const c = CHARS[ch];
  return {
    ch, side, x: STAGE_W / 2 + (side === 0 ? -70 : 70), y: 0, vx: 0, vy: 0, face: side === 0 ? 1 : -1,
    hp: c.hp, maxHp: c.hp, st: "intro", t: 0, act: null, stun: 0,
    cd: [0, 0, 0], buf: { A: 0, P: 0, S1: 0, S2: 0, S3: 0, DASH: 0, U: 0, ST: 0 }, pst: 0, dj: false, slamUsed: false, prev: 0,
    tapDir: 0, tapT: 0, chainNext: false, combo: 0, juggle: 0, inv: 0, kd: false,
    sx: { bleed: 0, bleedT: 0, burn: 0, burnT: 0, blind: 0, confuse: 0, slow: 0, rattled: 0, floaty: 0, momentum: 0, counter: 0, smoke: 0, silence: 0, sad: 0, poison: 0, poisonT: 0 },
    dizzy: 0, lastSkill: null, stance: "dap", passiveT: ch === "william" ? 240 : ch === "paulite" ? 720 : 600,
    armor: 0, flash: 0, sinceHit: 999, wallBounced: false, crouch: false, guard: false, anim: 0,
    stolen: null, talk: null, talkT: 0, wins: 0,
  };
}

export function newMatch({ chars, seed = 1, mode = "vs", stage = 0, rounds = 2 }) {
  const S = {
    frame: 0, rng: seed | 0, mode, stage, roundsToWin: rounds,
    phase: "intro", phaseT: 0, round: 1, timer: ROUND_TIME, hitstop: 0, slow: 0,
    shake: 0, flashT: 0, wins: [0, 0], winner: -1, matchWinner: -1, koBy: -1,
    p: [newFighter(chars[0], 0), newFighter(chars[1], 1)],
    projs: [], zones: [], nextId: 1,
  };
  return S;
}

function resetRound(S) {
  const chars = [S.p[0].ch, S.p[1].ch], pst = [S.p[0].pst, S.p[1].pst];
  S.p = [newFighter(chars[0], 0), newFighter(chars[1], 1)];
  S.p[0].pst = pst[0]; S.p[1].pst = pst[1];
  S.projs = []; S.zones = [];
  S.phase = "intro"; S.phaseT = 0; S.timer = ROUND_TIME; S.hitstop = 0; S.slow = 0; S.winner = -1; S.koBy = -1;
}

// ---------------- helpers ----------------
const sgn = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const grounded = (f) => f.y >= 0;

function hurtbox(f) {
  const c = CHARS[f.ch];
  if (f.st === "air") return [f.x - 16, f.y - 46, 32, 50];
  const h = f.crouch ? 44 : c.hurtH;
  return [f.x - 11, f.y - h, 22, h];
}
function worldBox(f, box) {
  const [bx, by, bw, bh] = box;
  const x0 = f.face === 1 ? f.x + bx : f.x - bx - bw;
  return [x0, f.y + by, bw, bh];
}
const overlap = (a, b) => a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1];

function canAct(f) {
  return f.st === "idle" || f.st === "walk" || f.st === "crouch" || (f.st === "parry" && f.act && f.act.parried);
}

export function basicRef(f, i) {
  const c = CHARS[f.ch];
  const list = c.basicByStance ? c.basicByStance[f.stance] : c.basic;
  return f.ch + ":" + list[i];
}

function emit(S, ev) { if (S._ev) S._ev.push(ev); }

function startMove(S, f, op, ref, opts = {}) {
  const m = getMove(ref);
  f.act = { ref, t: 0, hits: 0, last: -99, hit: false, parried: false, src: opts.src || null };
  f.st = "act"; f.t = 0; f.chainNext = false;
  if (m.skill && !opts.free) {
    f.cd[m.skill - 1] = m.cd;
    if (CHARS[f.ch].moves["s" + m.skill] === m) f.lastSkill = ref;
  }
  if (m.stance && f.ch === "dapsay") f.stance = m.stance;
  if (m.skill) emit(S, { type: "cast", who: f.side, ref, name: m.name, ult: !!m.ult, stolen: !!opts.free });
  else emit(S, { type: "swing", who: f.side, sfx: m.sfx, heavy: !!m.heavy });
}

// ---------------- hooks (character-specific behaviour) ----------------
const HOOKS = {
  javatar: {
    frame(S, f, op) {
      if (f.act.t === 14) {
        const oc = CHARS[op.ch];
        let ref = op.lastSkill;
        if (!ref || getMove(ref).ult) ref = op.ch + ":s1";
        const m = getMove(ref);
        if (m.hook === "javatar") { // mirror match: steal Brew Rush instead
          ref = op.ch + ":s1";
        }
        const slot = getMove(ref).skill - 1;
        op.cd[slot] = Math.max(op.cd[slot], 0) + 180;
        f.stolen = ref;
        emit(S, { type: "javatar", who: f.side, name: getMove(ref).name, from: oc.name });
        startMove(S, f, op, ref, { free: true, src: "javatar" });
        f.act.stolen = true;
      }
    },
  },
  teleport: {
    frame(S, f, op) {
      const m = getMove(f.act.ref);
      if (f.act.t === m.tpAt) {
        const fromX = f.x;
        const side = sgn(op.x - f.x) || f.face; // which side we were on relative to op
        const back = m.tpBack || 26;
        f.x = clamp(op.x + side * back, 12, STAGE_W - 12);
        f.face = sgn(op.x - f.x) || -side;
        f.y = 0; f.vy = 0;
        emit(S, { type: "teleport", who: f.side, from: fromX, to: f.x });
      }
    },
  },
  hemorrhage: {
    dmg(S, f, op, base) {
      const st = op.sx.bleed;
      return base + st * 45;
    },
    onHit(S, f, op) {
      const st = op.sx.bleed;
      if (st >= 4) { applyStun(S, op, 80); }
      emit(S, { type: "detonate", who: f.side, x: op.x, y: op.y - 40, stacks: st });
      op.sx.bleed = 0; op.sx.bleedT = 0;
    },
  },
  homerun: { onHit(S, f, op) { emit(S, { type: "homerun", who: f.side }); } },
  well: {
    frame(S, f, op) {
      if (f.act.t === 12) {
        S.zones.push({ id: S.nextId++, kind: "well", owner: f.side, x: clamp(f.x + f.face * 96, 20, STAGE_W - 20), y: -30, w: 180, t: 0, life: 56 });
        emit(S, { type: "zone", kind: "well", who: f.side });
      }
    },
  },
  antigrav: {
    frame(S, f, op) {
      if (f.act.t === 16) {
        S.zones.push({ id: S.nextId++, kind: "antigrav", owner: f.side, x: op.x, y: 0, w: 130, t: 0, life: 240 });
        emit(S, { type: "zone", kind: "antigrav", who: f.side });
        if (grounded(op) && op.st !== "down" && op.st !== "wake") {
          applyHit(S, f, op, getMove("william:agLift"), { zone: true, x: op.x, y: op.y - 30 });
        }
      }
    },
  },
  smoke: {
    frame(S, f, op) {
      if (f.act.t === 10) {
        S.zones.push({ id: S.nextId++, kind: "smoke", owner: f.side, x: f.x + f.face * 20, y: 0, w: 128, t: 0, life: 210 });
        emit(S, { type: "zone", kind: "smoke", who: f.side });
      }
    },
  },
  leap: {
    frame(S, f, op) {
      if (f.act.t === 4) { f.vy = -4.3; }
      if (f.act.t === 26) { S.shake = Math.max(S.shake, 8); emit(S, { type: "stomp", who: f.side, x: f.x, y: 0 }); }
    },
    onHit(S, f, op) { if (f.act && f.act.ref === "acar:s3") f.cd[0] = 0; },
  },
  slam: {
    frame(S, f, op) {
      const a = f.act;
      if (a.t < 6) { f.vy = -0.4; f.vx *= 0.8; }
      if (a.t === 6) { f.vy = 7.4; f.vx = f.face * 0.8; }
      if (a.t > 6 && !a.landed && grounded(f)) {
        a.landed = a.t; a.noBox = true; f.vx = 0;
        S.shake = Math.max(S.shake, 9);
        emit(S, { type: "stomp", who: f.side, x: f.x, y: 0 });
        emit(S, { type: "slam", who: f.side, x: f.x });
        if (!a.hit && Math.abs(op.x - f.x) < 62 && op.y > -14) applyHit(S, f, op, COMMON.slamWave, { zone: true, x: op.x, y: op.y - 10 });
      }
      if (a.landed && a.t >= a.landed + 16) { f.act = null; f.st = "idle"; }
    },
  },
  joke: {
    frame(S, f, op) {
      if (f.act.t === 10) tellJoke(S, f, op, 240, 200);
    },
  },
  quiz: {
    frame(S, f, op) {
      if (f.act.t === 18) {
        S.shake = Math.max(S.shake, 10);
        emit(S, { type: "stomp", who: f.side, x: f.x, y: 0 });
        emit(S, { type: "quiz", who: f.side, x: f.x });
        if (Math.abs(op.x - f.x) < 110 && op.y > -60) applyHit(S, f, op, getMove("jog:quizHit"), { zone: true, x: op.x, y: op.y - 40 });
      }
    },
  },
  stink: {
    frame(S, f, op) {
      if (f.act.t === 12) {
        S.zones.push({ id: S.nextId++, kind: "stink", owner: f.side, x: clamp(f.x + f.face * 40, 20, STAGE_W - 20), y: 0, w: 120, t: 0, life: 240 });
        emit(S, { type: "zone", kind: "smoke", who: f.side });
      }
    },
  },
};

function tellJoke(S, f, op, sad, range) {
  const line = Math.floor(rnd(S) * PAULITE_JOKES.length);
  f.talk = PAULITE_JOKES[line]; f.talkT = 150;
  emit(S, { type: "joke", who: f.side, line });
  if (Math.abs(op.x - f.x) < range) { op.sx.sad = Math.max(op.sx.sad, sad); emit(S, { type: "sad", who: op.side }); }
}

// ---------------- status ----------------
function applyStun(S, d, frames) {
  d.dizzy = Math.max(d.dizzy, frames);
  d.st = "dizzy"; d.act = null; d.t = 0; d.stun = 0;
  emit(S, { type: "stun", who: d.side, frames });
}

function dot(S, d, amount, kind) {
  if (d.hp <= 0 || S.phase !== "fight") return;
  d.hp -= amount;
  emit(S, { type: "dot", who: d.side, kind, amount });
  if (d.hp <= 0) { d.hp = 0; triggerKO(S, 1 - d.side, d, null); }
}

function addFx(S, d, fx) {
  if (!fx) return;
  if (fx.bleed) { d.sx.bleed = Math.min(6, d.sx.bleed + fx.bleed); d.sx.bleedT = 300; emit(S, { type: "bleed", who: d.side, stacks: d.sx.bleed }); }
  if (fx.burn && d.ch !== "jaguilar") { d.sx.burn = Math.min(3, d.sx.burn + fx.burn); d.sx.burnT = 210; }
  if (fx.blind && d.ch !== "jaguilar") d.sx.blind = Math.max(d.sx.blind, fx.blind);
  if (fx.silence) { d.sx.silence = Math.max(d.sx.silence, fx.silence); emit(S, { type: "silence", who: d.side }); }
  if (fx.sad) d.sx.sad = Math.max(d.sx.sad, fx.sad);
  if (fx.slow) d.sx.slow = Math.max(d.sx.slow, fx.slow);
  if (fx.poison) d.sx.poison = Math.max(d.sx.poison, fx.poison);
}

// ---------------- hits ----------------
function isHolding(f, raw, dirAway) { return (raw & dirAway) !== 0; }

function applyHit(S, a, d, m, opt = {}) {
  // returns "parry" | "block" | "hit" | "armor" | null
  if (d.hp <= 0) return null;
  if (d.inv > 0 || d.st === "down" || d.st === "wake" || d.st === "ko") return null;
  if (d.st === "air" && d.juggle >= 7) return null;
  if (opt.proj && d.ch === "apsay" && (d.st === "dash" || d.st === "bdash")) return null;
  if (opt.proj && d.act && getMove(d.act.ref).projInv) {
    const [p0, p1] = getMove(d.act.ref).projInv;
    if (d.act.t >= p0 && d.act.t <= p1) return null;
  }
  const hx = opt.x ?? (a.x + d.x) / 2, hy = opt.y ?? d.y - 44;

  // --- PARRY ---
  if (d.st === "parry" && d.act && !d.act.parried && d.act.t >= 1 && d.act.t <= PARRY.window + STANCES[d.pst].parry && !m.unblock) {
    d.act.parried = true; d.act.t = PARRY.window; // jump to success
    d.sx.counter = PARRY.counter; d.inv = 8;
    S.hitstop = Math.max(S.hitstop, 12); S.shake = Math.max(S.shake, 4);
    if (!opt.proj && !opt.zone) {
      a.act = null; a.st = "stagger"; a.stun = PARRY.stagger; a.vx = -a.face * 2.2; a.flash = 0;
    }
    emit(S, { type: "parry", who: d.side, x: hx, y: hy });
    return "parry";
  }

  // --- ARMOR ---
  if (d.armor > 0 && !m.unblock) {
    d.armor = 0;
    const dmg = Math.round(m.dmg * 0.5);
    d.hp -= dmg; d.flash = 6;
    S.hitstop = Math.max(S.hitstop, 6);
    emit(S, { type: "armor", who: d.side, x: hx, y: hy, dmg });
    if (d.hp <= 0) { d.hp = 1; }
    return "armor";
  }

  // --- BLOCK ---
  const away = a.x < d.x ? B.R : B.L;
  const canGuard = grounded(d) && (d.st === "idle" || d.st === "walk" || d.st === "crouch" || d.st === "block") && (d.prev & away);
  if (canGuard && !m.unblock) {
    const crouching = (d.prev & B.D) !== 0;
    const blocks = crouching ? m.lvl === "L" || m.lvl === "H" : m.lvl !== "L";
    if (blocks) {
      d.st = "block"; d.stun = m.bs || 10; d.crouch = crouching; d.act = null;
      d.vx = sgn(d.x - a.x) * (Math.abs(m.kb[0]) * 0.6 + 1.2);
      if ((m.skill || opt.proj) && d.pst !== 2) { const chip = Math.round(m.dmg * 0.1); d.hp = Math.max(1, d.hp - chip); }
      S.hitstop = Math.max(S.hitstop, 3);
      emit(S, { type: "block", who: d.side, x: hx, y: hy, heavy: !!m.heavy });
      return "block";
    }
  }

  // --- HIT ---
  let base = m.dmg;
  if (!opt.proj && !opt.zone && a.act && HOOKS[getMove(a.act.ref).hook]?.dmg) base = HOOKS[getMove(a.act.ref).hook].dmg(S, a, d, base);
  let mult = Math.max(0.35, 1 - 0.1 * d.combo);
  mult *= 1 + 0.04 * a.sx.momentum;
  if (a.sx.rattled > 0) mult *= 0.85;
  if (a.sx.blind > 0) mult *= 0.7;
  let counter = false;
  if (a.sx.counter > 0) { mult *= 1.25; a.sx.counter = 0; counter = true; }
  if (a.ch === "dapsay" && (d.st === "dizzy" || d.dizzy > 0)) mult *= 1.3;
  if (a.sx.sad > 0) mult *= 0.8;
  mult *= STANCES[a.pst].dmg * STANCES[d.pst].taken;
  if (d.ch === "dap") mult *= 0.9;
  if (a.ch === "jog" && d.sx.silence > 0) mult *= 1.15;
  const dmg = Math.max(1, Math.round(base * mult));
  d.hp -= dmg; d.combo += 1; d.sinceHit = 0; d.flash = 5;
  d.act = null; d.chainNext = false; d.armor = 0;
  if (d.ch === "jiross") d.sx.momentum = Math.max(0, d.sx.momentum - 2);
  if (a.ch === "jiross") a.sx.momentum = Math.min(5, a.sx.momentum + 1);
  addFx(S, d, m.fx);

  const dirX = opt.proj ? sgn(opt.vx) || a.face : sgn(d.x - a.x) || a.face;
  const isLast = a.act && m.maxHits && a.act.hits + 1 >= m.maxHits;
  const kb = isLast && m.finalKb ? m.finalKb : m.kb;
  const airborne = !grounded(d) || d.st === "air";
  const wasDizzy = d.st === "dizzy";
  d.dizzy = 0;

  if (m.launch || airborne || kb[1] < -3 || (isLast && m.finalKb && m.finalKb[1] < -3)) {
    d.st = "air"; d.juggle += 1;
    d.vx = dirX * kb[0] * 0.8;
    d.vy = airborne ? Math.min(kb[1] * 0.7, -3.4 + d.juggle * 0.3) : kb[1];
    if (d.y >= 0) d.y = -1;
    d.kd = true;
  } else if (m.kd) {
    d.st = "air"; d.vx = dirX * kb[0]; d.vy = kb[1] || -2.5; d.y = -1; d.kd = true; d.juggle += 1;
  } else {
    d.st = "hit"; d.stun = m.hs; d.vx = dirX * kb[0]; d.crouch = false;
  }
  d.wallBounced = false; d.wb = !!m.wallBounce;
  if (m.stun && d.hp > 0) applyStun(S, d, m.stun);

  S.hitstop = Math.max(S.hitstop, m.stop || 4);
  if (m.heavy) S.shake = Math.max(S.shake, 6);
  emit(S, { type: "hit", who: d.side, by: a.side, x: hx, y: hy, dmg, sfx: m.sfx, heavy: !!m.heavy, counter, combo: d.combo, proj: !!opt.proj, wasDizzy });
  if (counter) emit(S, { type: "counter", who: a.side });

  if (!opt.proj && !opt.zone && a.act) {
    const hk = HOOKS[getMove(a.act.ref).hook];
    if (hk && hk.onHit) hk.onHit(S, a, d);
  }
  if (d.hp <= 0) { d.hp = 0; triggerKO(S, a.side, d, m); }
  return "hit";
}

function triggerKO(S, by, d, m) {
  if (S.phase !== "fight") return;
  S.phase = "ko"; S.phaseT = 0; S.koBy = by;
  const other = S.p[1 - d.side];
  S.winner = other.hp > 0 ? other.side : -1;
  d.st = "air"; d.kd = true; d.vy = -5.2; d.vx = (sgn(d.x - other.x) || 1) * 3.2; if (d.y >= 0) d.y = -1;
  d.act = null; d.dizzy = 0;
  S.hitstop = 26; S.slow = 96; S.shake = 14; S.flashT = 10;
  S.projs = [];
  emit(S, { type: "ko", who: d.side, by, x: d.x, y: d.y - 40, perfect: other.hp === other.maxHp });
}

// ---------------- per-fighter update ----------------
function stepFighter(S, f, op, raw) {
  const c = CHARS[f.ch];
  if (f.sx.confuse > 0) { const l = raw & B.L, r = raw & B.R; raw = (raw & ~(B.L | B.R)) | (l ? B.R : 0) | (r ? B.L : 0); }
  const pressed = raw & ~f.prev;
  f.prev = raw;
  for (const [k, bit] of BTN) f.buf[k] = pressed & bit ? BUF : Math.max(0, f.buf[k] - 1);
  // double-tap dash detection
  if (f.tapT > 0) f.tapT--;
  let dashReq = 0;
  for (const bit of [B.L, B.R]) {
    if (pressed & bit) {
      if (f.tapDir === bit && f.tapT > 0) { dashReq = bit; f.tapT = 0; }
      else { f.tapDir = bit; f.tapT = 12; }
    }
  }
  if (f.buf.DASH) dashReq = raw & B.L ? B.L : raw & B.R ? B.R : f.face === 1 ? B.R : B.L;

  const fwdBit = f.face === 1 ? B.R : B.L, backBit = f.face === 1 ? B.L : B.R;
  const live = S.phase === "fight";
  if (f.st !== "crouch" && f.st !== "block") f.crouch = false;
  f.anim++;
  if (f.inv > 0) f.inv--;
  if (f.flash > 0) f.flash--;
  if (f.talkT > 0) f.talkT--;
  f.armor = 0;

  // --- face opponent when neutral & grounded ---
  if (grounded(f) && (f.st === "idle" || f.st === "walk" || f.st === "crouch" || f.st === "block")) {
    const nf = sgn(op.x - f.x); if (nf) f.face = nf;
  }

  switch (f.st) {
    case "intro": case "win": case "lose": case "timeout":
      f.vx = 0; break;
    case "hit": case "block": case "stagger":
      f.vx *= 0.82; f.stun--;
      if (f.stun <= 0) { f.st = "idle"; f.combo = 0; f.juggle = 0; }
      break;
    case "dizzy":
      f.vx *= 0.8; f.dizzy--;
      if (f.dizzy <= 0) { f.st = "idle"; f.combo = 0; f.juggle = 0; }
      break;
    case "air":
      break; // physics handles landing
    case "down":
      f.vx *= 0.8; f.t++;
      if (f.t >= 34 && f.hp > 0 && S.phase !== "ko" && S.phase !== "end") { f.st = "wake"; f.t = 0; f.inv = 16; }
      break;
    case "wake":
      f.t++; if (f.t >= 14) { f.st = "idle"; f.combo = 0; f.juggle = 0; }
      break;
    case "dash": case "bdash":
      f.t++; f.vx *= 0.9;
      if (f.t >= (f.st === "dash" ? 14 : 16)) { f.st = "idle"; f.vx = 0; }
      else if (f.st === "dash" && live && (f.buf.A || f.buf.S1 || f.buf.S2 || f.buf.S3)) { neutral(S, f, op, raw, fwdBit, backBit, 0, true); }
      break;
    case "parry": {
      const a = f.act; a.t++; f.vx *= 0.7;
      if (a.parried) {
        if (a.t >= PARRY.window + 10) { f.st = "idle"; f.act = null; }
        else if (live) neutral(S, f, op, raw, fwdBit, backBit, 0, true);
      } else if (a.t >= PARRY.window + PARRY.whiff) { f.st = "idle"; f.act = null; }
      break;
    }
    case "jump": {
      if (live && f.buf.A && !f.act) {
        f.buf.A = 0;
        if (raw & B.D && !f.slamUsed) { f.slamUsed = true; startMove(S, f, op, f.ch + ":slam"); }
        else startMove(S, f, op, f.ch + ":" + c.air);
        f.st = "act";
      } else if (live && f.buf.U && !f.dj && f.vy > -4.5) {
        f.buf.U = 0; f.dj = true; f.vy = -c.jump * 0.88;
        const dir = (raw & B.R ? 1 : 0) - (raw & B.L ? 1 : 0);
        if (dir) f.vx = dir * c.walk * 1.2;
        emit(S, { type: "djump", who: f.side });
      }
      break;
    }
    case "act":
      stepAct(S, f, op, raw);
      break;
    default:
      if (live) neutral(S, f, op, raw, fwdBit, backBit, dashReq);
      else { f.vx = 0; }
  }

  // armor window
  if (f.act && f.st === "act") {
    const m = getMove(f.act.ref);
    if (m.armor && f.act.t >= m.armor[0] && f.act.t <= m.armor[1]) f.armor = 1;
  }
}

function neutral(S, f, op, raw, fwdBit, backBit, dashReq, cancel) {
  const c = CHARS[f.ch];
  // skills
  if (f.sx.silence > 0) { f.buf.S1 = f.buf.S2 = f.buf.S3 = 0; }
  for (let i = 3; i >= 1; i--) {
    const k = "S" + i;
    if (f.buf[k] && f.cd[i - 1] <= 0 && grounded(f)) { f.buf[k] = 0; startMove(S, f, op, f.ch + ":s" + i); return; }
  }
  if (f.buf.A) { f.buf.A = 0; if (grounded(f)) startMove(S, f, op, basicRef(f, 0)); return; }
  if (cancel) return;
  if (f.buf.ST && grounded(f)) { f.buf.ST = 0; f.pst = (f.pst + 1) % 3; emit(S, { type: "stance", who: f.side, pst: f.pst }); }
  if (f.buf.P && grounded(f)) {
    f.buf.P = 0; f.st = "parry"; f.act = { ref: f.ch + ":b1", t: 0, parried: false }; f.vx = 0;
    emit(S, { type: "parryStart", who: f.side }); return;
  }
  if (dashReq && grounded(f)) {
    const dm = c.dashMul || 1;
    if (dashReq === fwdBit) { f.st = "dash"; f.vx = f.face * 4.4 * dm; } else { f.st = "bdash"; f.vx = -f.face * 3.8 * dm; }
    f.t = 0; emit(S, { type: "dash", who: f.side, back: dashReq !== fwdBit }); return;
  }
  if ((f.buf.U || raw & B.U) && grounded(f)) {
    f.buf.U = 0; f.st = "jump"; f.vy = -c.jump;
    const dir = (raw & B.R ? 1 : 0) - (raw & B.L ? 1 : 0);
    f.vx = dir * c.walk * 1.25; f.y = -1;
    emit(S, { type: "jump", who: f.side }); return;
  }
  if (raw & B.D) { f.st = "crouch"; f.crouch = true; f.vx = 0; return; }
  f.crouch = false;
  const slow = (f.sx.slow > 0 ? 0.5 : 1) * (f.sx.sad > 0 ? 0.75 : 1) * STANCES[f.pst].walk;
  const smoke = f.sx.smoke > 0 ? 1.15 : 1;
  if (raw & fwdBit) { f.st = "walk"; f.vx = f.face * c.walk * slow * smoke; }
  else if (raw & backBit) { f.st = "walk"; f.vx = -f.face * c.back * slow * smoke; }
  else { f.st = "idle"; f.vx = 0; }
}

function stepAct(S, f, op, raw) {
  const a = f.act, m = getMove(a.ref);
  a.t++;
  const total = m.startup + m.active + m.recovery;
  // velocity schedule
  let moved = false;
  if (m.vel) for (const [t0, t1, vx, vy] of m.vel) {
    if (a.t >= t0 && a.t <= t1) { f.vx = f.face * vx * (f.sx.slow > 0 ? 0.6 : 1); if (vy !== undefined) f.vy = vy; moved = true; }
  }
  if (!moved && grounded(f)) f.vx *= 0.7;
  // projectiles
  if (m.proj) for (let i = 0; i < m.proj.length; i++) {
    const p = m.proj[i];
    if (a.t === p.at) {
      S.projs.push({ id: S.nextId++, owner: f.side, ref: a.ref, pi: i, kind: p.kind, x: f.x + f.face * 16, y: f.y + p.y, vx: p.vx * f.face, vy: p.vy || 0, w: p.w, h: p.h, life: p.life, t: 0, ret: p.ret || 0, back: false, bounced: false, hit: false });
      emit(S, { type: "proj", who: f.side, kind: p.kind });
    }
  }
  const hk = HOOKS[m.hook];
  if (hk && hk.frame) hk.frame(S, f, op);
  if (f.act !== a) return; // hook swapped the move (Javatar)

  // basic chain buffering
  if (m.chain && f.buf.A && a.t >= Math.max(2, m.startup - 2)) { f.buf.A = 0; f.chainNext = true; }
  const activeEnd = m.startup + m.active;
  if (f.chainNext && a.t >= activeEnd) {
    startMove(S, f, op, f.ch + ":" + m.chain);
    return;
  }
  // skill follow-up (e.g. JOG Smash Encore -> Silence)
  if (m.followup && a.hit && a.t >= activeEnd && f.buf.S1) {
    f.buf.S1 = 0; startMove(S, f, op, a.ref.split(":")[0] + ":" + m.followup, { free: true }); return;
  }
  // hit-confirm cancel: basic -> skill
  if (!m.skill && a.hit && a.t >= activeEnd && f.sx.silence <= 0) {
    for (let i = 3; i >= 1; i--) {
      if (f.buf["S" + i] && f.cd[i - 1] <= 0) { f.buf["S" + i] = 0; startMove(S, f, op, f.ch + ":s" + i); return; }
    }
  }
  // air move landing
  if (m.isAir && grounded(f) && a.t > 2) { f.act = null; f.st = "idle"; f.vx = 0; return; }
  if (a.t >= total) {
    f.act = null;
    f.st = grounded(f) ? "idle" : "jump";
    if (grounded(f)) f.vx = 0;
  }
}

function activeBox(f) {
  if (f.st !== "act" || !f.act) return null;
  const m = getMove(f.act.ref);
  if (!m.box || m.kind === "proj" || m.kind === "cast" || f.act.noBox) return null;
  const t = f.act.t;
  if (t <= m.startup || t > m.startup + m.active) return null;
  if (m.maxHits) {
    if (f.act.hits >= m.maxHits) return null;
    if (t - f.act.last < (m.rehit || 99)) return null;
  } else if (f.act.hit) return null;
  return worldBox(f, m.box);
}

// ---------------- physics ----------------
function physics(S, f, op) {
  const ground = grounded(f);
  if (!ground || f.vy < 0) {
    let g = GRAV;
    if (f.st === "air") g += f.juggle * 0.012;
    if (f.sx.floaty > 0) g *= 0.42;
    f.vy += g;
  }
  f.x += f.vx; f.y += f.vy;
  if (f.y >= 0) {
    const wasAir = f.vy > 0;
    f.dj = false; f.slamUsed = false;
    f.y = 0;
    if (f.st === "air") {
      if (f.hp <= 0) { f.st = "down"; f.t = 0; f.vx *= 0.3; f.vy = 0; emit(S, { type: "land", who: f.side, heavy: true }); }
      else { f.st = "down"; f.t = 0; f.vx *= 0.4; f.vy = 0; emit(S, { type: "land", who: f.side, heavy: true }); }
    } else if (f.st === "jump") { f.st = "idle"; f.vx = 0; f.vy = 0; if (wasAir) emit(S, { type: "land", who: f.side }); }
    else f.vy = 0;
  }
  // walls
  if (f.x < 12 || f.x > STAGE_W - 12) {
    const wx = f.x < 12 ? 12 : STAGE_W - 12;
    if (f.wb && !f.wallBounced && (f.st === "air" || f.st === "hit") && Math.abs(f.vx) > 3) {
      f.vx = -f.vx * 0.45; f.wallBounced = true; f.st = "air"; f.vy = -3.6; f.y = Math.min(f.y, -1); f.kd = true;
      S.hitstop = Math.max(S.hitstop, 6); S.shake = Math.max(S.shake, 8);
      emit(S, { type: "wall", who: f.side, x: wx, y: f.y - 40 });
    }
    f.x = wx;
  }
}

function separate(S, a, b) {
  // camera leash
  const dx = b.x - a.x;
  if (Math.abs(dx) > MAX_SEP) {
    const over = Math.abs(dx) - MAX_SEP, s = sgn(dx);
    a.x += s * over / 2; b.x -= s * over / 2;
  }
  const pass = (f) => f.act && getMove(f.act.ref).passThrough && f.st === "act";
  if (pass(a) || pass(b)) return;
  if (a.st === "down" || b.st === "down") return;
  const ha = hurtbox(a), hb = hurtbox(b);
  const vOverlap = ha[1] < hb[1] + hb[3] && ha[1] + ha[3] > hb[1];
  if (!vOverlap) return;
  const minD = 22;
  const d = b.x - a.x;
  if (Math.abs(d) < minD) {
    const s = d === 0 ? (a.side === 0 ? 1 : -1) : sgn(d);
    const push = (minD - Math.abs(d)) / 2;
    a.x -= s * push; b.x += s * push;
    for (const f of [a, b]) f.x = clamp(f.x, 12, STAGE_W - 12);
    if (Math.abs(b.x - a.x) < minD) { // pinned to wall
      if (a.x <= 12 || b.x <= 12) { const lo = a.x < b.x ? a : b, hi = lo === a ? b : a; hi.x = lo.x + minD; }
      else { const hi = a.x > b.x ? a : b, lo = hi === a ? b : a; lo.x = hi.x - minD; }
    }
  }
}

// ---------------- zones & projectiles ----------------
function stepZones(S) {
  for (const z of S.zones) {
    z.t++;
    const owner = S.p[z.owner], tgt = S.p[1 - z.owner];
    const inside = Math.abs(tgt.x - z.x) < z.w / 2;
    if (z.kind === "well") {
      if (Math.abs(tgt.x - z.x) < 120 && tgt.st !== "down" && tgt.st !== "wake" && S.phase === "fight") tgt.x += sgn(z.x - tgt.x) * 1.7;
      if (z.t === z.life) {
        if (Math.abs(tgt.x - z.x) < 40) applyHit(S, owner, tgt, getMove("william:wellBurst"), { zone: true, x: z.x, y: -40 });
        emit(S, { type: "implode", who: z.owner, x: z.x });
      }
    } else if (z.kind === "antigrav") {
      if (inside) { tgt.sx.floaty = 2; tgt.sx.slow = 2; if (z.t % 30 === 0) dot(S, tgt, 7, "gravity"); }
    } else if (z.kind === "stink") {
      if (inside) { tgt.sx.poison = Math.max(tgt.sx.poison, 40); tgt.sx.slow = 2; }
    } else if (z.kind === "smoke") {
      if (inside && tgt.ch !== "jaguilar") tgt.sx.blind = 2;
      if (Math.abs(owner.x - z.x) < z.w / 2) owner.sx.smoke = 2;
    }
  }
  S.zones = S.zones.filter((z) => z.t < z.life);
}

function stepProjs(S) {
  for (const p of S.projs) {
    p.t++; p.life--;
    const owner = S.p[p.owner];
    if (p.ret && p.t >= p.ret) {
      if (!p.back) { p.back = true; p.hit = false; }
      const dir = sgn(owner.x - p.x);
      p.vx += dir * 0.42; p.vx = clamp(p.vx, -6.2, 6.2);
      p.y += ((owner.y - 54) - p.y) * 0.08;
      if (Math.abs(owner.x - p.x) < 14 && p.t > p.ret + 6) {
        p.life = 0; owner.cd[1] = Math.max(0, owner.cd[1] - 120);
        emit(S, { type: "catch", who: p.owner });
      }
    }
    p.x += p.vx; p.y += p.vy;
    if (p.x < 4 || p.x > STAGE_W - 4) {
      if (p.ret && !p.bounced) { p.bounced = true; p.vx = -p.vx; p.x = clamp(p.x, 4, STAGE_W - 4); p.hit = false; emit(S, { type: "ricochet", x: p.x, y: p.y }); }
      else p.life = 0;
    }
  }
  // projectile clash
  for (let i = 0; i < S.projs.length; i++) for (let j = i + 1; j < S.projs.length; j++) {
    const a = S.projs[i], b = S.projs[j];
    if (a.owner !== b.owner && a.life > 0 && b.life > 0 && overlap([a.x - a.w / 2, a.y - a.h / 2, a.w, a.h], [b.x - b.w / 2, b.y - b.h / 2, b.w, b.h])) {
      a.life = 0; b.life = 0; emit(S, { type: "clash", x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    }
  }
  for (const p of S.projs) {
    if (p.life <= 0 || p.hit) continue;
    const tgt = S.p[1 - p.owner];
    const pb = [p.x - p.w / 2, p.y - p.h / 2, p.w, p.h];
    if (overlap(pb, hurtbox(tgt))) {
      const def = getMove(p.ref).proj[p.pi];
      const r = applyHit(S, S.p[p.owner], tgt, def, { proj: true, vx: p.vx, x: p.x, y: p.y });
      if (r === "parry") { p.owner = 1 - p.owner; p.vx = -p.vx * 1.1; p.ret = 0; p.t = 0; p.life = 80; }
      else if (r) { if (p.ret) p.hit = true; else p.life = 0; }
    }
  }
  S.projs = S.projs.filter((p) => p.life > 0);
}

// ---------------- status ticks & passives ----------------
function stepStatus(S, f, op) {
  const s = f.sx;
  for (const k of ["blind", "confuse", "slow", "rattled", "floaty", "counter", "smoke", "silence", "sad"]) if (s[k] > 0) s[k]--;
  if (s.poison > 0) {
    s.poison--; s.poisonT++;
    if (s.poisonT % 30 === 0) dot(S, f, 5, "poison");
  } else s.poisonT = 0;
  for (let i = 0; i < 3; i++) if (f.cd[i] > 0) f.cd[i]--;
  if (f.sinceHit < 999) f.sinceHit++;
  if (s.bleed > 0) {
    s.bleedT--;
    if (s.bleedT % 30 === 0) dot(S, f, Math.round(2.5 * s.bleed), "bleed");
    if (s.bleedT <= 0) s.bleed = 0;
  }
  if (s.burn > 0) {
    s.burnT--;
    if (s.burnT % 20 === 0) dot(S, f, 3 * s.burn, "burn");
    if (s.burnT <= 0) s.burn = 0;
  }
  if (S.phase !== "fight") return;
  // passives
  if (f.ch === "jiross") {
    f.passiveT--;
    if (f.passiveT <= 0) {
      if (canAct(f) && op.hp > 0) {
        f.passiveT = 600;
        const line = Math.floor(rnd(S) * SMACK_TALK.length);
        op.sx.rattled = 180; s.momentum = Math.min(5, s.momentum + 1);
        f.talk = SMACK_TALK[line]; f.talkT = 120;
        emit(S, { type: "taunt", who: f.side, line });
      } else f.passiveT = 30;
    }
  } else if (f.ch === "paulite") {
    f.passiveT--;
    if (f.passiveT <= 0) {
      if (canAct(f) && op.hp > 0) { f.passiveT = 720; tellJoke(S, f, op, 120, 170); }
      else f.passiveT = 30;
    }
  } else if (f.ch === "johan") {
    if (Math.abs(op.x - f.x) < 58 && op.hp > 0) op.sx.poison = Math.max(op.sx.poison, 30);
  } else if (f.ch === "william") {
    f.passiveT--;
    if (f.passiveT <= 0) {
      f.passiveT = 240;
      op.sx.confuse = 45; f.talk = "wait class"; f.talkT = 90;
      emit(S, { type: "waitclass", who: f.side });
    }
  }
  if (S.mode === "training" && f.side === 1 && f.sinceHit > 90 && f.combo === 0) f.hp = Math.min(f.maxHp, f.hp + 25);
  if (S.mode === "training" && f.side === 0 && f.sinceHit > 90) f.hp = Math.min(f.maxHp, f.hp + 25);
}

// ---------------- main step ----------------
export function step(S, inputs, events) {
  S._ev = events || null;
  S.frame++;
  if (S.shake > 0) S.shake--;
  if (S.flashT > 0) S.flashT--;

  // freeze-frame (hitstop): only buffer inputs
  if (S.hitstop > 0) {
    S.hitstop--;
    for (let i = 0; i < 2; i++) {
      const f = S.p[i]; const pressed = inputs[i] & ~f.prev; f.prev = inputs[i];
      for (const [k, bit] of BTN) if (pressed & bit) f.buf[k] = BUF;
    }
    S._ev = null; return;
  }
  if (S.slow > 0) { S.slow--; if (S.slow % 3 !== 0) { S._ev = null; return; } }

  // phase machine
  S.phaseT++;
  if (S.phase === "intro") {
    const off = S.round === 1 && S.wins[0] === 0 && S.wins[1] === 0 ? 90 : 0; // round 1: VS card + intro animations first
    if (off && S.phaseT === 2) emit(S, { type: "vs" });
    if (S.phaseT === 2 + off) emit(S, { type: "round", n: S.round, final: S.wins[0] === S.roundsToWin - 1 && S.wins[1] === S.roundsToWin - 1 });
    if (S.phaseT === 72 + off) emit(S, { type: "fight" });
    if (S.phaseT >= 76 + off) { S.phase = "fight"; S.phaseT = 0; for (const f of S.p) { f.st = "idle"; f.t = 0; } }
  } else if (S.phase === "fight") {
    if (S.mode !== "training") {
      S.timer--;
      if (S.timer <= 0) {
        S.timer = 0; S.phase = "timeup"; S.phaseT = 0;
        const r0 = S.p[0].hp / S.p[0].maxHp, r1 = S.p[1].hp / S.p[1].maxHp;
        S.winner = r0 > r1 ? 0 : r1 > r0 ? 1 : -1;
        emit(S, { type: "timeup" });
      }
    } else S.timer = ROUND_TIME;
  } else if (S.phase === "ko" || S.phase === "timeup") {
    const len = S.phase === "ko" ? KO_LEN : TIMEUP_LEN;
    if (S.phaseT === 60 && S.winner >= 0) { const w = S.p[S.winner]; if (w.st !== "air") { w.st = "win"; w.act = null; } }
    if (S.phaseT >= len) {
      if (S.winner >= 0) S.wins[S.winner]++; else { S.wins[0]++; S.wins[1]++; }
      emit(S, { type: "roundEnd", winner: S.winner });
      const done = S.wins[0] >= S.roundsToWin || S.wins[1] >= S.roundsToWin;
      if (done) {
        S.phase = "end"; S.phaseT = 0;
        S.matchWinner = S.wins[0] > S.wins[1] ? 0 : S.wins[1] > S.wins[0] ? 1 : -1;
        if (S.matchWinner >= 0) { S.p[S.matchWinner].st = "win"; S.p[S.matchWinner].act = null; }
        emit(S, { type: "matchEnd", winner: S.matchWinner });
      } else { S.round++; resetRound(S); }
      S._ev = null; return;
    }
  }

  const [p0, p1] = S.p;
  const live = S.phase === "fight";
  const inA = live ? inputs[0] : 0;
  const inB = live ? inputs[1] : 0;
  stepFighter(S, p0, p1, inA);
  stepFighter(S, p1, p0, inB);

  for (const f of S.p) physics(S, f, S.p[1 - f.side]);
  separate(S, p0, p1);
  stepZones(S);

  // melee hit detection (simultaneous)
  const pending = [];
  for (const f of S.p) {
    const box = activeBox(f);
    if (!box) continue;
    const op = S.p[1 - f.side];
    if (overlap(box, hurtbox(op))) pending.push([f, op, getMove(f.act.ref), f.act]);
  }
  for (const [f, op, m, act] of pending) {
    if (f.act !== act || f.st !== "act") continue; // got parried/hit by the trade
    act.hit = true; act.hits++; act.last = act.t;
    const r = applyHit(S, f, op, m, { x: (f.x + op.x) / 2 + f.face * 4, y: f.y + m.box[1] + m.box[3] / 2 });
    if (r === "parry" || r === null) { if (r === null) { act.hits--; act.hit = act.hits > 0; } }
  }
  stepProjs(S);
  for (const f of S.p) stepStatus(S, f, S.p[1 - f.side]);
  if (S.phase === "ko" && p0.hp <= 0 && p1.hp <= 0) S.winner = -1;
  S._ev = null;
}

// hash for desync detection (cheap)
export function hashState(S) {
  let h = 2166136261 >>> 0;
  const mix = (v) => { h ^= (v * 1000) | 0; h = Math.imul(h, 16777619) >>> 0; };
  mix(S.frame); mix(S.timer); mix(S.rng);
  for (const f of S.p) { mix(f.x); mix(f.y); mix(f.hp); mix(f.vx); mix(f.vy); mix(f.cd[0]); mix(f.cd[1]); mix(f.cd[2]); mix(f.pst); mix(f.dj ? 1 : 0); }
  mix(S.projs.length);
  return h >>> 0;
}

export function clone(S) { return structuredClone(S); }
