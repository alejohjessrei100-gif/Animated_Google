// Set detail pass: every set gets real furniture, clutter in every corner, wall dressing and life (docs/08 set bar).
// Loaded after world.js. All props are 3D geometry with the ink outline.
(() => {
  const E = ENGINE, Wd = WORLD, M = Wd.M, { add, box, tbox, group, sign, col, toon, label } = E;
  const R = PAINT.rng(808);
  const cyl = (rt, rb, h, n = 16) => new THREE.CylinderGeometry(rt, rb, h, n);
  const sph = (r, a = 16, b = 12) => new THREE.SphereGeometry(r, a, b);
  const pick = (a) => a[(R() * a.length) | 0];
  const BOOK = ['#c62f36', '#2a5fae', '#3fa39a', '#f4d35e', '#8a5734', '#6b3c8f', '#e07a5f', '#2f6b4f'];
  Wd.life = [];

  // ---------- furniture & clutter kit ----------
  const shelf = (p, x, y, z, w = 1.4, rows = 3, ry = 0, wood = '#7a4a2a') => { const g = group(x, y, z, p); g.rotation.y = ry; const h = rows * 0.42 + 0.08;
    add(tbox(w, h, 0.32), wood, 0, h / 2, -0.02, g); add(box(w - 0.08, h - 0.08, 0.3), '#3a2414', 0, h / 2, 0.01, g);
    for (let r_ = 0; r_ < rows; r_++) { const yy = 0.06 + r_ * 0.42; add(box(w - 0.06, 0.04, 0.3), wood, 0, yy, 0.02, g); let xx = -w / 2 + 0.08;
      while (xx < w / 2 - 0.12) { const bw = 0.04 + R() * 0.05, bh = 0.22 + R() * 0.12; if (R() < 0.12) { add(cyl(0.06, 0.06, 0.14, 10), pick(BOOK), xx + 0.06, yy + 0.09, 0.05, g); xx += 0.14; continue; }
        const b = add(box(bw, bh, 0.22), pick(BOOK), xx + bw / 2, yy + 0.02 + bh / 2, 0.04, g, { cast: false }); if (R() < 0.15) b.rotation.z = 0.25; xx += bw + 0.008; } }
    return g; };
  const plant = (p, x, z, s = 1, y = 0) => { const g = group(x, y, z, p); g.scale.setScalar(s); add(cyl(0.16, 0.12, 0.3, 14), '#c0623a', 0, 0.15, 0, g); add(cyl(0.165, 0.165, 0.04, 14), '#a8502e', 0, 0.3, 0, g);
    for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, l = add(sph(0.12, 10, 8), k % 2 ? '#5f9a3c' : '#4c8a30', Math.cos(a) * 0.12, 0.45 + (k % 3) * 0.1, Math.sin(a) * 0.12, g); l.scale.set(0.7, 1.6, 0.4); l.rotation.set(Math.sin(a) * 0.5, a, Math.cos(a) * 0.5); }
    Wd.life.push((t) => { g.rotation.z = Math.sin(t * 1.3 + x) * 0.03; }); return g; };
  const frame = (p, x, y, z, w, h, art, ry = 0) => { const g = group(x, y, z, p); g.rotation.y = ry; add(box(w + 0.1, h + 0.1, 0.04), '#8a5734', 0, 0, 0, g);
    const c = document.createElement('canvas'); c.width = 256; c.height = Math.round(256 * h / w); const q = c.getContext('2d'); art(q, c.width, c.height);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; add(new THREE.PlaneGeometry(w, h), toon({ map: t, roughness: 0.6 }), 0, 0, 0.022, g, { cast: false }); return g; };
  const art = { horse: (q, w, h) => { q.fillStyle = '#9fd0a0'; q.fillRect(0, 0, w, h); q.fillStyle = '#6b4a2a'; q.beginPath(); q.ellipse(w * .5, h * .55, w * .25, h * .16, 0, 0, 7); q.fill(); q.fillRect(w * .3, h * .62, 8, h * .25); q.fillRect(w * .65, h * .62, 8, h * .25); q.beginPath(); q.ellipse(w * .78, h * .4, w * .08, h * .07, -.6, 0, 7); q.fill(); q.fillStyle = '#c62f36'; q.fillRect(w * .42, h * .42, 20, 10); },
    face: (q, w, h) => { q.fillStyle = '#e6d3a8'; q.fillRect(0, 0, w, h); q.fillStyle = '#fbfaf4'; q.beginPath(); q.arc(w / 2, h * .42, w * .22, 0, 7); q.fill(); q.lineWidth = 6; q.strokeStyle = '#2b1f1c'; q.stroke(); q.fillStyle = '#2b1f1c'; q.fillRect(w * .42, h * .38, 8, 14); q.fillRect(w * .55, h * .38, 8, 14); q.fillStyle = '#2a5fae'; q.fillRect(w * .3, h * .66, w * .4, h * .34); },
    sea: (q, w, h) => { const g = q.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffb27a'); g.addColorStop(.55, '#ffe2b0'); g.addColorStop(.56, '#3f7fc4'); g.addColorStop(1, '#2a5fae'); q.fillStyle = g; q.fillRect(0, 0, w, h); q.fillStyle = '#fff2c4'; q.beginPath(); q.arc(w * .7, h * .5, 26, 0, 7); q.fill(); },
    map: (q, w, h) => { q.fillStyle = '#bfe0f6'; q.fillRect(0, 0, w, h); q.fillStyle = '#9fd08a'; for (let i = 0; i < 6; i++) { q.beginPath(); q.ellipse(30 + R() * (w - 60), 30 + R() * (h - 60), 20 + R() * 40, 14 + R() * 30, R() * 3, 0, 7); q.fill(); } q.strokeStyle = '#c62f36'; q.lineWidth = 3; q.strokeRect(4, 4, w - 8, h - 8); },
    abc: (q, w, h) => { q.fillStyle = '#fbfaf4'; q.fillRect(0, 0, w, h); q.font = `${h * .6}px "Lilita One"`; q.textAlign = 'center'; q.textBaseline = 'middle'; ['A', 'B', 'C', 'D'].forEach((L, i) => { q.fillStyle = BOOK[i]; q.fillText(L, w * (i + .5) / 4, h / 2); }); } };
  const cabinet = (p, x, z, h = 1.3, ry = 0, c = '#7f8896') => { const g = group(x, 0, z, p); g.rotation.y = ry; add(tbox(0.5, h, 0.55), c, 0, h / 2, 0, g); const n = Math.round(h / 0.32);
    for (let i = 0; i < n; i++) { add(box(0.44, h / n - 0.04, 0.02), E.col(c), 0, (i + 0.5) * h / n, 0.285, g); add(box(0.14, 0.03, 0.03), '#d8dde6', 0, (i + 0.5) * h / n + 0.05, 0.3, g); } return g; };
  const ladder = (p, x, z, h = 2.4, ry = 0, lean = 0.25) => { const g = group(x, 0, z, p); g.rotation.set(-lean, ry, 0); for (const s of [-1, 1]) add(box(0.05, h, 0.05), '#b07a45', s * 0.2, h / 2, 0, g); for (let k = 1; k < h / 0.3; k++) add(box(0.4, 0.03, 0.04), '#b07a45', 0, k * 0.3, 0, g); return g; };
  const bucket = (p, x, z, c = '#7f8896', y = 0) => { const g = group(x, y, z, p); add(cyl(0.14, 0.11, 0.26, 16), c, 0, 0.13, 0, g); add(new THREE.TorusGeometry(0.14, 0.008, 6, 16, Math.PI), '#3b3f4a', 0, 0.26, 0, g); return g; };
  const cord = (p, pts, r = 0.02, c = '#2b2f38') => add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q))), 48, r, 6), c, 0, 0, 0, p, { cast: false });
  const papers = (p, x, y, z, n, spread = 0.4) => { for (let i = 0; i < n; i++) { const m = add(box(0.21, 0.003, 0.28), i % 4 ? '#fbfaf4' : '#f6e27a', x + (R() - 0.5) * spread, y + i * 0.003, z + (R() - 0.5) * spread, p, { cast: false }); m.rotation.y = R() * 3; } };
  const bulb = (p, x, y, z, len = 0.7) => { const g = group(x, y, z, p); add(cyl(0.006, 0.006, len, 4), '#2b2f38', 0, -len / 2, 0, g); add(sph(0.06, 10, 8), toon({ color: '#fff6c8', emissive: '#ffe9a0', emissiveIntensity: 1.2 }), 0, -len - 0.04, 0, g); Wd.life.push((t) => { g.rotation.z = Math.sin(t * 1.1 + x) * 0.06; g.rotation.x = Math.sin(t * 0.8 + z) * 0.04; }); return g; };
  const chairB = (p, x, z, ry = 0, c = '#8a5734') => { const g = group(x, 0, z, p); g.rotation.y = ry; add(tbox(0.45, 0.06, 0.45), c, 0, 0.46, 0, g); for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(box(0.04, 0.46, 0.04), c, sx * 0.19, 0.23, sz * 0.19, g); add(tbox(0.45, 0.06, 0.04), c, 0, 0.9, -0.2, g); for (const sx of [-1, 0, 1]) add(box(0.03, 0.44, 0.03), c, sx * 0.18, 0.68, -0.2, g); return g; };
  const crate = (p, x, y, z, s, txt) => { const g = group(x, y, z, p); add(tbox(s, s, s, 0.5), M.planks, 0, s / 2, 0, g); for (const k of [-1, 1]) add(box(s + 0.01, 0.05, 0.04), '#6a4a32', 0, s / 2 + k * s * 0.32, s / 2, g); if (txt) sign(g, [txt], 0, s / 2, s / 2 + 0.02, s * 0.75, s * 0.3, { d: 0.01, bg: '#efe3c4' }); return g; };
  const barrel = (p, x, z, c = '#8a5734') => { const g = group(x, 0, z, p); add(cyl(0.26, 0.26, 0.8, 18), c, 0, 0.4, 0, g); for (const y of [0.12, 0.68]) add(new THREE.TorusGeometry(0.262, 0.015, 6, 22), '#3b3f4a', 0, y, 0, g).rotation.x = Math.PI / 2; return g; };
  const cat = (p, x, y, z, c = '#2b2f38') => { const g = group(x, y, z, p); add(sph(0.13, 12, 10), c, 0, 0.12, 0, g).scale.set(1.5, 0.9, 0.9); const h = add(sph(0.09, 12, 10), c, 0.2, 0.22, 0, g); for (const s of [-1, 1]) add(new THREE.ConeGeometry(0.03, 0.06, 4), c, 0.22, 0.31, s * 0.045, g); const tl = add(cyl(0.02, 0.015, 0.3, 6), c, -0.24, 0.25, 0, g); Wd.life.push((t) => { tl.rotation.z = 0.5 + Math.sin(t * 2.5 + x) * 0.5; h.position.y = 0.22 + Math.abs(Math.sin(t * 0.7)) * 0.015; }); return g; };
  const flyer = (p, x, y, z, ry, lines, bg = '#fbfaf4') => sign(p, lines, x, y, z, 0.45, 0.6, { ry, d: 0.005, bg, frame: '#e6e0d0' });

  // ================= STUDIO =================
  const ST = Wd.studio;
  // painted skyline flats either side of the machines
  const sky = document.createElement('canvas'); sky.width = 1024; sky.height = 512; { const q = sky.getContext('2d'); const g = q.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, '#1d2a6a'); g.addColorStop(1, '#6a4aa0'); q.fillStyle = g; q.fillRect(0, 0, 1024, 512); q.fillStyle = '#fff6c8'; for (let i = 0; i < 80; i++) q.fillRect(R() * 1024, R() * 260, 2, 2); let x = 0; while (x < 1024) { const w = 40 + R() * 70, h = 120 + R() * 220; q.fillStyle = '#141a40'; q.fillRect(x, 512 - h, w, h); q.fillStyle = '#ffd860'; for (let k = 0; k < 14; k++) if (R() < 0.6) q.fillRect(x + 6 + (k % 3) * 12, 512 - h + 12 + ((k / 3) | 0) * 22, 6, 9); x += w + 4; } }
  const skyT = new THREE.CanvasTexture(sky); skyT.colorSpace = THREE.SRGBColorSpace;
  for (const sx of [-1, 1]) { const g = group(sx * 5.6, 0.22, -5.2, ST); add(new THREE.PlaneGeometry(3.4, 2.6), new THREE.MeshBasicMaterial({ map: skyT }), 0, 2.2, 0.02, g, { cast: false }); for (const yy of [0.9, 3.5]) add(box(3.6, 0.12, 0.12), '#f4d35e', 0, yy, 0.06, g); for (const xx of [-1.75, 1.75]) add(box(0.12, 2.7, 0.12), '#f4d35e', xx, 2.2, 0.06, g); }
  // studio monitors on rolling carts showing LIVE
  const monitor = (x, z, ry) => { const g = group(x, 0, z, ST); g.rotation.y = ry; add(box(0.5, 0.06, 0.5), '#3b3f4a', 0, 0.12, 0, g); for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(sph(0.04, 8, 6), '#2b2f38', sx * 0.2, 0.05, sz * 0.2, g); add(cyl(0.03, 0.03, 0.9, 8), '#7f8896', 0, 0.6, 0, g); add(box(0.62, 0.48, 0.42), '#4a5466', 0, 1.25, 0, g); add(new THREE.PlaneGeometry(0.5, 0.36), new THREE.MeshBasicMaterial({ map: label([{ t: 'LIVE', c: '#ffffff' }, { t: 'CH 11', c: '#f4d35e' }], { w: 256, h: 190, bg: '#2a3a8a', border: null }) }), 0, 1.26, 0.215, g, { cast: false }); return g; };
  monitor(-5.8, 1.6, 0.6); monitor(6.2, 2.6, -0.8);
  // applause sign, boom mic, ladder, cable reel, sandbags, tape marks, coffee cart
  Wd.applause = sign(ST, [{ t: 'APPLAUSE', c: '#ffffff' }], -4.6, 3.9, -5.3, 1.8, 0.5, { bg: '#2a5fae', frame: '#2b2f38', glow: true });
  ladder(ST, -6.9, -3.6, 3.0, 0.4); { const reel = group(-6.0, 0, 3.0, ST); for (const s of [-1, 1]) add(cyl(0.35, 0.35, 0.04, 20), '#b07a45', 0, 0.35, s * 0.15, reel).rotation.x = Math.PI / 2; add(cyl(0.22, 0.22, 0.3, 16), '#2b2f38', 0, 0.35, 0, reel).rotation.x = Math.PI / 2; }
  for (let i = 0; i < 5; i++) { const s = add(sph(0.18, 10, 8), '#a8915f', -6.7 + i * 0.32, 0.08, 4.6, ST); s.scale.set(1.3, 0.5, 0.8); }
  for (const [x, z] of [[-2.1, -1.2], [0, -1.2], [2.1, -1.2], [3.7, 0.2]]) { const t = add(box(0.3, 0.004, 0.05), '#f4d35e', x, 0.226, z, ST, { cast: false }); add(box(0.05, 0.004, 0.3), '#f4d35e', x, 0.226, z, ST, { cast: false }); }
  { const cart = group(6.4, 0, 4.2, ST); add(tbox(0.9, 0.06, 0.5), '#c0c6d0', 0, 0.8, 0, cart); add(tbox(0.9, 0.06, 0.5), '#c0c6d0', 0, 0.3, 0, cart); for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(box(0.03, 0.8, 0.03), '#9aa0aa', sx * 0.42, 0.4, sz * 0.22, cart); add(cyl(0.12, 0.12, 0.3, 14), '#2b2f38', -0.2, 0.98, 0, cart); for (let k = 0; k < 4; k++) add(cyl(0.04, 0.035, 0.1, 10), '#fbfaf4', 0.1 + (k % 2) * 0.1, 0.88, -0.08 + ((k / 2) | 0) * 0.14, cart); add(box(0.25, 0.08, 0.2), '#f6c4d6', 0.25, 0.37, 0, cart); }
  cord(ST, [[3.0, 1.29, -2.6], [3.4, 1.2, -2.2], [3.6, 0.23, -1.9], [4.4, 0.23, -0.8], [5.4, 0.02, 0.6]], 0.025);
  // audience bleacher with seated extras (3D silhouettes in coloured sweaters)
  for (let r_ = 0; r_ < 3; r_++) { add(tbox(3.2, 0.32, 0.7), '#3b4690', -6.0, 0.16 + r_ * 0.32, 1.2 + r_ * 0.7, ST); for (let k = 0; k < 4; k++) { const x = -7.2 + k * 0.8 + (r_ % 2) * 0.3, y = 0.32 + r_ * 0.32, z = 1.2 + r_ * 0.7; add(sph(0.2, 12, 10), pick(['#e07a5f', '#3d5a80', '#81b29a', '#f2cc8f', '#c62f36']), x, y + 0.25, z, ST).scale.set(1, 1.2, 0.8); const hd = add(sph(0.14, 12, 10), '#fbfaf4', x, y + 0.62, z, ST); Wd.life.push((t) => { hd.position.y = y + 0.62 + Math.max(0, Math.sin(t * 3 + k + r_)) * 0.02; }); } }

  // ================= WORKSHOP =================
  const WS = Wd.workshop;
  shelf(WS, 3.0, 0, -2.75, 1.6, 4, 0, '#6a4a32');
  { const v = group(-2.45, 0.95, -2.2, WS); add(box(0.2, 0.12, 0.16), '#2a5fae', 0, 0.06, 0, v); add(box(0.06, 0.1, 0.2), '#2a5fae', -0.08, 0.15, 0, v); add(cyl(0.012, 0.012, 0.3, 6), '#b6bec7', 0.05, 0.15, 0, v).rotation.x = Math.PI / 2; }
  { const tb = group(1.9, 0, 1.9, WS); add(tbox(0.6, 0.3, 0.3), '#c62f36', 0, 0.15, 0, tb); add(box(0.62, 0.04, 0.32), '#a8242c', 0, 0.32, 0, tb); add(new THREE.TorusGeometry(0.12, 0.015, 6, 16, Math.PI), '#2b2f38', 0, 0.34, 0, tb); add(box(0.25, 0.03, 0.06), '#b6bec7', 0.15, 0.33, 0.1, tb).rotation.y = 0.4; }
  ladder(WS, 3.7, -1.2, 2.6, -Math.PI / 2, 0.22);
  { const b = group(-3.5, 0, 1.0, WS); add(cyl(0.015, 0.015, 1.3, 6), '#b07a45', 0, 0.75, 0, b).rotation.z = 0.25; const br = add(box(0.3, 0.14, 0.06), '#f2cc8f', -0.16, 0.06, 0, b); }
  for (const [x, z] of [[-1.8, -1.6], [-0.9, -0.9], [1.2, 0.2], [0.2, 1.4]]) { const d = add(cyl(0.05 + R() * 0.06, 0.05 + R() * 0.06, 0.004, 14), '#fbfaf4', x, 0.003, z, WS, { cast: false }); d.scale.z = 0.7; }
  bucket(WS, 1.6, -1.3, '#7f8896'); bucket(WS, 2.0, -1.5, '#c62f36');
  crate(WS, -3.2, 0.55, 1.8, 0.4, 'TV-11');
  { const rack = group(0.8, 2.35, -2.98, WS); add(box(1.6, 0.04, 0.12), '#6a4a32', 0, 0, 0.06, rack); for (let i = 0; i < 9; i++) { add(cyl(0.004, 0.004, 0.16, 4), '#9aa0aa', -0.72 + i * 0.18, -0.08, 0.08, rack); const b = Wd.ball((i * 7) % 10, 0.045, rack); b.position.set(-0.72 + i * 0.18, -0.2, 0.08); } }
  flyer(WS, -1.9, 2.6, -2.98, 0, [{ t: 'WEIGHT', c: '#c62f36' }, 'CHART'], '#fbfaf4'); flyer(WS, 1.9, 1.6, -2.98, 0, [{ t: 'APRIL', c: '#c62f36' }, '1980'], '#fbfaf4');
  bulb(WS, -0.5, 3.4, 0.8, 0.9); bulb(WS, 2.0, 3.4, -1.0, 0.7);
  cord(WS, [[-2.2, 1.0, -2.5], [-2.6, 0.5, -2.6], [-2.9, 0.02, -2.0], [-1.5, 0.02, -0.4], [0.3, 0.02, 0.1]], 0.015, '#f4d35e');
  { const saw = group(-2.4, 0, 0.3, WS); for (const s of [-1, 1]) for (const k of [-1, 1]) { const l = add(box(0.05, 0.6, 0.05), '#b07a45', s * 0.3, 0.3, k * 0.12, saw); l.rotation.x = k * 0.2; } add(tbox(0.8, 0.08, 0.1), '#b07a45', 0, 0.6, 0, saw); }
  cat(WS, 3.0, 1.06, -2.75, '#e6a23c');

  // ================= CLASSROOM =================
  const CL = Wd.classroom;
  shelf(CL, 3.6, 0, -3.8, 1.4, 3, 0, '#c9a571'); shelf(CL, 4.25, 0, 1.2, 1.4, 3, -Math.PI / 2, '#c9a571');
  frame(CL, -2.4, 3.05, -3.98, 1.6, 0.4, art.abc); frame(CL, 2.2, 3.05, -3.98, 1.6, 0.4, (q, w, h) => { art.abc(q, w, h); });
  frame(CL, 4.37, 2.3, -1.5, 1.4, 0.95, art.map, -Math.PI / 2);
  for (let i = 0; i < 6; i++) { const g = group(-3.6 + i * 0.5, 1.4, 4.38, CL); g.rotation.y = Math.PI; add(cyl(0.015, 0.015, 0.12, 6), '#b6bec7', 0, 0, 0.06, g).rotation.x = Math.PI / 2; const bag = add(tbox(0.3, 0.38, 0.14), pick(BOOK), 0, -0.25, 0.1, g); }
  add(box(3.4, 0.12, 0.06), '#8a5734', -2.35, 1.4, 4.42, CL);
  { const bin = group(3.4, 0, -1.6, CL); add(cyl(0.18, 0.15, 0.4, 14), '#7f8896', 0, 0.2, 0, bin); for (let k = 0; k < 5; k++) add(sph(0.06, 8, 6), '#fbfaf4', Math.sin(k) * 0.08, 0.38 + (k % 2) * 0.05, Math.cos(k) * 0.08, bin); for (let k = 0; k < 3; k++) add(sph(0.05, 8, 6), '#fbfaf4', 0.3 + k * 0.25, 0.05, 0.2 + k * 0.1, bin); }
  Wd.desks.forEach((d, i) => { add(cyl(0.035, 0.03, 0.1, 10), pick(BOOK), 0.38, 0.8, -0.15, d); for (let k = 0; k < 3; k++) add(cyl(0.006, 0.006, 0.16, 6), pick(['#f4d35e', '#c62f36', '#2a5fae']), 0.38 + (k - 1) * 0.012, 0.88, -0.15, d); if (i % 2) papers(d, -0.2, 0.755, 0.05, 3, 0.2); });
  flyer(CL, 1.7, 2.9, -3.98, 0, [{ t: 'STAR', c: '#f4d35e' }, 'PUPILS'], '#2a5fae'); plant(CL, -4.0, -3.6, 1.2); plant(CL, 4.0, 3.8, 1.0);
  { const f = group(-3.9, 0, 3.6, CL); add(cyl(0.02, 0.02, 2.2, 8), '#c9a24a', 0, 1.1, 0, f); const cl = add(new THREE.PlaneGeometry(0.8, 0.5, 6, 3), toon({ color: '#c62f36', side: THREE.DoubleSide }), 0.42, 1.85, 0, f); cl.userData.base = cl.geometry.attributes.position.array.slice(); Wd.life.push((t) => Wd.wave(cl, t, 0.03)); }

  // ================= STREET =================
  const SR = Wd.street;
  const fireEscape = (x, y0, floors) => { const g = group(x, y0, -3.75, SR); for (let f = 0; f < floors; f++) { const y = f * 1.6; add(tbox(1.6, 0.05, 0.6), '#2b2f38', 0, y, 0.3, g); for (let k = 0; k < 9; k++) add(box(0.02, 0.5, 0.02), '#2b2f38', -0.78 + k * 0.195, y + 0.25, 0.6, g); add(box(1.6, 0.03, 0.03), '#2b2f38', 0, y + 0.5, 0.6, g); const st = add(box(0.06, 1.75, 0.06), '#2b2f38', 0.5, y - 0.8, 0.35, g); st.rotation.z = 0.6; } };
  fireEscape(-3.0, 3.6, 2); fireEscape(-8.2, 3.6, 2); fireEscape(7.0, 3.4, 2);
  { const b = group(-6.2, 0.18, -1.3, SR); add(tbox(1.4, 0.06, 0.4), '#2f6b4f', 0, 0.44, 0, b); add(tbox(1.4, 0.4, 0.06), '#2f6b4f', 0, 0.72, -0.18, b); for (const s of [-1, 1]) add(box(0.06, 0.44, 0.4), '#2b2f38', s * 0.64, 0.22, 0, b); }
  { const mb = group(1.2, 0.18, -1.2, SR); add(tbox(0.4, 0.6, 0.4), '#2a5fae', 0, 0.7, 0, mb); add(cyl(0.2, 0.2, 0.4, 16, 1, false, 0, Math.PI), '#2a5fae', 0, 1.0, 0, mb).rotation.z = Math.PI / 2; for (const s of [-1, 1]) add(box(0.05, 0.4, 0.05), '#2b2f38', s * 0.15, 0.2, 0, mb); sign(mb, ['U.S. MAIL'], 0, 0.72, 0.205, 0.34, 0.12, { d: 0.005, bg: '#2a5fae', fg: '#ffffff' }); }
  { const pb = group(9.0, 0.18, -2.6, SR); add(tbox(0.8, 2.2, 0.8), '#c62f36', 0, 1.1, 0, pb); add(box(0.6, 1.5, 0.02), M.glass, 0, 1.1, 0.41, pb, { noink: true }); sign(pb, [{ t: 'TELEPHONE', c: '#ffffff' }], 0, 2.05, 0.41, 0.7, 0.16, { d: 0.01, bg: '#c62f36' }); }
  for (const [x, z] of [[-4.4, -2.9], [-4.0, -3.0]]) { const g = group(x, 0.18, z, SR); for (let k = 0; k < 4; k++) add(box(0.4, 0.06, 0.3), '#e8e2d4', 0, 0.03 + k * 0.06, 0, g); add(box(0.42, 0.01, 0.02), '#8a5734', 0, 0.26, 0, g); }
  { const fr = group(2.2, 0.18, -3.4, SR); for (let k = 0; k < 3; k++) { add(tbox(0.5, 0.25, 0.4), M.planks, -0.55 + k * 0.55, 0.45, 0, fr); for (let j = 0; j < 6; j++) add(sph(0.06, 8, 6), ['#c62f36', '#f28c28', '#f4d35e'][k], -0.55 + k * 0.55 + (j % 3 - 1) * 0.13, 0.62, (j > 2 ? 0.08 : -0.08), fr); } add(tbox(1.7, 0.4, 0.45), '#6a4a32', 0, 0.2, 0, fr); }
  barrel(SR, -10.2, -2.6, '#3b5f45'); crate(SR, -9.4, 0.18, -2.9, 0.5, 'EGGS'); crate(SR, -9.4, 0.68, -2.9, 0.4);
  for (const x of [-12, -2, 8]) { const mh = add(cyl(0.4, 0.4, 0.02, 20), '#3b3f4a', x, 0.01, 1.2 + (x % 3) * 0.3, SR, { cast: false }); }
  for (const [x, z, s] of [[-7, 2.6, 1.2], [3.5, 4.2, 0.9]]) { const pd = add(cyl(0.6 * s, 0.6 * s, 0.006, 24), toon({ color: '#9fc4e6', roughness: 0.15, metalness: 0.1 }), x, 0.006, z, SR, { cast: false }); pd.scale.z = 0.55; }
  { const car = group(-6.5, 0, 1.6, SR); car.rotation.y = Math.PI; add(tbox(3.0, 0.7, 1.5), '#f28c28', 0, 0.6, 0, car); add(tbox(1.7, 0.55, 1.4), '#f28c28', 0.2, 1.2, 0, car); add(box(1.6, 0.45, 1.42), '#bfe0f6', 0.2, 1.2, 0, car); for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const w = add(cyl(0.3, 0.3, 0.2, 18), '#2b2f38', sx * 0.95, 0.3, sz * 0.75, car); w.rotation.x = Math.PI / 2; } add(box(0.1, 0.18, 1.2), '#fbfaf4', 1.52, 0.65, 0, car); }
  { const bk = group(4.2, 0.18, -2.2, SR); bk.rotation.y = 0.2; for (const s of [-1, 1]) add(new THREE.TorusGeometry(0.26, 0.03, 8, 20), '#2b2f38', s * 0.45, 0.3, 0, bk); add(box(0.9, 0.04, 0.04), '#c62f36', 0, 0.5, 0, bk).rotation.z = -0.1; add(box(0.04, 0.5, 0.04), '#c62f36', 0.1, 0.35, 0, bk).rotation.z = 0.3; add(box(0.2, 0.04, 0.12), '#2b2f38', -0.12, 0.62, 0, bk); }
  sign(SR, [{ t: 'LOTTO', c: '#c62f36' }, 'TONIGHT $1'], 0.2, 2.55, -3.75, 0.9, 0.55, { bg: '#f4d35e' });
  for (let i = 0; i < 8; i++) { const b = add(sph(0.08, 8, 6), pick(['#c62f36', '#f4d35e', '#2a5fae', '#3fa39a']), -6 + i * 1.5, 3.0 + (i % 2) * 0.15, -3.0, SR, { cast: false }); b.scale.set(0.8, 1, 0.3); }
  cord(SR, [[-7, 3.2, -3.0], [-3.5, 2.9, -3.0], [0, 3.2, -3.0], [3.5, 2.9, -3.0], [7, 3.2, -3.0]], 0.01, '#3b3f4a');
  { const birds = []; for (let i = 0; i < 5; i++) { const b = group(0, 6, -6, SR); add(sph(0.08, 8, 6), '#3b3f4a', 0, 0, 0, b).scale.set(1.4, 0.7, 0.7); const w1 = add(box(0.3, 0.01, 0.1), '#3b3f4a', 0, 0, 0.1, b), w2 = add(box(0.3, 0.01, 0.1), '#3b3f4a', 0, 0, -0.1, b); birds.push([b, w1, w2]); }
    Wd.life.push((t) => birds.forEach(([b, w1, w2], i) => { const u = (t * 0.08 + i * 0.2) % 1; b.position.set(-14 + u * 28, 6.5 + Math.sin(t * 0.7 + i) * 0.6 + i * 0.3, -5 - i * 0.4); const f = Math.sin(t * 14 + i) * 0.7; w1.rotation.x = f; w2.rotation.x = -f; })); }
  cat(SR, -10.2, 0.98, -2.6, '#2b2f38');

  // ================= LIVING ROOM =================
  const LV = Wd.living;
  shelf(LV, -2.0, 0, -2.75, 1.4, 4, 0, '#8a5734');
  { const a = group(1.4, 0, -1.9, LV); a.rotation.y = -0.5; add(tbox(0.9, 0.45, 0.85), '#3d5a80', 0, 0.3, 0, a); add(tbox(0.9, 0.7, 0.2), '#34507a', 0, 0.75, -0.35, a); for (const s of [-1, 1]) add(tbox(0.18, 0.6, 0.85), '#34507a', s * 0.45, 0.45, 0, a); add(box(0.4, 0.3, 0.12), '#f2cc8f', 0.1, 0.65, -0.2, a).rotation.z = 0.3; }
  { const st = group(-2.9, 0, 0.0, LV); add(tbox(0.5, 0.06, 0.5), '#8a5734', 0, 0.6, 0, st); for (const s of [-1, 1]) for (const k of [-1, 1]) add(box(0.04, 0.6, 0.04), '#6a4a32', s * 0.2, 0.3, k * 0.2, st); add(tbox(0.22, 0.1, 0.16), '#c62f36', 0, 0.68, 0, st); add(cyl(0.02, 0.02, 0.22, 6), '#c62f36', 0, 0.78, 0, st).rotation.z = Math.PI / 2; papers(st, 0.1, 0.64, 0.1, 3, 0.15); }
  frame(LV, -1.4, 2.1, -2.86, 0.5, 0.6, art.face); frame(LV, -0.5, 2.1, -2.86, 0.7, 0.5, art.sea); frame(LV, 0.4, 1.6, -2.86, 0.5, 0.4, art.horse);
  plant(LV, 2.9, -2.4, 1.3); plant(LV, -3.0, 2.3, 1.0);
  for (const [x, z] of [[-0.4, 1.9], [-0.2, 2.0]]) { const s = add(sph(0.08, 10, 8), '#c0392b', x, 0.03, z, LV); s.scale.set(1.6, 0.5, 0.8); }
  { const rack = group(2.9, 0, 2.0, LV); add(tbox(0.4, 0.4, 0.25), '#b07a45', 0, 0.2, 0, rack); for (let k = 0; k < 3; k++) add(box(0.3, 0.32, 0.01), pick(BOOK), -0.1 + k * 0.08, 0.42, 0.04 * (k - 1), rack).rotation.z = 0.1 * (k - 1); }
  add(tbox(1.8, 0.02, 1.2), M.rug, 1.6, 0.013, -1.7, LV, { cast: false });

  // ================= BOOKIE =================
  const BK = Wd.bookie;
  cabinet(BK, -3.05, -1.6, 1.3, Math.PI / 2, '#5c6b7a'); cabinet(BK, -3.05, -1.0, 1.3, Math.PI / 2, '#5c6b7a');
  { const sf = group(2.9, 0, -2.4, BK); add(tbox(0.8, 1.0, 0.7), '#2f3f3a', 0, 0.5, 0, sf); add(cyl(0.16, 0.16, 0.05, 20), '#c9a24a', 0, 0.55, 0.37, sf).rotation.x = Math.PI / 2; for (let k = 0; k < 4; k++) add(box(0.025, 0.12, 0.03), '#c9a24a', Math.cos(k * 1.57) * 0.1, 0.55 + Math.sin(k * 1.57) * 0.1, 0.4, sf); sign(sf, ['SAFE'], 0, 0.9, 0.36, 0.3, 0.1, { d: 0.005, bg: '#c9a24a' }); }
  { const cr = group(-2.9, 0, 1.6, BK); add(cyl(0.025, 0.03, 1.9, 8), '#6a4a32', 0, 0.95, 0, cr); for (let k = 0; k < 4; k++) add(cyl(0.012, 0.012, 0.2, 6), '#6a4a32', Math.cos(k * 1.57) * 0.08, 1.8, Math.sin(k * 1.57) * 0.08, cr).rotation.set(Math.sin(k * 1.57) * 0.9, 0, -Math.cos(k * 1.57) * 0.9); add(cyl(0.2, 0.2, 0.02, 16), '#2a2428', 0.12, 1.85, 0, cr); add(cyl(0.11, 0.11, 0.12, 16), '#2a2428', 0.12, 1.92, 0, cr); }
  frame(BK, -1.9, 2.75, -2.86, 0.6, 0.45, art.horse); frame(BK, 2.6, 2.75, -2.86, 0.6, 0.45, art.horse);
  { const cork = group(-3.38, 1.9, 1.8, BK); cork.rotation.y = Math.PI / 2; add(box(1.0, 0.7, 0.03), '#c9a571', 0, 0, 0, cork); for (let i = 0; i < 7; i++) { const m = add(box(0.16, 0.12, 0.005), pick(['#fbfaf4', '#f6e27a', '#f6c4d6']), -0.38 + (i % 4) * 0.25, 0.18 - ((i / 4) | 0) * 0.3, 0.02, cork, { cast: false }); m.rotation.z = (R() - 0.5) * 0.4; add(sph(0.012, 6, 4), '#c62f36', m.position.x, m.position.y + 0.05, 0.03, cork); } }
  { const wc = group(2.9, 0, 1.6, BK); add(tbox(0.36, 0.9, 0.36), '#d8dde6', 0, 0.45, 0, wc); add(cyl(0.16, 0.16, 0.45, 16), toon({ color: '#8fd0ff', transparent: true, opacity: 0.7 }), 0, 1.12, 0, wc); }
  { const tk = group(1.4, 0.84, -0.95, BK); add(box(0.25, 0.14, 0.18), '#3b3f4a', 0, 0.07, 0, tk); add(sph(0.08, 12, 8, 0, 6.3, 0, 1.6), M.glass, 0, 0.18, 0, tk, { noink: true }); const tape = add(box(0.03, 0.002, 0.6), '#fbfaf4', 0.15, -0.3, 0.2, tk); tape.rotation.x = 1.0; }
  { const ash = group(0.2, 0.84, -0.4, BK); add(cyl(0.08, 0.06, 0.03, 14), '#7f8896', 0, 0.015, 0, ash); }
  papers(BK, 0.6, 0.845, -0.55, 6, 0.5); barrel(BK, 3.0, 0.5, '#6a4a32');

  // ================= COURT =================
  const CT = Wd.court;
  { const bar = group(0, 0, 1.8, CT); add(tbox(7.0, 0.08, 0.12), '#8a5734', 0, 0.95, 0, bar); add(tbox(7.0, 0.08, 0.12), '#8a5734', 0, 0.1, 0, bar); for (let k = 0; k < 29; k++) { if (Math.abs(-3.4 + k * 0.243) < 0.45) continue; const b = add(cyl(0.03, 0.04, 0.8, 8), '#b07a45', -3.4 + k * 0.243, 0.52, 0, bar); } }
  { const ws = group(2.4, 0, -2.4, CT); add(tbox(1.0, 0.9, 0.8), '#6a4a32', 0, 0.45, 0, ws); add(tbox(1.1, 0.06, 0.9), '#8a5734', 0, 0.92, 0, ws); add(cyl(0.01, 0.01, 0.3, 6), '#2b2f38', 0.2, 1.08, 0.25, ws).rotation.x = -0.4; add(sph(0.04, 8, 6), '#7f8896', 0.2, 1.22, 0.32, ws); sign(ws, ['WITNESS'], 0, 0.55, 0.41, 0.6, 0.18, { d: 0.01, bg: '#5a3a24', fg: '#f4d35e' }); }
  { const st = group(-2.3, 0, -1.9, CT); add(tbox(0.7, 0.7, 0.5), '#6a4a32', 0, 0.35, 0, st); add(box(0.3, 0.12, 0.22), '#3b3f4a', 0, 0.76, 0, st); chairB(st, 0, 0.45, Math.PI, '#5a3a24'); }
  frame(CT, -2.6, 3.0, -3.48, 0.7, 0.9, art.face); frame(CT, 2.6, 3.0, -3.48, 0.7, 0.9, art.face);
  { const sc = group(1.2, 1.38, -2.6, CT); add(cyl(0.08, 0.1, 0.04, 14), '#c9a24a', 0, 0.02, 0, sc); add(cyl(0.012, 0.012, 0.5, 6), '#c9a24a', 0, 0.27, 0, sc); const beam = group(0, 0.5, 0, sc); add(box(0.5, 0.02, 0.02), '#c9a24a', 0, 0, 0, beam); for (const s of [-1, 1]) { add(cyl(0.004, 0.004, 0.18, 4), '#c9a24a', s * 0.24, -0.09, 0, beam); add(cyl(0.08, 0.06, 0.02, 14), '#c9a24a', s * 0.24, -0.18, 0, beam); } Wd.life.push((t) => { beam.rotation.z = Math.sin(t * 0.9) * 0.06; }); }
  for (const x of [-3, 0, 3]) { const g = group(x, 4.1, 0.5, CT); add(cyl(0.01, 0.01, 0.6, 6), '#2b2f38', 0, -0.3, 0, g); add(sph(0.22, 14, 10, 0, 6.3, 0, 1.7), '#e6c25a', 0, -0.62, 0, g); add(sph(0.1, 10, 8), toon({ color: '#fff6c8', emissive: '#ffe9a0', emissiveIntensity: 1 }), 0, -0.68, 0, g); }
  plant(CT, -4.0, -3.1, 1.3); plant(CT, 4.0, -3.1, 1.3);
  papers(CT, 1.8, 0.83, 0.4, 5, 0.5);

  // living things tick
  const tick0 = Wd.tick; Wd.tick = (t) => { tick0(t); for (const f of Wd.life) f(t); };
})();
