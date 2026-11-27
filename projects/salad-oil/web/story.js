// Shot plan for "The Tanks Full of Seawater That Fooled Wall Street" — timed to the 1.25x voice (words.js). 30 fps, 1080x1920.
// Every clause gets a story action + a camera move. Set changes and big re-aims are speed whips; inside a set, fast eased moves + drift.
window.STORY = (() => {
  const FPS = 30, END = 49.38, TOTAL = Math.round(END * FPS);
  const Wd = WORLD, { rick, PROPS } = TOON;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = (u) => { u = clamp(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
  const eout = (u) => 1 - Math.pow(1 - clamp(u), 3);
  const lerp = (a, b, u) => a + (b - a) * u;
  const L3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const q = (v, s = 0.02) => Math.round(v / s) * s;
  const ramp = (t, a, b) => clamp((t - a) / (b - a));
  const pulse = (t, a, d = 0.25) => (t >= a && t < a + d ? Math.sin((t - a) / d * Math.PI) : 0);

  // ---------- cast (new for this video, locked Ricks style) ----------
  const C = {
    tino: { outfit: 'suit', top: '#c9a46a', tie: '#2f6b4f', shirt: '#f6f3ee', hat: 'fedora', hatCol: '#5a3b2a', band: '#c62f36', moustache: '#3a2a22' },
    insp1: { outfit: 'trench', top: '#8a9aa8', hat: 'cap', hatCol: '#2a5fae', glasses: 'round' },
    insp2: { outfit: 'vest', top: '#5c6b7a', hat: 'hardhat' },
    bank1: { outfit: 'suit', top: '#2b2f3d', tie: '#c62f36', hat: 'tophat', moustache: '#9a958c' },
    bank2: { outfit: 'suit', top: '#3d5a80', tie: '#f4d35e', hat: 'bowler', hatCol: '#2a2428' },
    bank3: { outfit: 'suit', top: '#5a3b5a', tie: '#e5c158', hairStyle: 'bald', hair: '#c9c2b5', glasses: 'round' },
    exec: { outfit: 'suit', top: '#26304d', tie: '#e5c158', shirt: '#f6f3ee', hat: 'slick', hair: '#2a1d17' },
    kid1: { kid: true, outfit: 'tee', top: '#e07a5f', pants: '#3b3f52', hairStyle: 'spiky', hair: '#8a5a32' },
    kid2: { kid: true, outfit: 'dress', top: '#3fa39a', hairStyle: 'pigtails', hair: '#5a3b2a' },
    tr1: { outfit: 'school', top: '#ffffff', tie: '#c62f36', hair: '#2a1d17' },
    tr2: { outfit: 'school', top: '#f4f1e8', tie: '#2a5fae', hairStyle: 'curly', hair: '#1e1714' },
    tr3: { outfit: 'school', top: '#ffffff', tie: '#2f6b4f', hairStyle: 'bald', hair: '#c9c2b5', glasses: 'round' },
    tr4: { outfit: 'vest', top: '#c62f36', hat: 'cap', hatCol: '#f4d35e' },
    tr5: { outfit: 'school', top: '#f6f1e6', tie: '#6b3c8f', hair: '#c9893a' },
    buffett: { outfit: 'suit', top: '#6f7a86', tie: '#c62f36', shirt: '#f6f3ee', hair: '#e8e4dc', glasses: 'round' },
  };
  const SEED = Object.fromEntries(Object.keys(C).map((k, i) => [k, i * 1.37 + 0.4]));
  const blinkAt = (t, s) => ((t + s * 1.9) % 3.3) < 0.11;
  const lookAt = (t, s, base = 0) => q(clamp(base + 0.45 * Math.sin(t * 0.8 + s) + 0.25 * Math.sin(t * 2.3 + s * 3), -1, 1), 0.1);
  const talkAt = (t, ranges) => { for (const [a, b] of ranges || []) if (t >= a && t <= b) { const v = Math.sin((t - a) * 21) * 0.5 + 0.5; return v > 0.55 ? 1 : v > 0.2 ? 0.4 : 0; } return 0; };
  const pick = (t, sched) => { let v = sched[0][1]; for (const [a, x] of sched) if (t >= a) v = x; return v; };
  const arm = (t, sched) => { let prev = sched[0][1], cur = sched[0][1], ta = -9; for (const [a, p] of sched) if (t >= a) { prev = cur; cur = p; ta = a; } const u = q(eout((t - ta) / 0.25), 0.02); return u >= 1 || prev === cur ? cur : { a: prev, b: cur, t: u }; };
  const A = (id, t, x, y, z, o = {}) => {
    const s0 = SEED[id];
    const opts = { pose: o.pose || 'stand', expr: o.expr ? (Array.isArray(o.expr) ? pick(t, o.expr) : o.expr) : 'neutral', look: o.look ?? lookAt(t, s0, o.lookBase || 0),
      L: o.L ? (Array.isArray(o.L) ? arm(t, o.L) : o.L) : 'hang', R: o.R ? (Array.isArray(o.R) ? arm(t, o.R) : o.R) : 'hang', propL: o.propL || null, propR: o.propR || null,
      blink: !o.noBlink && blinkAt(t, s0), talk: talkAt(t, o.talk), headTilt: q(o.tilt ?? 3 * Math.sin(t * 0.9 + s0), 0.5) };
    if (o.walk != null) opts.walk = q(o.walk % 1, 0.02);
    const sway = o.still ? 0 : Math.sin(t * 1.3 + s0) * 0.012, breath = o.still ? 0 : 0.012 * Math.sin(t * 2.3 + s0) + (opts.talk ? 0.01 * Math.sin(t * 11) : 0), lean = o.still ? 0 : 0.035 * Math.sin(t * 0.9 + s0 * 2);
    return { key: id + JSON.stringify(opts), x: x + sway, y: y + (o.hop || 0), z, s: o.s || 1, flip: o.flip, sq: (o.sq || 0) + breath, roll: (o.roll || 0) + lean, ground: o.ground ?? y,
      draw: (g) => { g.translate(300, 975); g.scale(1.1, 1.1); rick(g, C[id], opts); } };
  };
  const roofY = (x, z) => { const mt = { x: 2.6, z: -6.0 }; const d = Math.hypot(x - mt.x, z - mt.z); return 5.05 - 0.45 * Math.min(d, 2.06) / 2.06 + 0.03; };
  const walkTo = (t, t0, t1, p0, p1) => { const u = ramp(t, t0, t1); return { p: L3(p0, p1, ease(u)), walk: u > 0 && u < 1 ? (t - t0) * 1.6 : null }; };

  // ---------- lights per set ----------
  const DAY = { sky: '#cfe8ff', ground: '#c9b58e', hemi: 1.3, sun: '#fff1d6', sunI: 2.1, az: -40, el: 52, fog: '#cfe6ff', bg: '#9fd0ff', fogNear: 25, fogFar: 90, sat: 1.1, fillI: 1.0, shadowExt: 12, expo: 1.5 };
  const LIGHT = {
    farm: { ...DAY }, cut: { ...DAY, shadowExt: 8 }, banks: { ...DAY, az: -55, el: 48 },
    amex: { expo: 1.65, sky: '#fff2e0', ground: '#9a7a5a', hemi: 1.4, sun: '#ffe8c8', sunI: 1.4, az: -60, el: 60, fog: '#6a5040', bg: '#4a3a30', fogNear: 10, fogFar: 30, sat: 1.06, fillCol: '#ffe8c8', fillI: 2.0, shadowExt: 7 },
    kitchen: { expo: 1.5, sky: '#ffffff', ground: '#c8d8de', hemi: 1.5, sun: '#fff6e8', sunI: 1.6, az: -40, el: 55, fog: '#e6f2f6', bg: '#d8ecf2', fogNear: 12, fogFar: 30, sat: 1.08, fillI: 1.5, shadowExt: 6 },
    exchange: { expo: 1.7, sky: '#e8eeff', ground: '#8a90b0', hemi: 1.45, sun: '#fff0dc', sunI: 1.5, az: -50, el: 62, fog: '#3a4470', bg: '#2a3260', fogNear: 14, fogFar: 40, sat: 1.12, fillCol: '#ffe0c0', fillI: 2.2, shadowExt: 9 },
    omaha: { expo: 1.55, sky: '#fff4e4', ground: '#a88a6a', hemi: 1.4, sun: '#ffe6c0', sunI: 1.5, az: -35, el: 50, fog: '#7a6050', bg: '#5a4436', fogNear: 10, fogFar: 28, sat: 1.08, fillCol: '#ffe8c8', fillI: 2.0, shadowExt: 6 },
  };

  // ---------- camera compositions ----------
  const K = [
    { t: 0.0, set: 'banks', pos: [51.6, 1.5, 4.0], look: [50.4, 1.45, 0.0], fov: 46, drift: [-0.6, 0.15, -0.8] },
    { t: 0.76, set: 'banks', pos: [50.2, 2.05, 3.9], look: [50.1, 1.95, -1.0], fov: 50, drift: [0, 0.1, -0.4], roll: 2 },
    { t: 2.32, set: 'farm', pos: [-6, 7.5, 6], look: [1, 3, -6], fov: 50, drift: [6, -1.0, -1] },
    { t: 3.76, set: 'farm', pos: [3.6, 1.6, 0.2], look: [2.6, 3.0, -4.0], fov: 46, drift: [-0.6, 0.3, 0.2], roll: -2 },
    { t: 5.08, set: 'cut', pos: [25, 3.4, 7.5], look: [25, 3.0, -2.4], fov: 50, drift: [-0.35, 0.28, -2.00] },
    { t: 7.3, set: 'farm', pos: [-10.5, 1.9, 4.2], look: [-12.9, 1.7, -0.4], fov: 50, drift: [0.73, 0.00, -0.36], roll: 1.5 },
    { t: 9.2, set: 'farm', pos: [0.9, 1.3, 3.6], look: [0.6, 2.4, -3.0], fov: 52, drift: [-0.86, 0.78, 0.54], dlook: [0, 0.8, 0] },
    { t: 11.5, set: 'farm', pos: [2.2, 1.8, 3.4], look: [1.25, 1.4, -2.0], fov: 52, drift: [-0.63, 0.04, 0.39], roll: -1.5 },
    { t: 14.0, set: 'farm', pos: [4.7, 1.4, -0.8], look: [3.2, 1.7, -3.9], fov: 50, drift: [0, 3.6, 0.3], dlook: [0, 3.3, 0] },
    { t: 15.0, set: 'farm', pos: [4.2, 6.5, -3.0], look: [2.6, 5.1, -6.0], fov: 48, drift: [0.17, 0.17, 0.77], ein: 0.3 },
    { t: 16.7, set: 'farm', pos: [4.6, 6.0, -2.2], look: [3.3, 5.8, -5.4], fov: 44, drift: [-0.58, 0.00, 0.39], roll: 2 },
    { t: 18.9, set: 'farm', pos: [1.0, 1.65, 1.8], look: [1.6, 1.8, -2.4], fov: 46, drift: [0.2, 0.1, -0.3] },
    { t: 20.5, set: 'cut', pos: [25.4, 8.2, -0.4], look: [25, 6.0, -2.6], fov: 46, drift: [-0.25, -0.52, 0.43] },
    { t: 21.9, set: 'cut', pos: [25.9, 5.3, 1.8], look: [25, 5.2, -2.6], fov: 42, drift: [-0.49, 0.01, 0.21], roll: 1.5 },
    { t: 24.0, set: 'cut', pos: [25.2, 3.4, 3.6], look: [25, 2.6, -2.6], fov: 50, drift: [-0.35, -0.78, -0.51], dlook: [0, -0.6, 0] },
    { t: 25.95, set: 'banks', pos: [56, 3.0, 7], look: [50, 2.6, -4], fov: 52, drift: [-3, 0, -1] },
    { t: 27.55, set: 'amex', pos: [76.6, 1.65, 1.6], look: [75.0, 1.25, -1.6], fov: 46, drift: [-0.64, 0.18, 0.15] },
    { t: 30.2, set: 'amex', pos: [76.3, 2.0, 1.1], look: [75.1, 1.45, -1.6], fov: 46, drift: [0.2, 0.2, -0.2], roll: -2 },
    { t: 31.3, set: 'farm', pos: [-0.6, 6.7, -0.8], look: [2.4, 5.4, -5.6], fov: 50, drift: [1.27, 0.00, 0.60] },
    { t: 33.7, set: 'kitchen', pos: [-24.6, 1.7, 1.9], look: [-25, 1.15, -1.4], fov: 40, drift: [-0.03, 0.07, 0.18] },
    { t: 36.2, set: 'kitchen', ein: 0.2, pos: [-25.85, 1.55, 2.6], look: [-25.15, 1.05, -0.8], fov: 54, drift: [0.4, 0.05, -0.2], roll: 2 },
    { t: 37.5, set: 'kitchen', pos: [-24.0, 1.1, -0.1], look: [-25, 1.15, -1.4], fov: 40, drift: [-0.28, 0.00, 0.34] },
    { t: 38.7, set: 'farm', pos: [6.8, 3.0, 6.0], look: [2.6, 2.6, -5.0], fov: 50, drift: [-1, 0.3, -0.6] },
    { t: 39.9, set: 'exchange', pos: [100.6, 2.3, 5.2], look: [100, 2.4, -3.0], fov: 52, drift: [-0.4, 0.2, -0.8] },
    { t: 42.24, set: 'exchange', pos: [96.4, 1.9, 4.4], look: [100.2, 1.4, -0.6], fov: 52, drift: [1.4, 0, 0] },
    { t: 43.55, set: 'omaha', pos: [125.9, 1.5, 1.4], look: [125, 1.25, -1.9], fov: 44, drift: [-0.62, 0.10, 0.10] },
    { t: 44.6, set: 'omaha', pos: [124.1, 1.85, 1.2], look: [124.8, 1.25, -1.4], fov: 48, drift: [-0.02, 0.33, 0.61], roll: -2 },
    { t: 47.3, set: 'omaha', pos: [124.6, 1.28, -0.05], look: [124.25, 1.0, -1.1], fov: 42, drift: [-0.43, 0.03, 0.26] },
  ];
  K.forEach((k, i) => { k.t1 = i + 1 < K.length ? K[i + 1].t : END + 0.5; });
  const SHAKES = [[0.0, 0.02], [15.1, 0.02], [28.58, 0.025], [38.98, 0.09], [40.64, 0.04], [44.66, 0.05], [21.48, 0.015]];
  const IMPACTS = [38.98, 44.66];
  const caAt = (t) => { let c = 0; for (const a of IMPACTS) if (t >= a && t < a + 0.35) c = Math.max(c, 0.018 * Math.exp(-(t - a) * 11)); return c; };
  const compAt = (t) => { let i = 0; for (let k = 0; k < K.length; k++) if (t >= K[k].t) i = k; return i; };
  const compState = (k, t) => { const u = ease(clamp((t - k.t) / Math.max(0.6, k.t1 - k.t))) * 0.85 + clamp((t - k.t) / (k.t1 - k.t)) * 0.15; const d = k.drift || [0, 0, 0], dl = k.dlook || [0, 0, 0];
    return { pos: [k.pos[0] + d[0] * u, k.pos[1] + d[1] * u, k.pos[2] + d[2] * u], look: [k.look[0] + dl[0] * u, k.look[1] + dl[1] * u, k.look[2] + dl[2] * u], fov: k.fov, roll: k.roll || 0 }; };
  const WHIP = new Map(); const isWhip = (a, b) => { if (!a || !b) return false; const key = a.t + ':' + b.t; if (WHIP.has(key)) return WHIP.get(key); let w = a.set !== b.set; if (!w) { const pa = compState(a, b.t), pb = compState(b, b.t); const da = [pa.look[0] - pa.pos[0], pa.look[1] - pa.pos[1], pa.look[2] - pa.pos[2]], db = [pb.look[0] - pb.pos[0], pb.look[1] - pb.pos[1], pb.look[2] - pb.pos[2]]; const cs = (da[0] * db[0] + da[1] * db[1] + da[2] * db[2]) / (Math.hypot(...da) * Math.hypot(...db)); w = cs < 0.72 || Math.hypot(pa.pos[0] - pb.pos[0], pa.pos[1] - pb.pos[1], pa.pos[2] - pb.pos[2]) > 2.6; } WHIP.set(key, w); return w; };
  const camAt = (t) => {
    const i = compAt(t), k = K[i]; let s = compState(k, t), whip = [0, 0]; const prev = K[i - 1];
    const ein = k.ein || 0.45, WH = 0.14;
    const yawLook = (st, ang) => { const dx = st.look[0] - st.pos[0], dz = st.look[2] - st.pos[2], c = Math.cos(ang), s_ = Math.sin(ang); return [st.pos[0] + dx * c - dz * s_, st.look[1], st.pos[2] + dx * s_ + dz * c]; };
    if (prev && !isWhip(prev, k) && t - k.t < ein) { const p = compState(prev, k.t), u = ease((t - k.t) / ein); s = { pos: L3(p.pos, s.pos, u), look: L3(p.look, s.look, u), fov: lerp(p.fov, s.fov, u), roll: lerp(p.roll, s.roll, u) }; whip = [0.012 * Math.sin(u * Math.PI) * Math.sign(s.pos[0] - p.pos[0] || 1), 0]; }
    if (prev && isWhip(prev, k) && t - k.t < WH) { const u = 1 - (t - k.t) / WH; s.look = yawLook(s, 0.45 * u * u); whip = [0.09 * u, 0]; }
    const next = K[i + 1]; if (next && isWhip(k, next) && next.t - t < WH) { const u = 1 - (next.t - t) / WH; s.look = yawLook(s, -0.45 * u * u); whip = [0.09 * u, 0]; }
    const hn = [Math.sin(t * 1.7) * 0.006 + Math.sin(t * 3.9) * 0.003, Math.sin(t * 2.3 + 1) * 0.005, Math.sin(t * 1.3 + 2) * 0.004];
    let sh = 0; for (const [a, amp] of SHAKES) if (t >= a && t < a + 0.5) sh += amp * Math.exp(-(t - a) * 9);
    const sx = Math.sin(t * 61) * sh, sy = Math.cos(t * 53) * sh;
    return { pos: [s.pos[0] + hn[0] + sx, s.pos[1] + hn[1] + sy, s.pos[2] + hn[2]], look: [s.look[0] + sx * 0.5, s.look[1] + sy * 0.5, s.look[2]], fov: s.fov, roll: s.roll + Math.sin(t * 0.55) * 1.2, set: k.set, whip };
  };
  const dofAt = (C) => { const d = Math.hypot(C.pos[0] - C.look[0], C.pos[1] - C.look[1], C.pos[2] - C.look[2]); return { focus: d, cinf: d < 1.2 ? 10 : d > 7 ? 4 : 7 }; };

  // ---------- world state per set ----------
  const fall = (bits, t, t0, area, seedOff = 0, speed = 1) => bits.forEach((m, i) => { const r = PAINT.rng(i + seedOff); if (t < t0) { m.position.y = -50; return; } const tt = (t - t0) * (0.5 + r() * 0.4) * speed + r() * 0.8; m.position.set(area[0] + r() * area[1] + Math.sin(tt * 2 + i) * 0.25, area[2] - tt * 1.3, area[3] + r() * area[4]); m.rotation.set(tt * 4 + i, tt * 3, tt * 5); if (m.position.y < 0.02) m.position.y = 0.02 + (i % 7) * 0.004; });
  const farmState = (t) => {
    Wd.waterU.t.value = t; Wd.ship.position.x = 14 - t * 0.12;
    Wd.runSmoke(Wd.shipSmoke, t, Wd.ship.position.x - 4, 6.8, -40, 3, 0.6, 0.25, 3);
    Wd.gulls.forEach((g, i) => { if (i === 0 && t >= 18.3 && t < 21) { const u = eout(ramp(t, 18.3, 18.8)); g.g.position.set(lerp(-2, 3.7, u), lerp(9, 5.55, u), lerp(-2, -5.0, u)); const f = u < 1 ? Math.sin(t * 16) * 0.8 : 0; g.w1.rotation.x = f; g.w2.rotation.x = -f; g.g.rotation.y = -0.6; return; }
      const u = (t * (0.05 + (i % 3) * 0.02) + i * 0.21) % 1; g.g.position.set(-22 + u * 44, (i > 4 ? 6.2 : 8) + Math.sin(t * 0.6 + i) * 0.8 + (i % 5) * 0.4, (i > 4 ? -3 : -10) - (i % 5) * 1.5); g.g.rotation.y = 0; const f = Math.sin(t * 9 + i) * 0.7; g.w1.rotation.x = f; g.w2.rotation.x = -f; });
    const mt = Wd.mainTank;
    mt.lid.rotation.z = t >= 15.1 && t < 31 ? Math.min(1.9, eout(ramp(t, 15.1, 15.5)) * 1.9) : 0;
    const dp = Wd.dipstick; if (t >= 15.5 && t < 18.9) { const down = eout(ramp(t, 15.9, 16.3)) - eout(ramp(t, 16.6, 17.0)); dp.position.set(mt.x + 0.5 - (t > 16.6 ? 0.25 * eout(ramp(t, 16.6, 17.0)) : 0), mt.h + 1.4 - down * 1.1 + (t > 16.6 ? 0.2 : 0), mt.z + 0.75); dp.rotation.set(0.15, 0, t > 16.6 ? -0.5 : 0.05); } else dp.position.y = -50;
    Wd.gallonSign.visible = t >= 12.6 && t < 14.2; if (Wd.gallonSign.visible) Wd.gallonSign.scale.setScalar(eout(ramp(t, 12.6, 12.9)));
    fall(Wd.tankBills, t >= 9.2 && t < 14.2 ? t : -1, 9.2, [-0.8, 3.6, 4.2, -3.2, 2.4], 50);
    // collapse at 38.98: the tank skin crumples and seawater bursts out
    const g = mt.g, c = ramp(t, 38.98, 39.5);
    if (t >= 38.9 && t < 40.5) { g.scale.set(1 + c * 0.12, 1 - eout(c) * 0.55, 1 + c * 0.12); g.rotation.z = Math.sin(c * 9) * 0.04 * c; } else { g.scale.set(1, 1, 1); g.rotation.z = 0; }
    Wd.splash.forEach((s, i) => { const r = PAINT.rng(i + 7); if (t < 38.98 || t > 40.4) { s.position.y = -50; return; } const tt = t - 38.98, a = r() * 6.28, v = 2 + r() * 3.5; s.position.set(mt.x + Math.cos(a) * (1.8 + v * 1.4 * tt), Math.max(0.05, 0.8 + (2.5 + r() * 4) * tt - 4.9 * tt * tt), mt.z + Math.sin(a) * (1.8 + v * 1.4 * tt) * 0.8 + 1.0); const sc = 0.25 + r() * 0.45; s.scale.set(sc, sc * 0.7, sc); });
    Wd.wave.position.y = t >= 38.98 && t < 40.5 ? 0.02 : -50; const wr = 2 + ramp(t, 38.98, 40.0) * 7; Wd.wave.scale.set(wr, 1, wr * 0.8);
  };
  const cutState = (t) => {
    Wd.fish.forEach((f, i) => { const sp = 0.25 + i * 0.05, u = (t * sp + i * 0.3) % 1, dir = i % 2 ? 1 : -1; f.position.set(dir * (2.2 - u * 4.4), 0.55 + (i % 8) * 0.5 + Math.sin(t * 2 + i) * 0.1, -2.3 - (i % 3) * 0.6); f.rotation.y = dir > 0 ? Math.PI : 0; f.rotation.z = Math.sin(t * 6 + i) * 0.08; });
    Wd.bubbles.forEach((b, i) => { const r = PAINT.rng(i + 2), u = (t * (0.15 + r() * 0.1) + r()) % 1; b.position.set(-2.3 + r() * 4.6, 0.2 + u * 4.7, -2.2 - r() * 2.4); b.scale.setScalar(0.6 + r() * 0.8); });
    Wd.crab.position.x = 1.4 + Math.sin(t * 0.8) * 0.6; Wd.crab.rotation.y = Math.sin(t * 0.8) > 0 ? 0.3 : -0.3;
    Wd.cutLabelOil.scale.setScalar(t >= 22.6 ? eout(ramp(t, 22.6, 22.9)) : (t < 20 ? 1 : 0.001));
    Wd.cutLabelSea.scale.setScalar(t >= 24.9 ? eout(ramp(t, 24.9, 25.2)) : (t < 20 ? 1 : 0.001));
    Wd.oilChamber.material.emissiveIntensity = t > 22.3 && t < 24 ? 0.6 + 0.3 * Math.sin(t * 10) : 0.25;
  };
  const banksState = (t) => {
    fall(Wd.bankBills, t < 2.4 ? t : (t >= 25.9 && t < 27.6 ? t : -1), t < 2.4 ? -0.6 : 25.9, [-4, 8, 6.0, -3, 5], 9);
    Wd.bigNum.scale.setScalar(t < 2.4 ? eout(ramp(t, 0.7, 1.0)) || 0.001 : 1);
    Wd.count51.scale.setScalar(t >= 25.9 ? eout(ramp(t, 26.1, 26.4)) || 0.001 : 0.001);
    Wd.cashStacks.forEach((m, i) => { m.visible = t > 0.2 + i * 0.12; });
  };
  const amexState = (t) => {
    const n = Math.floor(clamp((t - 27.5) / 3.2) * Wd.receipts.length) + 4; Wd.receipts.forEach((m, i) => { m.visible = i < n; if (t > 30.2) m.position.x = -0.5 + Math.sin(i * 1.7) * 0.02 + Math.sin(t * 3) * 0.004 * i; });
    const st = Wd.stamp3D; let sy = 0; for (const a of [28.58, 29.22, 29.54]) sy = Math.max(sy, pulse(t, a - 0.12, 0.3)); st.position.y = 0.86 + 0.18 * (1 - sy); st.position.x = 0.3 - 0.8 * Math.min(1, sy * 1.5);
    Wd.certified.visible = t >= 28.6; if (Wd.certified.visible) Wd.certified.scale.setScalar(eout(ramp(t, 28.6, 28.85)));
    fall(Wd.amexPapers, t >= 27.6 ? t : -1, 27.6, [-1.6, 3.2, 3.0, -3.0, 1.6], 3, 0.6);
  };
  const kitchenState = (t) => { Wd.runSmoke(Wd.potSteam, t, -2.38, 1.2, -2.35, 0.9, 0.12, 0.6);
    const fr = Wd.frosting; fr.visible = t >= 34.25; fr.position.y = 0.44 + (1 - eout(ramp(t, 34.3, 34.6))) * 1.4; fr.scale.y = 1 - pulse(t, 34.6, 0.2) * 0.3;
    const see = ramp(t, 37.7, 38.0); Wd.boxWalls.forEach((m) => { m.material.opacity = 1 - see * 0.75; m.material.depthWrite = see < 0.5; }); Wd.bestCake.visible = see < 0.5;
    Wd.emptyLabel.visible = t >= 37.9; if (Wd.emptyLabel.visible) Wd.emptyLabel.scale.setScalar(eout(ramp(t, 37.9, 38.15)));
  };
  const exchangeState = (t) => {
    const price = 60 - 25 * ease(ramp(t, 40.3, 41.4)); Wd.drawBoard(price, t);
    Wd.arrow.position.y = 3.3 - eout(ramp(t, 40.5, 41.4)) * 1.4 + Math.sin(t * 8) * 0.03; Wd.arrow.visible = t >= 40.4;
    fall(Wd.slips, t >= 40.6 ? t : -1, 40.6, [-5, 10, 5.0, -3.5, 7], 4, 1.1);
    Wd.flags.forEach((f, i) => { const p = f.geometry.attributes.position, b = f.userData.base; for (let k = 0; k < p.count; k++) { const x = b[k * 3]; p.setZ(k, Math.sin(t * 4 + x * 6 + i) * 0.04 * (x + 0.4)); } p.needsUpdate = true; });
  };
  const omahaState = (t) => {
    Wd.buyStamp.visible = t >= 44.66; if (Wd.buyStamp.visible) Wd.buyStamp.scale.setScalar(1 + 0.6 * (1 - eout(ramp(t, 44.66, 44.9))));
    Wd.cert.visible = t >= 44.9; if (Wd.cert.visible) { Wd.cert.scale.setScalar(eout(ramp(t, 44.9, 45.2))); Wd.cert.rotation.z = Math.sin(t * 2) * 0.05; }
    fall(Wd.omBills, t >= 44.7 ? t : -1, 44.7, [-2.4, 4.8, 3.0, -2.6, 2.0], 31, 0.9); fall(Wd.omConfetti, t >= 43.6 ? t : -1, 43.6, [-2, 4, 3.2, -2.2, 3.4], 77, 1.0);
    const tf = Wd.tinyFish; tf.position.set(Math.sin(t * 1.6) * 0.07, 0.14 + Math.sin(t * 2.3) * 0.03, Math.cos(t * 1.6) * 0.07); tf.rotation.y = -t * 1.6;
  };
  const SETSTATE = { farm: farmState, cut: cutState, banks: banksState, amex: amexState, kitchen: kitchenState, exchange: exchangeState, omaha: omahaState };

  // ---------- actors ----------
  const actors = (t, set) => {
    const L = [];
    if (set === 'banks') {
      if (t < 2.4) {
        L.push(A('tino', t, 50.15, 0, 0.35, { expr: [[0, 'beam'], [0.8, 'laugh'], [1.6, 'grin']], R: [[0, 'up'], [1.2, 'holdUp']], propR: t > 1.2 ? 'moneybag' : null, L: 'up', hop: Math.abs(Math.sin(t * 6)) * 0.05 }));
        L.push(A('bank1', t, 48.7, 0.16, -3.3, { expr: [[0, 'smile'], [1.0, 'grin']], R: 'holdUp', propR: 'moneybag', L: 'wave' }));
        L.push(A('bank2', t, 51.6, 0.16, -3.4, { expr: 'beam', R: 'thumb', L: 'holdUp', propL: 'cash', flip: true }));
      } else {
        [['bank1', 41.5], ['bank2', 46.0], ['bank3', 50.0], ['bank1', 54.4], ['bank2', 58.6]].forEach(([id, x], i) => L.push(A(id, t + i, x, 0.16, -3.3, { expr: i % 2 ? 'grin' : 'smile', R: [[25.9, 'hang'], [26.7 + i * 0.12, 'holdUp']], propR: 'moneybag', L: 'wave', flip: i % 2 === 1 })));
        const w = walkTo(t, 26.0, 27.5, [44.5, 0, 0.6], [49.0, 0, 0.4]); L.push(A('tino', t, w.p[0], 0, w.p[2], { walk: w.walk, expr: 'beam', R: 'holdUp', propR: 'moneybag', L: 'holdUp', propL: 'cash' }));
      }
    }
    if (set === 'farm') {
      if (t < 5.1) { L.push(A('tino', t, 1.5, 0, -1.6, { expr: 'smirk', R: 'point', L: 'hip', look: 0.6 })); }
      else if (t < 9.2) { const w = walkTo(t, 7.4, 9.0, [-13.9, 0, 0.2], [-12.3, 0, 0.7]); L.push(A('tino', t, w.p[0], 0, w.p[2], { walk: w.walk, expr: [[7.3, 'smile'], [8.3, 'smugsmile']], R: 'wave', L: 'hip' })); }
      else if (t < 14.0) {
        L.push(A('tino', t, 0.6, 0, -1.2, { expr: [[9.2, 'grin'], [10.64, 'beam'], [12.0, 'smugsmile']], R: [[9.2, 'hip'], [10.4, 'up'], [12.3, 'holdUp']], L: [[9.2, 'hip'], [10.6, 'up'], [12.3, 'hip']], propR: t > 12.3 ? 'cash' : null }));
        if (t >= 11.5) { L.push(A('bank1', t, 2.2, 0, -1.6, { expr: 'smile', R: 'holdUp', propR: 'cash', L: 'hang', flip: true })); L.push(A('bank3', t, 3.3, 0, -2.3, { expr: 'grin', R: 'holdUp', propR: 'moneybag', L: 'hang', flip: true })); }
      } else if (t < 18.9) {
        const lx = t < 15.0 ? 3.2 : 3.3, lz = t < 15.0 ? -3.3 : -5.55; const ly = t < 15.0 ? lerp(0, roofY(3.2, -3.9), ease(ramp(t, 14.1, 14.95))) : roofY(lx, lz);
        L.push(A('insp1', t, lx, ly, lz, { expr: t < 15 ? 'think' : [[15.0, 'neutral'], [16.0, 'think'], [17.0, 'smirk'], [17.4, 'think']], R: t < 15 ? 'up' : [[15.0, 'point'], [16.0, 'holdUp'], [17.0, 'mouth']], propR: t > 16.0 && t < 17 ? 'dipstick' : null, L: t < 15 ? 'up' : 'hip', walk: t < 15 ? t * 1.4 : null, blob: false }));
        L.push(A('insp2', t, 2.0, roofY(2.0, -6.8), -6.8, { expr: [[14, 'bored'], [17.2, 'smirk']], R: 'hold', propR: 'clipboard', L: 'hip' }));
        if (t >= 16.7) L.push(A('tino', t, 0.4, 0, -1.6, { expr: 'nervous', R: 'mouth', L: 'hang', look: 0.5 }));
      } else if (t < 20.5) {
        L.push(A('tino', t, 1.55, 0, -1.4, { expr: [[18.9, 'nervous'], [19.6, 'shock']], R: 'mouth', L: 'hang', look: 0.3, tilt: -6 }));
        L.push(A('insp1', t, 3.35, roofY(3.35, -5.3), -5.3, { expr: 'smirk', R: 'point', L: 'hip', talk: [[18.9, 20.1]] }));
      } else if (t >= 31.3 && t < 33.7) {
        L.push(A('tino', t, 1.8, roofY(1.8, -5.0), -5.0, { expr: [[31.3, 'nervous'], [32.4, 'shock']], R: 'mouth', L: 'hang', hop: pulse(t, 31.4, 0.3) * 0.08 }));
        L.push(A('insp1', t, 3.4, roofY(3.4, -5.4), -5.4, { expr: 'think', R: 'chin', L: 'hip', flip: true })); L.push(A('insp2', t, 2.9, roofY(2.9, -6.6), -6.6, { expr: 'think', R: 'chin', L: 'hang' }));
      } else if (t >= 38.7) {
        L.push(A('tino', t, -0.4, 0, -0.8, { expr: [[38.7, 'shock'], [39.2, 'nervous']], R: 'up', L: 'up', hop: Math.abs(Math.sin(t * 7)) * 0.07 }));
        L.push(A('insp2', t, 4.6, 0, -1.4, { expr: 'shock', R: 'up', L: 'mouth' }));
      }
    }
    if (set === 'amex') {
      L.push(A('exec', t, 75.0, 0.46, -2.15, { pose: 'sit', expr: t < 30.2 ? [[27.5, 'neutral'], [28.5, 'grin'], [29.6, 'smugsmile']] : [[30.2, 'smugsmile'], [30.6, 'smirk']], R: t < 30.2 ? [[27.5, 'hold'], [28.4, 'holdUp'], [28.6, 'hold'], [29.1, 'holdUp'], [29.3, 'hold']] : 'thumb', L: t < 30.2 ? 'hold' : 'hip', propL: t < 30.2 ? 'clipboard' : null }));
      if (t >= 30.2) L.push(A('insp1', t, 73.2, 0, -1.6, { expr: 'smile', R: 'thumb', L: 'hold', propL: 'clipboard' }));
    }
    if (set === 'kitchen' && t >= 36.32) {
      L.push(A('kid1', t, t >= 37.5 ? -26.4 : -25.55, 0, t >= 37.5 ? -0.6 : -0.3, { expr: t < 36.2 ? 'grin' : [[36.2, 'beam'], [37.5, 'smugsmile']], R: t < 36.2 ? 'point' : [[36.2, 'mouth'], [37.0, 'holdUp']], propR: t >= 36.2 ? 'fork' : null, L: 'hang' }));
      L.push(A('kid2', t, t >= 37.5 ? -26.0 : -24.75, 0, t >= 37.5 ? -0.75 : -0.3, { expr: t < 37.5 ? 'laugh' : [[37.5, 'think'], [38.0, 'shock']], R: t < 36.2 ? 'hang' : 'mouth', L: 'hip', flip: true }));
    }
    if (set === 'exchange') {
      const panic = t >= 40.3; const spots = [['tr1', 97.4, 1.2], ['tr2', 98.9, -0.6], ['tr3', 101.1, -0.4], ['tr4', 102.8, 1.0], ['tr5', 100.0, 0.6]];
      spots.forEach(([id, x, z], i) => L.push(A(id, t + i, x + (panic ? Math.sin(t * 5 + i) * 0.08 : 0), 0, z, { expr: !panic ? 'neutral' : t < 42.24 ? (i % 2 ? 'shock' : 'nervous') : (i % 2 ? 'angry' : 'shock'), R: !panic ? 'hold' : t < 42.24 ? 'up' : 'point', propR: !panic ? 'phoneR' : 'notepad', L: panic ? 'mouth' : 'hip', hop: panic ? Math.abs(Math.sin(t * 7 + i)) * 0.06 : 0, flip: i % 2 === 1 })));
    }
    if (set === 'omaha') {
      L.push(A('buffett', t, 125.0, 0.46, -2.15, { pose: 'sit', expr: [[43.55, 'think'], [44.3, 'smirk'], [44.66, 'grin'], [46.0, 'beam'], [47.8, 'wink']], R: [[43.55, 'holdUp'], [44.4, 'holdUp'], [44.66, 'hold'], [45.2, 'thumb'], [47.3, 'thumb']], propR: t < 44.4 ? 'newspaper' : t < 45.2 ? 'stamp' : null, L: [[43.55, 'holdUp'], [44.4, 'hang'], [46.2, 'up']], propL: t < 44.4 ? null : null }));
    }
    return L;
  };

  // ---------- captions (1–2 words, Lilita One, white with black outline, y≈1300) ----------
  const CAPS = (() => { const out = []; const W = window.WORDS; for (let i = 0; i < W.length;) { const a = W[i], b = W[i + 1]; const clean = (s) => s.replace(/,(?!\d)/g, '').replace(/\.$/, ''); const short = (s) => clean(s).length <= 4; if (b && short(a[0]) && clean(a[0] + b[0]).length <= 11 && !/[.?!,]$/.test(a[0]) && b[1] - a[2] < 0.25) { out.push({ t: a[1], txt: clean(a[0]) + ' ' + clean(b[0]) }); i += 2; } else { out.push({ t: a[1], txt: clean(a[0]) }); i += 1; } } out.forEach((c, k) => { c.e = k + 1 < out.length ? out[k + 1].t : END; }); return out; })();
  const drawCaption = (g, t, W, H) => {
    const c = CAPS.find((c) => t >= c.t && t < c.e && t < c.t + 1.2); if (!c) return;
    const u = clamp((t - c.t) / 0.09), s = 0.88 + 0.12 * eout(u); const fs = Math.round(61 * W / 1080);
    g.save(); g.translate(W / 2, H * 1300 / 1920); g.scale(s, s); g.font = `${fs}px "Lilita One", Impact, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    let f = 1; const mw = g.measureText(c.txt).width; if (mw > W * 0.86) f = W * 0.86 / mw; g.scale(f, f);
    g.lineJoin = 'round'; g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = fs * 0.18; g.shadowOffsetY = fs * 0.06; g.lineWidth = fs * 0.24; g.strokeStyle = '#000'; g.strokeText(c.txt, 0, 0); g.shadowColor = 'transparent'; g.fillStyle = '#fff'; g.fillText(c.txt, 0, 0); g.restore();
  };

  const frame = (f) => {
    const t = f / FPS, C = camAt(t);
    SETSTATE[C.set](t); Wd.tick(t);
    return { t, cam: C, light: { ...LIGHT[C.set] }, dof: dofAt(C), actors: actors(t, C.set), whip: C.whip, flash: 0, ca: caAt(t) };
  };
  const SHOTS = []; K.forEach((k, i) => { if (!i || K[i - 1].set !== k.set) SHOTS.push({ t: k.t, set: k.set }); });
  return { FPS, END, TOTAL, frame, drawCaption, K, SHOTS, CAPS };
})();
