// Sets for "The Lottery That Drew 666". Every prop, particle and sign is real 3D geometry with the ink outline; only characters are 2D cards.
// Set origins (x): STUDIO 0, WORKSHOP -20, CLASSROOM -45, STREET 30, LIVING 55, BOOKIE 80, COURT 105.
window.WORLD = (() => {
  const E = ENGINE, { add, box, tbox, group, sign, col, toon, texM, label, scene } = E;
  const R = PAINT.rng(2026);
  const eout = (u) => 1 - Math.pow(1 - Math.max(0, Math.min(1, u)), 3);
  const Wd = {};
  const cyl = (rt, rb, h, n = 20) => new THREE.CylinderGeometry(rt, rb, h, n);
  const sph = (r, a = 20, b = 14) => new THREE.SphereGeometry(r, a, b);
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };

  // ---------- painted textures ----------
  const tiles = (a, b, n = 8) => { const [c, g] = cv(512, 512); const s = 512 / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? a : b; g.fillRect(i * s, j * s, s, s); g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 3; g.strokeRect(i * s, j * s, s, s); } const r = PAINT.rng(n); for (let k = 0; k < 300; k++) { g.fillStyle = `rgba(255,255,255,${r() * .08})`; g.fillRect(r() * 512, r() * 512, 2 + r() * 6, 1 + r() * 3); } return c; };
  const stripesTex = (a, b, n = 10) => { const [c, g] = cv(512, 512); for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? a : b; g.fillRect(i * 512 / n, 0, 512 / n, 512); } const r = PAINT.rng(7); for (let k = 0; k < 90; k++) { g.fillStyle = `rgba(255,255,255,${0.05 + r() * 0.08})`; g.beginPath(); g.arc(r() * 512, r() * 512, 5 + r() * 9, 0, 7); g.fill(); } return c; };
  const curtain = (base) => { const [c, g] = cv(512, 512); for (let x = 0; x < 512; x++) { const k = 0.72 + 0.28 * Math.pow(Math.abs(Math.sin(x / 512 * Math.PI * 9)), 0.6); g.fillStyle = `rgb(${base.map((v) => Math.round(v * k)).join(',')})`; g.fillRect(x, 0, 1, 512); } return c; };
  const asphalt = () => { const [c, g] = cv(512, 512); g.fillStyle = '#5d6168'; g.fillRect(0, 0, 512, 512); const r = PAINT.rng(5); for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${r() < .5 ? '30,30,36' : '150,150,160'},${r() * .35})`; g.fillRect(r() * 512, r() * 512, 2, 2); } for (let i = 0; i < 6; i++) { g.strokeStyle = 'rgba(30,30,34,.5)'; g.lineWidth = 2; g.beginPath(); let x = r() * 512, y = r() * 512; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += r() * 40 - 20; y += r() * 40 - 20; g.lineTo(x, y); } g.stroke(); } return c; };
  const bricks = (hue = 8) => PAINT.stone(31, hue, 48, 50, 96, 40);
  const panel = () => { const [c, g] = cv(512, 512); g.fillStyle = '#7a4a2a'; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 4; i++) { g.fillStyle = '#8a5734'; g.fillRect(i * 128 + 14, 20, 100, 472); g.strokeStyle = '#4e2e1a'; g.lineWidth = 6; g.strokeRect(i * 128 + 14, 20, 100, 472); } return c; };
  const wallpaper = (a, b) => { const [c, g] = cv(512, 512); g.fillStyle = a; g.fillRect(0, 0, 512, 512); g.fillStyle = b; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.beginPath(); const x = i * 64 + (j % 2) * 32 + 16, y = j * 64 + 32; g.moveTo(x, y - 12); g.lineTo(x + 9, y); g.lineTo(x, y + 12); g.lineTo(x - 9, y); g.fill(); } return c; };
  const rug = () => { const [c, g] = cv(512, 512); g.fillStyle = '#a8383a'; g.fillRect(0, 0, 512, 512); g.strokeStyle = '#f0c75e'; g.lineWidth = 16; g.strokeRect(30, 30, 452, 452); g.strokeStyle = '#2c4a7a'; g.lineWidth = 10; g.strokeRect(70, 70, 372, 372); g.fillStyle = '#f0c75e'; g.beginPath(); g.ellipse(256, 256, 90, 60, 0, 0, 7); g.fill(); return c; };
  const M = {
    studioFloor: texM(tiles('#2a5fae', '#e9eef6'), 4, 3), stage: texM(PAINT.planks(3), 2, 2, '#ffd9a8'),
    curtainBlue: texM(curtain([48, 70, 160]), 3, 1), curtainRed: texM(curtain([190, 40, 52]), 2, 1),
    planks: texM(PAINT.planks(1), 2, 2), plaster: texM(PAINT.plaster(8), 1, 1, '#f3e3c0'),
    brick: texM(bricks(10), 1, 1), brick2: texM(bricks(28), 1, 1, '#ffe6c8'), asphalt: texM(asphalt(), 6, 3), walk: texM(tiles('#c9c3b8', '#d8d2c6', 6), 8, 1),
    panel: texM(panel(), 2, 1), paperA: texM(wallpaper('#e7d7a8', '#c99a58'), 3, 2), paperB: texM(wallpaper('#bfe0d6', '#7fb3a8'), 3, 2), rug: texM(rug()),
    green: texM(stripesTex('#2f6b4f', '#2a604a', 2), 1, 1), lino: texM(tiles('#d9c9a3', '#b9a57d', 8), 3, 3), roof: texM(PAINT.roof(9), 2, 2),
    glass: new THREE.MeshPhongMaterial({ color: '#cfe9ff', transparent: true, opacity: 0.18, shininess: 90, depthWrite: false, side: THREE.DoubleSide }),
    beam: new THREE.MeshBasicMaterial({ color: '#fff3c4', transparent: true, opacity: 0.09, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
  };
  Wd.M = M;

  // ---------- reusable props ----------
  const ballTex = {};
  const ballTexFor = (d) => ballTex[d] || (ballTex[d] = (() => { const [c, g] = cv(256, 128); g.fillStyle = '#fbfaf4'; g.fillRect(0, 0, 256, 128); g.fillStyle = '#c62f36'; g.fillRect(0, 54, 256, 20); for (const x of [64, 192]) { g.fillStyle = '#fbfaf4'; g.beginPath(); g.arc(x, 64, 34, 0, 7); g.fill(); g.strokeStyle = '#2b1f1c'; g.lineWidth = 5; g.stroke(); g.fillStyle = '#2b1f1c'; g.font = 'bold 50px "Lilita One", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(d), x, 67); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })());
  const ballMat = (d) => toon({ map: ballTexFor(d) });
  Wd.ball = (d, r = 0.08, parent = scene) => { const m = add(sph(r, 22, 16), ballMat(d), 0, 0, 0, parent); m.rotation.y = -Math.PI / 2; m.userData.digit = d; return m; };
  // glass ball machine: frame + glass + tube + cup + 10 balls
  Wd.machine = (parent, x, y, z) => {
    const g = group(x, y, z, parent), w = 1.15, h = 1.25, d = 0.85;
    add(tbox(w + 0.16, 0.14, d + 0.16), '#d8dde6', 0, 0.07, 0, g);
    add(tbox(w + 0.12, 0.08, d + 0.12), '#c8323a', 0, h + 0.18, 0, g);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(box(0.05, h, 0.05), '#e6c25a', sx * w / 2, h / 2 + 0.14, sz * d / 2, g);
    for (const yy of [0.15, h + 0.13]) for (const sz of [-1, 1]) add(box(w, 0.04, 0.04), '#e6c25a', 0, yy, sz * d / 2, g);
    const gl = add(box(w, h, d), M.glass, 0, h / 2 + 0.14, 0, g, { noink: true, cast: false }); gl.renderOrder = 5;
    const tube = add(cyl(0.1, 0.1, 0.9, 18, 1), M.glass, w / 2 - 0.2, h + 0.65, 0, g, { noink: true, cast: false }); tube.renderOrder = 5;
    for (const yy of [h + 0.25, h + 0.65, h + 1.05]) { const ring = add(new THREE.TorusGeometry(0.105, 0.018, 8, 22), '#e6c25a', w / 2 - 0.2, yy, 0, g); ring.rotation.x = Math.PI / 2; }
    const cup = add(cyl(0.14, 0.09, 0.08, 20), '#c8323a', w / 2 - 0.2, h + 1.12, 0, g);
    const vent = add(cyl(0.16, 0.2, 0.1, 18), '#7f8896', 0, 0.2, 0, g);
    const balls = []; for (let i = 0; i < 10; i++) balls.push(Wd.ball(i, 0.075, g));
    const puffs = [];
    return { g, w, h, d, balls, puffs, tubeX: w / 2 - 0.2, cupY: h + 1.2, base: 0.26 };
  };
  // ball physics-ish: deterministic bounce in the drum; air 0..1; heavy balls barely move
  Wd.runMachine = (mc, t, air, heavy, picks) => {
    mc.balls.forEach((b, i) => {
      const ph = i * 1.7 + mc.g.position.x, light = !heavy(i), a = air * (light ? 1 : 0.06);
      const fx = Math.sin(t * (2.1 + i * 0.13) + ph) * 0.42, fz = Math.sin(t * (1.7 + i * 0.11) + ph * 1.3) * 0.28;
      const bounce = Math.abs(Math.sin(t * (3.2 + i * 0.21) + ph * 0.7));
      let x = fx * (0.3 + 0.7 * Math.min(1, a * 3)), y = mc.base + 0.08 + bounce * 0.9 * a + (light ? 0 : 0.0), z = fz * (0.3 + 0.7 * Math.min(1, a * 3));
      if (!light || a < 0.02) { const k = i % 5, row = (i / 5) | 0; x = -0.4 + k * 0.2 + Math.sin(t * 9 + i) * 0.006 * air; z = -0.15 + row * 0.22; y = mc.base + 0.08 + (row ? 0.0 : 0) + Math.abs(Math.sin(t * 11 + i)) * 0.012 * air; }
      const pk = picks && picks.find((p) => p.d === i && t >= p.t);
      if (pk) { const u = Math.min(1, (t - pk.t) / 0.32), e = 1 - Math.pow(1 - u, 3); const tx = mc.tubeX, ty = mc.cupY; x = x + (tx - x) * e; z = z * (1 - e); y = y + (ty - y) * e; if (u >= 1) y = ty + Math.sin((t - pk.t - 0.32) * 18) * 0.012 * Math.exp(-(t - pk.t - 0.32) * 4); }
      b.position.set(x, y, z); b.rotation.set(t * (1 + i * 0.3) * a * 4, -Math.PI / 2 + t * a * 3, 0);
      b.scale.setScalar(1);
      if (pk && t - pk.t > 0.32) { const g = eout((t - pk.t - 0.32) / 0.15); b.rotation.set(0, -Math.PI / 2 + 0.25, 0); b.scale.setScalar(1 + g * 0.9); b.position.y += g * 0.07; }
    });
    mc.puffs.forEach((p, k) => { const u = ((t * 1.6 + k / mc.puffs.length) % 1); p.visible = air > 0.05; p.position.set(Math.sin(k * 2.3) * 0.25 * u, mc.base + u * 0.9 * air, Math.cos(k * 1.7) * 0.2 * u); p.scale.setScalar((0.4 + u * 1.4) * (1 - u) * 1.6); });
  };
  // studio TV camera on a tripod (foreground parallax piece)
  const tvCam = (parent, x, z, ry) => {
    const g = group(x, 0, z, parent); g.rotation.y = ry;
    for (let k = 0; k < 3; k++) { const a = k * 2.094; const leg = add(cyl(0.025, 0.03, 1.4, 8), '#3b3f4a', Math.cos(a) * 0.3, 0.65, Math.sin(a) * 0.3, g); leg.rotation.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25); }
    add(box(0.42, 0.36, 0.7), '#4a5466', 0, 1.45, 0, g); add(cyl(0.13, 0.15, 0.4, 18), '#2b2f38', 0, 1.45, 0.52, g).rotation.x = Math.PI / 2;
    add(box(0.3, 0.2, 0.22), '#c8323a', 0, 1.74, -0.1, g); const tally = add(sph(0.035), toon({ color: '#ff2b2b', emissive: '#ff2b2b', emissiveIntensity: 0.6 }), 0.12, 1.66, 0.36, g);
    add(cyl(0.03, 0.03, 0.6, 8), '#2b2f38', -0.28, 1.4, -0.5, g).rotation.x = 1.0;
    sign(g, ['WPXI'], 0.215, 1.45, 0, 0.36, 0.18, { ry: Math.PI / 2, bg: '#f4d35e', d: 0.01 });
    return { g, tally };
  };
  const lamp = (parent, x, y, z, c = '#f2c14e') => { const g = group(x, y, z, parent); add(cyl(0.012, 0.012, 0.6, 6), '#2b2f38', 0, 0.3, 0, g); add(cyl(0.06, 0.22, 0.2, 18, 1, true), c, 0, 0, 0, g); add(sph(0.06), toon({ color: '#fff6c8', emissive: '#fff2b0', emissiveIntensity: 1 }), 0, -0.05, 0, g); return g; };
  const chair = (parent, x, z, ry = 0, c = '#8a5734') => { const g = group(x, 0, z, parent); g.rotation.y = ry; add(tbox(0.45, 0.06, 0.45), c, 0, 0.46, 0, g); for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(box(0.05, 0.46, 0.05), c, sx * 0.19, 0.23, sz * 0.19, g); add(tbox(0.45, 0.5, 0.05), c, 0, 0.74, -0.2, g); return g; };
  const crate = (parent, x, y, z, s = 0.5, c = '#b07a45', txt = null) => { const g = group(x, y, z, parent); add(tbox(s, s, s, 1), texM(PAINT.planks(5), 1, 1, c), 0, s / 2, 0, g); if (txt) sign(g, [txt], 0, s / 2, s / 2 + 0.01, s * 0.8, s * 0.35, { d: 0.01, bg: '#efe3c4' }); return g; };
  const pigeon = (parent, x, z) => { const g = group(x, 0, z, parent); add(sph(0.09, 12, 10), '#8d93a3', 0, 0.1, 0, g).scale.set(1.3, 0.9, 0.9); const head = add(sph(0.05, 10, 8), '#6f7790', 0.1, 0.19, 0, g); add(new THREE.ConeGeometry(0.015, 0.04, 6), '#e6a23c', 0.15, 0.19, 0, g).rotation.z = -Math.PI / 2; return { g, head }; };
  const tree = (parent, x, z, h = 3) => { const g = group(x, 0, z, parent); add(cyl(0.12, 0.18, h, 8), '#6a4a32', 0, h / 2, 0, g); for (let k = 0; k < 4; k++) add(sph(0.8 + R() * 0.4, 14, 10), k % 2 ? '#5f9a3c' : '#6fae45', (R() - 0.5) * 1, h + (R() - 0.3) * 0.8, (R() - 0.5) * 1, g); return g; };
  Wd.paperBits = (parent, n, cols, size = [0.12, 0.06]) => { const out = []; for (let i = 0; i < n; i++) { const m = add(box(size[0], 0.005, size[1]), cols[i % cols.length], 0, -50, 0, parent, { cast: false }); out.push(m); } return out; };
  const flag = (parent, x, y, z, c1, c2) => { const g = group(x, y, z, parent); add(cyl(0.02, 0.02, 2.2, 8), '#c9a24a', 0, 1.1, 0, g); add(sph(0.05), '#e6c25a', 0, 2.22, 0, g); const cloth = add(new THREE.PlaneGeometry(0.8, 0.55, 8, 4), toon({ color: c1, side: THREE.DoubleSide }), 0.42, 1.85, 0, g); cloth.userData.base = cloth.geometry.attributes.position.array.slice(); return cloth; };
  Wd.wave = (cloth, t, amp = 0.05) => { const p = cloth.geometry.attributes.position, b = cloth.userData.base; for (let i = 0; i < p.count; i++) { const x = b[i * 3]; p.setZ(i, Math.sin(t * 4 + x * 6) * amp * (x + 0.4)); } p.needsUpdate = true; cloth.geometry.computeVertexNormals(); };
  const fan = (parent, x, y, z) => { const g = group(x, y, z, parent); add(cyl(0.015, 0.015, 0.4, 6), '#3b3f4a', 0, -0.2, 0, g); add(cyl(0.08, 0.08, 0.1, 12), '#d8c08a', 0, -0.42, 0, g); const rot = group(0, -0.48, 0, g); for (let k = 0; k < 4; k++) { const b = add(box(0.55, 0.012, 0.12), '#8a5734', 0.3, 0, 0, rot); b.parent.remove(b); const arm = group(0, 0, 0, rot); arm.rotation.y = k * Math.PI / 2; arm.add(b); b.position.set(0.32, 0, 0); b.rotation.x = 0.2; } return rot; };
  const clock = (parent, x, y, z, ry = 0) => { const g = group(x, y, z, parent); g.rotation.y = ry; const face = add(cyl(0.22, 0.22, 0.05, 28), '#fbfaf4', 0, 0, 0, g); face.rotation.x = Math.PI / 2; const rim = add(new THREE.TorusGeometry(0.22, 0.03, 8, 28), '#8a5734', 0, 0, 0.0, g); const hm = group(0, 0, 0.04, g), mm = group(0, 0, 0.045, g); add(box(0.025, 0.12, 0.01), '#2b1f1c', 0, 0.05, 0, hm); add(box(0.018, 0.18, 0.01), '#2b1f1c', 0, 0.08, 0, mm); return { hm, mm }; };
  const smoke = (parent, n, c = '#e9e6ee') => { const out = []; for (let i = 0; i < n; i++) out.push(add(sph(0.06, 10, 8), c, 0, -50, 0, parent, { cast: false })); return out; };
  Wd.runSmoke = (ps, t, ox, oy, oz, rise = 0.8, spread = 0.12, rate = 0.6) => ps.forEach((p, k) => { const u = (t * rate + k / ps.length) % 1; p.position.set(ox + Math.sin(k * 3.1 + t) * spread * u, oy + u * rise, oz + Math.cos(k * 2.3) * spread * u); p.scale.setScalar(0.4 + u * 1.6); p.visible = u < 0.92; });

  // ================= STUDIO (x = 0) =================
  const ST = group(0, 0, 0); Wd.studio = ST;
  add(tbox(16, 0.1, 12, 4), M.studioFloor, 0, -0.05, 0, ST, { cast: false });
  add(tbox(9, 0.22, 4.2, 2), M.stage, 0, 0.11, -3.2, ST);
  for (let k = 0; k < 7; k++) add(box(0.5, 0.03, 0.04), toon({ color: '#ffe9a0', emissive: '#ffd860', emissiveIntensity: 0.5 }), -3.6 + k * 1.2, 0.2, -1.08, ST);
  add(tbox(16, 7, 0.3, 3), M.curtainBlue, 0, 3.5, -5.6, ST);
  for (const sx of [-1, 1]) { const w = add(tbox(0.3, 7, 12, 3), M.curtainBlue, sx * 8, 3.5, 0, ST); }
  // big lit sign + results board
  Wd.bigSign = sign(ST, [{ t: 'DAILY NUMBER', c: '#ffffff' }], 0, 4.55, -5.35, 6.4, 1.3, { bg: '#c62f36', border: '#f4d35e', bulbs: true, frame: '#f4d35e', d: 0.18 });
  sign(ST, [{ t: 'PENNSYLVANIA LOTTERY', c: '#2b1f1c' }], 0, 3.65, -5.38, 4.2, 0.45, { bg: '#f4d35e', border: null, d: 0.06 });
  const digitTex = {}; const digitFor = (d, red) => { const k = d + (red ? 'r' : ''); return digitTex[k] || (digitTex[k] = label([{ t: d === '' ? '' : String(d), c: red ? '#ffefe0' : '#2b1f1c' }], { w: 256, h: 320, bg: red ? '#d42a32' : '#f7f2e4', border: '#2b1f1c', pad: 18 })); };
  Wd.board = [-1.15, 0, 1.15].map((x) => { const s = sign(ST, [''], x, 2.55, -5.35, 0.95, 1.15, { bg: '#f7f2e4', d: 0.12, frame: '#3b3f4a' }); return s; });
  Wd.setBoard = (vals, red) => Wd.board.forEach((s, i) => { s.userData.face.map = digitFor(vals[i] ?? '', red); });
  // bulbs strip around the board (3D, chase-animated)
  Wd.bulbs = []; for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; const m = add(sph(0.06, 10, 8), toon({ color: '#ffe9a0', emissive: '#ffcf4a', emissiveIntensity: 0.2 }), Math.cos(a) * 2.2, 2.55 + Math.sin(a) * 0.95, -5.25, ST, { cast: false }); Wd.bulbs.push(m); }
  // counter + machines
  add(tbox(6.4, 1.0, 1.1, 2), '#2f4f8f', 0, 0.72, -3.0, ST); add(tbox(6.6, 0.08, 1.25, 2), '#f4d35e', 0, 1.25, -3.0, ST);
  for (let k = 0; k < 6; k++) add(box(0.7, 0.55, 0.02), '#f7f2e4', -2.6 + k * 1.04, 0.72, -2.44, ST);
  Wd.machines = [-2.1, 0, 2.1].map((x) => Wd.machine(ST, x, 1.29, -3.0));
  // air switch
  const sw = group(3.0, 1.29, -2.75, ST); add(box(0.3, 0.25, 0.25), '#3b3f4a', 0, 0.12, 0, sw); Wd.lever = group(0, 0.25, 0, sw); add(cyl(0.02, 0.02, 0.3, 8), '#b6bec7', 0, 0.15, 0, Wd.lever); add(sph(0.05), '#d42a32', 0, 0.3, 0, Wd.lever);
  sign(sw, ['AIR'], 0, 0.12, 0.13, 0.22, 0.1, { d: 0.01, bg: '#f4d35e' });
  // host podium
  const pod = group(3.7, 0.22, -1.6, ST); add(tbox(0.9, 0.78, 0.6), '#c62f36', 0, 0.39, 0, pod); add(tbox(1.0, 0.06, 0.7), '#f4d35e', 0, 0.81, 0, pod);
  sign(pod, ['DAILY', '#'], 0, 0.42, 0.31, 0.5, 0.5, { d: 0.02, bg: '#f7f2e4' }); Wd.podium = pod;
  // cameras, truss, lights
  Wd.cams = [tvCam(ST, -3.4, 2.6, Math.PI + 0.35), tvCam(ST, 2.4, 3.4, Math.PI - 0.2), tvCam(ST, 5.6, 0.5, Math.PI - 0.9)];
  for (const z of [-4.5, -1.5, 1.5]) add(box(15, 0.16, 0.16), '#7f8896', 0, 6.2, z, ST);
  for (let x = -6; x <= 6; x += 3) add(box(0.16, 0.16, 6.2), '#7f8896', x, 6.2, -1.5, ST);
  Wd.spots = []; for (let i = 0; i < 5; i++) { const x = -5 + i * 2.5; const g = group(x, 6.05, -1.5, ST); add(cyl(0.18, 0.12, 0.4, 14), '#2b2f38', 0, -0.2, 0, g).rotation.x = 0.5; const cone = add(new THREE.ConeGeometry(1.4, 6, 24, 1, true), M.beam, 0, -3.2, 0, g, { noink: true, cast: false }); cone.renderOrder = 6; Wd.spots.push(g); }
  // cables on floor (foreground), sandbags, stars on curtains
  for (let i = 0; i < 4; i++) { const pts = []; for (let k = 0; k < 8; k++) pts.push(new THREE.Vector3(-6 + i * 3 + Math.sin(k + i) * 0.6, 0.02, 4.5 - k * 1.1)); add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.03, 6), '#2b2f38', 0, 0, 0, ST, { cast: false }); }
  const starShape = new THREE.Shape(); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 - Math.PI / 2, r = k % 2 ? 0.12 : 0.3; k ? starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r) : starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  Wd.stars = []; for (let i = 0; i < 16; i++) { const s = add(new THREE.ExtrudeGeometry(starShape, { depth: 0.05, bevelEnabled: false }), i % 3 ? '#f4d35e' : '#ffffff', -7 + R() * 14, 1.8 + R() * 3.6, -5.4, ST, { cast: false }); Wd.stars.push(s); if (Math.abs(s.position.x) < 3.6 && s.position.y > 1.8) s.position.x += s.position.x < 0 ? -3.6 : 3.6; }
  // calendar + keystone sign on the side wall
  Wd.cal1980 = sign(ST, [{ t: 'APRIL', c: '#c62f36' }, '1980'], -7.82, 2.6, -2.6, 1.0, 1.1, { ry: Math.PI / 2, bg: '#fbfaf4' });
  sign(ST, [{ t: 'ON AIR', c: '#ffffff' }], 6.2, 3.4, -5.3, 1.4, 0.5, { bg: '#d42a32', frame: '#2b2f38' });
  // confetti (3D paper bits)
  Wd.confetti = Wd.paperBits(ST, 90, ['#f4d35e', '#d42a32', '#2a5fae', '#3fa39a', '#ffffff'], [0.07, 0.05]);
  // 3D question mark
  { const q = group(4.6, 2.1, -1.4, ST); const arc = add(new THREE.TorusGeometry(0.28, 0.08, 10, 24, Math.PI * 1.4), '#f4d35e', 0, 0.3, 0, q); arc.rotation.z = -Math.PI * 0.45; add(cyl(0.08, 0.08, 0.3, 12), '#f4d35e', 0, -0.05, 0, q); add(sph(0.09), '#f4d35e', 0, -0.4, 0, q); Wd.qmark = q; q.visible = false; }
  // audience bleachers silhouettes (3D blocks) at the back-right
  for (let i = 0; i < 6; i++) add(tbox(0.6, 0.45 + (i % 3) * 0.1, 0.6), ['#e07a5f', '#3d5a80', '#81b29a', '#f2cc8f'][i % 4], -6.2 + (i % 2) * 0.7, 0.25, 3.5 - i * 0.8, ST);

  // ================= WORKSHOP (x = -20) =================
  const WS = group(-20, 0, 0); Wd.workshop = WS;
  add(tbox(8, 0.1, 7, 2), M.planks, 0, -0.05, 0, WS, { cast: false });
  add(tbox(8, 3.4, 0.2, 2), M.paperA, 0, 1.7, -3.1, WS); add(tbox(0.2, 3.4, 7, 2), M.paperA, -3.9, 1.7, 0, WS); add(tbox(0.2, 3.4, 4, 2), M.paperA, 3.9, 1.7, -1.5, WS);
  add(tbox(8, 0.15, 0.25, 1), '#6a4a32', 0, 0.08, -2.95, WS);
  // bench
  add(tbox(4.6, 0.1, 0.9, 1), M.planks, -0.4, 0.95, -2.4, WS); for (const x of [-2.5, 1.7]) for (const z of [-2.75, -2.05]) add(box(0.08, 0.95, 0.08), '#6a4a32', x, 0.47, z, WS);
  add(tbox(4.4, 0.06, 0.7), '#8a5734', -0.4, 0.3, -2.4, WS);
  // pegboard + tools
  add(tbox(3, 1.3, 0.05, 1), '#c9a571', -0.6, 2.0, -2.98, WS);
  for (let i = 0; i < 6; i++) { const t = add(box(0.06, 0.4 + R() * 0.2, 0.03), ['#b6bec7', '#c62f36', '#2a5fae'][i % 3], -1.8 + i * 0.45, 2.0, -2.93, WS); t.rotation.z = (R() - 0.5) * 0.6; }
  // shelves with cans and boxes
  for (const y of [2.1, 2.7]) { add(tbox(1.6, 0.05, 0.35), '#6a4a32', 2.6, y, -2.85, WS); for (let i = 0; i < 4; i++) add(cyl(0.09, 0.09, 0.22, 14), ['#d42a32', '#f4d35e', '#3fa39a', '#ffffff'][(i + y * 10) % 4 | 0], 2.0 + i * 0.38, y + 0.14, -2.82, WS); }
  Wd.handsOff = sign(WS, [{ t: 'LOTTERY PROPERTY', c: '#c62f36' }, 'HANDS OFF'], -0.6, 2.95, -2.97, 1.8, 0.55, { bg: '#fbfaf4' });
  // bench props
  const prop = (x, txt, mk) => { const g = group(-20 + x, 1.0, -2.3); mk(g); if (txt) sign(g, [txt], 0, txt.y ?? 0.16, 0.13, 0.26, 0.1, { d: 0.005, bg: '#fbfaf4' }); return g; };
  Wd.powder = group(-22.3, 1.0, -2.25); add(cyl(0.1, 0.1, 0.32, 18), '#fbfaf4', 0, 0.16, 0, Wd.powder); add(cyl(0.1, 0.08, 0.06, 18), '#7fb3e0', 0, 0.35, 0, Wd.powder); sign(Wd.powder, ['BABY', 'POWDER'], 0, 0.16, 0.1, 0.18, 0.14, { d: 0.005, bg: '#bfe0f6' });
  Wd.sugar = group(-21.7, 1.0, -2.25); add(sph(0.2, 16, 12), '#efe3c4', 0, 0.18, 0, Wd.sugar).scale.set(0.9, 1.1, 0.7); sign(Wd.sugar, ['SUGAR'], 0, 0.18, 0.15, 0.24, 0.1, { d: 0.005, bg: '#fbfaf4' });
  Wd.vas = group(-21.1, 1.0, -2.25); add(cyl(0.11, 0.11, 0.16, 20), '#d9ecff', 0, 0.08, 0, Wd.vas); Wd.vasLid = add(cyl(0.115, 0.115, 0.05, 20), '#2a5fae', 0, 0.18, 0, Wd.vas); sign(Wd.vas, ['VASELINE'], 0, 0.08, 0.115, 0.2, 0.07, { d: 0.005, bg: '#2a5fae', fg: '#ffffff' });
  Wd.paint = group(-20.4, 1.0, -2.25); add(cyl(0.16, 0.16, 0.34, 22), '#c9ccd4', 0, 0.17, 0, Wd.paint); Wd.paintLid = add(cyl(0.165, 0.165, 0.03, 22), '#9aa0aa', 0, 0.355, 0, Wd.paint); add(new THREE.TorusGeometry(0.16, 0.012, 6, 22, Math.PI), '#7f8896', 0, 0.36, 0, Wd.paint); sign(Wd.paint, [{ t: 'WHITE', c: '#2b1f1c' }, { t: 'LATEX', c: '#c62f36' }], 0, 0.17, 0.162, 0.26, 0.2, { d: 0.005, bg: '#fbfaf4' });
  Wd.paintPool = add(cyl(0.14, 0.14, 0.01, 20), '#ffffff', 0, 0.33, 0, Wd.paint, { cast: false });
  // big syringe (3D)
  Wd.syringe = group(-18.6, 1.3, -2.0); { const s = Wd.syringe; const bar = add(cyl(0.032, 0.032, 0.3, 18), M.glass, 0, 0, 0, s, { noink: true }); bar.renderOrder = 6; Wd.fill = add(cyl(0.028, 0.028, 0.16, 14), '#fbfaf4', 0, -0.07, 0, s); add(cyl(0.029, 0.029, 0.025, 14), '#2b2f38', 0, 0.025, 0, s); for (let k = 0; k < 5; k++) add(box(0.012, 0.003, 0.003), '#2b2f38', 0.031, -0.12 + k * 0.05, 0, s, { cast: false }); add(new THREE.ConeGeometry(0.03, 0.04, 14), '#d8dde6', 0, -0.17, 0, s).rotation.x = Math.PI; add(cyl(0.0035, 0.0035, 0.16, 6), '#c9ced6', 0, -0.27, 0, s); add(box(0.13, 0.012, 0.04), '#d8dde6', 0, 0.15, 0, s); Wd.plunger = group(0, 0.2, 0, s); add(cyl(0.008, 0.008, 0.2, 8), '#d8dde6', 0, -0.02, 0, Wd.plunger); add(cyl(0.035, 0.035, 0.012, 16), '#d8dde6', 0, 0.08, 0, Wd.plunger); s.scale.setScalar(1.25); }
  Wd.drop = add(sph(0.025, 10, 8), '#ffffff', 0, -50, 0, scene, { cast: false });
  // tray of balls 0-9 on the bench
  Wd.tray = group(-19.2, 1.0, -1.95); add(tbox(1.3, 0.04, 0.35), '#3b3f4a', 0, 0.02, 0, Wd.tray); Wd.trayBalls = []; for (let i = 0; i < 10; i++) { const b = Wd.ball(i, 0.055, Wd.tray); b.position.set(-0.56 + i * 0.125, 0.1, 0); Wd.trayBalls.push(b); }
  // desk fan + float ball, scale, lamp, coffee + steam, clock, moth
  Wd.fan = group(-18.0, 1.0, -2.3); { add(cyl(0.1, 0.12, 0.05, 16), '#2a5fae', 0, 0.03, 0, Wd.fan); add(cyl(0.02, 0.02, 0.25, 8), '#2a5fae', 0, 0.15, 0, Wd.fan); const cage = add(new THREE.TorusGeometry(0.17, 0.012, 6, 24), '#b6bec7', 0, 0.32, 0, Wd.fan); cage.rotation.x = Math.PI / 2; Wd.fanBlades = group(0, 0.32, 0, Wd.fan); Wd.fanBlades.rotation.x = -Math.PI / 2; for (let k = 0; k < 3; k++) { const b = add(box(0.14, 0.01, 0.06), '#f4d35e', 0, 0, 0, Wd.fanBlades); b.position.set(Math.cos(k * 2.09) * 0.08, 0, Math.sin(k * 2.09) * 0.08); b.rotation.y = -k * 2.09; } }
  Wd.floatBall = Wd.ball(4, 0.07, scene); Wd.heavyBall = Wd.ball(2, 0.07, scene);
  Wd.lampW = lamp(scene, -21.0, 2.2, -2.2); Wd.mug = group(-18.4, 1.0, -2.7); add(cyl(0.06, 0.05, 0.12, 14), '#d42a32', 0, 0.06, 0, Wd.mug); Wd.steam = smoke(scene, 6, '#f4f4f8');
  Wd.clockW = clock(WS, 1.8, 2.7, -2.98); Wd.moth = add(sph(0.025, 8, 6), '#8a7a6a', 0, -50, 0, scene, { cast: false });
  Wd.puffs = smoke(scene, 14, '#ffffff'); Wd.sugarBits = []; for (let i = 0; i < 30; i++) Wd.sugarBits.push(add(box(0.02, 0.02, 0.02), '#ffffff', 0, -50, 0, scene, { cast: false }));
  // foreground: stacked crates, chair, hanging bulb
  crate(WS, 2.8, 0, 1.4, 0.6, '#b07a45', 'BALLS'); crate(WS, 2.8, 0.6, 1.4, 0.45, '#a86a3a'); crate(WS, -3.0, 0, 1.8, 0.55, '#b07a45', 'SPARE');
  chair(WS, 0.3, -1.3, Math.PI, '#6a4a32'); Wd.bulbW = lamp(scene, -19.4, 3.0, 0.6, '#3fa39a');

  // ================= CLASSROOM (x = -45) =================
  const CL = group(-45, 0, 0); Wd.classroom = CL;
  add(tbox(9, 0.1, 9, 3), M.lino, 0, -0.05, 0, CL, { cast: false });
  add(tbox(9, 3.6, 0.2, 2), M.paperB, 0, 1.8, -4.1, CL); add(tbox(0.2, 3.6, 9, 2), M.paperB, -4.5, 1.8, 0, CL); add(tbox(0.2, 3.6, 9, 2), M.paperB, 4.5, 1.8, 0, CL);
  add(tbox(4.4, 1.6, 0.06), M.green, 0, 1.9, -3.95, CL); add(tbox(4.6, 0.1, 0.15), '#8a5734', 0, 1.05, -3.9, CL);
  sign(CL, [{ t: 'MATH TEST TODAY', c: '#ffffff' }, { t: '2 + 2 = ?', c: '#f4d35e' }], 0, 2.0, -3.9, 3.6, 1.2, { bg: '#2f6b4f', border: null, d: 0.01 });
  Wd.desks = []; for (let r_ = 0; r_ < 3; r_++) for (let c = 0; c < 3; c++) { const x = -2.4 + c * 2.4, z = -1.4 + r_ * 1.8; const g = group(x, 0, z, CL); add(tbox(1.0, 0.06, 0.6), '#c9a571', 0, 0.72, 0, g); for (const sx of [-1, 1]) add(box(0.05, 0.72, 0.5), '#7f8896', sx * 0.45, 0.36, 0, g); chair(g, 0, -0.55, 0, '#2a5fae'); Wd.desks.push(g); }
  Wd.tests = []; for (let i = 0; i < 12; i++) { const m = add(box(0.3, 0.004, 0.4), toon({ map: label([{ t: '100', c: '#d42a32' }, { t: 'A+', c: '#d42a32' }], { w: 256, h: 340, bg: '#fbfaf4', border: '#9aa0aa' }) }), 0, -50, 0, CL, { cast: false }); Wd.tests.push(m); }
  Wd.book = group(-45 + 0.28, 0.75, 0.32); { const b = Wd.book; add(tbox(0.4, 0.09, 0.3), '#2a5fae', 0, 0.045, 0, b); add(box(0.39, 0.075, 0.28), '#fbfaf4', 0.01, 0.045, 0, b); sign(b, ['NEVER', 'OPENED'], 0, 0.092, 0, 0.3, 0.16, { rx: -Math.PI / 2, d: 0.004, bg: '#f4d35e' }); add(box(0.06, 0.12, 0.33), '#b6bec7', -0.05, 0.05, 0, b); const lk = add(new THREE.TorusGeometry(0.04, 0.012, 6, 14, Math.PI), '#e6c25a', -0.05, 0.13, 0.17, b); for (let k = 0; k < 5; k++) { const w = add(cyl(0.002, 0.002, 0.25, 4), '#e8e8f0', 0.08 + k * 0.03, 0.12, -0.02, b, { cast: false }); w.rotation.z = 0.9 + k * 0.15; } }
  Wd.clockC = clock(CL, 3.0, 2.9, -3.98); Wd.fanC = fan(CL, 0, 3.6, 0.5); Wd.globe = group(-45 - 3.4, 1.0, -3.2); add(cyl(0.12, 0.16, 0.08, 14), '#8a5734', 0, 0.04, 0, Wd.globe); Wd.globeBall = add(sph(0.24, 20, 14), texM(stripesTex('#3f7fc4', '#62a85a', 6)), 0, 0.36, 0, Wd.globe); add(tbox(0.6, 1.0, 0.6), '#8a5734', 0, -0.5, 0, Wd.globe);
  Wd.plane = group(0, -50, 0); { const p = Wd.plane; add(new THREE.ConeGeometry(0.08, 0.3, 3), '#fbfaf4', 0, 0, 0, p).rotation.x = Math.PI / 2; }
  add(tbox(1.4, 0.8, 0.7), '#8a5734', 2.6, 0.4, -2.8, CL); add(sph(0.1), '#d42a32', 2.3, 0.88, -2.7, CL); sign(CL, ['NO', 'CHEATING'], -3.0, 2.6, -3.98, 1.0, 0.7, { bg: '#fbfaf4', fg: '#c62f36' });

  // ================= STREET (x = 30) =================
  const SR = group(30, 0, 0); Wd.street = SR;
  add(tbox(30, 0.1, 10, 3), M.asphalt, 0, -0.05, 2, SR, { cast: false }); add(tbox(30, 0.18, 3.2, 2), M.walk, 0, 0.09, -2.4, SR);
  for (let x = -14; x <= 14; x += 3) add(box(1.4, 0.01, 0.12), '#f4d35e', x, 0.005, 3.2, SR, { cast: false });
  const shop = (x, w, h, tex, awn, txt, txtCol = '#ffffff') => { const g = group(x, 0, -4.5, SR); add(tbox(w, h, 1.4, 2), tex, 0, h / 2, 0, g); add(tbox(w * 0.7, 1.4, 0.06), M.glass, 0, 1.3, 0.72, g, { noink: true }); add(box(w * 0.74, 0.08, 0.1), '#fbfaf4', 0, 2.04, 0.74, g); for (let k = 0; k < 6; k++) { const a = add(box(w / 6, 0.05, 0.9), k % 2 ? awn : '#ffffff', -w / 2 + w / 12 + k * w / 6, 2.6, 1.1, g); a.rotation.x = 0.35; } sign(g, [{ t: txt, c: txtCol }], 0, 3.05, 0.75, w * 0.8, 0.5, { bg: awn, border: '#2b1f1c' }); for (let k = 0; k < 2; k++) for (let j = 0; j < 2; j++) add(box(0.7, 0.8, 0.06), '#7fb3e0', -w / 4 + j * w / 2, h - 1.0 - k * 1.1, 0.72, g); return g; };
  Wd.newsShop = shop(-3, 4.2, 5.2, M.brick, '#2a5fae', 'CORNER NEWS');
  shop(2.2, 3.8, 4.4, M.brick2, '#c62f36', 'GROCERY'); shop(-8.2, 4, 6, M.brick2, '#3fa39a', 'DINER'); shop(7.0, 3.6, 5.6, M.brick, '#f4d35e', 'BARBER', '#2b1f1c');
  Wd.lottoSign = sign(SR, [{ t: 'LOTTERY', c: '#c62f36' }, 'TICKETS HERE'], -1.4, 1.5, -3.6, 0.9, 0.6, { ry: 0.3, bg: '#f4d35e' });
  Wd.calStreet = sign(SR, [{ t: 'APRIL', c: '#c62f36' }, '24'], -4.6, 1.9, -3.72, 0.6, 0.75, { bg: '#fbfaf4' });
  // newsstand counter in front of the shop
  add(tbox(1.6, 1.0, 0.6), '#2a5fae', -3, 0.5, -3.2, SR); add(tbox(1.7, 0.06, 0.7), '#f4d35e', -3, 1.03, -3.2, SR);
  for (let i = 0; i < 5; i++) add(box(0.3, 0.02, 0.4), ['#fbfaf4', '#f6c4d6', '#a8dcf0'][i % 3], -3.6 + i * 0.3, 1.07, -3.2, SR);
  Wd.ticketStack = []; for (let i = 0; i < 140; i++) { const m = add(box(0.26, 0.012, 0.14), ['#f6e27a', '#f6c4d6', '#a8dcf0'][i % 3], 0, -50, 0, SR, { cast: false }); Wd.ticketStack.push(m); }
  Wd.sign14k = sign(SR, [{ t: '14,000', c: '#c62f36' }, 'TICKETS'], 0.8, 0, -1.6, 0.9, 0.6, { bg: '#fbfaf4' });
  Wd.flyTickets = Wd.paperBits(SR, 40, ['#f6e27a', '#f6c4d6', '#a8dcf0'], [0.18, 0.1]);
  for (const x of [-11, -5.6, 4.6, 10]) { add(cyl(0.05, 0.07, 3.6, 10), '#2b2f38', x, 1.8, -1.2, SR); lamp(SR, x + 0.3, 3.5, -1.2, '#2b2f38'); }
  add(cyl(0.12, 0.14, 0.6, 12), '#d42a32', 3.6, 0.48, -1.3, SR); add(cyl(0.22, 0.2, 0.7, 14), '#7f8896', -6.6, 0.53, -1.4, SR);
  { const car = group(5.4, 0, 1.4, SR); add(tbox(3.2, 0.7, 1.5), '#3fa39a', 0, 0.6, 0, car); add(tbox(1.8, 0.55, 1.4), '#3fa39a', -0.2, 1.2, 0, car); add(box(1.7, 0.45, 1.42), '#bfe0f6', -0.2, 1.2, 0, car, { noink: false }); for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const w = add(cyl(0.3, 0.3, 0.2, 18), '#2b2f38', sx * 1.0, 0.3, sz * 0.75, car); w.rotation.x = Math.PI / 2; } add(box(0.1, 0.2, 1.2), '#f4d35e', 1.62, 0.65, 0, car); }
  for (const x of [-13, 12.5]) tree(SR, x, -2.4, 2.6);
  Wd.pigeons = [pigeon(SR, -1.8, -1.6), pigeon(SR, -0.9, -2.0), pigeon(SR, 1.4, -1.5)];
  // background buildings with TV-lit windows
  for (let i = 0; i < 9; i++) { const g = group(-14 + i * 3.6, 0, -8.5, SR); const h = 6 + R() * 5; add(tbox(3.4, h, 2, 2), i % 2 ? M.brick : M.brick2, 0, h / 2, 0, g); for (let k = 0; k < 6; k++) add(box(0.5, 0.6, 0.05), k % 3 ? '#7fb3e0' : '#bfe8ff', -1 + (k % 3), 2 + ((k / 3) | 0) * 1.6, 1.02, g); }
  Wd.chimney = smoke(scene, 8, '#d8d8e4');

  // ================= LIVING ROOM (x = 55) =================
  const LV = group(55, 0, 0); Wd.living = LV;
  add(tbox(7, 0.1, 6, 2), M.planks, 0, -0.05, 0, LV, { cast: false }); add(tbox(3.6, 0.02, 2.6), M.rug, 0.2, 0.01, 0.3, LV, { cast: false });
  add(tbox(7, 3.2, 0.2), M.paperA, 0, 1.6, -3.0, LV); add(tbox(0.2, 3.2, 6), M.paperA, -3.5, 1.6, 0, LV); add(tbox(0.2, 3.2, 6), M.paperA, 3.5, 1.6, 0, LV);
  // couch facing the TV (TV at x+2.6), family sits on it
  { const c = group(-1.2, 0, 0.6, LV); c.rotation.y = Math.PI / 2; add(tbox(2.4, 0.45, 0.9), '#e07a5f', 0, 0.3, 0, c); add(tbox(2.4, 0.6, 0.25), '#d0694f', 0, 0.75, -0.42, c); for (const s of [-1, 1]) add(tbox(0.25, 0.65, 0.9), '#d0694f', s * 1.25, 0.4, 0, c); }
  Wd.tv = group(2.6, 0, 0.6, LV); { const t = Wd.tv; t.rotation.y = -Math.PI / 2; add(tbox(1.2, 0.6, 0.6), '#8a5734', 0, 0.3, 0, t); add(tbox(1.1, 0.85, 0.7), '#6a4a32', 0, 1.05, 0, t); Wd.tvScreen = new THREE.MeshBasicMaterial({ map: label(['DAILY #', '- - -']) }); const s = add(new THREE.PlaneGeometry(0.85, 0.62), Wd.tvScreen, -0.05, 1.07, 0.36, t); s.userData.ndSkip = false; for (const k of [-1, 1]) add(cyl(0.008, 0.008, 0.6, 4), '#2b2f38', k * 0.2, 1.7, 0, t).rotation.z = k * 0.5; add(sph(0.03), '#c9a24a', 0.48, 0.8, 0.36, t); }
  Wd.tvGlow = new THREE.PointLight('#9fd0ff', 0, 5, 1.5); Wd.tvGlow.position.set(56.8, 1.2, 0.6); scene.add(Wd.tvGlow);
  lamp(LV, -2.8, 1.9, -2.4, '#f4d35e'); add(cyl(0.03, 0.03, 1.7, 8), '#8a5734', -2.8, 0.85, -2.4, LV);
  for (let i = 0; i < 3; i++) add(box(0.5, 0.6, 0.04), ['#3d5a80', '#81b29a', '#f2cc8f'][i], -1.4 + i * 0.9, 2.1, -2.88, LV);
  Wd.cat = group(1.0, 0, 1.8, LV); add(sph(0.16, 14, 10), '#e6a23c', 0, 0.16, 0, Wd.cat).scale.set(1.5, 0.9, 0.9); Wd.catHead = add(sph(0.1, 12, 10), '#e6a23c', 0.24, 0.28, 0, Wd.cat); Wd.catTail = add(cyl(0.025, 0.02, 0.35, 6), '#e6a23c', -0.28, 0.32, 0, Wd.cat);
  sign(LV, ['HOME SWEET', 'HOME'], 0.4, 2.3, -2.88, 1.0, 0.45, { bg: '#fbfaf4' }); Wd.clockL = clock(LV, -2.3, 2.5, -2.88);
  Wd.popcorn = []; for (let i = 0; i < 18; i++) Wd.popcorn.push(add(sph(0.025, 6, 5), '#fff6d0', 0, -50, 0, scene, { cast: false }));

  // ================= BOOKIE OFFICE (x = 80) =================
  const BK = group(80, 0, 0); Wd.bookie = BK;
  add(tbox(7, 0.1, 6, 2), M.planks, 0, -0.05, 0, BK, { cast: false });
  add(tbox(7, 3.4, 0.2, 2), M.panel, 0, 1.7, -3.0, BK); add(tbox(0.2, 3.4, 6, 2), M.panel, -3.5, 1.7, 0, BK); add(tbox(0.2, 3.4, 6, 2), M.panel, 3.5, 1.7, 0, BK);
  Wd.chalk = sign(BK, [{ t: '4-4-6  6-4-4', c: '#ffffff' }, { t: '6-6-4  4-6-6', c: '#ffffff' }, { t: '6-6-6  4-4-4', c: '#ffffff' }, { t: '4 & 6 ONLY?!', c: '#f4d35e' }], -0.6, 1.95, -2.88, 2.6, 1.6, { bg: '#2f3f3a', border: '#8a5734', d: 0.06 });
  { const d = group(0.6, 0, -0.6, BK); add(tbox(2.0, 0.08, 0.9), '#6a4a32', 0, 0.8, 0, d); add(tbox(1.9, 0.75, 0.8), '#5a3a24', 0, 0.38, 0, d); Wd.cashBox = group(0.5, 0.84, 0, d); add(tbox(0.4, 0.16, 0.28), '#2f6b4f', 0, 0.08, 0, Wd.cashBox); Wd.cashLid = group(0, 0.16, -0.14, Wd.cashBox); add(tbox(0.4, 0.03, 0.28), '#2f6b4f', 0, 0.015, 0.14, Wd.cashLid); Wd.cash = []; for (let i = 0; i < 6; i++) Wd.cash.push(add(box(0.16, 0.01, 0.08), '#8fbf6a', 0.4 + (i % 3) * 0.05, 0.14 + i * 0.012, (i % 2) * 0.05 - 0.02, Wd.cashBox)); for (let k = 0; k < 2; k++) { const ph = group(-0.6 + k * 0.4, 0.84, 0.1, d); add(tbox(0.22, 0.08, 0.16), k ? '#d42a32' : '#2b2f38', 0, 0.04, 0, ph); add(cyl(0.025, 0.025, 0.24, 8), k ? '#d42a32' : '#2b2f38', 0, 0.12, 0, ph).rotation.z = Math.PI / 2; if (!k) Wd.phone = ph; } }
  Wd.payoutSign = sign(BK, [{ t: 'PAYOUTS', c: '#2b1f1c' }, { t: 'OPEN', c: '#2f6b4f' }], 2.1, 2.1, -2.88, 1.1, 0.7, { bg: '#fbfaf4' });
  Wd.payoutClosed = label([{ t: 'PAYOUTS', c: '#2b1f1c' }, { t: 'CLOSED', c: '#c62f36' }], { w: 1024, h: 652, bg: '#fbfaf4' });
  Wd.fanB = fan(BK, 0, 3.4, 0); Wd.cigar = smoke(scene, 10, '#c9c4d4'); Wd.lampB = lamp(scene, 80.6, 2.4, -0.6, '#2f6b4f');
  for (let i = 0; i < 3; i++) add(box(0.9, 0.06, 0.05), '#d8c08a', 2.6, 1.5 + i * 0.25, -2.88, BK);
  sign(BK, ['SAL\'S', 'TOTALLY LEGAL'], -2.6, 2.6, -2.88, 1.2, 0.6, { bg: '#6b3c8f', fg: '#f4d35e' });

  // ================= COURTROOM (x = 105) =================
  const CT = group(105, 0, 0); Wd.court = CT;
  add(tbox(9, 0.1, 8, 3), M.planks, 0, -0.05, 0, CT, { cast: false });
  add(tbox(9, 4.2, 0.2, 2), M.panel, 0, 2.1, -3.6, CT); add(tbox(0.2, 4.2, 8, 2), M.panel, -4.5, 2.1, 0, CT); add(tbox(0.2, 4.2, 8, 2), M.panel, 4.5, 2.1, 0, CT);
  add(tbox(3.2, 1.3, 1.0), '#6a4a32', 0, 0.65, -2.6, CT); add(tbox(3.4, 0.08, 1.1), '#8a5734', 0, 1.34, -2.6, CT); add(tbox(3.2, 0.5, 1.2), '#5a3a24', 0, 0.25, -3.0, CT);
  sign(CT, [{ t: 'COURT', c: '#f4d35e' }], 0, 3.3, -3.45, 1.6, 0.55, { bg: '#5a3a24', border: '#f4d35e' });
  Wd.flags = [flag(CT, -2.2, 0, -3.2, '#2a5fae'), flag(CT, 2.2, 0, -3.2, '#c62f36')];
  // jury box (left), defendant table (right front), evidence machine
  add(tbox(2.6, 0.9, 0.2), '#6a4a32', -2.8, 0.45, 0.6, CT); add(tbox(0.2, 0.9, 2.6), '#6a4a32', -1.6, 0.45, -0.6, CT);
  add(tbox(1.6, 0.06, 0.8), '#8a5734', 1.8, 0.8, 0.4, CT); for (const sx of [-1, 1]) add(box(0.06, 0.8, 0.7), '#6a4a32', 1.8 + sx * 0.7, 0.4, 0.4, CT);
  Wd.exhibit = Wd.machine(CT, -0.9, 1.38, -2.6); Wd.exhibit.g.scale.setScalar(0.6);
  sign(CT, [{ t: 'EXHIBIT A', c: '#c62f36' }], -0.9, 1.05, -2.08, 0.7, 0.2, { bg: '#fbfaf4', d: 0.01 });
  Wd.sevenSign = sign(CT, [{ t: '7 YEARS', c: '#ffffff' }], 0, 4.6, -2.4, 1.6, 0.6, { bg: '#c62f36', border: '#f4d35e' });
  Wd.seven = Wd.ball(7, 0.14, scene); Wd.seven.position.set(0, -50, 0);
  Wd.rain = Wd.paperBits(CT, 120, ['#f6e27a', '#f6c4d6', '#a8dcf0', '#ffffff'], [0.16, 0.09]);
  Wd.fanCt = fan(CT, 1.5, 4.1, 1); Wd.dust = []; for (let i = 0; i < 30; i++) Wd.dust.push(add(sph(0.012, 6, 4), '#fff3c4', 0, -50, 0, scene, { cast: false }));
  for (let i = 0; i < 4; i++) { const b = group(-2.4 + i * 1.6, 0, 2.6, CT); add(tbox(1.3, 0.1, 0.5), '#8a5734', 0, 0.48, 0, b); add(tbox(1.3, 0.6, 0.08), '#8a5734', 0, 0.8, 0.22, b); for (const sx of [-1, 1]) add(box(0.06, 0.48, 0.4), '#6a4a32', sx * 0.6, 0.24, 0, b); }
  Wd.clockCt = clock(CT, 3.2, 3.3, -3.48);
  return Wd;
})();
