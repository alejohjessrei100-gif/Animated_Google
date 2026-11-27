// Escalation-format test stage: a side-on cutaway. Surface world above, the well shaft and its "vault" below, sky + castle behind.
window.WORLD = (() => {
  const E = ENGINE, { add, box, tbox, group, sign, toon, texM, label, scene } = E;
  const Wd = {}; const R = PAINT.rng(77);
  const cyl = (rt, rb, h, n = 20, open = false) => new THREE.CylinderGeometry(rt, rb, h, n, 1, open);
  const sph = (r, a = 16, b = 12) => new THREE.SphereGeometry(r, a, b);
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  Wd.life = [];
  // soil cross-section: strata bands, pebbles, roots, a buried bone (the cutaway face)
  const soil = () => { const [c, g] = cv(1024, 1024); const bands = ['#7a5a3a', '#6a4a30', '#8a6a44', '#5e4630', '#735438', '#4e3a28']; let y = 0; let i = 0; while (y < 1024) { const h = 90 + R() * 120; g.fillStyle = bands[i++ % bands.length]; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + Math.sin(x * 0.01 + i) * 14); g.lineTo(1024, y + h); g.lineTo(0, y + h); g.fill(); y += h; }
    for (let k = 0; k < 160; k++) { g.fillStyle = ['#a8927a', '#8a7a6a', '#c9b49a', '#5a4a3a'][k % 4]; g.beginPath(); g.ellipse(R() * 1024, R() * 1024, 6 + R() * 16, 4 + R() * 10, R() * 3, 0, 7); g.fill(); g.strokeStyle = 'rgba(30,20,10,.5)'; g.lineWidth = 2; g.stroke(); }
    g.strokeStyle = '#4a3220'; g.lineWidth = 5; for (let k = 0; k < 14; k++) { let x = R() * 1024, yy = 0; g.beginPath(); g.moveTo(x, yy); for (let s = 0; s < 6; s++) { x += R() * 40 - 20; yy += 18 + R() * 20; g.lineTo(x, yy); } g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  const soilM = toon({ map: soil(), roughness: 0.95 }); const stoneM = texM(PAINT.stone(4, 30, 12, 64), 2, 4); const grassM = texM(PAINT.grass(6), 6, 2);
  // sky + far castle + hills (depth behind the cutaway)
  { const [c, g] = cv(16, 512); const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#3a6fd0'); gr.addColorStop(0.7, '#9fd0ff'); gr.addColorStop(1, '#ffe2b0'); g.fillStyle = gr; g.fillRect(0, 0, 16, 512); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; add(new THREE.PlaneGeometry(120, 40), new THREE.MeshBasicMaterial({ map: t }), 0, 14, -40, scene, { cast: false }); }
  for (let i = 0; i < 6; i++) { const h = add(sph(10 + R() * 6, 20, 10), i % 2 ? '#7aa64c' : '#86ad60', -40 + i * 16, -6, -30, scene, { cast: false }); h.scale.y = 0.6; }
  { const c = group(9, 0, -24); for (const [x, h] of [[-3, 7], [0, 9], [3, 7]]) { add(tbox(2.2, h, 2.2, 2), texM(PAINT.stone(4, 40, 10, 76), 1, 2), x, h / 2, 0, c); add(new THREE.ConeGeometry(1.6, 2.6, 4), '#c62f36', x, h + 1.3, 0, c).rotation.y = Math.PI / 4; } add(tbox(8, 4.5, 1.6, 2), texM(PAINT.stone(4, 40, 10, 76), 2, 1), 0, 2.25, 0.4, c); const fl = add(new THREE.PlaneGeometry(1.2, 0.7, 6, 3), toon({ color: '#f4d35e', side: THREE.DoubleSide }), 0.65, 10.6, 0, c); fl.userData.base = fl.geometry.attributes.position.array.slice(); add(cyl(0.05, 0.05, 1.6, 6), '#3b3f4a', 0, 10.3, 0, c); Wd.flag = fl; }
  // ground: two soil blocks around the shaft, a floor under it; grass on top; cut face toward the camera (+z)
  const SH = 0.7, D = 6.0;          // shaft half-width, depth
  for (const s of [-1, 1]) { const w = 7; add(new THREE.BoxGeometry(w, D, 6), [soilM, soilM, grassM, soilM, soilM, soilM], s * (SH + w / 2), -D / 2, -2, scene); }
  add(tbox(SH * 2, 1.0, 6, 1), texM(PAINT.stone(9, 30, 10, 58), 1, 3), 0, -D + 1.0, -2, scene);
  add(tbox(SH * 2, D - 1.0, 0.2, 1), stoneM, 0, -D / 2 + 0.5, -4.9, scene);                    // shaft back wall (stone)
  for (const s of [-1, 1]) add(tbox(0.16, D - 1.0, 6, 1), stoneM, s * (SH - 0.08), -D / 2 + 0.5, -2, scene);
  // water at the bottom + the vault (gold pile) on a ledge
  Wd.water = add(new THREE.BoxGeometry(SH * 2 - 0.3, 0.06, 1.6), toon({ color: '#3a8fd0', roughness: 0.1, emissive: '#1d5a9a', emissiveIntensity: 0.3 }), 0, -D + 1.52, -4.0, scene);
  Wd.gold = group(0, -D + 1.5, -1.0); add(new THREE.ConeGeometry(0.55, 0.45, 18), toon({ color: '#f4c430', metalness: 0.7, roughness: 0.25, emissive: '#a07010', emissiveIntensity: 0.4 }), 0, 0.22, 0, Wd.gold);
  Wd.coins = []; for (let i = 0; i < 26; i++) { const m = add(cyl(0.07, 0.07, 0.02, 14), toon({ color: '#f4d35e', metalness: 0.8, roughness: 0.2, emissive: '#c89010', emissiveIntensity: 0.6 }), 0, -50, 0, scene); Wd.coins.push(m); }
  Wd.sparks = []; for (let i = 0; i < 24; i++) Wd.sparks.push(add(sph(0.03, 6, 4), toon({ color: '#fff6c8', emissive: '#ffe9a0', emissiveIntensity: 1.6 }), 0, -50, 0, scene, { cast: false }));
  Wd.vault = sign(scene, [{ t: 'YOUR VAULT', c: '#2b1f1c' }], 0, -D + 3.15, -2.6, 1.25, 0.38, { bg: '#f4d35e', d: 0.03, glow: 0.3 });
  Wd.goldLight = new THREE.PointLight('#ffd27a', 2.5, 5, 2); Wd.goldLight.position.set(0, -3.7, -0.4); scene.add(Wd.goldLight);
  // the well head at the surface: stone ring, posts, roof, crank, rope + bucket
  const wh = group(0, 0, -2); add(cyl(0.95, 1.0, 0.75, 28, true), stoneM, 0, 0.37, 0, wh); add(new THREE.TorusGeometry(0.97, 0.08, 8, 28), '#9a8a7a', 0, 0.75, 0, wh).rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) add(box(0.12, 1.7, 0.12), '#6a4a32', s * 0.9, 1.6, 0, wh); { const roof = add(new THREE.ConeGeometry(1.5, 0.8, 4), '#c62f36', 0, 2.75, 0, wh); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.7; }
  Wd.crank = group(0, 2.15, 0, wh); add(cyl(0.07, 0.07, 1.8, 10), '#8a5734', 0, 0, 0, Wd.crank).rotation.z = Math.PI / 2; add(box(0.05, 0.35, 0.05), '#8a5734', 0.95, -0.15, 0, Wd.crank);
  Wd.rope = add(cyl(0.015, 0.015, 1, 6), '#d8c08a', 0, 0, -2, scene, { cast: false });
  Wd.bucket = group(0, 1.6, -2); add(cyl(0.22, 0.17, 0.32, 16), '#8a5734', 0, 0, 0, Wd.bucket); for (const y of [-0.08, 0.1]) add(new THREE.TorusGeometry(0.2, 0.015, 6, 16), '#3b3f4a', 0, y, 0, Wd.bucket).rotation.x = Math.PI / 2; add(new THREE.TorusGeometry(0.22, 0.012, 6, 16, Math.PI), '#3b3f4a', 0, 0.16, 0, Wd.bucket);
  // surface dressing + life
  for (const [x, z] of [[-5.5, -3.5], [4.8, -4.2], [-3.2, -4.4]]) { const t = group(x, 0, z); add(cyl(0.14, 0.2, 1.8, 8), '#6a4a32', 0, 0.9, 0, t); for (let k = 0; k < 3; k++) add(sph(0.7, 12, 8), k % 2 ? '#5f9a3c' : '#6fae45', (R() - 0.5) * 0.6, 2.0 + k * 0.3, (R() - 0.5) * 0.6, t); }
  for (let x = -7; x <= 7; x += 0.8) { if (Math.abs(x) < 1.6) continue; add(box(0.07, 0.6, 0.07), '#b07a45', x, 0.3, -4.6, scene); } add(box(14, 0.05, 0.05), '#b07a45', 0, 0.5, -4.6, scene);
  for (let k = 0; k < 30; k++) { const x = (R() - 0.5) * 12; if (Math.abs(x) < 1.1) continue; const g_ = add(new THREE.ConeGeometry(0.04, 0.22, 4), '#4c8a30', x, 0.11, -0.2 - R() * 3.5, scene, { cast: false }); }
  Wd.warn = group(1.9, 2.6, -1.4); { const w = Wd.warn; const m = toon({ color: '#ff3b3b', emissive: '#ff2020', emissiveIntensity: 1.4 }); add(box(0.16, 0.55, 0.12), m, 0, 0.15, 0, w); add(sph(0.1, 10, 8), m, 0, -0.3, 0, w); }
  Wd.warnLight = new THREE.PointLight('#ff3030', 0, 6, 2); Wd.warnLight.position.set(1.6, 1.8, -1); scene.add(Wd.warnLight);
  Wd.dust = []; for (let i = 0; i < 18; i++) Wd.dust.push(add(sph(0.06, 8, 6), '#c9b49a', 0, -50, 0, scene, { cast: false }));
  Wd.birds = [0, 1, 2].map((i) => { const b = group(0, 6, -10); add(sph(0.08, 8, 6), '#3b3f4a', 0, 0, 0, b).scale.set(1.4, 0.7, 0.7); const w1 = add(box(0.3, 0.01, 0.1), '#3b3f4a', 0, 0, 0.1, b), w2 = add(box(0.3, 0.01, 0.1), '#3b3f4a', 0, 0, -0.1, b); Wd.life.push((t) => { const u = (t * 0.08 + i * 0.3) % 1; b.position.set(-10 + u * 20, 6 + Math.sin(t + i) * 0.5 + i * 0.5, -10 - i); const f = Math.sin(t * 14 + i) * 0.7; w1.rotation.x = f; w2.rotation.x = -f; }); return b; });
  Wd.tick = (t) => { for (const f of Wd.life) f(t); const p = Wd.flag.geometry.attributes.position, bb = Wd.flag.userData.base; for (let k = 0; k < p.count; k++) { const x = bb[k * 3]; p.setZ(k, Math.sin(t * 4 + x * 6) * 0.05 * (x + 0.6)); } p.needsUpdate = true; };
  Wd.D = D; return Wd;
})();
