// "The Sinking Tower" starring Gus (escalation format). Timed to the 1.25x voice (words.js). 30 fps, 1080x1920.
// Normal street, solid ground. The ground drops away only on "It's a swamp" to reveal the tower sunk in the mud.
window.STORY = (() => {
  const FPS = 30, END = 42.9, TOTAL = Math.round(END * FPS);
  const Wd = WORLD, { rick } = TOON, H = Wd.H, TZ = Wd.TZ, ZF = Wd.ZF, TW = Wd.TW;
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
  const B = { floor: 0.76, house: 1.3, tallest: 2.24, nb: 4.0, adds: 4.28, two: 4.64, add10: 5.58, ten: 5.82, tower: 7.14, sways: 8.32, wind: 9.06, tie: 9.94, cloud: 10.42, sky: 11.64, castle: 11.94,
    climb: 13.08, s300: 13.28, stairs: 13.88, hire: 15.12, pigeon: 15.5, goat: 16.02, steve: 16.92, delivers: 17.92, wrong: 18.74, eats: 19.98, stairs2: 20.44, builds: 21.36, elevator: 21.76, down: 22.86,
    ladder: 24.24, spaghetti: 24.76, keep: 25.8, f500: 26.7, wait: 27.84, why: 28.92, lookdown: 29.96, because: 30.76, cheap: 31.82, mistake: 32.26, swamp: 33.26, every: 33.98, add2: 34.6, sinks: 35.38,
    hey: 36.64, basement: 37.28, congrats: 38.02, built: 39.1, tallest2: 39.48, kingdom: 40.38, still: 41.2, ground: 41.9 };

  // ---------- the tower's numbers ----------
  const NF = (t) => { if (t < 5.45) return 2; if (t < 6.3) return 2 + Math.floor(10 * ramp(t, 5.45, 6.2) + 1e-6); if (t < 25.5) return 12; if (t < 27.3) return 12 + Math.floor(58 * Math.pow(ramp(t, 25.5, 27.25), 1.6) + 1e-6); if (t < B.add2) return 70; return 71; };
  const NSINK = (t) => (t < 27.6 ? 1 : t < B.sinks ? 70 : 71);
  const BASE = (t) => { if (t < 27.6) return 0; if (t < 28.8) return -69 * H * ease(ramp(t, 27.6, 28.8)); if (t < B.sinks) return -69 * H; return -69 * H - H * ease(ramp(t, B.sinks, B.sinks + 0.35)); };
  const TOP = (t) => BASE(t) + NF(t) * H;
  const NBF = (t) => (t < B.adds ? 1 : t < B.two ? 2 : 3);

  // ---------- cast ----------
  const C = {
    gus: { head: 'box', skin: '#f2c7a0', stubble: 'rgba(60,40,30,.42)', hat: 'flattop', hair: '#1e1714', outfit: 'overalls', top: '#e0574a', armCol: '#e0574a', legCol: '#3d5a80', handCol: '#f2c7a0', shoes: '#3b2a20', goldTooth: true, limbW: 18, bodyW: 88, bodyH: 215, legL: 200 },
    nb: { outfit: 'vest', top: '#2f6b4f', hat: 'flatcap', hatCol: '#5a3b2a', moustache: '#3a2a22' },
    steve: { outfit: 'tee', top: '#e07a5f', pants: '#3b3f52', hairStyle: 'curly', hair: '#c9893a' },
  };
  const SEED = { gus: 0.4, nb: 2.2, steve: 3.6 };
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

  // ---------- camera ('top' keys ride with the tower's roof) ----------
  const K = [
    { t: 0.0, pos: [-0.9, 2.0, 7.8], look: [-0.8, 1.7, -0.8], fov: 48, drift: [0.2, 0.1, -0.7], roll: -1.5 },                       // a floor drops onto the house
    { t: 2.16, pos: [1.4, 2.8, 12.5], look: [1.4, 2.1, -1.0], fov: 50, drift: [0.3, 0.1, -0.6] },                                     // the tallest house on the street
    { t: 3.64, pos: [4.6, 3.2, 8.2], look: [4.6, 3.0, -1.0], fov: 48, drift: [-0.2, 0.4, -0.4], roll: 2 },                            // the neighbor adds 2
    { t: 5.12, pos: [0.4, 3.0, 14.0], look: [0.0, 4.5, -1.0], fov: 50, drift: [0, 5.5, 2.5], dlook: [0, 6.5, 0] },                    // you add 10
    { t: 6.48, pos: [2.6, 0.9, 8.5], look: [0.0, 9.0, -1.0], fov: 50, drift: [-0.6, 0.2, -0.6] },                                     // now you have a tower (hero low angle)
    { t: 7.7, pos: [0.0, 8.5, 27.0], look: [0.0, 8.0, -1.0], fov: 50, drift: [1.5, 0.5, -2.0], roll: 1.5 },                           // it sways in the wind
    { t: 9.66, rel: 'top', pos: [2.4, 1.6, 6.6], look: [1.3, 1.9, -1.0], fov: 50, drift: [0.3, 0.3, -0.5] },                          // tie it to a cloud
    { t: 11.02, rel: 'top', pos: [-2.2, 2.4, 7.2], look: [0.0, 1.5, -1.0], fov: 50, drift: [1.0, 0.2, -0.4] },                        // a sky castle
    { t: 12.52, pos: [4.6, 2.2, 6.8], look: [1.7, 2.6, -1.0], fov: 50, drift: [0, 3.2, 0], dlook: [0, 3.2, 0] },                      // climb 300 stairs
    { t: 14.84, pos: [0.0, 1.5, 7.2], look: [0.0, 1.0, 0.0], fov: 48, drift: [0.2, 0.05, -0.6] },                                   // hire a pigeon, a goat, and Steve
    { t: 17.48, pos: [2.2, 6.4, 7.0], look: [0.0, 7.6, -0.5], fov: 50, drift: [-0.3, 2.0, -0.3], dlook: [0, 1.6, 0] },                // the pigeon, the wrong floor
    { t: 19.54, pos: [3.8, 3.7, 5.6], look: [1.75, 3.9, -1.0], fov: 48, drift: [0.2, -0.2, -0.4], roll: -1.5 },                       // the goat eats the stairs
    { t: 21.18, pos: [-4.0, 9.0, 8.0], look: [-1.8, 7.5, -0.4], fov: 50, drift: [0, -5.5, 0], dlook: [0, -6.0, 0] },                  // the elevator only goes down
    { t: 23.52, pos: [-8.6, 1.7, 4.8], look: [-9.0, 1.4, -0.6], fov: 48, drift: [0.1, 0.05, 0.4] },                                   // a ladder out of spaghetti
    { t: 25.38, pos: [2.0, 4.0, 18.0], look: [0.0, 8.0, -1.0], fov: 50, drift: [0, 80.0, 6.0], dlook: [0, 82.0, 0] },                 // keep building: 500 floors
    { t: 27.8, rel: 'top', pos: [1.6, 1.7, 4.6], look: [0.5, 1.45, -0.6], fov: 48, drift: [0.1, 0, -0.4] },                          // Wait (the ground rises behind him)
    { t: 28.86, pos: [2.5, 3.0, 9.6], look: [2.4, 2.7, -0.5], fov: 50, drift: [-0.3, 0.1, -0.6] },                                    // the neighbor looks down at you
    { t: 30.7, pos: [0.9, 2.4, 5.8], look: [0.5, 1.9, -0.5], fov: 46, drift: [-0.1, 0.05, -0.5], roll: 1.5 },                         // not cheap by mistake
    { t: B.swamp - 0.06, pos: [1.2, -1.0, 17.0], look: [0.5, -5.0, -1.0], fov: 50, drift: [0, -2.5, 4.0], dlook: [0, -3, 0] },       // IT'S A SWAMP: the ground drops away
    { t: 33.92, pos: [3.0, 0.6, 9.0], look: [0.4, 0.2, -1.0], fov: 48, drift: [0.3, 0.1, -0.6] },                                     // every floor you add, it sinks one more
    { t: 36.58, pos: [2.4, 3.0, 9.8], look: [2.3, 2.7, -0.5], fov: 48, drift: [-0.2, 0.05, -0.4], roll: -1.5 },                       // "Hey, nice basement!"
    { t: 37.98, pos: [2.8, -2.0, 13.0], look: [0.0, -6.0, -1.0], fov: 50, drift: [0, -62, 0], dlook: [0, -64, 0] },                   // Congratulations: dive down the whole tower
    { t: 41.12, pos: [1.8, 2.6, 9.4], look: [1.8, 2.3, -0.5], fov: 48, drift: [0.2, 0.05, -0.5] },                                    // and you still live on the ground floor
  ];
  K.forEach((k, i) => { k.set = 'dio'; k.t1 = i + 1 < K.length ? K[i + 1].t : END + 0.5; });
  const SHAKES = [[B.floor, 0.04], [B.adds, 0.02], [B.two, 0.02], [B.ten, 0.04], [B.sways, 0.02], [B.cloud, 0.02], [B.castle, 0.03], [B.goat, 0.015], [B.steve, 0.015], [B.down + 0.04, 0.08], [B.spaghetti, 0.03], [B.f500, 0.04], [B.swamp, 0.08], [B.sinks, 0.05], [B.congrats, 0.03]];
  const IMPACTS = [B.floor, B.ten, B.down + 0.04, B.swamp, B.sinks];
  const caAt = (t) => { let c = 0; for (const a of IMPACTS) if (t >= a && t < a + 0.35) c = Math.max(c, 0.018 * Math.exp(-(t - a) * 11)); return c; };
  const compAt = (t) => { let i = 0; for (let k = 0; k < K.length; k++) if (t >= K[k].t) i = k; return i; };
  const compState = (k, t) => { const u = ease(clamp((t - k.t) / Math.max(0.6, k.t1 - k.t))) * 0.85 + clamp((t - k.t) / (k.t1 - k.t)) * 0.15; const d = k.drift || [0, 0, 0], dl = k.dlook || [0, 0, 0]; const oy = k.rel === 'top' ? TOP(t) : 0;
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

  // ---------- world state ----------
  const burst = (bits, t, t0, c, n0, o = {}) => bits.forEach((m, i) => { const r = PAINT.rng(i + n0), u = t - t0, life = o.life || 0.7; if (u < 0 || u > life) { m.position.y = -200; return; } const a = r() * Math.PI * 2, sp = (0.7 + r() * 1.5) * (o.spread || 1); m.position.set(c[0] + Math.cos(a) * sp * u, c[1] + Math.abs(Math.sin(a)) * sp * u * (o.up || 1.4) - (o.g ?? 2.4) * u * u, c[2] + (r() - 0.5) * 0.4 + 0.2); m.scale.setScalar(Math.max(0.01, (o.sc || 1.3) * (1 - u / life))); m.rotation.set(u * 9 + i, u * 5, 0); });
  const ROOFX = 0.0, ROOFZ = TZ + 1.2;
  const state = (t) => {
    const n = NF(t), base = BASE(t), top = TOP(t);
    // tower: floors on, the newest one pops; frame 0 is mid-drop (floor 2 falling onto the house)
    Wd.tower.position.y = base;
    Wd.floors.forEach((f, i) => { f.visible = i < n; if (!f.visible) return; f.position.y = i * H + H / 2; f.scale.set(1, 1, 1);
      if (i === 1 && t < B.floor) f.position.y += 3.2 * (1 - ramp(t, -0.2, B.floor) ** 2);
      if (i === 1 && win(t, B.floor, B.floor + 0.35)) f.scale.set(1 + 0.08 * Math.sin((t - B.floor) * 18) * Math.exp(-(t - B.floor) * 8), 1 - 0.1 * Math.exp(-(t - B.floor) * 9), 1);
      if (i >= 2 && i < 12 && t < 6.6) { const a = 5.45 + (i - 2) * 0.075; f.scale.y = Math.max(0.01, pop(t, a, 0.18)); }
      if (i === 70) f.scale.y = Math.max(0.01, pop(t, B.add2, 0.25)); });
    Wd.roof.position.y = (t < B.floor ? 1 : n) * H + (t < B.floor ? 0 : 0);
    Wd.turrets.visible = t >= B.castle; if (Wd.turrets.visible) Wd.turrets.scale.setScalar(Math.max(0.01, pop(t, B.castle, 0.3)));
    // sway in the wind, damped once it's tied to the cloud
    const swayA = win(t, B.sways - 0.2, 40) ? (t < B.cloud ? 0.05 * ramp(t, B.sways - 0.2, B.sways + 0.3) : 0.008) : 0; Wd.tower.rotation.z = swayA * Math.sin(t * 2.6);
    // the cloud + the rope
    { const cx = t < B.tie ? 8 - t * 0.15 : 3.0, cy = t < B.tie ? 16 : top + 4.6; const u = ramp(t, B.tie, B.cloud + 0.3); Wd.cloud.position.set(lerp(8 - B.tie * 0.15, 1.6, eout(u)) * (t >= B.tie ? 1 : 0) + (t < B.tie ? cx : 0), t < B.tie ? cy : lerp(16, top + 3.4, eout(u)), lerp(-6, -3.2, eout(u)));
      Wd.rope.visible = t >= B.tie && t < 27.6; if (Wd.rope.visible) { const a = [ROOFX + 0.6, top + 0.15, TZ + 0.3], end = L3([ROOFX + 0.3, top + 1.1, TZ + 0.6], [Wd.cloud.position.x - 0.6, Wd.cloud.position.y - 0.4, -3.2], eout(ramp(t, B.tie, B.cloud))); const dx = end[0] - a[0], dy = end[1] - a[1], dz = end[2] - a[2], len = Math.max(0.01, Math.hypot(dx, dy, dz)); Wd.rope.position.set((a[0] + end[0]) / 2, (a[1] + end[1]) / 2, (a[2] + end[2]) / 2); Wd.rope.scale.set(1, len, 1); Wd.rope.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / len, dy / len, dz / len)); } }
    // leaves blowing in the wind
    Wd.leaves.forEach((m, i) => { const r = PAINT.rng(i + 5), u = ((t - B.sways) * 0.6 + r()) % 1; if (!win(t, B.sways - 0.3, B.cloud + 0.5)) { m.position.y = -200; return; } m.position.set(-10 + u * 20, 2 + r() * 12 + Math.sin(u * 9 + i) * 0.6, -0.5 + r() * 2); m.rotation.set(u * 12, u * 7, i); });
    // stairs (pop in, the goat eats them from the bottom); hidden once the tower outgrows them
    Wd.stairs.forEach((s, i) => { const a = 12.55 + i * 0.05, eaten = t >= B.eats ? Math.floor((t - B.eats) / 0.14) : -1; s.visible = t >= a && t < 25.4 && i > eaten && i < 12; if (s.visible) s.scale.setScalar(Math.max(0.01, pop(t, a, 0.2))); });
    // the elevator: Steve rides it, it only goes down
    Wd.cab.visible = win(t, B.builds - 0.1, 23.5); Wd.rail.visible = Wd.cab.visible; Wd.rail.scale.y = 12 * H; Wd.rail.position.y = 6 * H;
    if (Wd.cab.visible) { Wd.cab.scale.setScalar(Math.max(0.01, pop(t, B.builds, 0.3))); const d = t < B.down - 0.35 ? 0 : eout(ramp(t, B.down - 0.35, B.down + 0.04)) ** 2; Wd.cab.position.y = 8 * H * (1 - d) + (t > B.down + 0.04 ? Math.abs(Math.sin((t - B.down) * 16)) * 0.15 * Math.exp(-(t - B.down) * 6) : 0); }
    burst(Wd.dust, t, B.down + 0.04, [-TW / 2 - 0.5, 0.15, TZ + 1.2], 5, { spread: 1.6, up: 0.6, life: 0.8 });
    if (t > 32.9 && t < 34.4) burst(Wd.dust, t, B.swamp, [0, -0.3, ZF + 1.0], 30, { spread: 4.0, up: 1.0, life: 1.0, sc: 2.2 });
    if (t > 0 && t < 1.5) burst(Wd.dust.slice(0, 12), t, B.floor, [0, H, ZF + 0.3], 60, { spread: 1.4, up: 0.5, life: 0.7 });
    // the neighbor's house grows 2 floors
    const nbn = NBF(t); Wd.nbFloors.forEach((f, i) => { f.visible = i < nbn; if (f.visible && i > 0) f.scale.y = Math.max(0.01, pop(t, i === 1 ? B.adds : B.two, 0.25)); }); Wd.nbRoof.position.y = nbn * H + 0.5;
    // the ground lid drops away on "swamp"
    { const u = ramp(t, B.swamp, B.swamp + 0.55); Wd.lid.visible = u < 1; Wd.lid.position.y = -30 * u * u; Wd.lid.rotation.x = 0.25 * u; }
    Wd.mudBubbles.forEach((m, i) => { const r = PAINT.rng(i + 40), u = (t * 0.4 + r()) % 1; if (t < B.swamp + 0.3) { m.position.y = -200; return; } m.position.set((r() < 0.5 ? -1 : 1) * (TW / 2 + 0.4 + r() * 4), -1 - r() * 30 + u * 2, ZF + 0.05); m.scale.setScalar(u < 0.9 ? 0.6 + u : 0.01); });
    // pigeon: flies in, then to the wrong floor
    { const p = Wd.pigeon; let pos = null; if (win(t, B.pigeon - 0.4, 17.5)) pos = L3([6, 4, ZF + 1], [-0.55, 0.12, ZF + 0.9], eout(ramp(t, B.pigeon - 0.4, B.pigeon))); else if (win(t, 17.5, 19.5)) { const u = ramp(t, 17.6, B.wrong + 0.1); pos = L3([-0.55, 0.5, ZF + 0.9], [-0.55, 7 * H + 0.65, ZF + 0.15], eout(u)); }
      if (pos) { p.position.set(...pos); const fly = !(win(t, B.pigeon, 17.6)) ; const f = fly ? Math.sin(t * 22) * 0.9 : 0; Wd.pw1.rotation.x = f; Wd.pw2.rotation.x = -f; p.rotation.y = t < 17.5 ? Math.PI : 0.3; if (win(t, B.wrong + 0.1, 19.5)) { p.rotation.z = Math.sin((t - B.wrong) * 20) * 0.3 * Math.exp(-(t - B.wrong) * 3); } } else p.position.y = -200; }
    // goat: pops in at the base, then munches the stairs
    { const g = Wd.goat; if (win(t, B.goat - 0.05, 17.5)) { g.position.set(0.3, 0, ZF + 0.8); g.rotation.y = Math.PI; g.scale.setScalar(Math.max(0.01, pop(t, B.goat, 0.3)) * 0.9); Wd.goatHead.rotation.z = 0.1 * Math.sin(t * 2); }
      else if (win(t, 19.5, 21.2)) { const eaten = Math.max(0, Math.floor((t - B.eats) / 0.14)); g.position.set(TW / 2 + 0.35, Math.min(11, eaten + 1) * H + 0.05, TZ + 0.2); g.rotation.y = -Math.PI / 2; g.scale.setScalar(0.9); Wd.goatHead.rotation.z = -0.3 + 0.12 * Math.sin(t * 22); } else g.position.y = -200; }
    // the spaghetti ladder flops on "spaghetti"
    { const f = eout(ramp(t, B.spaghetti, B.spaghetti + 0.5)); Wd.ladder.rotation.z = -f * 1.2 + 0.05 * Math.sin(t * 6); Wd.ladder.scale.set(1, 1 - f * 0.35, 1); }
    // sparks: sky castle, 500 floors
    burst(Wd.sparks.slice(0, 12), t, B.castle, [0.4, top + 1.2, TZ + 1.4], 70, { spread: 1.4 }); burst(Wd.sparks.slice(12), t, 27.25, [0.4, TOP(27.25) + 1.0, TZ + 1.4], 90, { spread: 1.6 });
    // confetti on "Congratulations"
    Wd.confetti.forEach((m, i) => { const r = PAINT.rng(i + 300), u = t - B.congrats; if (u < 0 || u > 3.0) { m.position.y = -200; return; } m.position.set(-3 + r() * 7 + Math.sin(u * 3 + i) * 0.3, -2 - r() * 6 - u * 14, 0.8 + r() * 1.5); m.rotation.set(u * 7 + i, u * 5, u * 3); m.scale.setScalar(2.4); });
  };

  // ---------- actors ----------
  const actors = (t) => {
    const L = []; const top = TOP(t), nbTop = NBF(t) * H;
    // GUS
    if (t < 6.4) L.push(A('gus', t, -2.1, 0, ZF + 0.6, { expr: [[0, 'grin'], [B.tallest, 'smugsmile'], [B.nb, 'shock'], [B.add10, 'angry'], [B.ten, 'laugh']], R: [[0, 'up'], [B.floor + 0.1, 'thumb'], [B.nb, 'point'], [B.add10, 'up']], propR: t < B.floor + 0.1 ? 'gavel' : null, L: [[0, 'hip'], [B.add10, 'up']], lookBase: 0.7, hop: win(t, B.ten, B.ten + 0.5) ? Math.abs(Math.sin(t * 9)) * 0.06 : 0 }));
    else if (t < 12.5) L.push(A('gus', t, ROOFX, top + 0.14, ROOFZ, { expr: [[0, 'beam'], [B.sways, 'nervous'], [B.tie, 'smirk'], [B.cloud, 'grin'], [B.castle, 'laugh']], R: [[0, 'thumb'], [B.sways, 'up'], [B.tie, 'up'], [B.cloud + 0.3, 'thumb']], L: [[0, 'hip'], [B.sways, 'up'], [B.cloud + 0.3, 'hip']], lookBase: 0.4, roll: win(t, B.sways, B.tie) ? 6 * Math.sin(t * 2.6) : 0,
      reach: win(t, B.tie - 0.1, B.cloud + 0.35) ? { to: [Wd.cloud.position.x - 0.6, Wd.cloud.position.y - 0.5, -3.2], k: eout(ramp(t, B.tie - 0.1, B.tie + 0.2)) - eout(ramp(t, B.cloud, B.cloud + 0.3)), bend: 0.12 } : null }));
    else if (t < 14.84) { const u = ramp(t, 12.6, 14.8); L.push(A('gus', t, TW / 2 + 0.35, 0.05 + u * 4.2 * H + (Math.floor(u * 4.2 * 2) % 2) * 0.05, TZ + 1.35, { expr: [[0, 'nervous'], [B.stairs, 'sleepy']], R: 'hang', L: 'hang', walk: t * 1.5, lookBase: -0.3, tilt: 6 })); }
    else if (t < 17.48) L.push(A('gus', t, -1.3, 0, ZF + 0.6, { expr: [[0, 'grin'], [B.steve, 'smugsmile']], R: [[0, 'point'], [B.goat, 'thumb']], L: 'hip', lookBase: 0.6 }));
    else if (win(t, 23.5, 25.38)) { const f = eout(ramp(t, B.spaghetti, B.spaghetti + 0.5)); L.push(A('gus', t, -9 + 0.35 * f, 0.6 + ramp(t, 23.6, 24.6) * 0.8 - f * 1.4 * (t > B.spaghetti ? 1 : 0), -0.3, { expr: [[0, 'smirk'], [B.spaghetti, 'shock']], R: t < B.spaghetti ? 'up' : 'up', L: t < B.spaghetti ? 'up' : 'up', roll: -f * 40, lookBase: 0.3 })); }
    else if (t >= 25.38) L.push(A('gus', t, ROOFX, top + 0.14, ROOFZ, { expr: [[0, 'laugh'], [B.wait, 'think'], [B.why, 'nervous'], [B.because, 'think'], [B.swamp, 'shock'], [B.every, 'nervous'], [B.hey, 'angry'], [B.congrats, 'smugsmile'], [B.still, 'bored']], R: [[0, 'up'], [B.wait, 'chin'], [B.swamp, 'up'], [B.every, 'hang'], [B.congrats, 'thumb'], [B.still, 'hang']], L: [[0, 'up'], [B.wait, 'hip'], [B.swamp, 'up'], [B.every, 'hang'], [B.congrats, 'hip']], lookBase: t > B.why && t < B.because ? 0.9 : 0.3, hop: win(t, B.f500, B.f500 + 0.6) ? Math.abs(Math.sin(t * 9)) * 0.06 : 0 }));
    // THE NEIGHBOR (rides up with his floors)
    if (t < B.adds) L.push(A('nb', t, 3.3, 0, ZF + 0.6, { expr: [[0, 'stern'], [B.nb, 'sly']], R: [[0, 'hang'], [B.nb, 'thumb']], L: 'hip', flip: true, lookBase: -0.7 }));
    else L.push(A('nb', t, 4.6, nbTop + 0.02, TZ + 0.6, { expr: [[0, 'smugsmile'], [B.ten, 'shock'], [B.why, 'smirk'], [B.hey, 'laugh']], R: [[0, 'thumb'], [B.hey, 'point']], L: 'hip', flip: true, lookBase: -0.7, talk: win(t, B.hey, B.congrats) }));
    // STEVE
    if (win(t, B.steve - 0.1, 17.48)) L.push(A('steve', t, 1.15, 0, ZF + 0.6, { pop: B.steve, expr: 'grin', R: 'thumb', L: 'hip', lookBase: -0.4 }));
    if (Wd.cab.visible) L.push(A('steve', t, Wd.cab.position.x, Wd.cab.position.y + 0.04, Wd.cab.position.z + 0.1, { s: 0.5, expr: [[0, 'grin'], [B.down - 0.35, 'shock'], [B.down + 0.1, 'sleepy']], R: [[0, 'thumb'], [B.down - 0.35, 'up']], L: [[0, 'hip'], [B.down - 0.35, 'up']], lookBase: 0.5 }));
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
    const L = { ...LIGHT.dio }, ug = clamp((-Cm.pos[1] - 1.0) / 4);   // underground mood: dimmer sky bounce, warm lantern fill, deeper vignette
    if (ug > 0) { L.hemi *= 1 - 0.5 * ug; L.sunI *= 1 - 0.55 * ug; L.fillCol = '#ffb36a'; L.fillI = L.fillI + 2.2 * ug; L.vig = 0.18 + 0.3 * ug; L.sat = 1.1 + 0.08 * ug; L.expo = L.expo + 0.15 * ug; }
    Wd.motes.visible = t >= B.swamp; Wd.motes.material.opacity = 0.55 * ug;
    return { t, cam: Cm, light: L, dof: dofAt(Cm), actors: actors(t), whip: Cm.whip, flash: 0, ca: caAt(t) };
  };
  const SHOTS = [{ t: 0, n: 'One floor' }, { t: 3.64, n: 'The neighbor' }, { t: 5.12, n: 'Add 10' }, { t: 7.7, n: 'The wind' }, { t: 9.66, n: 'The cloud' }, { t: 12.52, n: '300 stairs' }, { t: 14.84, n: 'The trio' }, { t: 23.52, n: 'Spaghetti' }, { t: 25.38, n: '500 floors' }, { t: 27.8, n: 'Wait' }, { t: 33.2, n: 'The swamp' }, { t: 37.98, n: 'Congratulations' }].map((s) => ({ ...s, set: 'dio' }));
  return { FPS, END, TOTAL, frame, drawCaption, K, SHOTS, CAPS };
})();
