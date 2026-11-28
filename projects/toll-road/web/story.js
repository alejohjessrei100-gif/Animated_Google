// "The Toll Road" starring Gus (escalation format). Timed to the 1.25x voice (words.js). 30 fps, 1080x1920.
// The diorama grows with every "So you...". Pop-ins land on the exact word; big re-aims are 0.14 s whips. No text signs.
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
  const B = { toll: 0.58, road: 1.4, business: 2.38, but: 3.12, dirt: 4.08, pave: 4.96, nowRoad: 5.68, ends: 7.08, swamp: 7.6, bridge: 8.84, shortcut: 9.92, lawsuit: 10.84,
    carts: 11.64, sinks: 13.14, feet: 13.84, charge: 14.68, c2: 14.86, coins: 15.1, highway: 16.3, workers: 17.68, pigeon: 19.1, horse: 19.64, ray: 20.58, counts: 21.42, badly: 22.44,
    eats: 23.48, receipts: 23.92, yells: 25.04, free: 26.14, guarding: 27.16, screen: 28.06, pour: 29.58, k900: 30.48, wait: 31.7, empty: 33.32, because: 33.94, not: 34.92, mistake: 35.58,
    owns: 37.08, road2: 37.52, bridge2: 38.32, swamp2: 39.18, rent: 40.54, congrats: 41.18, busiest: 42.78, kingdom: 43.78, only: 44.78, paying: 45.4, toll2: 45.82 };

  // ---------- cast ----------
  const C = {
    gus: { head: 'box', skin: '#f2c7a0', stubble: 'rgba(60,40,30,.42)', hat: 'flattop', hair: '#1e1714', outfit: 'overalls', top: '#e0574a', armCol: '#e0574a', legCol: '#3d5a80', handCol: '#f2c7a0', shoes: '#3b2a20', goldTooth: true, limbW: 18, bodyW: 88, bodyH: 215, legL: 200 },
    seller: { outfit: 'suit', top: '#5a3b5a', tie: '#f4d35e', shirt: '#f6f3ee', hat: 'tophat', moustache: '#2a1d17' },
    ray: { outfit: 'tee', top: '#3fa39a', pants: '#8a5734', hat: 'straw', beard: '#b8b2a6', hairStyle: 'bald' },
    lawyer: { outfit: 'suit', top: '#2b2f3d', tie: '#c62f36', hairStyle: 'bald', hair: '#c9c2b5', glasses: 'round' },
  };
  const SEED = { gus: 0.4, seller: 1.8, ray: 3.1, lawyer: 4.4 };
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
  const LIGHT = { dio: { sky: '#cfe8ff', ground: '#c9b58e', hemi: 1.35, sun: '#fff1d6', sunI: 2.1, az: -35, el: 58, fog: '#cfe6ff', bg: '#9fd0ff', fogNear: 30, fogFar: 120, sat: 1.1, fillI: 1.35, fillCol: '#fff0dc', shadowExt: 10, expo: 1.55 } };

  // ---------- camera ----------
  const LX = (Wd.LAIR.x0 + Wd.LAIR.x1) / 2, BMID = (Wd.bridgeX[0] + Wd.bridgeX[1]) / 2;
  const K = [
    { t: 0.0, pos: [0.1, 1.3, 4.7], look: [0.1, 1.0, -0.3], fov: 48, drift: [-0.2, 0.05, -0.6], roll: -1.5 },                        // booth slams down, the seller hands it over
    { t: B.road - 0.06, pos: [-0.8, 1.7, 7.0], look: [-0.8, 0.7, -1.0], fov: 50, drift: [0.4, 0.1, -0.4] },                                // the dirt road
    { t: B.business - 0.06, pos: [-0.55, 1.4, 3.0], look: [-0.7, 1.2, -0.3], fov: 46, drift: [-0.15, 0.05, -0.35], roll: 2 },              // business (gold-tooth grin)
    { t: B.but - 0.06, pos: [-3.2, 1.3, 5.0], look: [-3.8, 0.5, -1.2], fov: 50, drift: [0.3, 0, -0.4] },                                   // nobody drives on dirt
    { t: 4.46, pos: [-1.0, 0.9, 4.4], look: [-2.2, 0.3, -1.2], fov: 50, drift: [-2.4, 0.05, 0.2], dlook: [-2.6, 0, 0] },                    // pave it (asphalt rolls out)
    { t: B.nowRoad - 0.06, pos: [-1.6, 1.15, 4.6], look: [-1.2, 0.5, -1.2], fov: 50, drift: [4.6, 0.1, 0], dlook: [4.6, 0, 0] },            // a road (cart follows)
    { t: B.ends - 0.06, pos: [4.9, 1.35, 4.2], look: [6.3, 0.15, -1.2], fov: 50, drift: [0.4, 0.1, -0.3] },                                // ends at a swamp
    { t: 8.14, pos: [7.9, 1.7, 6.6], look: [7.9, 0.3, -1.2], fov: 50, drift: [0, 0.1, -0.6] },                                              // build a bridge
    { t: 9.38, pos: [5.6, 1.1, 4.4], look: [7.0, 0.5, -1.2], fov: 50, drift: [2.6, 0.05, 0], dlook: [2.6, 0, 0] },                          // a shortcut
    { t: B.lawsuit - 0.12, pos: [5.25, 1.35, 3.0], look: [5.0, 1.15, -0.2], fov: 46, drift: [-0.1, 0.05, -0.3], roll: -2 },                // and a lawsuit
    { t: 11.6, pos: [5.0, 2.4, 9.0], look: [6.8, 0.6, -1.2], fov: 50, drift: [0.8, -0.2, -0.8] },                                          // 40 carts cross
    { t: 12.9, pos: [7.9, 1.0, 5.4], look: [7.9, -0.05, -1.2], fov: 50, drift: [0, -0.1, -0.5] },                                         // the bridge sinks 3 feet
    { t: 14.28, pos: [-0.3, 1.45, 3.4], look: [-0.35, 1.18, 0.0], fov: 46, drift: [-0.1, 0.03, -0.3], roll: 1.5 },                          // charge 2 coins
    { t: 15.7, pos: [2.0, 3.4, 9.6], look: [2.0, 0.6, -1.6], fov: 50, drift: [-0.8, 0.2, 0.4] },                                           // a highway
    { t: 16.86, pos: [-0.45, 1.4, 3.5], look: [-0.5, 1.1, -0.4], fov: 46, drift: [0.1, 0.05, -0.4] },                                      // needs workers
    { t: 18.9, pos: [-0.35, 1.4, 3.3], look: [-0.4, 1.15, 0.0], fov: 46, drift: [0.05, 0.02, -0.25] },                                     // a pigeon
    { t: 19.56, pos: [0.8, 1.45, 4.0], look: [0.8, 1.0, -0.3], fov: 48, drift: [0.2, 0.05, -0.2] },                                       // a horse
    { t: 20.3, pos: [-1.4, 1.45, 3.5], look: [-1.55, 1.1, -0.2], fov: 46, drift: [-0.1, 0.05, -0.3], roll: -1.5 },                         // Uncle Ray
    { t: 21.0, pos: [-0.35, 1.35, 3.1], look: [-0.4, 1.15, 0.0], fov: 46, drift: [0.03, 0.02, -0.25] },                                   // pigeon counts, badly
    { t: 23.08, pos: [1.15, 1.5, 2.7], look: [0.95, 1.25, -0.1], fov: 46, drift: [-0.1, 0.03, -0.3] },                                    // horse eats receipts
    { t: 24.5, pos: [-1.3, 1.4, 3.2], look: [-1.4, 1.15, -0.3], fov: 48, drift: [0.3, 0.05, -0.3], roll: 2 },                              // family rides free
    { t: 26.74, pos: [-9.5, 1.45, 3.2], look: [-9.5, 1.0, -2.2], fov: 48, drift: [0.2, 0.05, -0.6] },                                     // bank + screen door
    { t: 28.6, pos: [-0.3, 1.6, 3.6], look: [-0.3, 1.25, 0.0], fov: 46, drift: [-0.1, -0.1, -0.5] },                                       // the coins pour in
    { t: 30.42, pos: [-0.3, 1.35, 3.0], look: [-0.3, 1.2, 0.05], fov: 44, drift: [0, 0.02, -0.15], roll: -2 },                              // 900 a week
    { t: 31.66, pos: [-0.35, 1.38, 3.2], look: [-0.4, 1.18, -0.1], fov: 46, drift: [0.05, 0, -0.3] },                                       // Wait, why is your jar empty?
    { t: B.because - 0.06, pos: [0.7, -0.8, 4.3], look: [0.6, -1.3, -0.3], fov: 50, drift: [0.4, -0.6, 0], dlook: [0.6, -1.2, 0] },         // down the pipe
    { t: B.not - 0.04, pos: [LX, -2.55, 4.7], look: [LX, -2.7, -0.6], fov: 50, drift: [0.1, 0.05, -0.6] },                                  // the lair
    { t: 36.2, pos: [LX + 0.45, -2.75, 2.7], look: [LX + 0.55, -2.95, -0.4], fov: 46, drift: [-0.1, 0.03, -0.3], roll: 1.5 },               // the man who sold it
    { t: 37.0, pos: [LX - 0.2, -0.9, 7.2], look: [LX - 0.2, -1.2, -0.8], fov: 50, drift: [0.6, 0.1, -0.3] },                                // owns the road
    { t: 38.2, pos: [BMID - 0.5, -0.5, 7.0], look: [BMID - 0.5, -0.4, -1.2], fov: 50, drift: [0.8, 0.05, -0.4] },                          // and the bridge, and the swamp
    { t: 39.78, pos: [LX, -2.6, 4.4], look: [LX, -2.8, -0.6], fov: 50, drift: [-0.2, 0.05, -0.5], roll: -1.5 },                            // paying him rent
    { t: B.congrats - 0.06, pos: [-2.6, -0.4, 6.8], look: [-2.6, -0.8, -1.0], fov: 50, drift: [11.0, 0, -0.4], dlook: [11.0, 0, 0] },      // Congratulations: pan the build
    { t: 44.4, pos: [-0.3, 1.35, 3.4], look: [-0.3, 1.15, -0.1], fov: 46, drift: [0.05, 0.02, -0.35] },                                  // the only one paying the toll
  ];
  K.forEach((k, i) => { k.set = 'dio'; k.t1 = i + 1 < K.length ? K[i + 1].t : END + 0.5; });
  const SHAKES = [[B.toll, 0.05], [B.but, 0.015], [B.pave, 0.02], [B.swamp, 0.05], [B.bridge, 0.02], [B.lawsuit, 0.02], [B.sinks, 0.03], [B.feet, 0.06], [B.c2, 0.015], [B.highway, 0.03], [B.pigeon, 0.015], [B.horse, 0.02], [B.ray, 0.02], [B.badly, 0.03], [B.free, 0.03], [B.k900, 0.03], [B.empty, 0.05], [B.not, 0.06], [B.owns, 0.03], [B.bridge2, 0.02], [B.swamp2, 0.02], [B.congrats, 0.03], [B.toll2, 0.02]];
  const IMPACTS = [B.toll, B.swamp, B.feet, B.empty, B.not];
  const caAt = (t) => { let c = 0; for (const a of IMPACTS) if (t >= a && t < a + 0.35) c = Math.max(c, 0.018 * Math.exp(-(t - a) * 11)); return c; };
  const compAt = (t) => { let i = 0; for (let k = 0; k < K.length; k++) if (t >= K[k].t) i = k; return i; };
  const compState = (k, t) => { const u = ease(clamp((t - k.t) / Math.max(0.6, k.t1 - k.t))) * 0.85 + clamp((t - k.t) / (k.t1 - k.t)) * 0.15; const d = k.drift || [0, 0, 0], dl = k.dlook || [0, 0, 0];
    return { pos: [k.pos[0] + d[0] * u, k.pos[1] + d[1] * u, k.pos[2] + d[2] * u], look: [k.look[0] + dl[0] * u, k.look[1] + dl[1] * u, k.look[2] + dl[2] * u], fov: k.fov, roll: k.roll || 0 }; };
  const WHIP = new Map(); const isWhip = (a, b) => { if (!a || !b) return false; if (b.whipIn !== undefined) return b.whipIn; const key = a.t + ':' + b.t; if (WHIP.has(key)) return WHIP.get(key); const pa = compState(a, b.t), pb = compState(b, b.t); const da = [pa.look[0] - pa.pos[0], pa.look[1] - pa.pos[1], pa.look[2] - pa.pos[2]], db = [pb.look[0] - pb.pos[0], pb.look[1] - pb.pos[1], pb.look[2] - pb.pos[2]]; const cs = (da[0] * db[0] + da[1] * db[1] + da[2] * db[2]) / (Math.hypot(...da) * Math.hypot(...db)); const w = cs < 0.72 || Math.hypot(pa.pos[0] - pb.pos[0], pa.pos[1] - pb.pos[1], pa.pos[2] - pb.pos[2]) > 2.6; WHIP.set(key, w); return w; };
  const camAt = (t) => {
    const i = compAt(t), k = K[i]; let s = compState(k, t), whip = [0, 0]; const prev = K[i - 1];
    const ein = k.ein || 0.45, WH = 0.14;
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
  const RZ = Wd.ROADZ, JAR = [0.25, 1.05, 0.12], JTOP = [0.25, 1.48, 0.12], GUS = [-0.85, 0, 0.02];
  const sagAt = (t) => 0.9 * eout(ramp(t, B.sinks, B.feet)) * (1 - ease(ramp(t, B.highway, B.highway + 0.5)));
  const bridgeY = (x, t) => { const [a, b] = Wd.bridgeX; if (x < a || x > b) return 0; const u = (x - a) / (b - a); return 0.06 - sagAt(t) * Math.sin(Math.PI * u); };
  const burst = (bits, t, t0, c, n0, o = {}) => bits.forEach((m, i) => { const r = PAINT.rng(i + n0), u = t - t0, life = o.life || 0.7; if (u < 0 || u > life) { m.position.y = -50; return; } const a = r() * Math.PI * 2, sp = (0.7 + r() * 1.5) * (o.spread || 1); m.position.set(c[0] + Math.cos(a) * sp * u, c[1] + Math.abs(Math.sin(a)) * sp * u * (o.up || 1.4) - (o.g ?? 2.4) * u * u, c[2] + (r() - 0.5) * 0.4 + 0.2); m.scale.setScalar(Math.max(0.01, (o.sc || 1.3) * (1 - u / life))); m.rotation.set(u * 9 + i, u * 5, 0); });
  const popG = (o, t, a, until = 1e9) => { o.visible = t >= a && t < until; if (o.visible) o.scale.setScalar(Math.max(0.001, pop(t, a, 0.3))); };
  const jarLevel = (t) => { let f = 0; if (t >= B.c2) f = 0.08; if (t >= B.coins) f = 0.16; f += 0.12 * ramp(t, 15.7, 21.4); if (t >= B.badly) f -= 0.12 * eout(ramp(t, B.badly, B.badly + 0.4)); f += 0.78 * ease(ramp(t, 28.7, 31.2)); f *= 1 - ease(ramp(t, 32.95, 33.3)); if (t >= 45.5) f = 0.06 * (1 - ease(ramp(t, 45.9, 46.2))); return clamp(f); };
  const PIPE = [[0.25, 0.95], [0.25, -2.55], [0.42, -2.75], [1.45, -2.75], [2.1, -2.75], [LX + 0.1, -3.2]];
  const pipeAt = (u) => { const n = PIPE.length - 1, f = clamp(u) * n, i = Math.min(n - 1, Math.floor(f)), k = f - i; return [lerp(PIPE[i][0], PIPE[i + 1][0], k), lerp(PIPE[i][1], PIPE[i + 1][1], k)]; };
  const state = (t) => {
    // the booth drops in (frame 0 is mid-fall), slams on "toll"
    { const u = ramp(t, -0.1, B.toll); Wd.booth.position.y = 2.4 * (1 - u * u) + (t >= B.toll && t < B.toll + 0.4 ? Math.abs(Math.sin((t - B.toll) * 18)) * 0.08 * Math.exp(-(t - B.toll) * 8) : 0); Wd.booth.rotation.z = t < B.toll ? 0.08 * Math.sin(t * 9) : 0; }
    const by = Wd.booth.position.y; Wd.jar.position.y = 1.05 + by; Wd.pigeon.position.y = 1.05 + by;
    burst(Wd.dust, t, B.toll, [0, 0.1, 0.0], 3, { spread: 1.6, up: 0.6, life: 0.8 });
    // the road: dirt -> asphalt rolls out on "pave" (with steam) -> second lane, lamps, pillars on "highway"
    const pv = ease(ramp(t, B.pave - 0.2, B.pave + 0.55)); Wd.setPave(pv); Wd.dashes.forEach((d) => { d.visible = pv > 0.99; });
    if (t > 4.6 && t < 6.2) Wd.steam.forEach((m, i) => { const r = PAINT.rng(i + 7), x0 = lerp(0, i % 2 ? Wd.S.x0 : -14, pv) * (0.3 + r() * 0.7), u = (t * 0.8 + r()) % 1; m.position.set(x0, 0.1 + u * 0.8, RZ + (r() - 0.5) * 1.2); m.scale.setScalar(0.6 + u * 1.2); }); else Wd.steam.forEach((m) => { m.position.y = -50; });
    popG(Wd.lane2, t, B.highway); Wd.lane2.scale.set(1, 1, Math.max(0.01, Wd.lane2.scale.x)); Wd.lane2.scale.x = 1;
    Wd.lamps.forEach((l, i) => popG(l, t, B.highway + i * 0.05));
    Wd.pillars.forEach((p, i) => { p.visible = t >= B.highway; p.position.y = -0.8 - 1.6 * (1 - eout(ramp(t, B.highway + i * 0.1, B.highway + 0.4 + i * 0.1))); });
    // the bridge: planks pop in on "bridge", sag 3 feet on "sinks... feet", lifted by the pillars on "highway"
    Wd.planks.forEach((p, i) => { const a = B.bridge - 0.5 + i * 0.03; p.visible = t >= a; if (!p.visible) return; p.scale.setScalar(Math.max(0.01, pop(t, a, 0.2))); p.position.y = bridgeY(p.position.x, t); const [x0, x1] = Wd.bridgeX; const u = p.userData.u; p.rotation.z = -sagAt(t) * Math.PI / (x1 - x0) * Math.cos(Math.PI * u) * 0.9; });
    Wd.rails.forEach((r) => { r.visible = false; });
    // swamp bubbles + the splash when the first cart drives in
    Wd.bubbles.forEach((m, i) => { const r = PAINT.rng(i + 30), u = (t * 0.5 + r()) % 1; m.position.set(Wd.S.x0 + 0.4 + r() * 3.8, -0.15 + u * 0.12, ZFRONT(r)); m.scale.setScalar(u < 0.9 ? 0.6 + u : 0.01); });
    burst(Wd.drops, t, B.swamp, [6.1, 0.0, RZ + 0.3], 5, { spread: 1.0, up: 2.4, g: 5, life: 0.8 });
    if (t > 13 && t < 15) burst(Wd.drops, t, B.feet, [BMID, -0.4, RZ + 0.4], 25, { spread: 1.3, up: 2.0, g: 5, life: 0.7 });
    // barrier arm: up for traffic, down to charge, pumping for Uncle Ray
    let armA = t < B.nowRoad ? 0 : 1.3; if (win(t, 14.3, 15.4)) armA = 1.3 * (1 - eout(ramp(t, 14.3, 14.5))) + 1.3 * eout(ramp(t, 15.2, 15.4)); if (win(t, B.yells, 26.8)) armA = 1.3 + 0.25 * Math.sin(t * 14); Wd.arm.rotation.x = armA;
    // the jar
    const lv = jarLevel(t), h = Math.max(0.001, 0.34 * lv); Wd.jarFill.visible = lv > 0.005; Wd.jarFill.scale.y = h; Wd.jarFill.position.y = 0.01 + h / 2; Wd.jarLight.intensity = 3 * lv; Wd.jarLight.position.y = 1.4 + by;
    // pigeon: bob, peck the coins
    Wd.pigeon.visible = t >= B.pigeon; if (Wd.pigeon.visible) { Wd.pigeon.scale.setScalar(Math.max(0.01, pop(t, B.pigeon, 0.3))); const peck = win(t, B.counts - 0.1, B.badly + 0.2) ? Math.max(0, Math.sin(t * 16)) : Math.max(0, Math.sin(t * 3)) * 0.3; Wd.pigHead.rotation.z = -peck * 0.9; Wd.pigHead.position.x = 0.12 + peck * 0.04; Wd.pigeon.rotation.y = win(t, B.badly, B.badly + 0.5) ? (t - B.badly) * 12 : 0.4; }
    // horse: eats the receipts
    Wd.horse.visible = t >= B.horse; if (Wd.horse.visible) { Wd.horse.scale.setScalar(Math.max(0.01, pop(t, B.horse, 0.3))); const eat = win(t, B.eats - 0.3, 24.4); Wd.horseNeck.rotation.z = eat ? -0.35 + 0.08 * Math.sin(t * 20) : 0.05 * Math.sin(t * 1.4); }
    Wd.receipts.forEach((m, i) => { const u = (t - (B.eats - 0.2) - i * 0.12) / 0.4; if (u < 0 || u > 1 || t > 24.4) { m.position.y = -50; return; } m.position.set(lerp(0.5, 0.82, u), 0.95 + by + Math.sin(u * Math.PI) * 0.25, lerp(0.3, -0.05, u)); m.rotation.set(u * 3, u * 2, Math.sin(u * 9) * 0.5); m.scale.set(1, 1 - u * 0.8, 1); });
    // bank with a screen door (the analogy): flaps in the wind
    Wd.bank.visible = win(t, 26.6, 28.6); Wd.screenDoor.rotation.y = -0.6 - 0.5 * Math.sin(t * 5) * (0.6 + 0.4 * Math.sin(t * 1.3));
    // the hidden lair: soil cover drops away on "not", the pipe shows when the jar drains
    Wd.lairCover.visible = t < B.not; Wd.lair.visible = t >= B.not - 0.2 || t >= B.congrats; Wd.pipe.visible = t >= 33.6; Wd.lairLight.intensity = t >= B.not ? 4 + 0.4 * Math.sin(t * 6) : 0;
    if (t > 34 && t < 36) burst(Wd.dust, t, B.not, [LX, -2.6, 0.2], 50, { spread: 2.0, life: 0.8, g: 3 });
    Wd.hoard.scale.setScalar(1 + 0.2 * ramp(t, 39.9, 41.0));
    // ownership glows: road, bridge, swamp
    const glow = (a) => (t >= a && t < a + 1.0 ? Math.sin((t - a) / 1.0 * Math.PI) : 0);
    Wd.asph[0].material.emissive.set('#f4c430'); Wd.asph[0].material.emissiveIntensity = 0.9 * glow(B.owns);
    E_col('#9a6a3e').emissive.set('#f4c430'); E_col('#9a6a3e').emissiveIntensity = 0.9 * glow(B.bridge2); E_col('#8a5a32').emissive.set('#f4c430'); E_col('#8a5a32').emissiveIntensity = 0.9 * glow(B.bridge2);
    Wd.swampM.emissive.set(glow(B.swamp2) > 0 ? '#c8a020' : '#2a4a1a'); Wd.swampM.emissiveIntensity = 0.35 + 0.8 * glow(B.swamp2);
    // wagons
    wagons(t);
    // coins
    Wd.coins.forEach((m, i) => {
      const r = PAINT.rng(i + 11); m.visible = true;
      if (i < 2 && win(t, B.c2 - 0.25, B.coins + 0.3)) { const t0 = (i ? B.coins : B.c2) - 0.25, u = clamp((t - t0) / 0.3); if (t < t0) { m.position.y = -50; return; } const s = [-0.45, 1.35 + by, 0.25], e = [0.25, 1.1 + by, 0.12]; m.position.set(lerp(s[0], e[0], u), lerp(s[1], e[1], u) + Math.sin(u * Math.PI) * 0.4, lerp(s[2], e[2], u)); m.rotation.set(u * 14, 0, u * 6); if (u >= 1) m.position.y = -50; return; }
      if (i < 10 && win(t, B.badly, B.badly + 1.2)) { const u = t - B.badly, a = r() * 6.28, sp = 0.5 + r() * 0.8; let y = 1.35 + by + (1.2 + r()) * u - 4.9 * u * u; if (y < 0.03) y = 0.03 + (i % 3) * 0.01; m.position.set(0.1 + Math.cos(a) * sp * Math.min(u, 0.6), y, 0.15 + Math.abs(Math.sin(a)) * 0.4 * Math.min(u, 0.6)); m.rotation.set(u * 12 + i, u * 4, 0); return; }
      if (win(t, 28.6, 31.3)) { const tt = (t - 28.6 - i * 0.065); if (tt < 0) { m.position.y = -50; return; } const u = (tt % 0.7) / 0.7; m.position.set(0.25 + (r() - 0.5) * 0.25, 3.2 - u * (3.2 - 1.3 - by), 0.12 + (r() - 0.5) * 0.15); m.rotation.set(u * 10 + i, u * 5, 0); return; }
      if (win(t, 32.9, 36.0) || win(t, 39.8, 41.2)) { const t0 = t < 37 ? 32.95 : 39.8, tt = t - t0 - i * 0.07; if (tt < 0 || tt > 1.4 || i > 24) { m.position.y = -50; return; } const [x, y] = pipeAt(tt / 1.4); m.position.set(x, y, Wd.ZF + 0.05); m.rotation.set(tt * 10, i, 0); return; }
      if (i === 0 && win(t, 45.1, 46.4)) { const u = ramp(t, 45.15, B.paying), d = ramp(t, 45.9, 46.3); const s = [-0.4, 1.5 + by, 0.25]; if (d > 0) { const [x, y] = pipeAt(d * 0.45); m.position.set(x, y, Wd.ZF + 0.05); } else m.position.set(lerp(s[0], JTOP[0], u), lerp(s[1], JTOP[1] + by - 0.05, u) + Math.sin(u * Math.PI) * 0.2, lerp(s[2], JTOP[2], u)); m.rotation.set(u * 8, 0, 0); return; }
      m.position.y = -50; });
    // sparks: the jar fills, 900 a week, the lair
    burst(Wd.sparks.slice(0, 12), t, B.k900, [0.25, 1.5 + by, 0.3], 70, { spread: 1.1 });
    burst(Wd.sparks.slice(12), t, B.not + 0.1, [LX + 0.1, -3.0, 0.2], 90, { spread: 1.3 });
    // confetti on "Congratulations" (falls across the whole pan)
    Wd.confetti.forEach((m, i) => { const r = PAINT.rng(i + 300), u = t - B.congrats; if (u < 0 || u > 3.4) { m.position.y = -50; return; } m.position.set(-9 + r() * 6 + u * 3.6 + Math.sin(u * 3 + i) * 0.3, 4.5 + r() * 2 - u * 2.2, -0.6 + r() * 1.4); m.rotation.set(u * 7 + i, u * 5, u * 3); m.scale.setScalar(2.4); });
  };
  const ZFRONT = (r) => Wd.ZF - 0.3 - r() * 0.2;
  const E_col = (c) => ENGINE.col(c);
  // wagons: scripted per phase
  const placeWagon = (w, x, z, t, dir = 1, extraY = 0, rz = 0) => { w.visible = true; w.position.set(x, bridgeY(x, t) + extraY, z); w.rotation.set(0, dir > 0 ? 0 : Math.PI, rz); w.userData.wheels.forEach((wh) => { wh.rotation.z = -x * 4 * dir; }); };
  const wagons = (t) => {
    const W = Wd.wagons; W.forEach((w) => { w.visible = false; });
    if (win(t, B.but - 0.3, 5.0)) { // a cart tries the dirt, sinks, backs off
      const fw = ease(ramp(t, B.but - 0.3, B.dirt - 0.2)), bk = ease(ramp(t, B.dirt + 0.3, 5.0)); const x = -9 + fw * 5.2 - bk * 5.5; placeWagon(W[0], x, RZ, t, 1, -0.07 * ramp(t, B.dirt - 0.3, B.dirt) * (1 - bk), 0.06 * Math.sin(t * 20) * ramp(t, B.dirt - 0.3, B.dirt) * (1 - bk)); return; }
    if (win(t, B.nowRoad - 0.1, 8.2)) { // first cart on the new road drives straight into the swamp
      const x = lerp(-3.0, Wd.S.x0, ramp(t, B.nowRoad - 0.1, B.swamp)); const p = ramp(t, B.swamp, B.swamp + 0.35); placeWagon(W[0], x + p * 0.7, RZ, t, 1, -0.75 * eout(p), -0.7 * eout(p)); return; }
    if (win(t, 9.2, 15.7)) { // one cart (shortcut), then the stream (40 carts) over the bridge
      const n = t < 11.5 ? 1 : W.length; for (let i = 0; i < n; i++) { const x = (t < 11.5 ? lerp(3.0, 12.0, ramp(t, 9.3, 11.4)) : 5.0 + (t - 11.5) * 3.2 - i * 1.45); if (x < -16 || x > 16) continue; const jam = win(t, 14.3, 15.3) && x < -0.2 ? Math.min(x, -0.8 - i * 1.2) : x; placeWagon(W[i], t < 11.5 ? x : jam, RZ, t, 1); } return; }
    if (t >= 15.7) { // highway: two lanes both ways
      for (let i = 0; i < W.length; i++) { const lane2 = i % 2 === 1 && t >= B.highway; const sp = lane2 ? 3.6 : 3.0, gap = 2.6, span = 34; let x = ((t - 15.7) * sp + i * gap * 1.37) % span - 17; if (lane2) x = -x; placeWagon(W[i], x, lane2 ? RZ - 1.2 : RZ, t, lane2 ? -1 : 1); } }
  };

  // ---------- actors ----------
  const actors = (t) => {
    const L = []; const by = Wd.booth.position.y;
    const finale = win(t, B.congrats - 0.06, 44.4);
    // GUS at his booth
    { const reachJar = win(t, 45.1, 45.9) ? eout(ramp(t, 45.1, 45.3)) - eout(ramp(t, 45.6, 45.85)) : 0;
      L.push(A('gus', t, GUS[0], 0, GUS[2], { expr: [[0, 'grin'], [B.but, 'think'], [B.pave, 'grin'], [B.ends, 'nervous'], [B.bridge, 'smugsmile'], [B.lawsuit, 'shock'], [B.carts, 'grin'], [B.sinks, 'nervous'], [B.charge, 'smirk'], [B.highway, 'laugh'], [B.workers, 'nervous'], [B.pigeon, 'grin'], [B.badly, 'angry'], [B.eats, 'shock'], [B.yells, 'angry'], [28.6, 'beam'], [B.k900, 'laugh'], [B.wait, 'think'], [B.empty, 'shock'], [B.congrats, 'grin'], [44.4, 'bored']],
        R: [[0, 'thumb'], [B.but, 'chin'], [B.pave, 'point'], [B.ends, 'mouth'], [B.bridge, 'thumb'], [B.lawsuit, 'up'], [B.carts, 'thumb'], [B.charge, 'holdUp'], [B.highway, 'up'], [B.workers, 'up'], [B.pigeon, 'point'], [B.badly, 'point'], [B.yells, 'mouth'], [28.6, 'up'], [B.k900, 'thumb'], [B.wait, 'chin'], [B.empty, 'up'], [B.congrats, 'thumb'], [44.4, 'holdUp']],
        L: [[0, 'hip'], [B.lawsuit, 'up'], [B.carts, 'hip'], [B.highway, 'up'], [B.pigeon, 'hip'], [28.6, 'up'], [B.k900, 'hip'], [B.empty, 'up'], [B.congrats, 'hip']],
        propR: win(t, B.charge, B.coins + 0.1) ? 'coin' : win(t, 44.4, 45.15) ? 'coin' : null, lookBase: 0.5, hop: win(t, B.highway, B.highway + 0.6) || win(t, B.k900, B.k900 + 0.6) ? Math.abs(Math.sin(t * 9)) * 0.06 : 0,
        reach: reachJar > 0.001 ? { to: [JTOP[0], JTOP[1] + by + 0.05, JTOP[2]], k: reachJar, prop: 'coin', bend: 0.12 } : null })); }
    // THE SELLER: hands over the booth in the hook, walks off; later sits in the lair
    if (t < 2.6) { const w = ramp(t, 1.5, 2.6); L.push(A('seller', t, 1.05 + w * 2.2, 0, 0.05, { expr: [[0, 'smirk'], [1.2, 'sly']], R: [[0, 'thumb'], [1.5, 'hold']], propR: t >= 1.5 ? 'moneybag' : null, L: 'hip', walk: w > 0 && w < 1 ? t * 1.7 : null, lookBase: -0.7, flip: t >= 1.5 })); }
    if (t >= B.not - 0.2 && !win(t, 37.0, 39.78) && t < B.congrats - 0.06) L.push(A('seller', t, LX + 0.6, Wd.LAIR.y0 + 0.5, -0.35, { pose: 'sit', s: 0.8, expr: [[0, 'smugsmile'], [B.owns, 'sly'], [B.rent, 'laugh']], R: [[0, 'thumb'], [B.rent, 'up']], L: [[0, 'hip'], [B.rent, 'up']], lookBase: -0.5, hop: t >= B.rent ? Math.abs(Math.sin(t * 9)) * 0.03 : 0 }));
    if (win(t, 37.0, 39.78)) L.push(A('seller', t, LX + 0.6, Wd.LAIR.y0 + 0.5, -0.35, { pose: 'sit', s: 0.8, expr: 'sly', R: 'up', L: 'hip', lookBase: 0.5 }));
    // THE LAWYER
    if (win(t, B.lawsuit - 0.15, 11.6)) L.push(A('lawyer', t, 4.85, 0, 0.05, { pop: B.lawsuit, expr: 'stern', R: 'holdUp', propR: 'scroll', L: 'point', flip: true, lookBase: -0.8 }));
    // UNCLE RAY
    if (t >= B.ray - 0.1 && !finale) L.push(A('ray', t, -1.85, 0, 0.05, { pop: B.ray, expr: [[0, 'grin'], [B.yells, 'laugh'], [B.free + 0.3, 'grin']], R: [[0, 'thumb'], [B.yells, 'wave'], [27.0, 'thumb']], L: [[0, 'hip'], [B.yells, 'mouth'], [B.free + 0.3, 'hip']], talk: win(t, B.yells, B.free + 0.3), lookBase: 0.4, hop: win(t, B.yells, B.free + 0.4) ? Math.abs(Math.sin(t * 10)) * 0.05 : 0 }));
    if (finale) { L.push(A('ray', t, -1.85, 0, 0.05, { expr: 'laugh', R: 'wave', L: 'up' })); L.push(A('seller', t, LX + 0.6, Wd.LAIR.y0 + 0.5, -0.35, { pose: 'sit', s: 0.8, expr: 'smugsmile', R: 'thumb', L: 'hip' })); L.push(A('lawyer', t, 4.85, 0, 0.05, { expr: 'stern', R: 'holdUp', propR: 'scroll' })); }
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
  const SHOTS = [{ t: 0, n: 'The booth' }, { t: 3.06, n: 'Dirt' }, { t: 4.46, n: 'Pave it' }, { t: 7.02, n: 'The swamp' }, { t: 8.14, n: 'The bridge' }, { t: 11.6, n: '40 carts' }, { t: 14.28, n: '2 coins' }, { t: 15.7, n: 'Highway' }, { t: 18.9, n: 'The trio' }, { t: 26.74, n: 'Screen door' }, { t: 28.6, n: 'Coins pour in' }, { t: 31.66, n: 'Wait, why?' }, { t: 33.88, n: 'The pipe' }, { t: 41.12, n: 'Congratulations' }].map((s) => ({ ...s, set: 'dio' }));
  return { FPS, END, TOTAL, frame, drawCaption, K, SHOTS, CAPS };
})();
