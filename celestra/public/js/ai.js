// CPU opponent. Reads sim state, outputs an input bitmask (not part of the deterministic sim).
import { B } from "./sim.js";
import { CHARS, getMove } from "./chars.js";

const LEVELS = {
  easy: { react: 22, parry: 0.08, block: 0.25, aggro: 0.35, skill: 0.25 },
  normal: { react: 13, parry: 0.28, block: 0.55, aggro: 0.6, skill: 0.5 },
  hard: { react: 7, parry: 0.55, block: 0.8, aggro: 0.8, skill: 0.8 },
};
// preferred skill usage ranges per character [s1,s2,s3] -> [min,max] distance
const RANGES = {
  jiross: [[30, 150], [0, 46], [0, 400]],
  lian: [[70, 400], [60, 300], [20, 150]],
  dumdum: [[0, 52], [30, 130], [0, 56]],
  gayle: [[0, 62], [0, 58], [0, 64]],
  dapsay: [[30, 120], [40, 260], [40, 260]],
  william: [[60, 160], [20, 120], [0, 300]],
  tanoy: [[60, 400], [0, 80], [50, 400]],
  acar: [[0, 48], [0, 52], [40, 110]],
  apsay: [[40, 260], [40, 200], [40, 260]],
  dap: [[40, 120], [0, 46], [40, 150]],
  jog: [[0, 60], [0, 36], [0, 100]],
  jaguilar: [[0, 70], [70, 400], [20, 200]],
  paulite: [[30, 90], [0, 190], [40, 150]],
  johan: [[20, 160], [0, 90], [30, 200]],
};

export class AI {
  constructor(level = "normal", side = 1, dummy = null) {
    this.L = LEVELS[level] || LEVELS.normal; this.side = side; this.dummy = dummy;
    this.hold = 0; this.holdT = 0; this.tap = 0; this.cool = 0; this.seen = -1; this.reactAt = -1; this.plan = null;
  }
  think(S) {
    const me = S.p[this.side], op = S.p[1 - this.side];
    if (S.phase !== "fight") return 0;
    const fwd = me.face === 1 ? B.R : B.L, back = me.face === 1 ? B.L : B.R;
    const dist = Math.abs(op.x - me.x);
    if (this.dummy === "stand") return 0;
    if (this.dummy === "block") return back | (op.act && getMove(op.act.ref).lvl === "L" ? B.D : 0);
    if (this.dummy === "attack") { // tutorial: throws a slow jab every ~1.5s when close
      this.cool = (this.cool || 0) + 1;
      if (this.cool > 90 && dist < 70 && me.st !== "act") { this.cool = 0; return B.A; }
      return 0;
    }
    if (this.dummy === "parry") { const m = op.act && getMove(op.act.ref); if (m && op.act.t === Math.max(1, m.startup - 3) && dist < 120) return B.P; return 0; }

    let out = 0;
    // pressing a button needs an edge: release every other frame
    const press = (bit) => { if (this.tap & bit) { this.tap &= ~bit; return 0; } this.tap |= bit; return bit; };
    this.tap &= ~(this.tap & 0); // keep
    // --- defense: react to an incoming attack ---
    if (op.act && op.st === "act") {
      const m = getMove(op.act.ref);
      if (this.seen !== op.act) { this.seen = op.act; this.reactAt = op.act.t + this.L.react * (0.7 + Math.random() * 0.6); this.defDecision = Math.random(); }
      const threat = m.kind === "proj" ? dist < 300 : dist < (m.box ? m.box[0] + m.box[2] + 30 : 80) + (m.vel ? 60 : 0);
      const timeToHit = m.startup - op.act.t;
      if (threat && op.act.t >= this.reactAt && timeToHit >= -1) {
        if (this.defDecision < this.L.parry && timeToHit <= 6 && timeToHit >= 0 && (me.st === "idle" || me.st === "walk" || me.st === "crouch")) return press(B.P);
        if (this.defDecision < this.L.parry + this.L.block) return back | (m.lvl === "L" ? B.D : 0);
      }
    }
    // projectiles in flight
    for (const p of S.projs) if (p.owner !== this.side && Math.abs(p.x - me.x) < 60 && Math.sign(me.x - p.x) === Math.sign(p.vx)) {
      if (Math.random() < this.L.parry * 0.5) return press(B.P);
      if (Math.random() < this.L.block) return back;
    }
    if (this.cool > 0) { this.cool--; return this.hold; }

    // --- punish / combo stunned or staggered foe ---
    const vuln = op.st === "dizzy" || op.st === "stagger" || (op.st === "hit" && op.stun > 6) || op.st === "air";
    const rng = RANGES[me.ch];
    const ready = (i) => me.cd[i] <= 0;
    const inR = (i) => dist >= rng[i][0] && dist <= rng[i][1];
    if (me.st === "act") {
      if (me.act.hit && getMove(me.act.ref).followup) return press(B.S1);
      // keep chaining basics / hit-confirm cancel
      if (me.act.hit || Math.random() < this.L.aggro * 0.5) {
        for (let i = 2; i >= 0; i--) if (ready(i) && inR(i) && Math.random() < this.L.skill * 0.25) return press(B["S" + (i + 1)]);
        return press(B.A);
      }
      return 0;
    }
    if (me.st === "jump") {
      if (!me.dj && me.vy > -2 && Math.random() < 0.04) return press(B.U);                 // double jump
      if (dist < 50 && me.y < -20 && !me.slamUsed && Math.random() < 0.12 * this.L.aggro) return B.D | press(B.A); // air slam
      return Math.random() < 0.15 ? press(B.A) : 0;
    }
    // occasionally switch stance: aggressive when ahead on life, defensive when behind
    if (me.st === "idle" && Math.random() < 0.004) {
      const want = me.hp > op.hp * 1.2 ? 1 : me.hp < op.hp * 0.8 ? 2 : 0;
      if (want !== me.pst) return press(B.ST);
    }
    if (vuln) {
      if (dist < 44) {
        for (let i = 2; i >= 0; i--) if (ready(i) && inR(i) && Math.random() < this.L.skill) return press(B["S" + (i + 1)]);
        return press(B.A);
      }
      this.hold = fwd; this.cool = 4; return fwd;
    }
    const r = Math.random();
    // skills by range
    if (r < this.L.skill * 0.12) {
      for (const i of [2, 0, 1]) if (ready(i) && inR(i)) { this.cool = 8; this.hold = 0; return press(B["S" + (i + 1)]); }
    }
    if (dist < 40) {
      if (r < this.L.aggro * 0.4) return press(B.A);
      if (r < 0.5) { this.hold = back; this.cool = 10; return back; }
      if (r < 0.52) return press(B.U);
      return 0;
    }
    if (dist < 90) {
      if (r < this.L.aggro * 0.12) { this.hold = 0; this.cool = 2; return press(B.DASH); }
      this.hold = fwd; this.cool = 6; return fwd;
    }
    if (r < 0.05) return press(B.DASH);
    if (r < 0.06) { this.hold = fwd | B.U; this.cool = 3; return fwd | B.U; }
    this.hold = fwd; this.cool = 10; return fwd;
  }
}
