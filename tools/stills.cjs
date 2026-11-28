const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const [,, root, outdir, spec] = process.argv; const V = process.env.VENDOR;
fs.mkdirSync(outdir, { recursive: true });
const types = { js: 'text/javascript', html: 'text/html', mp3: 'audio/mpeg' };
const srv = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/test.html'; const f = path.join(root, p); if (!fs.existsSync(f)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': types[f.split('.').pop()] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); }).listen(0);
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await b.newPage({ viewport: { width: 1280, height: 900 } });
  pg.on('console', m => { const t = m.text(); if (!/deprecated|GPU stall|WebGL/.test(t)) console.log('PAGE', t); }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.route('**/cdn.jsdelivr.net/**', (r) => { const u = r.request().url(); const map = { 'three.min.js': 'three-0.159.0/package/build/three.min.js', 'mp4-muxer.js': 'mp4-muxer-5.1.3/package/build/mp4-muxer.js', 'webm-muxer.js': 'webm-muxer-5.0.3/package/build/webm-muxer.js' }; const k = Object.keys(map).find((k) => u.endsWith(k)); r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(path.join(V, map[k])) }); });
  await pg.route('**/fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await pg.goto(`http://localhost:${srv.address().port}/`);
  await pg.waitForFunction(() => window.ready || window.err, null, { timeout: 180000 });
  if (await pg.evaluate(() => window.err)) { console.log('page error', await pg.evaluate(() => window.err)); process.exit(1); }
  if (spec === 'page') { await pg.screenshot({ path: path.join(outdir, 'page.png') }); await pg.setViewportSize({ width: 400, height: 860 }); await pg.screenshot({ path: path.join(outdir, 'page_phone.png'), fullPage: true }); await b.close(); srv.close(); return; }
  let frames = spec === 'mid' ? await pg.evaluate(() => STORY.K.map((k) => Math.round(((k.t + Math.min(k.t1, STORY.END)) / 2) * 30))) : spec.includes('-') ? (() => { const [a, b] = spec.split('-').map(Number); const o = []; for (let f = a; f <= b; f++) o.push(f); return o; })() : spec.split(',').map(Number);
  const t0 = Date.now();
  for (const f of frames) { const PW = +(process.env.PW || 0), PH = +(process.env.PH || 0); const d = await pg.evaluate(([f, w, h, q]) => { if (w) window.renderAt(f, w, h); else window.renderFrame(f); return document.getElementById('screen').toDataURL('image/jpeg', q); }, [f, PW, PH, +(process.env.Q || 0.85)]); fs.writeFileSync(path.join(outdir, `f${String(f).padStart(4, '0')}.jpg`), Buffer.from(d.split(',')[1], 'base64')); }
  console.log(`done ${frames.length} frames, ${((Date.now() - t0) / frames.length / 1000).toFixed(2)} s/frame`);
  await b.close(); srv.close();
})();
