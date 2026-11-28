// tools/autocheck.cjs <webdir> [step=1] : steps through every frame of STORY (no rendering) and reports
// caption-over-face, characters cut off at the frame edge, camera inside solid boxes, camera static > 1.5 s.
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const [,, root, stepArg] = process.argv; const V = path.join(__dirname, 'vendor'); const step = +(stepArg || 1);
const types = { js: 'text/javascript', html: 'text/html', mp3: 'audio/mpeg', ttf: 'font/ttf' };
const srv = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/test.html'; const f = path.join(root, p); if (!fs.existsSync(f)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': types[f.split('.').pop()] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); }).listen(0);
(async () => {
  fs.copyFileSync(path.join(root, 'index.html'), path.join(root, 'test.html'));
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); const pg = await b.newPage();
  pg.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
  await pg.route('**/cdn.jsdelivr.net/**', (r) => { const u = r.request().url(); const map = { 'three.min.js': 'three-0.159.0/package/build/three.min.js', 'mp4-muxer.js': 'mp4-muxer-5.1.3/package/build/mp4-muxer.js', 'webm-muxer.js': 'webm-muxer-5.0.3/package/build/webm-muxer.js' }; const k = Object.keys(map).find((k) => u.endsWith(k)); r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(path.join(V, map[k])) }); });
  await pg.route('**/fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await pg.goto(`http://localhost:${srv.address().port}/`); await pg.waitForFunction(() => window.ready, null, { timeout: 180000 });
  const res = await pg.evaluate(async (step) => {
    await document.fonts.ready; const W = 1080, H = 1920, S = STORY, FPS = S.FPS; const g = document.createElement('canvas').getContext('2d');
    const cam = new THREE.PerspectiveCamera(40, W / H, 0.05, 800); const scene = ENGINE.scene; const issues = [];
    const vis = (o) => { while (o) { if (!o.visible) return false; o = o.parent; } return true; };
    const solids = []; scene.traverse((o) => { if (o.isMesh && o.geometry && o.geometry.type === 'BoxGeometry' && !o.userData.ndSkip && !(o.material && o.material.transparent)) { o.geometry.computeBoundingBox(); solids.push(o); } });
    const box3 = new THREE.Box3(); let still = 0, prev = null, gusOff = 0;
    for (let f = 0; f < S.TOTAL; f += step) { const t = f / FPS; const ck = S.checkAt(g, t, W, H); S.state(t); scene.updateMatrixWorld(true); const c = ck.cam; const whip = c.whip && (Math.abs(c.whip[0]) + Math.abs(c.whip[1]) > 0.005); if (whip) { prev = c; continue; }
      cam.fov = c.fov; cam.aspect = W / H; cam.updateProjectionMatrix(); cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ((c.roll || 0) * Math.PI / 180); cam.updateMatrixWorld();
      if (ck.cap) for (const fc of ck.faces) { const a = ck.cap.box, bx = fc.box; const ox = Math.max(0, Math.min(a[2], bx[2]) - Math.max(a[0], bx[0])), oy = Math.max(0, Math.min(a[3], bx[3]) - Math.max(a[1], bx[1])); if (ox * oy > 0.05 * (bx[2] - bx[0]) * (bx[3] - bx[1])) issues.push({ f, kind: 'caption covers face', who: fc.id }); }
      for (const a of S.actors(t)) { const id = a.key.match(/^[a-z0-9]+/)[0], s = a.s, hc = (id === 'gus' ? 1.27 : 1.4) * s; const pts = [[0, 0], [0, hc + 0.36 * s], [-0.38 * s, hc * 0.6], [0.38 * s, hc * 0.6]].map(([dx, dy]) => new THREE.Vector3(a.x + dx, a.y + dy, a.z).project(cam));
        if (pts.some((p) => p.z > 1)) continue; const xs = pts.map((p) => (p.x * 0.5 + 0.5) * W), ys = pts.map((p) => (0.5 - p.y * 0.5) * H); const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
        const iw = Math.max(0, Math.min(x1, W) - Math.max(x0, 0)), ih = Math.max(0, Math.min(y1, H) - Math.max(y0, 0)), frac = (iw * ih) / Math.max(1, (x1 - x0) * (y1 - y0));
        const face = new THREE.Vector3(a.x, a.y + hc, a.z).project(cam), fx = (face.x * 0.5 + 0.5) * W, fy = (0.5 - face.y * 0.5) * H, faceIn = fx > 0 && fx < W && fy > 0 && fy < H;
        let kr = S.K[0]; for (const k of S.K) if (t >= k.t) kr = k; if (!kr.reveal && frac > 0.05 && frac < 0.92 && faceIn && (x1 - x0) * (y1 - y0) > 0.002 * W * H) issues.push({ f, kind: 'character cut off', who: id, frac: +frac.toFixed(2) }); }
      { const gs = S.actors(t).filter((a) => a.key.startsWith('gus')); let seen = false; for (const a of gs) { const p = new THREE.Vector3(a.x, a.y + 1.27 * a.s, a.z).project(cam); if (p.z < 1 && Math.abs(p.x) < 1 && Math.abs(p.y) < 1) seen = true; } let kk = S.K[0]; for (const k of S.K) if (t >= k.t) kk = k; gusOff = gs.length && !seen && !kk.noGus ? gusOff + step : 0; if (gusOff === Math.round(1.2 * FPS)) issues.push({ f, kind: 'gus off-screen 1.2 s' }); }
      for (const a of S.actors(t)) { const id = a.key.match(/^[a-z0-9]+/)[0], hp = new THREE.Vector3(a.x, a.y + (id === 'gus' ? 1.27 : 1.4) * a.s, a.z); for (const o of solids) { if (!vis(o)) continue; box3.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); box3.expandByScalar(-0.03); if (box3.containsPoint(hp)) { const p = hp.clone().project(cam); if (p.z < 1 && Math.abs(p.x) < 1 && Math.abs(p.y) < 1) issues.push({ f, kind: 'character buried', who: id }); break; } } }
      for (const o of solids) { if (!vis(o)) continue; box3.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); box3.expandByScalar(-0.02); if (box3.containsPoint(cam.position)) { issues.push({ f, kind: 'camera inside solid', who: o.parent && o.parent !== scene ? 'group' : 'mesh', size: box3.getSize(new THREE.Vector3()).toArray().map((v) => +v.toFixed(1)).join('x') }); break; } }
      if (prev) { const d = Math.hypot(c.pos[0] - prev.pos[0], c.pos[1] - prev.pos[1], c.pos[2] - prev.pos[2]) + Math.hypot(c.look[0] - prev.look[0], c.look[1] - prev.look[1], c.look[2] - prev.look[2]); still = d < 0.0015 * step ? still + step : 0; if (still === Math.round(1.5 * FPS)) issues.push({ f, kind: 'camera static 1.5 s' }); }
      prev = c; }
    return { issues, TOTAL: S.TOTAL, FPS };
  }, step);
  fs.unlinkSync(path.join(root, 'test.html'));
  let groups = []; for (const it of res.issues) { const last = groups[groups.length - 1], tag = it.kind + '|' + (it.who || ''); if (last && last.tag === tag && it.f - last.f1 <= step * 3) last.f1 = it.f; else groups.push({ tag, kind: it.kind, who: it.who || '', f0: it.f, f1: it.f, extra: it.size || it.frac || '' }); }
  groups = groups.filter((g) => g.kind !== 'character cut off' || g.f1 - g.f0 >= 3 * step);   // 1-2 frame cut-offs are mid-transition
  const fmt = (f) => (f / res.FPS).toFixed(2) + 's';
  console.log(groups.length ? groups.map((g) => `${g.kind.padEnd(20)} ${g.who.padEnd(7)} ${fmt(g.f0)}-${fmt(g.f1)}  frames ${g.f0}-${g.f1} ${g.extra}`).join('\n') : 'ALL CLEAR');
  console.log(`\n${groups.length} issue ranges in ${res.TOTAL} frames`); fs.writeFileSync(path.join(root, '..', 'autocheck.json'), JSON.stringify(groups, null, 1));
  await b.close(); srv.close(); process.exit(groups.length ? 1 : 0);
})();
