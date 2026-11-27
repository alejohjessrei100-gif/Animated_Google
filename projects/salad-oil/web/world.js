// Sets for "The Tanks Full of Seawater That Fooled Wall Street". Only characters are 2D; every prop/FX is inked 3D geometry.
// Set origins (x): TANKFARM 0, CUTAWAY 25, BANKS 50, AMEX 75, KITCHEN -25, EXCHANGE 100, OMAHA 125.
window.WORLD = (() => {
  const E = ENGINE, { add, box, tbox, group, sign, col, toon, texM, label, scene } = E;
  const Wd = {}; const R = PAINT.rng(1963);
  const eout = (u) => 1 - Math.pow(1 - Math.max(0, Math.min(1, u)), 3);
  const cyl = (rt, rb, h, n = 20, open = false, t0 = 0, tl = Math.PI * 2) => new THREE.CylinderGeometry(rt, rb, h, n, 1, open, t0, tl);
  const sph = (r, a = 18, b = 12) => new THREE.SphereGeometry(r, a, b);
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  const pick = (a) => a[(R() * a.length) | 0];
  const BOOK = ['#c62f36', '#2a5fae', '#3fa39a', '#f4d35e', '#8a5734', '#6b3c8f', '#e07a5f', '#2f6b4f'];
  Wd.life = [];

  // ---------- painted textures ----------
  const tiles = (a, b, n = 8) => { const [c, g] = cv(512, 512); const s = 512 / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? a : b; g.fillRect(i * s, j * s, s, s); g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 3; g.strokeRect(i * s, j * s, s, s); } return c; };
  const concrete = () => { const [c, g] = cv(512, 512); g.fillStyle = '#b9b4a8'; g.fillRect(0, 0, 512, 512); const r = PAINT.rng(3); for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${r() < .5 ? '90,86,80' : '230,226,215'},${r() * .3})`; g.fillRect(r() * 512, r() * 512, 2 + r() * 3, 2); } g.strokeStyle = 'rgba(70,66,60,.5)'; g.lineWidth = 3; for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(k * 128, 0); g.lineTo(k * 128, 512); g.moveTo(0, k * 128); g.lineTo(512, k * 128); g.stroke(); } for (let i = 0; i < 7; i++) { g.fillStyle = `rgba(60,50,30,${.15 + r() * .2})`; g.beginPath(); g.ellipse(r() * 512, r() * 512, 20 + r() * 40, 10 + r() * 20, r() * 3, 0, 7); g.fill(); } return c; };
  const tankSkin = () => { const [c, g] = cv(512, 512); g.fillStyle = '#e8e4da'; g.fillRect(0, 0, 512, 512); for (let y = 0; y < 512; y += 64) { g.fillStyle = 'rgba(80,80,90,.25)'; g.fillRect(0, y, 512, 3); for (let x = 0; x < 512; x += 16) { g.fillStyle = 'rgba(60,60,70,.45)'; g.beginPath(); g.arc(x + 8, y + 8, 2, 0, 7); g.fill(); } } const r = PAINT.rng(9); for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(150,100,50,${.08 + r() * .12})`; g.fillRect(r() * 512, r() * 512, 6 + r() * 10, 40 + r() * 90); } return c; };
  const panel = () => { const [c, g] = cv(512, 512); g.fillStyle = '#7a4a2a'; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 4; i++) { g.fillStyle = '#8a5734'; g.fillRect(i * 128 + 14, 20, 100, 472); g.strokeStyle = '#4e2e1a'; g.lineWidth = 6; g.strokeRect(i * 128 + 14, 20, 100, 472); } return c; };
  const wallpaper = (a, b) => { const [c, g] = cv(512, 512); g.fillStyle = a; g.fillRect(0, 0, 512, 512); g.fillStyle = b; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.beginPath(); const x = i * 64 + (j % 2) * 32 + 16, y = j * 64 + 32; g.moveTo(x, y - 12); g.lineTo(x + 9, y); g.lineTo(x, y + 12); g.lineTo(x - 9, y); g.fill(); } return c; };
  const marble = () => PAINT.marble(10);
  const M = {
    concrete: texM(concrete(), 6, 5), tank: texM(tankSkin(), 3, 1, '#ffffff', { roughness: 0.55, metalness: 0.15 }), planks: texM(PAINT.planks(1), 2, 2), brick: texM(PAINT.stone(31, 10, 48, 50, 96, 40), 1, 1),
    stoneW: texM(PAINT.stone(4, 40, 10, 82), 1, 1, '#ffffff'), panel: texM(panel(), 2, 1), paperA: texM(wallpaper('#e7d7a8', '#c99a58'), 3, 2), paperG: texM(wallpaper('#d8ead2', '#9cc49a'), 3, 2),
    kitchen: texM(tiles('#f4f1ea', '#cfe6ee', 10), 3, 2), lino: texM(tiles('#e8d6b0', '#c9a571', 8), 3, 3), marble: texM(marble(), 2, 2), studio: texM(tiles('#2a3a6a', '#3a4a7a', 6), 4, 3),
    glass: E.glass(),
  };
  Wd.M = M;

  // ---------- kit ----------
  const lamp = (p, x, y, z, c = '#f2c14e') => { const g = group(x, y, z, p); add(cyl(0.012, 0.012, 0.6, 6), '#2b2f38', 0, 0.3, 0, g); add(cyl(0.06, 0.22, 0.2, 18, true), c, 0, 0, 0, g); add(sph(0.06), toon({ color: '#fff6c8', emissive: '#fff2b0', emissiveIntensity: 1 }), 0, -0.05, 0, g); return g; };
  const chair = (p, x, z, ry = 0, c = '#8a5734') => { const g = group(x, 0, z, p); g.rotation.y = ry; add(tbox(0.45, 0.06, 0.45), c, 0, 0.46, 0, g); for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(box(0.05, 0.46, 0.05), c, sx * 0.19, 0.23, sz * 0.19, g); add(tbox(0.45, 0.5, 0.05), c, 0, 0.74, -0.2, g); return g; };
  const crate = (p, x, y, z, s, txt) => { const g = group(x, y, z, p); add(tbox(s, s, s, 0.5), M.planks, 0, s / 2, 0, g); if (txt) sign(g, [txt], 0, s / 2, s / 2 + 0.02, s * 0.75, s * 0.3, { d: 0.01, bg: '#efe3c4' }); return g; };
  const barrel = (p, x, z, c = '#2f6b4f', y = 0) => { const g = group(x, y, z, p); add(cyl(0.3, 0.3, 0.9, 18), c, 0, 0.45, 0, g); for (const yy of [0.15, 0.75]) add(new THREE.TorusGeometry(0.302, 0.015, 6, 22), '#3b3f4a', 0, yy, 0, g).rotation.x = Math.PI / 2; return g; };
  const shelf = (p, x, y, z, w = 1.4, rows = 3, ry = 0, wood = '#7a4a2a') => { const g = group(x, y, z, p); g.rotation.y = ry; const h = rows * 0.42 + 0.08; add(tbox(w, h, 0.32), wood, 0, h / 2, -0.02, g); add(box(w - 0.08, h - 0.08, 0.3), '#3a2414', 0, h / 2, 0.01, g);
    for (let r_ = 0; r_ < rows; r_++) { const yy = 0.06 + r_ * 0.42; add(box(w - 0.06, 0.04, 0.3), wood, 0, yy, 0.02, g); let xx = -w / 2 + 0.08; while (xx < w / 2 - 0.12) { const bw = 0.04 + R() * 0.05, bh = 0.22 + R() * 0.12; add(box(bw, bh, 0.22), pick(BOOK), xx + bw / 2, yy + 0.02 + bh / 2, 0.04, g, { cast: false }); xx += bw + 0.008; } } return g; };
  const plant = (p, x, z, s = 1, y = 0) => { const g = group(x, y, z, p); g.scale.setScalar(s); add(cyl(0.16, 0.12, 0.3, 14), '#c0623a', 0, 0.15, 0, g); for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, l = add(sph(0.12, 10, 8), k % 2 ? '#5f9a3c' : '#4c8a30', Math.cos(a) * 0.12, 0.45 + (k % 3) * 0.1, Math.sin(a) * 0.12, g); l.scale.set(0.7, 1.6, 0.4); l.rotation.set(Math.sin(a) * 0.5, a, Math.cos(a) * 0.5); } Wd.life.push((t) => { g.rotation.z = Math.sin(t * 1.3 + x) * 0.03; }); return g; };
  const clock = (p, x, y, z, ry = 0) => { const g = group(x, y, z, p); g.rotation.y = ry; add(cyl(0.22, 0.22, 0.05, 28), '#fbfaf4', 0, 0, 0, g).rotation.x = Math.PI / 2; add(new THREE.TorusGeometry(0.22, 0.03, 8, 28), '#8a5734', 0, 0, 0, g); const hm = group(0, 0, 0.04, g), mm = group(0, 0, 0.045, g); add(box(0.025, 0.12, 0.01), '#2b1f1c', 0, 0.05, 0, hm); add(box(0.018, 0.18, 0.01), '#2b1f1c', 0, 0.08, 0, mm); Wd.life.push((t) => { mm.rotation.z = -t * 0.8; hm.rotation.z = -t * 0.07; }); return g; };
  const fan = (p, x, y, z) => { const g = group(x, y, z, p); add(cyl(0.015, 0.015, 0.4, 6), '#3b3f4a', 0, -0.2, 0, g); add(cyl(0.08, 0.08, 0.1, 12), '#d8c08a', 0, -0.42, 0, g); const rot = group(0, -0.48, 0, g); for (let k = 0; k < 4; k++) { const arm = group(0, 0, 0, rot); arm.rotation.y = k * Math.PI / 2; add(box(0.55, 0.012, 0.12), '#8a5734', 0.32, 0, 0, arm).rotation.x = 0.2; } Wd.life.push((t) => { rot.rotation.y = t * 6; }); return g; };
  const papers = (p, x, y, z, n, spread = 0.4) => { for (let i = 0; i < n; i++) { const m = add(box(0.21, 0.003, 0.28), i % 4 ? '#fbfaf4' : '#f6e27a', x + (R() - 0.5) * spread, y + i * 0.003, z + (R() - 0.5) * spread, p, { cast: false }); m.rotation.y = R() * 3; } };
  const frame = (p, x, y, z, w, h, art, ry = 0) => { const g = group(x, y, z, p); g.rotation.y = ry; add(box(w + 0.1, h + 0.1, 0.04), '#8a5734', 0, 0, 0, g); const [c, q] = cv(256, Math.round(256 * h / w)); art(q, c.width, c.height); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; add(new THREE.PlaneGeometry(w, h), toon({ map: t, roughness: 0.6 }), 0, 0, 0.022, g, { cast: false }); return g; };
  const viewTex = (kind) => { const [c, g] = cv(512, 512); const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#8fd0ff'); gr.addColorStop(1, '#e6f6ff'); g.fillStyle = gr; g.fillRect(0, 0, 512, 512); const r = PAINT.rng(kind.length * 7); g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 5; i++) { const x = r() * 512, y = 60 + r() * 140; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(x + k * 26, y + Math.sin(k) * 8, 34, 18, 0, 0, 7); g.fill(); } }
    if (kind === 'plains') { g.fillStyle = '#d8c070'; g.fillRect(0, 360, 512, 152); g.fillStyle = '#6fae45'; for (let i = 0; i < 40; i++) g.fillRect(i * 13, 380 + (i % 3) * 8, 6, 120); g.fillStyle = '#c0c6d0'; g.fillRect(380, 250, 14, 120); g.beginPath(); g.arc(387, 240, 34, 0, 7); g.fill(); g.fillStyle = '#2a5fae'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center'; g.fillText('OMAHA', 387, 247); }
    else { for (let layer = 0; layer < 2; layer++) { g.fillStyle = layer ? '#7d8fb0' : '#a8b8cf'; let x = 0; while (x < 512) { const w = 40 + r() * 70, h = 120 + r() * 140 - layer * 60; g.fillRect(x, 512 - h, w, h); x += w + 6; } } }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const windowUnit = (p, x, y, z, w, h, ry, kind = 'city') => { const g = group(x, y, z, p); g.rotation.y = ry; const vm = new THREE.MeshBasicMaterial({ map: viewTex(kind) }); vm.userData.bloomK = 0.2; add(new THREE.PlaneGeometry(w, h), vm, 0, 0, -0.04, g, { cast: false }); const trim = '#f3ead8';
    for (const sy of [-1, 1]) add(box(w + 0.2, 0.1, 0.12), trim, 0, sy * (h / 2 + 0.05), 0, g); for (const sx of [-1, 1]) add(box(0.1, h + 0.2, 0.12), trim, sx * (w / 2 + 0.05), 0, 0, g); add(box(w + 0.34, 0.07, 0.26), trim, 0, -h / 2 - 0.12, 0.08, g); add(box(0.05, h, 0.06), trim, 0, 0, 0, g); add(box(w, 0.05, 0.06), trim, 0, h * 0.12, 0, g); return g; };
  const trimRoom = (p, w, d, wallZ, c = '#5a3a24') => { add(box(w, 0.14, 0.06), c, 0, 0.07, wallZ + 0.13, p); add(box(w, 0.06, 0.05), c, 0, 1.0, wallZ + 0.13, p); };
  const room = (p, w, d, h, wallMat, floorMat, reflK = 0, setName = null) => { const f = add(tbox(w, 0.1, d, 2), reflK ? E.reflective(floorMat, reflK) : floorMat, 0, -0.05, 0, p, { cast: false }); if (reflK) E.addReflector(f, setName);
    add(tbox(w, h, 0.2, 2), wallMat, 0, h / 2, -d / 2, p); add(tbox(0.2, h, d, 2), wallMat, -w / 2, h / 2, 0, p); add(tbox(0.2, h, d, 2), wallMat, w / 2, h / 2, 0, p); trimRoom(p, w, d, -d / 2); };
  Wd.bits = (p, n, cols, size = [0.16, 0.08]) => { const out = []; for (let i = 0; i < n; i++) out.push(add(box(size[0], 0.005, size[1]), cols[i % cols.length], 0, -50, 0, p, { cast: false })); return out; };
  const smoke = (p, n, c = '#e9e6ee') => { const out = []; for (let i = 0; i < n; i++) out.push(add(sph(0.06, 10, 8), c, 0, -50, 0, p, { cast: false })); return out; };
  Wd.runSmoke = (ps, t, ox, oy, oz, rise = 0.8, spread = 0.12, rate = 0.6, sc = 1) => ps.forEach((p, k) => { const u = (t * rate + k / ps.length) % 1; p.position.set(ox + Math.sin(k * 3.1 + t) * spread * u, oy + u * rise, oz + Math.cos(k * 2.3) * spread * u); p.scale.setScalar((0.4 + u * 1.6) * sc); p.visible = u < 0.92; });
  const gull = (p) => { const g = group(0, -50, 0, p); add(sph(0.09, 10, 8), '#fbfaf4', 0, 0, 0, g).scale.set(1.6, 0.8, 0.8); add(sph(0.05, 8, 6), '#fbfaf4', 0.14, 0.04, 0, g); add(new THREE.ConeGeometry(0.02, 0.06, 6), '#f4b33c', 0.21, 0.03, 0, g).rotation.z = -Math.PI / 2; const w1 = add(box(0.06, 0.01, 0.32), '#e8e4dc', 0, 0.02, 0.16, g), w2 = add(box(0.06, 0.01, 0.32), '#e8e4dc', 0, 0.02, -0.16, g); return { g, w1, w2 }; };
  const fish = (p, c) => { const g = group(0, -50, 0, p); add(sph(0.12, 14, 10), c, 0, 0, 0, g).scale.set(1.6, 1, 0.6); add(new THREE.ConeGeometry(0.1, 0.16, 4), c, -0.24, 0, 0, g).rotation.z = Math.PI / 2; add(sph(0.025, 8, 6), '#2b1f1c', 0.12, 0.04, 0.06, g); return g; };

  // ================= TANK FARM (x = 0): Bayonne waterfront =================
  const TF = group(0, 0, 0); Wd.farm = TF;
  add(tbox(44, 0.1, 30, 4), M.concrete, 0, -0.05, -4, TF, { cast: false });
  // harbor water + far shore + ship
  Wd.waterU = { t: { value: 0 } };
  const waterMat = new THREE.ShaderMaterial({ uniforms: { ...Wd.waterU }, vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float t; varying vec3 vW; float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); } float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
      void main(){ vec2 p = vW.xz*vec2(.4,.25) + vec2(t*.15, t*.05); float k = n(p)*.6 + n(p*2.7)*.4; vec3 c = mix(vec3(.19,.47,.68), vec3(.36,.68,.84), k); c = mix(c, vec3(.92,.97,1.), smoothstep(.74,.8, n(vW.xz*vec2(.9,.2)+vec2(t*.4,0.)))*.7); gl_FragColor = vec4(pow(c, vec3(2.2)), 1.); }` });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(200, 80), waterMat); water.rotation.x = -Math.PI / 2; water.position.set(0, -0.35, -59); water.userData.ndSkip = false; TF.add(water);
  add(tbox(44, 0.5, 1.0, 2), M.concrete, 0, -0.1, -19.2, TF); for (let x = -20; x <= 20; x += 2.5) add(cyl(0.12, 0.14, 0.5, 10), '#3b3f4a', x, 0.25, -19.2, TF);
  for (let i = 0; i < 6; i++) add(tbox(6 + R() * 6, 3 + R() * 4, 4, 3), pick(['#8a98b0', '#9aa8be', '#7f8da6']), -30 + i * 12, 1.5, -78, TF, { cast: false });
  { const ship = group(14, -0.3, -40, TF); add(tbox(14, 2.4, 3, 3), '#c62f36', 0, 1.0, 0, ship); add(tbox(14, 0.8, 3.02, 3), '#2b2f38', 0, -0.1, 0, ship); add(tbox(3, 2.4, 2.6), '#fbfaf4', -4, 3.3, 0, ship); add(cyl(0.4, 0.45, 2.4, 12), '#f4d35e', -4, 5.5, 0, ship); for (let k = 0; k < 4; k++) add(tbox(1.8, 1.0, 2.4), pick(['#3fa39a', '#f28c28', '#2a5fae']), 1 + k * 2, 2.7, 0, ship); Wd.ship = ship; Wd.shipSmoke = smoke(TF, 8, '#c9c4d4'); }
  // the four tanks
  Wd.tanks = [];
  const tank = (x, z, label_, main = false) => { const g = group(x, 0, z, TF); const r = 2.0, h = 4.6;
    add(cyl(r, r, h, 40), M.tank, 0, h / 2, 0, g); const roof = add(new THREE.ConeGeometry(r + 0.06, 0.45, 40), '#d8d4ca', 0, h + 0.22, 0, g);
    for (const y of [0.04, h]) add(new THREE.TorusGeometry(r + 0.02, 0.05, 8, 40), '#9aa0aa', 0, y, 0, g).rotation.x = Math.PI / 2;
    for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2; add(box(0.04, 0.5, 0.04), '#c62f36', Math.cos(a) * (r - 0.1), h + 0.6, Math.sin(a) * (r - 0.1), g); }
    add(new THREE.TorusGeometry(r - 0.1, 0.03, 6, 40), '#c62f36', 0, h + 0.85, 0, g).rotation.x = Math.PI / 2;
    const lad = group(0.6, 0, r + 0.12, g); for (const s of [-1, 1]) add(box(0.05, h + 0.9, 0.05), '#3b3f4a', s * 0.22, (h + 0.9) / 2, 0, lad); for (let k = 1; k < (h + 0.8) / 0.32; k++) add(box(0.44, 0.03, 0.04), '#3b3f4a', 0, k * 0.32, 0, lad);
    sign(g, [{ t: label_, c: '#c62f36' }], 0, h * 0.62, r + 0.03, 2.2, 0.55, { bg: '#f4f1e8', border: '#2b2f38', d: 0.02 }).rotation.x = 0;
    const hatch = group(0, h + 0.42, 0, g); add(cyl(0.28, 0.28, 0.14, 20), '#7f8896', 0, 0, 0, hatch); const lid = group(0.28, 0.08, 0, hatch); add(cyl(0.3, 0.3, 0.05, 20), '#c62f36', -0.28, 0, 0, lid);
    Wd.tanks.push({ g, lid, hatch, x, z, h }); return g; };
  tank(-7.4, -6.5, 'SALAD OIL'); tank(-2.4, -6.0, 'SALAD OIL'); tank(2.6, -6.0, 'SALAD OIL', true); tank(7.6, -6.5, 'SALAD OIL');
  Wd.mainTank = Wd.tanks[2];
  // pipes, valves, catwalk bridges
  for (const y of [0.5, 0.9]) add(cyl(0.12, 0.12, 18, 14), '#7f8896', 0, y, -3.6, TF).rotation.z = Math.PI / 2;
  for (const x of [-7.4, -2.4, 2.6, 7.6]) { add(cyl(0.12, 0.12, 0.8, 12), '#7f8896', x, 0.7, -3.95, TF).rotation.x = Math.PI / 2; const v = add(new THREE.TorusGeometry(0.2, 0.04, 8, 18), '#c62f36', x + 0.5, 1.3, -3.6, TF); add(cyl(0.03, 0.03, 0.4, 6), '#3b3f4a', x + 0.5, 1.1, -3.6, TF); Wd.life.push((t) => { v.rotation.z = t * 0.4 + x; }); }
  for (const x of [-4.9, 0.1, 5.1]) { add(tbox(1.0, 0.08, 0.7), '#3b3f4a', x, 4.95, -6.2, TF); for (const s of [-1, 1]) add(box(1.0, 0.04, 0.04), '#c62f36', x, 5.45, -6.2 + s * 0.33, TF); }
  // office shack + signs
  { const sh = group(-13, 0, -2, TF); add(tbox(4.4, 3.0, 3.2, 2), M.brick, 0, 1.5, 0, sh); add(tbox(4.8, 0.2, 3.6), '#3b3f4a', 0, 3.1, 0, sh); add(box(0.9, 1.8, 0.08), '#5a3a24', -0.9, 0.9, 1.62, sh); windowUnit(sh, 0.9, 1.7, 1.62, 1.1, 0.9, 0, 'city');
    Wd.calendar = sign(sh, [{ t: '1962', c: '#c62f36' }], -0.9, 2.3, 1.64, 0.6, 0.45, { bg: '#fbfaf4' }); }
  sign(TF, [{ t: 'ALLIED CRUDE', c: '#ffffff' }, { t: 'VEGETABLE OIL', c: '#f4d35e' }], -11.5, 4.2, -1.0, 4.4, 1.3, { bg: '#2a5fae', border: '#f4d35e', frame: '#2b2f38' });
  for (const x of [-13.5, -9.5]) add(cyl(0.08, 0.08, 3.6, 10), '#2b2f38', x, 1.8, -1.0, TF);
  sign(TF, [{ t: 'NO SWIMMING', c: '#c62f36' }], 10.8, 1.3, -2.6, 1.3, 0.5, { bg: '#fbfaf4' }); add(cyl(0.04, 0.04, 1.1, 8), '#3b3f4a', 10.8, 0.55, -2.6, TF);
  // tanker truck, barrels, fence, crates, puddles
  { const tr = group(9.6, 0, 1.6, TF); tr.rotation.y = -0.25; add(tbox(1.6, 1.4, 1.8), '#f4d35e', 2.2, 1.0, 0, tr); add(box(0.9, 0.6, 1.82), '#bfe0f6', 2.4, 1.4, 0, tr); add(cyl(0.85, 0.85, 4.0, 24), '#fbfaf4', -0.6, 1.25, 0, tr).rotation.z = Math.PI / 2; sign(tr, [{ t: 'SALAD OIL', c: '#2f6b4f' }], -0.6, 1.25, 0.87, 2.4, 0.5, { bg: '#fbfaf4', border: null, d: 0.01 }); for (const x of [-1.8, 0.4, 2.4]) for (const sz of [-1, 1]) { const w = add(cyl(0.38, 0.38, 0.25, 18), '#2b2f38', x, 0.38, sz * 0.85, tr); w.rotation.x = Math.PI / 2; } }
  for (let i = 0; i < 7; i++) barrel(TF, -6 + (i % 4) * 0.66, 0.6 + Math.floor(i / 4) * 0.66, pick(['#2f6b4f', '#2a5fae', '#c62f36']));
  crate(TF, 4.8, 0, 0.8, 0.6, 'OIL'); crate(TF, 5.5, 0, 1.0, 0.5); crate(TF, 5.1, 0.6, 0.9, 0.45);
  for (let x = -20; x <= 20; x += 1.6) add(box(0.06, 1.6, 0.06), '#9aa0aa', x, 0.8, -18.5, TF); add(box(40, 0.05, 0.05), '#9aa0aa', 0, 1.55, -18.5, TF);
  for (const [x, z, s] of [[-1, -1.5, 1.4], [6, -2.5, 0.9], [-9, 2, 1.1]]) { const pd = add(cyl(0.6 * s, 0.6 * s, 0.006, 24), toon({ color: '#8fb4d0', roughness: 0.1, metalness: 0.2 }), x, 0.006, z, TF, { cast: false }); pd.scale.z = 0.55; }
  Wd.gulls = [0, 1, 2, 3, 4].map(() => gull(TF));
  Wd.dipstick = group(0, -50, 0); { const d = Wd.dipstick; add(cyl(0.025, 0.025, 2.4, 10), '#b6bec7', 0, 0, 0, d); add(cyl(0.028, 0.028, 0.9, 10), '#5fa8d8', 0, -0.75, 0, d); add(sph(0.06), '#c62f36', 0, 1.22, 0, d); }
  Wd.tankBills = Wd.bits(TF, 40, ['#8fbf6a', '#a8d08a'], [0.18, 0.08]);
  Wd.gallonSign = sign(TF, [{ t: '$ PER GALLON', c: '#2f6b4f' }], 2.6, 2.0, -3.9, 1.6, 0.5, { bg: '#fbfaf4' }); Wd.gallonSign.visible = false;
  // collapse FX: the tank skin buckles, seawater bursts out (3D water blobs)
  Wd.splash = []; for (let i = 0; i < 140; i++) Wd.splash.push(add(sph(0.12, 10, 8), toon({ color: i % 3 ? '#4a9fd8' : '#bfe8ff', roughness: 0.2 }), 0, -50, 0, TF, { cast: false }));
  Wd.wave = add(cyl(1, 1, 0.12, 40), toon({ color: '#5fb0e0', roughness: 0.15 }), 2.6, -50, -6.0, TF, { cast: false });

  // ================= CUTAWAY (x = 25): one tank sliced open =================
  const CA = group(25, 0, 0); Wd.cut = CA;
  add(tbox(14, 0.1, 12, 4), M.concrete, 0, -0.05, -2, CA, { cast: false });
  add(new THREE.PlaneGeometry(80, 40), new THREE.MeshBasicMaterial({ color: '#9fd0ff' }), 0, 10, -14, CA, { cast: false });
  { const r = 3.0, h = 6.0;
    add(cyl(r, r, h, 48, true, Math.PI / 2, Math.PI), M.tank, 0, h / 2, -2, CA);                          // back half shell (opening faces +z)
    const inner = add(cyl(r - 0.06, r - 0.06, h, 48, true, Math.PI / 2, Math.PI), toon({ color: '#9aa0aa', side: THREE.BackSide }), 0, h / 2, -2, CA);
    add(new THREE.CircleGeometry(r, 48, 0, Math.PI), '#7f8896', 0, h + 0.01, -2, CA).rotation.x = -Math.PI / 2;
    const waterBack = add(cyl(r - 0.1, r - 0.1, h - 0.9, 48, false, Math.PI / 2, Math.PI), toon({ color: '#2f7fc4', roughness: 0.2, emissive: '#1d5a9a', emissiveIntensity: 0.25 }), 0, (h - 0.9) / 2 + 0.05, -2, CA);
    const front = add(new THREE.PlaneGeometry((r - 0.1) * 2, h - 0.9), new THREE.MeshStandardMaterial({ color: '#5fb0e8', transparent: true, opacity: 0.38, roughness: 0.1, depthWrite: false }), 0, (h - 0.9) / 2 + 0.05, -2 + 0.0, CA, { noink: true, cast: false }); front.renderOrder = 6;
    for (const s of [-1, 1]) add(box(0.12, h, 0.12), '#9aa0aa', s * r, h / 2, -2, CA);                     // cut edges
    add(box(r * 2, 0.12, 0.12), '#9aa0aa', 0, h, -2, CA); add(box(r * 2, 0.12, 0.12), '#9aa0aa', 0, 0.06, -2, CA);
    // the skinny chamber of real oil under the hatch
    Wd.oilChamber = add(cyl(0.32, 0.32, 1.5, 24), toon({ color: '#f4c430', roughness: 0.2, emissive: '#c89010', emissiveIntensity: 0.25 }), 0, h - 0.75, -2.6, CA);
    add(cyl(0.34, 0.34, 1.52, 24, true), M.glass, 0, h - 0.75, -2.6, CA, { noink: true });
    add(cyl(0.32, 0.32, 0.16, 20), '#7f8896', 0, h + 0.08, -2.6, CA);
    Wd.cutLabelOil = sign(CA, [{ t: 'REAL OIL', c: '#2b1f1c' }], 1.25, h - 0.6, -1.9, 1.1, 0.4, { bg: '#f4d35e', d: 0.02 });
    Wd.cutLabelSea = sign(CA, [{ t: 'SEAWATER', c: '#ffffff' }], -1.3, 2.0, -1.9, 1.4, 0.45, { bg: '#2a5fae', d: 0.02 });
    Wd.fish = [0, 1, 2, 3, 4, 5].map((i) => fish(CA, ['#f28c28', '#f4d35e', '#e07a5f', '#3fa39a'][i % 4]));
    Wd.bubbles = []; for (let i = 0; i < 24; i++) Wd.bubbles.push(add(sph(0.05, 8, 6), toon({ color: '#e6f6ff', roughness: 0.1 }), 0, -50, 0, CA, { cast: false }));
    { const crab = group(1.4, 0.15, -2.3, CA); add(sph(0.18, 12, 8), '#c62f36', 0, 0.1, 0, crab).scale.set(1.4, 0.6, 1); for (const s of [-1, 1]) { add(sph(0.07, 8, 6), '#c62f36', s * 0.28, 0.16, 0.12, crab); add(cyl(0.015, 0.015, 0.14, 6), '#c62f36', s * 0.08, 0.26, 0.05, crab); add(sph(0.025, 6, 4), '#2b1f1c', s * 0.08, 0.34, 0.05, crab); } Wd.crab = crab; }
    for (let k = 0; k < 6; k++) { const sw = add(cyl(0.03, 0.05, 0.8 + R() * 0.6, 6), '#3fa36a', -2.2 + k * 0.8, 0.5, -2.8 + (k % 2) * 0.3, CA); Wd.life.push((t) => { sw.rotation.z = Math.sin(t * 1.5 + k) * 0.2; }); } }
  { const lad = group(-2.0, 0, 0.2, CA); for (const s of [-1, 1]) add(box(0.05, 6.4, 0.05), '#3b3f4a', s * 0.22, 3.2, 0, lad); for (let k = 1; k < 20; k++) add(box(0.44, 0.03, 0.04), '#3b3f4a', 0, k * 0.32, 0, lad); }

  // ================= BANKS (x = 50): a street of lenders =================
  const BK = group(50, 0, 0); Wd.banks = BK;
  add(tbox(40, 0.1, 16, 4), M.concrete, 0, -0.05, 0, BK, { cast: false }); add(tbox(40, 0.16, 3, 2), M.marble, 0, 0.08, -4.2, BK);
  add(new THREE.PlaneGeometry(120, 60), new THREE.MeshBasicMaterial({ color: '#9fd0ff' }), 0, 15, -30, BK, { cast: false });
  const NAMES = ['FIRST NATIONAL', 'CITY SAVINGS', 'TRUST & LOAN', 'MERCHANTS BANK', 'BANK No. 51', 'UNION TRUST', 'HARBOR BANK'];
  for (let i = 0; i < 7; i++) { const g = group(-15 + i * 5, 0.16, -7.0, BK); const h = 5 + (i % 3) * 0.8;
    add(tbox(4.6, h, 2.4, 2), M.stoneW, 0, h / 2, 0, g); add(new THREE.ConeGeometry(2.6, 0.9, 4), '#e8e2d4', 0, h + 0.4, 0.6, g).rotation.y = Math.PI / 4;
    for (let k = 0; k < 4; k++) { add(cyl(0.16, 0.18, h - 1.2, 14), '#f4f1e8', -1.5 + k * 1.0, (h - 1.2) / 2 + 0.3, 1.35, g); }
    for (let k = 0; k < 3; k++) add(tbox(4.6 - k * 0.2, 0.15, 0.4), '#e8e2d4', 0, 0.08 + k * 0.15, 1.6 + 0.4 * (2 - k), g);
    add(box(1.1, 1.9, 0.06), '#5a3a24', 0, 0.95 + 0.3, 1.22, g); sign(g, [{ t: NAMES[i], c: '#2b1f1c' }], 0, h - 0.5, 1.45, 3.4, 0.5, { bg: '#f4d35e', border: '#2b1f1c', d: 0.04 }); }
  Wd.count51 = sign(BK, [{ t: '51 BANKS', c: '#ffffff' }], 0, 4.6, -2.8, 2.6, 0.9, { bg: '#c62f36', border: '#f4d35e', glow: 0.35 }); for (const x of [-1.2, 1.2]) add(cyl(0.05, 0.05, 4.2, 8), '#2b2f38', x, 2.1, -2.85, BK);
  Wd.bankBills = Wd.bits(BK, 90, ['#8fbf6a', '#a8d08a', '#7fb05a'], [0.2, 0.09]);
  Wd.bigNum = sign(BK, [{ t: '$175,000,000', c: '#2f6b4f' }], 0, 2.6, -1.2, 3.0, 0.8, { bg: '#fbfaf4', border: '#2f6b4f' }); for (const x of [-1.4, 1.4]) add(cyl(0.05, 0.05, 2.2, 8), '#2b2f38', x, 1.1, -1.25, BK);
  { const wb = group(1.2, 0, 1.4, BK); wb.rotation.y = -0.4; add(tbox(1.0, 0.4, 0.6), '#c62f36', 0, 0.55, 0, wb); add(cyl(0.22, 0.22, 0.1, 16), '#2b2f38', 0.6, 0.22, 0, wb).rotation.x = Math.PI / 2; for (const s of [-1, 1]) add(cyl(0.025, 0.025, 1.2, 6), '#8a5734', -0.6, 0.6, s * 0.25, wb).rotation.z = 1.3; Wd.cashStacks = []; for (let k = 0; k < 12; k++) Wd.cashStacks.push(add(box(0.22, 0.08, 0.12), k % 2 ? '#8fbf6a' : '#7fb05a', -0.3 + (k % 3) * 0.26, 0.8 + Math.floor(k / 6) * 0.08, -0.15 + (Math.floor(k / 3) % 2) * 0.3, wb)); }
  for (const x of [-9, 9]) { add(cyl(0.06, 0.08, 3.6, 10), '#2b2f38', x, 1.8, -2.6, BK); lamp(BK, x + 0.3, 3.5, -2.6, '#2b2f38'); }
  { const car = group(-5, 0, 2.6, BK); add(tbox(3.2, 0.7, 1.5), '#2b2f38', 0, 0.6, 0, car); add(tbox(1.8, 0.55, 1.4), '#2b2f38', -0.2, 1.2, 0, car); add(box(1.7, 0.45, 1.42), '#bfe0f6', -0.2, 1.2, 0, car); for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(cyl(0.3, 0.3, 0.2, 18), '#1a1a20', sx * 1.0, 0.3, sz * 0.75, car).rotation.x = Math.PI / 2; add(box(0.1, 0.2, 1.2), '#e5c158', 1.62, 0.65, 0, car); }

  // ================= AMERICAN EXPRESS WAREHOUSING office (x = 75) =================
  const AX = group(75, 0, 0); Wd.amex = AX;
  room(AX, 8, 7, 3.6, M.panel, texM(marble(), 2, 2), 0.16, 'amex');
  sign(AX, [{ t: 'AMERICAN EXPRESS', c: '#ffffff' }, { t: 'FIELD WAREHOUSING', c: '#bfe0f6' }], 0, 2.85, -3.35, 3.6, 0.9, { bg: '#1d4a8a', border: '#e5c158' });
  { const d = group(0, 0, -1.2, AX); add(tbox(2.4, 0.08, 1.1), '#6a4a32', 0, 0.82, 0, d); add(tbox(2.3, 0.78, 1.0), '#5a3a24', 0, 0.39, 0, d);
    Wd.stamp3D = group(0.3, 0.86, 0.1, d); add(cyl(0.08, 0.1, 0.06, 14), '#c62f36', 0, 0.03, 0, Wd.stamp3D); add(cyl(0.025, 0.025, 0.18, 8), '#8a5734', 0, 0.15, 0, Wd.stamp3D); add(sph(0.06), '#8a5734', 0, 0.26, 0, Wd.stamp3D);
    Wd.receipts = []; for (let i = 0; i < 40; i++) { const m = add(box(0.3, 0.006, 0.38), i % 5 ? '#fbfaf4' : '#f6e27a', -0.5 + Math.sin(i * 1.7) * 0.02, 0.86 + i * 0.012, 0.05 + Math.cos(i * 2.1) * 0.02, d, { cast: false }); Wd.receipts.push(m); }
    Wd.certified = sign(d, [{ t: 'CERTIFIED', c: '#c62f36' }], -0.5, 1.45, 0.2, 0.9, 0.3, { bg: '#fbfaf4', border: '#c62f36', d: 0.01 }); Wd.certified.visible = false;
    add(cyl(0.06, 0.08, 0.04, 12), '#2b2f38', 0.9, 0.86, -0.3, d); add(tbox(0.22, 0.08, 0.16), '#2b2f38', 0.9, 0.9, -0.3, d); }
  chair(AX, 0, -2.1, 0, '#3a2414');
  shelf(AX, -3.2, 0, -3.1, 1.2, 4, 0, '#6a4a32'); shelf(AX, 3.2, 0, -3.1, 1.2, 4, 0, '#6a4a32');
  for (let i = 0; i < 2; i++) { const c = group(-3.7, 0, -0.8 + i * 0.6, AX); c.rotation.y = Math.PI / 2; add(tbox(0.5, 1.3, 0.55), '#7f8896', 0, 0.65, 0, c); for (let k = 0; k < 4; k++) add(box(0.14, 0.03, 0.03), '#d8dde6', 0, 0.2 + k * 0.32, 0.29, c); }
  windowUnit(AX, 3.88, 1.9, 0.6, 1.3, 1.3, -Math.PI / 2, 'city'); clock(AX, -1.8, 2.9, -3.38); fan(AX, 0, 3.55, 0.5); plant(AX, 3.4, 2.4, 1.2);
  frame(AX, 1.9, 2.0, -3.38, 0.8, 0.6, (q, w, h) => { q.fillStyle = '#e8e4da'; q.fillRect(0, 0, w, h); q.fillStyle = '#c9c6bc'; for (let i = 0; i < 4; i++) { q.fillRect(20 + i * 56, 60, 44, 100); q.fillStyle = '#c62f36'; q.fillRect(20 + i * 56, 55, 44, 8); q.fillStyle = '#c9c6bc'; } });
  Wd.amexPapers = Wd.bits(AX, 30, ['#fbfaf4', '#f6e27a'], [0.2, 0.26]);

  // ================= KITCHEN (x = -25): the cake-box analogy =================
  const KT = group(-25, 0, 0); Wd.kitchen = KT;
  room(KT, 7, 6, 3.2, M.kitchen, texM(tiles('#e8d6b0', '#c9a571', 8), 3, 3), 0.1, 'kitchen');
  { const c = group(0, 0, -1.4, KT); add(tbox(3.2, 0.9, 0.9), '#e07a5f', 0, 0.45, 0, c); add(tbox(3.3, 0.06, 1.0), M.marble, 0, 0.93, 0, c);
    const cb = group(0, 0.96, 0, c); Wd.cakeBox = cb; Wd.boxWalls = [];
    for (const [x, z, w, d] of [[0, 0.3, 0.62, 0.02], [0, -0.3, 0.62, 0.02], [0.3, 0, 0.02, 0.62], [-0.3, 0, 0.02, 0.62]]) { const m = add(box(w, 0.44, d), toon({ color: '#f4e2c4', transparent: true, opacity: 1 }), x, 0.22, z, cb); Wd.boxWalls.push(m); }
    add(box(0.62, 0.02, 0.62), '#f4e2c4', 0, 0.01, 0, cb);
    const fr = group(0, 0.44, 0, cb); Wd.frosting = fr; add(box(0.64, 0.08, 0.64), '#ffd1e0', 0, 0.04, 0, fr); for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; add(sph(0.07, 10, 8), '#ffe4ee', Math.cos(a) * 0.24, 0.1, Math.sin(a) * 0.24, fr); } add(sph(0.07), '#c62f36', 0, 0.16, 0, fr); add(cyl(0.006, 0.006, 0.1, 4), '#2f6b4f', 0.02, 0.24, 0, fr).rotation.z = 0.3;
    Wd.bestCake = sign(cb, [{ t: 'BEST CAKE', c: '#c62f36' }], 0, 0.22, 0.32, 0.5, 0.16, { bg: '#f4e2c4', border: null, d: 0.005 });
    Wd.emptyLabel = sign(cb, [{ t: 'EMPTY!', c: '#ffffff' }], 0, 0.22, 0.0, 0.42, 0.16, { bg: '#c62f36', d: 0.005 }); Wd.emptyLabel.visible = false;
    for (let k = 0; k < 3; k++) add(cyl(0.12, 0.12, 0.02, 16), '#fbfaf4', -1.1 + k * 0.3, 0.97, 0.15, c); }
  { const f = group(2.8, 0, -2.4, KT); add(tbox(0.9, 2.0, 0.8), '#bfe0f6', 0, 1.0, 0, f); add(box(0.04, 0.4, 0.06), '#d8dde6', -0.35, 1.3, 0.42, f); add(box(0.9, 0.02, 0.81), '#9aa0aa', 0, 1.3, 0, f); }
  { const ov = group(-2.6, 0, -2.5, KT); add(tbox(1.0, 0.95, 0.75), '#fbfaf4', 0, 0.475, 0, ov); add(box(0.7, 0.4, 0.02), '#2b2f38', 0, 0.45, 0.38, ov); for (let k = 0; k < 4; k++) add(cyl(0.12, 0.12, 0.02, 16), '#2b2f38', -0.22 + (k % 2) * 0.44, 0.96, -0.15 + ((k / 2) | 0) * 0.3, ov); add(cyl(0.16, 0.14, 0.2, 16), '#c62f36', 0.22, 1.06, 0.15, ov); }
  windowUnit(KT, 0, 2.1, -2.88, 1.4, 1.0, 0, 'city'); clock(KT, 1.8, 2.5, -2.88); plant(KT, -3.0, 1.8, 1.0);
  for (let k = 0; k < 5; k++) { const h_ = add(cyl(0.01, 0.01, 0.12, 4), '#9aa0aa', -1.6 + k * 0.4, 1.9, -2.86, KT); add(cyl(0.08, 0.06, 0.1, 12), pick(['#c62f36', '#2a5fae', '#f4d35e']), -1.6 + k * 0.4, 1.78, -2.82, KT); }
  for (const x of [-0.7, 0.7]) { const s = group(x, 0, -0.5, KT); add(cyl(0.2, 0.2, 0.05, 16), '#c62f36', 0, 0.62, 0, s); add(cyl(0.03, 0.03, 0.62, 6), '#d8dde6', 0, 0.31, 0, s); }

  // ================= STOCK EXCHANGE (x = 100) =================
  const EX = group(100, 0, 0); Wd.exchange = EX;
  room(EX, 12, 9, 5.2, M.stoneW, texM(tiles('#2a3a6a', '#3a4a7a', 6), 4, 3), 0.2, 'exchange');
  { const [c, g] = cv(1024, 512); Wd.boardCanvas = c; Wd.boardCtx = g; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; Wd.boardTex = t;
    const bm = new THREE.MeshBasicMaterial({ map: t }); bm.userData.bloomK = 0.4; add(tbox(6.2, 3.1, 0.2), '#2b2f38', 0, 3.3, -4.35, EX); add(new THREE.PlaneGeometry(6, 3), bm, 0, 3.3, -4.24, EX, { cast: false }); }
  Wd.drawBoard = (price, t) => { const g = Wd.boardCtx; g.fillStyle = '#10161f'; g.fillRect(0, 0, 1024, 512); g.font = '64px "Lilita One", Impact'; g.textAlign = 'left'; g.fillStyle = '#f4d35e'; g.fillText('AMERICAN EXPRESS', 40, 90);
    g.font = '170px "Lilita One", Impact'; g.fillStyle = price < 58 ? '#ff4a4a' : '#7fe08a'; g.fillText('$' + price.toFixed(0), 40, 290); g.font = '60px "Lilita One", Impact'; g.fillText(price < 58 ? '▼ ' + (60 - price).toFixed(0) + ' PTS' : '▲ STEADY', 520, 270);
    g.strokeStyle = price < 58 ? '#ff4a4a' : '#7fe08a'; g.lineWidth = 8; g.beginPath(); for (let i = 0; i <= 40; i++) { const x = 40 + i * 23.5, k = i / 40, p = 60 - (60 - price) * Math.pow(k, 1.5) + Math.sin(i * 1.7) * 1.2; const y = 330 + (60 - p) * 5.5; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    g.fillStyle = '#1d2a3a'; g.fillRect(0, 470, 1024, 42); g.font = '30px "Lilita One", Impact'; g.fillStyle = '#ffd860'; const tape = 'AXP ▼  SALAD OIL SCANDAL  ▼  BANKS CALL LOANS  ▼  ALLIED CRUDE BANKRUPT  ▼  '; g.fillText(tape + tape, -((t * 140) % 1400), 500); Wd.boardTex.needsUpdate = true; };
  Wd.arrow = group(2.4, 3.3, -3.9, EX); { const a = Wd.arrow; add(box(0.3, 1.2, 0.2), '#ff4a4a', 0, 0.3, 0, a); add(new THREE.ConeGeometry(0.4, 0.6, 4), '#ff4a4a', 0, -0.6, 0, a).rotation.y = Math.PI / 4; }
  for (let i = 0; i < 4; i++) { const p = group(-4.5 + i * 3, 0, 1.0 + (i % 2) * 0.8, EX); add(cyl(0.5, 0.55, 1.0, 16), '#5a3a24', 0, 0.5, 0, p); add(cyl(0.58, 0.58, 0.06, 16), '#8a5734', 0, 1.03, 0, p); for (let k = 0; k < 3; k++) { const a = k * 2.1; add(box(0.3, 0.22, 0.04), '#2b2f38', Math.cos(a) * 0.4, 1.4, Math.sin(a) * 0.4, p).rotation.y = -a; } add(cyl(0.04, 0.04, 0.4, 8), '#9aa0aa', 0, 1.25, 0, p); }
  Wd.slips = Wd.bits(EX, 120, ['#fbfaf4', '#f6e27a', '#f6c4d6'], [0.14, 0.09]);
  clock(EX, -4.6, 4.2, -4.3); clock(EX, 4.6, 4.2, -4.3);
  for (const x of [-5.6, 5.6]) for (const z of [-2, 1.5]) add(cyl(0.22, 0.26, 5.2, 16), '#f4f1e8', x, 2.6, z, EX);
  { const fl = []; for (let i = 0; i < 5; i++) { const f = add(new THREE.PlaneGeometry(0.7, 0.45, 6, 3), toon({ color: pick(['#c62f36', '#2a5fae', '#f4d35e', '#3fa39a']), side: THREE.DoubleSide }), -3 + i * 1.5, 4.7, -4.0, EX); f.userData.base = f.geometry.attributes.position.array.slice(); fl.push(f); } Wd.flags = fl; }

  // ================= OMAHA office (x = 125) =================
  const OM = group(125, 0, 0); Wd.omaha = OM;
  room(OM, 7, 6, 3.2, M.paperG, M.planks, 0, null);
  { const d = group(0, 0, -1.3, OM); add(tbox(2.0, 0.08, 1.0), '#8a5734', 0, 0.8, 0, d); add(tbox(1.9, 0.76, 0.9), '#6a4a32', 0, 0.38, 0, d); papers(d, 0.4, 0.85, 0.15, 6, 0.3);
    add(cyl(0.05, 0.07, 0.03, 12), '#2b2f38', 0.7, 0.85, -0.3, d); add(cyl(0.012, 0.012, 0.4, 6), '#2b2f38', 0.7, 1.05, -0.3, d); add(cyl(0.05, 0.14, 0.14, 14, true), '#2f6b4f', 0.7, 1.25, -0.25, d); add(sph(0.04), toon({ color: '#fff6c8', emissive: '#ffe9a0', emissiveIntensity: 1.1 }), 0.7, 1.2, -0.25, d);
    // the little tank of seawater on the desk (the ending callback)
    const jt = group(-0.75, 0.84, 0.2, d); Wd.deskTank = jt; add(cyl(0.16, 0.16, 0.3, 24), M.glass, 0, 0.17, 0, jt, { noink: true }); add(cyl(0.15, 0.15, 0.24, 24), toon({ color: '#4a9fd8', roughness: 0.15, transparent: true, opacity: 0.8 }), 0, 0.14, 0, jt); add(cyl(0.17, 0.17, 0.03, 24), '#9aa0aa', 0, 0.33, 0, jt); add(cyl(0.17, 0.17, 0.02, 24), '#9aa0aa', 0, 0.01, 0, jt);
    sign(jt, [{ t: 'SALAD OIL', c: '#c62f36' }], 0, 0.17, 0.17, 0.26, 0.08, { bg: '#fbfaf4', d: 0.004 }); Wd.tinyFish = fish(jt, '#f28c28'); Wd.tinyFish.scale.setScalar(0.25);
    Wd.buyStamp = sign(d, [{ t: 'BUY', c: '#ffffff' }], -0.25, 0.86, 0.25, 0.5, 0.3, { bg: '#2f6b4f', d: 0.01, rx: -Math.PI / 2 }); Wd.buyStamp.visible = false;
    Wd.cert = sign(d, [{ t: 'AMERICAN EXPRESS', c: '#2b1f1c' }, { t: '5% STAKE', c: '#2f6b4f' }], 0.75, 1.35, 0.3, 0.9, 0.55, { bg: '#f4ead0', border: '#2f6b4f', d: 0.01 }); Wd.cert.visible = false; }
  chair(OM, 0, -2.1, 0, '#5a3a24'); shelf(OM, -2.6, 0, -2.75, 1.3, 4, 0, '#8a5734'); plant(OM, 2.9, -2.4, 1.2);
  windowUnit(OM, 2.0, 1.85, -2.88, 1.4, 1.2, 0, 'plains'); clock(OM, -1.0, 2.6, -2.88);
  for (let k = 0; k < 6; k++) add(box(0.32, 0.05, 0.42), '#f6f1e6', -2.9 + (k % 2) * 0.05, 0.03 + k * 0.05, 1.8, OM, { cast: false });
  sign(OM, [{ t: 'OMAHA', c: '#2b1f1c' }, { t: 'NEBRASKA', c: '#2a5fae' }], -0.6, 2.5, -2.86, 0.9, 0.5, { bg: '#fbfaf4' });
  Wd.omBills = Wd.bits(OM, 110, ['#8fbf6a', '#a8d08a', '#f4d35e'], [0.18, 0.08]);
  Wd.omConfetti = Wd.bits(OM, 60, ['#c62f36', '#2a5fae', '#f4d35e', '#ffffff'], [0.06, 0.04]);

  Wd.tick = (t) => { for (const f of Wd.life) f(t); };
  return Wd;
})();
