// "The Sinking Tower" (Gus). A detailed storybook street with solid ground. The ground only opens on the twist
// ("It's a swamp"), revealing the whole tower sunk in the mud. No text signs anywhere.
// Detail strategy: every floor's facade trim (frames, sills, shutters, flower boxes, balconies, awnings, cornices,
// stone corners) is merged into ONE vertex-coloured mesh per style, so 72 richly detailed floors stay cheap to draw.
window.WORLD = (() => {
  const E = ENGINE, { add, box, tbox, group, toon, texM, scene } = E;
  const Wd = {}; const R = PAINT.rng(9);
  const cyl = (rt, rb, h, n = 20, open = false, t0 = 0, tl = Math.PI * 2) => new THREE.CylinderGeometry(rt, rb, h, n, 1, open, t0, tl);
  const sph = (r, a = 16, b = 12) => new THREE.SphereGeometry(r, a, b);
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  const tex = (c, rx = 1, ry = 1) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; return t; };
  Wd.life = [];
  const H = 1.25, TW = 2.6, TD = 2.5, TZ = -1.05;
  Wd.H = H; Wd.TW = TW; Wd.TZ = TZ; Wd.ZF = TZ + TD / 2 + 0.05;

  // ---------- merge helper: many small parts -> one vertex-coloured geometry ----------
  const vcM = toon({ vertexColors: true, roughness: 0.7 });
  const parts = () => { const list = []; const api = {
    add(geo, x, y, z, col, rot = [0, 0, 0], scl = [1, 1, 1]) { const g = (geo.index ? geo.toNonIndexed() : geo.clone()); const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...scl)); g.applyMatrix4(m); g.userData.col = new THREE.Color(col); list.push(g); return api; },
    box(w, h, d, x, y, z, col, rot, scl) { return api.add(new THREE.BoxGeometry(w, h, d), x, y, z, col, rot, scl); },
    build() { let n = 0; list.forEach((g) => { n += g.attributes.position.count; }); const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
      list.forEach((g) => { const p = g.attributes.position, q = g.attributes.normal, c = g.userData.col; for (let i = 0; i < p.count; i++, o++) { pos[o * 3] = p.getX(i); pos[o * 3 + 1] = p.getY(i); pos[o * 3 + 2] = p.getZ(i); nor[o * 3] = q.getX(i); nor[o * 3 + 1] = q.getY(i); nor[o * 3 + 2] = q.getZ(i); col[o * 3] = c.r; col[o * 3 + 1] = c.g; col[o * 3 + 2] = c.b; } });
      const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); out.setAttribute('color', new THREE.BufferAttribute(col, 3)); out.computeBoundingSphere(); return out; } }; return api; };

  // ---------- painted background: sky, sun, three mountain ranges, far town, fields ----------
  { const [c, g] = cv(32, 1024); const gr = g.createLinearGradient(0, 0, 0, 1024); gr.addColorStop(0, '#2a62c8'); gr.addColorStop(0.45, '#6fb2f2'); gr.addColorStop(0.75, '#bfe2ff'); gr.addColorStop(1, '#ffe9c4'); g.fillStyle = gr; g.fillRect(0, 0, 32, 1024); add(new THREE.PlaneGeometry(520, 300), new THREE.MeshBasicMaterial({ map: tex(c), fog: false }), 0, 70, -140, scene, { cast: false }); }
  { const [c, g] = cv(256, 256); const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, 'rgba(255,252,230,1)'); gr.addColorStop(0.18, 'rgba(255,244,200,1)'); gr.addColorStop(0.3, 'rgba(255,230,170,.55)'); gr.addColorStop(1, 'rgba(255,220,160,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    const s = add(new THREE.PlaneGeometry(26, 26), new THREE.MeshBasicMaterial({ map: tex(c), transparent: true, fog: false, depthWrite: false, toneMapped: false }), 34, 44, -130, scene, { cast: false, noink: true }); s.material.userData.bloomK = 0.35; }
  const range = (w, h, seed, cols, peaks, snow, treeDots) => { const r = PAINT.rng(seed); const [c, g] = cv(2048, 512); const pts = []; for (let x = 0; x <= 2048; x += 16) { let y = 0; for (const [f, a, ph] of peaks) y += Math.sin(x * f + ph) * a; pts.push([x, 260 - y + r() * 6]); }
    const gr = g.createLinearGradient(0, 120, 0, 512); gr.addColorStop(0, cols[0]); gr.addColorStop(1, cols[1]); g.fillStyle = gr; g.beginPath(); g.moveTo(0, 512); pts.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(2048, 512); g.fill();
    if (snow) { g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 1; i < pts.length - 1; i++) { const [x, y] = pts[i]; if (y < pts[i - 1][1] && y < pts[i + 1][1] && y < 190) { g.beginPath(); g.moveTo(x, y); g.lineTo(x - 34, y + 30); g.lineTo(x - 14, y + 24); g.lineTo(x, y + 36); g.lineTo(x + 16, y + 22); g.lineTo(x + 34, y + 30); g.fill(); } } }
    if (treeDots) { for (let k = 0; k < 900; k++) { const x = r() * 2048, i = Math.min(pts.length - 1, Math.round(x / 16)), y = pts[i][1] + 14 + r() * 260; g.fillStyle = ['#4f7f3a', '#5f9046', '#466f34'][k % 3]; g.beginPath(); g.ellipse(x, y, 5 + r() * 5, 8 + r() * 6, 0, 0, 7); g.fill(); } }
    g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 3; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); return new THREE.MeshBasicMaterial({ map: tex(c), transparent: true, fog: false, depthWrite: false }); };
  add(new THREE.PlaneGeometry(420, 105), range(0, 0, 3, ['#9fb6d8', '#c8d8ec'], [[0.004, 70, 0], [0.011, 30, 1], [0.031, 10, 2]], true, false), 0, 22, -125, scene, { cast: false, noink: true });
  add(new THREE.PlaneGeometry(360, 90), range(0, 0, 4, ['#7d9cb8', '#a9c2c8'], [[0.006, 50, 2], [0.017, 22, 0], [0.04, 7, 1]], false, false), 0, 12, -110, scene, { cast: false, noink: true });
  add(new THREE.PlaneGeometry(320, 80), range(0, 0, 5, ['#6f9a52', '#8fb866'], [[0.005, 30, 1], [0.013, 16, 3], [0.03, 5, 0]], false, true), 0, 4, -95, scene, { cast: false, noink: true });
  // patchwork fields + rolling 3D hills with dotted trees
  for (let i = 0; i < 14; i++) { const h = add(sph(9 + R() * 7, 26, 12), ['#7aa64c', '#8cb562', '#9cc06a', '#86ad58'][i % 4], -70 + i * 11, -6, -46 - (i % 3) * 6, scene, { cast: false }); h.scale.y = 0.55;
    for (let k = 0; k < 6; k++) { const a = R() * 1.2 - 0.6, x = h.position.x + Math.sin(a) * 7, z = h.position.z + 4 + R() * 3; add(sph(0.7 + R() * 0.4, 10, 8), '#4f8a36', x, -1.5 + Math.cos(a) * 3.8, z, scene, { cast: false }); } }
  { const fc = ['#c9b86a', '#9cc06a', '#b6cf7a', '#d8c27a', '#86ad58']; for (let i = 0; i < 16; i++) { const f = add(new THREE.BoxGeometry(6 + R() * 6, 0.05, 4 + R() * 3), fc[i % 5], -40 + i * 5.5 + R() * 2, 0.02, -16 - R() * 14, scene, { cast: false }); f.rotation.y = (R() - 0.5) * 0.3; } }
  // far town skyline + castle on a hill + windmill + hot-air balloon
  { const c = group(-18, 3, -42); const sm = texM(PAINT.stone(4, 40, 10, 76), 1, 2); add(sph(9, 20, 10), '#86ad58', 0, -6, 0, c).scale.y = 0.7; for (const [x, h] of [[-3.2, 7], [0, 10], [3.2, 7]]) { add(tbox(2.2, h, 2.2, 2), sm, x, h / 2, 0, c); add(new THREE.ConeGeometry(1.6, 2.6, 4), '#6b3c8f', x, h + 1.3, 0, c).rotation.y = Math.PI / 4; add(box(0.8, 0.5, 0.02), '#f4d35e', x + 0.4, h + 3.2, 0, c); } add(tbox(8.5, 4.5, 1.6, 2), sm, 0, 2.25, 0.4, c); for (let k = -3; k <= 3; k++) add(box(0.5, 0.5, 1.6), sm, k * 1.2, 4.75, 0.4, c); }
  { const wm = group(16, 0, -26); add(cyl(0.9, 1.4, 5, 10), '#efe6d2', 0, 2.5, 0, wm); add(new THREE.ConeGeometry(1.25, 1.4, 10), '#8a5734', 0, 5.7, 0, wm); const bl = group(0, 4.8, 1.3, wm); for (let k = 0; k < 4; k++) { const a = group(0, 0, 0, bl); a.rotation.z = k * Math.PI / 2; add(box(0.25, 3.2, 0.05), '#f6f1e6', 0, 1.7, 0, a); add(box(0.06, 3.2, 0.06), '#6a4a32', -0.14, 1.7, 0.02, a); } add(sph(0.2, 10, 8), '#6a4a32', 0, 0, 0, bl); Wd.life.push((t) => { bl.rotation.z = -t * 0.9; }); }
  { const b = group(-10, 26, -30); const n = 12; for (let k = 0; k < n; k++) add(new THREE.SphereGeometry(2.2, 24, 16, k / n * Math.PI * 2, Math.PI * 2 / n), k % 2 ? '#e0574a' : '#f4d35e', 0, 0, 0, b); add(box(0.9, 0.7, 0.9), '#8a5734', 0, -3.0, 0, b); for (const [x, z] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]]) add(cyl(0.02, 0.02, 1.2, 4), '#3b3f4a', x * 1.6, -2.1, z * 1.6, b); Wd.life.push((t) => { b.position.set(-10 + t * 0.35, 26 + Math.sin(t * 0.5) * 0.8, -30); b.rotation.y = t * 0.1; }); }
  // puffy flat-bottomed clouds at many heights (the tower climbs through them)
  const cloudM = toon({ color: '#ffffff', emissive: '#eef4ff', emissiveIntensity: 0.22, roughness: 1 });
  const cloud = (x, y, z, s = 1, parent = scene) => { const cl = group(x, y, z, parent); const n = 6 + Math.floor(R() * 4);
    for (let k = 0; k < n; k++) { const r = (0.7 + R() * 0.8) * s, px = (k - n / 2) * 0.85 * s + (R() - 0.5) * 0.4 * s, py = (Math.sin(k / (n - 1) * Math.PI) * 0.7 + R() * 0.25) * s; const m = add(sph(r, 16, 12), cloudM, px, py, (R() - 0.5) * 0.8 * s, cl, { cast: false }); }
    const base = add(cyl(n * 0.42 * s, n * 0.42 * s, 0.25 * s, 24), cloudM, 0, -0.05 * s, 0, cl, { cast: false }); base.scale.z = 0.35; return cl; };
  for (let i = 0; i < 30; i++) { const cl = cloud(-28 + R() * 56, 10 + i * 3.1, -10 - R() * 22, 0.8 + R() * 0.7); const x0 = cl.position.x, sp = 0.15 + R() * 0.15; Wd.life.push((t) => { cl.position.x = x0 + t * sp; }); }
  Wd.cloud = cloud(3.5, 16, -4.0, 0.9);
  Wd.flock = []; for (let i = 0; i < 7; i++) { const b = group(0, 0, 0); add(sph(0.07, 8, 6), '#3b3f4a', 0, 0, 0, b).scale.set(1.5, 0.7, 0.7); const w1 = add(box(0.26, 0.01, 0.1), '#3b3f4a', 0, 0, 0.09, b), w2 = add(box(0.26, 0.01, 0.1), '#3b3f4a', 0, 0, -0.09, b); Wd.life.push((t) => { const u = (t * 0.035) % 1; b.position.set(-18 + u * 36 + (i % 3) * 0.6, 9 + Math.floor(i / 3) * 0.4 + Math.sin(t * 1.3 + i) * 0.15, -12 - (i % 2) * 0.5); const f = Math.sin(t * 13 + i) * 0.8; w1.rotation.x = f; w2.rotation.x = -f; }); }

  // ---------- ground: back slab with the tower trench + the front lid (street) that drops away on "swamp" ----------
  const mudC = () => { const [c, g] = cv(1024, 1024); const bands = ['#4e3e2a', '#3f3424', '#5a4a30', '#3a3a26', '#4a4430', '#34301f']; let y = 0, i = 0; while (y < 1024) { const h = 60 + R() * 110; g.fillStyle = bands[i++ % bands.length]; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + Math.sin(x * 0.012 + i) * 14); g.lineTo(1024, y + h + 14); g.lineTo(0, y + h + 14); g.fill(); y += h; }
    for (let k = 0; k < 160; k++) { g.fillStyle = ['rgba(90,110,60,.6)', 'rgba(140,120,90,.7)', 'rgba(30,25,15,.6)', 'rgba(170,150,120,.7)'][k % 4]; g.beginPath(); g.ellipse(R() * 1024, R() * 1024, 5 + R() * 16, 3 + R() * 8, R() * 3, 0, 7); g.fill(); g.strokeStyle = 'rgba(20,15,8,.5)'; g.lineWidth = 2; g.stroke(); }
    g.strokeStyle = '#2a2014'; g.lineWidth = 5; for (let k = 0; k < 18; k++) { let x = R() * 1024, yy = R() * 1024; g.beginPath(); g.moveTo(x, yy); for (let s = 0; s < 7; s++) { x += R() * 40 - 20; yy += 16 + R() * 18; g.lineTo(x, yy); } g.stroke(); } return c; };
  const mudCanvas = mudC(); const mudM = toon({ map: tex(mudCanvas, 1, 1), roughness: 0.95 });
  const grassM = texM(PAINT.grass(6), 1, 1); grassM.map.wrapS = grassM.map.wrapT = THREE.RepeatWrapping;
  const W4 = 4.0;
  const slab = (x0, x1, y0, y1, z0, z1, mats, parent = scene) => {
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), p = g.attributes.position, uv = g.attributes.uv, n = g.attributes.normal; const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
    for (let i = 0; i < p.count; i++) { const wx = p.getX(i) + cx, wy = p.getY(i) + cy, wz = p.getZ(i) + cz, nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)); if (ny > 0.5) uv.setXY(i, wx / 2.4, wz / 2.4); else if (nx > 0.5) uv.setXY(i, wz / W4, wy / W4); else uv.setXY(i, wx / W4, wy / W4); }
    return add(g, mats || [mudM, mudM, grassM, mudM, mudM, mudM], cx, cy, cz, parent); };
  const ZF = Wd.ZF, ZB = TZ - TD / 2 - 0.05, YB = -100, X0 = -40, X1 = 40, TX = TW / 2 + 0.05;
  slab(X0, -TX, YB, 0, ZB, ZF); slab(TX, X1, YB, 0, ZB, ZF); slab(X0, X1, YB, 0, -40, ZB);
  // what the cutaway reveals: swamp pockets, rocks, roots, an old boot, a fish skeleton, a treasure chest, bones
  { const P = parts(); const r = PAINT.rng(77);
    for (let k = 0; k < 70; k++) { const sx = r() < 0.5 ? -1 : 1, x = sx * (TX + 0.4 + r() * 10), y = -1.0 - r() * 70; P.add(new THREE.DodecahedronGeometry(0.12 + r() * 0.3), x, y, ZF - 0.05, ['#8a7a6a', '#a8927a', '#6e5f50', '#9a8a70'][k % 4], [r() * 3, r() * 3, 0], [1, 0.8, 0.45]); }
    for (let k = 0; k < 18; k++) { const sx = r() < 0.5 ? -1 : 1; let x = sx * (TX + 0.6 + r() * 6), y = -0.2 - r() * 4; for (let s = 0; s < 6; s++) { const nx = x + (r() - 0.5) * 0.6, ny = y - 0.3 - r() * 0.3; const len = Math.hypot(nx - x, ny - y); P.add(cyl(0.035 - s * 0.004, 0.04 - s * 0.004, len, 5), (x + nx) / 2, (y + ny) / 2, ZF - 0.02, '#5a3e24', [0, 0, Math.atan2(nx - x, ny - y) * -1]); x = nx; y = ny; } }
    const boot = (x, y) => { P.box(0.35, 0.45, 0.2, x, y, ZF - 0.05, '#3b2a20'); P.box(0.55, 0.16, 0.22, x + 0.12, y - 0.24, ZF - 0.05, '#3b2a20'); P.box(0.57, 0.05, 0.23, x + 0.12, y - 0.33, ZF - 0.04, '#1e1714'); };
    boot(-3.6, -5.2); boot(4.8, -27);
    const fish = (x, y, s) => { P.box(1.2 * s, 0.05, 0.05, x, y, ZF, '#e8e0cc'); for (let k = 0; k < 6; k++) P.box(0.04, 0.4 * s, 0.04, x - 0.4 * s + k * 0.16 * s, y, ZF, '#e8e0cc'); P.add(new THREE.ConeGeometry(0.22 * s, 0.4 * s, 4), x + 0.7 * s, y, ZF, '#e8e0cc', [0, 0, -Math.PI / 2]); P.add(new THREE.ConeGeometry(0.2 * s, 0.3 * s, 3), x - 0.72 * s, y, ZF, '#e8e0cc', [0, 0, Math.PI / 2]); };
    fish(3.6, -9, 1); fish(-5, -18, 1.3); fish(3.2, -44, 1.1); fish(-4.2, -58, 0.9);
    const chest = (x, y) => { P.box(1.0, 0.55, 0.5, x, y, ZF - 0.1, '#8a5734'); P.add(cyl(0.25, 0.25, 1.0, 12, false, 0, Math.PI), x, y + 0.28, ZF - 0.1, '#9a6a3e', [0, 0, Math.PI / 2], [1, 1, 2]); for (const dx of [-0.4, 0, 0.4]) P.box(0.06, 0.62, 0.52, x + dx, y + 0.05, ZF - 0.1, '#c9a03a'); P.box(0.16, 0.18, 0.05, x, y + 0.18, ZF + 0.17, '#f4d35e'); };
    chest(-4.4, -34); for (let k = 0; k < 7; k++) P.add(cyl(0.08, 0.08, 0.02, 10), -4.4 + (r() - 0.5) * 1.6, -34.35 + r() * 0.1, ZF + 0.12, '#f4d35e', [Math.PI / 2, 0, 0]);
    for (let k = 0; k < 8; k++) { const x = (r() < 0.5 ? -1 : 1) * (TX + 1 + r() * 7), y = -6 - r() * 60; P.box(0.5, 0.07, 0.07, x, y, ZF, '#efe6d2', [0, 0, r() * 3]); P.add(sph(0.07, 6, 5), x - 0.25, y, ZF, '#efe6d2'); P.add(sph(0.07, 6, 5), x + 0.25, y, ZF, '#efe6d2'); }
    add(P.build(), vcM, 0, 0, 0, scene, { cast: false }); }
  for (let k = 0; k < 22; k++) { const x = (R() < 0.5 ? -1 : 1) * (TX + 0.6 + R() * 9), y = -1.2 - R() * 60; add(sph(0.5 + R() * 0.8, 14, 10), toon({ color: '#35675e', emissive: '#16352f', emissiveIntensity: 0.3 }), x, y, ZF - 0.2, scene, { cast: false }).scale.set(1.7, 0.5, 0.4); }
  Wd.mudBubbles = []; for (let i = 0; i < 14; i++) Wd.mudBubbles.push(add(sph(0.08, 8, 6), toon({ color: '#9ec4a0', transparent: true, opacity: 0.7 }), 0, -200, 0, scene, { cast: false }));

  // ---------- the street (on the lid): road, kerbs, sidewalks, lamps, fences, flowers, bench, mailbox ----------
  Wd.lid = group(0, 0, 0); { const L = Wd.lid; slab(X0, X1, -1.2, 0, ZF, 40, [mudM, mudM, grassM, mudM, mudM, mudM], L);
    const cobC = () => { const [c, g] = cv(512, 256); g.fillStyle = '#8e8476'; g.fillRect(0, 0, 512, 256); for (let y = 0; y < 256; y += 32) for (let x = (y / 32) % 2 * 24; x < 512; x += 48) { g.fillStyle = ['#b0a494', '#a29684', '#988c7a', '#ab9f8e'][(x * 7 + y) % 4]; g.beginPath(); g.roundRect(x + 2, y + 2, 44, 28, 8); g.fill(); g.strokeStyle = 'rgba(40,30,20,.55)'; g.lineWidth = 2; g.stroke(); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + 6, y + 5, 30, 4); } return c; };
    const cobM = texM(cobC(), 22, 1); add(new THREE.BoxGeometry(X1 - X0, 0.04, 2.2), cobM, 0, 0.02, ZF + 2.2, L, { cast: false });
    const swC = () => { const [c, g] = cv(256, 256); g.fillStyle = '#cfc8bc'; g.fillRect(0, 0, 256, 256); g.strokeStyle = 'rgba(80,70,60,.35)'; g.lineWidth = 3; for (let x = 0; x <= 256; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); } g.beginPath(); g.moveTo(0, 128); g.lineTo(256, 128); g.stroke(); return c; };
    const swM = texM(swC(), 40, 1); add(new THREE.BoxGeometry(X1 - X0, 0.1, 0.9), swM, 0, 0.05, ZF + 0.6, L); add(new THREE.BoxGeometry(X1 - X0, 0.1, 0.7), swM, 0, 0.05, ZF + 3.65, L);
    add(new THREE.BoxGeometry(X1 - X0, 0.12, 0.08), '#a8a096', 0, 0.06, ZF + 1.1, L); add(new THREE.BoxGeometry(X1 - X0, 0.12, 0.08), '#a8a096', 0, 0.06, ZF + 3.3, L);
    for (let x = -10.8; x <= 12; x += 3.6) { if (Math.abs(x) < 1.6) continue; const lp = group(x, 0.1, ZF + 1.0, L); add(cyl(0.05, 0.07, 2.2, 8), '#2b2f3d', 0, 1.1, 0, lp); add(cyl(0.12, 0.12, 0.1, 8), '#2b2f3d', 0, 0.05, 0, lp); add(box(0.04, 0.04, 0.3), '#2b2f3d', 0, 2.15, -0.12, lp); const gl = add(new THREE.ConeGeometry(0.16, 0.22, 6), '#2b2f3d', 0, 2.3, -0.28, lp); add(sph(0.09, 10, 8), toon({ color: '#fff4c8', emissive: '#ffd27a', emissiveIntensity: 0.9 }), 0, 2.16, -0.28, lp, { cast: false }); }
    for (let x = -20; x <= 20; x += 0.5) { if (Math.abs(x) < 1.8 || (x > 3.2 && x < 6.0)) continue; add(box(0.07, 0.5, 0.05), '#f6f1e6', x, 0.35, ZF + 0.15, L); } add(box(18, 0.05, 0.04), '#f6f1e6', -10.9, 0.5, ZF + 0.15, L); add(box(14, 0.05, 0.04), '#f6f1e6', 13.1, 0.5, ZF + 0.15, L);
    const fl = ['#e0574a', '#f4d35e', '#c0306a', '#ffffff', '#8a6ad8']; for (let k = 0; k < 160; k++) { const x = (R() - 0.5) * 36; if (Math.abs(x) < 1.8 || (x > 3.2 && x < 6.0)) continue; add(sph(0.05, 6, 5), fl[k % 5], x, 0.12 + R() * 0.1, ZF + 0.05 + R() * 0.08, L, { cast: false }); }
    for (let k = 0; k < 220; k++) { const x = X0 + R() * (X1 - X0), z = ZF + 4.1 + R() * 12; add(new THREE.ConeGeometry(0.035, 0.2, 4), k % 2 ? '#4c8a30' : '#5f9a3c', x, 0.1, z, L, { cast: false }); }
    { const b = group(-3.4, 0.1, ZF + 0.55, L); add(box(1.2, 0.06, 0.36), '#8a5734', 0, 0.42, 0, b); add(box(1.2, 0.3, 0.05), '#8a5734', 0, 0.62, -0.16, b); for (const s of [-1, 1]) add(box(0.05, 0.42, 0.36), '#2b2f3d', s * 0.5, 0.21, 0, b); }
    { const m = group(2.6, 0.1, ZF + 0.55, L); add(box(0.06, 0.9, 0.06), '#2b2f3d', 0, 0.45, 0, m); add(box(0.32, 0.26, 0.44), '#2a5fae', 0, 1.0, 0, m); add(cyl(0.16, 0.16, 0.44, 12, false, 0, Math.PI), '#2a5fae', 0, 1.13, 0, m).rotation.x = Math.PI / 2; add(box(0.03, 0.18, 0.03), '#c62f36', 0.17, 1.12, 0.1, m); }
    for (let x = -18; x <= 18; x += 4.5) { if (Math.abs(x) < 7) continue; tree(x, ZF + 4.6 + R() * 1.5, L); } }
  function tree(x, z, parent) { const t = group(x, 0, z, parent); const s = 0.9 + R() * 0.4; add(cyl(0.13 * s, 0.2 * s, 1.8 * s, 8), '#6a4a32', 0, 0.9 * s, 0, t); add(cyl(0.05, 0.07, 0.8 * s, 6), '#6a4a32', 0.25 * s, 1.6 * s, 0, t).rotation.z = -0.7;
    const cs = ['#4f8a36', '#5f9a3c', '#6fae45', '#7fbe52']; for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28; add(sph((0.55 + R() * 0.3) * s, 12, 10), cs[(k + 1) % 4], Math.cos(a) * 0.45 * s, (2.0 + (k % 3) * 0.3) * s, Math.sin(a) * 0.4 * s, t); } add(sph(0.6 * s, 12, 10), cs[3], 0, 2.7 * s, 0, t); return t; }
  // row of cottages along the street (behind the ground line, they stay when the lid drops)
  // ---------- houses: textured walls (timber / brick / plaster), shingled gable roofs, dormers, chimneys, porches, gardens ----------
  const wallTex = {
    plaster: (base) => { const [c, g] = cv(256, 256); g.fillStyle = base; g.fillRect(0, 0, 256, 256); const r = PAINT.rng(base.length * 7); for (let k = 0; k < 260; k++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '90,70,50'},${0.04 + r() * 0.05})`; g.beginPath(); g.ellipse(r() * 256, r() * 256, 4 + r() * 14, 3 + r() * 8, r() * 3, 0, 7); g.fill(); } g.fillStyle = 'rgba(90,70,50,.10)'; g.fillRect(0, 236, 256, 20); return c; },
    brick: (base) => { const [c, g] = cv(256, 256); g.fillStyle = '#d8ccc0'; g.fillRect(0, 0, 256, 256); const r = PAINT.rng(5); for (let y = 0; y < 256; y += 16) for (let x = (y / 16) % 2 * 16 - 16; x < 256; x += 32) { const v = (r() - 0.5) * 30; const col = new THREE.Color(base); g.fillStyle = `rgb(${col.r * 255 + v | 0},${col.g * 255 + v * 0.6 | 0},${col.b * 255 + v * 0.4 | 0})`; g.fillRect(x + 1.5, y + 1.5, 29, 13); } return c; },
    timber: (base) => { const [c, g] = cv(256, 256); g.fillStyle = base; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#5a3a24'; g.lineCap = 'square'; g.lineWidth = 14; const L = (a, b, c_, d) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c_, d); g.stroke(); }; L(0, 7, 256, 7); L(0, 128, 256, 128); L(0, 249, 256, 249); for (const x of [7, 92, 164, 249]) L(x, 0, x, 256); L(7, 128, 92, 7); L(164, 7, 249, 128); L(7, 249, 92, 128); L(164, 128, 249, 249); return c; } };
  const shingleTex = (base) => { const [c, g] = cv(256, 256); const col = new THREE.Color(base); g.fillStyle = base; g.fillRect(0, 0, 256, 256); const r = PAINT.rng(11); for (let y = 0; y < 256; y += 22) for (let x = (y / 22) % 2 * 16 - 16; x < 256; x += 32) { const v = (r() - 0.5) * 40; g.fillStyle = `rgb(${col.r * 255 + v | 0},${col.g * 255 + v | 0},${col.b * 255 + v | 0})`; g.beginPath(); g.moveTo(x + 1, y); g.lineTo(x + 31, y); g.lineTo(x + 31, y + 14); g.quadraticCurveTo(x + 16, y + 26, x + 1, y + 14); g.fill(); g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 2; g.stroke(); } return c; };
  const matCacheH = new Map(); const mtl = (key, mk) => { if (!matCacheH.has(key)) matCacheH.set(key, mk()); return matCacheH.get(key); };
  const wallMat = (style, base) => mtl('w' + style + base, () => texM(wallTex[style](base), 1, 1));
  const roofMat = (base) => mtl('r' + base, () => texM(shingleTex(base), 2, 2));
  const gable = (w, d, h, rh, o, mWall, mRoof, parent, P) => { const a = Math.atan2(rh, d / 2 + o), L = Math.hypot(d / 2 + o, rh) + 0.06;
    for (const s of [-1, 1]) { const sl = add(new THREE.BoxGeometry(w + 2 * o, 0.09, L), mRoof, 0, h + rh / 2 - 0.02, s * (d / 2 + o) / 2, parent); sl.rotation.x = s * a; }
    const tri = new THREE.Shape(); tri.moveTo(-d / 2, 0); tri.lineTo(d / 2, 0); tri.lineTo(0, rh); tri.closePath();
    for (const s of [-1, 1]) { const m = add(new THREE.ShapeGeometry(tri), mWall, s * w / 2, h, 0, parent); m.rotation.y = s * Math.PI / 2; m.material.side = THREE.DoubleSide; }
    P.box(w + 2 * o + 0.06, 0.1, 0.12, 0, h + rh + 0.02, 0, '#5a3a24');
    for (const s of [-1, 1]) P.box(w + 2 * o, 0.07, 0.08, 0, h - 0.04, s * (d / 2 + o - 0.02), '#8a8a8a'); };
  const STY = [['timber', '#f2e6cc'], ['brick', '#b0553a'], ['plaster', '#e8d0c0'], ['plaster', '#d8e4d0'], ['brick', '#c07a4a'], ['plaster', '#e0d4ec'], ['timber', '#f4ead4'], ['plaster', '#f2dcc0']];
  const ROOFC = ['#8a3a2a', '#5a4a44', '#2a4a6e', '#3f5a3a', '#7a4a2a', '#6b3c5a'];
  Wd.chimneys = [];
  const cottage = (x, z, w, seed) => { const r = PAINT.rng(seed); const [style, base] = STY[seed % STY.length]; const roofCol = ROOFC[seed % ROOFC.length], acc = ['#2f6b4f', '#2a5fae', '#b03a36', '#6b3c8f', '#c9893a'][seed % 5];
    const d = 2.2, h = 2.3 + r() * 0.5, rh = 1.0 + r() * 0.4, o = 0.2; const g = group(x, 0, z); const mW = wallMat(style, base), mR = roofMat(roofCol); const P = parts();
    add(new THREE.BoxGeometry(w, h, d), mW, 0, h / 2, 0, g); gable(w, d, h, rh, o, mW, mR, g, P);
    P.box(w + 0.08, 0.22, d + 0.08, 0, 0.11, 0, '#9a8e80');
    const win = (wx, wy, ww, wh) => { P.box(ww, wh, 0.03, wx, wy, d / 2 + 0.01, '#9fd0ee').box(ww * 0.35, wh * 0.9, 0.031, wx - ww * 0.2, wy, d / 2 + 0.015, '#d8f0ff');
      P.box(ww + 0.1, 0.06, 0.07, wx, wy + wh / 2 + 0.03, d / 2 + 0.03, '#f8f2e4').box(ww + 0.18, 0.06, 0.13, wx, wy - wh / 2 - 0.03, d / 2 + 0.06, '#f8f2e4').box(0.05, wh, 0.06, wx - ww / 2 - 0.02, wy, d / 2 + 0.03, '#f8f2e4').box(0.05, wh, 0.06, wx + ww / 2 + 0.02, wy, d / 2 + 0.03, '#f8f2e4').box(0.03, wh, 0.04, wx, wy, d / 2 + 0.03, '#f8f2e4').box(ww, 0.03, 0.04, wx, wy, d / 2 + 0.03, '#f8f2e4');
      if (style !== 'timber') for (const s of [-1, 1]) { P.box(0.18, wh + 0.04, 0.04, wx + s * (ww / 2 + 0.14), wy, d / 2 + 0.03, acc); for (let j = 0; j < 4; j++) P.box(0.15, 0.02, 0.05, wx + s * (ww / 2 + 0.14), wy - wh / 2 + 0.08 + j * wh / 4, d / 2 + 0.05, '#ffffff'); }
      if (r() < 0.7) { P.box(ww + 0.06, 0.1, 0.14, wx, wy - wh / 2 - 0.12, d / 2 + 0.1, '#b0553a'); for (let j = 0; j < 5; j++) { P.add(sph(0.045, 6, 5), wx - ww / 2 + 0.06 + j * (ww - 0.12) / 4, wy - wh / 2 - 0.05, d / 2 + 0.1, ['#e0574a', '#f4d35e', '#c0306a', '#ffffff', '#8a6ad8'][(j + seed) % 5]); P.add(sph(0.04, 6, 5), wx - ww / 2 + 0.1 + j * (ww - 0.12) / 4, wy - wh / 2 - 0.07, d / 2 + 0.04, '#4f8a36'); } } };
    const doorX = (r() - 0.5) * (w - 1.2); const wx2 = doorX > 0 ? -w * 0.28 : w * 0.28;
    win(wx2, h * 0.3, 0.5, 0.55); win(-w * 0.26, h * 0.73, 0.48, 0.5); win(w * 0.26, h * 0.73, 0.48, 0.5);
    P.box(0.5, 0.9, 0.05, doorX, 0.45 + 0.22, d / 2 + 0.01, acc).box(0.6, 0.07, 0.08, doorX, 1.15 + 0.22, d / 2 + 0.03, '#f8f2e4').add(sph(0.03, 6, 5), doorX + 0.15, 0.68, d / 2 + 0.05, '#f4d35e').box(0.3, 0.12, 0.02, doorX, 1.0, d / 2 + 0.04, '#bfe4f6');
    P.box(0.8, 0.06, 0.5, doorX, 0.25, d / 2 + 0.25, '#b8b0a4').box(0.7, 0.06, 0.3, doorX, 0.12, d / 2 + 0.55, '#b8b0a4');
    if (r() < 0.6) { P.box(0.9, 0.05, 0.55, doorX, 1.55, d / 2 + 0.28, roofCol, [0.35, 0, 0]); for (const s of [-1, 1]) P.box(0.05, 1.3, 0.05, doorX + s * 0.4, 0.85, d / 2 + 0.5, '#f8f2e4'); }
    // dormer on the front slope + chimney on the ridge (with smoke)
    if (r() < 0.7) { const dx = -doorX * 0.5, a = Math.atan2(rh, d / 2 + o); const dy = h + rh * 0.38, dz = (d / 2 + o) * 0.42; P.box(0.55, 0.5, 0.6, dx, dy + 0.1, dz, base).box(0.32, 0.3, 0.03, dx, dy + 0.12, dz + 0.31, '#9fd0ee').box(0.4, 0.05, 0.05, dx, dy - 0.04, dz + 0.32, '#f8f2e4'); const tri = new THREE.Shape(); tri.moveTo(-0.34, 0); tri.lineTo(0.34, 0); tri.lineTo(0, 0.3); tri.closePath(); for (const s of [-1, 1]) P.box(0.42, 0.05, 0.7, dx + s * 0.16, dy + 0.48, dz, roofCol, [0, 0, -s * 0.75]); }
    const chx = (r() - 0.5) * w * 0.6; P.box(0.3, 0.9, 0.3, chx, h + rh - 0.1, -0.25, style === 'brick' ? '#8a3a2a' : '#a8605a').box(0.38, 0.08, 0.38, chx, h + rh + 0.38, -0.25, '#7a7068'); Wd.chimneys.push([x + chx, h + rh + 0.45, z - 0.25]);
    // front garden: hedge, gate, flowers, a little lamp
    for (let k = 0; k < 7; k++) { const hx = -w / 2 + 0.2 + k * (w - 0.4) / 6; if (Math.abs(hx - doorX) < 0.4) continue; P.add(sph(0.2, 8, 6), hx, 0.2, d / 2 + 0.95, ['#4f8a36', '#5f9a3c'][k % 2], [0, 0, 0], [1.2, 0.9, 0.9]); }
    for (let k = 0; k < 10; k++) P.add(sph(0.04, 6, 5), -w / 2 + r() * w, 0.12, d / 2 + 0.7 + r() * 0.15, ['#e0574a', '#f4d35e', '#c0306a', '#ffffff', '#8a6ad8'][k % 5]);
    add(P.build(), vcM, 0, 0, 0, g); return g; };
  [[-14.0, 2.9], [-17.3, 3.0], [-20.5, 2.8], [-23.8, 3.1], [7.4, 2.8], [10.6, 3.0], [13.8, 2.8], [17.1, 3.1], [20.3, 2.9], [23.6, 3.0]].forEach(([x, w], i) => cottage(x, TZ - 0.1, w, i + 1));
  // a second row of detailed houses right behind the street, so every shot has real houses in it
  [[-12.4, 3.0], [-9.0, 2.8], [-5.6, 3.1], [-2.2, 2.9], [1.2, 3.0], [4.6, 2.8], [8.0, 3.1], [11.4, 2.9], [14.8, 3.0]].forEach(([x, w], i) => { const c = cottage(x, -8.6 - (i % 2) * 1.2, w, i + 20); c.rotation.y = (i % 3 - 1) * 0.06; });
  { const ftC = (base, k) => { const [c, g] = cv(512, 512); g.fillStyle = base; g.fillRect(0, 0, 512, 512); const r = PAINT.rng(k + 3);
      if (k % 2) for (let y = 0; y < 512; y += 16) for (let x = (y / 16) % 2 * 16 - 16; x < 512; x += 32) { g.fillStyle = `rgba(120,60,40,${0.1 + r() * 0.12})`; g.fillRect(x + 1, y + 1, 30, 14); }
      g.fillStyle = 'rgba(255,255,255,.55)'; for (const y of [150, 300]) g.fillRect(0, y, 512, 10); g.fillStyle = 'rgba(80,60,40,.25)'; g.fillRect(0, 0, 512, 14);
      const sh = ['#2f6b4f', '#b03a36', '#2a5fae', '#6b3c8f'][k % 4];
      for (const y of [40, 190]) for (let x = 40; x < 480; x += 118) { g.fillStyle = '#f8f2e4'; g.fillRect(x - 6, y - 6, 72, 92); const gr = g.createLinearGradient(x, y, x + 60, y + 80); gr.addColorStop(0, '#d8f0ff'); gr.addColorStop(1, '#4a7ea8'); g.fillStyle = gr; g.fillRect(x, y, 60, 80); g.fillStyle = '#f8f2e4'; g.fillRect(x + 28, y, 4, 80); g.fillRect(x, y + 36, 60, 4);
        g.fillStyle = sh; g.fillRect(x - 24, y - 4, 16, 88); g.fillRect(x + 68, y - 4, 16, 88); g.fillStyle = '#b0553a'; g.fillRect(x - 4, y + 84, 68, 14); for (let j = 0; j < 6; j++) { g.fillStyle = ['#e0574a', '#f4d35e', '#c0306a', '#ffffff'][j % 4]; g.beginPath(); g.arc(x + 4 + j * 11, y + 82, 5, 0, 7); g.fill(); } }
      for (let j = 0; j < 8; j++) { g.fillStyle = j % 2 ? '#ffffff' : sh; g.beginPath(); g.moveTo(j * 64, 330); g.lineTo(j * 64 + 64, 330); g.lineTo(j * 64 + 58, 370); g.lineTo(j * 64 + 6, 370); g.fill(); }
      g.fillStyle = '#8fc0e0'; g.fillRect(40, 385, 200, 110); g.fillStyle = '#f8f2e4'; g.fillRect(36, 380, 208, 8); g.fillStyle = '#6a4a32'; g.fillRect(320, 380, 80, 132); g.fillStyle = '#f4d35e'; g.beginPath(); g.arc(388, 450, 5, 0, 7); g.fill(); return c; };
    const ftM = ['#e8d8b8', '#d8b8a8', '#e0d0a8', '#c8d4c4', '#e8d0dc', '#f0e4c8'].map((b, k) => texM(ftC(b, k), 1, 1));
    for (let i = 0; i < 22; i++) { const x = -66 + i * 6.2 + R() * 1.5, w = 2.6 + R() * 2.0, h = 2.8 + R() * 3.2, z = -30 - R() * 6; add(new THREE.BoxGeometry(w, h, 2), ftM[i % 6], x, h / 2, z, scene, { cast: false });
      const tri = new THREE.Shape(); tri.moveTo(-w / 2 - 0.2, 0); tri.lineTo(w / 2 + 0.2, 0); tri.lineTo(0, 1.2 + R() * 0.7); tri.closePath(); const rg = new THREE.ExtrudeGeometry(tri, { depth: 2.4, bevelEnabled: false }); rg.computeBoundingBox(); const uv = rg.attributes.uv; for (let q = 0; q < uv.count; q++) uv.setXY(q, uv.getX(q) * 0.5, uv.getY(q) * 0.5);
      add(rg, roofMat(ROOFC[i % ROOFC.length]), x, h, z - 1.2, scene, { cast: false }); add(box(0.3, 0.9, 0.3), '#8a3a2a', x + w * 0.25, h + 0.7, z, scene, { cast: false });
      if (i % 3 === 0) tree(x + w / 2 + 0.9, z + 1.2, scene); } }
  Wd.chSmoke = []; for (let i = 0; i < Wd.chimneys.length * 3; i++) Wd.chSmoke.push(add(sph(0.14, 10, 8), toon({ color: '#f4f6f8', emissive: '#ffffff', emissiveIntensity: 0.25, transparent: true, opacity: 0.45, depthWrite: false }), 0, -200, 0, scene, { cast: false, noink: true }));
  Wd.life.push((t) => { Wd.chSmoke.forEach((m, i) => { const c = Wd.chimneys[Math.floor(i / 3)], u = (t * 0.3 + (i % 3) / 3 + c[0] * 0.13) % 1; m.position.set(c[0] + u * 0.7, c[1] + u * 1.4, c[2]); m.scale.setScalar(0.5 + u * 1.5); }); });
  for (let i = 0; i < 10; i++) { const x = -26 + i * 5.6 + R(); if (Math.abs(x) < 7) continue; tree(x, -4.5 - R() * 3, scene); }
  for (let k = 0; k < 80; k++) { const x = X0 + R() * (X1 - X0), z = -3 - R() * 10; if (Math.abs(x) < 2) continue; add(new THREE.ConeGeometry(0.035, 0.2, 4), k % 2 ? '#4c8a30' : '#5f9a3c', x, 0.1, z, scene, { cast: false }); }
  Wd.dust = []; const dustM = toon({ color: '#d8c8ae', transparent: true, opacity: 0.75 }); for (let i = 0; i < 26; i++) Wd.dust.push(add(sph(0.16, 10, 8), dustM, 0, -200, 0, scene, { cast: false }));

  // ---------- the tower: 72 floors, three facade styles, each style's trim merged into one mesh ----------
  const WX = 0.585, WY = 0.05, WW = 0.66, WH = 0.56;   // front windows (centre x = +-WX)
  const floorC = (k) => { const [c, g] = cv(512, 256); const walls = ['#f2e4c6', '#ead6b6', '#f4ead4']; g.fillStyle = walls[k % 3]; g.fillRect(0, 0, 512, 256);
    const r = PAINT.rng(50 + k); for (let y = 0; y < 256; y += 16) for (let x = (y / 16) % 2 * 16; x < 512; x += 32) { g.fillStyle = `rgba(${150 + r() * 40},${110 + r() * 30},${80 + r() * 20},${0.06 + r() * 0.06})`; g.fillRect(x + 1, y + 1, 30, 14); }
    for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(90,70,50,.06)'; g.beginPath(); g.ellipse(r() * 512, 200 + r() * 50, 40 + r() * 60, 14, 0, 0, 7); g.fill(); }
    const curt = [['#c62f36', '#e8a0a0'], ['#2a5fae', '#a0c0e8'], ['#2f6b4f', '#a8d0b0']][k % 3];
    for (const x0 of [76, 306]) { const gr = g.createLinearGradient(x0, 58, x0 + 130, 175); gr.addColorStop(0, '#d8f0ff'); gr.addColorStop(0.45, '#8fc8ec'); gr.addColorStop(1, '#4a7ea8'); g.fillStyle = gr; g.fillRect(x0, 58, 130, 117);
      g.fillStyle = '#3a2a22'; g.fillRect(x0 + 8, 120, 114, 55); g.fillStyle = curt[0]; g.fillRect(x0, 58, 26, 117); g.fillRect(x0 + 104, 58, 26, 117); g.fillStyle = curt[1]; g.fillRect(x0 + 6, 58, 6, 117); g.fillRect(x0 + 110, 58, 6, 117);
      if ((k + x0) % 3 === 0) { g.fillStyle = '#5f9a3c'; g.beginPath(); g.arc(x0 + 65, 140, 16, 0, 7); g.fill(); g.fillStyle = '#c0553a'; g.fillRect(x0 + 55, 150, 20, 22); } else { g.fillStyle = '#f4d35e'; g.beginPath(); g.moveTo(x0 + 55, 120); g.lineTo(x0 + 75, 120); g.lineTo(x0 + 70, 135); g.lineTo(x0 + 60, 135); g.fill(); g.fillStyle = '#3b3f4a'; g.fillRect(x0 + 63, 135, 4, 30); }
      g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(x0 + 34, 58); g.lineTo(x0 + 60, 58); g.lineTo(x0 + 34, 110); g.fill(); g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(x0 + 70, 58); g.lineTo(x0 + 80, 58); g.lineTo(x0 + 40, 140); g.lineTo(x0 + 34, 140); g.fill(); }
    return c; };
  const sideC = (k) => { const [c, g] = cv(512, 256); g.fillStyle = ['#e4d4b4', '#dcc8a8', '#e8dcc4'][k % 3]; g.fillRect(0, 0, 512, 256); const r = PAINT.rng(80 + k); for (let y = 0; y < 256; y += 16) for (let x = (y / 16) % 2 * 16; x < 512; x += 32) { g.fillStyle = `rgba(140,100,70,${0.05 + r() * 0.06})`; g.fillRect(x + 1, y + 1, 30, 14); }
    const gr = g.createLinearGradient(188, 58, 324, 175); gr.addColorStop(0, '#d8f0ff'); gr.addColorStop(1, '#4a7ea8'); g.fillStyle = gr; g.fillRect(188, 58, 136, 117); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.moveTo(200, 58); g.lineTo(230, 58); g.lineTo(200, 110); g.fill(); return c; };
  const floorMats = [0, 1, 2].map((k) => toon({ map: tex(floorC(k)), roughness: 0.85 }));
  const sideMats = [0, 1, 2].map((k) => toon({ map: tex(sideC(k)), roughness: 0.85 }));
  const topM = toon({ color: '#cbb894' });
  const SH = ['#3f7a52', '#2a5fae', '#b03a36'], TRIM = '#f8f2e4', STONE = '#d0c2a8';
  const window3D = (P, x, y, z, rotY, w = WW, h = WH, k = 0) => { const R_ = [0, rotY, 0]; const off = (dx, dy, dz) => { const c = Math.cos(rotY), s = Math.sin(rotY); return [x + dx * c + dz * s, y + dy, z - dx * s + dz * c]; };
    const b = (bw, bh, bd, dx, dy, dz, col) => { const [px, py, pz] = off(dx, dy, dz); P.box(bw, bh, bd, px, py, pz, col, R_); };
    b(w + 0.1, 0.06, 0.08, 0, h / 2 + 0.03, 0.03, TRIM); b(w + 0.1, 0.06, 0.08, 0, -h / 2 - 0.03, 0.03, TRIM); b(0.06, h, 0.08, -w / 2 - 0.02, 0, 0.03, TRIM); b(0.06, h, 0.08, w / 2 + 0.02, 0, 0.03, TRIM);
    b(0.035, h, 0.05, 0, 0, 0.02, TRIM); b(w, 0.03, 0.05, 0, h * 0.08, 0.02, TRIM);
    b(w + 0.24, 0.05, 0.16, 0, -h / 2 - 0.08, 0.07, STONE); b(w + 0.18, 0.08, 0.1, 0, h / 2 + 0.1, 0.05, STONE); b(0.14, 0.13, 0.11, 0, h / 2 + 0.12, 0.06, '#e8dcc0');
    if (k >= 0) for (const s of [-1, 1]) { b(0.2, h + 0.02, 0.04, s * (w / 2 + 0.16), 0, 0.03, SH[k]); for (let j = 0; j < 4; j++) b(0.17, 0.02, 0.05, s * (w / 2 + 0.16), -h / 2 + 0.1 + j * h / 4, 0.05, '#ffffff'); } };
  const buildFloorTrim = (k) => { const P = parts(), fz = TD / 2, hx = TW / 2;
    P.box(TW + 0.16, 0.08, TD + 0.16, 0, H / 2 - 0.04, 0, TRIM).box(TW + 0.1, 0.05, TD + 0.1, 0, H / 2 - 0.105, 0, STONE).box(TW + 0.06, 0.06, TD + 0.06, 0, -H / 2 + 0.03, 0, '#b8a888');
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) for (let j = 0; j < 3; j++) { const big = (j + (sx + sz > 0 ? 1 : 0)) % 2; P.box(big ? 0.2 : 0.14, 0.32, big ? 0.14 : 0.2, sx * (hx - 0.04), -H / 2 + 0.22 + j * 0.36, sz * (fz - 0.04), STONE); }
    for (const sx of [-1, 1]) window3D(P, sx * WX, WY, fz + 0.005, 0, WW, WH, k);
    for (const sx of [-1, 1]) window3D(P, sx * (hx + 0.005), WY, 0, sx * Math.PI / 2, 0.66, WH, -1);
    if (k === 0) for (const sx of [-1, 1]) { P.box(0.68, 0.13, 0.17, sx * WX, WY - WH / 2 - 0.17, fz + 0.12, '#b0553a'); for (let j = 0; j < 7; j++) { P.add(sph(0.055, 6, 5), sx * WX - 0.28 + j * 0.093, WY - WH / 2 - 0.08 + (j % 2) * 0.02, fz + 0.12, ['#e0574a', '#f4d35e', '#c0306a', '#ffffff'][j % 4]); P.add(sph(0.05, 6, 5), sx * WX - 0.26 + j * 0.09, WY - WH / 2 - 0.1, fz + 0.06, '#4f8a36'); } }
    if (k === 1) { P.box(2.2, 0.06, 0.38, 0, -H / 2 + 0.1, fz + 0.19, STONE); for (let j = 0; j <= 14; j++) P.box(0.025, 0.42, 0.025, -1.08 + j * 0.155, -H / 2 + 0.34, fz + 0.36, '#2b2f3d'); P.box(2.2, 0.035, 0.035, 0, -H / 2 + 0.55, fz + 0.36, '#2b2f3d'); for (const s of [-1, 1]) P.box(0.035, 0.035, 0.36, s * 1.1, -H / 2 + 0.55, fz + 0.19, '#2b2f3d');
      for (const s of [-1, 1]) { P.add(cyl(0.08, 0.06, 0.14, 8), s * 0.95, -H / 2 + 0.2, fz + 0.2, '#c0553a'); P.add(sph(0.12, 8, 6), s * 0.95, -H / 2 + 0.33, fz + 0.2, '#5f9a3c'); } }
    if (k === 2) for (const sx of [-1, 1]) { for (let j = 0; j < 6; j++) P.box(0.14, 0.02, 0.42, sx * WX - 0.35 + j * 0.14 + 0.07, WY + WH / 2 + 0.2, fz + 0.2, j % 2 ? '#ffffff' : '#c62f36', [-0.5, 0, 0]); for (let j = 0; j < 6; j++) P.box(0.14, 0.08, 0.02, sx * WX - 0.35 + j * 0.14 + 0.07, WY + WH / 2 + 0.06, fz + 0.39, j % 2 ? '#ffffff' : '#c62f36'); }
    return P.build(); };
  const trims = [0, 1, 2].map(buildFloorTrim);
  Wd.tower = group(0, 0, TZ); Wd.floors = [];
  for (let i = 0; i < 72; i++) { const k = i % 3; const f = add(new THREE.BoxGeometry(TW, H, TD), [sideMats[k], sideMats[k], topM, topM, floorMats[k], sideMats[k]], 0, i * H + H / 2, 0, Wd.tower); add(trims[k], vcM, 0, 0, 0, f); f.visible = false; Wd.floors.push(f); }
  // ground floor = a little shop front: striped awning, door with steps, wall lamps, potted plants
  { const f0 = Wd.floors[0], P = parts(), fz = TD / 2 + 0.01;
    P.box(0.62, 0.98, 0.05, 0.78, -H / 2 + 0.49, fz, '#6a4a32').box(0.7, 0.06, 0.1, 0.78, -H / 2 + 1.0, fz + 0.03, TRIM).add(sph(0.035, 6, 5), 0.6, -H / 2 + 0.5, fz + 0.05, '#f4d35e');
    for (let j = 0; j < 3; j++) P.box(0.84 - j * 0.1, 0.06, 0.3 - j * 0.08, 0.78, -H / 2 + 0.03 + j * 0.06, fz + 0.15 - j * 0.04, '#b8b0a4');
    for (let j = 0; j < 9; j++) P.box(0.27, 0.02, 0.6, -1.2 + j * 0.27 + 0.135, H / 2 - 0.12, fz + 0.3, j % 2 ? '#ffffff' : '#2f8a5a', [-0.45, 0, 0]); for (let j = 0; j < 9; j++) P.add(cyl(0.135, 0.135, 0.03, 10, false, 0, Math.PI), -1.2 + j * 0.27 + 0.135, H / 2 - 0.27, fz + 0.57, j % 2 ? '#ffffff' : '#2f8a5a', [Math.PI / 2, 0, Math.PI]);
    for (const s of [-1.22, 0.3]) { P.add(cyl(0.12, 0.09, 0.22, 10), s, -H / 2 + 0.11, fz + 0.18, '#c0553a'); P.add(sph(0.17, 10, 8), s, -H / 2 + 0.34, fz + 0.18, '#4f8a36'); P.add(sph(0.05, 6, 5), s + 0.06, -H / 2 + 0.42, fz + 0.3, '#e0574a'); }
    add(P.build(), vcM, 0, 0, 0, f0); }
  // the roof (rides on the top floor): parapet, chimney, water tank, sky-castle turrets + flags
  Wd.roof = group(0, 0, 0, Wd.tower); { const r = Wd.roof, P = parts(); P.box(TW + 0.2, 0.14, TD + 0.2, 0, 0.07, 0, '#c62f36');
    for (const [w, d, x, z] of [[TW + 0.2, 0.14, 0, TD / 2 + 0.03], [TW + 0.2, 0.14, 0, -TD / 2 - 0.03], [0.14, TD + 0.2, TW / 2 + 0.03, 0], [0.14, TD + 0.2, -TW / 2 - 0.03, 0]]) P.box(w, 0.32, d, x, 0.3, z, STONE);
    P.box(0.34, 0.7, 0.34, -0.8, 0.5, -0.7, '#a8605a').box(0.42, 0.08, 0.42, -0.8, 0.88, -0.7, STONE); P.add(cyl(0.3, 0.3, 0.6, 14), 0.75, 0.75, -0.75, '#8a6a4a').add(new THREE.ConeGeometry(0.34, 0.25, 14), 0.75, 1.17, -0.75, '#6a4a32'); for (const [x, z] of [[0.55, -0.55], [0.95, -0.55], [0.55, -0.95], [0.95, -0.95]]) P.box(0.04, 0.45, 0.04, x, 0.3, z, '#3b2a20');
    add(P.build(), vcM, 0, 0, 0, r);
    Wd.turrets = group(0, 0, 0, r); const sm = texM(PAINT.stone(4, 40, 10, 76), 1, 1); for (const [x, z] of [[-1.1, -1.0], [1.1, -1.0], [-1.1, 1.0], [1.1, 1.0]]) { add(cyl(0.28, 0.3, 1.0, 14), sm, x, 0.6, z, Wd.turrets); for (let j = 0; j < 6; j++) { const a = j / 6 * 6.28; add(box(0.1, 0.12, 0.1), sm, x + Math.cos(a) * 0.28, 1.15, z + Math.sin(a) * 0.28, Wd.turrets); } add(new THREE.ConeGeometry(0.38, 0.6, 14), '#6b3c8f', x, 1.5, z, Wd.turrets); add(cyl(0.02, 0.02, 0.5, 6), '#3b3f4a', x, 2.0, z, Wd.turrets); const fl = add(new THREE.PlaneGeometry(0.34, 0.2, 4, 1), toon({ color: '#f4d35e', side: THREE.DoubleSide }), x + 0.17, 2.14, z, Wd.turrets); fl.userData.base = fl.geometry.attributes.position.array.slice(); Wd.life.push((t) => { const p = fl.geometry.attributes.position, b = fl.userData.base; for (let k = 0; k < p.count; k++) p.setZ(k, Math.sin(t * 6 + b[k * 3] * 14 + x) * 0.04 * (b[k * 3] + 0.17)); p.needsUpdate = true; }); add(box(0.12, 0.2, 0.04), '#2b1f1c', x, 0.55, z + (z > 0 ? 0.29 : -0.29), Wd.turrets); } }
  // outside stairs (right side) + the elevator rail and cab (left side)
  Wd.stairs = []; for (let i = 0; i < 14; i++) { const s = group(TW / 2 + 0.35, i * H, TZ); const up = i % 2 ? -1 : 1; const st = add(box(0.5, 0.06, Math.hypot(1.6, H)), '#8a5734', 0, H / 2, 0, s); st.rotation.x = -up * Math.atan2(H, 1.6); for (let k = 0; k < 5; k++) add(box(0.5, 0.05, 0.12), '#6a4a32', 0, 0.12 + k * H / 5, up * (-0.65 + k * 0.32), s); add(box(0.5, 0.05, 0.5), '#6a4a32', 0, H, up * 1.0, s); add(box(0.03, 0.5, 1.8), '#2b2f3d', 0.25, H / 2 + 0.3, 0, s).rotation.x = -up * Math.atan2(H, 1.6); s.visible = false; Wd.stairs.push(s); }
  Wd.rail = add(box(0.08, 1, 0.08), '#3b3f4a', -TW / 2 - 0.45, 0, TZ + 0.9, scene); Wd.rail.visible = false;
  Wd.cab = group(-TW / 2 - 0.5, 0, TZ + 0.9); { const c = Wd.cab; add(box(0.9, 0.06, 0.8), '#3b3f4a', 0, 0, 0, c); add(box(0.9, 0.06, 0.8), '#3b3f4a', 0, 1.3, 0, c); add(box(0.9, 1.3, 0.05), '#c9a03a', 0, 0.65, -0.38, c); for (const s of [-1, 1]) add(box(0.05, 1.3, 0.8), '#c9a03a', s * 0.43, 0.65, 0, c); add(cyl(0.012, 0.012, 3, 6), '#3b3f4a', 0, 2.8, 0, c); add(sph(0.06, 8, 6), toon({ color: '#fff4c8', emissive: '#ffd27a', emissiveIntensity: 1 }), 0, 1.22, 0, c, { cast: false }); } Wd.cab.visible = false;
  Wd.rope = add(cyl(0.025, 0.025, 1, 6), '#d8c08a', 0, 0, 0, scene, { cast: false }); Wd.rope.visible = false;

  // ---------- the neighbor's house (1 floor, then +2): shutters, flower boxes, chimney with smoke ----------
  Wd.nb = group(4.6, 0, TZ); Wd.nbFloors = [];
  const nbC = () => { const [c, g] = cv(512, 256); g.fillStyle = '#cfe0c8'; g.fillRect(0, 0, 512, 256); for (let y = 0; y < 256; y += 20) { g.fillStyle = 'rgba(40,70,40,.08)'; g.fillRect(0, y, 512, 3); } for (const x of [90, 300]) { const gr = g.createLinearGradient(x, 66, x + 120, 170); gr.addColorStop(0, '#d8f0ff'); gr.addColorStop(1, '#4a7ea8'); g.fillStyle = gr; g.fillRect(x, 66, 120, 104); g.fillStyle = '#e8c070'; g.fillRect(x, 66, 22, 104); g.fillRect(x + 98, 66, 22, 104); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.moveTo(x + 30, 66); g.lineTo(x + 52, 66); g.lineTo(x + 30, 110); g.fill(); } g.fillStyle = '#5a3a24'; g.fillRect(0, 238, 512, 18); return c; };
  const nbM = toon({ map: tex(nbC()) }); const nbSide = toon({ color: '#bcd0b4' });
  const nbTrim = (() => { const P = parts(); P.box(2.5, 0.07, 2.3, 0, H / 2 - 0.035, 0, TRIM); for (const x of [-0.52, 0.52]) { const cx = (x < 0 ? 150 : 360) / 512 * 2.4 - 1.2; P.box(0.55, 0.05, 0.12, cx, -0.24, 1.15, STONE); for (const s of [-1, 1]) P.box(0.16, 0.5, 0.04, cx + s * 0.36, 0.0, 1.13, '#2f6b4f'); P.box(0.5, 0.11, 0.13, cx, -0.32, 1.2, '#b0553a'); for (let j = 0; j < 5; j++) P.add(sph(0.05, 6, 5), cx - 0.18 + j * 0.09, -0.24, 1.2, ['#e0574a', '#f4d35e', '#ffffff'][j % 3]); } return P.build(); })();
  for (let i = 0; i < 3; i++) { const f = add(new THREE.BoxGeometry(2.4, H, 2.2), [nbSide, nbSide, nbSide, nbSide, nbM, nbSide], 0, i * H + H / 2, 0, Wd.nb); add(nbTrim, vcM, 0, 0, 0, f); Wd.nbFloors.push(f); }
  Wd.nbRoof = add(new THREE.ConeGeometry(2.0, 1.0, 4), '#2f6b4f', 0, H + 0.5, 0, Wd.nb); Wd.nbRoof.rotation.y = Math.PI / 4; Wd.nbRoof.scale.z = 0.85;
  add(box(0.55, 0.95, 0.04), '#5a3a24', -0.6, 0.48, 1.12, Wd.nb);
  Wd.smoke = []; for (let i = 0; i < 6; i++) Wd.smoke.push(add(sph(0.16, 10, 8), toon({ color: '#f4f6f8', emissive: '#ffffff', emissiveIntensity: 0.25, transparent: true, opacity: 0.45, depthWrite: false }), 0, -200, 0, scene, { cast: false, noink: true }));
  Wd.life.push((t) => { Wd.smoke.forEach((m, i) => { const u = (t * 0.35 + i / 6) % 1; m.position.set(4.6 + 0.6 + u * 0.6, Wd.nbRoof.position.y + 0.5 + u * 1.6, TZ - 0.4); m.scale.setScalar(0.5 + u * 1.4); }); });

  // ---------- trio: pigeon (with a letter) + goat; the spaghetti ladder (analogy) ----------
  Wd.pigeon = group(0, -200, 0); { const p = Wd.pigeon, gm = toon({ color: '#8a93a6' }); const bd = add(sph(0.14, 16, 12), gm, 0, 0, 0, p); bd.scale.set(1.3, 0.9, 0.9); const hd = group(0.15, 0.12, 0, p); add(sph(0.08, 12, 10), toon({ color: '#6b7488' }), 0, 0, 0, hd); add(sph(0.06, 10, 8), toon({ color: '#5aa88a', metalness: 0.4, roughness: 0.3 }), -0.04, -0.06, 0, hd); add(new THREE.ConeGeometry(0.028, 0.07, 6), '#f4c430', 0.09, -0.01, 0, hd).rotation.z = -Math.PI / 2; for (const s of [-1, 1]) add(sph(0.018, 6, 5), '#1e1714', 0.05, 0.03, s * 0.055, hd);
    Wd.pw1 = add(box(0.16, 0.02, 0.3), gm, -0.02, 0.06, 0.18, p); Wd.pw2 = add(box(0.16, 0.02, 0.3), gm, -0.02, 0.06, -0.18, p); add(box(0.22, 0.14, 0.01), '#f6f1e6', 0.22, -0.02, 0, p).rotation.z = 0.2; add(box(0.05, 0.05, 0.012), '#c62f36', 0.23, -0.02, 0.006, p); add(box(0.12, 0.03, 0.12), '#5a6276', -0.2, 0.02, 0, p); }
  Wd.goat = group(0, -200, 0); { const gt = Wd.goat, wm = toon({ color: '#f2efe6' }), dk = toon({ color: '#3b3f4a' });
    const bd = add(sph(0.3, 16, 12), wm, 0, 0.62, 0, gt); bd.scale.set(1.35, 0.85, 0.75); for (const [x, z] of [[-0.28, -0.12], [-0.28, 0.12], [0.28, -0.12], [0.28, 0.12]]) { add(cyl(0.045, 0.04, 0.42, 8), wm, x, 0.21, z, gt); add(cyl(0.05, 0.05, 0.06, 8), dk, x, 0.03, z, gt); }
    const hd = group(0.42, 0.88, 0, gt); add(sph(0.15, 14, 10), wm, 0.06, 0, 0, hd).scale.set(1.3, 1, 0.9); add(sph(0.08, 10, 8), '#e8b8a8', 0.25, -0.05, 0, hd); for (const s of [-1, 1]) { add(new THREE.ConeGeometry(0.03, 0.24, 6), dk, -0.04, 0.18, s * 0.07, hd).rotation.z = 0.6; add(sph(0.028, 8, 6), '#1e1714', 0.14, 0.05, s * 0.11, hd); add(sph(0.05, 8, 6), wm, -0.02, 0.04, s * 0.16, hd).scale.set(1.6, 0.5, 0.8); }
    add(new THREE.ConeGeometry(0.04, 0.14, 6), wm, 0.22, -0.17, 0, hd).rotation.z = Math.PI; Wd.goatHead = hd; add(new THREE.ConeGeometry(0.04, 0.12, 6), wm, -0.42, 0.75, 0, gt).rotation.z = 1.0; }
  Wd.ladder = group(-9, 0, -0.6); { const L = Wd.ladder, nm = toon({ color: '#f2d27a' });
    for (const s of [-1, 1]) { const pts = []; for (let k = 0; k <= 12; k++) pts.push(new THREE.Vector3(s * 0.32 + Math.sin(k * 0.9) * 0.03, k * 0.28, 0)); add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.045, 8), nm, 0, 0, 0, L); }
    for (let k = 1; k < 12; k++) add(cyl(0.035, 0.035, 0.64, 8), nm, 0, k * 0.28, 0, L).rotation.z = Math.PI / 2 + Math.sin(k) * 0.08;
    add(cyl(0.5, 0.4, 0.3, 18), '#f4f1e8', 0.9, 0.15, 0.3, L); add(sph(0.38, 14, 10), '#f2d27a', 0.9, 0.3, 0.3, L).scale.y = 0.35; add(sph(0.06, 8, 6), '#c62f36', 0.8, 0.42, 0.4, L); add(sph(0.06, 8, 6), '#c62f36', 1.0, 0.42, 0.25, L); }
  add(tbox(3.0, 4.0, 0.4, 1), texM(PAINT.stone(5, 40, 8, 80), 2, 2), -9, 2.0, -1.2, scene);

  // FX pools
  Wd.confetti = []; for (let i = 0; i < 70; i++) Wd.confetti.push(add(box(0.1, 0.06, 0.01), ['#c62f36', '#f4d35e', '#2a5fae', '#3fa39a', '#e07a5f'][i % 5], 0, -200, 0, scene, { cast: false }));
  Wd.sparks = []; for (let i = 0; i < 24; i++) Wd.sparks.push(add(sph(0.04, 6, 4), toon({ color: '#fff6c8', emissive: '#ffe9a0', emissiveIntensity: 1.6 }), 0, -200, 0, scene, { cast: false }));
  Wd.leaves = []; for (let i = 0; i < 16; i++) Wd.leaves.push(add(box(0.12, 0.02, 0.08), '#6fae45', 0, -200, 0, scene, { cast: false }));
  Wd.tick = (t) => { for (const f of Wd.life) f(t); };
  return Wd;
})();
