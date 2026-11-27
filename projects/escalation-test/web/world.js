// "The Well That Was Never Yours": one side-on cutaway diorama that grows with every "So you...".
// The ground is a slab cut open along its front face (z = 0.3). Surface on top, cavities (well shafts, vault, tunnel) carved into the cut.
// Only the 2D characters are cards; every prop / animal / FX is inked 3D geometry.
window.WORLD = (() => {
  const E = ENGINE, { add, box, tbox, group, sign, toon, texM, scene } = E;
  const Wd = {}; const R = PAINT.rng(77);
  const cyl = (rt, rb, h, n = 20, open = false, t0 = 0, tl = Math.PI * 2) => new THREE.CylinderGeometry(rt, rb, h, n, 1, open, t0, tl);
  const sph = (r, a = 16, b = 12) => new THREE.SphereGeometry(r, a, b);
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  Wd.life = [];
  const ZF = 0.3, ZB = -1.05, ZBACK = -3.4;           // cut face, cavity back wall, slab back
  Wd.ZF = ZF;

  // ---------- textures ----------
  const soilCanvas = () => { const [c, g] = cv(1024, 1024); const bands = ['#8a6644', '#7a5a3a', '#94704a', '#6e5034', '#83603e', '#5e4630']; let y = 0, i = 0; while (y < 1024) { const h = 80 + R() * 110; g.fillStyle = bands[i++ % bands.length]; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + Math.sin(x * 0.012 + i) * 12); g.lineTo(1024, y + h + 14); g.lineTo(0, y + h + 14); g.fill(); y += h; }
    for (let k = 0; k < 150; k++) { g.fillStyle = ['#b49e84', '#94846f', '#cdb89c', '#655443'][k % 4]; g.beginPath(); g.ellipse(R() * 1024, R() * 1024, 6 + R() * 15, 4 + R() * 9, R() * 3, 0, 7); g.fill(); g.strokeStyle = 'rgba(40,25,10,.55)'; g.lineWidth = 2.5; g.stroke(); }
    g.strokeStyle = '#4a3220'; g.lineWidth = 5; for (let k = 0; k < 10; k++) { let x = R() * 1024, yy = R() * 300; g.beginPath(); g.moveTo(x, yy); for (let s = 0; s < 6; s++) { x += R() * 40 - 20; yy += 16 + R() * 18; g.lineTo(x, yy); } g.stroke(); } return c; };
  const soilC = soilCanvas();
  const soilT = new THREE.CanvasTexture(soilC); soilT.colorSpace = THREE.SRGBColorSpace; soilT.wrapS = soilT.wrapT = THREE.RepeatWrapping; soilT.anisotropy = 4;
  const soilM = toon({ map: soilT, roughness: 0.95 });
  const darkSoilM = toon({ map: soilT, color: '#9a8070', roughness: 0.95 });
  const grassM = texM(PAINT.grass(6), 1, 1); grassM.map.wrapS = grassM.map.wrapT = THREE.RepeatWrapping;
  const stoneM = texM(PAINT.stone(4, 30, 12, 64), 3, 6); stoneM.side = THREE.DoubleSide;
  const plankM = texM(PAINT.stone(8, 28, 40, 48, 256, 40), 1, 2);

  // world-space UVs so every soil block tiles seamlessly; top faces get grass
  const W4 = 3.2;
  const slab = (x0, x1, y0, y1, z0, z1, mats = [soilM, soilM, grassM, soilM, soilM, soilM], parent = scene) => {
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), p = g.attributes.position, uv = g.attributes.uv, n = g.attributes.normal;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
    for (let i = 0; i < p.count; i++) { const wx = p.getX(i) + cx, wy = p.getY(i) + cy, wz = p.getZ(i) + cz, nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i));
      if (ny > 0.5) uv.setXY(i, wx / 2.2, wz / 2.2); else if (nx > 0.5) uv.setXY(i, wz / W4, wy / W4); else uv.setXY(i, wx / W4, wy / W4); }
    return add(g, mats, cx, cy, cz, parent);
  };

  // ---------- sky, hills, castle ----------
  { const [c, g] = cv(16, 512); const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#3a74d8'); gr.addColorStop(0.65, '#a6d6ff'); gr.addColorStop(1, '#ffe6b8'); g.fillStyle = gr; g.fillRect(0, 0, 16, 512); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; add(new THREE.PlaneGeometry(200, 60), new THREE.MeshBasicMaterial({ map: t, fog: false }), -4, 14, -60, scene, { cast: false }); }
  for (let i = 0; i < 9; i++) { const h = add(sph(9 + R() * 6, 22, 10), i % 2 ? '#7aa64c' : '#8cb562', -44 + i * 11, -5.5, -34 - (i % 3) * 4, scene, { cast: false }); h.scale.y = 0.62; }
  for (let i = 0; i < 6; i++) { const cl = group(-30 + i * 11, 11 + R() * 4, -45); for (let k = 0; k < 4; k++) add(sph(1.2 + R() * 0.8, 12, 8), '#ffffff', k * 1.3 - 2, R() * 0.6, 0, cl, { cast: false }); Wd.life.push((t) => { cl.position.x = -30 + i * 11 + t * 0.25; }); }
  { const c = group(6, 0, -20); const sm = texM(PAINT.stone(4, 40, 10, 76), 1, 2);
    for (const [x, h] of [[-3.2, 7], [0, 9.5], [3.2, 7]]) { add(tbox(2.2, h, 2.2, 2), sm, x, h / 2, 0, c); add(new THREE.ConeGeometry(1.6, 2.6, 4), '#c62f36', x, h + 1.3, 0, c).rotation.y = Math.PI / 4; }
    add(tbox(8.5, 4.5, 1.6, 2), sm, 0, 2.25, 0.4, c); for (let k = -3; k <= 3; k++) add(box(0.5, 0.5, 1.6), sm, k * 1.2, 4.75, 0.4, c);
    const fl = add(new THREE.PlaneGeometry(1.2, 0.7, 6, 3), toon({ color: '#f4d35e', side: THREE.DoubleSide }), 0.65, 11.4, 0, c); fl.userData.base = fl.geometry.attributes.position.array.slice(); add(cyl(0.05, 0.05, 1.6, 6), '#3b3f4a', 0, 11.1, 0, c); Wd.flag = fl; }

  // ---------- the ground slab ----------
  const X0 = -17, X1 = 9, YB = -12;
  // cavities (x0, x1, y0, y1) in the front layer ZB..ZF
  Wd.A = { x: 0, r: 0.6, bot: -6.0 };                 // your well (round shaft, water at the bottom)
  Wd.V = { x0: -2.8, x1: -0.6, y0: -4.6, y1: -3.0 };    // the vault, dug off the side of the shaft
  Wd.Dk = { x: -5.6, r: 0.6, top: -2.2, bot: -4.6 };   // the decoy: dug down to -2.2, then the guards dig to -4.6
  Wd.T = { x0: -5.0, x1: -2.8, y0: -4.6, y1: -3.45 };  // the tunnel into the vault
  const xs = [X0, Wd.Dk.x - 0.6, Wd.Dk.x + 0.6, Wd.V.x0, Wd.V.x1, 0.6, X1], ys = [YB, Wd.A.bot, Wd.V.y0, Wd.T.y1, Wd.V.y1, Wd.Dk.top, 0];
  const inside = (cx, cy, r) => cx > r[0] && cx < r[1] && cy > r[2] && cy < r[3];
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) {
    const cx = (xs[i] + xs[i + 1]) / 2, cy = (ys[j] + ys[j + 1]) / 2;
    if (inside(cx, cy, [-0.6, 0.6, Wd.A.bot, 0])) continue;                                 // shaft A
    if (inside(cx, cy, [Wd.V.x0, Wd.V.x1, Wd.V.y0, Wd.V.y1])) continue;                     // vault
    if (inside(cx, cy, [Wd.Dk.x - 0.6, Wd.Dk.x + 0.6, Wd.Dk.bot, 0])) continue;            // decoy (fillers below)
    if (inside(cx, cy, [Wd.T.x0, Wd.T.x1, Wd.T.y0, Wd.T.y1])) continue;                     // tunnel (filler below)
    slab(xs[i], xs[i + 1], ys[j], ys[j + 1], ZB, ZF);
  }
  slab(X0, X1, YB, 0, ZBACK, ZB, [soilM, soilM, grassM, soilM, darkSoilM, soilM]);
  // fillers: soil that gets dug out on cue (unit boxes anchored at one edge, scaled)
  const filler = (x0, x1, y0, y1) => { const m = slab(x0, x1, y0, y1, ZB + 0.001, ZF, [soilM, soilM, y1 >= 0 ? grassM : darkSoilM, soilM, soilM, soilM]); m.userData.r = [x0, x1, y0, y1]; return m; };
  Wd.fillDkTop = filler(Wd.Dk.x - 0.6, Wd.Dk.x + 0.6, Wd.Dk.top, 0);
  Wd.fillDkBot = filler(Wd.Dk.x - 0.6, Wd.Dk.x + 0.6, Wd.Dk.bot, Wd.Dk.top);
  Wd.fillT = filler(Wd.T.x0, Wd.T.x1, Wd.T.y0, Wd.T.y1);
  Wd.setFill = (m, k, axis = 'y', fromEnd = 0) => { const [x0, x1, y0, y1] = m.userData.r; m.visible = k > 0.002; if (!m.visible) return; k = Math.max(0.002, k);
    if (axis === 'y') { m.scale.set(1, k, 1); m.position.y = y0 + (y1 - y0) * k / 2; } else { m.scale.set(k, 1, 1); m.position.x = x1 - (x1 - x0) * k / 2; } };
  // grass lip + tufts along the cut edge
  for (let k = 0; k < 90; k++) { const x = X0 + R() * (X1 - X0); if (Math.abs(x) < 0.85 || Math.abs(x - Wd.Dk.x) < 0.85) continue; add(new THREE.ConeGeometry(0.035, 0.2, 4), k % 2 ? '#4c8a30' : '#5f9a3c', x, 0.1, ZBACK + R() * (ZF - ZBACK - 0.05), scene, { cast: false }); }
  // roots + pebbles poking out of the cut face
  for (let k = 0; k < 26; k++) { const x = X0 + 0.5 + R() * (X1 - X0 - 1), y = -0.3 - R() * 6.5; if (Math.abs(x) < 0.9 || (x > Wd.V.x0 - 0.2 && x < Wd.V.x1 + 0.2 && y > Wd.V.y0 - 0.2 && y < Wd.V.y1 + 0.2) || (x > Wd.Dk.x - 0.9 && x < Wd.Dk.x + 0.9) || (x > Wd.T.x0 && x < Wd.T.x1 && y > Wd.T.y0 - 0.2 && y < Wd.T.y1 + 0.2)) continue;
    const p = add(new THREE.DodecahedronGeometry(0.08 + R() * 0.12), ['#a8927a', '#8a7a6a', '#c9b49a'][k % 3], x, y, ZF + 0.02, scene, { cast: false }); p.scale.z = 0.5; }

  // ---------- shaft A: stone-lined half tube, water at the bottom ----------
  const shaft = (x, y0, y1, r, parent = scene) => { const h = y1 - y0; const m = add(cyl(r, r, h, 28, true, Math.PI / 2, Math.PI), stoneM, x, (y0 + y1) / 2, ZB + r, parent, { cast: false }); m.material = stoneM; return m; };
  shaft(0, Wd.A.bot, 0, 0.6);
  Wd.waterA = add(box(1.2, 0.55, ZF - ZB), toon({ color: '#3f93d6', roughness: 0.08, emissive: '#1d5a9a', emissiveIntensity: 0.35, transparent: true, opacity: 0.92 }), 0, Wd.A.bot + 0.27, (ZF + ZB) / 2, scene, { cast: false });
  Wd.ripple = add(new THREE.RingGeometry(0.05, 0.1, 24), new THREE.MeshBasicMaterial({ color: '#e8f6ff', transparent: true, opacity: 0.8, side: THREE.DoubleSide }), 0, Wd.A.bot + 0.56, -0.4, scene, { cast: false, noink: true }); Wd.ripple.rotation.x = -Math.PI / 2;
  // the vault: plank floor, beams, lantern, gold pile, sign
  add(tbox(Wd.V.x1 - Wd.V.x0, 0.06, ZF - ZB, 1), plankM, (Wd.V.x0 + Wd.V.x1) / 2, Wd.V.y0 + 0.03, (ZF + ZB) / 2, scene);
  for (const x of [Wd.V.x0 + 0.12, Wd.V.x1 - 0.12]) add(box(0.12, Wd.V.y1 - Wd.V.y0, 0.12), '#6a4a32', x, (Wd.V.y0 + Wd.V.y1) / 2, ZB + 0.15, scene);
  add(box(Wd.V.x1 - Wd.V.x0, 0.12, 0.12), '#6a4a32', (Wd.V.x0 + Wd.V.x1) / 2, Wd.V.y1 - 0.06, ZB + 0.15, scene);
  { const ln = group(Wd.V.x1 - 0.35, Wd.V.y1 - 0.35, ZB + 0.3); add(box(0.14, 0.2, 0.14), '#3b3f4a', 0, 0, 0, ln); const gl = add(box(0.1, 0.14, 0.1), toon({ color: '#ffe9a0', emissive: '#ffcc55', emissiveIntensity: 2.2 }), 0, 0, 0, ln, { cast: false }); gl.material.userData.bloomK = 0.6; Wd.lantern = ln; }
  Wd.vaultLight = new THREE.PointLight('#ffcf7a', 3.0, 5, 2); Wd.vaultLight.position.set(-1.7, Wd.V.y1 - 0.4, -0.2); scene.add(Wd.vaultLight);
  Wd.gold = group(-1.75, Wd.V.y0 + 0.06, -0.55);
  add(new THREE.ConeGeometry(0.62, 0.42, 22), toon({ color: '#f4c430', metalness: 0.35, roughness: 0.45, emissive: '#a07010', emissiveIntensity: 0.25 }), 0, 0.21, 0, Wd.gold);
  for (let k = 0; k < 16; k++) { const a = R() * 6.28, r = 0.25 + R() * 0.45; add(cyl(0.07, 0.07, 0.02, 12), toon({ color: '#f4d35e', metalness: 0.8, roughness: 0.2, emissive: '#c89010', emissiveIntensity: 0.5 }), Math.cos(a) * r, 0.03 + (0.62 - r) * 0.4, Math.sin(a) * r * 0.6, Wd.gold).rotation.set(R() * 0.6, 0, R() * 0.6); }
  // ---------- the decoy shaft (dry, no water) ----------
  Wd.dkLine = shaft(Wd.Dk.x, Wd.Dk.top, 0, 0.6); Wd.dkLine.visible = false;
  Wd.dkBotLine = add(cyl(0.6, 0.6, 1, 28, true, Math.PI / 2, Math.PI), darkSoilM, Wd.Dk.x, 0, ZB + 0.6, scene, { cast: false }); Wd.dkBotLine.material = darkSoilM; darkSoilM.side = THREE.DoubleSide;
  // the tunnel water (the moat)
  Wd.moat = add(box(1, 0.55, ZF - ZB - 0.02), toon({ color: '#3f93d6', roughness: 0.08, emissive: '#1d5a9a', emissiveIntensity: 0.35, transparent: true, opacity: 0.92 }), 0, Wd.T.y0 + 0.27, (ZF + ZB) / 2, scene, { cast: false });
  Wd.lily = group(-3.6, Wd.T.y0 + 0.56, -0.35); add(cyl(0.26, 0.26, 0.02, 18, false, 0.3, 5.8), '#5aa83a', 0, 0, 0, Wd.lily);

  // ---------- well heads ----------
  const wellHead = (x, parent = scene, roofCol = '#c62f36') => { const wh = group(x, 0, -0.45, parent);
    const ring = add(cyl(0.78, 0.82, 0.72, 30, true), stoneM, 0, 0.36, 0, wh); add(new THREE.TorusGeometry(0.8, 0.08, 8, 30), '#a89a8a', 0, 0.72, 0, wh).rotation.x = Math.PI / 2;
    for (const s of [-1, 1]) add(box(0.12, 1.75, 0.12), '#6a4a32', s * 0.86, 1.55, 0, wh);
    const roof = add(new THREE.ConeGeometry(1.35, 0.75, 4), roofCol, 0, 2.75, 0, wh); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.7;
    const crank = group(0, 2.15, 0, wh); add(cyl(0.07, 0.07, 1.75, 10), '#8a5734', 0, 0, 0, crank).rotation.z = Math.PI / 2; add(box(0.05, 0.34, 0.05), '#8a5734', 0.92, -0.15, 0, crank);
    return { g: wh, crank, ring }; };
  Wd.wA = wellHead(0);
  Wd.wDk = wellHead(Wd.Dk.x, scene, '#2a5fae');
  Wd.rope = add(cyl(0.016, 0.016, 1, 6), '#d8c08a', 0, 0, 0, scene, { cast: false });
  Wd.bucket = group(0, 1.5, -0.45); add(cyl(0.2, 0.15, 0.3, 16), '#8a5734', 0, 0, 0, Wd.bucket); for (const y of [-0.08, 0.09]) add(new THREE.TorusGeometry(0.18, 0.014, 6, 16), '#3b3f4a', 0, y, 0, Wd.bucket).rotation.x = Math.PI / 2; add(new THREE.TorusGeometry(0.2, 0.012, 6, 16, Math.PI), '#3b3f4a', 0, 0.15, 0, Wd.bucket);
  Wd.lid = group(0, 0.8, -0.45); add(cyl(0.86, 0.86, 0.08, 30), '#9a6a3e', 0, 0, 0, Wd.lid); for (const z of [-0.4, 0, 0.4]) add(box(1.6, 0.05, 0.12), '#7a5232', 0, 0.06, z, Wd.lid);
  Wd.lock = group(0.3, 0.98, 0.35); add(box(0.3, 0.26, 0.1), toon({ color: '#c9a03a', metalness: 0.7, roughness: 0.3 }), 0, 0, 0, Wd.lock); add(new THREE.TorusGeometry(0.1, 0.03, 8, 16, Math.PI), '#9aa3ad', 0, 0.13, 0, Wd.lock); add(cyl(0.03, 0.03, 0.02, 8), '#2b1f1c', 0, -0.02, 0.06, Wd.lock).rotation.x = Math.PI / 2;
  Wd.dryPuff = []; for (let i = 0; i < 14; i++) Wd.dryPuff.push(add(sph(0.08, 8, 6), '#d8c4a4', 0, -50, 0, scene, { cast: false }));

  // ---------- village (left) ----------
  const house = (x, z, w, h, wall, roof, sgn) => { const g = group(x, 0, z); add(tbox(w, h, 1.6, 1), texM(PAINT.stone(11, 36, 18, 70), 2, 1), 0, h / 2, 0, g); add(box(w * 0.98, h * 0.98, 1.58), wall, 0, h / 2, 0.02, g).scale.set(1, 1, 1);
    const rf = add(new THREE.ConeGeometry(w * 0.82, h * 0.7, 4), roof, 0, h + h * 0.35, 0, g); rf.rotation.y = Math.PI / 4; rf.scale.z = 0.62;
    add(box(0.42, 0.75, 0.04), '#6a4a32', w * 0.2, 0.375, 0.81, g); for (const sx of [-1, 1]) add(box(0.34, 0.3, 0.04), toon({ color: '#ffe8a0', emissive: '#ffcc66', emissiveIntensity: 0.5 }), sx * w * 0.28, h * 0.62, 0.81, g);
    if (sgn) sign(g, [{ t: sgn, c: '#2b1f1c' }], -w * 0.2, h * 0.92, 0.85, 1.1, 0.32, { bg: '#f3e6c4', d: 0.03 }); return g; };
  house(-14.6, -2.3, 2.4, 2.0, '#e8d8b8', '#c62f36'); house(-11.7, -2.4, 2.8, 2.4, '#f0e2c4', '#8a5734', 'TAVERN'); house(-8.6, -2.4, 2.2, 1.9, '#e2d0ae', '#2a5fae');
  for (let x = -16; x <= 8; x += 0.8) { if (Math.abs(x) < 1.3 || Math.abs(x - Wd.Dk.x) < 1.3) continue; add(box(0.07, 0.55, 0.07), '#b07a45', x, 0.27, -3.15, scene); }
  add(box(24, 0.05, 0.05), '#b07a45', -4, 0.45, -3.15, scene);
  for (const [x, z] of [[3.4, -2.6], [6.6, -2.4], [-16.2, -1.0]]) { const t = group(x, 0, z); add(cyl(0.14, 0.2, 1.8, 8), '#6a4a32', 0, 0.9, 0, t); for (let k = 0; k < 3; k++) add(sph(0.7, 12, 8), k % 2 ? '#5f9a3c' : '#6fae45', (R() - 0.5) * 0.6, 2.0 + k * 0.3, (R() - 0.5) * 0.6, t); }
  // the diary (the analogy), on a little plinth in the square
  Wd.diary = group(-10.2, 0, -0.9); add(box(0.6, 0.8, 0.6), texM(PAINT.stone(5, 40, 8, 80), 1, 1), 0, 0.4, 0, Wd.diary);
  { const bk = group(0, 0.95, 0, Wd.diary); add(box(0.62, 0.1, 0.46), '#c0306a', 0, 0, 0, bk); add(box(0.58, 0.08, 0.42), '#f6f1e6', 0.02, 0.01, 0, bk); add(box(0.08, 0.16, 0.08), '#e5c158', 0.3, 0.02, 0, bk); bk.rotation.x = 0.5; Wd.diaryBook = bk; }
  Wd.spot = new THREE.SpotLight('#fff4d0', 0, 9, 0.5, 0.5, 1.5); Wd.spot.position.set(-10.2, 6, 1.5); Wd.spot.target.position.set(-10.2, 0.9, -0.9); scene.add(Wd.spot); scene.add(Wd.spot.target);
  Wd.tumble = group(0, -50, 0); { const m = toon({ color: '#b08a50' }); for (let k = 0; k < 7; k++) { const t = add(new THREE.TorusGeometry(0.22, 0.02, 4, 12), m, 0, 0, 0, Wd.tumble, { cast: false }); t.rotation.set(R() * 3, R() * 3, R() * 3); } }

  // ---------- the animals: frog + goat (3D, inked) ----------
  Wd.frog = group(-3.6, Wd.T.y0 + 0.58, -0.35); { const f = Wd.frog, gm = toon({ color: '#58b046' }), wm = toon({ color: '#ffffff' });
    const body = add(sph(0.2, 18, 12), gm, 0, 0.13, 0, f); body.scale.set(1.15, 0.8, 1); for (const s of [-1, 1]) { add(sph(0.075, 12, 8), wm, s * 0.09, 0.3, 0.07, f); add(sph(0.035, 8, 6), '#1e1714', s * 0.09, 0.31, 0.135, f); add(sph(0.08, 10, 8), gm, s * 0.2, 0.04, 0.07, f).scale.set(1.2, 0.5, 1.4); }
    Wd.throat = add(sph(0.1, 14, 10), toon({ color: '#c8e89a' }), 0, 0.08, 0.15, f); }
  Wd.goat = group(1.9, 0, -0.8); { const gt = Wd.goat, wm = toon({ color: '#f2efe6' }), dk = toon({ color: '#3b3f4a' });
    add(box(0.75, 0.42, 0.36), wm, 0, 0.62, 0, gt); for (const [x, z] of [[-0.28, -0.12], [-0.28, 0.12], [0.28, -0.12], [0.28, 0.12]]) add(box(0.08, 0.42, 0.08), wm, x, 0.21, z, gt);
    const hd = group(0.42, 0.88, 0, gt); add(box(0.32, 0.26, 0.24), wm, 0.08, 0, 0, hd); add(box(0.1, 0.12, 0.2), '#e8b8a8', 0.27, -0.06, 0, hd); for (const s of [-1, 1]) { add(new THREE.ConeGeometry(0.035, 0.22, 6), dk, -0.02, 0.2, s * 0.07, hd).rotation.z = 0.5; add(sph(0.028, 8, 6), '#1e1714', 0.14, 0.05, s * 0.125, hd); add(box(0.14, 0.04, 0.08), wm, -0.04, 0.06, s * 0.15, hd).rotation.x = s * 0.4; }
    add(new THREE.ConeGeometry(0.04, 0.14, 6), wm, 0.22, -0.17, 0, hd).rotation.z = Math.PI; Wd.goatHead = hd; add(new THREE.ConeGeometry(0.05, 0.16, 6), wm, -0.42, 0.78, 0, gt).rotation.z = 0.9; }
  Wd.warn = group(1.6, 2.7, -0.2); { const m = toon({ color: '#ff3b3b', emissive: '#ff2020', emissiveIntensity: 1.4 }); add(box(0.15, 0.5, 0.1), m, 0, 0.14, 0, Wd.warn); add(sph(0.09, 10, 8), m, 0, -0.27, 0, Wd.warn); }
  Wd.warnLight = new THREE.PointLight('#ff3030', 0, 6, 2); Wd.warnLight.position.set(1.4, 1.8, 0.4); scene.add(Wd.warnLight);
  // the note from the king (a scroll that pops out of the floating bucket)
  Wd.note = group(0, -50, 0); { const tex = E.label([{ t: 'THANKS FOR', c: '#2b1f1c' }, { t: 'GUARDING MY GOLD', c: '#2b1f1c' }, { t: '- THE KING', c: '#c62f36' }], { w: 1024, h: 760, bg: '#f6ecd0', border: '#8a5734' });
    add(new THREE.PlaneGeometry(1.0, 0.74), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, side: THREE.DoubleSide }), 0, 0, 0, Wd.note, { cast: false }); for (const y of [-0.39, 0.39]) add(cyl(0.04, 0.04, 1.08, 10), '#c9a571', 0, y, 0, Wd.note).rotation.z = Math.PI / 2; }
  // FX pools
  Wd.coins = []; for (let i = 0; i < 30; i++) Wd.coins.push(add(cyl(0.06, 0.06, 0.018, 12), toon({ color: '#f4d35e', metalness: 0.8, roughness: 0.2, emissive: '#c89010', emissiveIntensity: 0.6 }), 0, -50, 0, scene, { cast: false }));
  Wd.sparks = []; for (let i = 0; i < 30; i++) Wd.sparks.push(add(sph(0.03, 6, 4), toon({ color: '#fff6c8', emissive: '#ffe9a0', emissiveIntensity: 1.6 }), 0, -50, 0, scene, { cast: false }));
  Wd.dust = []; const dustM = toon({ color: '#d8c8ae', transparent: true, opacity: 0.75 }); for (let i = 0; i < 22; i++) Wd.dust.push(add(sph(0.11, 10, 8), dustM, 0, -50, 0, scene, { cast: false }));
  Wd.drops = []; for (let i = 0; i < 22; i++) Wd.drops.push(add(sph(0.05, 8, 6), toon({ color: '#9fd4ff', emissive: '#3f93d6', emissiveIntensity: 0.5 }), 0, -50, 0, scene, { cast: false }));
  Wd.confetti = []; for (let i = 0; i < 60; i++) Wd.confetti.push(add(box(0.08, 0.05, 0.01), ['#c62f36', '#f4d35e', '#2a5fae', '#3fa39a', '#e07a5f'][i % 5], 0, -50, 0, scene, { cast: false }));
  Wd.birds = [0, 1, 2].map((i) => { const b = group(0, 6, -10); add(sph(0.08, 8, 6), '#3b3f4a', 0, 0, 0, b).scale.set(1.4, 0.7, 0.7); const w1 = add(box(0.3, 0.01, 0.1), '#3b3f4a', 0, 0, 0.1, b), w2 = add(box(0.3, 0.01, 0.1), '#3b3f4a', 0, 0, -0.1, b); Wd.life.push((t) => { const u = (t * 0.03 + i * 0.3) % 1; b.position.set(-16 + u * 26, 6 + Math.sin(t + i) * 0.5 + i * 0.6, -10 - i); const f = Math.sin(t * 14 + i) * 0.7; w1.rotation.x = f; w2.rotation.x = -f; }); return b; });
  Wd.tick = (t) => { for (const f of Wd.life) f(t); const p = Wd.flag.geometry.attributes.position, bb = Wd.flag.userData.base; for (let k = 0; k < p.count; k++) { const x = bb[k * 3]; p.setZ(k, Math.sin(t * 4 + x * 6) * 0.05 * (x + 0.6)); } p.needsUpdate = true; };
  return Wd;
})();
