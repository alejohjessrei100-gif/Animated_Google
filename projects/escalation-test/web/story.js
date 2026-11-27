// 5-second test of the escalation format ("If you X, you have Y. But... So you...") in the locked Ricks look.
// One side-on cutaway stage: the surface world above, the well shaft and the gold "vault" below. 30 fps, 1080x1920.
window.STORY = (() => {
  const FPS = 30, END = 5.0, TOTAL = Math.round(END * FPS);
  const Wd = WORLD, { rick } = TOON;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = (u) => { u = clamp(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
  const eout = (u) => 1 - Math.pow(1 - clamp(u), 3);
  const back = (u) => { u = clamp(u); return 1 + 2.70158 * Math.pow(u - 1, 3) + 1.70158 * Math.pow(u - 1, 2); };
  const lerp = (a, b, u) => a + (b - a) * u;
  const L3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const q = (v, s = 0.02) => Math.round(v / s) * s;
  const ramp = (t, a, b) => clamp((t - a) / (b - a));
  const pop = (t, a, d = 0.28) => (t < a ? 0 : back((t - a) / d));   /* scale-pop on the exact word */

  // ---------- word beats (from words.js) ----------
  const T_GOLD = 0.58, T_WELL = 1.26, T_VAULT = 2.24, T_BUT = 3.0, T_DROP = 3.6, T_BUCKET = 3.94, T_BONK = 4.32;

  // ---------- cast (locked Ricks style) ----------
  const C = {
    you: { outfit: 'vest', top: '#2f6b4f', hat: 'cap', hatCol: '#c62f36' },
    guard: { outfit: 'uniform', hat: 'gendarme', moustache: '#3a2a22' },
  };
  const SEED = { you: 0.4, guard: 1.77 };
  const blinkAt = (t, s) => ((t + s * 1.9) % 3.3) < 0.11;
  const lookAt = (t, s, base = 0) => q(clamp(base + 0.45 * Math.sin(t * 0.8 + s) + 0.25 * Math.sin(t * 2.3 + s * 3), -1, 1), 0.1);
  const pick = (t, sched) => { let v = sched[0][1]; for (const [a, x] of sched) if (t >= a) v = x; return v; };
  const arm = (t, sched) => { let prev = sched[0][1], cur = sched[0][1], ta = -9; for (const [a, p] of sched) if (t >= a) { prev = cur; cur = p; ta = a; } const x = clamp((t - ta) / 0.3), u = q(back(x), 0.02); return x >= 1 || prev === cur ? cur : { a: prev, b: cur, t: u }; };
  let CAMP = [0, 0, 10];
  const A = (id, t, x, y, z, o = {}) => {
    const s0 = SEED[id];
    const opts = { pose: o.pose || 'stand', expr: o.expr ? (Array.isArray(o.expr) ? pick(t, o.expr) : o.expr) : 'neutral', look: o.look ?? lookAt(t, s0, o.lookBase || 0),
      L: o.L ? (Array.isArray(o.L) ? arm(t, o.L) : o.L) : 'hang', R: o.R ? (Array.isArray(o.R) ? arm(t, o.R) : o.R) : 'hang', propL: o.propL || null, propR: o.propR || null,
      blink: !o.noBlink && blinkAt(t, s0), talk: 0, headTilt: q(o.tilt ?? 3 * Math.sin(t * 0.9 + s0), 0.5) };
    if (o.reach && o.reach.k > 0.001) { const r = o.reach, yaw = Math.atan2(CAMP[0] - x, CAMP[2] - z), rxv = Math.cos(yaw), rzv = -Math.sin(yaw);
      const mpu = 2.25 / 1000 * 1.1 * (o.s || 1); /* metres per rick unit */ let ux = ((r.to[0] - x) * rxv + (r.to[2] - z) * rzv) / mpu, uy = -(r.to[1] - y) / mpu; if (o.flip) ux = -ux;
      const side = ux >= 0 ? 'R' : 'L', pose = { to: [q(ux, 2), q(uy, 2)], k: q(r.k, 0.02), from: (side === 'R' ? (typeof opts.R === 'string' ? opts.R : 'hang') : (typeof opts.L === 'string' ? opts.L : 'hang')), bend: r.bend ?? 0.16, wob: q(Math.sin(t * 9) * 6 * (1 - r.k), 1) };
      opts[side] = pose; if (r.prop !== undefined) opts['prop' + side] = r.prop; }
    const sway = o.still ? 0 : Math.sin(t * 1.3 + s0) * 0.012, breath = o.still ? 0 : 0.012 * Math.sin(t * 2.3 + s0), lean = o.still ? 0 : 0.035 * Math.sin(t * 0.9 + s0 * 2);
    return { key: id + JSON.stringify(opts), x: x + sway, y: y + (o.hop || 0), z, s: o.s || 1, flip: o.flip, sq: (o.sq || 0) + breath, roll: (o.roll || 0) + lean, ground: o.ground ?? y,
      draw: (g) => { g.translate(300, 975); g.scale(1.1, 1.1); rick(g, C[id], opts); } };
  };

  // ---------- light ----------
  const LIGHT = { well: { sky: '#cfe8ff', ground: '#c9b58e', hemi: 1.35, sun: '#fff1d6', sunI: 2.1, az: -40, el: 58, fog: '#cfe6ff', bg: '#9fd0ff', fogNear: 30, fogFar: 90, sat: 1.1, fillI: 1.3, fillCol: '#fff0dc', shadowExt: 9, expo: 1.55 } };

  // ---------- camera: never still more than ~1 s; big re-aims are 0.14 s whips ----------
  const K = [
    { t: 0.0, set: 'well', pos: [0.35, -3.55, 3.4], look: [0.05, -3.85, -1.6], fov: 46, drift: [-0.25, 0.1, -0.6], roll: -1.5 },        // mid-action: coins raining on you
    { t: T_WELL, set: 'well', pos: [0.3, -2.9, 4.6], look: [0.0, -3.2, -1.6], fov: 50, drift: [-0.1, 0.25, 0.6], dlook: [0, 0.2, 0] },   // pull back: the shaft
    { t: T_VAULT, set: 'well', pos: [0.35, -3.1, 3.4], look: [0.05, -3.15, -1.8], fov: 46, drift: [-0.2, 0.05, -0.4], roll: 2 },          // push in: YOUR VAULT
    { t: T_BUT, set: 'well', pos: [2.2, 1.55, 3.6], look: [0.9, 1.55, -1.4], fov: 48, drift: [-0.35, 0.1, -0.5] },                         // whip up: the guard
    { t: T_DROP, set: 'well', ein: 0.25, pos: [1.6, 1.2, 4.6], look: [0.3, 0.6, -1.8], fov: 52, follow: true, whipIn: false }, // follows the falling bucket
    { t: T_BONK - 0.06, set: 'well', whipIn: true, pos: [0.4, -3.6, 3.1], look: [0.05, -3.75, -1.6], fov: 44, drift: [-0.15, 0.05, -0.3], roll: -2 },  // whip down: bonk
  ];
  K.forEach((k, i) => { k.t1 = i + 1 < K.length ? K[i + 1].t : END + 0.5; });
  const SHAKES = [[T_GOLD, 0.02], [T_VAULT, 0.012], [T_BUT, 0.03], [T_BONK, 0.08]];
  const IMPACTS = [T_BUT, T_BONK];
  const caAt = (t) => { let c = 0; for (const a of IMPACTS) if (t >= a && t < a + 0.35) c = Math.max(c, 0.018 * Math.exp(-(t - a) * 11)); return c; };
  const compAt = (t) => { let i = 0; for (let k = 0; k < K.length; k++) if (t >= K[k].t) i = k; return i; };
  let BUCK = [0, 1.6, -2];
  const compState = (k, t) => { if (k.follow) { const u = ease(ramp(t, k.t, k.t1)); return { pos: [lerp(1.3, 0.55, u), BUCK[1] + lerp(0.5, 0.25, u), lerp(4.4, 3.6, u)], look: [BUCK[0] * 0.5, BUCK[1] - lerp(0.2, 0.6, u), BUCK[2]], fov: 50, roll: lerp(0, -3, u) }; } const u = ease(clamp((t - k.t) / Math.max(0.6, k.t1 - k.t))) * 0.85 + clamp((t - k.t) / (k.t1 - k.t)) * 0.15; const d = k.drift || [0, 0, 0], dl = k.dlook || [0, 0, 0];
    return { pos: [k.pos[0] + d[0] * u, k.pos[1] + d[1] * u, k.pos[2] + d[2] * u], look: [k.look[0] + dl[0] * u, k.look[1] + dl[1] * u, k.look[2] + dl[2] * u], fov: k.fov, roll: k.roll || 0 }; };
  const WHIP = new Map(); const isWhip = (a, b) => { if (!a || !b) return false; if (b.whipIn !== undefined) return b.whipIn; const key = a.t + ':' + b.t; if (WHIP.has(key)) return WHIP.get(key); let w = a.set !== b.set; if (!w) { const pa = compState(a, b.t), pb = compState(b, b.t); const da = [pa.look[0] - pa.pos[0], pa.look[1] - pa.pos[1], pa.look[2] - pa.pos[2]], db = [pb.look[0] - pb.pos[0], pb.look[1] - pb.pos[1], pb.look[2] - pb.pos[2]]; const cs = (da[0] * db[0] + da[1] * db[1] + da[2] * db[2]) / (Math.hypot(...da) * Math.hypot(...db)); w = cs < 0.72 || Math.hypot(pa.pos[0] - pb.pos[0], pa.pos[1] - pb.pos[1], pa.pos[2] - pb.pos[2]) > 2.6; } WHIP.set(key, w); return w; };
  const camAt = (t) => {
    const i = compAt(t), k = K[i]; let s = compState(k, t), whip = [0, 0]; const prev = K[i - 1];
    const ein = k.ein || 0.45, WH = 0.14;
    const tilt = (st, ang) => { const dy = st.look[1] - st.pos[1]; return [st.look[0], st.pos[1] + dy + ang * 6, st.look[2]]; };
    if (prev && !isWhip(prev, k) && t - k.t < ein) { const p = compState(prev, k.t), u = ease((t - k.t) / ein); s = { pos: L3(p.pos, s.pos, u), look: L3(p.look, s.look, u), fov: lerp(p.fov, s.fov, u), roll: lerp(p.roll, s.roll, u) }; whip = [0.012 * Math.sin(u * Math.PI) * Math.sign(s.pos[0] - p.pos[0] || 1), 0]; }
    /* vertical stage: whips here are tilts (up to the surface, down the shaft) so the blur runs vertically */
    if (prev && isWhip(prev, k) && t - k.t < WH) { const u = 1 - (t - k.t) / WH, dir = Math.sign(prev.pos[1] - k.pos[1]) || 1; s.look = tilt(s, 0.45 * u * u * dir); whip = [0, 0.09 * u * dir]; }
    const next = K[i + 1]; if (next && isWhip(k, next) && next.t - t < WH) { const u = 1 - (next.t - t) / WH, dir = Math.sign(next.pos[1] - k.pos[1]) || 1; s.look = tilt(s, 0.45 * u * u * dir); whip = [0, 0.09 * u * dir]; }
    const hn = [Math.sin(t * 1.7) * 0.006 + Math.sin(t * 3.9) * 0.003, Math.sin(t * 2.3 + 1) * 0.005, Math.sin(t * 1.3 + 2) * 0.004];
    let sh = 0; for (const [a, amp] of SHAKES) if (t >= a && t < a + 0.5) sh += amp * Math.exp(-(t - a) * 9);
    const sx = Math.sin(t * 61) * sh, sy = Math.cos(t * 53) * sh;
    return { pos: [s.pos[0] + hn[0] + sx, s.pos[1] + hn[1] + sy, s.pos[2] + hn[2]], look: [s.look[0] + sx * 0.5, s.look[1] + sy * 0.5, s.look[2]], fov: s.fov, roll: s.roll + Math.sin(t * 0.55) * 1.2, set: k.set, whip };
  };
  const dofAt = (C) => { const d = Math.hypot(C.pos[0] - C.look[0], C.pos[1] - C.look[1], C.pos[2] - C.look[2]); return { focus: d, cinf: d < 1.2 ? 10 : d > 7 ? 4 : 7 }; };

  // ---------- world state ----------
  const GX = 0.05, GY = -4.5, GZ = -1.9, PILE = GY + 0.45;   /* gold pile base + top */
  const YOU = [0.05, PILE - 0.02, -1.55], HEAD = YOU[1] + 0.72;
  const SPARK = (bits, t, t0, c, n0, spread = 1) => bits.forEach((m, i) => { const r = PAINT.rng(i + n0); const u = t - t0; if (u < 0 || u > 0.7) { m.position.y = -50; return; } const a = r() * Math.PI * 2, sp = (0.8 + r() * 1.6) * spread; m.position.set(c[0] + Math.cos(a) * sp * u, c[1] + Math.abs(Math.sin(a)) * sp * u * 1.4 - 2.4 * u * u, c[2] + (r() - 0.5) * 0.4 + 0.25); m.scale.setScalar(Math.max(0.01, 1.4 * (1 - u / 0.7))); });
  const state = (t) => {
    // gold pile swells on "gold"; coins rain down the shaft and land on it (already falling at frame 0)
    Wd.gold.position.set(GX, GY, GZ); const gp = pop(t, T_GOLD, 0.3); Wd.gold.scale.set(0.8 + 0.25 * gp, 0.7 + 0.35 * gp, 0.8 + 0.25 * gp);
    Wd.coins.forEach((m, i) => { const r = PAINT.rng(i + 11), x = GX + (r() - 0.5) * 0.9, z = GZ + 0.5 + (r() - 0.5) * 0.4; const born = i < 8 ? -1.2 + i * 0.15 : T_GOLD - 0.4 + (i - 8) * 0.06; const tt = t - born; if (tt < 0) { m.position.y = -50; return; }
      let y = 0.6 - 4.9 * tt * tt * 0.9; const rest = PILE - 0.05 + (i % 5) * 0.03 - Math.abs(x - GX) * 0.3;
      if (y < rest) { y = rest; m.rotation.set(Math.PI / 2 - 0.25 + (i % 3) * 0.2, 0, i); } else m.rotation.set(tt * 9 + i, tt * 4, tt * 6); m.position.set(x, y, z); });
    // sparks: the gold burst, then the sign burst
    SPARK(Wd.sparks.slice(0, 12), t, T_GOLD, [GX, PILE + 0.1, GZ + 0.6], 3, 1.0);
    SPARK(Wd.sparks.slice(12), t, T_VAULT, [0, -2.85, -2.3], 40, 1.1);
    Wd.goldLight.intensity = 2.2 + 2.5 * Math.exp(-Math.max(0, t - T_GOLD) * 4) * (t >= T_GOLD ? 1 : 0) + 0.3 * Math.sin(t * 6);
    // YOUR VAULT sign pops in on "vault"
    Wd.vault.visible = t >= T_VAULT; Wd.vault.scale.setScalar(Math.max(0.001, pop(t, T_VAULT, 0.3))); Wd.vault.rotation.z = 0.06 * Math.sin(t * 3);
    // the danger cue: red "!" + light on "But"
    Wd.warn.visible = t >= T_BUT; Wd.warn.scale.setScalar(Math.max(0.001, pop(t, T_BUT, 0.22))); Wd.warn.position.y = 2.75 + 0.06 * Math.sin(t * 9); Wd.warn.rotation.z = 0.12 * Math.sin(t * 13);
    Wd.warnLight.intensity = t >= T_BUT ? 6 * (0.6 + 0.4 * Math.sin(t * 16)) : 0;
    // bucket: hangs, the guard lets go on "drop", it falls the shaft (crank spins), bonks you
    const fallU = ramp(t, T_DROP + 0.05, T_BONK), by0 = 1.6, by1 = HEAD + 0.12;
    let by = lerp(by0, by1, fallU * fallU), bz = lerp(-2, YOU[2] - 0.05, eout(fallU)), bx = lerp(0, YOU[0] + 0.02, fallU);
    if (t >= T_BONK) { const b = t - T_BONK; by = by1 + Math.abs(Math.sin(b * 14)) * 0.12 * Math.exp(-b * 6); }
    Wd.bucket.position.set(bx, by, bz); BUCK = [bx, by, bz]; Wd.bucket.rotation.set(t >= T_BONK ? 0.15 * Math.exp(-(t - T_BONK) * 4) * Math.sin((t - T_BONK) * 20) : 0.05 * Math.sin(t * 2), 0, t < T_DROP ? 0.04 * Math.sin(t * 2.2) : 0.1 * Math.sin(t * 11) * (1 - fallU));
    Wd.crank.rotation.x = t < T_DROP ? 0.15 * Math.sin(t * 1.5) : -Math.pow(t - T_DROP, 1.6) * 40 * (t < T_BONK ? 1 : 0) - (t >= T_BONK ? Math.pow(T_BONK - T_DROP, 1.6) * 40 : 0);
    { const top = [0, 2.15, -2], bot = [bx, by + 0.18, bz]; const dx = bot[0] - top[0], dy = bot[1] - top[1], dz = bot[2] - top[2], len = Math.hypot(dx, dy, dz); Wd.rope.position.set((top[0] + bot[0]) / 2, (top[1] + bot[1]) / 2, (top[2] + bot[2]) / 2); Wd.rope.scale.set(1, len, 1); Wd.rope.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / len, dy / len, dz / len)); }
    // dust puff on the bonk
    Wd.dust.forEach((m, i) => { const r = PAINT.rng(i + 90), u = t - T_BONK; if (u < 0 || u > 0.8) { m.position.y = -50; return; } const a = r() * Math.PI * 2; m.position.set(YOU[0] + Math.cos(a) * (0.2 + u * 1.1), HEAD + 0.1 + u * 0.5 * r(), YOU[2] + 0.2 + Math.sin(a) * 0.2); m.scale.setScalar(Math.max(0.01, (0.6 + u * 1.5) * (1 - u / 0.8))); });
  };

  // ---------- actors ----------
  const actors = (t) => {
    const L = []; const bonk = t >= T_BONK, sq = bonk ? -0.22 * Math.exp(-(t - T_BONK) * 7) : 0;
    L.push(A('you', t, YOU[0], YOU[1], YOU[2], { pose: 'sit', s: 0.7, sq, hop: t < T_WELL ? Math.abs(Math.sin(t * 6)) * 0.04 : 0,
      expr: [[0, 'grin'], [T_GOLD, 'beam'], [T_WELL, 'smugsmile'], [T_VAULT, 'smirk'], [T_BONK, 'shock']],
      L: [[0, 'up'], [T_WELL, 'hip'], [T_BONK, 'up']], R: [[0, 'up'], [T_WELL, 'holdUp'], [T_VAULT, 'thumb'], [T_BONK, 'up']], propR: t >= T_WELL && t < T_VAULT ? 'coin' : null, lookBase: t >= T_VAULT && t < T_BONK ? 0.6 : 0 }));
    const g = t >= T_BUT - 0.15;   /* guard only on the surface shot */
    if (g) { const grab = t < T_DROP + 0.25 ? eout(ramp(t, T_BUT + 0.1, T_BUT + 0.35)) - eout(ramp(t, T_DROP, T_DROP + 0.2)) : 0;
      L.push(A('guard', t, 1.55, 0, -0.9, { expr: [[0, 'sly'], [T_DROP, 'laugh']], L: [[0, 'hip'], [T_DROP + 0.2, 'point']], R: 'hang', lookBase: -0.8, flip: true,
        reach: grab > 0.001 ? { to: [0.95, 1.95, -2], k: grab, bend: 0.14 } : null })); }
    return L;
  };

  // ---------- captions (1-2 words, Lilita One, white with black outline, y~1300) ----------
  const CAPS = (() => { const out = []; const W = window.WORDS; for (let i = 0; i < W.length;) { const a = W[i], b = W[i + 1]; const clean = (s) => s.replace(/,(?!\d)/g, '').replace(/\.$/, ''); const short = (s) => clean(s).length <= 4; if (b && short(a[0]) && clean(a[0] + b[0]).length <= 11 && !/[.?!,]$/.test(a[0]) && b[1] - a[2] < 0.25) { out.push({ t: a[1], txt: clean(a[0]) + ' ' + clean(b[0]) }); i += 2; } else { out.push({ t: a[1], txt: clean(a[0]) }); i += 1; } } out.forEach((c, k) => { c.e = k + 1 < out.length ? out[k + 1].t : END; }); return out; })();
  const drawCaption = (g, t, W, H) => {
    const c = CAPS.find((c) => t >= c.t && t < c.e && t < c.t + 1.2); if (!c) return;
    const u = clamp((t - c.t) / 0.09), s = 0.88 + 0.12 * eout(u); const fs = Math.round(61 * W / 1080);
    g.save(); g.translate(W / 2, H * 1300 / 1920); g.scale(s, s); g.font = `${fs}px "Lilita One", Impact, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    let f = 1; const mw = g.measureText(c.txt).width; if (mw > W * 0.86) f = W * 0.86 / mw; g.scale(f, f);
    g.lineJoin = 'round'; g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = fs * 0.18; g.shadowOffsetY = fs * 0.06; g.lineWidth = fs * 0.24; g.strokeStyle = '#000'; g.strokeText(c.txt, 0, 0); g.shadowColor = 'transparent'; g.fillStyle = '#fff'; g.fillText(c.txt, 0, 0); g.restore();
  };

  const frame = (f) => {
    const t = f / FPS; state(t); const Cm = camAt(t); Wd.tick(t); CAMP = Cm.pos;
    return { t, cam: Cm, light: { ...LIGHT.well }, dof: dofAt(Cm), actors: actors(t), whip: Cm.whip, flash: 0, ca: caAt(t) };
  };
  const SHOTS = [{ t: 0, set: 'well' }];
  return { FPS, END, TOTAL, frame, drawCaption, K, SHOTS, CAPS };
})();
