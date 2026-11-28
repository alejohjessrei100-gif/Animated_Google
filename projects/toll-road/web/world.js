// "The Toll Road" (Gus). One side-on cutaway diorama that grows: dirt road -> paved road -> swamp bridge -> highway.
// Under the road, hidden until the twist: the pipe from Gus's jar and the seller's lair. No text signs anywhere.
window.WORLD = (() => {
  const E = ENGINE, { add, box, tbox, group, toon, texM, scene } = E;
  const Wd = {}; const R = PAINT.rng(42);
  const cyl = (rt, rb, h, n = 20, open = false, t0 = 0, tl = Math.PI * 2) => new THREE.CylinderGeometry(rt, rb, h, n, 1, open, t0, tl);
  const sph = (r, a = 16, b = 12) => new THREE.SphereGeometry(r, a, b);
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  Wd.life = [];
  const ZF = 0.3, ZB = -1.05, ZBACK = -4.2;
  Wd.ZF = ZF; Wd.ROADZ = -1.25;

  // ---------- textures ----------
  const soilCanvas = () => { const [c, g] = cv(1024, 1024); const bands = ['#8a6644', '#7a5a3a', '#94704a', '#6e5034', '#83603e', '#5e4630']; let y = 0, i = 0; while (y < 1024) { const h = 80 + R() * 110; g.fillStyle = bands[i++ % bands.length]; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + Math.sin(x * 0.012 + i) * 12); g.lineTo(1024, y + h + 14); g.lineTo(0, y + h + 14); g.fill(); y += h; }
    for (let k = 0; k < 150; k++) { g.fillStyle = ['#b49e84', '#94846f', '#cdb89c', '#655443'][k % 4]; g.beginPath(); g.ellipse(R() * 1024, R() * 1024, 6 + R() * 15, 4 + R() * 9, R() * 3, 0, 7); g.fill(); g.strokeStyle = 'rgba(40,25,10,.55)'; g.lineWidth = 2.5; g.stroke(); } return c; };
  const soilT = new THREE.CanvasTexture(soilCanvas()); soilT.colorSpace = THREE.SRGBColorSpace; soilT.wrapS = soilT.wrapT = THREE.RepeatWrapping; soilT.anisotropy = 4;
  const soilM = toon({ map: soilT, roughness: 0.95 });
  const darkSoilM = toon({ map: soilT, color: '#9a8070', roughness: 0.95 }); darkSoilM.side = THREE.DoubleSide;
  const grassM = texM(PAINT.grass(6), 1, 1); grassM.map.wrapS = grassM.map.wrapT = THREE.RepeatWrapping;
  const plankM = texM(PAINT.stone(8, 28, 40, 48, 256, 40), 1, 2);
  const dirtC = () => { const [c, g] = cv(512, 512); g.fillStyle = '#a07a4e'; g.fillRect(0, 0, 512, 512); for (let k = 0; k < 900; k++) { g.fillStyle = ['#8a6640', '#b48c5c', '#7a5634'][k % 3]; g.beginPath(); g.arc(R() * 512, R() * 512, 1 + R() * 4, 0, 7); g.fill(); } g.strokeStyle = 'rgba(70,45,25,.5)'; g.lineWidth = 10; for (const y of [150, 360]) { g.beginPath(); for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x * 0.03) * 8); g.stroke(); } return c; };
  const dirtM = texM(dirtC(), 8, 1); dirtM.map.wrapS = THREE.RepeatWrapping;
  const asphC = () => { const [c, g] = cv(512, 256); g.fillStyle = '#4a4d55'; g.fillRect(0, 0, 512, 256); for (let k = 0; k < 1400; k++) { g.fillStyle = ['#3e4148', '#565a62', '#45484f'][k % 3]; g.fillRect(R() * 512, R() * 256, 2, 2); } g.fillStyle = '#e8e2d0'; g.fillRect(0, 8, 512, 6); g.fillRect(0, 242, 512, 6); return c; };
  const asphM = texM(asphC(), 6, 1); asphM.map.wrapS = THREE.RepeatWrapping;

  const W4 = 3.2;
  const slab = (x0, x1, y0, y1, z0, z1, mats = [soilM, soilM, grassM, soilM, soilM, soilM], parent = scene) => {
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), p = g.attributes.position, uv = g.attributes.uv, n = g.attributes.normal;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
    for (let i = 0; i < p.count; i++) { const wx = p.getX(i) + cx, wy = p.getY(i) + cy, wz = p.getZ(i) + cz, nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i));
      if (ny > 0.5) uv.setXY(i, wx / 2.2, wz / 2.2); else if (nx > 0.5) uv.setXY(i, wz / W4, wy / W4); else uv.setXY(i, wx / W4, wy / W4); }
    return add(g, mats, cx, cy, cz, parent);
  };

  // ---------- sky, hills, far town + castle ----------
  { const [c, g] = cv(16, 512); const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#3a74d8'); gr.addColorStop(0.65, '#a6d6ff'); gr.addColorStop(1, '#ffe6b8'); g.fillStyle = gr; g.fillRect(0, 0, 16, 512); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; add(new THREE.PlaneGeometry(220, 70), new THREE.MeshBasicMaterial({ map: t, fog: false }), 0, 16, -70, scene, { cast: false }); }
  for (let i = 0; i < 11; i++) { const h = add(sph(9 + R() * 6, 22, 10), i % 2 ? '#7aa64c' : '#8cb562', -50 + i * 11, -5.5, -36 - (i % 3) * 4, scene, { cast: false }); h.scale.y = 0.62; }
  for (let i = 0; i < 7; i++) { const cl = group(-36 + i * 12, 11 + R() * 4, -48); for (let k = 0; k < 4; k++) add(sph(1.2 + R() * 0.8, 12, 8), '#ffffff', k * 1.3 - 2, R() * 0.6, 0, cl, { cast: false }); Wd.life.push((t) => { cl.position.x = -36 + i * 12 + t * 0.25; }); }
  { const c = group(-4, 0, -26); const sm = texM(PAINT.stone(4, 40, 10, 76), 1, 2);
    for (const [x, h] of [[-3.2, 7], [0, 9.5], [3.2, 7]]) { add(tbox(2.2, h, 2.2, 2), sm, x, h / 2, 0, c); add(new THREE.ConeGeometry(1.6, 2.6, 4), '#6b3c8f', x, h + 1.3, 0, c).rotation.y = Math.PI / 4; }
    add(tbox(8.5, 4.5, 1.6, 2), sm, 0, 2.25, 0.4, c); }

  // ---------- the ground slab with cut-away cavities ----------
  const X0 = -17, X1 = 17, YB = -12;
  Wd.S = { x0: 5.6, x1: 10.2, y0: -1.3 };                      // the swamp pit
  Wd.LAIR = { x0: 1.4, x1: 5.0, y0: -3.7, y1: -1.6 };           // the seller's lair (hidden by a soil cover until the twist)
  const xs = [X0, Wd.LAIR.x0, Wd.LAIR.x1, Wd.S.x0, Wd.S.x1, X1], ys = [YB, Wd.LAIR.y0, Wd.S.y0, Wd.LAIR.y1, 0];
  const inside = (cx, cy, r) => cx > r[0] && cx < r[1] && cy > r[2] && cy < r[3];
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) {
    const cx = (xs[i] + xs[i + 1]) / 2, cy = (ys[j] + ys[j + 1]) / 2;
    if (inside(cx, cy, [Wd.S.x0, Wd.S.x1, Wd.S.y0, 0])) continue;
    if (inside(cx, cy, [Wd.LAIR.x0, Wd.LAIR.x1, Wd.LAIR.y0, Wd.LAIR.y1])) continue;
    slab(xs[i], xs[i + 1], ys[j], ys[j + 1], ZB, ZF);
  }
  slab(X0, Wd.S.x0, YB, 0, ZBACK, ZB, [soilM, soilM, grassM, soilM, darkSoilM, soilM]); slab(Wd.S.x1, X1, YB, 0, ZBACK, ZB, [soilM, soilM, grassM, soilM, darkSoilM, soilM]);
  slab(Wd.S.x0, Wd.S.x1, YB, Wd.S.y0, ZBACK, ZB, [soilM, soilM, darkSoilM, soilM, darkSoilM, soilM]);
  // the swamp extends back (a pond behind the road too)
  slab(Wd.S.x0, Wd.S.x1, Wd.S.y0, Wd.S.y0 + 0.01, ZBACK, ZB, [darkSoilM, darkSoilM, darkSoilM, darkSoilM, darkSoilM, darkSoilM]);
  Wd.lairCover = slab(Wd.LAIR.x0, Wd.LAIR.x1, Wd.LAIR.y0, Wd.LAIR.y1, ZB + 0.001, ZF + 0.001);
  // pebbles in the cut face
  for (let k = 0; k < 34; k++) { const x = X0 + 0.5 + R() * (X1 - X0 - 1), y = -0.4 - R() * 7; if ((x > Wd.S.x0 - 0.3 && x < Wd.S.x1 + 0.3 && y > Wd.S.y0 - 0.3) || (x > Wd.LAIR.x0 - 0.3 && x < Wd.LAIR.x1 + 0.3 && y > Wd.LAIR.y0 - 0.3 && y < Wd.LAIR.y1 + 0.3) || (Math.abs(x - 0.3) < 0.4 && y > -2.6)) continue;
    const p = add(new THREE.DodecahedronGeometry(0.08 + R() * 0.12), ['#a8927a', '#8a7a6a', '#c9b49a'][k % 3], x, y, ZF + 0.02, scene, { cast: false }); p.scale.z = 0.5; }
  for (let k = 0; k < 120; k++) { const x = X0 + R() * (X1 - X0); if (x > Wd.S.x0 - 0.2 && x < Wd.S.x1 + 0.2) continue; const z = ZBACK + R() * (ZF - ZBACK - 0.05); if (z > -2.0 && z < -0.45) continue; add(new THREE.ConeGeometry(0.035, 0.2, 4), k % 2 ? '#4c8a30' : '#5f9a3c', x, 0.1, z, scene, { cast: false }); }

  // ---------- swamp: murky water, reeds, lily pads, bubbles ----------
  const swC = (() => { const [c, g] = cv(64, 256); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#5f9a7a'); gr.addColorStop(0.25, '#35675e'); gr.addColorStop(1, '#122a24'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); for (let k = 0; k < 40; k++) { g.fillStyle = 'rgba(90,140,60,.35)'; g.fillRect(R() * 64, 60 + R() * 190, 2, 10 + R() * 30); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  Wd.swampM = toon({ map: swC, roughness: 0.15, emissive: '#16352f', emissiveIntensity: 0.25, transparent: true, opacity: 0.72, depthWrite: false });
  Wd.swamp = add(box(Wd.S.x1 - Wd.S.x0, 1.0, ZF - ZBACK - 0.02), Wd.swampM, (Wd.S.x0 + Wd.S.x1) / 2, Wd.S.y0 + 0.5 + 0.05, (ZF + ZBACK) / 2, scene, { cast: false });
  for (let k = 0; k < 22; k++) { const x = Wd.S.x0 + 0.2 + R() * (Wd.S.x1 - Wd.S.x0 - 0.4), z = ZBACK + 0.2 + R() * (ZF - ZBACK - 0.5); if (z > -2.3) continue; const h = 0.5 + R() * 0.5; add(cyl(0.02, 0.025, h, 5), '#4c7a2a', x, -0.1 + h / 2, z, scene, { cast: false }); add(cyl(0.045, 0.045, 0.16, 8), '#6b4a2a', x, -0.1 + h - 0.05, z, scene, { cast: false }); }
  for (let k = 0; k < 6; k++) add(cyl(0.22, 0.22, 0.02, 16, false, 0.3, 5.8), '#5aa83a', Wd.S.x0 + 0.5 + R() * 3.6, -0.24, ZF - 0.2 - R() * 0.3, scene, { cast: false });
  Wd.bubbles = []; for (let i = 0; i < 8; i++) Wd.bubbles.push(add(sph(0.035, 8, 6), toon({ color: '#cfe8c0', transparent: true, opacity: 0.7 }), 0, -50, 0, scene, { cast: false }));

  // ---------- the road: dirt, then asphalt rolls out, then the second lane ----------
  const RZ = Wd.ROADZ, RW = 1.5;
  for (const [a, b] of [[X0, Wd.S.x0], [Wd.S.x1, X1]]) add(new THREE.BoxGeometry(b - a, 0.02, RW), dirtM, (a + b) / 2, 0.012, RZ, scene, { cast: false });
  Wd.asph = [[X0, 0], [0, Wd.S.x0], [Wd.S.x1, X1]].map(([a, b]) => { const m = add(new THREE.BoxGeometry(1, 0.03, RW), asphM, 0, 0.03, RZ, scene, { cast: false }); m.userData.ab = [a, b]; return m; });
  Wd.setPave = (k) => Wd.asph.forEach((m, i) => { const [a, b] = m.userData.ab; const w = Math.max(0.001, (b - a) * k); m.visible = k > 0.001; m.scale.x = w; m.position.x = i === 0 ? b - w / 2 : a + w / 2; });
  Wd.lane2 = add(new THREE.BoxGeometry(X1 - X0, 0.03, 0.9), asphM, 0, 0.031, RZ - 1.2, scene, { cast: false });
  Wd.dashes = []; for (let x = X0 + 0.5; x < X1; x += 1.1) { if (x > Wd.S.x0 - 0.2 && x < Wd.S.x1 + 0.2) continue; Wd.dashes.push(add(box(0.5, 0.012, 0.07), '#f4d35e', x, 0.05, RZ, scene, { cast: false })); }
  // lamp posts (highway)
  Wd.lamps = []; for (let x = -14; x <= 15; x += 3.4) { if (x > Wd.S.x0 - 0.3 && x < Wd.S.x1 + 0.3) continue; const l = group(x, 0, RZ - 1.85); add(cyl(0.05, 0.06, 2.4, 8), '#3b3f4a', 0, 1.2, 0, l); add(box(0.5, 0.06, 0.08), '#3b3f4a', 0, 2.4, 0.2, l).rotation.y = Math.PI / 2; const b = add(sph(0.11, 10, 8), toon({ color: '#fff4c8', emissive: '#ffd27a', emissiveIntensity: 1.4 }), 0, 2.32, 0.42, l, { cast: false }); Wd.lamps.push(l); }

  // ---------- the bridge (planks that sag) + stone pillars that arrive with the highway ----------
  Wd.planks = []; const NP = 16, BX0 = Wd.S.x0 - 0.25, BX1 = Wd.S.x1 + 0.25;
  for (let i = 0; i < NP; i++) { const x = BX0 + (i + 0.5) * (BX1 - BX0) / NP; const p = group(x, 0.06, RZ); add(box((BX1 - BX0) / NP - 0.02, 0.07, RW + 0.1), i % 2 ? '#9a6a3e' : '#8a5a32', 0, 0, 0, p); for (const s of [-1, 1]) add(box(0.05, 0.42, 0.05), '#6a4a32', 0, 0.22, s * (RW / 2 + 0.05), p); p.userData.u = (i + 0.5) / NP; Wd.planks.push(p); }
  Wd.rails = [-1, 1].map((s) => add(cyl(0.025, 0.025, 1, 6), '#6a4a32', 0, 0, 0, scene, { cast: false }));
  Wd.pillars = [0.3, 0.7].map((u) => { const x = BX0 + u * (BX1 - BX0); return add(tbox(0.5, 1.6, 1.2, 1), texM(PAINT.stone(4, 40, 10, 76), 1, 2), x, -0.8, RZ, scene); });
  Wd.bridgeX = [BX0, BX1];

  // ---------- the toll booth (in front of the road), barrier arm across the road, the jar, the pipe ----------
  Wd.booth = group(0, 0, -0.05); { const b = Wd.booth;
    add(tbox(1.0, 1.0, 0.6, 1), plankM, 0, 0.5, 0, b); add(box(1.04, 0.06, 0.66), '#6a4a32', 0, 1.02, 0, b);
    for (const s of [-1, 1]) add(box(0.08, 0.9, 0.08), '#6a4a32', s * 0.46, 1.48, 0, b);
    const roof = add(new THREE.BoxGeometry(1.3, 0.12, 0.9), '#c62f36', 0, 1.98, 0, b); roof.rotation.z = 0.05; add(box(1.34, 0.06, 0.94), '#f4f1e8', 0, 1.9, 0, b);
    add(box(0.9, 0.04, 0.04), '#f4f1e8', 0, 1.8, 0.33, b); }
  Wd.barrier = group(-0.45, 0.95, -0.4); { const a = group(0, 0, 0, Wd.barrier); for (let k = 0; k < 6; k++) add(box(0.06, 0.06, 0.28), k % 2 ? '#c62f36' : '#f4f1e8', 0, 0, -k * 0.28 - 0.14, a); Wd.arm = a; add(box(0.14, 0.14, 0.14), '#3b3f4a', 0, 0, 0, Wd.barrier); add(box(0.08, 0.95, 0.08), '#3b3f4a', 0, -0.47, 0, Wd.barrier); }
  Wd.jar = group(0.25, 1.05, 0.12); { const j = Wd.jar; add(cyl(0.17, 0.17, 0.36, 22, true), toon({ color: '#cfe8f0', transparent: true, opacity: 0.38, roughness: 0.05 }), 0, 0.18, 0, j, { cast: false }); add(cyl(0.19, 0.19, 0.04, 22), '#8a5734', 0, 0.37, 0, j); Wd.jarFill = add(cyl(0.15, 0.15, 1, 18), toon({ color: '#f4c430', metalness: 0.6, roughness: 0.3, emissive: '#a07010', emissiveIntensity: 0.3 }), 0, 0.01, 0, j, { cast: false }); }
  Wd.jarLight = new THREE.PointLight('#ffd27a', 0, 3, 2); Wd.jarLight.position.set(0.25, 1.4, 0.6); scene.add(Wd.jarLight);
  // pipe: jar -> down through the booth -> under the road -> into the lair (on the cut face, revealed at the twist)
  const pipeM = toon({ color: '#9aa3ad', metalness: 0.6, roughness: 0.35 });
  Wd.pipe = group(0, 0, 0); add(cyl(0.07, 0.07, 2.6, 12), pipeM, 0.25, -1.3, ZF - 0.02, Wd.pipe); add(new THREE.TorusGeometry(0.15, 0.07, 10, 14, Math.PI / 2), pipeM, 0.4, -2.6, ZF - 0.02, Wd.pipe).rotation.z = Math.PI; add(cyl(0.07, 0.07, 1.05, 12), pipeM, 0.92, -2.75, ZF - 0.02, Wd.pipe).rotation.z = Math.PI / 2;
  // ---------- the lair ----------
  Wd.lair = group(0, 0, 0); { const L = Wd.lair, cxL = (Wd.LAIR.x0 + Wd.LAIR.x1) / 2;
    add(tbox(Wd.LAIR.x1 - Wd.LAIR.x0, 0.06, ZF - ZB, 1), plankM, cxL, Wd.LAIR.y0 + 0.03, (ZF + ZB) / 2, L);
    for (const x of [Wd.LAIR.x0 + 0.12, Wd.LAIR.x1 - 0.12]) add(box(0.12, Wd.LAIR.y1 - Wd.LAIR.y0, 0.12), '#6a4a32', x, (Wd.LAIR.y0 + Wd.LAIR.y1) / 2, ZB + 0.15, L);
    add(box(Wd.LAIR.x1 - Wd.LAIR.x0, 0.12, 0.12), '#6a4a32', cxL, Wd.LAIR.y1 - 0.06, ZB + 0.15, L);
    // a velvet chair, a desk with a lamp, a portrait frame (no text), the money pile
    const ch = group(cxL + 0.6, Wd.LAIR.y0 + 0.06, -0.55, L); add(box(0.7, 0.45, 0.6), '#7a2a4a', 0, 0.22, 0, ch); add(box(0.7, 0.8, 0.14), '#7a2a4a', 0, 0.75, -0.25, ch); for (const s of [-1, 1]) add(sph(0.06, 8, 6), '#f4c430', s * 0.34, 1.16, -0.25, ch);
    const dk = group(cxL - 0.9, Wd.LAIR.y0 + 0.06, -0.5, L); add(box(1.0, 0.06, 0.55), '#5a3a24', 0, 0.62, 0, dk); for (const s of [-1, 1]) add(box(0.06, 0.62, 0.5), '#5a3a24', s * 0.46, 0.31, 0, dk); add(cyl(0.04, 0.06, 0.3, 8), '#3b3f4a', -0.3, 0.8, 0, dk); add(new THREE.ConeGeometry(0.14, 0.14, 12, 1, true), toon({ color: '#2f6b4f', side: THREE.DoubleSide }), -0.3, 0.98, 0, dk);
    add(box(0.8, 0.6, 0.04), '#c9a03a', cxL, Wd.LAIR.y1 - 0.55, ZB + 0.03, L); add(box(0.68, 0.48, 0.02), '#6b3c8f', cxL, Wd.LAIR.y1 - 0.55, ZB + 0.06, L);
    Wd.hoard = group(cxL + 0.1, Wd.LAIR.y0 + 0.06, -0.2, L); add(new THREE.ConeGeometry(0.75, 0.5, 22), toon({ color: '#f4c430', metalness: 0.35, roughness: 0.45, emissive: '#a07010', emissiveIntensity: 0.25 }), 0, 0.25, 0, Wd.hoard); }
  Wd.lairLight = new THREE.PointLight('#ffcf7a', 0, 6, 2); Wd.lairLight.position.set(3.2, -2.0, -0.1); scene.add(Wd.lairLight);
  // ---------- the bank with a screen door (the analogy) ----------
  Wd.bank = group(-9.5, 0, -2.9); { const b = Wd.bank, sm = texM(PAINT.stone(5, 40, 8, 80), 2, 1);
    add(tbox(3.0, 2.2, 1.2, 1), sm, 0, 1.1, 0, b); const rf = add(new THREE.ConeGeometry(2.3, 0.8, 4), '#d8d1c4', 0, 2.6, 0, b); rf.rotation.y = Math.PI / 4; rf.scale.z = 0.4;
    for (const x of [-1.2, -0.7, 0.7, 1.2]) add(cyl(0.1, 0.1, 2.0, 10), '#f4f1e8', x, 1.0, 0.65, b);
    add(box(1.0, 1.4, 0.04), '#1e1714', 0, 0.7, 0.61, b); add(new THREE.ConeGeometry(0.28, 0.3, 14), toon({ color: '#f4c430', emissive: '#a07010', emissiveIntensity: 0.4 }), 0, 0.15, 0.4, b);
    const [c, g] = cv(256, 360); g.strokeStyle = 'rgba(60,70,80,.85)'; g.lineWidth = 2; for (let x = 0; x < 256; x += 12) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 360); g.stroke(); } for (let y = 0; y < 360; y += 12) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); } g.strokeStyle = '#8a5734'; g.lineWidth = 20; g.strokeRect(0, 0, 256, 360); g.beginPath(); g.moveTo(0, 180); g.lineTo(256, 180); g.stroke();
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; const dh = group(-0.5, 0, 0.66, b); const d = add(new THREE.PlaneGeometry(1.0, 1.4), new THREE.MeshBasicMaterial({ map: tx, transparent: true, side: THREE.DoubleSide }), 0.5, 0.7, 0, dh, { cast: false, noink: true }); Wd.screenDoor = dh; }

  // ---------- wagons ----------
  const WAGC = ['#c62f36', '#2a5fae', '#3fa39a', '#e07a5f', '#6b3c8f', '#f4d35e', '#2f6b4f', '#8a5734'];
  Wd.wagons = []; for (let i = 0; i < 12; i++) { const w = group(0, -50, RZ); const body = add(box(0.9, 0.34, 0.6), WAGC[i % WAGC.length], 0, 0.42, 0, w); add(cyl(0.3, 0.3, 0.84, 16, false, 0, Math.PI), '#f4f1e8', 0, 0.58, 0, w).rotation.z = Math.PI / 2;
    const wheels = []; for (const [x, z] of [[-0.3, 0.33], [0.3, 0.33], [-0.3, -0.33], [0.3, -0.33]]) { const wh = group(x, 0.2, z, w); add(cyl(0.18, 0.18, 0.05, 14), '#5a3a24', 0, 0, 0, wh).rotation.x = Math.PI / 2; add(box(0.3, 0.04, 0.06), '#d8c08a', 0, 0, 0.03, wh); wheels.push(wh); }
    add(box(0.5, 0.04, 0.04), '#6a4a32', 0.68, 0.32, 0, w); w.userData.wheels = wheels; w.visible = false; Wd.wagons.push(w); }

  // ---------- the trio: pigeon + horse (3D) ----------
  Wd.pigeon = group(-0.22, 1.05, 0.12); { const p = Wd.pigeon, gm = toon({ color: '#8a93a6' });
    const bd = add(sph(0.12, 16, 12), gm, 0, 0.1, 0, p); bd.scale.set(1.3, 0.9, 0.9); Wd.pigHead = group(0.12, 0.22, 0, p); add(sph(0.07, 12, 10), toon({ color: '#6b7488' }), 0, 0, 0, Wd.pigHead); add(new THREE.ConeGeometry(0.025, 0.06, 6), '#f4c430', 0.08, -0.01, 0, Wd.pigHead).rotation.z = -Math.PI / 2; for (const s of [-1, 1]) add(sph(0.016, 6, 5), '#1e1714', 0.04, 0.02, s * 0.05, Wd.pigHead);
    add(box(0.12, 0.04, 0.18), '#6b7488', -0.15, 0.12, 0, p).rotation.z = 0.4; for (const s of [-1, 1]) add(box(0.02, 0.06, 0.02), '#e07a5f', 0, -0.01, s * 0.04, p); }
  Wd.horse = group(1.85, 0, -0.15); { const h = Wd.horse, bm = toon({ color: '#9a6a3e' }), dm = toon({ color: '#3b2a20' });
    add(box(0.95, 0.5, 0.42), bm, 0, 0.9, 0, h); for (const [x, z] of [[-0.36, -0.14], [-0.36, 0.14], [0.36, -0.14], [0.36, 0.14]]) add(box(0.1, 0.66, 0.1), bm, x, 0.33, z, h);
    const nk = group(-0.45, 1.05, 0, h); add(box(0.22, 0.55, 0.26), bm, 0, 0.22, 0, nk).rotation.z = 0.35; const hd = group(-0.16, 0.52, 0, nk); add(box(0.42, 0.22, 0.24), bm, -0.12, 0, 0, hd); add(box(0.14, 0.16, 0.22), '#c9a58a', -0.34, -0.04, 0, hd); for (const s of [-1, 1]) { add(sph(0.03, 8, 6), '#1e1714', -0.04, 0.06, s * 0.125, hd); add(new THREE.ConeGeometry(0.04, 0.12, 6), bm, 0.06, 0.15, s * 0.08, hd); }
    for (let k = 0; k < 5; k++) add(box(0.06, 0.12, 0.3), dm, 0.04 + k * 0.03, 0.15 - k * 0.12, 0, nk); add(box(0.08, 0.5, 0.08), dm, 0.5, 0.82, 0, h).rotation.z = -0.5;
    Wd.horseNeck = nk; Wd.horseHead = hd; }
  Wd.receipts = []; for (let i = 0; i < 6; i++) Wd.receipts.push(add(box(0.16, 0.22, 0.01), '#f6f1e6', 0, -50, 0, scene, { cast: false }));
  // FX pools
  const coinM = toon({ color: '#f4d35e', metalness: 0.8, roughness: 0.2, emissive: '#c89010', emissiveIntensity: 0.6 });
  Wd.coins = []; for (let i = 0; i < 40; i++) Wd.coins.push(add(cyl(0.05, 0.05, 0.015, 12), coinM, 0, -50, 0, scene, { cast: false }));
  Wd.sparks = []; for (let i = 0; i < 24; i++) Wd.sparks.push(add(sph(0.03, 6, 4), toon({ color: '#fff6c8', emissive: '#ffe9a0', emissiveIntensity: 1.6 }), 0, -50, 0, scene, { cast: false }));
  const dustM = toon({ color: '#d8c8ae', transparent: true, opacity: 0.75 });
  Wd.dust = []; for (let i = 0; i < 22; i++) Wd.dust.push(add(sph(0.11, 10, 8), dustM, 0, -50, 0, scene, { cast: false }));
  Wd.drops = []; for (let i = 0; i < 20; i++) Wd.drops.push(add(sph(0.035, 8, 6), toon({ color: '#e4f4ee', transparent: true, opacity: 0.8 }), 0, -50, 0, scene, { cast: false }));
  Wd.confetti = []; for (let i = 0; i < 60; i++) Wd.confetti.push(add(box(0.08, 0.05, 0.01), ['#c62f36', '#f4d35e', '#2a5fae', '#3fa39a', '#e07a5f'][i % 5], 0, -50, 0, scene, { cast: false }));
  Wd.steam = []; for (let i = 0; i < 16; i++) Wd.steam.push(add(sph(0.12, 10, 8), toon({ color: '#e8eef2', transparent: true, opacity: 0.6 }), 0, -50, 0, scene, { cast: false }));
  Wd.birds = [0, 1, 2].map((i) => { const b = group(0, 6, -10); add(sph(0.08, 8, 6), '#3b3f4a', 0, 0, 0, b).scale.set(1.4, 0.7, 0.7); const w1 = add(box(0.3, 0.01, 0.1), '#3b3f4a', 0, 0, 0.1, b), w2 = add(box(0.3, 0.01, 0.1), '#3b3f4a', 0, 0, -0.1, b); Wd.life.push((t) => { const u = (t * 0.03 + i * 0.3) % 1; b.position.set(-16 + u * 32, 6 + Math.sin(t + i) * 0.5 + i * 0.6, -10 - i); const f = Math.sin(t * 14 + i) * 0.7; w1.rotation.x = f; w2.rotation.x = -f; }); return b; });
  Wd.tick = (t) => { for (const f of Wd.life) f(t); };
  return Wd;
})();
