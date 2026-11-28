// "The Sinking Tower" (Gus). A normal street with solid ground. The ground only opens on the twist ("It's a swamp"),
// revealing the whole tower sunk in the mud. No text signs anywhere.
window.WORLD = (() => {
  const E = ENGINE, { add, box, tbox, group, toon, texM, scene } = E;
  const Wd = {}; const R = PAINT.rng(9);
  const cyl = (rt, rb, h, n = 20, open = false, t0 = 0, tl = Math.PI * 2) => new THREE.CylinderGeometry(rt, rb, h, n, 1, open, t0, tl);
  const sph = (r, a = 16, b = 12) => new THREE.SphereGeometry(r, a, b);
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  const tex = (c, rx = 1, ry = 1) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t; };
  Wd.life = [];
  const H = 1.25, TW = 2.6, TD = 2.5, TZ = -1.05;   // floor height, tower width / depth, tower centre z
  Wd.H = H; Wd.TW = TW; Wd.TZ = TZ; Wd.ZF = TZ + TD / 2 + 0.05;

  // ---------- sky, hills, far castle ----------
  { const [c, g] = cv(16, 512); const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#2f6bd0'); gr.addColorStop(0.6, '#9fd0ff'); gr.addColorStop(1, '#ffe6b8'); g.fillStyle = gr; g.fillRect(0, 0, 16, 512); add(new THREE.PlaneGeometry(400, 260), new THREE.MeshBasicMaterial({ map: tex(c), fog: false }), 0, 60, -90, scene, { cast: false }); }
  for (let i = 0; i < 12; i++) { const h = add(sph(10 + R() * 6, 22, 10), i % 2 ? '#7aa64c' : '#8cb562', -60 + i * 11, -5.5, -40 - (i % 3) * 4, scene, { cast: false }); h.scale.y = 0.6; }
  { const c = group(-14, 0, -30); const sm = texM(PAINT.stone(4, 40, 10, 76), 1, 2); for (const [x, h] of [[-3.2, 7], [0, 9.5], [3.2, 7]]) { add(tbox(2.2, h, 2.2, 2), sm, x, h / 2, 0, c); add(new THREE.ConeGeometry(1.6, 2.6, 4), '#6b3c8f', x, h + 1.3, 0, c).rotation.y = Math.PI / 4; } add(tbox(8.5, 4.5, 1.6, 2), sm, 0, 2.25, 0.4, c); }
  // sky clouds at many heights (the tower climbs through them)
  const cloudM = toon({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.15 });
  const cloud = (x, y, z, s = 1, parent = scene) => { const cl = group(x, y, z, parent); for (let k = 0; k < 5; k++) add(sph((1.0 + R() * 0.7) * s, 14, 10), cloudM, (k - 2) * 1.1 * s, R() * 0.5 * s, (R() - 0.5) * s, cl, { cast: false }); return cl; };
  for (let i = 0; i < 26; i++) { const cl = cloud(-26 + R() * 52, 9 + i * 3.4, -8 - R() * 20, 0.8 + R() * 0.8); const x0 = cl.position.x; Wd.life.push((t) => { cl.position.x = x0 + t * 0.2; }); }
  Wd.cloud = cloud(3.5, 16, -4.0, 0.9); // the one you tie the tower to

  // ---------- ground: back slab (with the tower trench) + the front lid that drops away on "swamp" ----------
  const mudC = () => { const [c, g] = cv(1024, 1024); const bands = ['#4e3e2a', '#3f3424', '#5a4a30', '#3a3a26', '#4a4430', '#34301f']; let y = 0, i = 0; while (y < 1024) { const h = 60 + R() * 110; g.fillStyle = bands[i++ % bands.length]; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + Math.sin(x * 0.012 + i) * 14); g.lineTo(1024, y + h + 14); g.lineTo(0, y + h + 14); g.fill(); y += h; }
    for (let k = 0; k < 120; k++) { g.fillStyle = ['rgba(90,110,60,.6)', 'rgba(120,100,70,.6)', 'rgba(30,25,15,.6)'][k % 3]; g.beginPath(); g.ellipse(R() * 1024, R() * 1024, 6 + R() * 18, 3 + R() * 8, R() * 3, 0, 7); g.fill(); }
    g.strokeStyle = '#2a2014'; g.lineWidth = 5; for (let k = 0; k < 16; k++) { let x = R() * 1024, yy = R() * 1024; g.beginPath(); g.moveTo(x, yy); for (let s = 0; s < 6; s++) { x += R() * 40 - 20; yy += 16 + R() * 18; g.lineTo(x, yy); } g.stroke(); } return c; };
  const mudM = toon({ map: tex(mudC(), 1, 1), roughness: 0.95 });
  const grassM = texM(PAINT.grass(6), 1, 1); grassM.map.wrapS = grassM.map.wrapT = THREE.RepeatWrapping;
  const W4 = 4.0;
  const slab = (x0, x1, y0, y1, z0, z1, mats, parent = scene) => {
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), p = g.attributes.position, uv = g.attributes.uv, n = g.attributes.normal; const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
    for (let i = 0; i < p.count; i++) { const wx = p.getX(i) + cx, wy = p.getY(i) + cy, wz = p.getZ(i) + cz, nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)); if (ny > 0.5) uv.setXY(i, wx / 2.4, wz / 2.4); else if (nx > 0.5) uv.setXY(i, wz / W4, wy / W4); else uv.setXY(i, wx / W4, wy / W4); }
    return add(g, mats || [mudM, mudM, grassM, mudM, mudM, mudM], cx, cy, cz, parent); };
  const ZF = Wd.ZF, ZB = TZ - TD / 2 - 0.05, YB = -100, X0 = -40, X1 = 40, TX = TW / 2 + 0.05;
  slab(X0, -TX, YB, 0, ZB, ZF); slab(TX, X1, YB, 0, ZB, ZF); slab(X0, X1, YB, 0, -40, ZB);
  // swamp water pockets + bubbles in the cut face (only seen after the reveal)
  for (let k = 0; k < 14; k++) { const x = (R() < 0.5 ? -1 : 1) * (TX + 0.6 + R() * 9), y = -1.2 - R() * 40; add(new THREE.SphereGeometry(0.5 + R() * 0.8, 14, 10), toon({ color: '#35675e', emissive: '#16352f', emissiveIntensity: 0.3 }), x, y, ZF - 0.2, scene, { cast: false }).scale.set(1.6, 0.5, 0.4); }
  Wd.mudBubbles = []; for (let i = 0; i < 14; i++) Wd.mudBubbles.push(add(sph(0.08, 8, 6), toon({ color: '#9ec4a0', transparent: true, opacity: 0.7 }), 0, -200, 0, scene, { cast: false }));
  // the front lid: solid street + lawn in front of the houses
  Wd.lid = group(0, 0, 0); { const L = Wd.lid; slab(X0, X1, -1.2, 0, ZF, 40, [mudM, mudM, grassM, mudM, mudM, mudM], L);
    const cobC = () => { const [c, g] = cv(512, 256); g.fillStyle = '#9a8e80'; g.fillRect(0, 0, 512, 256); for (let y = 0; y < 256; y += 32) for (let x = (y / 32) % 2 * 24; x < 512; x += 48) { g.fillStyle = ['#b0a494', '#a29684', '#8e8272'][(x + y) % 3]; g.beginPath(); g.roundRect(x + 2, y + 2, 44, 28, 8); g.fill(); g.strokeStyle = 'rgba(40,30,20,.5)'; g.lineWidth = 2; g.stroke(); } return c; };
    add(new THREE.BoxGeometry(X1 - X0, 0.03, 1.8), toon({ map: tex(cobC(), 20, 1) }), 0, 0.015, ZF + 1.6, L, { cast: false });
    for (let x = -18; x <= 18; x += 3.6) { if (Math.abs(x) < 6.5) continue; const t = group(x, 0, ZF + 3.5, L); add(cyl(0.12, 0.17, 1.6, 8), '#6a4a32', 0, 0.8, 0, t); for (let k = 0; k < 3; k++) add(sph(0.6, 12, 8), k % 2 ? '#5f9a3c' : '#6fae45', (R() - 0.5) * 0.5, 1.8 + k * 0.25, (R() - 0.5) * 0.5, t); }
    for (let k = 0; k < 140; k++) { const x = X0 + R() * (X1 - X0), z = ZF + 2.7 + R() * 10; add(new THREE.ConeGeometry(0.035, 0.2, 4), k % 2 ? '#4c8a30' : '#5f9a3c', x, 0.1, z, L, { cast: false }); } }
  for (let k = 0; k < 60; k++) { const x = X0 + R() * (X1 - X0), z = -3 - R() * 10; if (Math.abs(x) < 2) continue; add(new THREE.ConeGeometry(0.035, 0.2, 4), k % 2 ? '#4c8a30' : '#5f9a3c', x, 0.1, z, scene, { cast: false }); }
  Wd.dust = []; const dustM = toon({ color: '#d8c8ae', transparent: true, opacity: 0.75 }); for (let i = 0; i < 26; i++) Wd.dust.push(add(sph(0.16, 10, 8), dustM, 0, -200, 0, scene, { cast: false }));

  // ---------- the tower: 72 stacked floors (shown as the story needs) ----------
  const floorC = (k) => { const [c, g] = cv(512, 256); const walls = ['#f0e2c4', '#e8d8b8', '#f4e8d0']; g.fillStyle = walls[k % 3]; g.fillRect(0, 0, 512, 256);
    g.fillStyle = 'rgba(0,0,0,.08)'; for (let y = 0; y < 256; y += 32) g.fillRect(0, y, 512, 3); g.fillStyle = '#8a5734'; g.fillRect(0, 236, 512, 20);
    for (const x of [70, 302]) { g.fillStyle = '#5a3a24'; g.fillRect(x - 10, 50, 160, 136); g.fillStyle = '#bfe4f6'; g.fillRect(x, 60, 140, 116); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(x + 10, 68, 30, 100); g.fillStyle = '#5a3a24'; g.fillRect(x + 66, 60, 8, 116); g.fillRect(x, 114, 140, 8); g.fillStyle = k % 2 ? '#c62f36' : '#2a5fae'; g.fillRect(x - 6, 184, 152, 10); } return c; };
  const floorMats = [0, 1, 2].map((k) => toon({ map: tex(floorC(k)) }));
  const sideM = toon({ color: '#d8c8a8' });
  Wd.tower = group(0, 0, TZ); Wd.floors = [];
  for (let i = 0; i < 72; i++) { const f = add(new THREE.BoxGeometry(TW, H, TD), [sideM, sideM, sideM, sideM, floorMats[i % 3], sideM], 0, i * H + H / 2, 0, Wd.tower); f.visible = false; Wd.floors.push(f); }
  // ground-floor door (floor 0)
  add(box(0.6, 0.95, 0.04), '#6a4a32', 0.75, 0.48, TD / 2 + 0.02, Wd.floors[0]).position.y = -H / 2 + 0.48;
  // the roof (rides on the top floor), sky-castle turrets + flags
  Wd.roof = group(0, 0, 0, Wd.tower); { const r = Wd.roof; add(box(TW + 0.2, 0.14, TD + 0.2), '#c62f36', 0, 0.07, 0, r);
    Wd.turrets = group(0, 0, 0, r); for (const [x, z] of [[-1.1, -1.0], [1.1, -1.0], [-1.1, 1.0], [1.1, 1.0]]) { add(cyl(0.28, 0.3, 1.0, 12), texM(PAINT.stone(4, 40, 10, 76), 1, 1), x, 0.6, z, Wd.turrets); add(new THREE.ConeGeometry(0.38, 0.6, 12), '#6b3c8f', x, 1.4, z, Wd.turrets); add(cyl(0.02, 0.02, 0.5, 6), '#3b3f4a', x, 1.9, z, Wd.turrets); add(box(0.3, 0.18, 0.02), '#f4d35e', x + 0.15, 2.05, z, Wd.turrets); } }
  // outside stairs (right side) + the elevator rail and cab (left side)
  Wd.stairs = []; for (let i = 0; i < 14; i++) { const s = group(TW / 2 + 0.35, i * H, TZ); const up = i % 2 ? -1 : 1; const st = add(box(0.5, 0.06, Math.hypot(1.6, H)), '#8a5734', 0, H / 2, 0, s); st.rotation.x = -up * Math.atan2(H, 1.6); for (let k = 0; k < 5; k++) add(box(0.5, 0.05, 0.12), '#6a4a32', 0, 0.12 + k * H / 5, up * (-0.65 + k * 0.32), s); add(box(0.5, 0.05, 0.5), '#6a4a32', 0, H, up * 1.0, s); s.visible = false; Wd.stairs.push(s); }
  Wd.rail = add(box(0.08, 1, 0.08), '#3b3f4a', -TW / 2 - 0.45, 0, TZ + 0.9, scene); Wd.rail.visible = false;
  Wd.cab = group(-TW / 2 - 0.5, 0, TZ + 0.9); { const c = Wd.cab; add(box(0.9, 0.06, 0.8), '#3b3f4a', 0, 0, 0, c); add(box(0.9, 0.06, 0.8), '#3b3f4a', 0, 1.3, 0, c); add(box(0.9, 1.3, 0.05), '#c9a03a', 0, 0.65, -0.38, c); for (const s of [-1, 1]) add(box(0.05, 1.3, 0.8), '#c9a03a', s * 0.43, 0.65, 0, c); add(cyl(0.012, 0.012, 3, 6), '#3b3f4a', 0, 2.8, 0, c); } Wd.cab.visible = false;
  Wd.rope = add(cyl(0.025, 0.025, 1, 6), '#d8c08a', 0, 0, 0, scene, { cast: false }); Wd.rope.visible = false;

  // ---------- the neighbor's house (1 floor, then +2) ----------
  Wd.nb = group(4.6, 0, TZ); Wd.nbFloors = []; const nbM = toon({ map: tex((() => { const [c, g] = cv(512, 256); g.fillStyle = '#cfe0c8'; g.fillRect(0, 0, 512, 256); g.fillStyle = 'rgba(0,0,0,.08)'; for (let y = 0; y < 256; y += 32) g.fillRect(0, y, 512, 3); for (const x of [90, 300]) { g.fillStyle = '#2f6b4f'; g.fillRect(x - 10, 56, 140, 124); g.fillStyle = '#bfe4f6'; g.fillRect(x, 66, 120, 104); g.fillStyle = '#2f6b4f'; g.fillRect(x + 56, 66, 8, 104); } g.fillStyle = '#5a3a24'; g.fillRect(0, 236, 512, 20); return c; })()) });
  for (let i = 0; i < 3; i++) { const f = add(new THREE.BoxGeometry(2.4, H, 2.2), [sideM, sideM, sideM, sideM, nbM, sideM], 0, i * H + H / 2, 0, Wd.nb); Wd.nbFloors.push(f); }
  Wd.nbRoof = add(new THREE.ConeGeometry(2.0, 1.0, 4), '#2f6b4f', 0, H + 0.5, 0, Wd.nb); Wd.nbRoof.rotation.y = Math.PI / 4; Wd.nbRoof.scale.z = 0.85;
  add(box(0.55, 0.95, 0.04), '#5a3a24', -0.6, 0.48, 1.12, Wd.nb);

  // ---------- trio: pigeon (with a letter) + goat; the spaghetti ladder (analogy) ----------
  Wd.pigeon = group(0, -200, 0); { const p = Wd.pigeon, gm = toon({ color: '#8a93a6' }); const bd = add(sph(0.14, 16, 12), gm, 0, 0, 0, p); bd.scale.set(1.3, 0.9, 0.9); const hd = group(0.15, 0.12, 0, p); add(sph(0.08, 12, 10), toon({ color: '#6b7488' }), 0, 0, 0, hd); add(new THREE.ConeGeometry(0.028, 0.07, 6), '#f4c430', 0.09, -0.01, 0, hd).rotation.z = -Math.PI / 2; for (const s of [-1, 1]) add(sph(0.018, 6, 5), '#1e1714', 0.05, 0.03, s * 0.055, hd);
    Wd.pw1 = add(box(0.16, 0.02, 0.3), gm, -0.02, 0.06, 0.18, p); Wd.pw2 = add(box(0.16, 0.02, 0.3), gm, -0.02, 0.06, -0.18, p); add(box(0.22, 0.14, 0.01), '#f6f1e6', 0.22, -0.02, 0, p).rotation.z = 0.2; }
  Wd.goat = group(0, -200, 0); { const gt = Wd.goat, wm = toon({ color: '#f2efe6' }), dk = toon({ color: '#3b3f4a' });
    add(box(0.75, 0.42, 0.36), wm, 0, 0.62, 0, gt); for (const [x, z] of [[-0.28, -0.12], [-0.28, 0.12], [0.28, -0.12], [0.28, 0.12]]) add(box(0.08, 0.42, 0.08), wm, x, 0.21, z, gt);
    const hd = group(0.42, 0.88, 0, gt); add(box(0.32, 0.26, 0.24), wm, 0.08, 0, 0, hd); add(box(0.1, 0.12, 0.2), '#e8b8a8', 0.27, -0.06, 0, hd); for (const s of [-1, 1]) { add(new THREE.ConeGeometry(0.035, 0.22, 6), dk, -0.02, 0.2, s * 0.07, hd).rotation.z = 0.5; add(sph(0.028, 8, 6), '#1e1714', 0.14, 0.05, s * 0.125, hd); }
    add(new THREE.ConeGeometry(0.04, 0.14, 6), wm, 0.22, -0.17, 0, hd).rotation.z = Math.PI; Wd.goatHead = hd; }
  Wd.ladder = group(-9, 0, -0.6); { const L = Wd.ladder, nm = toon({ color: '#f2d27a' }); Wd.ladderBits = [];
    for (const s of [-1, 1]) { const pts = []; for (let k = 0; k <= 12; k++) pts.push(new THREE.Vector3(s * 0.32, k * 0.28, 0)); const m = add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.045, 8), nm, 0, 0, 0, L); Wd.ladderBits.push(m); }
    for (let k = 1; k < 12; k++) Wd.ladderBits.push(add(cyl(0.035, 0.035, 0.64, 8), nm, 0, k * 0.28, 0, L)); Wd.ladderBits.slice(2).forEach((m) => { m.rotation.z = Math.PI / 2; }); }
  add(tbox(3.0, 4.0, 0.4, 1), texM(PAINT.stone(5, 40, 8, 80), 2, 2), -9, 2.0, -1.2, scene);

  // FX pools
  Wd.confetti = []; for (let i = 0; i < 70; i++) Wd.confetti.push(add(box(0.1, 0.06, 0.01), ['#c62f36', '#f4d35e', '#2a5fae', '#3fa39a', '#e07a5f'][i % 5], 0, -200, 0, scene, { cast: false }));
  Wd.sparks = []; for (let i = 0; i < 24; i++) Wd.sparks.push(add(sph(0.04, 6, 4), toon({ color: '#fff6c8', emissive: '#ffe9a0', emissiveIntensity: 1.6 }), 0, -200, 0, scene, { cast: false }));
  Wd.leaves = []; for (let i = 0; i < 16; i++) Wd.leaves.push(add(box(0.12, 0.02, 0.08), '#6fae45', 0, -200, 0, scene, { cast: false }));
  Wd.birds = [0, 1, 2].map((i) => { const b = group(0, 6, -10); add(sph(0.08, 8, 6), '#3b3f4a', 0, 0, 0, b).scale.set(1.4, 0.7, 0.7); const w1 = add(box(0.3, 0.01, 0.1), '#3b3f4a', 0, 0, 0.1, b), w2 = add(box(0.3, 0.01, 0.1), '#3b3f4a', 0, 0, -0.1, b); Wd.life.push((t) => { const u = (t * 0.03 + i * 0.3) % 1; b.position.set(-16 + u * 32, 7 + Math.sin(t + i) * 0.5 + i * 0.6, -10 - i); const f = Math.sin(t * 14 + i) * 0.7; w1.rotation.x = f; w2.rotation.x = -f; }); return b; });
  Wd.tick = (t) => { for (const f of Wd.life) f(t); };
  return Wd;
})();
