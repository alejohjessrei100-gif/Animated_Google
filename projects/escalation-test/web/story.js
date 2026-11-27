// "The Well That Was Never Yours" (escalation format). Timed to the 1.25x voice (words.js). 30 fps, 1080x1920.
// One cutaway diorama that grows with every "So you...". Pop-ins land on the exact word; big re-aims are 0.14 s whips.
window.STORY = (() => {
  const FPS = 30, END = 46.4, TOTAL = Math.round(END * FPS);
  const Wd = WORLD, { rick } = TOON;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = (u) => { u = clamp(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
  const eout = (u) => 1 - Math.pow(1 - clamp(u), 3);
  const back = (u) => { u = clamp(u); return 1 + 2.70158 * Math.pow(u - 1, 3) + 1.70158 * Math.pow(u - 1, 2); };
  const lerp = (a, b, u) => a + (b - a) * u;
  const L3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const q = (v, s = 0.02) => Math.round(v / s) * s;
  const ramp = (t, a, b) => clamp((t - a) / (b - a));
  const pop = (t, a, d = 0.28) => (t < a ? 0 : back((t - a) / d));
  const win = (t, a, b) => t >= a && t < b;

  // ---------- word beats ----------
  const B = { gold: 0.52, well: 1.2, vault: 2.14, but: 2.76, drop: 3.28, bucket: 3.7, nail: 4.6, lid: 5.04, now: 6.04, safe: 6.42, but2: 6.94, v300: 7.06, water: 8.38,
    dig: 9.34, second: 9.64, decoy: 10.5, fake: 11.74, real: 12.82, dry: 14.4, deeper: 15.44, f20: 16.28, f40: 17.04, straight: 17.76, vault2: 18.62, flood: 19.56, moat: 21.12,
    needs: 22.2, hire: 23.36, frog: 23.76, goat: 24.28, steve: 25.1, croaks: 26.12, eats: 27.74, tells: 28.86, v300b: 29.48, diary: 31.32, nobody: 32.8, wait: 33.92, why: 34.38,
    bucket2: 35.58, not: 36.08, note: 37.78, king: 38.26, thanks: 38.8, coin: 40.46, his: 41.32, congrats: 41.92, built: 43.28, vault3: 43.96, never: 45.42 };

  // ---------- cast (locked Ricks style) ----------
  const C = {
    you: { outfit: 'vest', top: '#2f6b4f', hat: 'cap', hatCol: '#c62f36' },
    g1: { outfit: 'uniform', hat: 'gendarme', moustache: '#3a2a22' },
    g2: { outfit: 'uniform', hat: 'gendarme', glasses: 'round' },
    v1: { outfit: 'apron', top: '#e07a5f', hairStyle: 'bun', hair: '#5a3b2a' },
    v2: { outfit: 'overalls', top: '#3d5a80', hat: 'straw' },
    v3: { kid: true, outfit: 'tee', top: '#f4d35e', pants: '#3b3f52', hairStyle: 'spiky', hair: '#8a5a32' },
    v4: { outfit: 'vest', top: '#8a5734', hat: 'flatcap', moustache: '#9a958c' },
    v5: { outfit: 'dress', top: '#3fa39a', hairStyle: 'long', hair: '#2a1d17' },
    steve: { outfit: 'tee', top: '#e07a5f', pants: '#3b3f52', hairStyle: 'curly', hair: '#c9893a' },
    king: { outfit: 'robe', top: '#6b3c8f', hat: 'crown', moustache: '#e8e4dc' },
  };
  const SEED = Object.fromEntries(Object.keys(C).map((k, i) => [k, i * 1.37 + 0.4]));
  const blinkAt = (t, s) => ((t + s * 1.9) % 3.3) < 0.11;
  const lookAt = (t, s, base = 0) => q(clamp(base + 0.45 * Math.sin(t * 0.8 + s) + 0.25 * Math.sin(t * 2.3 + s * 3), -1, 1), 0.1);
  const pick = (t, sched) => { let v = sched[0][1]; for (const [a, x] of sched) if (t >= a) v = x; return v; };
  const arm = (t, sched) => { let prev = sched[0][1], cur = sched[0][1], ta = -9; for (const [a, p] of sched) if (t >= a) { prev = cur; cur = p; ta = a; } const x = clamp((t - ta) / 0.3), u = q(back(x), 0.02); return x >= 1 || prev === cur ? cur : { a: prev, b: cur, t: u }; };
  let CAMP = [0, 0, 10];
  const A = (id, t, x, y, z, o = {}) => {
    const s0 = SEED[id];
    const opts = { pose: o.pose || 'stand', expr: o.expr ? (Array.isArray(o.expr) ? pick(t, o.expr) : o.expr) : 'neutral', look: o.look ?? lookAt(t, s0, o.lookBase || 0),
      L: o.L ? (Array.isArray(o.L) ? arm(t, o.L) : o.L) : 'hang', R: o.R ? (Array.isArray(o.R) ? arm(t, o.R) : o.R) : 'hang', propL: o.propL || null, propR: o.propR || null,
      blink: !o.noBlink && blinkAt(t, s0), talk: o.talk ? (Math.sin(t * 21) > 0 ? 1 : 0.4) : 0, headTilt: q(o.tilt ?? 3 * Math.sin(t * 0.9 + s0), 0.5) };
    if (o.walk != null) opts.walk = q(o.walk % 1, 0.02);
    if (o.reach && o.reach.k > 0.001) { const r = o.reach, yaw = Math.atan2(CAMP[0] - x, CAMP[2] - z), rxv = Math.cos(yaw), rzv = -Math.sin(yaw);
      const mpu = 2.25 / 1000 * 1.1 * (o.s || 1); /* metres per rick unit */ let ux = ((r.to[0] - x) * rxv + (r.to[2] - z) * rzv) / mpu, uy = -(r.to[1] - y) / mpu; if (o.flip) ux = -ux;
      const side = ux >= 0 ? 'R' : 'L', pose = { to: [q(ux, 2), q(uy, 2)], k: q(r.k, 0.02), from: (side === 'R' ? (typeof opts.R === 'string' ? opts.R : 'hang') : (typeof opts.L === 'string' ? opts.L : 'hang')), bend: r.bend ?? 0.16, wob: q(Math.sin(t * 9) * 6 * (1 - r.k), 1) };
      opts[side] = pose; if (r.prop !== undefined) opts['prop' + side] = r.prop; }
    const sway = o.still ? 0 : Math.sin(t * 1.3 + s0) * 0.012, breath = o.still ? 0 : 0.012 * Math.sin(t * 2.3 + s0), lean = o.still ? 0 : 0.035 * Math.sin(t * 0.9 + s0 * 2);
    const pin = o.pop != null ? Math.max(0.02, pop(t, o.pop, 0.3)) : 1;
    return { key: id + JSON.stringify(opts), x: x + sway, y: y + (o.hop || 0), z, s: (o.s || 1) * pin, flip: o.flip, sq: (o.sq || 0) + breath, roll: (o.roll || 0) + lean, ground: o.ground ?? y,
      draw: (g) => { g.translate(300, 975); g.scale(1.1, 1.1); rick(g, C[id], opts); } };
  };

  // ---------- light ----------
  const LIGHT = { dio: { sky: '#cfe8ff', ground: '#c9b58e', hemi: 1.35, sun: '#fff1d6', sunI: 2.1, az: -35, el: 58, fog: '#cfe6ff', bg: '#9fd0ff', fogNear: 30, fogFar: 110, sat: 1.1, fillI: 1.35, fillCol: '#fff0dc', shadowExt: 10, expo: 1.55 } };

  // ---------- camera ----------
  const VY = -3.85, VX = -1.75;   // vault centre
  const K = [
    { t: 0.0, pos: [-1.45, -3.62, 2.7], look: [-1.75, -3.92, -0.4], fov: 46, drift: [-0.2, 0.08, -0.5], roll: -1.5 },                 // hook: you + gold, mid-action
    { t: B.well, pos: [-0.9, -2.3, 6.6], look: [-0.9, -2.6, -0.5], fov: 50, drift: [0.1, 0.25, 0.6] },                                  // pull back: the cutaway
    { t: B.vault - 0.08, pos: [-1.35, -3.4, 3.7], look: [-1.6, -3.7, -0.4], fov: 46, drift: [-0.15, 0.05, -0.4], roll: 2 },            // YOUR VAULT
    { t: B.but - 0.04, pos: [1.15, 1.55, 4.3], look: [0.65, 1.3, -0.6], fov: 48, drift: [-0.25, 0.1, -0.45] },                        // whip up: the guard
    { t: B.drop + 0.06, pos: [0.9, 1.3, 4.6], look: [0, 1.2, -0.45], fov: 50, follow: 'bucket', whipIn: false },                       // ride down with the bucket
    { t: B.bucket + 0.04, pos: [0.3, -4.95, 2.5], look: [0, -5.35, -0.45], fov: 46, drift: [-0.15, 0.1, -0.3], whipIn: true },         // splash
    { t: 4.36, pos: [-0.55, 1.45, 4.3], look: [-0.4, 0.95, -0.5], fov: 48, drift: [0.3, -0.1, -0.5] },                                 // So you nail a lid
    { t: B.now - 0.04, pos: [-0.1, 1.25, 3.4], look: [-0.35, 0.95, -0.4], fov: 44, drift: [-0.2, 0.05, -0.3], roll: -2 },               // it's a SAFE
    { t: B.but2 - 0.04, pos: [-10.3, 1.55, 5.4], look: [-10.1, 1.2, -1.0], fov: 50, drift: [0.6, 0.05, -0.6] },                        // 300 villagers
    { t: 8.0, pos: [-9.4, 1.3, 4.4], look: [-9.6, 1.1, -0.9], fov: 48, drift: [0.5, 0.1, -0.3], roll: 1.5 },                            // need water
    { t: 9.0, pos: [-4.7, 1.0, 5.0], look: [-5.1, 0.3, -0.6], fov: 50, drift: [-0.3, -0.1, -0.5] },                                    // dig a second well
    { t: B.decoy - 0.06, pos: [-5.9, 1.4, 3.8], look: [-5.6, 1.2, -0.5], fov: 46, drift: [0.25, 0, -0.3], roll: 2 },                   // DECOY
    { t: 11.24, pos: [-4.1, 1.5, 7.4], look: [-4.3, 0.9, -0.8], fov: 50, drift: [-0.5, 0.1, 0.4] },                                    // fake well + real problem
    { t: 13.72, pos: [-5.15, -0.9, 3.4], look: [-5.6, -1.8, -0.5], fov: 48, drift: [-0.1, -0.15, -0.4] },                              // the decoy is dry
    { t: 14.84, pos: [-4.7, -1.4, 4.0], look: [-5.5, -2.4, -0.5], fov: 50, drift: [0.1, -1.6, -0.2], dlook: [0, -1.7, 0] },            // guards dig deeper / 20 ft
    { t: B.f40 - 0.05, pos: [-4.5, -3.4, 3.7], look: [-5.3, -4.0, -0.5], fov: 50, drift: [0.15, -0.05, -0.3], roll: -2 },              // 40 ft
    { t: B.straight - 0.06, pos: [-4.3, -3.5, 3.6], look: [-4.2, -4.0, -0.5], fov: 50, drift: [1.3, 0.05, -0.2], dlook: [1.6, 0, 0] }, // straight into your vault
    { t: 19.12, pos: [-2.5, -3.35, 4.6], look: [-2.7, -3.85, -0.5], fov: 50, drift: [-0.5, 0.05, -0.4] },                                // flood the tunnel
    { t: 20.46, pos: [-3.7, -3.55, 3.3], look: [-3.85, -3.95, -0.4], fov: 46, drift: [0.2, 0.05, -0.3], roll: 1.5 },                   // MOAT
    { t: B.hire - 0.1, pos: [-3.45, -3.75, 1.75], look: [-3.6, -4.0, -0.35], fov: 44, drift: [-0.05, 0.02, -0.2] },                    // a frog
    { t: B.goat - 0.1, pos: [2.2, 1.15, 3.9], look: [2.15, 0.8, -0.8], fov: 46, drift: [0.3, 0.05, 0.1], dlook: [0.3, 0, 0] },                               // a goat, and Steve
    { t: 25.6, pos: [-3.35, -3.65, 2.6], look: [-3.5, -3.8, -0.35], fov: 44, drift: [0.05, 0.02, -0.3], roll: -2 },                     // croaks
    { t: 27.32, pos: [1.6, 1.3, 3.0], look: [1.4, 1.05, -0.7], fov: 46, drift: [-0.2, 0.05, -0.3] },                                   // eats the rope
    { t: 28.3, pos: [-9.7, 1.55, 6.4], look: [-9.95, 1.2, -0.9], fov: 50, drift: [-0.25, 0.05, -0.6] },                                  // Steve tells 300 villagers
    { t: 30.66, pos: [-10.15, 1.75, 3.4], look: [-10.2, 1.15, -0.9], fov: 46, drift: [0.1, -0.05, -0.5], roll: 1.5 },                  // the diary
    { t: 32.56, pos: [-1.8, 1.05, 6.2], look: [-1.8, 0.5, -1.0], fov: 50, drift: [0.6, 0.05, -0.3] },                                  // nobody comes
    { t: B.wait - 0.06, pos: [-1.5, -3.55, 2.2], look: [-1.75, -3.78, -0.3], fov: 44, drift: [-0.1, 0.03, -0.3] },                      // Wait. Why?
    { t: 34.86, pos: [0.3, -4.95, 2.6], look: [0, -5.32, -0.45], fov: 46, drift: [-0.15, 0.05, -0.7] },                                // that first bucket
    { t: 37.26, pos: [0.1, -4.55, 2.9], look: [0.05, -4.7, 0.4], fov: 46, drift: [0, 0.03, -0.15] },                                   // a note
    { t: B.king - 0.06, pos: [1.6, 1.6, 3.5], look: [1.4, 1.35, -0.6], fov: 46, drift: [-0.2, 0.05, -0.3], roll: -2 },                 // the king
    { t: B.thanks - 0.06, pos: [0.05, -4.62, 2.75], look: [0.05, -4.68, 0.4], fov: 46, drift: [0, 0.02, -0.12] },                      // Thanks for guarding my gold
    { t: 40.1, pos: [-1.4, -3.55, 2.9], look: [-1.75, -3.95, -0.4], fov: 46, drift: [-0.1, 0.05, -0.4], roll: 2 },                     // every coin was his
    { t: B.congrats - 0.06, pos: [-10.5, -0.6, 14.5], look: [-10.5, -1.4, -1.0], fov: 50, drift: [9.0, 0, -1.5], dlook: [9.0, 0, 0] }, // Congratulations: pan the whole build
    { t: 43.6, pos: [-1.45, -3.45, 3.3], look: [-1.75, -3.8, -0.4], fov: 46, drift: [0.1, 0.05, -0.3] },                               // the safest vault
    { t: 44.98, pos: [-0.85, -3.1, 4.6], look: [-0.85, -3.55, -0.4], fov: 48, drift: [-0.25, 0.05, -0.6], roll: -1.5 },                // never yours
  ];
  K.forEach((k, i) => { k.set = 'dio'; k.t1 = i + 1 < K.length ? K[i + 1].t : END + 0.5; });
  const SHAKES = [[B.gold, 0.015], [B.but, 0.025], [B.bucket, 0.04], [B.lid, 0.05], [5.46, 0.03], [B.safe, 0.02], [B.second, 0.03], [B.real, 0.03], [16.28, 0.02], [17.04, 0.025], [B.vault2, 0.08], [B.flood, 0.05], [B.frog, 0.02], [B.goat, 0.02], [B.steve, 0.02], [B.not, 0.03], [B.king, 0.02], [B.coin, 0.06], [B.congrats, 0.03], [B.never, 0.03]];
  const IMPACTS = [B.but, B.lid, B.vault2, B.flood, B.coin];
  const caAt = (t) => { let c = 0; for (const a of IMPACTS) if (t >= a && t < a + 0.35) c = Math.max(c, 0.018 * Math.exp(-(t - a) * 11)); return c; };
  const compAt = (t) => { let i = 0; for (let k = 0; k < K.length; k++) if (t >= K[k].t) i = k; return i; };
  let BUCK = [0, 1.5, -0.45];
  const compState = (k, t) => {
    if (k.follow === 'bucket') { const u = ease(ramp(t, k.t, k.t1)); return { pos: [lerp(0.9, 0.35, u), BUCK[1] + lerp(0.3, 0.45, u), lerp(4.6, 3.0, u)], look: [0, BUCK[1] - 0.25, -0.45], fov: 50, roll: lerp(0, -3, u) }; }
    const u = ease(clamp((t - k.t) / Math.max(0.6, k.t1 - k.t))) * 0.85 + clamp((t - k.t) / (k.t1 - k.t)) * 0.15; const d = k.drift || [0, 0, 0], dl = k.dlook || [0, 0, 0];
    return { pos: [k.pos[0] + d[0] * u, k.pos[1] + d[1] * u, k.pos[2] + d[2] * u], look: [k.look[0] + dl[0] * u, k.look[1] + dl[1] * u, k.look[2] + dl[2] * u], fov: k.fov, roll: k.roll || 0 }; };
  const WHIP = new Map(); const isWhip = (a, b) => { if (!a || !b) return false; if (b.whipIn !== undefined) return b.whipIn; const key = a.t + ':' + b.t; if (WHIP.has(key)) return WHIP.get(key); const pa = compState(a, b.t), pb = compState(b, b.t); const da = [pa.look[0] - pa.pos[0], pa.look[1] - pa.pos[1], pa.look[2] - pa.pos[2]], db = [pb.look[0] - pb.pos[0], pb.look[1] - pb.pos[1], pb.look[2] - pb.pos[2]]; const cs = (da[0] * db[0] + da[1] * db[1] + da[2] * db[2]) / (Math.hypot(...da) * Math.hypot(...db)); const w = cs < 0.72 || Math.hypot(pa.pos[0] - pb.pos[0], pa.pos[1] - pb.pos[1], pa.pos[2] - pb.pos[2]) > 2.6; WHIP.set(key, w); return w; };
  const camAt = (t) => {
    const i = compAt(t), k = K[i]; let s = compState(k, t), whip = [0, 0]; const prev = K[i - 1];
    const ein = k.ein || 0.45, WH = 0.14;
    /* whips are along the bigger axis of the move: vertical moves tilt, sideways moves pan */
    const swing = (st, a, b, u, sgn) => { const dy = b.pos[1] - a.pos[1], dx = b.pos[0] - a.pos[0]; if (Math.abs(dy) > Math.abs(dx)) { st.look = [st.look[0], st.look[1] + 2.6 * u * u * Math.sign(dy) * sgn, st.look[2]]; return [0, 0.09 * u * Math.sign(dy) * sgn]; } st.look = [st.look[0] + 2.6 * u * u * Math.sign(dx) * sgn, st.look[1], st.look[2]]; return [0.09 * u * Math.sign(dx) * sgn, 0]; };
    if (prev && !isWhip(prev, k) && t - k.t < ein) { const p = compState(prev, k.t), u = ease((t - k.t) / ein); s = { pos: L3(p.pos, s.pos, u), look: L3(p.look, s.look, u), fov: lerp(p.fov, s.fov, u), roll: lerp(p.roll, s.roll, u) }; whip = [0.012 * Math.sin(u * Math.PI) * Math.sign(s.pos[0] - p.pos[0] || 1), 0]; }
    if (prev && isWhip(prev, k) && t - k.t < WH) { const u = 1 - (t - k.t) / WH; whip = swing(s, compState(prev, k.t), s, u, -1); }
    const next = K[i + 1]; if (next && isWhip(k, next) && next.t - t < WH) { const u = 1 - (next.t - t) / WH; whip = swing(s, s, compState(next, next.t), u, 1); }
    const hn = [Math.sin(t * 1.7) * 0.006 + Math.sin(t * 3.9) * 0.003, Math.sin(t * 2.3 + 1) * 0.005, Math.sin(t * 1.3 + 2) * 0.004];
    let sh = 0; for (const [a, amp] of SHAKES) if (t >= a && t < a + 0.5) sh += amp * Math.exp(-(t - a) * 9);
    const sx = Math.sin(t * 61) * sh, sy = Math.cos(t * 53) * sh;
    return { pos: [s.pos[0] + hn[0] + sx, s.pos[1] + hn[1] + sy, s.pos[2] + hn[2]], look: [s.look[0] + sx * 0.5, s.look[1] + sy * 0.5, s.look[2]], fov: s.fov, roll: s.roll + Math.sin(t * 0.55) * 1.2, set: 'dio', whip };
  };
  const dofAt = (C) => { const d = Math.hypot(C.pos[0] - C.look[0], C.pos[1] - C.look[1], C.pos[2] - C.look[2]); return { focus: d, cinf: d < 1.2 ? 10 : d > 7 ? 4 : 7 }; };

  // ---------- world state ----------
  const PILE = Wd.V.y0 + 0.48, SEAT = [VX, Wd.V.y0 + 0.36, -0.22], WATER = Wd.A.bot + 0.55;
  const DIG = (t) => lerp(Wd.Dk.top, Wd.Dk.bot, ease(ramp(t, B.deeper - 0.2, B.f40 + 0.3)));        // decoy bottom
  const TUN = (t) => lerp(Wd.T.x0, Wd.T.x1, ease(ramp(t, B.straight - 0.1, B.vault2)));              // tunnel face
  const burst = (bits, t, t0, c, n0, o = {}) => bits.forEach((m, i) => { const r = PAINT.rng(i + n0), u = t - t0, life = o.life || 0.7; if (u < 0 || u > life || (o.n && i >= o.n)) { if (!o.keep || u < 0 || u > life) m.position.y = -50; return; } const a = r() * Math.PI * 2, sp = (0.7 + r() * 1.5) * (o.spread || 1); m.position.set(c[0] + Math.cos(a) * sp * u, c[1] + Math.abs(Math.sin(a)) * sp * u * (o.up || 1.4) - (o.g ?? 2.4) * u * u, c[2] + (r() - 0.5) * 0.4 + 0.2); m.scale.setScalar(Math.max(0.01, (o.sc || 1.3) * (1 - u / life))); m.rotation.set(u * 9 + i, u * 5, 0); });
  const popS = (s, t, a, until = 1e9) => { s.visible = t >= a && t < until; if (s.visible) s.scale.setScalar(Math.max(0.001, pop(t, a, 0.28))); };
  const state = (t) => {
    // gold pile: swells on "gold", stamped on "coin", drained up the shaft on "never yours"
    const gp = pop(t, B.gold, 0.3), drain = ease(ramp(t, 44.9, 46.2)); Wd.gold.scale.set((0.85 + 0.2 * gp) * (1 - drain * 0.75), (0.8 + 0.25 * gp) * (1 - drain * 0.8), (0.85 + 0.2 * gp) * (1 - drain * 0.75));
    Wd.vaultLight.intensity = 2.0 + 1.6 * (t >= B.gold ? Math.exp(-(t - B.gold) * 4) : 0) + 0.25 * Math.sin(t * 7) + (t >= B.coin ? 2 * Math.exp(-(t - B.coin) * 4) : 0);
    popS(Wd.vaultSign, t, B.vault); Wd.vaultSign.rotation.z = 0.04 * Math.sin(t * 2.4);
    popS(Wd.stamp, t, B.coin); if (Wd.stamp.visible) Wd.stamp.position.y = Wd.V.y0 + 0.3 + 0.6 * (1 - eout(ramp(t, B.coin, B.coin + 0.12)));
    // sparks: gold, vault sign, safe, king, congratulations
    const SP = Wd.sparks;
    burst(SP.slice(0, 10), t, B.gold, [VX, PILE, -0.3], 3); burst(SP.slice(10, 18), t, B.vault, [-1.7, Wd.V.y1 + 0.3, 0.4], 40, { spread: 1.1 });
    if (t > 6 && t < 7) burst(SP.slice(10, 18), t, B.safe, [1.2, 2.3, 0.4], 50); if (t > 38 && t < 39.5) burst(SP.slice(10, 18), t, B.king, [1.4, 2.1, -0.3], 60, { spread: 1.3 });
    burst(SP.slice(18, 30), t, B.coin, [VX, PILE + 0.2, -0.2], 70, { spread: 1.2 });
    // the bucket: hangs, dropped on "drop", splashes on "bucket", floats at the bottom from then on (the note rises out of it later)
    const fallU = ramp(t, B.drop + 0.06, B.bucket), by0 = 1.5, by1 = WATER + 0.05;
    let by = t < B.drop + 0.06 ? by0 + 0.03 * Math.sin(t * 2) : lerp(by0, by1, fallU * fallU); if (t >= B.bucket) by = by1 + 0.03 * Math.sin(t * 2.5) + (t - B.bucket < 0.6 ? Math.sin((t - B.bucket) * 14) * 0.08 * Math.exp(-(t - B.bucket) * 5) : 0);
    Wd.bucket.position.set(0, by, -0.45); Wd.bucket.rotation.set(0.06 * Math.sin(t * 2.1), 0, t >= B.bucket ? 0.12 * Math.sin(t * 1.7) : 0.08 * Math.sin(t * 9) * fallU); BUCK = [0, by, -0.45];
    Wd.wA.crank.rotation.x = t < B.drop ? 0.12 * Math.sin(t * 1.5) : -40 * Math.pow(Math.min(t, B.bucket) - B.drop, 1.5);
    // rope: crank -> bucket, then crank -> lid, then the goat chews it up
    { const top = [0, 2.15, -0.45]; let bot = t < B.lid ? [0, by + 0.17, -0.45] : [0, 0.9, -0.45]; let vis = true;
      if (t >= B.eats - 0.3) { const u = ease(ramp(t, B.eats - 0.3, B.eats + 0.15)), ch = ease(ramp(t, B.eats + 0.2, 28.7)); const mouth = [2.55, 0.82 + 0.03 * Math.sin(t * 24), -0.8]; bot = L3(L3(bot, mouth, u), [0.05, 2.15, -0.45], ch * 0.999); vis = ch < 0.98; }
      const dx = bot[0] - top[0], dy = bot[1] - top[1], dz = bot[2] - top[2], len = Math.max(0.01, Math.hypot(dx, dy, dz)); Wd.rope.visible = vis; Wd.rope.position.set((top[0] + bot[0]) / 2, (top[1] + bot[1]) / 2, (top[2] + bot[2]) / 2); Wd.rope.scale.set(1, len, 1); Wd.rope.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / len, dy / len, dz / len)); }
    // splash drops + ripple
    burst(Wd.drops, t, B.bucket, [0, WATER, -0.3], 5, { spread: 0.7, up: 2.2, g: 5, life: 0.6 });
    if (t > 19 && t < 20.6) burst(Wd.drops, t, B.flood, [Wd.T.x1, Wd.T.y0 + 0.6, 0], 25, { spread: 1.3, up: 1.6, g: 5, life: 0.7 });
    { const u = (t - B.bucket) % 1.6; Wd.ripple.visible = t >= B.bucket; Wd.ripple.scale.setScalar(1 + u * 4); Wd.ripple.material.opacity = 0.7 * (1 - u / 1.6); }
    // lid slams on "lid", padlock + SAFE on "safe"
    Wd.lid.visible = t >= B.lid - 0.25; Wd.lid.position.y = 0.8 + 1.6 * (1 - eout(ramp(t, B.lid - 0.25, B.lid))) + (t >= B.lid && t < B.lid + 0.4 ? Math.abs(Math.sin((t - B.lid) * 16)) * 0.06 * Math.exp(-(t - B.lid) * 8) : 0);
    popS(Wd.lock, t, B.safe - 0.06); popS(Wd.safeSign, t, B.safe);
    // villagers' 300 sign, the decoy well, DECOY / FAKE WELL / REAL PROBLEM
    popS(Wd.crowdSign, t, B.v300, 9.0); if (t >= 28) popS(Wd.crowdSign, t, B.v300b, 30.66);
    Wd.wDk.g.visible = t >= B.second; if (Wd.wDk.g.visible) Wd.wDk.g.scale.setScalar(Math.max(0.01, pop(t, B.second, 0.3)));
    Wd.setFill(Wd.fillDkTop, t < B.second ? 1 : 0); Wd.dkLine.visible = t >= B.second;
    const dig = DIG(t); Wd.setFill(Wd.fillDkBot, (dig - Wd.Dk.bot) / (Wd.Dk.top - Wd.Dk.bot));
    Wd.dkBotLine.visible = dig < Wd.Dk.top - 0.02; if (Wd.dkBotLine.visible) { Wd.dkBotLine.scale.y = Wd.Dk.top - dig; Wd.dkBotLine.position.y = (Wd.Dk.top + dig) / 2; }
    const tf = TUN(t); Wd.setFill(Wd.fillT, (Wd.T.x1 - tf) / (Wd.T.x1 - Wd.T.x0), 'x');
    popS(Wd.decoySign, t, B.decoy); popS(Wd.fakeSign, t, B.fake, 13.72); popS(Wd.probSign, t, B.real, 13.72); Wd.probSign.rotation.z = 0.08 * Math.sin(t * 9);
    Wd.depth.forEach((s, i) => popS(s, t, [B.f20, B.f40][i], 19.1));
    // dust: digging the decoy, the dry pail, the dig deeper, the break-in
    burst(Wd.dust, t, B.second, [Wd.Dk.x, 0.3, -0.2], 11, { spread: 1.2, life: 0.8 });
    if (t > 13 && t < 15) burst(Wd.dust, t, 14.3, [Wd.Dk.x, Wd.Dk.top + 0.1, -0.2], 20, { spread: 0.7, life: 0.7 });
    if (t > 15 && t < 17.7) { const k = Math.floor((t - 15.2) / 0.45), t0 = 15.2 + k * 0.45; burst(Wd.dust.slice(0, 10), t, t0, [Wd.Dk.x, dig + 0.1, -0.2], 30 + k, { spread: 0.6, life: 0.45 }); }
    if (t > 17.7 && t < 19.4) burst(Wd.dust, t, B.vault2, [Wd.T.x1, Wd.T.y0 + 0.6, -0.2], 44, { spread: 1.4, life: 0.8 });
    // the flood: water rushes in from the vault side and fills the tunnel
    const fl = ease(ramp(t, B.flood, B.flood + 0.5)); Wd.moat.visible = fl > 0.01; if (Wd.moat.visible) { const w = (Wd.T.x1 - Wd.T.x0 + 0.6) * fl; Wd.moat.scale.set(w, 1, 1); Wd.moat.position.x = Wd.T.x1 - w / 2; Wd.moat.position.y = Wd.T.y0 + 0.27 + 0.04 * Math.sin(t * 3); }
    popS(Wd.moatSign, t, B.moat); Wd.lily.visible = t >= B.moat; Wd.lily.position.y = Wd.T.y0 + 0.56 + 0.02 * Math.sin(t * 2.4);
    // trio: frog, goat
    Wd.frog.visible = t >= B.frog; if (Wd.frog.visible) { Wd.frog.scale.setScalar(Math.max(0.01, pop(t, B.frog, 0.3))); Wd.frog.position.y = Wd.T.y0 + 0.58 + 0.02 * Math.sin(t * 2.4) + (win(t, B.frog, B.frog + 0.3) ? Math.sin((t - B.frog) / 0.3 * Math.PI) * 0.2 : 0); Wd.frog.rotation.y = -0.4 + 0.15 * Math.sin(t * 1.3); }
    const croak = win(t, B.croaks - 0.1, 27.2) ? Math.max(0, Math.sin((t - B.croaks + 0.1) * 9)) : 0; Wd.throat.scale.setScalar(1 + croak * 1.4); popS(Wd.croak, t, B.croaks, 27.3); Wd.croak.rotation.z = 0.1 * Math.sin(t * 11);
    Wd.goat.visible = t >= B.goat; if (Wd.goat.visible) { Wd.goat.scale.setScalar(Math.max(0.01, pop(t, B.goat, 0.3))); Wd.goatHead.rotation.z = t >= B.eats - 0.3 && t < 28.9 ? -0.25 + 0.12 * Math.sin(t * 22) : 0.1 * Math.sin(t * 1.6); Wd.goatHead.position.y = 0.88 + (t >= B.eats - 0.3 && t < 28.9 ? -0.06 : 0); }
    // Steve's speech bubble, the diary, the tumbleweed, the ?
    popS(Wd.bubble, t, B.tells, 30.66); Wd.bubble.rotation.z = 0.05 * Math.sin(t * 7);
    Wd.diary.visible = t >= 30.9 && t < 32.56; if (Wd.diary.visible) Wd.diary.scale.setScalar(Math.max(0.01, pop(t, 30.9, 0.3))); Wd.spot.intensity = Wd.diary.visible ? 40 * eout(ramp(t, 31.2, 31.5)) : 0; if (Wd.diary.visible) Wd.diaryBook.rotation.y = 0.2 * Math.sin(t * 2);
    { const u = ramp(t, 32.6, 34.2); Wd.tumble.visible = win(t, 32.6, 34.2); Wd.tumble.position.set(lerp(-6.5, 2.5, u), 0.24 + Math.abs(Math.sin(u * 14)) * 0.25, -0.7); Wd.tumble.rotation.z = -u * 26; }
    popS(Wd.qmark, t, B.why, 35.0); Wd.qmark.position.y = Wd.V.y1 - 0.35 + 0.04 * Math.sin(t * 6);
    // the red "!" over the guard
    popS(Wd.warn, t, B.but, 4.36); Wd.warn.position.y = 2.75 + 0.05 * Math.sin(t * 9); Wd.warn.rotation.z = 0.12 * Math.sin(t * 13); Wd.warnLight.intensity = win(t, B.but, 4.36) ? 6 * (0.6 + 0.4 * Math.sin(t * 16)) : 0;
    // the note: rises out of the floating bucket and unrolls
    { const u = eout(ramp(t, 37.44, 37.95)); Wd.note.visible = t >= 37.44 && t < 40.1; Wd.note.position.set(0.05, WATER + 0.25 + u * 0.95, -0.45 + u * 0.85); Wd.note.scale.set(Math.max(0.02, eout(ramp(t, 37.7, 37.95))), Math.max(0.05, u), 1); Wd.note.rotation.set(0, 0, 0.04 * Math.sin(t * 2)); }
    // coins: a trickle at the hook (frame 0 is mid-action), a burst on "coin", the drain up the shaft at the end
    Wd.coins.forEach((m, i) => { const r = PAINT.rng(i + 11);
      if (t < 2.0) { const born = -1.0 + i * 0.09, tt = t - born; if (tt < 0 || i > 18) { m.position.y = -50; return; } const x = VX + (r() - 0.5) * 0.9, z = -0.3 + (r() - 0.5) * 0.3; let y = Wd.V.y1 + 0.1 - 3.8 * tt * tt; const rest = PILE - 0.08 + (i % 4) * 0.025 - Math.abs(x - VX) * 0.35; if (y < rest) { y = rest; m.rotation.set(1.3, 0, i); } else m.rotation.set(tt * 9 + i, tt * 4, 0); m.position.set(x, y, z); return; }
      if (t >= 44.9) { const tt = t - 44.9 - i * 0.04; if (tt < 0) { m.position.y = -50; return; } const u = clamp(tt / 0.35); const x = lerp(VX + (r() - 0.5) * 0.6, 0, eout(u)), y = u < 1 ? lerp(PILE, PILE + 0.3, u) : PILE + 0.3 + (tt - 0.35) * 6; m.position.set(x, y, -0.4 + (r() - 0.5) * 0.3); m.rotation.set(tt * 12, i, tt * 7); if (y > 0.5) m.position.y = -50; return; }
      m.position.y = -50; });
    // confetti on "Congratulations"
    Wd.confetti.forEach((m, i) => { const r = PAINT.rng(i + 300), u = t - B.congrats; if (u < 0 || u > 3.2) { m.position.y = -50; return; } m.position.set(-11 + r() * 12 + u * 2.2 + Math.sin(u * 3 + i) * 0.3, 4.5 + r() * 2 - u * 2.4, -0.6 + r() * 1.4); m.rotation.set(u * 7 + i, u * 5, u * 3); m.scale.setScalar(2.2); });
  };

  // ---------- actors ----------
  const actors = (t) => {
    const L = [];
    // YOU
    if (t < 4.36 || win(t, 18.4, 21.5) || win(t, 33.86, 34.86) || win(t, 40.1, 41.86) || t >= 43.6) {
      const sq = (win(t, B.vault2, B.vault2 + 0.5) ? -0.2 * Math.exp(-(t - B.vault2) * 7) : 0);
      L.push(A('you', t, SEAT[0], SEAT[1], SEAT[2], { pose: 'sit', s: 0.7, sq, hop: t < B.well ? Math.abs(Math.sin(t * 6)) * 0.03 : 0,
        expr: [[0, 'grin'], [B.gold, 'beam'], [B.well, 'smugsmile'], [B.vault, 'smirk'], [B.but, 'nervous'], [18.4, 'smirk'], [B.vault2 - 0.1, 'shock'], [B.flood - 0.2, 'angry'], [20.5, 'smugsmile'], [33.86, 'think'], [B.why, 'nervous'], [40.1, 'smugsmile'], [B.coin, 'shock'], [B.never, 'sleepy']],
        L: [[0, 'up'], [B.well, 'hip'], [B.vault2, 'up'], [B.flood - 0.2, 'point'], [20.5, 'hip'], [33.86, 'mouth'], [40.1, 'hip'], [B.coin, 'up'], [44.9, 'hang']],
        R: [[0, 'up'], [B.well, 'holdUp'], [B.vault, 'thumb'], [18.4, 'hold'], [B.vault2, 'up'], [20.5, 'thumb'], [33.86, 'hang'], [40.1, 'thumb'], [B.coin, 'up'], [44.9, 'hang']],
        propR: win(t, B.well, B.vault) ? 'coin' : null, lookBase: t < B.but ? 0.3 : -0.4 }));
    }
    if (win(t, 4.36, 6.9)) L.push(A('you', t, -1.05, 0, -0.3, { expr: [[0, 'smirk'], [B.lid, 'grin'], [B.now, 'smugsmile']], R: [[0, 'up'], [B.lid - 0.1, 'point'], [5.3, 'up'], [5.45, 'point'], [B.now, 'thumb']], propR: t < B.now ? 'gavel' : null, L: 'hip', lookBase: 0.7, hop: win(t, B.lid, B.lid + 0.2) ? 0.06 : 0 }));
    if (win(t, 9.0, 13.72)) { const hp = Math.abs(Math.sin(t * 7)); L.push(A('you', t, -4.15, 0, -0.35, { expr: [[0, 'think'], [B.second, 'grin'], [B.decoy, 'sly'], [B.real, 'nervous']], R: [[0, 'up'], [B.second, 'holdUp'], [B.decoy, 'point']], propR: t < B.decoy ? 'shovel' : null, L: [[0, 'up'], [B.decoy, 'hip']], lookBase: -0.8, hop: t < B.second ? hp * 0.05 : 0 })); }
    // GUARDS
    if (win(t, B.but - 0.2, 4.36)) { const grab = t < B.drop + 0.25 ? eout(ramp(t, B.but + 0.05, B.but + 0.3)) - eout(ramp(t, B.drop, B.drop + 0.2)) : 0;
      L.push(A('g1', t, 1.35, 0, -0.55, { expr: [[0, 'sly'], [B.drop, 'laugh']], L: [[0, 'hip'], [B.drop + 0.2, 'point']], lookBase: -0.8, flip: true, reach: grab > 0.001 ? { to: [0.92, 2.0, -0.45], k: grab, bend: 0.14 } : null })); }
    if (win(t, 14.84, 20.9)) {
      let x = Wd.Dk.x + 0.05, y = DIG(t), ex = [[0, 'stern'], [16.28, 'angry'], [18.4, 'grin'], [B.flood, 'shock']], walk = null, roll = 0, sq = 0;
      if (t >= B.straight - 0.1) { const tf = TUN(t); x = Math.min(tf - 0.2, Wd.T.x1 - 0.1); y = Wd.T.y0; walk = t < B.vault2 ? t * 1.6 : null; }
      if (t >= B.vault2 && t < B.flood) { x = Wd.T.x1 + 0.1 + 0.12 * eout(ramp(t, B.vault2, B.vault2 + 0.2)); }
      if (t >= B.flood) { const u = ramp(t, B.flood + 0.05, B.flood + 0.45), v = ramp(t, B.flood + 0.45, 20.4), w = ramp(t, 20.4, 20.9); x = lerp(Wd.T.x1, Wd.Dk.x, eout(u)); y = Wd.T.y0 + 0.2; roll = u * 30; if (v > 0) { x = Wd.Dk.x; y = lerp(Wd.T.y0 + 0.2, 1.4, eout(v)); roll = v * 200; } if (w > 0) { x = lerp(Wd.Dk.x, Wd.Dk.x - 3.5, w); y = 1.4 + Math.sin(w * Math.PI) * 1.2 - w * 1.6; roll = 200 + w * 300; } }
      const dig = win(t, 15.0, 17.6); L.push(A('g1', t, x, y, -0.3, { s: 0.72, expr: ex, R: dig ? (Math.sin(t * 13) > 0 ? 'up' : 'point') : [[0, 'hold'], [B.flood, 'up']], propR: t < B.vault2 + 0.3 ? 'shovel' : null, L: t >= B.flood ? 'up' : 'hang', walk, roll, sq, flip: t >= B.straight - 0.1 && t < B.flood })); }
    if (win(t, 14.84, 17.7)) L.push(A('g2', t, Wd.Dk.x - 1.25, 0, -0.6, { expr: [[0, 'stern'], [B.f20, 'grin']], R: [[0, 'point'], [B.f40, 'thumb']], L: 'hip', lookBase: 0.6 }));
    // VILLAGERS
    const VIL = ['v1', 'v2', 'v3', 'v4', 'v5'];
    if (win(t, 6.9, 9.0)) VIL.forEach((id, i) => L.push(A(id, t + i, -11.8 + i * 0.78, 0, -0.55 - (i % 2) * 0.55, { pop: B.v300 + i * 0.1, expr: t < B.water ? (i % 2 ? 'stern' : 'angry') : 'angry', R: t >= 7.8 ? 'holdUp' : 'hang', propR: t >= 7.8 ? 'pail' : null, L: 'hip', hop: t >= B.water ? Math.abs(Math.sin(t * 8 + i)) * 0.06 : 0, flip: i % 2 === 1, lookBase: 0.6 })));
    if (win(t, 11.24, 13.72)) VIL.forEach((id, i) => { const drop = t >= 12.0 + i * 0.12; L.push(A(id, t + i, -7.9 + i * 0.55 - (i > 2 ? 0 : 0), 0, -0.6 - (i % 2) * 0.6, { expr: t < B.real ? 'think' : (i % 2 ? 'shock' : 'angry'), R: drop ? 'point' : 'holdUp', propR: drop ? null : 'pail', L: t >= B.real ? 'mouth' : 'hip', lookBase: 0.8, hop: t >= B.real ? Math.abs(Math.sin(t * 8 + i)) * 0.05 : 0 })); });
    if (win(t, 28.3, 32.56)) { const diary = t >= 30.66; VIL.forEach((id, i) => { const p = diary ? [-11.6 + i * 0.65, -0.35 - (i % 2) * 0.9] : [-11.55 + i * 0.58, -0.55 - (i % 2) * 0.6]; L.push(A(id, t + i, p[0] + (diary && i > 1 ? 0.35 : 0), 0, p[1], { expr: diary ? (i % 2 ? 'laugh' : 'shock') : t >= B.tells ? (i % 2 ? 'shock' : 'grin') : 'neutral', R: diary ? 'point' : 'hang', L: t >= B.tells && !diary ? 'mouth' : 'hip', lookBase: diary ? (i < 2 ? 0.7 : -0.7) : 0.6, hop: t >= B.v300b && !diary ? Math.abs(Math.sin(t * 9 + i)) * 0.07 : 0, flip: diary && i > 2 })); }); }
    // STEVE
    if (win(t, 24.7, 25.6)) L.push(A('steve', t, 2.95, 0, -0.5, { pop: B.steve, expr: 'grin', R: 'thumb', L: 'hip', lookBase: -0.3 }));
    if (win(t, 28.3, 30.66)) L.push(A('steve', t, -8.55, 0, -0.4, { expr: [[0, 'grin'], [B.tells, 'laugh']], R: 'holdUp', propR: 'horn', L: [[0, 'hip'], [B.v300b, 'up']], talk: true, flip: true, lookBase: -0.6, hop: Math.abs(Math.sin(t * 6)) * 0.03 }));
    // THE KING
    if (win(t, B.king - 0.1, 38.74)) L.push(A('king', t, 1.45, 0, -0.55, { pop: B.king, expr: 'smugsmile', R: 'thumb', L: 'hip', lookBase: -0.4 }));
    // FINALE: the whole cast on the diorama for "Congratulations. You have built..."
    if (win(t, 41.86, 43.6)) { ['v1', 'v2', 'v3', 'v4', 'v5'].forEach((id, i) => L.push(A(id, t + i, -12.2 + i * 0.75, 0, -0.6 - (i % 2) * 0.6, { expr: i % 2 ? 'laugh' : 'grin', R: 'up', L: 'up', hop: Math.abs(Math.sin(t * 8 + i)) * 0.08 })));
      L.push(A('steve', t, -3.2, 0, -0.5, { expr: 'grin', R: 'thumb', L: 'hip' })); L.push(A('king', t, 1.45, 0, -0.55, { expr: 'smugsmile', R: 'thumb', L: 'hip' })); L.push(A('g1', t, -7.2, 0, -0.6, { expr: 'angry', R: 'hold', L: 'hip' }));
      L.push(A('you', t, SEAT[0], SEAT[1], SEAT[2], { pose: 'sit', s: 0.7, expr: 'beam', L: 'up', R: 'up' })); }
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
    return { t, cam: Cm, light: { ...LIGHT.dio }, dof: dofAt(Cm), actors: actors(t), whip: Cm.whip, flash: 0, ca: caAt(t) };
  };
  const SHOTS = [{ t: 0, set: 'dio', n: 'Gold in the well' }, { t: 4.36, set: 'dio', n: 'The lid' }, { t: 6.9, set: 'dio', n: 'The village' }, { t: 9.0, set: 'dio', n: 'The decoy' }, { t: 14.84, set: 'dio', n: 'Digging deeper' }, { t: 19.12, set: 'dio', n: 'The moat' }, { t: 23.26, set: 'dio', n: 'The trio' }, { t: 28.3, set: 'dio', n: 'Steve tells' }, { t: 33.86, set: 'dio', n: 'Wait, why?' }, { t: 37.26, set: 'dio', n: 'The note' }, { t: 41.86, set: 'dio', n: 'Congratulations' }];
  return { FPS, END, TOTAL, frame, drawCaption, K, SHOTS, CAPS };
})();
