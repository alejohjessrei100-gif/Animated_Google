// SCENERY: the house-standard storybook world kit (from "The Sinking Tower"). Load after engine.js + paint.js, before world.js.
// Usage in world.js:  const S = SCENERY.create();  S.backdrop(); S.clouds(); S.cottage(x, z, w, seed); S.street(parent, zFront); ... and call S.tick(t) from Wd.tick.
// Every builder only adds to ENGINE.scene (or a parent you pass); nothing is built until you call it.
window.SCENERY = { create: (seed = 9) => {
  const E = ENGINE, { add, box, tbox, group, toon, texM, scene } = E;
  const S = { life: [], chimneys: [] }; const R = PAINT.rng(seed);
  const cyl = (rt, rb, h, n = 20, open = false, t0 = 0, tl = Math.PI * 2) => new THREE.CylinderGeometry(rt, rb, h, n, 1, open, t0, tl);
  const sph = (r, a = 16, b = 12) => new THREE.SphereGeometry(r, a, b);
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  const tex = (c, rx = 1, ry = 1) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; return t; };
  Object.assign(S, { R, cyl, sph, cv, tex });

  // ---------- merge helper: many small parts -> one vertex-coloured mesh (keep detail cheap) ----------
  const vcM = toon({ vertexColors: true, roughness: 0.7 });
  const parts = () => { const list = []; const api = {
    add(geo, x, y, z, col, rot = [0, 0, 0], scl = [1, 1, 1]) { const g = (geo.index ? geo.toNonIndexed() : geo.clone()); const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...scl)); g.applyMatrix4(m); g.userData.col = new THREE.Color(col); list.push(g); return api; },
    box(w, h, d, x, y, z, col, rot, scl) { return api.add(new THREE.BoxGeometry(w, h, d), x, y, z, col, rot, scl); },
    build() { let n = 0; list.forEach((g) => { n += g.attributes.position.count; }); const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
      list.forEach((g) => { const p = g.attributes.position, q = g.attributes.normal, c = g.userData.col; for (let i = 0; i < p.count; i++, o++) { pos[o * 3] = p.getX(i); pos[o * 3 + 1] = p.getY(i); pos[o * 3 + 2] = p.getZ(i); nor[o * 3] = q.getX(i); nor[o * 3 + 1] = q.getY(i); nor[o * 3 + 2] = q.getZ(i); col[o * 3] = c.r; col[o * 3 + 1] = c.g; col[o * 3 + 2] = c.b; } });
      const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); out.setAttribute('color', new THREE.BufferAttribute(col, 3)); out.computeBoundingSphere(); return out; } }; return api; };

  S.parts = parts; S.vcM = vcM;

  // ---------- trees ----------
  function tree(x, z, parent) { const t = group(x, 0, z, parent); const s = 0.9 + R() * 0.4; add(cyl(0.13 * s, 0.2 * s, 1.8 * s, 8), '#6a4a32', 0, 0.9 * s, 0, t); add(cyl(0.05, 0.07, 0.8 * s, 6), '#6a4a32', 0.25 * s, 1.6 * s, 0, t).rotation.z = -0.7;
    const cs = ['#4f8a36', '#5f9a3c', '#6fae45', '#7fbe52']; for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28; add(sph((0.55 + R() * 0.3) * s, 12, 10), cs[(k + 1) % 4], Math.cos(a) * 0.45 * s, (2.0 + (k % 3) * 0.3) * s, Math.sin(a) * 0.4 * s, t); } add(sph(0.6 * s, 12, 10), cs[3], 0, 2.7 * s, 0, t); return t; }
  S.tree = tree;

  // ---------- painted backdrop: sky, sun glow, 3 mountain ranges, rolling hills, fields, castle, windmill, balloon ----------
  S.backdrop = () => {
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
  { const wm = group(16, 0, -26); add(cyl(0.9, 1.4, 5, 10), '#efe6d2', 0, 2.5, 0, wm); add(new THREE.ConeGeometry(1.25, 1.4, 10), '#8a5734', 0, 5.7, 0, wm); const bl = group(0, 4.8, 1.3, wm); for (let k = 0; k < 4; k++) { const a = group(0, 0, 0, bl); a.rotation.z = k * Math.PI / 2; add(box(0.25, 3.2, 0.05), '#f6f1e6', 0, 1.7, 0, a); add(box(0.06, 3.2, 0.06), '#6a4a32', -0.14, 1.7, 0.02, a); } add(sph(0.2, 10, 8), '#6a4a32', 0, 0, 0, bl); S.life.push((t) => { bl.rotation.z = -t * 0.9; }); }
  { const b = group(-10, 26, -30); const n = 12; for (let k = 0; k < n; k++) add(new THREE.SphereGeometry(2.2, 24, 16, k / n * Math.PI * 2, Math.PI * 2 / n), k % 2 ? '#e0574a' : '#f4d35e', 0, 0, 0, b); add(box(0.9, 0.7, 0.9), '#8a5734', 0, -3.0, 0, b); for (const [x, z] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]]) add(cyl(0.02, 0.02, 1.2, 4), '#3b3f4a', x * 1.6, -2.1, z * 1.6, b); S.life.push((t) => { b.position.set(-10 + t * 0.35, 26 + Math.sin(t * 0.5) * 0.8, -30); b.rotation.y = t * 0.1; }); }
  // puffy flat-bottomed clouds at many heights (the tower climbs through them)
  };

  // painted storybook clouds: soft white tops, blue-grey shaded undersides, flat-ish bottoms, a thin outline (no 3D lumps)
  const cloudTex = (seed) => { const r = PAINT.rng(seed); const [c, g] = cv(1024, 512); const base = 400, blobs = [];
    const n = 6 + Math.floor(r() * 4); for (let k = 0; k < n; k++) { const u = (k + 0.5) / n, x = 110 + u * 800 + (r() - 0.5) * 40, rad = (90 + r() * 70) * (0.55 + 0.45 * Math.sin(u * Math.PI)); blobs.push([x, base - rad * (0.55 + r() * 0.3), rad]); }
    for (let k = 0; k < 3; k++) { const x = 300 + r() * 420, rad = 120 + r() * 50; blobs.push([x, base - rad * 1.05 - 40, rad]); }
    g.save(); g.beginPath(); g.rect(0, 0, 1024, base + 2); g.clip();
    g.fillStyle = 'rgba(70,95,130,.55)'; for (const [x, y, rad] of blobs) { g.beginPath(); g.arc(x, y, rad + 7, 0, 7); g.fill(); }
    const gr = g.createLinearGradient(0, 60, 0, base); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.55, '#f6f9ff'); gr.addColorStop(1, '#c6d6ea'); g.fillStyle = gr; for (const [x, y, rad] of blobs) { g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill(); }
    for (const [x, y, rad] of blobs) { const hg = g.createRadialGradient(x - rad * 0.3, y - rad * 0.4, rad * 0.05, x - rad * 0.2, y - rad * 0.3, rad * 0.9); hg.addColorStop(0, 'rgba(255,255,255,.9)'); hg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = hg; g.beginPath(); g.arc(x, y, rad * 0.95, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(150,175,205,.35)'; g.fillRect(0, base - 40, 1024, 42); g.restore();
    g.strokeStyle = 'rgba(70,95,130,.55)'; g.lineWidth = 7; g.beginPath(); g.moveTo(blobs[0][0] - blobs[0][2] * 0.8, base); g.lineTo(blobs[n - 1][0] + blobs[n - 1][2] * 0.8, base); g.stroke();
    const t = tex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; };
  const cloudMats = [1, 2, 3, 4, 5, 6].map((k) => new THREE.MeshBasicMaterial({ map: cloudTex(k * 13), transparent: true, depthWrite: false, fog: false, toneMapped: false, color: '#f4f7fc' }));
  const cloud = (x, y, z, s = 1, parent = scene) => { const cl = group(x, y, z, parent); const m = add(new THREE.PlaneGeometry(7 * s, 3.5 * s), cloudMats[Math.floor(R() * cloudMats.length)], 0, 0.9 * s, 0, cl, { cast: false, noink: true }); m.scale.x = R() < 0.5 ? -1 : 1; m.renderOrder = -1; return cl; };
  S.cloud = cloud;
  // a sky full of drifting clouds at many heights
  S.clouds = ({ n = 34, y0 = 10, dy = 2.8, zNear = -12, zFar = -38, spread = 60, far = 7 } = {}) => { for (let i = 0; i < n; i++) { const cl = cloud(-spread / 2 + R() * spread, y0 + i * dy, zNear - R() * (zNear - zFar), 0.9 + R() * 0.9); const x0 = cl.position.x, sp = 0.12 + R() * 0.15; S.life.push((t) => { cl.position.x = x0 + t * sp; }); } for (let i = 0; i < far; i++) cloud(-60 + i * 20 + R() * 6, 30 + R() * 14, -100, 3 + R() * 2); };

  // ---------- houses: timber / brick / plaster walls, shingle gable roofs, dormers, chimneys (+smoke), porches, gardens ----------
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
  S.chimneys = [];
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
    const chx = (r() - 0.5) * w * 0.6; P.box(0.3, 0.9, 0.3, chx, h + rh - 0.1, -0.25, style === 'brick' ? '#8a3a2a' : '#a8605a').box(0.38, 0.08, 0.38, chx, h + rh + 0.38, -0.25, '#7a7068'); S.chimneys.push([x + chx, h + rh + 0.45, z - 0.25]);
    // front garden: hedge, gate, flowers, a little lamp
    for (let k = 0; k < 7; k++) { const hx = -w / 2 + 0.2 + k * (w - 0.4) / 6; if (Math.abs(hx - doorX) < 0.4) continue; P.add(sph(0.2, 8, 6), hx, 0.2, d / 2 + 0.95, ['#4f8a36', '#5f9a3c'][k % 2], [0, 0, 0], [1.2, 0.9, 0.9]); }
    for (let k = 0; k < 10; k++) P.add(sph(0.04, 6, 5), -w / 2 + r() * w, 0.12, d / 2 + 0.7 + r() * 0.15, ['#e0574a', '#f4d35e', '#c0306a', '#ffffff', '#8a6ad8'][k % 5]);
    add(P.build(), vcM, 0, 0, 0, g); return g; };
  S.smoke = () => { S.chSmoke = []; for (let i = 0; i < S.chimneys.length * 3; i++) S.chSmoke.push(add(sph(0.14, 10, 8), toon({ color: '#f4f6f8', emissive: '#ffffff', emissiveIntensity: 0.25, transparent: true, opacity: 0.45, depthWrite: false }), 0, -200, 0, scene, { cast: false, noink: true }));
  S.life.push((t) => { S.chSmoke.forEach((m, i) => { const c = S.chimneys[Math.floor(i / 3)], u = (t * 0.3 + (i % 3) / 3 + c[0] * 0.13) % 1; m.position.set(c[0] + u * 0.7, c[1] + u * 1.4, c[2]); m.scale.setScalar(0.5 + u * 1.5); }); }); };
  S.cottage = cottage; S.roofMat = roofMat; S.wallMat = wallMat; S.ROOFC = ROOFC;
  // a row of houses: list of [x, width] at depth z (seed picks style/colours)
  S.houseRow = (list, z, seed0 = 1, wobble = 0) => list.forEach(([x, w], i) => { const c = cottage(x, z - (wobble ? (i % 2) * wobble : 0), w, i + seed0); if (wobble) c.rotation.y = (i % 3 - 1) * 0.06; });

  // ---------- far town on the hills: painted facades + shingle roofs ----------
  S.farTown = () => {
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
  };

  // ---------- street: cobbles, kerbs, sidewalks, lamps, picket fence, flowers, bench, mailbox (on a parent group) ----------
  S.street = (L, ZF, { X0 = -40, X1 = 40, gaps = [[-1.8, 1.8], [3.2, 6.0]] } = {}) => { const gap = (x) => gaps.some(([a, b]) => x > a && x < b);
    const cobC = () => { const [c, g] = cv(512, 256); g.fillStyle = '#8e8476'; g.fillRect(0, 0, 512, 256); for (let y = 0; y < 256; y += 32) for (let x = (y / 32) % 2 * 24; x < 512; x += 48) { g.fillStyle = ['#b0a494', '#a29684', '#988c7a', '#ab9f8e'][(x * 7 + y) % 4]; g.beginPath(); g.roundRect(x + 2, y + 2, 44, 28, 8); g.fill(); g.strokeStyle = 'rgba(40,30,20,.55)'; g.lineWidth = 2; g.stroke(); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + 6, y + 5, 30, 4); } return c; };
    const cobM = texM(cobC(), 22, 1); add(new THREE.BoxGeometry(X1 - X0, 0.04, 2.2), cobM, 0, 0.02, ZF + 2.2, L, { cast: false });
    const swC = () => { const [c, g] = cv(256, 256); g.fillStyle = '#cfc8bc'; g.fillRect(0, 0, 256, 256); g.strokeStyle = 'rgba(80,70,60,.35)'; g.lineWidth = 3; for (let x = 0; x <= 256; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); } g.beginPath(); g.moveTo(0, 128); g.lineTo(256, 128); g.stroke(); return c; };
    const swM = texM(swC(), 40, 1); add(new THREE.BoxGeometry(X1 - X0, 0.1, 0.9), swM, 0, 0.05, ZF + 0.6, L); add(new THREE.BoxGeometry(X1 - X0, 0.1, 0.7), swM, 0, 0.05, ZF + 3.65, L);
    add(new THREE.BoxGeometry(X1 - X0, 0.12, 0.08), '#a8a096', 0, 0.06, ZF + 1.1, L); add(new THREE.BoxGeometry(X1 - X0, 0.12, 0.08), '#a8a096', 0, 0.06, ZF + 3.3, L);
    for (let x = -10.8; x <= 12; x += 3.6) { if (gap(x)) continue; const lp = group(x, 0.1, ZF + 1.0, L); add(cyl(0.05, 0.07, 2.2, 8), '#2b2f3d', 0, 1.1, 0, lp); add(cyl(0.12, 0.12, 0.1, 8), '#2b2f3d', 0, 0.05, 0, lp); add(box(0.04, 0.04, 0.3), '#2b2f3d', 0, 2.15, -0.12, lp); const gl = add(new THREE.ConeGeometry(0.16, 0.22, 6), '#2b2f3d', 0, 2.3, -0.28, lp); add(sph(0.09, 10, 8), toon({ color: '#fff4c8', emissive: '#ffd27a', emissiveIntensity: 0.9 }), 0, 2.16, -0.28, lp, { cast: false }); }
    for (let x = -20; x <= 20; x += 0.5) { if (gap(x)) continue; add(box(0.07, 0.5, 0.05), '#f6f1e6', x, 0.35, ZF + 0.15, L); } add(box(18, 0.05, 0.04), '#f6f1e6', -10.9, 0.5, ZF + 0.15, L); add(box(14, 0.05, 0.04), '#f6f1e6', 13.1, 0.5, ZF + 0.15, L);
    const fl = ['#e0574a', '#f4d35e', '#c0306a', '#ffffff', '#8a6ad8']; for (let k = 0; k < 160; k++) { const x = (R() - 0.5) * 36; if (gap(x)) continue; add(sph(0.05, 6, 5), fl[k % 5], x, 0.12 + R() * 0.1, ZF + 0.05 + R() * 0.08, L, { cast: false }); }
    for (let k = 0; k < 220; k++) { const x = X0 + R() * (X1 - X0), z = ZF + 4.1 + R() * 12; add(new THREE.ConeGeometry(0.035, 0.2, 4), k % 2 ? '#4c8a30' : '#5f9a3c', x, 0.1, z, L, { cast: false }); }
    { const b = group(-3.4, 0.1, ZF + 0.55, L); add(box(1.2, 0.06, 0.36), '#8a5734', 0, 0.42, 0, b); add(box(1.2, 0.3, 0.05), '#8a5734', 0, 0.62, -0.16, b); for (const s of [-1, 1]) add(box(0.05, 0.42, 0.36), '#2b2f3d', s * 0.5, 0.21, 0, b); }
    { const m = group(2.6, 0.1, ZF + 0.55, L); add(box(0.06, 0.9, 0.06), '#2b2f3d', 0, 0.45, 0, m); add(box(0.32, 0.26, 0.44), '#2a5fae', 0, 1.0, 0, m); add(cyl(0.16, 0.16, 0.44, 12, false, 0, Math.PI), '#2a5fae', 0, 1.13, 0, m).rotation.x = Math.PI / 2; add(box(0.03, 0.18, 0.03), '#c62f36', 0.17, 1.12, 0.1, m); }
  };

  S.tick = (t) => { for (const f of S.life) f(t); };
  return S;
} };
