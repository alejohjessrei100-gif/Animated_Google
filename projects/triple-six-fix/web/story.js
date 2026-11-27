// Shot plan for "The Lottery That Drew 666" — timed to the 1.25x voice (words.js, seconds). 30 fps, 1080x1920.
// Every clause gets a story action + a camera move. Transitions between sets are speed whips; inside a set, fast eased moves + drift.
window.STORY = (() => {
  const FPS = 30, END = 67.35, TOTAL = Math.round(END * FPS);
  const Wd = WORLD, { rick, PROPS } = TOON;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = (u) => { u = clamp(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
  const eout = (u) => 1 - Math.pow(1 - clamp(u), 3);
  const lerp = (a, b, u) => a + (b - a) * u;
  const L3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const q = (v, s = 0.02) => Math.round(v / s) * s; // never quantise motion coarser than 0.02
  const ramp = (t, a, b) => clamp((t - a) / (b - a));
  const pulse = (t, a, d = 0.25) => (t >= a && t < a + d ? Math.sin((t - a) / d * Math.PI) : 0);

  // ---------- cast (new for this video, locked Ricks style) ----------
  const C = {
    nick: { outfit: 'suit', top: '#2f5fa8', tie: '#b52a32', shirt: '#f6f3ee', hat: 'slick', hair: '#2a1d17' },
    joe: { outfit: 'overalls', top: '#f28c28', pants: '#4f86c6', hat: 'flatcap', hatCol: '#7a5a3c' },
    marv: { outfit: 'vest', top: '#7a8a5c', hat: 'visor', hair: '#c9c2b5', glasses: 'round', moustache: '#6b5a48' },
    pal1: { outfit: 'trench', top: '#c86b4a', hat: 'fedora', hatCol: '#3b5f45', band: '#e5c158' },
    pal2: { outfit: 'trench', top: '#5a6fb0', hat: 'fedora', hatCol: '#6b3c3c', band: '#f2efe6' },
    pal3: { outfit: 'trench', top: '#8a9a4a', hat: 'bowler', hatCol: '#3a3040' },
    sal: { outfit: 'suit', top: '#6b3c8f', tie: '#e5c158', shirt: '#f6e9c4', hat: 'bowler', hatCol: '#2a2428', goatee: '#3a2a22' },
    judge: { outfit: 'robe', hairStyle: 'bald', hair: '#f2f0ea', glasses: 'round' },
    clerk: { outfit: 'apron', top: '#3fa39a', pants: '#3b3f52', hat: 'flatcap', hatCol: '#c62f36' },
    crew1: { outfit: 'tee', top: '#e07a5f', pants: '#3b3f52', hat: 'cap', hatCol: '#2a5fae' },
    crew2: { outfit: 'hoodie', top: '#3f8f6f', hairStyle: 'curly', hair: '#1e1714' },
    dad: { outfit: 'vest', top: '#c0392b', hair: '#5a3b2a' },
    mom: { outfit: 'dress', top: '#3fa39a', hairStyle: 'bun', hair: '#7a3e22' },
    kidA: { kid: true, outfit: 'tee', top: '#f4d35e', pants: '#4f86c6', hairStyle: 'pigtails', hair: '#5a3b2a' },
    gran: { outfit: 'dress', top: '#9b6bb0', hairStyle: 'bun', hair: '#e8e4dc', glasses: 'round' },
    hero: { kid: true, outfit: 'school', top: '#ffffff', tie: '#c62f36', pants: '#3b3f52', hair: '#2a1d17' },
    teach: { outfit: 'dress', top: '#2f6b4f', hairStyle: 'bun', hair: '#3a2a22', glasses: 'round' },
    kid1: { kid: true, outfit: 'tee', top: '#e07a5f', hairStyle: 'spiky', hair: '#8a5a32' },
    kid2: { kid: true, outfit: 'hoodie', top: '#5a6fb0', hairStyle: 'curly', hair: '#1e1714' },
    kid3: { kid: true, outfit: 'dress', top: '#f28c28', hairStyle: 'long', hair: '#c9893a' },
    kid4: { kid: true, outfit: 'tee', top: '#81b29a', hat: 'beanie', hatCol: '#c0392b' },
    jur1: { outfit: 'suit', top: '#8a5734', tie: '#2a5fae', hair: '#c9c2b5', hairStyle: 'bald' },
    jur2: { outfit: 'dress', top: '#e07a5f', hairStyle: 'long', hair: '#2b211c' },
    jur3: { outfit: 'vest', top: '#5c6b7a', hat: 'flatcap', hatCol: '#3b5f45' },
    jur4: { outfit: 'hoodie', top: '#f4d35e', hairStyle: 'curly', hair: '#7a3e22' },
  };
  const SEED = Object.fromEntries(Object.keys(C).map((k, i) => [k, i * 1.37 + 0.4]));

  // performance helpers (layer B/C): blink, darting eyes, sway, mouth flaps on quoted lines only
  const blinkAt = (t, s) => ((t + s * 1.9) % 3.3) < 0.11;
  const lookAt = (t, s, base = 0) => q(clamp(base + 0.45 * Math.sin(t * 0.8 + s) + 0.25 * Math.sin(t * 2.3 + s * 3), -1, 1), 0.1);
  const talkAt = (t, ranges) => { for (const [a, b] of ranges || []) if (t >= a && t <= b) { const v = Math.sin((t - a) * 21) * 0.5 + 0.5; return v > 0.55 ? 1 : v > 0.2 ? 0.4 : 0; } return 0; };
  const pick = (t, sched) => { let v = sched[0][1]; for (const [a, x] of sched) if (t >= a) v = x; return v; };
  const arm = (t, sched) => { // sched: [[t, pose], ...] with smooth 0.25 s blends
    let prev = sched[0][1], cur = sched[0][1], ta = -9; for (const [a, p] of sched) if (t >= a) { prev = cur; cur = p; ta = a; }
    const u = q(eout((t - ta) / 0.25), 0.02); return u >= 1 || prev === cur ? cur : { a: prev, b: cur, t: u };
  };
  // actor factory
  const A = (id, t, x, y, z, o = {}) => {
    const s0 = SEED[id];
    const opts = { pose: o.pose || 'stand', expr: o.expr ? (Array.isArray(o.expr) ? pick(t, o.expr) : o.expr) : 'neutral',
      look: o.look ?? lookAt(t, s0, o.lookBase || 0), L: o.L ? (Array.isArray(o.L) ? arm(t, o.L) : o.L) : 'hang', R: o.R ? (Array.isArray(o.R) ? arm(t, o.R) : o.R) : 'hang',
      propL: o.propL || null, propR: o.propR || null, blink: !o.noBlink && blinkAt(t, s0), talk: talkAt(t, o.talk), headTilt: q(o.tilt ?? 3 * Math.sin(t * 0.9 + s0), 0.5) };
    if (o.walk != null) opts.walk = q(o.walk % 1, 0.02);
    const ballNum = o.ballNum || '6';
    const sway = o.still ? 0 : Math.sin(t * 1.3 + s0) * 0.012;
    const hop = o.hop ? o.hop : 0;
    return { key: id + JSON.stringify(opts) + ballNum, x: x + sway, y: y + hop, z, s: o.s || 1, flip: o.flip, sq: o.sq || 0, roll: o.roll || 0, ground: o.ground ?? y,
      draw: (g) => { PROPS.ballNum = ballNum; g.translate(300, 975); g.scale(1.1, 1.1); rick(g, C[id], opts); } };
  };
  const walkTo = (t, t0, t1, p0, p1) => { const u = ramp(t, t0, t1); return { p: L3(p0, p1, ease(u)), walk: u > 0 && u < 1 ? (t - t0) * 1.6 : null }; };

  // ---------- lights per set ----------
  const LIGHT = {
    studio: { sky: '#e6ecff', ground: '#8a90c0', hemi: 1.45, sun: '#fff0d8', sunI: 1.5, az: -70, el: 62, fog: '#2a3270', bg: '#1d2458', fogNear: 14, fogFar: 42, sat: 1.12, fillCol: '#ffd9a8', fillI: 2.5, shadowExt: 8 },
    workshop: { sky: '#fff1dc', ground: '#a8846a', hemi: 1.4, sun: '#ffe2b8', sunI: 1.4, az: -50, el: 58, fog: '#7a5c48', bg: '#4a3a30', fogNear: 10, fogFar: 30, sat: 1.1, fillCol: '#ffe2b0', fillI: 2.0, shadowExt: 6 },
    classroom: { sky: '#ffffff', ground: '#b8ccd4', hemi: 1.55, sun: '#fff6e2', sunI: 1.6, az: -40, el: 55, fog: '#cfe6ee', bg: '#bfe0e8', fogNear: 12, fogFar: 34, sat: 1.1, fillI: 1.5, shadowExt: 7 },
    street: { sky: '#c8e6ff', ground: '#cdb98e', hemi: 1.3, sun: '#fff1d0', sunI: 2.1, az: -35, el: 48, fog: '#bfe2ff', bg: '#9fd0ff', fogNear: 16, fogFar: 55, sat: 1.12, fillI: 1.0, shadowExt: 10 },
    living: { sky: '#ffe9cc', ground: '#a8806a', hemi: 1.35, sun: '#ffd8a8', sunI: 1.2, az: -60, el: 55, fog: '#7a5c48', bg: '#5a4436', fogNear: 10, fogFar: 26, sat: 1.12, fillCol: '#ffe0b0', fillI: 2.2, shadowExt: 6 },
    bookie: { sky: '#f3eaff', ground: '#9a7a6a', hemi: 1.35, sun: '#ffe4bc', sunI: 1.3, az: -55, el: 60, fog: '#5a4a5a', bg: '#3a3040', fogNear: 10, fogFar: 26, sat: 1.12, fillCol: '#d8ffe0', fillI: 1.8, shadowExt: 6 },
    court: { sky: '#fff6e6', ground: '#a8846a', hemi: 1.45, sun: '#fff0d4', sunI: 1.6, az: -45, el: 60, fog: '#8a6a50', bg: '#5a4436', fogNear: 12, fogFar: 32, sat: 1.1, fillCol: '#ffe8c0', fillI: 2.0, shadowExt: 8 },
  };

  // ---------- camera compositions (t = start, set, pos, look, fov, drift) ----------
  const K = [
    // 1 hook: needle into the ball, pull back to Nick
    { t: 0.0, set: 'workshop', pos: [-19.3, 1.42, -1.1], look: [-19.51, 1.25, -1.95], fov: 40, drift: [0.06, 0.04, 0.14] },
    { t: 1.36, set: 'workshop', pos: [-19.2, 1.62, 1.3], look: [-19.85, 1.3, -1.7], fov: 42, drift: [0.3, 0.05, -0.2] },
    // 2 wins the lottery live
    { t: 2.24, set: 'studio', pos: [1.3, 1.55, 2.3], look: [3.6, 1.65, -2.0], fov: 44, drift: [0.6, 0.15, -0.3], roll: -2 },
    { t: 3.56, set: 'studio', pos: [5.6, 2.1, 1.4], look: [3.4, 1.65, -2.0], fov: 40, drift: [-0.4, 0, -0.2], roll: 2 },
    // 3 six six six
    { t: 5.1, set: 'studio', pos: [-0.6, 2.6, 0.9], look: [-1.0, 2.6, -3.0], fov: 46, drift: [-0.25, 0.3, -0.5] },
    { t: 6.2, set: 'studio', pos: [-1.3, 3.4, -2.0], look: [-1.73, 3.68, -3.0], fov: 42, ein: 0.22, drift: [0.1, 0.02, -0.12] },
    { t: 6.86, set: 'studio', pos: [0.8, 3.4, -2.0], look: [0.37, 3.68, -3.0], fov: 42, ein: 0.22, drift: [0.1, 0.02, -0.12], roll: 2 },
    { t: 7.58, set: 'studio', pos: [2.9, 3.4, -2.0], look: [2.47, 3.68, -3.0], fov: 42, ein: 0.22, drift: [0.1, 0.02, -0.12], roll: -2 },
    { t: 8.1, set: 'studio', pos: [1.6, 2.3, 2.4], look: [1.4, 2.5, -3.5], fov: 44, drift: [0.4, 0.1, -0.3] },
    // 4 1980, Pennsylvania
    { t: 8.8, set: 'studio', pos: [-6.2, 2.45, -1.2], look: [-7.85, 2.55, -2.6], fov: 40, drift: [0.15, 0.05, 0.3], roll: 1.5 },
    { t: 10.0, set: 'studio', pos: [-3.6, 2.3, 3.6], look: [0.2, 2.6, -4.2], fov: 46, drift: [0.8, 0.0, -0.4], roll: -1.5 },
    // 5 Nick reads the Daily Number
    { t: 11.3, set: 'studio', pos: [4.7, 1.78, 0.5], look: [3.7, 1.6, -2.1], fov: 38, drift: [-0.25, 0.04, -0.4] },
    { t: 12.5, set: 'studio', pos: [2.6, 1.7, 2.8], look: [3.6, 1.6, -2.1], fov: 34, drift: [0.15, 0, -0.5], roll: 1.5 },
    // 6 six million viewers
    { t: 13.24, set: 'living', pos: [56.55, 1.12, 0.6], look: [57.24, 1.07, 0.56], fov: 40, drift: [-0.25, 0.04, 0.05] },
    { t: 13.84, set: 'living', pos: [57.9, 1.8, 3.3], look: [53.9, 1.1, 0.75], fov: 46, drift: [-0.3, 0.05, -0.4], roll: -2 },
    // 7 three machines, ten balls, air up a tube
    { t: 14.95, set: 'studio', pos: [-3.4, 2.05, -0.5], look: [0, 2.0, -3.0], fov: 46, drift: [1.4, 0.05, 0.1] },
    { t: 16.0, set: 'studio', pos: [0.3, 1.95, -1.75], look: [0, 1.9, -3.0], fov: 40, drift: [-0.15, 0.05, 0.1], roll: 2 },
    { t: 17.4, set: 'studio', pos: [0.95, 2.0, -1.55], look: [0.37, 2.0, -3.0], fov: 40, drift: [0.05, 1.5, 0.0], dlook: [0, 1.7, 0] },
    // 8 Nick knows one thing; light balls fly, heavy balls stay
    { t: 18.7, set: 'workshop', pos: [-19.7, 1.6, 0.85], look: [-20.25, 1.4, -1.3], fov: 38, drift: [-0.2, 0.02, -0.35], roll: 1.5 },
    { t: 20.1, set: 'workshop', pos: [-17.65, 1.52, -1.35], look: [-18.0, 1.5, -2.3], fov: 40, drift: [0.12, 0.05, 0.1] },
    { t: 21.3, set: 'workshop', pos: [-19.45, 1.62, 0.55], look: [-20.15, 1.25, -1.9], fov: 42, drift: [0.15, 0.0, 0.1], roll: -2 },
    // 9 baby powder, sugar, Vaseline (dolly along the bench)
    { t: 22.6, set: 'workshop', pos: [-21.55, 1.7, 0.95], look: [-22.05, 1.2, -2.0], fov: 40, drift: [0.25, 0, 0] },
    { t: 23.85, set: 'workshop', pos: [-20.95, 1.7, 0.95], look: [-21.45, 1.2, -2.0], fov: 40, drift: [0.25, 0, 0], roll: 1.5 },
    { t: 24.6, set: 'workshop', pos: [-20.35, 1.7, 0.95], look: [-20.85, 1.2, -2.0], fov: 40, drift: [0.25, 0.05, 0.1], roll: -1.5 },
    // 10 Joe laughs
    { t: 25.8, set: 'workshop', pos: [-19.2, 1.65, 1.9], look: [-19.6, 1.35, -1.4], fov: 44, drift: [-0.3, 0, -0.3] },
    { t: 27.2, set: 'workshop', pos: [-18.5, 1.62, 0.8], look: [-19.0, 1.45, -1.25], fov: 40, drift: [0.12, 0.02, -0.15], roll: 2 },
    { t: 28.6, set: 'workshop', pos: [-19.8, 1.6, 0.8], look: [-20.25, 1.42, -1.35], fov: 40, drift: [-0.12, 0.02, -0.15], roll: -2 },
    // 11 latex paint, one needle, a drop in every ball, except the fours and sixes
    { t: 30.1, set: 'workshop', pos: [-19.75, 1.75, -0.95], look: [-20.4, 1.35, -2.25], fov: 42, drift: [0.08, 0.05, 0.15] },
    { t: 31.9, set: 'workshop', pos: [-19.85, 1.8, -1.0], look: [-20.35, 1.5, -2.2], fov: 42, drift: [0.05, -0.1, 0.05], roll: 1.5 },
    { t: 32.85, set: 'workshop', pos: [-19.95, 1.62, -0.85], look: [-19.6, 1.22, -1.95], fov: 42, drift: [1.1, 0, 0], dlook: [1.1, 0, 0] },
    { t: 34.5, set: 'workshop', pos: [-19.1, 1.45, -1.2], look: [-19.14, 1.22, -1.95], fov: 40, drift: [0.02, 0.02, 0.12], roll: -1.5 },
    // 12 couldn't float in a hurricane
    { t: 36.3, set: 'studio', pos: [0.5, 1.95, -1.65], look: [0, 1.85, -3.0], fov: 40, drift: [-0.2, 0.05, 0.1], roll: 3 },
    { t: 37.5, set: 'studio', pos: [-0.3, 1.9, 0.5], look: [-0.9, 1.7, -2.4], fov: 42, drift: [0.3, 0.02, -0.3], roll: -3 },
    // 13 April 24th, friends buy every combo, 14,000 tickets
    { t: 38.95, set: 'street', pos: [25.85, 1.95, -2.75], look: [25.4, 1.9, -3.72], fov: 38, drift: [0.4, 0.1, 0.7] },
    { t: 40.2, set: 'street', pos: [29.6, 1.85, 2.6], look: [26.8, 1.4, -2.6], fov: 44, drift: [-0.6, 0, -0.3], roll: 1.5 },
    { t: 41.7, set: 'street', pos: [28.6, 1.8, 1.0], look: [27.2, 1.4, -2.6], fov: 42, drift: [-0.15, 0.02, -0.12], roll: -1.5 },
    { t: 43.4, set: 'street', pos: [32.6, 1.1, 1.4], look: [30.8, 1.1, -1.6], fov: 46, drift: [0.2, 0.2, 0.3], dlook: [0, 1.4, 0] },
    // 14 the air kicks on: six, six, six
    { t: 45.1, set: 'studio', pos: [3.45, 1.85, -2.05], look: [3.0, 1.6, -2.75], fov: 40, drift: [0.08, 0.05, 0.05] },
    { t: 46.25, set: 'studio', pos: [-1.3, 3.4, -2.0], look: [-1.73, 3.68, -3.0], fov: 42, ein: 0.22, drift: [0.1, 0.02, -0.12], roll: -2 },
    { t: 46.86, set: 'studio', pos: [0.8, 3.4, -2.0], look: [0.37, 3.68, -3.0], fov: 42, ein: 0.22, drift: [0.1, 0.02, -0.12], roll: 2 },
    { t: 47.62, set: 'studio', pos: [2.9, 3.4, -2.0], look: [2.47, 3.68, -3.0], fov: 42, ein: 0.22, drift: [0.1, 0.02, -0.12] },
    { t: 48.1, set: 'studio', pos: [1.4, 2.4, 3.0], look: [1.6, 2.3, -3.2], fov: 46, drift: [0.5, 0.15, -0.3], roll: 2 },
    // 15 Wait... how did they get caught?
    { t: 48.65, set: 'studio', pos: [5.2, 1.85, -0.3], look: [3.9, 1.7, -2.1], fov: 38, drift: [-0.5, 0.05, 0.4], roll: -1.5 },
    { t: 50.0, set: 'studio', pos: [4.5, 1.8, 0.4], look: [3.75, 1.62, -2.1], fov: 38, drift: [-0.1, 0.0, -0.3], roll: 2 },
    // 16 like a kid who scores 100 without opening the book
    { t: 51.2, set: 'classroom', pos: [-42.4, 2.3, 3.8], look: [-45, 1.0, 0.0], fov: 46, drift: [-0.5, -0.1, -0.5] },
    { t: 52.35, set: 'classroom', pos: [-44.6, 1.95, 2.3], look: [-45.1, 0.95, 0.2], fov: 42, drift: [0.12, -0.1, -0.1], roll: 2 },
    { t: 54.2, set: 'classroom', pos: [-44.25, 1.25, 1.05], look: [-44.72, 0.8, 0.32], fov: 38, drift: [-0.1, 0.03, -0.15], roll: -2 },
    // 17 winning isn't suspicious; winning perfectly is
    { t: 55.7, set: 'classroom', pos: [-43.7, 1.6, 2.9], look: [-44.6, 1.15, 0.3], fov: 44, drift: [-0.2, 0, -0.3] },
    { t: 57.05, set: 'classroom', pos: [-43.3, 1.75, 2.95], look: [-44.25, 1.45, 0.6], fov: 42, drift: [-0.1, 0.02, -0.25], roll: 2 },
    // 18 bookies notice, stop paying
    { t: 58.6, set: 'bookie', pos: [80.9, 1.85, 1.5], look: [80.3, 1.65, -2.8], fov: 44, drift: [-0.3, 0, -0.4] },
    { t: 59.95, set: 'bookie', pos: [79.7, 1.6, -1.45], look: [79.4, 1.5, -2.88], fov: 40, drift: [0.4, -0.05, 0.05], roll: 1.5 },
    { t: 61.35, set: 'bookie', pos: [81.6, 1.8, 2.7], look: [81.4, 1.35, -1.5], fov: 46, drift: [-0.3, 0.05, -0.3], roll: -2 },
    // 19 the judge hands Nick seven years
    { t: 62.6, set: 'court', pos: [107.8, 2.4, 3.9], look: [105.6, 1.7, -2.0], fov: 46, drift: [-0.6, -0.1, -0.5] },
    { t: 63.7, set: 'court', pos: [105.45, 1.95, -0.75], look: [105.0, 1.85, -3.0], fov: 42, drift: [0.05, 0.1, 0.2], roll: 1.5 },
    // 20 ending: the 7 ball lands on Nick, tickets rain
    { t: 65.3, set: 'court', pos: [107.9, 2.0, 2.4], look: [106.5, 1.7, -0.6], fov: 44, drift: [-0.2, 0.0, -0.3], roll: -2 },
    { t: 66.3, set: 'court', pos: [107.6, 1.8, 2.2], look: [106.8, 1.6, 0.0], fov: 42, drift: [-0.1, 0.02, -0.12], roll: 2 },
  ];
  K.forEach((k, i) => { k.t1 = i + 1 < K.length ? K[i + 1].t : END + 0.5; });
  const SHAKES = [[21.62, 0.05], [24.92, 0.02], [45.54, 0.03], [61.82, 0.04], [64.28, 0.07], [66.36, 0.05], [2.58, 0.02]];
  const compAt = (t) => { let i = 0; for (let k = 0; k < K.length; k++) if (t >= K[k].t) i = k; return i; };
  const compState = (k, t) => { const u = ease(clamp((t - k.t) / Math.max(0.6, k.t1 - k.t))) * 0.85 + clamp((t - k.t) / (k.t1 - k.t)) * 0.15; const d = k.drift || [0, 0, 0], dl = k.dlook || [0, 0, 0];
    return { pos: [k.pos[0] + d[0] * u, k.pos[1] + d[1] * u, k.pos[2] + d[2] * u], look: [k.look[0] + dl[0] * u, k.look[1] + dl[1] * u, k.look[2] + dl[2] * u], fov: k.fov, roll: k.roll || 0 }; };
  const camAt = (t) => {
    const i = compAt(t), k = K[i]; let s = compState(k, t), whip = [0, 0];
    const prev = K[i - 1];
    const ein = k.ein || 0.45; if (prev && prev.set === k.set && t - k.t < ein) { const p = compState(prev, k.t), u = ease((t - k.t) / ein); s = { pos: L3(p.pos, s.pos, u), look: L3(p.look, s.look, u), fov: lerp(p.fov, s.fov, u), roll: lerp(p.roll, s.roll, u) }; const sp = Math.sin(u * Math.PI); whip = [0.012 * sp * Math.sign(s.pos[0] - p.pos[0] || 1), 0]; }
    if (prev && prev.set !== k.set && t - k.t < 0.16) { const u = 1 - (t - k.t) / 0.16; s.look = L3(s.look, [s.look[0] + 1.6 * u, s.look[1], s.look[2]], 1); whip = [0.09 * u, 0]; }
    const next = K[i + 1]; if (next && next.set !== k.set && next.t - t < 0.16) { const u = 1 - (next.t - t) / 0.16; s.look = [s.look[0] - 1.6 * u * u, s.look[1], s.look[2]]; whip = [0.09 * u, 0]; }
    // handheld + roll drift + impact shakes
    const hn = [Math.sin(t * 1.7) * 0.006 + Math.sin(t * 3.9) * 0.003, Math.sin(t * 2.3 + 1) * 0.005, Math.sin(t * 1.3 + 2) * 0.004];
    let sh = 0; for (const [a, amp] of SHAKES) if (t >= a && t < a + 0.5) sh += amp * Math.exp(-(t - a) * 9);
    const sx = Math.sin(t * 61) * sh, sy = Math.cos(t * 53) * sh;
    return { pos: [s.pos[0] + hn[0] + sx, s.pos[1] + hn[1] + sy, s.pos[2] + hn[2]], look: [s.look[0] + sx * 0.5, s.look[1] + sy * 0.5, s.look[2]], fov: s.fov, roll: s.roll + Math.sin(t * 0.55) * 1.2, set: k.set, whip };
  };
  const dofAt = (C) => { const d = Math.hypot(C.pos[0] - C.look[0], C.pos[1] - C.look[1], C.pos[2] - C.look[2]); return { focus: d, cinf: d < 1.2 ? 10 : 7 }; };

  // ---------- studio state ----------
  const PICK1 = [6.24, 6.86, 7.6], PICK2 = [46.28, 46.86, 47.66];
  const studioState = (t) => {
    const rigged = t > 36 || (t >= 2 && t < 8.8);
    const heavy = (i) => rigged && i !== 4 && i !== 6;
    let air = 1, picks = null;
    if (t > 45 && t < 45.54) air = 0.0; else if (t >= 45.54 && t < 46.0) air = ramp(t, 45.54, 46.0);
    if (t >= 36.3 && t < 38.95) air = 1.5;
    const P = (t >= 5.1 && t < 8.8) ? PICK1 : (t >= 45 && t < 52) ? PICK2 : null;
    Wd.machines.forEach((mc, k) => { const pk = P ? [{ d: 6, t: P[k] }] : (t >= 17.4 && t < 18.7 && k === 1 ? [{ d: 3, t: 17.55 }] : null); Wd.runMachine(mc, t, air, heavy, pk); });
    let vals = ['', '', ''], red = false;
    if (t >= 2.24 && t < 5.1) { vals = [6, 6, 6]; red = true; }
    if (P) { vals = P.map((p) => (t >= p + 0.32 ? 6 : '')); red = t >= P[2] + 0.32; }
    if (t >= 48.6 && t < 52) { vals = [6, 6, 6]; red = true; }
    Wd.setBoard(vals, red);
    const party = (t >= 2.24 && t < 5.1) || (t >= 48.0 && t < 51);
    Wd.bulbs.forEach((b, i) => { const on = party ? ((i + Math.floor(t * 10)) % 3 === 0) : ((i + Math.floor(t * 4)) % 4 === 0); b.material.emissiveIntensity = on ? 1.2 : 0.15; });
    Wd.spots.forEach((s, i) => { s.rotation.z = Math.sin(t * 0.7 + i * 1.3) * 0.35; s.rotation.x = Math.sin(t * 0.5 + i) * 0.2; });
    Wd.cams.forEach((c, i) => { c.tally.material.emissiveIntensity = (i === 1 || Math.floor(t * 2) % 2) ? 1.5 : 0.2; });
    Wd.stars.forEach((s, i) => { s.rotation.z = Math.sin(t * 0.8 + i) * 0.2; });
    Wd.lever.rotation.x = t >= 45.54 && t < 52 ? -0.9 : 0.5;
    const conf = (a, b) => t >= a && t < b;
    Wd.confetti.forEach((c, i) => { const r = PAINT.rng(i + 7); const x = (r() - 0.5) * 9 + 1.5, z = -3.5 + r() * 6, sp = 0.8 + r() * 0.8; let st = null; if (conf(2.5, 5.1)) st = 2.5; if (conf(48.1, 51.2)) st = 48.1; if (st == null) { c.visible = false; return; } c.visible = true; const tt = t - st + r() * 0.4; c.position.set(x + Math.sin(tt * 3 + i) * 0.3, 6.0 - tt * sp * 1.6, z + Math.cos(tt * 2 + i) * 0.3); c.rotation.set(tt * 5 + i, tt * 3, tt * 4); if (c.position.y < 0.03) c.position.y = 0.03; });
    // hurricane: confetti doubles as wind-blown debris across machine 2
    if (t >= 36.3 && t < 38.95) Wd.confetti.forEach((c, i) => { if (i > 40) return; c.visible = true; const u = ((t * 1.3 + i * 0.037) % 1); c.position.set(-0.55 + u * 1.1, 1.6 + Math.sin(i * 3 + t * 4) * 0.4, -3.0 + Math.cos(i) * 0.3); c.rotation.set(t * 9 + i, t * 7, 0); });
    Wd.qmark.visible = t >= 48.72 && t < 51.2; if (Wd.qmark.visible) { const u = eout((t - 48.72) / 0.3); Wd.qmark.scale.setScalar(Math.max(0.01, u)); Wd.qmark.rotation.y = Math.sin(t * 2) * 0.4; Wd.qmark.position.y = 2.15 + Math.sin(t * 3) * 0.05; }
  };

  // ---------- workshop state ----------
  const trayX = (i) => -19.2 - 0.56 + i * 0.125;
  const workshopState = (t) => {
    // lamp moth, clock, steam
    Wd.moth.position.set(-21.0 + Math.sin(t * 3.1) * 0.35, 2.05 + Math.sin(t * 4.7) * 0.15, -2.2 + Math.cos(t * 2.7) * 0.3);
    Wd.clockW.mm.rotation.z = -t * 0.8; Wd.clockW.hm.rotation.z = -t * 0.07;
    Wd.runSmoke(Wd.steam, t, -18.4, 1.14, -2.7, 0.5, 0.05, 0.5);
    Wd.bulbW.rotation.z = Math.sin(t * 1.4) * 0.12;
    Wd.fanBlades.rotation.y = t * 30;
    // syringe path
    const sy = Wd.syringe; let sp = [-18.6, 1.3, -2.0], plunge = 0;
    if (t < 2.24) { sp = [trayX(2), 1.48 - eout(t / 0.7) * 0.07, -1.95]; plunge = ramp(t, 0.7, 1.4); }
    else if (t >= 31.9 && t < 32.85) { const u = ramp(t, 31.95, 32.4); sp = [-20.4, 1.78 - Math.sin(u * Math.PI) * 0.2, -2.25]; plunge = 1 - ramp(t, 32.1, 32.6); }
    else if (t >= 32.85 && t < 36.3) { const u = ramp(t, 32.98, 34.5) * 9.999; const i = Math.min(9, Math.floor(u)), f = u - i; const k = [0, 1, 2, 3, 5, 7, 8, 9]; const bi = i; const x = trayX(bi); const skip = bi === 4 || bi === 6; sp = [x, 1.48 - (skip ? -0.04 : Math.sin(f * Math.PI) * 0.06), -1.95]; plunge = ramp(t, 32.98, 34.5) * 0.8; if (t > 34.5) sp = [-18.75, 1.55, -1.75]; }
    sy.position.set(...sp); sy.rotation.z = t < 2.24 ? 0.12 : 0.08; Wd.plunger.position.y = 0.2 - plunge * 0.12; Wd.fill.scale.y = 1 - plunge * 0.6; Wd.fill.position.y = -0.07 - plunge * 0.048;
    // the drop
    Wd.drop.position.set(0, -50, 0);
    if (t > 1.0 && t < 1.7) Wd.drop.position.set(trayX(2) + 0.02, 1.13 + Math.sin((t - 1.0) * 9) * 0.006, -1.92);
    // paint lid pops on "latex" (30.82)
    const lp = ramp(t, 30.85, 31.15); Wd.paintLid.position.set(0, 0.355 + Math.sin(lp * Math.PI) * 0.25 + (lp >= 1 && t > 30.8 ? 0 : 0), lp >= 1 ? 0.12 : 0); Wd.paintLid.rotation.x = lp * 1.4; if (t < 30.8) { Wd.paintLid.position.set(0, 0.355, 0); Wd.paintLid.rotation.x = 0; }
    // tray balls: dip as injected, 4 and 6 lift and spin on "fours and sixes"
    Wd.trayBalls.forEach((b, i) => { b.position.y = 0.1; b.rotation.y = -Math.PI / 2; const ti = 32.98 + (i / 10) * 1.52; if (t >= ti && t < ti + 0.2 && i !== 4 && i !== 6) b.position.y = 0.1 - pulse(t, ti, 0.2) * 0.02;
      if ((i === 4 || i === 6) && t >= 34.95 && t < 36.4) { const u = eout(ramp(t, i === 4 ? 34.98 : 35.44, (i === 4 ? 34.98 : 35.44) + 0.25)); b.position.y = 0.1 + u * (0.14 + Math.sin(t * 6 + i) * 0.02); b.rotation.y = -Math.PI / 2 + Math.sin(t * 3) * 0.6; } });
    // light ball floats over the fan (20.26), heavy ball thuds on the bench (21.62)
    const fb = Wd.floatBall; fb.position.set(-18.0, t >= 20.2 && t < 22.6 ? 1.6 + ease(ramp(t, 20.2, 20.6)) * 0.2 + Math.sin(t * 7) * 0.04 : -50, -2.3);
    const hb = Wd.heavyBall; const fall = ramp(t, 21.42, 21.62); hb.position.set(-20.0, t >= 21.3 && t < 22.6 ? (fall < 1 ? 1.8 - fall * fall * 0.73 : 1.07 + pulse(t, 21.62, 0.12) * 0.03) : -50, -2.05);
    // powder puff (23.14), sugar spill (24.08), vaseline lid (24.92)
    Wd.puffs.forEach((p, k) => { const u = (t - 23.14) / 1.1 - k * 0.02; if (u < 0 || u > 1) { p.position.y = -50; return; } const a = k * 2.4; p.position.set(-22.3 + Math.cos(a) * u * 0.5, 1.4 + u * 0.55 + Math.sin(a) * 0.1 * u, -2.2 + Math.sin(a) * u * 0.35); p.scale.setScalar(1 + u * 3.2); });
    Wd.powder.rotation.z = t >= 23.0 && t < 23.6 ? -0.5 * Math.sin(ramp(t, 23.0, 23.6) * Math.PI) : 0;
    Wd.sugar.rotation.z = t >= 23.95 && t < 25 ? -0.7 * eout(ramp(t, 23.95, 24.2)) : 0;
    Wd.sugarBits.forEach((s, k) => { const u = (t - 24.05 - k * 0.012); if (u < 0 || t > 26) { s.position.y = -50; return; } const vx = 0.25 + (k % 5) * 0.06, vz = ((k * 7) % 9 - 4) * 0.04; s.position.set(-21.6 + vx * Math.min(u, 0.6), Math.max(1.01, 1.25 - 4.9 * Math.min(u, 0.6) ** 2 + 0.6 * Math.min(u, 0.6)), -2.25 + vz * Math.min(u, 0.6)); });
    const vl = ramp(t, 24.92, 25.25); Wd.vasLid.position.set(0, 0.18 + Math.sin(vl * Math.PI) * 0.3, vl * 0.15); Wd.vasLid.rotation.x = vl * 2.2; if (t < 24.9) { Wd.vasLid.position.set(0, 0.18, 0); Wd.vasLid.rotation.x = 0; }
    Wd.lampW.rotation.z = Math.sin(t * 0.9) * 0.05;
  };

  // ---------- other sets ----------
  const streetState = (t) => {
    Wd.pigeons.forEach((p, i) => { const h = Math.abs(Math.sin(t * 3 + i * 2)); p.head.position.x = 0.1 + h * 0.03; p.g.position.y = Math.max(0, Math.sin(t * 2.2 + i) - 0.85) * 0.6; p.g.rotation.y = Math.sin(t * 0.6 + i) * 1.2; });
    Wd.runSmoke(Wd.chimney, t, 28.0, 9.5, -8.5, 2.5, 0.4, 0.25);
    // ticket tower grows on "fourteen thousand" (43.58)
    const g = eout(ramp(t, 43.4, 44.6)); const n = Math.floor(g * Wd.ticketStack.length);
    Wd.ticketStack.forEach((m, i) => { if (i >= n || t < 43.3 || t > 45.2) { m.position.y = -50; return; } m.position.set(30.8 - 30 + Math.sin(i * 1.7) * 0.03, 0.19 + i * 0.016, -1.6 + Math.cos(i * 2.3) * 0.03); m.rotation.y = Math.sin(i) * 0.3; });
    Wd.sign14k.position.y = t > 43.5 ? 0.19 + g * 2.45 : -50;
    Wd.flyTickets.forEach((m, i) => { const r = PAINT.rng(i + 99); if (t < 41.2 || t > 45.2) { m.position.y = -50; return; } const tt = (t * (0.4 + r() * 0.3) + r()) % 1; m.position.set(-4 + r() * 6, 3.2 - tt * 3.1, -2.8 + r() * 3); m.rotation.set(t * 4 + i, t * 3, t * 2 + i); });
  };
  const livingState = (t) => { Wd.tvGlow.intensity = 2.5 + Math.sin(t * 13) * 0.6; Wd.catTail.rotation.z = Math.sin(t * 3) * 0.6; Wd.catHead.position.y = 0.28 + Math.abs(Math.sin(t * 1.5)) * 0.02; Wd.clockL.mm.rotation.z = -t * 0.8;
    Wd.popcorn.forEach((p, i) => { const u = ((t * 0.9 + i / 18) % 1); p.position.set(53.95 + Math.sin(i * 2.1) * 0.25, 1.05 + Math.sin(u * Math.PI) * 0.35, 0.3 + Math.cos(i * 1.3) * 0.25); });
    Wd.tvScreen.map = WORLD.screenTex || Wd.tvScreen.map; };
  const classState = (t) => { Wd.fanC.rotation.y = t * 7; Wd.clockC.mm.rotation.z = -t * 0.8; Wd.globeBall.rotation.y = t * 0.6;
    const pu = ((t - 51.2) / 2.6) % 1; Wd.plane.position.set(-47 + pu * 4.5, 2.6 - pu * 0.6 + Math.sin(pu * 7) * 0.1, -1 + pu * 2); Wd.plane.rotation.set(0, -1.2, Math.sin(pu * 7) * 0.3);
    Wd.tests.forEach((m, i) => { const ti = [52.6, 52.9, 53.18, 53.52][i % 4] + Math.floor(i / 4) * 0.08; if (t < ti) { m.position.y = -50; return; } const u = eout((t - ti) / 0.2); m.position.set(-0.22 + Math.sin(i * 1.9) * 0.03, 0.755 + i * 0.006 + (1 - u) * 0.3, 0.42 + Math.cos(i * 2.3) * 0.03); m.rotation.set(0, Math.sin(i * 2.7) * 0.25 + (1 - u) * 2, 0); }); };
  const bookieState = (t) => { Wd.fanB.rotation.y = t * 6; Wd.runSmoke(Wd.cigar, t, 81.35, 1.25, -1.95, 1.0, 0.15, 0.45); Wd.lampB.rotation.z = Math.sin(t * 1.1) * 0.03;
    Wd.cashLid.rotation.x = t >= 61.82 ? 0 : -1.2; Wd.payoutSign.userData.face.map = t >= 61.82 ? Wd.payoutClosed : Wd.payoutSign.userData.face.map0 || (Wd.payoutSign.userData.face.map0 = Wd.payoutSign.userData.face.map);
    if (t >= 61.82) Wd.payoutSign.rotation.z = Math.sin((t - 61.82) * 14) * 0.15 * Math.exp(-(t - 61.82) * 3);
    Wd.phone.rotation.z = t > 59 ? Math.sin(t * 40) * 0.04 : 0; };
  const courtState = (t) => { Wd.flags.forEach((f, i) => Wd.wave(f, t + i, 0.04)); Wd.fanCt.rotation.y = t * 6; Wd.clockCt.mm.rotation.z = -t * 0.8;
    Wd.dust.forEach((d, i) => { const r = PAINT.rng(i + 3); d.position.set(103 + r() * 4 + Math.sin(t * 0.3 + i) * 0.2, 1 + ((r() * 3 + t * 0.05) % 3), -2 + r() * 4); });
    Wd.sevenSign.position.y = t >= 64.64 ? 4.6 - eout((t - 64.64) / 0.35) * 1.75 + pulse(t, 64.99, 0.2) * 0.05 : 4.6;
    const air = t >= 65.3 ? 1 : 0.15; Wd.runMachine(Wd.exhibit, t, air, () => false, null);
    const s = Wd.seven; if (t >= 65.55 && t < 66.36) { const u = (t - 65.55) / 0.81; s.position.set(lerp(104.32, 106.8, u), 2.3 + Math.sin(u * Math.PI) * 1.4 - u * 0.4, lerp(-2.6, 0.0, u)); s.rotation.set(t * 9, t * 7, 0); }
    else if (t >= 66.36) { const u = (t - 66.36); s.position.set(106.8 + u * 0.7, 2.0 + Math.max(0, 0.6 * u - 2.5 * u * u) * 2, 0.05 + u * 0.3); s.rotation.set(t * 5, t * 4, 0); if (s.position.y < 0.14) s.position.y = 0.14; }
    else s.position.set(0, -50, 0);
    Wd.rain.forEach((m, i) => { const r = PAINT.rng(i + 400); if (t < 65.4) { m.position.y = -50; return; } const tt = t - 65.4 + r() * 0.8; m.position.set(104.6 + r() * 4.0 + Math.sin(tt * 2 + i) * 0.2, 3.3 - tt * (0.9 + r() * 0.7), -1.6 + r() * 3.6); m.rotation.set(tt * 4 + i, tt * 3, tt * 5); if (m.position.y < 0.03) m.position.y = 0.03; }); };

  // ---------- actors per set ----------
  const actors = (t, set) => {
    const L = [];
    if (set === 'workshop') {
      // Nick at the bench; moves along the bench with each attempt
      let nx = -20.15, nz = -1.35, expr = 'sly', Rp = [[0, 'holdUp']], Lp = [[0, 'hold']];
      if (t < 2.3) { expr = [[0, 'smirk'], [1.3, 'sly'], [1.7, 'grin']]; Rp = [[0, 'holdUp']]; nx = -20.05; nz = -1.6; }
      else if (t < 22.6) { expr = [[18.7, 'think'], [19.34, 'sly'], [20.3, 'grin'], [21.62, 'shock'], [21.9, 'smugsmile']]; Rp = [[18.7, 'chin'], [19.3, 'up'], [20.2, 'point'], [21.3, 'hip']]; Lp = [[18.7, 'hang'], [20.2, 'hip']]; nx = t >= 21.3 ? -20.55 : -20.25; if (t >= 21.3) Rp = [[21.3, 'holdUp'], [21.42, 'point']]; }
      else if (t < 25.8) { const k = t < 23.85 ? 0 : t < 24.6 ? 1 : 2; nx = [-21.7, -21.1, -20.5][k]; nz = -1.55; expr = [[22.6, 'think'], [23.2, 'shock'], [23.9, 'think'], [24.2, 'nervous'], [24.75, 'stern'], [25.0, 'shock']]; Rp = [[22.6, 'hold'], [23.1, 'up'], [23.9, 'point'], [24.7, 'hold'], [24.95, 'up']]; Lp = [[22.6, 'hip'], [23.1, 'mouth'], [23.6, 'hip']]; }
      else if (t < 30.1) { nx = -20.25; expr = [[25.8, 'nervous'], [26.5, 'angry'], [28.6, 'stern']]; Rp = [[25.8, 'hip']]; Lp = [[25.8, 'cross']]; }
      else { nx = t < 32.85 ? -21.0 : -19.85; expr = [[30.1, 'sly'], [30.85, 'smirk'], [32.1, 'smugsmile'], [33.0, 'sly'], [35.0, 'beam']]; Rp = [[30.1, 'hold'], [32.0, 'holdUp'], [35.0, 'up']]; Lp = [[30.1, 'hip']]; if (t > 32.85) { nx = -20.75; nz = -1.5; } }
      L.push(A('nick', t, nx, 0, nz, { expr, R: Rp, L: Lp }));
      if (t >= 25.8 && t < 30.1) { const w = walkTo(t, 25.8, 26.5, [-17.4, 0, -1.1], [-19.05, 0, -1.2]); L.push(A('joe', t, w.p[0], 0, w.p[2], { walk: w.walk, expr: [[25.8, 'grin'], [26.48, 'laugh'], [27.3, 'grin'], [28.3, 'laugh']], R: [[25.8, 'hang'], [26.5, 'point'], [27.6, 'wave'], [28.6, 'point']], L: [[25.8, 'hang'], [26.5, 'hip']], talk: [[27.26, 29.6]], hop: pulse(t, 26.5, 0.3) * 0.05 + pulse(t, 28.4, 0.3) * 0.04, flip: true })); }
    }
    if (set === 'studio') {
      const nickAtPodium = !(t >= 8.8 && t < 10.4);
      const nexpr = t < 5.1 ? [[2.24, 'beam'], [3.6, 'grin'], [4.3, 'laugh']] : t < 8.8 ? [[5.1, 'smirk'], [6.6, 'sly'], [7.95, 'smugsmile']] : t < 14.95 ? [[10.4, 'grin'], [11.3, 'smile'], [12.3, 'grin'], [13.6, 'smile']] : t < 36 ? [[14.95, 'sly']] : t < 48.6 ? [[36.3, 'smirk'], [45.5, 'sly'], [46.6, 'smirk'], [47.98, 'smugsmile']] : [[48.6, 'smugsmile'], [49.4, 'think'], [50.2, 'nervous']];
      const nR = t < 5.1 ? [[2.24, 'up'], [3.3, 'wave'], [4.0, 'up']] : t < 14.95 ? [[5.1, 'hip'], [11.3, 'holdUp'], [12.2, 'point'], [13.0, 'holdUp']] : t < 48.6 ? [[14.95, 'hip'], [45.3, 'point'], [46.0, 'hip']] : [[48.6, 'hip'], [49.6, 'chin']];
      const nL = t < 5.1 ? [[2.24, 'up']] : [[0, 'hold']];
      if (nickAtPodium) L.push(A('nick', t, 3.7, 0.22, -2.15, { expr: nexpr, R: nR, L: nL, propR: t >= 11.3 && t < 14.95 ? 'clipboard' : null, talk: [[12.0, 14.3]], hop: t < 5.1 ? Math.abs(Math.sin((t - 2.24) * 6)) * 0.06 : 0 }));
      else { const w = walkTo(t, 9.4, 10.4, [6.8, 0.22, -2.2], [3.7, 0.22, -2.15]); L.push(A('nick', t, w.p[0], 0.22, w.p[2], { walk: w.walk, expr: 'smile', R: 'wave', L: 'hang' })); }
      // Marv: nervous official by the machines
      const mx = t >= 36.3 && t < 38.95 ? -1.1 : -3.45;
      L.push(A('marv', t, mx, 0.22, -2.05, { expr: t < 5.1 ? [[2.24, 'shock']] : t >= 36.3 && t < 38.95 ? [[36.3, 'shock'], [37.2, 'nervous']] : t >= 45 ? [[45, 'nervous'], [47.2, 'shock'], [49, 'nervous']] : [[0, 'neutral'], [16.0, 'think'], [17.5, 'grin']], L: [[0, 'hold']], propL: 'clipboard', R: t >= 36.3 && t < 38.95 ? 'up' : [[0, 'hang'], [15.1, 'point'], [16.5, 'hang']], roll: t >= 36.3 && t < 38.95 ? Math.sin(t * 9) * 0.06 : 0, tilt: t >= 36.3 && t < 38.95 ? -8 : undefined }));
      // crew behind the TV cameras (reactors)
      L.push(A('crew1', t, -3.15, 0, 3.35, { expr: t < 5.1 ? [[2.24, 'shock'], [3.0, 'beam']] : t >= 48 && t < 51 ? 'shock' : 'bored', R: t < 5.1 ? 'up' : 'hold', L: 'hold', hop: t < 5.1 ? Math.abs(Math.sin(t * 7)) * 0.05 : 0 }));
      L.push(A('crew2', t, 2.75, 0, 4.15, { expr: t < 5.1 ? 'laugh' : t >= 48 && t < 51 ? 'shock' : [[0, 'neutral'], [12, 'smile'], [30, 'bored']], R: t < 5.1 ? 'wave' : 'hold', L: 'hip', flip: true }));
      if (t >= 8.8 && t < 11.3) { const w = walkTo(t, 9.0, 11.2, [-6.5, 0, -0.3], [-1.6, 0, 0.1]); L.push(A('joe', t, w.p[0], 0, w.p[2], { walk: w.walk, expr: 'smile', R: 'holdUp', propR: 'wrench', L: 'hang' })); }
    }
    if (set === 'living') {
      const ex = [[13.24, 'neutral'], [13.6, 'grin']];
      L.push(A('dad', t, 53.85, 0.32, -0.25, { pose: 'sit', expr: [[13.24, 'smile'], [14.1, 'beam']], R: [[13.24, 'hold'], [14.0, 'point']], L: 'hang', look: 0.8 }));
      L.push(A('mom', t, 53.85, 0.32, 0.45, { pose: 'sit', expr: [[13.24, 'smile'], [14.3, 'grin']], R: 'mouth', L: 'hang', look: 0.7, propL: null }));
      L.push(A('kidA', t, 53.9, 0.32, 1.05, { pose: 'sit', expr: [[13.24, 'grin'], [14.2, 'laugh']], R: 'up', L: 'up', hop: Math.abs(Math.sin(t * 6)) * 0.05 }));
      L.push(A('gran', t, 53.6, 0, 2.0, { expr: [[13.24, 'sleepy'], [14.4, 'shock']], R: 'hold', L: 'hang', propR: 'coffee' }));
    }
    if (set === 'street') {
      const sneak = (id, i) => { const w = walkTo(t, 40.0 + i * 0.25, 41.4 + i * 0.2, [24.3 - i * 0.9, 0.18, -1.6 + i * 0.3], [26.3 + i * 0.6, 0.18, -2.2 + i * 0.35]); return A(id, t, w.p[0], 0.18, w.p[2], { walk: w.walk, expr: t < 41.4 ? 'sly' : t < 43.4 ? [[41.4, 'smirk'], [42.4, 'sly']] : [[43.4, 'grin'], [43.9, 'beam']], R: t < 41.2 ? 'hang' : [[41.2, 'holdUp'], [43.6, 'up']], propR: t >= 41.2 ? 'tickets' : null, L: i === 0 ? [[40, 'mouth'], [41.2, 'hang']] : 'hang', look: t < 41.4 ? Math.sin(t * 4 + i) : undefined, hop: t > 43.6 ? Math.abs(Math.sin(t * 6 + i)) * 0.05 : 0 }); };
      if (t >= 40.0) { L.push(sneak('pal1', 0)); L.push(sneak('pal2', 1)); L.push(sneak('pal3', 2)); }
      L.push(A('clerk', t, 27.0, 0.18, -3.75, { expr: t < 41.6 ? 'bored' : [[41.6, 'grin'], [43.6, 'shock']], R: [[38.9, 'hang'], [41.14, 'holdUp']], propR: 'tickets', L: 'hip' }));
    }
    if (set === 'classroom') {
      const deskPos = (c, r_) => [-45 - 2.4 + c * 2.4, 0.46, -1.4 + r_ * 1.8 - 0.55];
      const kids = [['kid1', 0, 0], ['kid2', 2, 0], ['kid3', 0, 1], ['kid4', 2, 1], ['kid1', 0, 2], ['kid3', 2, 2]];
      kids.forEach(([id, c, r_], i) => { const p = deskPos(c, r_); L.push(A(id, t + i, p[0], p[1], p[2], { pose: 'sit', expr: t < 55.7 ? (i % 2 ? 'bored' : 'think') : [[55.7, 'shock'], [56.6 + i * 0.1, 'sly']], R: t > 55.7 && i % 2 ? 'mouth' : 'hang', L: 'hang', look: -0.6 })); });
      const hp = deskPos(1, 1); L.push(A('hero', t, hp[0], hp[1], hp[2], { pose: 'sit', expr: t < 55.7 ? [[51.2, 'smugsmile'], [52.6, 'beam'], [54.3, 'smirk']] : [[55.7, 'nervous'], [57.2, 'shock']], R: t < 55.7 ? [[51.2, 'hold'], [52.6, 'up'], [53.6, 'thumb']] : 'mouth', propR: t < 55.7 ? 'test' : null, L: 'hang', hop: t >= 52.6 && t < 54 ? Math.abs(Math.sin(t * 6)) * 0.04 : 0 }));
      const w = walkTo(t, 55.6, 56.4, [-42.6, 0, -0.6], [-44.25, 0, 0.75]); const tw = t < 55.6 ? [-45.6, 0, -3.3] : w.p;
      L.push(A('teach', t, tw[0], 0, tw[2], { walk: w.walk, expr: t < 55.7 ? [[51.2, 'smile'], [53.5, 'neutral']] : [[55.7, 'stern'], [56.6, 'smirk'], [57.14, 'angry']], R: t < 55.7 ? 'point' : 'holdUp', propR: t >= 55.7 ? 'magnifier' : null, L: 'hip', tilt: t > 56.5 ? 10 : undefined, flip: t >= 55.7 }));
    }
    if (set === 'bookie') {
      L.push(A('sal', t, 80.85, 0, -2.05, { expr: [[58.6, 'neutral'], [58.92, 'think'], [59.6, 'stern'], [60.44, 'angry'], [61.4, 'smirk'], [61.82, 'stern']], R: [[58.6, 'hold'], [59.2, 'point'], [61.4, 'hang'], [61.7, 'up']], propR: t < 59.2 ? 'notepad' : null, L: [[58.6, 'hip']], propL: 'cigar', flip: true }));
      if (t >= 61.0) { const w = walkTo(t, 61.0, 61.7, [83.2, 0, -2.4], [82.1, 0, -1.9]); L.push(A('pal1', t, w.p[0], 0, w.p[2], { walk: w.walk, expr: t < 61.82 ? 'grin' : 'shock', R: 'holdUp', propR: 'tickets', L: 'hang' })); L.push(A('pal2', t, w.p[0] + 0.7, 0, w.p[2] + 0.25, { walk: w.walk, expr: t < 61.82 ? 'smile' : 'angry', R: 'hold', L: t < 61.82 ? 'hang' : 'up' })); }
    }
    if (set === 'court') {
      L.push(A('judge', t, 105.0, 0.5, -3.05, { expr: [[62.6, 'stern'], [64.0, 'angry'], [64.6, 'stern'], [66.4, 'laugh']], R: [[62.6, 'hold'], [64.0, 'up'], [64.25, 'holdUp']], propR: 'gavel', L: 'hang', talk: [[63.6, 64.9]] }));
      const hit = t >= 66.36; L.push(A('nick', t, 106.8, 0, 0.0, { expr: t < 64.28 ? [[62.6, 'nervous'], [63.4, 'smirk']] : t < 66.36 ? [[64.28, 'shock'], [65.2, 'nervous'], [65.7, 'shock']] : 'shock', R: t < 64.28 ? 'hip' : hit ? 'up' : 'mouth', L: hit ? 'up' : 'hang', sq: hit ? Math.max(0, Math.sin((t - 66.36) * 12) * 0.12 * Math.exp(-(t - 66.36) * 4)) : 0 }));
      [['jur1', -3.4, -1.2], ['jur2', -2.6, -1.0], ['jur3', -3.4, -0.2], ['jur4', -2.6, 0.0]].forEach(([id, dx, dz], i) => L.push(A(id, t, 105 + dx, 0, dz, { expr: t < 64.28 ? 'think' : t < 66.36 ? 'shock' : 'laugh', R: t >= 66.36 ? 'up' : 'hang', L: t >= 64.28 && t < 66.36 ? 'mouth' : 'hang' })));
    }
    return L;
  };

  // TV screen texture in the living room: the live draw
  const scr = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 384; return c; })();
  const scrTex = new THREE.CanvasTexture(scr); scrTex.colorSpace = THREE.SRGBColorSpace; WORLD.screenTex = scrTex;
  const drawScreen = (t) => { const g = scr.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#2a3a8a'; g.fillRect(0, 0, 512, 384); g.fillStyle = '#c62f36'; g.fillRect(24, 20, 464, 70); g.fillStyle = '#fff'; g.font = '54px "Lilita One", Impact'; g.textAlign = 'center'; g.fillText('DAILY NUMBER', 256, 74);
    g.save(); g.translate(256, 470); g.scale(0.55, 0.55); rick(g, C.nick, { expr: talkAt(t, [[13.2, 15]]) ? 'grin' : 'smile', talk: talkAt(t, [[13.2, 15]]), L: 'hip', R: 'wave', blink: blinkAt(t, 1) }); g.restore();
    g.fillStyle = '#f4d35e'; g.font = '30px "Lilita One", Impact'; g.fillText('LIVE', 452, 360); g.fillStyle = 'rgba(255,255,255,.07)'; for (let y = 0; y < 384; y += 6) g.fillRect(0, y, 512, 2); scrTex.needsUpdate = true; };

  // ---------- captions (1–2 words, Lilita One, white with black outline, y≈1300) ----------
  const CAPS = (() => { const out = []; const W = window.WORDS; for (let i = 0; i < W.length;) { const a = W[i], b = W[i + 1]; const clean = (s) => s.replace(/,(?!\d)/g, '').replace(/\.$/, '').toUpperCase(); const short = (s) => clean(s).length <= 4; if (b && short(a[0]) && clean(a[0] + b[0]).length <= 11 && !/[.?!,]$/.test(a[0]) && b[1] - a[2] < 0.25) { out.push({ t: a[1], txt: clean(a[0]) + ' ' + clean(b[0]) }); i += 2; } else { out.push({ t: a[1], txt: clean(a[0]) }); i += 1; } } out.forEach((c, k) => { c.e = k + 1 < out.length ? out[k + 1].t : END; }); return out; })();
  const drawCaption = (g, t, W, H) => {
    const c = CAPS.find((c) => t >= c.t && t < c.e && t < c.t + 1.2); if (!c) return;
    const u = clamp((t - c.t) / 0.09), s = 0.88 + 0.12 * eout(u); const fs = Math.round(122 * W / 1080);
    g.save(); g.translate(W / 2, H * 1300 / 1920); g.scale(s, s); g.font = `${fs}px "Lilita One", Impact, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    let f = 1; const mw = g.measureText(c.txt).width; if (mw > W * 0.86) f = W * 0.86 / mw; g.scale(f, f);
    g.lineJoin = 'round'; g.lineWidth = fs * 0.2; g.strokeStyle = '#000'; g.strokeText(c.txt, 0, 0); g.fillStyle = '#fff'; g.fillText(c.txt, 0, 0); g.restore();
  };

  const SETSTATE = { studio: studioState, workshop: workshopState, street: streetState, living: livingState, classroom: classState, bookie: bookieState, court: courtState };
  const frame = (f) => {
    const t = f / FPS, C = camAt(t);
    SETSTATE[C.set](t);
    if (C.set === 'living') drawScreen(t);
    const L = { ...LIGHT[C.set] };
    let flash = 0; if (t >= 47.98 + 0.32 - 0.3 && t < 48.25) flash = 0.35 * (1 - ramp(t, 47.98, 48.25));
    return { t, cam: C, light: L, dof: dofAt(C), actors: actors(t, C.set), whip: C.whip, flash };
  };
  const SHOTS = []; K.forEach((k, i) => { if (!i || K[i - 1].set !== k.set) SHOTS.push({ t: k.t, set: k.set }); });
  return { FPS, END, TOTAL, frame, drawCaption, K, SHOTS, CAPS };
})();
