// "The Tax Bunker" (Gus). Forest diorama (the bunker is the subject, so its cutaway is shown) + the town, where the
// tax office stays a solid building until "the cellar", when its front wall and the street drop away. No text signs.
window.WORLD = (() => {
  const E = ENGINE, { add, box, tbox, group, toon, texM, scene } = E;
  const S = SCENERY.create(17), Wd = { S, life: S.life }; const R = S.R, { cyl, sph, cv, tex } = S;
  const ZF = 0.3, ZB = -1.05, ZBACK = -10; Wd.ZF = ZF;
  S.backdrop(); S.clouds({ n: 26, y0: 9, dy: 1.6 }); S.farTown();

  // ---------- ground: soil slab cut open along z = ZF, with the cavities the story digs ----------
  const soilC = () => { const [c, g] = cv(1024, 1024); const bands = ['#8a6644', '#7a5a3a', '#94704a', '#6e5034', '#83603e', '#5e4630']; let y = 0, i = 0; while (y < 1024) { const h = 70 + R() * 110; g.fillStyle = bands[i++ % bands.length]; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + Math.sin(x * 0.012 + i) * 12); g.lineTo(1024, y + h + 14); g.lineTo(0, y + h + 14); g.fill(); y += h; }
    for (let k = 0; k < 160; k++) { g.fillStyle = ['#b49e84', '#94846f', '#cdb89c', '#655443'][k % 4]; g.beginPath(); g.ellipse(R() * 1024, R() * 1024, 6 + R() * 15, 4 + R() * 9, R() * 3, 0, 7); g.fill(); g.strokeStyle = 'rgba(40,25,10,.55)'; g.lineWidth = 2.5; g.stroke(); }
    g.strokeStyle = '#4a3220'; g.lineWidth = 5; for (let k = 0; k < 14; k++) { let x = R() * 1024, yy = R() * 300; g.beginPath(); g.moveTo(x, yy); for (let s = 0; s < 6; s++) { x += R() * 40 - 20; yy += 16 + R() * 18; g.lineTo(x, yy); } g.stroke(); } return c; };
  const soilM = toon({ map: tex(soilC()), roughness: 0.95 }), darkSoilM = toon({ map: tex(soilC()), color: '#9a8070', roughness: 0.95 });
  const grassM = texM(PAINT.grass(6), 1, 1); grassM.map.wrapS = grassM.map.wrapT = THREE.RepeatWrapping;
  const forestFloorC = () => { const [c, g] = cv(512, 512); g.fillStyle = '#5f8a3a'; g.fillRect(0, 0, 512, 512); for (let k = 0; k < 2400; k++) { g.fillStyle = ['#4f7a30', '#6f9a44', '#7a6a3a', '#5a7a34', '#8a7a4a'][k % 5]; g.fillRect(R() * 512, R() * 512, 2 + R() * 4, 2 + R() * 3); } for (let k = 0; k < 60; k++) { g.fillStyle = 'rgba(120,90,50,.5)'; g.beginPath(); g.ellipse(R() * 512, R() * 512, 6, 3, R() * 3, 0, 7); g.fill(); } return c; };
  const floorM = toon({ map: tex(forestFloorC()), roughness: 0.95 });
  const W4 = 3.2;
  const slab = (x0, x1, y0, y1, z0, z1, top = grassM, parent = scene) => { const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), p = g.attributes.position, uv = g.attributes.uv, n = g.attributes.normal; const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
    for (let i = 0; i < p.count; i++) { const wx = p.getX(i) + cx, wy = p.getY(i) + cy, wz = p.getZ(i) + cz, nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)); if (ny > 0.5) uv.setXY(i, wx / 2.4, wz / 2.4); else if (nx > 0.5) uv.setXY(i, wz / W4, wy / W4); else uv.setXY(i, wx / W4, wy / W4); }
    return add(g, [soilM, soilM, top, soilM, soilM, soilM], cx, cy, cz, parent); };
  const X0 = -26, X1 = 36, YB = -9;
  Wd.SHAFT = { x0: -7.6, x1: -6.8, y0: -0.95, y1: 0 }; Wd.ROOM = { x0: -9.6, x1: -5.4, y0: -2.9, y1: -0.95 };
  Wd.TUN = { x0: -5.4, x1: 6.9, y0: -2.9, y1: -1.5 }; Wd.BSH = { x0: 6.1, x1: 6.9, y0: -1.5, y1: 0 }; Wd.TUN2 = { x0: 6.9, x1: 16.4, y0: -2.9, y1: -1.5 }; Wd.CEL = { x0: 16.4, x1: 21.6, y0: -2.9, y1: -0.2 };
  const cav = [Wd.SHAFT, Wd.ROOM, Wd.TUN, Wd.BSH, Wd.TUN2, Wd.CEL];
  const xs = [...new Set([X0, X1, ...cav.flatMap((c) => [c.x0, c.x1])])].sort((a, b) => a - b), ys = [...new Set([YB, 0, ...cav.flatMap((c) => [c.y0, c.y1])])].sort((a, b) => a - b);
  const inC = (x, y) => cav.some((c) => x > c.x0 && x < c.x1 && y > c.y0 && y < c.y1);
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) { const cx = (xs[i] + xs[i + 1]) / 2, cy = (ys[j] + ys[j + 1]) / 2; if (inC(cx, cy)) continue; slab(xs[i], xs[i + 1], ys[j], ys[j + 1], ZB, ZF, cx < 12 ? floorM : grassM); }
  slab(X0, 12, YB, 0, ZBACK, ZB, floorM); slab(12, X1, YB, 0, ZBACK, ZB, grassM);
  // fillers: soil the story digs out (anchored so they shrink in the digging direction)
  const filler = (c, dir) => { const m = slab(c.x0, c.x1, c.y0, c.y1, ZB + 0.002, ZF - 0.002, darkSoilM); m.userData.c = c; m.userData.dir = dir; return m; };
  Wd.fShaft = filler(Wd.SHAFT, 'down'); Wd.fRoom = filler(Wd.ROOM, 'left'); Wd.fTun = filler(Wd.TUN, 'right'); Wd.fBsh = filler(Wd.BSH, 'up'); Wd.fTun2 = filler(Wd.TUN2, 'right'); Wd.fCel = filler(Wd.CEL, 'none');
  Wd.setFill = (m, k) => { const c = m.userData.c; m.visible = k > 0.003; if (!m.visible) return; k = Math.max(0.003, Math.min(1, k)); const w = c.x1 - c.x0, h = c.y1 - c.y0;
    if (m.userData.dir === 'down') { m.scale.set(1, k, 1); m.position.y = c.y0 + h * k / 2; } else if (m.userData.dir === 'up') { m.scale.set(1, k, 1); m.position.y = c.y1 - h * k / 2; }
    else if (m.userData.dir === 'right') { m.scale.set(k, 1, 1); m.position.x = c.x1 - w * k / 2; } else if (m.userData.dir === 'left') { m.scale.set(k, 1, 1); m.position.x = c.x0 + w * k / 2; } else m.scale.set(1, 1, 1); };
  // cavity back walls + floors with planks / timber supports, and pebbles in the cut face
  { const P = S.parts(); const r = PAINT.rng(5);
    for (let k = 0; k < 60; k++) { const x = X0 + 1 + r() * (X1 - X0 - 2), y = -0.3 - r() * 8; if (inC(x, y) || inC(x + 0.3, y) || inC(x - 0.3, y)) continue; P.add(new THREE.DodecahedronGeometry(0.08 + r() * 0.14), x, y, ZF + 0.01, ['#a8927a', '#8a7a6a', '#c9b49a'][k % 3], [r() * 3, r() * 3, 0], [1, 0.8, 0.45]); }
    for (const c of [Wd.ROOM, Wd.CEL]) { P.box(c.x1 - c.x0, 0.06, ZF - ZB, (c.x0 + c.x1) / 2, c.y0 + 0.03, (ZF + ZB) / 2, '#9a6a3e'); for (let x = c.x0 + 0.25; x < c.x1; x += 1.0) P.box(0.12, c.y1 - c.y0, 0.12, x, (c.y0 + c.y1) / 2, ZB + 0.08, '#6a4a32'); P.box(c.x1 - c.x0, 0.12, 0.12, (c.x0 + c.x1) / 2, c.y1 - 0.06, ZB + 0.08, '#6a4a32'); }
    for (const T of [Wd.TUN, Wd.TUN2]) for (let x = T.x0 + 0.3; x < T.x1; x += 1.4) { P.box(0.08, T.y1 - T.y0, 0.08, x, (T.y0 + T.y1) / 2, ZB + 0.1, '#6a4a32'); P.box(0.6, 0.08, 0.08, x, T.y1 - 0.04, ZB + 0.1, '#6a4a32'); }
    for (let y = Wd.SHAFT.y0 + 0.2; y < 0; y += 0.25) P.box(0.55, 0.04, 0.05, -7.2, y, -0.3, '#8a5734'); P.box(0.05, 1.0, 0.05, -7.45, -0.45, -0.3, '#8a5734'); P.box(0.05, 1.0, 0.05, -6.95, -0.45, -0.3, '#8a5734');
    add(P.build(), S.vcM, 0, 0, 0, scene, { cast: false }); }

  // ---------- the forest: merged pines + oaks + bushes (one mesh), stumps, mushrooms ----------
  { const P = S.parts(); const r = PAINT.rng(31); const pine = (x, z, s) => { P.add(cyl(0.12 * s, 0.18 * s, 1.0 * s, 7), x, 0.5 * s, z, '#6a4a32'); for (let k = 0; k < 4; k++) P.add(new THREE.ConeGeometry((1.0 - k * 0.2) * s, 1.1 * s, 9), x, (1.0 + k * 0.62) * s, z, ['#2f6b3f', '#3a7a46', '#2a5f38', '#44844e'][k]); };
    const oak = (x, z, s) => { P.add(cyl(0.14 * s, 0.22 * s, 1.6 * s, 8), x, 0.8 * s, z, '#6a4a32'); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; P.add(sph(0.55 * s, 10, 8), x + Math.cos(a) * 0.45 * s, (1.9 + (k % 3) * 0.25) * s, z + Math.sin(a) * 0.4 * s, ['#4f8a36', '#5f9a3c', '#6fae45'][k % 3]); } P.add(sph(0.6 * s, 10, 8), x, 2.5 * s, z, '#7fbe52'); };
    for (let k = 0; k < 70; k++) { const x = -24 + r() * 28, z = -1.6 - r() * 8; if (Math.abs(x + 7.2) < 1.6 && z > -3) continue; if (Math.abs(x + 1.5) < 1.4 && Math.abs(z + 2.5) < 1.4) continue; if (Math.abs(x - 6.5) < 2.4 && z > -3.2) continue; if (Math.abs(x - 1.6) < 0.9 && z > -1.6) continue; (r() < 0.65 ? pine : oak)(x, z, 0.9 + r() * 0.7); }
    for (let k = 0; k < 40; k++) { const x = -22 + r() * 26, z = -0.5 - r() * 3; if (Math.abs(x + 7.2) < 1.3) continue; P.add(sph(0.3 + r() * 0.2, 8, 6), x, 0.2, z, ['#4f7a30', '#5f8a3a'][k % 2], [0, 0, 0], [1.3, 0.8, 1]); }
    for (let k = 0; k < 30; k++) { const x = -22 + r() * 26, z = -0.4 - r() * 4; P.add(cyl(0.015, 0.02, 0.12, 5), x, 0.06, z, '#f6f1e6').add(sph(0.06, 8, 5), x, 0.13, z, '#c62f36', [0, 0, 0], [1, 0.5, 1]); }
    for (const [x, z] of [[-11, -1.0], [-3.6, -1.3], [-15, -2.2]]) P.add(cyl(0.3, 0.36, 0.35, 12), x, 0.17, z, '#8a5734').add(cyl(0.29, 0.29, 0.02, 12), x, 0.35, z, '#d8b880');
    add(P.build(), S.vcM, 0, 0, 0, scene); }
  for (let k = 0; k < 160; k++) { const x = X0 + R() * (X1 - X0), z = ZBACK + R() * (ZF - ZBACK - 0.05); if (inC(x, -0.1) && z > ZB) continue; add(new THREE.ConeGeometry(0.035, 0.2, 4), k % 2 ? '#4c8a30' : '#5f9a3c', x, 0.1, z, scene, { cast: false }); }

  // ---------- the trapdoor: lid, mud, pine branches, then 2 feet of sand under it ----------
  Wd.mound = add(sph(0.55, 14, 10), '#7a5a3a', -6.1, 0.0, -0.4, scene); Wd.mound.scale.set(1.2, 0.45, 1);
  Wd.lid = group(-7.2, 0.0, -0.37); add(box(1.05, 0.08, 1.3), '#9a6a3e', 0, 0.04, 0, Wd.lid); for (const z of [-0.45, 0, 0.45]) add(box(1.1, 0.05, 0.1), '#6a4a32', 0, 0.09, z, Wd.lid); add(new THREE.TorusGeometry(0.08, 0.02, 6, 12), '#3b3f4a', 0.3, 0.1, 0.3, Wd.lid).rotation.x = Math.PI / 2;
  Wd.mud = add(sph(0.75, 16, 10), '#5a4030', -7.2, 0.08, -0.37, scene); Wd.mud.scale.set(0.95, 0.12, 1.1);
  Wd.branches = group(-7.2, 0.12, -0.37); for (let k = 0; k < 7; k++) { const b = group(0, 0, 0, Wd.branches); b.rotation.y = k / 7 * 6.28; add(cyl(0.02, 0.03, 1.1, 5), '#6a4a32', 0, 0, 0, b).rotation.z = Math.PI / 2; for (let j = 0; j < 6; j++) add(new THREE.ConeGeometry(0.1, 0.32, 5), '#2f6b3f', -0.45 + j * 0.18, 0.02, (j % 2 ? 0.08 : -0.08), b).rotation.x = (j % 2 ? 1 : -1) * 1.2; }
  Wd.sand = add(box(0.8, 1, 1.32), '#e0c890', -7.2, -0.3, -0.37, scene); Wd.sand.visible = false;
  // ---------- inside the bunker: ladder (above), straw bed, table, shelf, fire pit with pot ----------
  { const P = S.parts(), y0 = Wd.ROOM.y0 + 0.06; P.box(1.2, 0.25, 0.7, -9.0, y0 + 0.12, -0.5, '#d8c08a').box(1.2, 0.05, 0.72, -9.0, y0 + 0.26, -0.5, '#e8d4a0').box(0.9, 0.05, 0.6, -8.1, y0 + 0.55, -0.55, '#8a5734');
    for (const [x, z] of [[-8.5, -0.8], [-8.5, -0.3], [-7.7, -0.8], [-7.7, -0.3]]) P.box(0.05, 0.55, 0.05, x, y0 + 0.27, z, '#6a4a32'); P.box(1.1, 0.05, 0.3, -8.8, y0 + 1.25, -0.88, '#8a5734').box(1.1, 0.05, 0.3, -8.8, y0 + 0.95, -0.88, '#8a5734');
    for (let k = 0; k < 8; k++) P.add(new THREE.DodecahedronGeometry(0.1), -6.0 + Math.cos(k / 8 * 6.28) * 0.3, y0 + 0.06, -0.5 + Math.sin(k / 8 * 6.28) * 0.25, '#7a7068');
    P.add(cyl(0.18, 0.14, 0.22, 12), -6.0, y0 + 0.5, -0.5, '#3b3f4a').box(0.03, 0.4, 0.03, -6.25, y0 + 0.3, -0.5, '#3b3f4a').box(0.03, 0.4, 0.03, -5.75, y0 + 0.3, -0.5, '#3b3f4a').box(0.55, 0.03, 0.03, -6.0, y0 + 0.62, -0.5, '#3b3f4a');
    add(P.build(), S.vcM, 0, 0, 0, scene); }
  Wd.fire = group(-6.0, Wd.ROOM.y0 + 0.1, -0.5); { const fm = toon({ color: '#ffb040', emissive: '#ff8a20', emissiveIntensity: 2.2 }); fm.userData.bloomK = 0.6; for (let k = 0; k < 3; k++) add(new THREE.ConeGeometry(0.1 - k * 0.02, 0.35 - k * 0.06, 8), fm, (k - 1) * 0.07, 0.17, 0, Wd.fire, { cast: false }); }
  Wd.fireLight = new THREE.PointLight('#ffaa55', 0, 4, 2); Wd.fireLight.position.set(-6.0, Wd.ROOM.y0 + 0.6, 0.0); scene.add(Wd.fireLight);
  Wd.food = group(-8.8, Wd.ROOM.y0 + 1.0, -0.88); for (let k = 0; k < 5; k++) add(k % 2 ? sph(0.09, 10, 8) : cyl(0.08, 0.08, 0.16, 10), ['#e0574a', '#c9893a', '#f4d35e'][k % 3], -0.4 + k * 0.2, 0.08, 0, Wd.food);
  Wd.grainBag = group(-8.3, Wd.ROOM.y0 + 0.06, -0.3); add(sph(0.3, 14, 10), '#d8c08a', 0, 0.28, 0, Wd.grainBag).scale.set(1, 1.1, 0.8);

  // ---------- smoke: puffs (from the fire, out the trapdoor / later out the dead tree as fog) ----------
  const smokeM = toon({ color: '#eef0f2', emissive: '#ffffff', emissiveIntensity: 0.2, transparent: true, opacity: 0.5, depthWrite: false });
  Wd.puffs = []; for (let i = 0; i < 22; i++) Wd.puffs.push(add(sph(0.22, 10, 8), smokeM, 0, -50, 0, scene, { cast: false, noink: true }));
  Wd.fog = []; for (let i = 0; i < 28; i++) { const f = add(sph(0.5, 12, 8), smokeM, 0, -50, 0, scene, { cast: false, noink: true }); Wd.fog.push(f); }
  // ---------- 30 feet of hollow logs (on the cut face) + the dead tree ----------
  Wd.logs = []; { const y = -1.2; for (let x = Wd.ROOM.x1; x < 1.4; x += 0.85) { const l = group(x + 0.42, y, ZF - 0.08); add(cyl(0.16, 0.16, 0.84, 12), '#7a5232', 0, 0, 0, l).rotation.z = Math.PI / 2; add(new THREE.TorusGeometry(0.16, 0.035, 6, 14), '#c9a571', 0.42, 0, 0, l).rotation.y = Math.PI / 2; Wd.logs.push(l); }
    for (let y2 = -1.2; y2 < 0; y2 += 0.4) { const l = group(1.6, y2 + 0.2, ZF - 0.08); add(cyl(0.16, 0.16, 0.4, 12), '#7a5232', 0, 0, 0, l); Wd.logs.push(l); } }
  Wd.deadTree = group(1.6, 0, -0.5); { const T = Wd.deadTree, bm = toon({ color: '#6a5a4a' }); add(cyl(0.25, 0.38, 4.2, 10), bm, 0, 2.1, 0, T); add(cyl(0.18, 0.18, 0.05, 12), '#2b1f1c', 0, 4.2, 0, T);
    for (const [y, a, l] of [[2.4, 0.9, 1.4], [3.0, -1.0, 1.2], [3.5, 0.7, 0.9], [1.8, -0.8, 1.0]]) { const b = add(cyl(0.05, 0.1, l, 6), bm, Math.sin(a) * l * 0.45, y + Math.cos(a) * l * 0.4, 0, T); b.rotation.z = -a; } }
  // ---------- the watchtower ----------
  Wd.tower = group(-1.5, 0, -2.6); { const T = Wd.tower, wm = '#8a5734'; for (const [x, z] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) add(cyl(0.07, 0.09, 5.0, 8), wm, x * 0.85, 2.5, z * 0.85, T);
    for (const y of [1.2, 2.6, 3.9]) for (const [x, z, ry] of [[0, -0.6, 0], [0, 0.6, 0], [-0.6, 0, Math.PI / 2], [0.6, 0, Math.PI / 2]]) { const b = add(box(1.2, 0.06, 0.06), '#6a4a32', x, y, z, T); b.rotation.y = ry; }
    add(box(1.9, 0.12, 1.9), '#9a6a3e', 0, 5.0, 0, T); for (const [x, z, w, d] of [[0, 0.92, 1.9, 0.06], [0, -0.92, 1.9, 0.06], [0.92, 0, 0.06, 1.9], [-0.92, 0, 0.06, 1.9]]) add(box(w, 0.5, d), '#8a5734', x, 5.3, z, T);
    const rf = add(new THREE.ConeGeometry(1.5, 0.9, 4), '#5a3a24', 0, 6.6, 0, T); rf.rotation.y = Math.PI / 4; for (const [x, z] of [[-0.85, -0.85], [0.85, -0.85], [-0.85, 0.85], [0.85, 0.85]]) add(cyl(0.04, 0.04, 1.2, 6), wm, x, 5.7, z, T);
    for (let y = 0.3; y < 5; y += 0.35) add(box(0.5, 0.04, 0.04), '#c9a571', 0, y, 0.95, T); }
  // ---------- the king's grain barn ----------
  Wd.barn = group(6.5, 0, -1.7); { const B = Wd.barn, P = S.parts(); const bw = 3.4, bh = 2.6, bd = 2.6;
    const plC = () => { const [c, g] = cv(256, 256); g.fillStyle = '#b8322e'; g.fillRect(0, 0, 256, 256); for (let x = 0; x < 256; x += 24) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x, 0, 3, 256); g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(x + 4, 0, 6, 256); } return c; };
    const bm = texM(plC(), 2, 1); add(new THREE.BoxGeometry(bw, bh, bd), bm, 0, bh / 2, 0, B);
    const tri = new THREE.Shape(); tri.moveTo(-bd / 2 - 0.15, 0); tri.lineTo(bd / 2 + 0.15, 0); tri.lineTo(0, 1.3); tri.closePath(); const rg = add(new THREE.ExtrudeGeometry(tri, { depth: bw + 0.4, bevelEnabled: false }), S.roofMat('#5a4a44'), -bw / 2 - 0.2, bh, 0, B); rg.rotation.y = Math.PI / 2;
    P.box(1.5, 1.8, 0.05, 0, 0.9, bd / 2 + 0.02, '#8a2a26').box(1.6, 0.12, 0.08, 0, 1.85, bd / 2 + 0.04, '#f8f2e4').box(0.1, 1.8, 0.08, -0.78, 0.9, bd / 2 + 0.04, '#f8f2e4').box(0.1, 1.8, 0.08, 0.78, 0.9, bd / 2 + 0.04, '#f8f2e4');
    for (const s of [-1, 1]) P.box(0.08, 2.1, 0.06, s * 0.36, 0.9, bd / 2 + 0.05, '#f8f2e4', [0, 0, s * 0.7]);
    P.box(0.6, 0.5, 0.05, 0, bh + 0.5, bd / 2 + 0.05, '#2b1f1c').box(0.7, 0.07, 0.08, 0, bh + 0.25, bd / 2 + 0.07, '#f8f2e4');
    for (let k = 0; k < 6; k++) P.add(sph(0.28, 10, 8), -1.3 + (k % 3) * 0.32, 0.25 + Math.floor(k / 3) * 0.4, bd / 2 + 0.3, '#d8c08a', [0, 0, 0], [1, 1.2, 0.8]);
    add(P.build(), S.vcM, 0, 0, 0, B); }
  Wd.sackHole = group(6.5, 0.02, -0.6); add(sph(0.32, 12, 10), '#d8c08a', 0, 0.3, 0, Wd.sackHole).scale.set(1, 1.2, 0.8);
  Wd.grain = []; for (let i = 0; i < 26; i++) Wd.grain.push(add(sph(0.03, 6, 4), '#e8c870', 0, -50, 0, scene, { cast: false }));

  // ---------- hounds (3D, inked) ----------
  const hound = () => { const h = group(0, -50, 0), bm = toon({ color: '#a8743e' }), wm = toon({ color: '#f2ead8' }); const body = add(sph(0.3, 14, 10), bm, 0, 0.42, 0, h); body.scale.set(1.5, 0.8, 0.75); add(sph(0.18, 10, 8), wm, 0.15, 0.36, 0, h).scale.set(1.4, 0.7, 0.8);
    const legs = []; for (const [x, z] of [[-0.3, -0.12], [-0.3, 0.12], [0.3, -0.12], [0.3, 0.12]]) { const l = group(x, 0.36, z, h); add(cyl(0.045, 0.04, 0.36, 8), bm, 0, -0.18, 0, l); legs.push(l); }
    const hd = group(0.48, 0.58, 0, h); add(sph(0.17, 12, 10), bm, 0, 0, 0, hd); add(sph(0.1, 10, 8), wm, 0.15, -0.05, 0, hd).scale.set(1.4, 0.8, 0.9); add(sph(0.04, 8, 6), '#1e1714', 0.28, -0.03, 0, hd); for (const s of [-1, 1]) { add(box(0.08, 0.24, 0.05), '#7a4a26', -0.02, -0.06, s * 0.16, hd).rotation.x = s * 0.2; add(sph(0.025, 6, 5), '#1e1714', 0.1, 0.06, s * 0.08, hd); }
    const tail = group(-0.42, 0.52, 0, h); add(cyl(0.025, 0.03, 0.3, 6), bm, 0, 0.13, 0, tail).rotation.z = 0.5; h.userData = { legs, hd, tail }; return h; };
  Wd.hounds = [hound(), hound()]; Wd.hounds.forEach((h) => h.scale.setScalar(0.75));
  // ---------- the army: 40 toy soldiers merged into one marching block ----------
  Wd.army = group(0, -50, 0); { const P = S.parts(); for (let i = 0; i < 40; i++) { const x = (i % 10) * 0.7, z = -Math.floor(i / 10) * 0.8; P.add(cyl(0.12, 0.15, 0.5, 8), x, 0.35, z, '#26304d').add(sph(0.11, 8, 6), x, 0.72, z, '#f2c7a0').add(new THREE.ConeGeometry(0.13, 0.18, 8), x, 0.86, z, '#9aa3ad').add(cyl(0.015, 0.015, 1.1, 5), x + 0.16, 0.6, z, '#8a5734').add(new THREE.ConeGeometry(0.04, 0.12, 5), x + 0.16, 1.18, z, '#d8dde6').box(0.26, 0.06, 0.2, x, 0.5, z + 0.02, '#e5c158'); } add(P.build(), S.vcM, 0, 0, 0, Wd.army); }

  // ---------- the town: street, houses, and the tax office (dollhouse front that drops away) ----------
  S.houseRow([[12.6, 2.9], [24.6, 3.0], [27.8, 2.8], [31.0, 3.0]], -1.6, 4);
  S.houseRow([[13.4, 3.0], [16.8, 2.8], [20.2, 3.1], [23.6, 2.9], [27.0, 3.0], [30.4, 2.8]], -8.6, 30, 1.2); S.smoke();
  Wd.townLid = group(0, 0, 0); { const L = Wd.townLid; slab(12, X1, -0.5, 0, ZF, 14, grassM, L);
    const cobC = () => { const [c, g] = cv(512, 256); g.fillStyle = '#8e8476'; g.fillRect(0, 0, 512, 256); for (let y = 0; y < 256; y += 32) for (let x = (y / 32) % 2 * 24; x < 512; x += 48) { g.fillStyle = ['#b0a494', '#a29684', '#988c7a', '#ab9f8e'][(x * 7 + y) % 4]; g.beginPath(); g.roundRect(x + 2, y + 2, 44, 28, 8); g.fill(); g.strokeStyle = 'rgba(40,30,20,.55)'; g.lineWidth = 2; g.stroke(); } return c; };
    add(new THREE.BoxGeometry(X1 - 12, 0.04, 2.0), texM(cobC(), 12, 1), (12 + X1) / 2, 0.02, ZF + 1.6, L, { cast: false }); add(new THREE.BoxGeometry(X1 - 12, 0.1, 0.8), '#cfc8bc', (12 + X1) / 2, 0.05, ZF + 0.4, L);
    for (let x = 13; x < 35; x += 3.4) { const lp = group(x, 0.1, ZF + 0.7, L); add(cyl(0.05, 0.07, 2.2, 8), '#2b2f3d', 0, 1.1, 0, lp); add(new THREE.ConeGeometry(0.16, 0.22, 6), '#2b2f3d', 0, 2.3, 0, lp); add(sph(0.09, 10, 8), toon({ color: '#fff4c8', emissive: '#ffd27a', emissiveIntensity: 0.9 }), 0, 2.16, 0, lp, { cast: false }); } }
  const OX = 19.0, OW = 5.4, OH = 2.7, OZ0 = ZB, OZ1 = ZF - 0.02; Wd.OX = OX;
  Wd.office = group(0, 0, 0); { const O = Wd.office, mW = S.wallMat('brick', '#9a6a5a'), P = S.parts(); const zc = (OZ0 + OZ1) / 2, d = OZ1 - OZ0;
    add(new THREE.BoxGeometry(OW, OH, 0.12), mW, OX, OH / 2, OZ0 + 0.06, O); for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.12, OH, d), mW, OX + s * OW / 2, OH / 2, zc, O);
    add(new THREE.BoxGeometry(OW + 0.4, 0.15, d + 0.6), '#5a4a44', OX, OH + 0.07, zc + 0.2, O); P.box(OW + 0.5, 0.12, 0.1, OX, OH - 0.05, OZ1 + 0.45, '#f8f2e4');
    P.box(OW - 0.2, 0.06, d, OX, -0.03, zc, '#7a5232'); for (let x = OX - OW / 2 + 0.3; x < OX + OW / 2; x += 0.3) P.box(0.02, 0.005, d, x, 0.003, zc, '#5a3a24');
    P.box(0.9, 1.0, 0.04, OX + 0.4, 1.5, OZ0 + 0.13, '#bfe4f6').box(1.0, 0.07, 0.07, OX + 0.4, 2.02, OZ0 + 0.15, '#f8f2e4').box(1.0, 0.07, 0.1, OX + 0.4, 0.98, OZ0 + 0.16, '#f8f2e4').box(0.04, 1.0, 0.05, OX + 0.4, 1.5, OZ0 + 0.15, '#f8f2e4');
    P.box(1.6, 0.08, 0.7, OX - 1.2, 0.78, zc - 0.05, '#6a3a24'); for (const [x, z] of [[-1.9, -0.3], [-1.9, 0.2], [-0.5, -0.3], [-0.5, 0.2]]) P.box(0.07, 0.78, 0.07, OX + x, 0.39, zc + z, '#4a2a1a');
    P.box(0.5, 0.04, 0.35, OX - 1.4, 0.84, zc, '#f6f1e6').box(0.4, 0.04, 0.3, OX - 1.3, 0.88, zc - 0.05, '#f0e8d4').add(cyl(0.05, 0.05, 0.1, 8), OX - 0.8, 0.87, zc - 0.1, '#1e1714').box(0.02, 0.18, 0.02, OX - 0.78, 0.95, zc - 0.1, '#f6f1e6');
    P.box(0.7, 1.3, 0.5, OX - 2.3, 0.65, OZ0 + 0.35, '#5a6a7a'); for (let k = 0; k < 3; k++) P.box(0.5, 0.04, 0.04, OX - 2.3, 0.3 + k * 0.4, OZ0 + 0.61, '#c9a03a');
    P.add(cyl(0.22, 0.22, 0.04, 20), OX - 1.0, 2.1, OZ0 + 0.14, '#f6f1e6', [Math.PI / 2, 0, 0]).box(0.02, 0.15, 0.02, OX - 1.0, 2.15, OZ0 + 0.17, '#1e1714').box(0.12, 0.02, 0.02, OX - 0.95, 2.1, OZ0 + 0.17, '#1e1714');
    P.add(cyl(0.03, 0.03, 1.7, 6), OX + 2.2, 0.85, zc, '#4a2a1a').add(sph(0.18, 8, 6), OX + 2.25, 1.6, zc, '#2b2f3d', [0, 0, 0], [1, 1.5, 0.7]);
    add(P.build(), S.vcM, 0, 0, 0, O); }
  // the front wall (with door and windows) that drops away on "the cellar"
  Wd.facade = group(0, 0, 0); { const F = Wd.facade, P = S.parts(); add(new THREE.BoxGeometry(OW, OH, 0.12), S.wallMat('brick', '#9a6a5a'), OX, OH / 2, OZ1 - 0.06, F);
    for (const x of [-1.6, 1.6]) { P.box(0.9, 1.0, 0.04, OX + x, 1.4, OZ1 + 0.01, '#9fd0ee').box(1.0, 0.07, 0.07, OX + x, 1.93, OZ1 + 0.03, '#f8f2e4').box(1.1, 0.07, 0.13, OX + x, 0.87, OZ1 + 0.06, '#f8f2e4').box(0.04, 1.0, 0.05, OX + x, 1.4, OZ1 + 0.03, '#f8f2e4'); for (const s of [-1, 1]) P.box(0.18, 1.0, 0.04, OX + x + s * 0.6, 1.4, OZ1 + 0.03, '#2a4a6e'); }
    P.box(0.8, 1.6, 0.05, OX, 0.8, OZ1 + 0.01, '#2a4a6e').box(0.9, 0.08, 0.08, OX, 1.64, OZ1 + 0.03, '#f8f2e4').add(sph(0.04, 6, 5), OX + 0.25, 0.8, OZ1 + 0.05, '#f4d35e').box(1.2, 0.08, 0.4, OX, 0.04, OZ1 + 0.2, '#b8b0a4');
    for (let j = 0; j < 7; j++) P.box(0.2, 0.02, 0.5, OX - 0.6 + j * 0.2, 1.95, OZ1 + 0.25, j % 2 ? '#ffffff' : '#2a4a6e', [-0.5, 0, 0]);
    add(P.build(), S.vcM, 0, 0, 0, F); }
  // the Christmas tree (made of the pine branches) over the hatch, ornaments, star; the hatch
  Wd.HX = OX + 1.2;
  Wd.xtree = group(Wd.HX, 0.0, (OZ0 + OZ1) / 2); { const T = Wd.xtree; add(cyl(0.2, 0.25, 0.25, 12), '#b03a36', 0, 0.12, 0, T); for (let k = 0; k < 4; k++) add(new THREE.ConeGeometry(0.7 - k * 0.15, 0.6, 12), ['#2f6b3f', '#3a7a46', '#2a5f38', '#44844e'][k], 0, 0.55 + k * 0.38, 0, T);
    Wd.ornaments = []; for (let k = 0; k < 10; k++) { const a = k * 2.1, y = 0.4 + (k % 5) * 0.3, r = 0.6 - (k % 5) * 0.11; Wd.ornaments.push(add(sph(0.06, 10, 8), toon({ color: ['#c62f36', '#f4d35e', '#2a5fae'][k % 3], metalness: 0.4, roughness: 0.25 }), Math.cos(a) * r, y, Math.sin(a) * r, T)); }
    const sm = toon({ color: '#f4d35e', emissive: '#f4c430', emissiveIntensity: 1.2 }); sm.userData.bloomK = 0.5; Wd.star = add(new THREE.OctahedronGeometry(0.14), sm, 0, 2.15, 0, T); }
  Wd.hatch = group(Wd.HX, -0.02, (OZ0 + OZ1) / 2); add(box(0.8, 0.05, 0.8), '#9a6a3e', 0.4, 0, 0, Wd.hatch).position.x = 0; Wd.hatchDoor = Wd.hatch.children[0];
  // the cellar: bed, table, the lantern (pops on "lantern"), the socks rug
  { const P = S.parts(), y0 = Wd.CEL.y0 + 0.06; P.box(1.3, 0.3, 0.7, 17.2, y0 + 0.15, -0.5, '#8a5734').box(1.3, 0.12, 0.72, 17.2, y0 + 0.36, -0.5, '#e8d4a0').box(0.4, 0.1, 0.5, 16.75, y0 + 0.46, -0.5, '#f6f1e6');
    for (let y = Wd.CEL.y0 + 0.3; y < -0.2; y += 0.28) P.box(0.55, 0.04, 0.05, Wd.HX, y, -0.25, '#8a5734'); P.box(0.05, 2.6, 0.05, Wd.HX - 0.25, -1.55, -0.25, '#8a5734').box(0.05, 2.6, 0.05, Wd.HX + 0.25, -1.55, -0.25, '#8a5734');
    add(P.build(), S.vcM, 0, 0, 0, scene); }
  Wd.lantern = group(18.2, Wd.CEL.y0 + 0.06, -0.55); { const L = Wd.lantern; add(box(0.18, 0.04, 0.18), '#3b3f4a', 0, 0.02, 0, L); const gm = toon({ color: '#ffe9a0', emissive: '#ffc860', emissiveIntensity: 2.2 }); gm.userData.bloomK = 0.7; add(box(0.14, 0.2, 0.14), gm, 0, 0.14, 0, L, { cast: false }); add(box(0.18, 0.04, 0.18), '#3b3f4a', 0, 0.26, 0, L); add(new THREE.TorusGeometry(0.06, 0.012, 6, 12, Math.PI), '#3b3f4a', 0, 0.28, 0, L); }
  Wd.lanternLight = new THREE.PointLight('#ffbe6a', 0, 6, 2); Wd.lanternLight.position.set(18.2, Wd.CEL.y0 + 0.6, 0.0); scene.add(Wd.lanternLight);
  Wd.rug = group(19.0, Wd.CEL.y0 + 0.07, -0.35); { const P = S.parts(); const cols = ['#c62f36', '#f4d35e', '#2a5fae', '#3fa39a', '#e07a5f', '#6b3c8f', '#ffffff']; for (let k = 0; k < 14; k++) { const x = -0.9 + (k % 7) * 0.3, z = (k < 7 ? -0.2 : 0.2); P.box(0.22, 0.03, 0.4, x, 0, z, cols[k % 7], [0, (k % 3 - 1) * 0.15, 0]).box(0.14, 0.032, 0.12, x + 0.04, 0.001, z + 0.24 * (k < 7 ? -1 : 1), cols[(k + 3) % 7]); for (let j = 0; j < 3; j++) P.box(0.22, 0.033, 0.03, x, 0.002, z - 0.12 + j * 0.12, cols[(k + 1) % 7]); } add(P.build(), S.vcM, 0, 0, 0, Wd.rug); }
  // FX pools
  Wd.dirt = []; for (let i = 0; i < 18; i++) Wd.dirt.push(add(new THREE.DodecahedronGeometry(0.06), '#6e5034', 0, -50, 0, scene, { cast: false }));
  Wd.sparks = []; for (let i = 0; i < 20; i++) Wd.sparks.push(add(sph(0.035, 6, 4), toon({ color: '#fff6c8', emissive: '#ffe9a0', emissiveIntensity: 1.6 }), 0, -50, 0, scene, { cast: false }));
  Wd.confetti = []; for (let i = 0; i < 60; i++) Wd.confetti.push(add(box(0.08, 0.05, 0.01), ['#c62f36', '#f4d35e', '#2a5fae', '#3fa39a', '#e07a5f'][i % 5], 0, -50, 0, scene, { cast: false }));
  Wd.motes = (() => { const n = 260, pos = new Float32Array(n * 3), r = PAINT.rng(3); for (let i = 0; i < n; i++) { pos[i * 3] = -10 + r() * 32; pos[i * 3 + 1] = -3 + r() * 3; pos[i * 3 + 2] = ZF + 0.1 + r() * 2; } const [c, g] = cv(64, 64); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,230,190,1)'); gr.addColorStop(1, 'rgba(255,230,190,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const m = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.06, map: tex(c), transparent: true, depthWrite: false, opacity: 0.4, color: '#ffe2b0' })); scene.add(m); return m; })();
  Wd.tick = (t) => S.tick(t);
  return Wd;
})();
