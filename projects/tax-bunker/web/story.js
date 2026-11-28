window.STORY = (() => {
  const FPS = 30, END = 56.8, TOTAL = Math.round(END * FPS);
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

  // ---------- word beats (fill from words.js) ----------
  const B = { dig: 0.28, kings: 1.9, hideout: 3.62, hounds: 4.66, dirt: 5.72, cover: 6.48, lid: 7.44, mud: 7.98, pine: 8.44, trapdoor: 10.0, taps: 11.44, hollow: 13.62, pack: 14.74, sand: 15.96, rock: 17.04,
    smoke: 18.98, watchtower: 19.5, pipe: 20.5, logs: 22.3, dead: 23.16, fog: 24.7, ghost: 26.12, food: 27.76, tunnel: 28.5, barn: 29.64, drill: 30.12, sack: 31.04, night: 31.68, king: 32.4, s200: 33.44, search: 34.7, forest: 35.72,
    move: 36.64, never: 37.94, cellar: 39.1, office: 40.16, branches: 41.42, not: 41.94, trapdoor2: 42.76, xmas: 44.64, tree: 44.84, top: 46.06, lantern: 47.08, socks: 48.48, steve: 49.56, knocking: 49.92, sugar: 50.98, congrats: 51.68, safest: 53.42, under: 55.16, you: 56.22 };

  // ---------- cast ----------
  const C = {
    gus: { head: 'box', skin: '#f2c7a0', stubble: 'rgba(60,40,30,.42)', hat: 'flattop', hair: '#1e1714', outfit: 'overalls', top: '#e0574a', armCol: '#e0574a', legCol: '#3d5a80', handCol: '#f2c7a0', shoes: '#3b2a20', goldTooth: true, limbW: 18, bodyW: 88, bodyH: 215, legL: 200 },
    
    steve: { outfit: 'tee', top: '#e07a5f', pants: '#3b3f52', hairStyle: 'curly', hair: '#c9893a' },
    tax: { outfit: 'suit', top: '#3b3f52', tie: '#c62f36', shirt: '#f6f3ee', hat: 'tophat', moustache: '#2a1d17', glasses: 'round' },
    s1: { outfit: 'uniform', hat: 'gendarme', moustache: '#3a2a22' }, s2: { outfit: 'uniform', hat: 'gendarme' }, s3: { outfit: 'uniform', hat: 'gendarme', glasses: 'round' },
  };
  const SEED = { gus: 0.4, steve: 3.6, tax: 1.9, s1: 2.5, s2: 4.1, s3: 5.3 };
  const blinkAt = (t, s) => ((t + s * 1.9) % 3.3) < 0.11;
  const lookAt = (t, s, base = 0) => q(clamp(base + 0.45 * Math.sin(t * 0.8 + s) + 0.25 * Math.sin(t * 2.3 + s * 3), -1, 1), 0.1);
  const pick = (t, sched) => { let v = sched[0][1]; for (const [a, x] of sched) if (t >= a) v = x; return v; };
  const arm = (t, sched) => { let prev = sched[0][1], cur = sched[0][1], ta = -9; for (const [a, p] of sched) if (t >= a) { prev = cur; cur = p; ta = a; } const x = clamp((t - ta) / 0.3), u = q(back(x), 0.02); return x >= 1 || prev === cur ? cur : { a: prev, b: cur, t: u }; };
  let CAMP = [0, 0, 10];
  const S = 0.62;   // character scale for this stage (floors are 1.25 m)
  const A = (id, t, x, y, z, o = {}) => {
    const s0 = SEED[id];
    const opts = { pose: o.pose || 'stand', expr: o.expr ? (Array.isArray(o.expr) ? pick(t, o.expr) : o.expr) : 'neutral', look: o.look ?? lookAt(t, s0, o.lookBase || 0),
      L: o.L ? (Array.isArray(o.L) ? arm(t, o.L) : o.L) : 'hang', R: o.R ? (Array.isArray(o.R) ? arm(t, o.R) : o.R) : 'hang', propL: o.propL || null, propR: o.propR || null,
      blink: !o.noBlink && blinkAt(t, s0), talk: o.talk ? (Math.sin(t * 21) > 0 ? 1 : 0.4) : 0, headTilt: q(o.tilt ?? 3 * Math.sin(t * 0.9 + s0), 0.5) };
    if (o.walk != null) opts.walk = q(o.walk % 1, 0.02);
    if (o.reach && o.reach.k > 0.001) { const r = o.reach, yaw = Math.atan2(CAMP[0] - x, CAMP[2] - z), rxv = Math.cos(yaw), rzv = -Math.sin(yaw);
      const mpu = 2.25 / 1000 * 1.1 * (o.s || S); let ux = ((r.to[0] - x) * rxv + (r.to[2] - z) * rzv) / mpu, uy = -(r.to[1] - y) / mpu; if (o.flip) ux = -ux;
      const side = ux >= 0 ? 'R' : 'L', pose = { to: [q(ux, 2), q(uy, 2)], k: q(r.k, 0.02), from: (side === 'R' ? (typeof opts.R === 'string' ? opts.R : 'hang') : (typeof opts.L === 'string' ? opts.L : 'hang')), bend: r.bend ?? 0.16, wob: q(Math.sin(t * 9) * 6 * (1 - r.k), 1) };
      opts[side] = pose; if (r.prop !== undefined) opts['prop' + side] = r.prop; }
    const sway = o.still ? 0 : Math.sin(t * 1.3 + s0) * 0.008, breath = o.still ? 0 : 0.012 * Math.sin(t * 2.3 + s0), lean = o.still ? 0 : 0.035 * Math.sin(t * 0.9 + s0 * 2);
    const pin = o.pop != null ? Math.max(0.02, pop(t, o.pop, 0.3)) : 1;
    return { key: id + JSON.stringify(opts), x: x + sway, y: y + (o.hop || 0), z, s: (o.s || S) * pin, flip: o.flip, sq: (o.sq || 0) + breath, roll: (o.roll || 0) + lean, ground: o.ground ?? y,
      draw: (g) => { g.translate(300, 975); g.scale(1.1, 1.1); rick(g, C[id], opts); } };
  };

  // ---------- light ----------
  const LIGHT = { dio: { sky: '#b4d8f4', ground: '#8a9458', hemi: 1.3, sun: '#fff4dc', sunI: 2.25, az: -35, el: 58, fog: '#cfe6ff', bg: '#9fd0ff', fogNear: 40, fogFar: 160, sat: 1.1, fillI: 1.35, fillCol: '#fff0dc', shadowExt: 12, expo: 1.55 } };

  // ---------- camera keys: { t, pos, look, fov, drift, dlook, roll } -- big re-aims become 0.14 s whips automatically ----------
  const RX = -7.4, RY = -1.9, HX = Wd.HX, OX = Wd.OX;
  const K = [
    { t: 0.0, pos: [-6.5, 0.2, 4.0], look: [-7.1, -0.45, -0.4], fov: 48, drift: [-0.2, -0.2, -0.4], roll: -1.5 },                     // digging, mid-action
    { t: 1.84, pos: [-11.4, 1.3, 4.0], look: [-11.9, 1.0, -0.6], fov: 48, drift: [0.4, 0.05, -0.3] },                                // the king's tax collector
    { t: 3.0, pos: [RX, -0.4, 6.6], look: [RX, -1.2, -0.5], fov: 50, drift: [0.1, 0.1, 0.5] },                                       // you have a hideout
    { t: 4.42, pos: [-8.6, 1.0, 4.8], look: [-7.1, 0.3, -0.5], fov: 48, drift: [0.4, 0.05, -0.4] },                                  // the hounds sniff the dirt
    { t: 6.2, pos: [-6.7, 1.0, 3.0], look: [-7.2, 0.15, -0.4], fov: 46, drift: [-0.1, 0.05, -0.3], roll: 2 },                        // lid, mud, pine branches
    { t: 9.42, pos: [RX - 0.2, -0.3, 6.4], look: [RX - 0.2, -1.0, -0.5], fov: 50, drift: [0, 0.05, 0.5] },                          // your trapdoor bunker
    { t: 11.2, pos: [-10.5, 1.2, 4.8], look: [-10.3, 0.6, -0.5], fov: 48, drift: [2.6, 0, -0.3], dlook: [2.6, 0, 0] },                 // the iron cane, tapping
    { t: 14.44, pos: [-6.6, -0.3, 3.4], look: [-7.2, -0.55, -0.3], fov: 48, drift: [0.1, 0.15, -0.3], roll: -1.5 },                  // 2 feet of sand
    { t: 17.64, pos: [-4.6, 3.0, 9.4], look: [-4.6, 2.3, -1.6], fov: 50, drift: [0.6, 0.2, -0.5] },                                  // chimney smoke, the watchtower
    { t: 19.4, pos: [-0.4, 6.0, 3.0], look: [-1.6, 5.7, -2.4], fov: 46, drift: [-0.2, 0, -0.2], roll: 1.5 },                          // the collector with his spyglass
    { t: 20.2, pos: [-4.4, -0.8, 4.2], look: [-4.4, -1.2, -0.3], fov: 50, drift: [5.4, 0.1, 0], dlook: [5.4, 0.2, 0] },               // 30 feet of hollow logs
    { t: 23.1, pos: [1.6, 2.6, 7.6], look: [1.6, 2.4, -1.0], fov: 50, drift: [-0.3, 0.2, 0.6] },                                     // out a dead tree, like morning fog
    { t: 25.44, pos: [-3.0, 1.8, 10.6], look: [-3.0, 0.8, -2.0], fov: 50, drift: [0.8, 0.1, -0.6] },                                 // your ghost bunker
    { t: 27.1, pos: [-8.3, -1.6, 2.9], look: [-8.5, -1.95, -0.5], fov: 46, drift: [0.1, 0, -0.3] },                                  // you run out of food
    { t: 28.0, pos: [-4.4, -1.9, 3.8], look: [-4.4, -2.3, -0.3], fov: 50, drift: [10.6, 0.1, 0], dlook: [10.6, 0.1, 0] },             // tunnel under the grain barn
    { t: 30.0, pos: [6.8, -0.4, 5.0], look: [6.5, -0.6, -0.6], fov: 50, drift: [-0.1, 0.05, -0.4], roll: 1.5 },                       // drill a hole in 1 sack
    { t: 32.1, pos: [-9.0, 2.4, 11.5], look: [-9.0, 0.9, -2.5], fov: 50, drift: [0.8, 0.1, -0.8] },                                  // 200 soldiers
    { t: 34.66, pos: [-6.6, 0.9, 3.8], look: [-7.3, 0.4, -0.4], fov: 46, drift: [0.1, 0.05, -0.4], roll: -1.5 },                     // search every inch
    { t: 36.28, pos: [7.6, -1.6, 4.4], look: [7.6, -2.1, -0.3], fov: 50, drift: [9.6, 0.4, 0], dlook: [9.6, 0.6, 0] },                // move through the tunnel to town
    { t: 38.86, pos: [OX, 0.2, 9.0], look: [OX, -0.5, -0.6], fov: 50, drift: [0, 0.05, -0.8] },                                     // the cellar under the tax office
    { t: 40.82, pos: [HX, 1.2, 3.4], look: [HX, 1.0, -0.4], fov: 46, drift: [0.1, 0.05, -0.3] },                                      // those pine branches
    { t: 42.1, pos: [HX + 0.1, -0.25, 3.0], look: [HX, -0.2, -0.4], fov: 46, drift: [0, 0.02, -0.25], roll: 1.5 },                  // your trapdoor (Gus peeks)
    { t: 43.5, pos: [HX - 0.4, 1.3, 4.6], look: [HX - 0.6, 1.1, -0.5], fov: 48, drift: [0.2, 0.05, -0.3] },                           // the tax collector's Christmas tree
    { t: 45.24, pos: [HX, 1.1, 4.2], look: [HX, 1.0, -0.5], fov: 48, drift: [0, -2.4, 0.2], dlook: [0, -2.6, 0] },                   // right on top of it (tilt down)
    { t: 46.74, pos: [18.7, -1.5, 4.2], look: [18.7, -1.95, -0.5], fov: 48, drift: [0.3, 0.05, -0.4], roll: -1.5 },                   // lantern, socks rug
    { t: 49.3, pos: [HX - 0.5, -0.8, 5.4], look: [HX - 0.5, -1.0, -0.5], fov: 50, drift: [0, 0.05, -0.3] },                           // Steve knocking on the hatch
    { t: 51.64, pos: [OX, 0.0, 10.6], look: [OX, -0.6, -0.6], fov: 50, drift: [0, 0.1, 0.8] },                                       // Congratulations
    { t: 54.6, pos: [OX - 0.6, -1.0, 6.8], look: [OX - 0.8, -1.5, -0.5], fov: 50, drift: [0, 1.1, -0.2], dlook: [0, 1.3, 0] },        // right under the man looking for you
  ];
  K.forEach((k, i) => { k.set = 'dio'; k.t1 = i + 1 < K.length ? K[i + 1].t : END + 0.5; });
  const SHAKES = [[B.lid, 0.05], [B.mud, 0.02], [B.pine, 0.02], [B.hollow, 0.04], [B.rock, 0.05], [B.dead, 0.04], [B.drill, 0.02], [B.s200, 0.04], [B.cellar, 0.07], [B.xmas, 0.015], [B.knocking, 0.02], [50.2, 0.02], [50.5, 0.02], [B.congrats, 0.03]];
  const IMPACTS = [B.lid, B.rock, B.cellar];
  const caAt = (t) => { let c = 0; for (const a of IMPACTS) if (t >= a && t < a + 0.35) c = Math.max(c, 0.018 * Math.exp(-(t - a) * 11)); return c; };
  const compAt = (t) => { let i = 0; for (let k = 0; k < K.length; k++) if (t >= K[k].t) i = k; return i; };
  const compState = (k, t) => { const u = ease(clamp((t - k.t) / Math.max(0.6, k.t1 - k.t))) * 0.85 + clamp((t - k.t) / (k.t1 - k.t)) * 0.15; const d = k.drift || [0, 0, 0], dl = k.dlook || [0, 0, 0]; const oy = 0;
    return { pos: [k.pos[0] + d[0] * u, k.pos[1] + d[1] * u + oy, k.pos[2] + d[2] * u], look: [k.look[0] + dl[0] * u, k.look[1] + dl[1] * u + oy, k.look[2] + dl[2] * u], fov: k.fov, roll: k.roll || 0 }; };
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
  const dofAt = (C) => { const d = Math.hypot(C.pos[0] - C.look[0], C.pos[1] - C.look[1], C.pos[2] - C.look[2]); return { focus: d, cinf: d < 1.2 ? 10 : d > 7 ? 3 : 6 }; };

  // ---------- world state (animate set pieces per beat here) ----------
  const ZF = Wd.ZF, GY = Wd.ROOM.y0 + 0.06, TY = Wd.TUN.y0 + 0.03, CY = Wd.CEL.y0 + 0.06;
  const burst = (bits, t, t0, c, n0, o = {}) => bits.forEach((m, i) => { const r = PAINT.rng(i + n0), u = t - t0, life = o.life || 0.7; if (u < 0 || u > life) { m.position.y = -50; return; } const a = r() * Math.PI * 2, sp = (0.7 + r() * 1.5) * (o.spread || 1); m.position.set(c[0] + Math.cos(a) * sp * u, c[1] + Math.abs(Math.sin(a)) * sp * u * (o.up || 1.4) - (o.g ?? 2.4) * u * u, c[2] + (r() - 0.5) * 0.4 + 0.2); m.scale.setScalar(Math.max(0.01, (o.sc || 1.3) * (1 - u / life))); m.rotation.set(u * 9 + i, u * 5, 0); });
  const popG = (o, t, a, until = 1e9) => { o.visible = t >= a && t < until; if (o.visible) o.scale.setScalar(Math.max(0.001, pop(t, a, 0.28))); };
  const houndAt = (h, i, t) => { const d = h.userData; let x, z = -0.15 - i * 0.55, walk = true, sniff = 0, dir = 1;
    if (t < 4.4 || t > 10.8) { h.position.y = -50; return; }
    if (t < 5.1) x = lerp(-13, -6.6 - i * 0.8, ease(ramp(t, 4.4, 5.1))); else if (t < 9.1) { x = -6.6 - i * 0.8 + Math.sin(t * 2 + i) * 0.15; walk = false; sniff = 1; } else { x = lerp(-6.6 - i * 0.8, -14, ease(ramp(t, 9.1, 10.6))); dir = -1; }
    h.position.set(x, 0, z); h.rotation.y = dir > 0 ? 0 : Math.PI; d.legs.forEach((l, k) => { l.rotation.z = walk ? Math.sin(t * 16 + k * 1.6) * 0.5 : 0; }); d.hd.rotation.z = sniff ? -0.5 + Math.abs(Math.sin(t * 9 + i)) * 0.3 : 0.1; d.tail.rotation.x = Math.sin(t * 14 + i) * 0.6; };
  const state = (t) => {
    // digging: the shaft, then the room; the dirt mound grows
    Wd.setFill(Wd.fShaft, 1 - ramp(t, -0.4, 1.2)); Wd.setFill(Wd.fRoom, 1 - ease(ramp(t, 1.2, 3.4)));
    Wd.mound.scale.set(1.2 * (0.4 + 0.6 * ramp(t, -0.4, 3.6)), 0.45 * (0.4 + 0.6 * ramp(t, -0.4, 3.6)), 1); Wd.mound.visible = t < 9.0;
    if (t < 3.6) Wd.dirt.forEach((m, i) => { const r = PAINT.rng(i + 3), u = ((t + 0.4) * 1.4 + r()) % 1; m.position.set(-7.2 + u * 1.1, -0.2 + Math.sin(u * Math.PI) * 0.9, -0.4 + (r() - 0.5) * 0.4); m.rotation.set(u * 9, u * 5, i); }); else Wd.dirt.forEach((m) => { m.position.y = -50; });
    // lid, mud, pine branches (pine branches leave for the Christmas tree once you move)
    popG(Wd.lid, t, B.lid); if (Wd.lid.visible) Wd.lid.position.y = 1.2 * (1 - eout(ramp(t, B.lid - 0.25, B.lid))) + (win(t, B.hollow, B.hollow + 0.4) ? Math.abs(Math.sin((t - B.hollow) * 20)) * 0.05 : 0);
    Wd.mud.visible = t >= B.mud; if (Wd.mud.visible) { const p = Math.max(0.01, pop(t, B.mud, 0.28)); Wd.mud.scale.set(0.95 * p, 0.12 * p, 1.1 * p); } popG(Wd.branches, t, B.pine, B.move + 0.4); Wd.branches.rotation.y = 0.05 * Math.sin(t * 1.3);
    // 2 feet of sand packed under the lid
    { const k = ease(ramp(t, 15.1, B.sand + 0.3)); Wd.sand.visible = k > 0.01; if (Wd.sand.visible) { const h = 0.6 * k; Wd.sand.scale.y = h; Wd.sand.position.y = -h / 2 - 0.02; } }
    // the fire (from "smoke"), its light; smoke out the trapdoor, then (after the pipe) out the dead tree as fog
    const fireOn = t >= 17.6 && t < 40; Wd.fire.visible = fireOn; Wd.fireLight.intensity = fireOn ? 2.4 + 0.5 * Math.sin(t * 17) + 0.3 * Math.sin(t * 7.3) : 0; Wd.fire.scale.y = 1 + 0.15 * Math.sin(t * 19);
    const piped = t >= B.dead + 0.2;
    Wd.puffs.forEach((m, i) => { const r = PAINT.rng(i + 50), u = (t * 0.45 + i / Wd.puffs.length) % 1; if (!fireOn || (t > 20.4 && !piped)) { m.position.y = -50; return; }
      if (!piped) { const y = lerp(GY + 0.5, 3.0, u); m.position.set(-7.2 + Math.sin(u * 6 + i) * 0.2 * u, y, -0.4 + (r() - 0.5) * 0.3); m.scale.setScalar((0.5 + u * 2.2) * (y > -0.95 && y < 0.1 ? 0.6 : 1)); if (y < 0) m.position.y = y; }
      else { m.position.set(1.6 + u * 2.5 * (r() - 0.3), 4.3 + u * 0.8 - u * u * 1.6, -0.5 + (r() - 0.5) * 1.0); m.scale.setScalar(0.6 + u * 2.6); } });
    Wd.fog.forEach((f, i) => { const r = PAINT.rng(i + 70), a = B.fog - 0.9 + i * 0.04; if (!(t >= a && t < 31.5)) { f.position.y = -50; return; } const k = eout(ramp(t, a, a + 1.0)); f.position.set(-8 + r() * 11 + Math.sin(t * 0.3 + i) * 0.4, 0.15 + r() * 0.35, -1.2 - r() * 4.5); f.scale.set((1.6 + r()) * k, (0.45 + r() * 0.25) * k, (1.2 + r()) * k); });
    // hollow logs pop in one after another; the dead tree rises
    Wd.logs.forEach((l, i) => popG(l, t, B.pipe + 0.3 + i * 0.12)); popG(Wd.deadTree, t, B.dead);
    // food runs out; the tunnel; the barn shaft; the drill; grain pours into your sack
    Wd.food.children.forEach((m, i) => { m.visible = t < 27.2 + i * 0.12; });
    Wd.setFill(Wd.fTun, 1 - ramp(t, 28.4, 29.9)); Wd.setFill(Wd.fBsh, 1 - ramp(t, 29.85, 30.15)); Wd.setFill(Wd.fTun2, 1 - ramp(t, 36.4, 38.2)); Wd.setFill(Wd.fCel, 0);
    Wd.sackHole.scale.setScalar(1 - 0.35 * ramp(t, B.drill + 0.3, B.night));
    Wd.grain.forEach((m, i) => { const r = PAINT.rng(i + 9), u = ((t - B.drill - 0.3) * 1.6 + i / Wd.grain.length) % 1; if (!win(t, B.drill + 0.3, 31.9)) { m.position.y = -50; return; } m.position.set(6.5 + (r() - 0.5) * 0.12, -0.05 - u * 1.4, -0.45 + (r() - 0.5) * 0.12); });
    Wd.grainBag.visible = t >= 31.9; Wd.grainBag.scale.setScalar(t >= 31.9 ? 1 : 0.01);
    // the army marches into the forest
    { const v = win(t, B.king - 0.1, 36.5); Wd.army.visible = v; if (v) { const u = ease(ramp(t, B.king, 34.6)); Wd.army.position.set(lerp(-26, -14.5, u), Math.abs(Math.sin(t * 8)) * 0.03, -2.6); Wd.army.scale.set(1, Math.max(0.01, pop(t, B.s200 - 0.4, 0.3) * 0.5 + 0.5), 1); } else Wd.army.position.y = -50; }
    // the town: the street and the office front drop away on "cellar"
    { const u = ramp(t, B.cellar - 0.1, B.cellar + 0.45); Wd.townLid.visible = u < 1; Wd.townLid.position.y = -30 * u * u; Wd.facade.visible = u < 1; Wd.facade.position.y = -0.6 * u; Wd.facade.rotation.x = 1.3 * u * u; Wd.facade.position.z = 0.8 * u; }
    // the hatch lifts when you peek; thumps when Steve knocks
    Wd.hatch.rotation.z = win(t, 42.3, 43.4) ? -0.25 * Math.sin(ramp(t, 42.3, 43.4) * Math.PI) : 0; Wd.hatch.position.y = -0.02 + (win(t, B.knocking, 51.0) ? Math.max(0, Math.sin((t - B.knocking) * 20)) * 0.03 : 0);
    // ornaments + star pop on "Christmas tree"
    Wd.ornaments.forEach((o, i) => { o.visible = t >= 44.1 + i * 0.05 || t < 40; if (t >= 40) o.scale.setScalar(Math.max(0.01, pop(t, 44.1 + i * 0.05, 0.2))); }); Wd.star.scale.setScalar(t >= 40 ? Math.max(0.01, pop(t, B.tree, 0.3)) : 1); Wd.star.rotation.y = t * 1.5;
    // lantern, socks rug
    popG(Wd.lantern, t, B.lantern); Wd.lanternLight.intensity = t >= B.lantern ? 3.2 * eout(ramp(t, B.lantern, B.lantern + 0.3)) + 0.2 * Math.sin(t * 6) : 0; popG(Wd.rug, t, B.socks);
    // sparks: hideout, trapdoor, ghost bunker; confetti
    burst(Wd.sparks.slice(0, 10), t, B.trapdoor, [-7.2, 0.3, -0.2], 3, { spread: 1.2 }); burst(Wd.sparks.slice(10), t, B.ghost, [-3, 1.0, -0.5], 30, { spread: 2 });
    Wd.confetti.forEach((m, i) => { const r = PAINT.rng(i + 300), u = t - B.congrats; if (u < 0 || u > 3.2) { m.position.y = -50; return; } m.position.set(OX - 3 + r() * 6 + Math.sin(u * 3 + i) * 0.3, 2.6 + r() * 1.5 - u * 2.2, 0.2 + r() * 1.2); m.rotation.set(u * 7 + i, u * 5, u * 3); m.scale.setScalar(2.2); });
    Wd.hounds.forEach((h, i) => houndAt(h, i, t));
  };
  // ---------- actors ----------
  const actors = (t) => {
    const L = [];
    // GUS
    if (t < 1.2) { const d = 0.95 * ramp(t, -0.4, 1.2); L.push(A('gus', t, -7.2, -d * 0.9, -0.05, { expr: 'grin', R: Math.sin(t * 11) > 0 ? 'up' : 'point', propR: 'shovel', L: 'hip', lookBase: 0.4, hop: Math.abs(Math.sin(t * 11)) * 0.03 })); }
    else if (t < 3.5) L.push(A('gus', t, lerp(-7.2, -8.6, ease(ramp(t, 1.2, 3.3))), GY, -0.1, { expr: [[0, 'grin'], [B.hideout, 'beam']], R: Math.sin(t * 11) > 0 ? 'up' : 'point', propR: 'shovel', L: 'hip', lookBase: -0.5, walk: t * 1.4 }));
    else if (t < 14.4) L.push(A('gus', t, -7.9, GY, -0.1, { expr: [[0, 'beam'], [B.hounds, 'nervous'], [B.lid, 'smirk'], [B.trapdoor, 'grin'], [B.taps, 'nervous'], [B.hollow, 'shock']], R: [[0, 'thumb'], [B.hounds, 'mouth'], [B.lid, 'up'], [B.trapdoor, 'thumb'], [B.taps, 'mouth']], L: [[0, 'hip'], [B.hounds, 'mouth'], [B.lid, 'hip']], lookBase: 0.3, tilt: t > B.hounds && t < B.lid ? 8 : null }));
    else if (t < 17.6) L.push(A('gus', t, -7.2, -1.75, -0.05, { expr: [[0, 'stern'], [B.rock, 'smugsmile']], R: 'up', propR: 'sack', L: 'hang', lookBase: 0.2 }));
    else if (t < 28.0) L.push(A('gus', t, t < 20.2 ? -6.6 : t < 25.4 ? -5.95 : t < 27.0 ? -7.6 : -8.2, GY, -0.1, { expr: [[0, 'smirk'], [B.watchtower, 'shock'], [B.pipe, 'think'], [B.dead, 'grin'], [B.ghost, 'smugsmile'], [27.1, 'nervous'], [B.food, 'sleepy']], R: [[0, 'hold'], [B.watchtower, 'up'], [B.pipe, 'point'], [B.ghost, 'thumb'], [27.1, 'mouth']], L: [[0, 'hip'], [B.watchtower, 'up'], [B.pipe, 'hip']], lookBase: 0.5 }));
    else if (t < 29.95) L.push(A('gus', t, lerp(-5.6, 6.2, ease(ramp(t, 28.3, 29.9))), TY, -0.1, { expr: 'smirk', R: Math.sin(t * 11) > 0 ? 'up' : 'point', propR: 'shovel', L: 'hip', walk: t * 1.6, lookBase: 0.6 }));
    else if (t < 32.1) { const rk = eout(ramp(t, B.drill - 0.15, B.drill + 0.15)); L.push(A('gus', t, 6.35, TY, -0.1, { expr: [[0, 'smirk'], [30.5, 'grin'], [B.night, 'beam']], R: 'holdUp', propR: 'sack', L: 'hip', lookBase: 0.2, reach: rk > 0.01 && t < 30.6 ? { to: [6.5, -0.05, -0.4], k: rk, prop: 'drill', bend: 0.1 } : null })); }
    else if (t < 36.3) L.push(A('gus', t, -7.9, GY, -0.1, { expr: [[0, 'nervous'], [B.search, 'shock']], R: 'mouth', L: 'mouth', lookBase: 0.2, hop: win(t, B.search, B.search + 0.6) ? Math.abs(Math.sin(t * 12)) * 0.03 : 0 }));
    else if (t < 38.4) L.push(A('gus', t, lerp(7.2, 16.9, ease(ramp(t, 36.4, 38.3))), TY, -0.1, { expr: 'smirk', R: 'holdUp', propR: 'sack', L: 'hip', walk: t * 1.6, lookBase: 0.7 }));
    else if (win(t, 42.1, 43.5)) L.push(A('gus', t, HX, -1.5, -0.25, { expr: 'smirk', R: 'up', L: 'up', lookBase: 0.2 }));
    else { const end = t >= B.lantern; L.push(A('gus', t, end ? 19.0 : 18.0, CY, -0.15, { expr: [[0, 'smirk'], [B.cellar, 'smugsmile'], [B.lantern, 'beam'], [B.steve, 'think'], [B.sugar, 'bored'], [B.congrats, 'smugsmile'], [B.under, 'laugh']], R: [[0, 'holdUp'], [B.cellar, 'thumb'], [B.steve, 'chin'], [B.congrats, 'thumb']], propR: t < B.cellar ? 'sack' : null, L: 'hip', lookBase: t > B.under ? 0.9 : 0.3 })); }
    // THE TAX COLLECTOR
    if (win(t, 1.8, 3.0)) L.push(A('tax', t, lerp(-12.6, -11.4, ramp(t, 1.8, 3.0)), 0, -0.4, { pop: B.kings, expr: 'smirk', R: 'holdUp', propR: 'notepad', L: 'hip', walk: t * 1.3, lookBase: 0.5 }));
    if (win(t, 11.1, 17.6)) { const x = t < B.hollow ? lerp(-10.8, -7.7, ease(ramp(t, 11.2, B.hollow - 0.2))) : -7.7; const tap = [B.taps, 12.4, 13.0, B.hollow, B.rock].some((a) => win(t, a - 0.05, a + 0.2)); L.push(A('tax', t, x, 0.0, -0.75, { expr: [[0, 'stern'], [B.hollow, 'sly'], [B.rock, 'angry']], R: tap ? 'point' : 'hold', propR: 'cane', L: 'hip', walk: t < B.hollow ? t * 1.3 : null, lookBase: 0.6, hop: tap ? 0.03 : 0 })); }
    if (win(t, 17.6, 27.1)) L.push(A('tax', t, -1.5, 5.06, -1.95, { expr: [[0, 'stern'], [B.smoke, 'sly'], [B.dead, 'think'], [B.fog, 'shock'], [B.ghost, 'bored']], R: 'holdUp', propR: 'spyglass', L: 'hip', lookBase: t < B.dead ? -0.9 : 0.9, flip: t < B.dead }));
    if (win(t, 32.1, 36.3)) L.push(A('tax', t, -9.4, 0, -0.3, { expr: 'angry', R: 'point', L: 'hip', lookBase: 0.6 }));
    if (t >= B.cellar - 0.1) { const deco = win(t, 43.5, 45.3); L.push(A('tax', t, deco ? HX - 0.75 : OX - 1.0, 0.0, -0.75, { expr: [[0, 'stern'], [43.5, 'smugsmile'], [B.knocking, 'sleepy'], [B.under, 'sly']], R: deco ? 'up' : t > B.under ? 'holdUp' : 'hold', propR: t > B.under ? 'spyglass' : deco ? null : 'notepad', L: 'hip', lookBase: deco ? 0.8 : 0.4 })); }
    // SOLDIERS (probing with spears)
    if (win(t, 32.6, 36.3)) [['s1', -8.6], ['s2', -7.8], ['s3', -6.4]].forEach(([id, x], i) => { const stab = Math.sin(t * 6 + i * 2) > 0.3; L.push(A(id, t, x + lerp(-4, 0, ease(ramp(t, 32.6, 34.4))), stab ? -0.04 : 0, -0.55 - i * 0.2, { expr: i % 2 ? 'stern' : 'angry', R: stab ? 'point' : 'holdUp', propR: 'spear', L: 'hip', walk: t < 34.4 ? t * 1.5 : null, lookBase: 0.5 })); });
    // STEVE knocking on the hatch to borrow sugar (and in the finale)
    if (t >= B.steve - 0.2) L.push(A('steve', t, HX + 0.55, 0.0, -0.2, { pop: t < 50 ? B.steve : null, expr: [[0, 'grin'], [B.sugar, 'smugsmile']], R: win(t, B.knocking, 50.8) ? (Math.sin(t * 20) > 0 ? 'point' : 'hold') : 'holdUp', propR: 'coffee', L: 'hip', lookBase: -0.6, flip: true }));
    return L;
  };

  // ---------- captions ----------
  const CAPS = (() => { const out = []; const W = window.WORDS; for (let i = 0; i < W.length;) { const a = W[i], b = W[i + 1]; const clean = (s) => s.replace(/,(?!\d)/g, '').replace(/\.$/, ''); const short = (s) => clean(s).length <= 4; if (b && short(a[0]) && clean(a[0] + b[0]).length <= 11 && !/[.?!,]$/.test(a[0]) && b[1] - a[2] < 0.25) { out.push({ t: a[1], txt: clean(a[0]) + ' ' + clean(b[0]) }); i += 2; } else { out.push({ t: a[1], txt: clean(a[0]) }); i += 1; } } out.forEach((c, k) => { c.e = k + 1 < out.length ? out[k + 1].t : END; }); return out; })();
  const drawCaption = (g, t, W, H_) => {
    const c = CAPS.find((c) => t >= c.t && t < c.e && t < c.t + 1.2); if (!c) return;
    const u = clamp((t - c.t) / 0.09), s = 0.88 + 0.12 * eout(u); const fs = Math.round(61 * W / 1080);
    g.save(); g.translate(W / 2, H_ * 1300 / 1920); g.scale(s, s); g.font = `${fs}px "Lilita One", Impact, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    let f = 1; const mw = g.measureText(c.txt).width; if (mw > W * 0.86) f = W * 0.86 / mw; g.scale(f, f);
    g.lineJoin = 'round'; g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = fs * 0.18; g.shadowOffsetY = fs * 0.06; g.lineWidth = fs * 0.24; g.strokeStyle = '#000'; g.strokeText(c.txt, 0, 0); g.shadowColor = 'transparent'; g.fillStyle = '#fff'; g.fillText(c.txt, 0, 0); g.restore();
  };

  const frame = (f) => {
    const t = f / FPS; state(t); const Cm = camAt(t); Wd.tick(t); CAMP = Cm.pos;
    const L = { ...LIGHT.dio }, ug = clamp((-Cm.pos[1] - 0.6) / 2.5);   // underground mood: dimmer sky bounce, warm lantern fill, deeper vignette, dust motes
    if (ug > 0) { L.hemi *= 1 - 0.45 * ug; L.sunI *= 1 - 0.5 * ug; L.fillCol = '#ffb36a'; L.fillI = L.fillI + 1.8 * ug; L.vig = 0.18 + 0.28 * ug; L.expo = L.expo + 0.12 * ug; }
    Wd.motes.material.opacity = 0.45 * ug;
    return { t, cam: Cm, light: L, dof: dofAt(Cm), actors: actors(t), whip: Cm.whip, flash: 0, ca: caAt(t) };
  };
  const SHOTS = [{ t: 0, n: 'Dig' }, { t: 4.42, n: 'Hounds' }, { t: 11.2, n: 'Iron cane' }, { t: 17.64, n: 'Watchtower' }, { t: 20.2, n: 'Hollow logs' }, { t: 27.1, n: 'Grain barn' }, { t: 32.1, n: '200 soldiers' }, { t: 36.28, n: 'Move' }, { t: 40.82, n: 'Christmas tree' }, { t: 46.74, n: 'Lantern, socks, Steve' }, { t: 51.64, n: 'Congratulations' }].map((x) => ({ ...x, set: 'dio' }));
  return { FPS, END, TOTAL, frame, drawCaption, K, SHOTS, CAPS };
})();
