// Renderer: stage, fighters, projectiles, zones, particles, in-world text.
import { VIEW_W, VIEW_H, STAGE_W } from "./sim.js";
import { CHARS, getMove, STANCES } from "./chars.js";
import { drawFighter, drawGhost, disc, capsule, poseFor } from "./sprites.js";
import { buildStage, drawStage, drawStageFront, FLOOR_Y } from "./stage.js";

// ---------- 3x5 bitmap font ----------
const G = {
  A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110", E: "111100110100111", F: "111100110100100",
  G: "011100101101011", H: "101101111101101", I: "111010010010111", J: "001001001101010", K: "101101110101101", L: "100100100100111",
  M: "101111111101101", N: "110101101101101", O: "010101101101010", P: "110101110100100", Q: "010101101110011", R: "110101110101101",
  S: "011100010001110", T: "111010010010010", U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101",
  Y: "101101010010010", Z: "111001010100111", 0: "111101101101111", 1: "010110010010111", 2: "110001010100111", 3: "110001010001110",
  4: "101101111001001", 5: "111100110001110", 6: "011100111101111", 7: "111001010010010", 8: "111101111101111", 9: "111101111001110",
  "!": "010010010000010", "?": "110001010000010", ".": "000000000000010", ",": "000000000010100", "'": "010010000000000", "-": "000000111000000",
  "+": "000010111010000", "/": "001001010100100", ":": "000010000010000", "%": "101001010100101", "^": "010101000000000", "=": "000111000111000", " ": "000000000000000",
};
export function pixText(ctx, txt, x, y, col, scale = 1, outline = "#120e18") {
  txt = String(txt).toUpperCase();
  const draw = (ox, oy, c) => {
    ctx.fillStyle = c;
    for (let i = 0; i < txt.length; i++) {
      const g = G[txt[i]] || G["?"];
      for (let k = 0; k < 15; k++) if (g[k] === "1") ctx.fillRect(Math.round(x + ox + (i * 4 + (k % 3)) * scale), Math.round(y + oy + Math.floor(k / 3) * scale), scale, scale);
    }
  };
  if (outline) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]]) draw(dx * scale, dy * scale, outline);
  draw(0, 0, col);
}
export const textW = (txt, scale = 1) => String(txt).length * 4 * scale - scale;

// ---------- particles ----------
class FX {
  constructor() { this.p = []; this.texts = []; this.trails = [[], []]; this.ghosts = []; this.rings = []; }
  add(o) { this.p.push({ life: 20, t: 0, vx: 0, vy: 0, g: 0, size: 1, col: "#fff", ...o }); }
  burst(x, y, n, cols, spd = 2.5, life = 18, g = 0.08, size = 1, type = "px") {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = spd * (0.4 + Math.random() * 0.8);
      this.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.6, life: life * (0.6 + Math.random() * 0.6), col: cols[i % cols.length], g, size, type });
    }
  }
  sparks(x, y, dir, n, cols, len = 7) {
    for (let i = 0; i < n; i++) {
      const a = (Math.random() - 0.5) * 2.4 + (dir < 0 ? Math.PI : 0), s = 2 + Math.random() * 3.5;
      this.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 8 + Math.random() * 7, col: cols[i % cols.length], type: "spark", len });
    }
  }
  ring(x, y, r0, r1, col, life = 14, thick = 1) { this.rings.push({ x, y, r0, r1, col, life, t: 0, thick }); }
  text(x, y, txt, col, life = 50, scale = 1, vy = -0.5) { this.texts.push({ x, y, txt, col, life, t: 0, scale, vy }); }
  step() {
    for (const p of this.p) { p.t++; p.x += p.vx; p.y += p.vy; p.vy += p.g; if (p.type === "smoke") { p.vx *= 0.96; p.vy *= 0.96; p.size += 0.06; } }
    this.p = this.p.filter((p) => p.t < p.life);
    for (const r of this.rings) r.t++;
    this.rings = this.rings.filter((r) => r.t < r.life);
    for (const t of this.texts) { t.t++; t.y += t.vy; }
    this.texts = this.texts.filter((t) => t.t < t.life);
    for (const g of this.ghosts) g.t++;
    this.ghosts = this.ghosts.filter((g) => g.t < g.life);
  }
}

export class Renderer {
  constructor(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext("2d", { alpha: false });
    this.ctx.imageSmoothingEnabled = false;
    this.fx = new FX(); this.cam = STAGE_W / 2 - VIEW_W / 2; this.time = 0;
    this.stage = null; this.stageId = null; this.flash = 0; this.shakeX = 0; this.shakeY = 0;
    this.banner = null; this.combo = [null, null];
  }
  setStage(id) { if (this.stageId !== id) { this.stage = buildStage(id); this.stageId = id; } }
  resetFx() { this.fx = new FX(); this.combo = [null, null]; }

  // translate sim events into visuals
  onEvent(e, S) {
    const fx = this.fx, oy = FLOOR_Y;
    const P = (who) => S.p[who];
    switch (e.type) {
      case "hit": {
        const d = P(e.who), x = e.x, y = oy + e.y;
        const dir = Math.sign(d.x - P(e.by).x) || 1;
        const pal = e.sfx === "slash" || e.sfx === "heavyslash" ? ["#ffffff", "#ff3355", "#ff8aa0"] : e.sfx === "fire" ? ["#fff3a0", "#ff7a29", "#ff3d1f"] : e.sfx === "gravity" ? ["#ffffff", "#9b8cff", "#5a4cff"] : ["#ffffff", "#ffe14d", "#ff9a3c"];
        fx.sparks(x, y, dir, e.heavy ? 16 : 9, pal, e.heavy ? 10 : 6);
        fx.ring(x, y, 2, e.heavy ? 22 : 12, pal[1], e.heavy ? 14 : 9, e.heavy ? 2 : 1);
        if (e.sfx === "slash" || e.sfx === "heavyslash") fx.add({ type: "slash", x, y, life: 8, dir, big: e.heavy });
        if (e.heavy) { this.flash = Math.max(this.flash, 3); fx.burst(x, y, 6, ["#fff"], 3, 10, 0, 2); }
        if (e.counter) fx.text(x, y - 18, "COUNTER!", "#ffe14d", 45, 1);
        if (e.combo >= 2) this.combo[e.by] = { n: e.combo, t: 90 };
        fx.text(x + dir * 6, y - 8, e.dmg, e.heavy ? "#ffe14d" : "#ffffff", 30, 1, -0.6);
        break;
      }
      case "block": fx.burst(e.x, oy + e.y, 6, ["#9fd8ff", "#ffffff"], 1.8, 10, 0); fx.ring(e.x, oy + e.y, 2, 9, "#9fd8ff", 8); break;
      case "parry": {
        const x = e.x, y = oy + e.y;
        fx.sparks(x, y, 1, 14, ["#ffffff", "#cfe8ff", "#7fd3ff"], 9); fx.sparks(x, y, -1, 14, ["#ffffff", "#cfe8ff", "#7fd3ff"], 9);
        fx.ring(x, y, 4, 40, "#cfe8ff", 18, 2); fx.ring(x, y, 2, 26, "#ffffff", 12, 1);
        fx.text(x, y - 26, "PARRY!", "#7fd3ff", 50, 2, -0.3);
        this.flash = Math.max(this.flash, 2);
        break;
      }
      case "armor": fx.burst(e.x, oy + e.y, 10, ["#ffd23f", "#fff"], 2, 12, 0); fx.text(e.x, oy + e.y - 20, "ARMOR", "#ffd23f", 40); break;
      case "dash": { const f = P(e.who); fx.burst(f.x - f.face * 8 * (e.back ? -1 : 1), oy - 2, 6, ["#c8bfa8", "#8a8070"], 1.4, 16, -0.02, 1, "smoke"); break; }
      case "jump": { const f = P(e.who); fx.burst(f.x, oy - 1, 5, ["#c8bfa8"], 1.2, 12, 0, 1, "smoke"); break; }
      case "land": { const f = P(e.who); fx.burst(f.x, oy - 1, e.heavy ? 10 : 4, ["#c8bfa8", "#8a8070"], e.heavy ? 2 : 1, 16, -0.02, 1, "smoke"); break; }
      case "wall": fx.burst(e.x, oy + e.y, 14, ["#fff", "#ffe14d", "#a0a0a0"], 3, 18, 0.15, 1); fx.ring(e.x, oy + e.y, 4, 30, "#ffffff", 12, 2); fx.text(e.x + (e.x < 100 ? 24 : -24), oy + e.y - 20, "WALL!", "#ffffff", 40); break;
      case "stun": { const f = P(e.who); fx.text(f.x, oy + f.y - 86, "STUN!", "#ffe14d", 60, 1, -0.2); break; }
      case "teleport": {
        fx.burst(e.from, oy - 36, 18, ["#b56bff", "#5a32a3", "#ffffff"], 1.8, 22, -0.03, 1, "smoke");
        fx.burst(e.to, oy - 36, 18, ["#b56bff", "#5a32a3", "#ffffff"], 1.8, 22, -0.03, 1, "smoke");
        fx.ghosts.push({ f: structuredClone(P(e.who)), x: e.from, t: 0, life: 18, col: "#7a3fd0" });
        break;
      }
      case "detonate": { fx.burst(e.x, oy + e.y, 12 + e.stacks * 6, ["#ff3355", "#8a0f22", "#ffffff"], 3.2, 26, 0.12, 1); fx.ring(e.x, oy + e.y, 4, 26 + e.stacks * 4, "#ff3355", 16, 2); fx.text(e.x, oy + e.y - 30, `x${e.stacks} HEMORRHAGE`, "#ff3355", 60); break; }
      case "bleed": { const f = P(e.who); fx.burst(f.x, oy + f.y - 46, 5, ["#ff3355", "#8a0f22"], 1.5, 20, 0.14); break; }
      case "homerun": { const f = P(1 - e.who); fx.text(f.x, oy - 100, "HOME RUN!", "#ffd23f", 80, 2, -0.2); break; }
      case "javatar": { const f = P(e.who); fx.text(f.x, oy - 98, "JAVATAR: " + e.name, "#ff9a3c", 80, 1, -0.25); fx.burst(f.x, oy - 44, 20, ["#ff9a3c", "#ffcf5a", "#fff"], 2, 26, -0.05, 1); fx.ring(f.x, oy - 44, 4, 36, "#ff9a3c", 18, 2); break; }
      case "cast": { const f = P(e.who); if (e.ult) { this.flash = Math.max(this.flash, 2); fx.ring(f.x, oy - 40, 6, 50, CHARS[f.ch].color, 20, 2); fx.text(f.x, oy - 104, e.name, CHARS[f.ch].color, 70, 1, -0.2); } break; }
      case "proj": break;
      case "ricochet": fx.sparks(e.x, oy + e.y, e.x < 100 ? 1 : -1, 8, ["#fff36b", "#ffffff"]); break;
      case "catch": { const f = P(e.who); fx.text(f.x, oy - 90, "CATCH!", "#3fe0d0", 40); fx.burst(f.x + f.face * 8, oy - 54, 8, ["#fff36b", "#3fe0d0"], 1.5, 14, 0); break; }
      case "clash": fx.sparks(e.x, oy + e.y, 1, 8, ["#fff", "#ffe14d"]); fx.sparks(e.x, oy + e.y, -1, 8, ["#fff", "#ffe14d"]); break;
      case "implode": fx.ring(e.x, oy - 30, 40, 2, "#9b8cff", 14, 2); fx.burst(e.x, oy - 30, 20, ["#ffffff", "#9b8cff", "#3a2aff"], 3, 18, 0); break;
      case "stomp": fx.burst(e.x, oy - 1, 18, ["#c8bfa8", "#8a8070", "#5cff7a"], 3, 22, 0.06, 1, "smoke"); fx.ring(e.x, oy - 2, 4, 44, "#5cff7a", 14, 1); break;
      case "taunt": break;
      case "aim": { const f = P(e.who); fx.text(f.x, oy - 104, "LAST BULLET", "#c8283c", 50, 1, -0.2); this.aimT = [e.who, 30]; break; }
      case "gunshot": this.flash = Math.max(this.flash, 4); fx.burst(e.x, oy + e.y, 14, ["#fff3a0", "#ffb03a", "#ffffff"], 3, 10, 0, 2); fx.ring(e.x, oy + e.y, 2, 22, "#ffe14d", 8, 2); this.aimT = null; break;
      case "shirt": { const f = P(e.who); fx.text(f.x, oy - 104, "SHIRT OFF!", "#ffffff", 50, 1, -0.2); break; }
      case "leavepass": fx.text(e.x, oy - 112, "NO LEAVE PASS!", "#ffffff", 70, 2, -0.3); for (let i = 0; i < 26; i++) fx.add({ x: e.x + (Math.random() - 0.5) * 150, y: oy - 150 - Math.random() * 40, vx: (Math.random() - 0.5) * 0.6, vy: 0.9 + Math.random() * 0.6, col: i % 4 ? "#ffffff" : "#d8e4ff", life: 120, size: 2, type: "paper" }); break;
      case "djump": { const f = P(e.who); fx.ring(f.x, oy + f.y, 3, 16, "#ffffff", 10, 1); fx.burst(f.x, oy + f.y, 6, ["#ffffff", CHARS[f.ch].color], 1.4, 12, 0.02); break; }
      case "slam": fx.ring(e.x, oy - 2, 6, 64, "#ffe14d", 16, 2); fx.ring(e.x, oy - 2, 4, 40, "#ffffff", 12, 1); fx.sparks(e.x, oy - 4, 1, 8, ["#ffe14d", "#ffffff"]); fx.sparks(e.x, oy - 4, -1, 8, ["#ffe14d", "#ffffff"]); break;
      case "stance": { const f = P(e.who), st = STANCES[e.pst]; fx.text(f.x, oy + f.y - 96, st.name, st.color, 50, 1, -0.3); fx.ring(f.x, oy + f.y - 40, 6, 30, st.color, 12, 1); break; }
      case "joke": { const f = P(e.who); fx.burst(f.x, oy - 80, 8, ["#ffd24c", "#ffffff"], 1.2, 20, -0.02); break; }
      case "sad": { const f = P(e.who); fx.text(f.x, oy + f.y - 84, "SAD...", "#76a9ff", 60, 1, -0.2); break; }
      case "silence": { const f = P(e.who); fx.text(f.x, oy + f.y - 90, "SILENCED!", "#60d7ff", 70, 1, -0.2); fx.ring(f.x, oy + f.y - 44, 4, 30, "#60d7ff", 14, 1); break; }
      case "quiz": fx.ring(e.x, oy - 4, 6, 110, "#60d7ff", 18, 2); fx.burst(e.x, oy - 4, 24, ["#c8bfa8", "#60d7ff", "#ffffff"], 3.5, 22, 0.08, 1, "smoke"); fx.text(e.x, oy - 104, "POP QUIZ!", "#60d7ff", 70, 2, -0.2); break;
      case "waitclass": { const f = P(e.who); fx.ring(f.x, oy - 40, 6, 40, "#9b8cff", 14, 1); break; }
      case "ko": {
        this.flash = 12;
        fx.burst(e.x, oy + e.y, 40, ["#ffffff", "#ffe14d", "#ff3355", "#7fd3ff"], 4.5, 40, 0.06, 2);
        fx.ring(e.x, oy + e.y, 6, 90, "#ffffff", 30, 3); fx.ring(e.x, oy + e.y, 4, 60, "#ffe14d", 22, 2);
        break;
      }
      case "dot": {
        const f = P(e.who);
        if (e.kind === "burn") fx.burst(f.x + (Math.random() - 0.5) * 14, oy + f.y - 30 - Math.random() * 30, 2, ["#ffd27a", "#ff7a29"], 0.6, 16, -0.06);
        if (e.kind === "poison") fx.add({ x: f.x + (Math.random() - 0.5) * 14, y: oy + f.y - 30 - Math.random() * 30, vy: -0.5, col: Math.random() < 0.5 ? "#65ff6e" : "#2f9b3a", life: 20, size: 2 });
        if (e.kind === "paper") fx.burst(f.x, oy + f.y - 40, 8, ["#ffffff", "#d8e4ff"], 1.6, 18, 0.05, 2);
        if (e.kind === "bleed") fx.add({ x: f.x + (Math.random() - 0.5) * 12, y: oy + f.y - 40, vy: 0.5, g: 0.12, col: "#c8102e", life: 22, size: 1 });
        if (Math.random() < 0.6) fx.text(f.x + (Math.random() - 0.5) * 20, oy + f.y - 72, e.amount, e.kind === "burn" ? "#ff7a29" : e.kind === "bleed" ? "#ff3355" : e.kind === "poison" ? "#65ff6e" : e.kind === "paper" ? "#ffffff" : "#9b8cff", 26, 1, -0.5);
        break;
      }
    }
  }

  draw(S, opts = {}) {
    const ctx = this.ctx, fx = this.fx;
    this.time++;
    const [a, b] = S.p;
    const target = Math.max(0, Math.min(STAGE_W - VIEW_W, (a.x + b.x) / 2 - VIEW_W / 2));
    this.cam += (target - this.cam) * 0.18;
    const shake = S.shake + (this.flash > 6 ? 4 : 0);
    const sx = shake ? Math.round((Math.random() - 0.5) * Math.min(shake, 10)) : 0;
    const sy = shake ? Math.round((Math.random() - 0.5) * Math.min(shake, 8)) : 0;
    const cam = Math.round(this.cam);
    ctx.save();
    ctx.translate(sx, sy);
    drawStage(ctx, this.stage, cam, this.time, pixText);
    const ox = -cam, oy = FLOOR_Y;

    // zones behind
    for (const z of S.zones) this.drawZone(ctx, z, ox, oy, S, false);
    // shadows
    for (const f of S.p) {
      const w = 14 - Math.min(8, Math.round(-f.y / 10));
      ctx.fillStyle = "rgba(10,6,20,0.45)";
      ctx.fillRect(Math.round(ox + f.x - w), oy - 1, w * 2, 3);
      ctx.fillRect(Math.round(ox + f.x - w + 2), oy - 2, w * 2 - 4, 5);
    }
    // ghosts (teleport afterimages)
    for (const g of fx.ghosts) {
      if ((g.t >> 1) & 1) continue;
      const gf = { ...g.f, x: g.x };
      ctx.globalAlpha = 0.45 * (1 - g.t / g.life);
      drawGhost(ctx, gf, ox, oy, g.col);
      ctx.globalAlpha = 1;
    }
    // fighters: attacker on top
    const order = [a, b].sort((p, q) => (p.st === "act" ? 1 : 0) - (q.st === "act" ? 1 : 0));
    const anchors = [];
    for (const f of order) {
      f._discOut = f.ch === "lian" && S.projs.some((p) => p.owner === f.side && (p.kind === "disc" || p.kind === "boomer"));
      // afterimage trail for dashes / dash skills
      const m = f.act ? getMove(f.act.ref) : null;
      const fast = f.st === "dash" || (m && m.vel && f.act.t > m.startup && f.act.t <= m.startup + m.active);
      if (fast && (this.time & 1)) fx.ghosts.push({ f: structuredClone(f), x: f.x, t: 0, life: 8, col: CHARS[f.ch].color + "" });
      const hidden = f.sx.smoke > 0 && (this.time >> 2) & 1;
      if (hidden) { ctx.globalAlpha = 0.45; }
      const tele = f.act && m && m.hook === "teleport" && f.act.t > m.tpAt - 5 && f.act.t < m.tpAt + 2;
      if (!tele) anchors[f.side] = drawFighter(ctx, f, ox, oy, { flash: f.flash > 2 || (S.hitstop > 0 && f.flash > 0), S });
      else anchors[f.side] = { hand: [ox + f.x, oy - 50], foot: [ox + f.x, oy], head: [ox + f.x, oy - 70], chest: [ox + f.x, oy - 40] };
      ctx.globalAlpha = 1;
      this.trail(ctx, f, anchors[f.side], m);
      if (f.st === "parry" && !f.act.parried) this.parryGlow(ctx, f, ox, oy);
      if (f.armor) { ctx.fillStyle = "#ffd23f"; const hx = Math.round(ox + f.x); for (let i = 0; i < 6; i++) ctx.fillRect(hx - 14 + ((this.time + i * 5) % 28), oy - 72 + ((i * 13) % 60), 1, 3); }
    }
    // projectiles
    for (const p of S.projs) this.drawProj(ctx, p, ox, oy);
    // zones in front (smoke)
    for (const z of S.zones) this.drawZone(ctx, z, ox, oy, S, true);
    // status overlays
    for (const f of S.p) this.drawStatus(ctx, f, ox, oy, anchors[f.side]);

    // particles
    fx.step();
    for (const r of fx.rings) {
      const k = r.t / r.life, rad = r.r0 + (r.r1 - r.r0) * (1 - (1 - k) * (1 - k));
      ctx.fillStyle = r.col;
      const n = Math.max(12, Math.floor(rad * 2.2));
      for (let i = 0; i < n; i++) { const an = (i / n) * Math.PI * 2; ctx.fillRect(Math.round(ox + r.x + Math.cos(an) * rad), Math.round(oy - FLOOR_Y + r.y + Math.sin(an) * rad * 0.8), r.thick, r.thick); }
    }
    for (const p of fx.p) {
      const k = p.t / p.life;
      const x = Math.round(ox + p.x), y = Math.round(oy - FLOOR_Y + p.y);
      if (p.type === "spark") {
        const l = p.len * (1 - k);
        ctx.fillStyle = p.col;
        const n = Math.max(1, Math.round(l));
        const sp = Math.hypot(p.vx, p.vy) || 1;
        for (let i = 0; i < n; i++) ctx.fillRect(Math.round(x - (p.vx / sp) * i), Math.round(y - (p.vy / sp) * i), 1, 1);
      } else if (p.type === "smoke") {
        disc(ctx, x, y, Math.round(p.size * 2 * (1 - k * 0.3)), k > 0.6 ? "#6e6676" : p.col);
      } else if (p.type === "slash") {
        ctx.fillStyle = k < 0.5 ? "#ffffff" : "#ff3355";
        const L = p.big ? 30 : 20;
        for (let i = -L; i <= L; i++) { const yy = Math.round(i * 0.6), xx = Math.round(p.dir * (Math.abs(i) * 0.15)); ctx.fillRect(x + xx + i * 0, y + yy, 2, 1); ctx.fillRect(x + i, Math.round(y - i * 0.45), 1, 1); }
      } else {
        ctx.fillStyle = p.col; ctx.fillRect(x, y, p.size, p.size);
      }
    }
    for (const t of fx.texts) {
      if (t.t > t.life - 8 && (t.t & 1)) continue;
      const pop = t.t < 4 ? 1 : 0;
      pixText(ctx, t.txt, Math.round(ox + t.x - textW(t.txt, t.scale) / 2), Math.round(oy - FLOOR_Y + t.y - pop), t.col, t.scale);
    }
    // combo counters
    for (let i = 0; i < 2; i++) {
      const c = this.combo[i];
      if (!c) continue;
      c.t--; if (c.t <= 0) { this.combo[i] = null; continue; }
      const txt = `${c.n} HITS`;
      const x = i === 0 ? 8 : VIEW_W - 8 - textW(txt, 2);
      pixText(ctx, txt, x, 74, c.t > 80 ? "#ffffff" : "#ffe14d", 2);
    }
    drawStageFront(ctx, this.stage, cam, this.time);
    ctx.restore();

    // KO slow-mo vignette / flash
    if (S.phase === "ko" && S.slow > 0) {
      ctx.fillStyle = "rgba(10,0,20,0.25)";
      ctx.fillRect(0, 0, VIEW_W, 18); ctx.fillRect(0, VIEW_H - 18, VIEW_W, 18);
    }
    if (this.flash > 0) {
      ctx.fillStyle = this.flash > 8 ? "#ffffff" : `rgba(255,255,255,${this.flash / 10})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H); this.flash--;
    }
    return { cam };
  }

  trail(ctx, f, anc, m) {
    const tr = this.fx.trails[f.side];
    const active = m && f.act && f.act.t > m.startup - 2 && f.act.t <= m.startup + m.active + 1 && m.kind !== "proj" && m.kind !== "cast";
    if (!active) { tr.length = 0; return; }
    const kicky = /kick|knee|sweep|barrage|stomp|drop|fusion/.test(m.anim);
    const pt = kicky ? anc.foot : anc.hand;
    tr.unshift([pt[0] + this.cam, pt[1]]);
    if (tr.length > 6) tr.pop();
    const c = CHARS[f.ch];
    const col = m.sfx === "slash" || m.sfx === "heavyslash" ? ["#ffffff", "#ff8aa0", "#ff3355"] : m.sfx === "bat" || m.sfx === "heavybat" || m.sfx === "homerun" ? ["#ffffff", "#ffe9a8", "#c98a4b"] : ["#ffffff", c.color, c.color];
    for (let i = 0; i < tr.length - 1; i++) {
      const [x1, y1] = tr[i], [x2, y2] = tr[i + 1];
      capsule(ctx, x1 - this.cam, y1, x2 - this.cam, y2, i < 2 ? 1 : 0, 0, col[Math.min(2, i >> 1)]);
    }
  }

  parryGlow(ctx, f, ox, oy) {
    const x = Math.round(ox + f.x + f.face * 10), y = oy + f.y - 44;
    ctx.fillStyle = (this.time >> 1) & 1 ? "#cfe8ff" : "#7fd3ff";
    for (let i = -14; i <= 14; i += 2) ctx.fillRect(x + Math.round(Math.abs(i) * 0.25) * -f.face, y + i, 1, 1);
  }

  drawProj(ctx, p, ox, oy) {
    const x = Math.round(ox + p.x), y = Math.round(oy + p.y);
    const t = this.time;
    if (p.kind === "disc" || p.kind === "boomer") {
      const w = (t >> 1) % 3 === 0 ? 8 : (t >> 1) % 3 === 1 ? 6 : 3;
      ctx.fillStyle = "#120e18"; ctx.fillRect(x - w - 1, y - 3, w * 2 + 2, 6);
      ctx.fillStyle = "#fff36b"; ctx.fillRect(x - w, y - 2, w * 2, 4);
      ctx.fillStyle = "#ff4f6d"; ctx.fillRect(x - 1, y - 1, 3, 2);
      ctx.fillStyle = "rgba(255,243,107,0.5)"; ctx.fillRect(x - Math.sign(p.vx) * 14, y, 10, 1);
      if (t % 2 === 0) this.fx.add({ x: p.x - Math.sign(p.vx) * 8, y: FLOOR_Y + p.y, col: "#3fe0d0", life: 8 });
    } else if (p.kind === "ember" || p.kind === "ash" || p.kind === "bigember") {
      const r = p.kind === "bigember" ? 6 : 3;
      disc(ctx, x, y, r + 1, "#5a1a08"); disc(ctx, x, y, r, (t >> 1) & 1 ? "#ff7a29" : "#ffb03a"); disc(ctx, x, y, Math.max(1, r - 2), "#fff3a0");
      if (t % 2 === 0) this.fx.add({ x: p.x - Math.sign(p.vx) * 4, y: FLOOR_Y + p.y + (Math.random() - 0.5) * 4, vx: -Math.sign(p.vx) * 0.5, vy: -0.3, col: Math.random() < 0.5 ? "#ff7a29" : "#6e6676", life: 14, type: Math.random() < 0.4 ? "smoke" : "px" });
    } else if (p.kind === "bullet") {
      ctx.fillStyle = "#fff3a0"; ctx.fillRect(x - 6, y - 1, 12, 2);
      ctx.fillStyle = "rgba(255,200,80,0.6)"; ctx.fillRect(x - Math.sign(p.vx) * 30, y, 26, 1);
    } else if (p.kind === "paperplane") {
      const d = Math.sign(p.vx);
      ctx.fillStyle = "#120e18"; ctx.fillRect(x - 7, y - 3, 14, 6);
      ctx.fillStyle = "#ffffff"; ctx.fillRect(x - 6, y - 2, 12, 2); ctx.fillRect(x - 6 + (d > 0 ? 0 : 6), y, 6, 2);
      ctx.fillStyle = "#c83a3a"; ctx.fillRect(x + d * 2, y - 2, 2, 1);
    } else if (p.kind === "bsod") {
      ctx.fillStyle = "#120e18"; ctx.fillRect(x - 8, y - 7, 16, 13);
      ctx.fillStyle = "#1f4fd8"; ctx.fillRect(x - 7, y - 6, 14, 11);
      ctx.fillStyle = "#ffffff"; ctx.fillRect(x - 5, y - 4, 3, 1); ctx.fillRect(x - 5, y - 1, 10, 1); ctx.fillRect(x - 5, y + 1, 7, 1); ctx.fillRect(x + 3, y - 4, 2, 2);
      if (t % 3 === 0) this.fx.add({ x: p.x - Math.sign(p.vx) * 8, y: FLOOR_Y + p.y + (Math.random() - 0.5) * 8, col: "#32f0ff", life: 10 });
    } else {
      disc(ctx, x, y, 4, "#ffffff");
    }
  }

  drawZone(ctx, z, ox, oy, S, front) {
    const x = Math.round(ox + z.x), t = this.time;
    const k = z.t / z.life;
    if (z.kind === "well" && !front) {
      const r = 6 + Math.sin(t * 0.3) * 1;
      disc(ctx, x, oy - 34, Math.round(r + 2), "#3a2aff"); disc(ctx, x, oy - 34, Math.round(r), "#08041a");
      ctx.fillStyle = "#9b8cff";
      for (let i = 0; i < 18; i++) { const an = i / 18 * Math.PI * 2 + t * 0.15, rr = 26 - ((t + i * 3) % 24); ctx.fillRect(Math.round(x + Math.cos(an) * rr), Math.round(oy - 34 + Math.sin(an) * rr * 0.6), 1, 1); }
      for (let i = 0; i < 2; i++) { const rr = 30 - ((t * 0.8 + i * 15) % 30); const n = 22; for (let j = 0; j < n; j++) { const an = j / n * Math.PI * 2; ctx.fillRect(Math.round(x + Math.cos(an) * rr), Math.round(oy - 34 + Math.sin(an) * rr * 0.5), 1, 1); } }
    } else if (z.kind === "antigrav" && !front) {
      const w = z.w / 2;
      ctx.fillStyle = "rgba(124,124,255,0.16)"; ctx.fillRect(x - w, oy - 140, z.w, 140);
      ctx.fillStyle = "#7c7cff";
      ctx.fillRect(x - w, oy - 2, z.w, 2);
      for (let i = 0; i < 16; i++) { const px = x - w + ((i * 37 + t) % z.w), py = oy - ((t * 1.2 + i * 23) % 130); ctx.fillStyle = i % 3 ? "#9b8cff" : "#ffffff"; ctx.fillRect(Math.round(px), Math.round(py), 1, 2); }
      for (let i = 0; i < 3; i++) { const yy = oy - ((t * 0.7 + i * 40) % 120); ctx.fillStyle = "#5a5aff"; for (let j = -w; j < w; j += 3) ctx.fillRect(x + j, Math.round(yy + Math.sin(j * 0.1) * 2), 2, 1); }
    } else if (z.kind === "paper" && !front) {
      const w = z.w / 2;
      ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.fillRect(x - w, oy - 150, z.w, 150);
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 12; i++) { const px = x - w + ((i * 41 + t * 0.6) % z.w), py = oy - 150 + ((t * 0.8 + i * 37) % 148); ctx.fillRect(Math.round(px), Math.round(py), (i + (t >> 3)) & 1 ? 3 : 2, 2); }
      const k2 = (z.t % 240) / 240; ctx.fillStyle = "#7aa7ff"; ctx.fillRect(x - w, oy - 2, Math.round(z.w * k2), 2); // countdown to next paper rain
    } else if (z.kind === "stink" && front) {
      const w = z.w / 2, fade = k > 0.85 ? (1 - k) / 0.15 : Math.min(1, z.t / 12);
      for (let i = 0; i < 18; i++) {
        const px = x - w + ((i * 47) % z.w) + Math.sin(t * 0.04 + i) * 5, py = oy - 6 - ((i * 23) % 50) + Math.cos(t * 0.05 + i) * 3;
        ctx.globalAlpha = 0.45 * fade; disc(ctx, px, py, 6 + (i % 3) * 2, i % 2 ? "#4e8f52" : "#7fbf5a");
      }
      ctx.globalAlpha = 1;
      if (t % 5 === 0) this.fx.add({ x: z.x + (Math.random() - 0.5) * z.w, y: FLOOR_Y - Math.random() * 40, vy: -0.4, col: "#65ff6e", life: 24 });
    } else if (z.kind === "smoke" && front) {
      const w = z.w / 2, fade = k > 0.85 ? (1 - k) / 0.15 : Math.min(1, z.t / 12);
      for (let i = 0; i < 26; i++) {
        const px = x - w + ((i * 53) % z.w) + Math.sin(t * 0.03 + i) * 6;
        const py = oy - 8 - ((i * 29) % 70) + Math.cos(t * 0.04 + i) * 3;
        const r = 7 + (i % 4) * 2;
        const pat = ((Math.floor(px) + Math.floor(py) + t / 8) | 0) & 1;
        ctx.globalAlpha = 0.55 * fade;
        disc(ctx, px, py, r, pat ? "#8a8a96" : "#6e6e7a");
      }
      ctx.globalAlpha = 1;
    }
  }

  drawStatus(ctx, f, ox, oy, anc) {
    if (!anc) return;
    const hx = Math.round(anc.head[0]), hy = Math.round(anc.head[1]);
    const t = this.time;
    if (f.st === "dizzy") {
      for (let i = 0; i < 3; i++) {
        const an = t * 0.12 + i * 2.1, x = hx + Math.round(Math.cos(an) * 10), y = hy - 12 + Math.round(Math.sin(an) * 3);
        ctx.fillStyle = "#ffe14d"; ctx.fillRect(x, y - 1, 1, 3); ctx.fillRect(x - 1, y, 3, 1);
      }
    }
    if (f.sx.silence > 0) { pixText(ctx, "...", hx - 5, hy - 22, "#60d7ff", 1); ctx.fillStyle = "#60d7ff"; ctx.fillRect(hx - 4, hy + 3, 9, 1); }
    if (f.sx.sad > 0) {
      const cy = hy - 26;
      disc(ctx, hx - 5, cy, 4, "#5f7ba8"); disc(ctx, hx + 2, cy - 2, 5, "#5f7ba8"); disc(ctx, hx + 8, cy, 3, "#5f7ba8");
      ctx.fillStyle = "#8ac0ff"; for (let i = -1; i <= 1; i++) ctx.fillRect(hx + i * 5, cy + 5 + ((t + i * 4) % 9), 1, 2);
    }
    if (f.sx.poison > 0 && t % 6 === 0) this.fx.add({ x: f.x + (Math.random() - 0.5) * 16, y: FLOOR_Y + f.y - 20 - Math.random() * 40, vy: -0.5, col: "#65ff6e", life: 16 });
    if (f.ch === "arbe" && f.st !== "down") {
      ctx.fillStyle = "rgba(40,0,30,0.55)";
      for (let i = 0; i < 18; i++) { const an = i / 18 * Math.PI * 2 - t * 0.02; const rr = 70 + Math.sin(t * 0.07 + i) * 3; ctx.fillRect(Math.round(ox + f.x + Math.cos(an) * rr), Math.round(oy + f.y - 30 + Math.sin(an) * 20), 2, 2); }
      if (t % 6 === 0) this.fx.add({ x: f.x + (Math.random() - 0.5) * 120, y: FLOOR_Y + f.y - Math.random() * 60, vy: -0.3, col: Math.random() < 0.5 ? "#3a0a2a" : "#c8283c", life: 30, type: "smoke", size: 0.7 });
    }
    if (this.aimT && this.aimT[0] === f.side && this.aimT[1]-- > 0 && (t & 1)) { ctx.fillStyle = "#ff2a3c"; const sy = Math.round(oy + f.y - 58); for (let xx = 0; xx < 300; xx += 3) ctx.fillRect(Math.round(ox + f.x + f.face * (30 + xx)), sy, 2, 1); }
    if (f.evo && t % 5 === 0) this.fx.add({ x: f.x + (Math.random() - 0.5) * 30, y: FLOOR_Y + f.y - Math.random() * 70, vy: -0.7, col: Math.random() < 0.5 ? "#ffd23f" : "#fff3a0", life: 22 });
    if (f.ch === "johan" && f.st !== "down") {
      ctx.fillStyle = "rgba(101,255,110,0.55)";
      for (let i = 0; i < 14; i++) { const an = i / 14 * Math.PI * 2 + t * 0.03; const rr = 50 + Math.sin(t * 0.1 + i) * 3; ctx.fillRect(Math.round(ox + f.x + Math.cos(an) * rr), Math.round(oy + f.y - 30 + Math.sin(an) * 18), 2, 2); }
      if (t % 7 === 0) this.fx.add({ x: f.x + (Math.random() - 0.5) * 60, y: FLOOR_Y + f.y - Math.random() * 50, vy: -0.4, col: Math.random() < 0.5 ? "#65ff6e" : "#2f9b3a", life: 26, size: 1 });
    }
    if (f.sx.confuse > 0) pixText(ctx, "?", hx - 1 + Math.round(Math.sin(t * 0.3) * 2), hy - 20, "#9b8cff", 2);
    if (f.sx.bleed > 0 && t % 10 === 0) this.fx.add({ x: f.x + (Math.random() - 0.5) * 10, y: FLOOR_Y + f.y - 44, vy: 0.3, g: 0.12, col: "#c8102e", life: 20 });
    if (f.sx.burn > 0 && t % 4 === 0) this.fx.add({ x: f.x + (Math.random() - 0.5) * 16, y: FLOOR_Y + f.y - 10 - Math.random() * 50, vy: -0.6, col: Math.random() < 0.5 ? "#ff7a29" : "#ffd27a", life: 14 });
    if (f.sx.slow > 0 && t % 6 === 0) this.fx.add({ x: f.x + (Math.random() - 0.5) * 20, y: FLOOR_Y + f.y, vy: -1, col: "#9b8cff", life: 30 });
    if (f.sx.rattled > 0 && t % 20 < 10) pixText(ctx, "#!", hx + 8, hy - 18, "#ff9a3c", 1);
    if (f.sx.counter > 0 && t % 4 < 2) { ctx.fillStyle = "#7fd3ff"; ctx.fillRect(hx - 10, hy + 70 - 76, 1, 1); }
    if (f.ch === "jiross" && f.sx.momentum > 0 && t % 8 === 0) this.fx.add({ x: f.x + (Math.random() - 0.5) * 12, y: FLOOR_Y + f.y - 50, vy: -0.8, col: "#ffcf5a", life: 18 });
    if (f.ch === "tanoy" && t % 12 === 0 && f.st !== "down") this.fx.add({ x: (anc.head[0] - ox) + f.face * 9, y: FLOOR_Y + f.y + (anc.head[1] - oy) + 3, vx: 0.1, vy: -0.4, col: "#9a9aa6", life: 30, type: "smoke", size: 0.6 });
    // speech bubble
    if (f.talk && f.talkT > 0) {
      const txt = f.talk.toUpperCase(), w = textW(txt, 1) + 8;
      let bx = Math.round(hx - w / 2), by = hy - 34;
      bx = Math.max(2, Math.min(VIEW_W - w - 2, bx));
      ctx.fillStyle = "#120e18"; ctx.fillRect(bx - 1, by - 1, w + 2, 11);
      ctx.fillStyle = "#ffffff"; ctx.fillRect(bx, by, w, 9);
      ctx.fillRect(hx - 1, by + 9, 3, 2); ctx.fillRect(hx, by + 11, 1, 2);
      pixText(ctx, txt, bx + 4, by + 2, f.ch === "william" ? "#3a2aff" : f.ch === "paulite" ? "#8a5a00" : "#c4501a", 1, null);
    }
  }
}
