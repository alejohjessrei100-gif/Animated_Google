// Steps the page at 15 fps and reports any required subject leaving the 9:16 frame (5% side margin).
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 500, height: 900 } });
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await p.route('**/three@0.170.0/build/three.module.js', (r) => r.fulfill({ path: '/home/user/Animated_Google/oddtilt/node_modules/three/build/three.module.js', contentType: 'text/javascript' }));
  await p.route('**/mp4-muxer@5.2.2/build/mp4-muxer.js', (r) => r.fulfill({ path: '/tmp/mm/package/build/mp4-muxer.js', contentType: 'text/javascript' }));
  await p.route('**fonts.g**', (r) => r.abort());
  await p.goto('file://' + path.resolve(process.argv[2])); await p.waitForFunction(() => window.ready && window.__audit); await p.evaluate(() => window.ready);
  const res = await p.evaluate(() => { const rows = []; for (let f = 0; f < 41.2 * 15; f++) { const t = f / 15, a = window.__audit(t); if (a.out.length) rows.push([t.toFixed(2), a.shot, a.out.join(' | ')]); } return rows; });
  const byShot = {}; for (const [t, s, o] of res) (byShot[s] = byShot[s] || []).push(t + ' ' + o);
  for (const s in byShot) console.log('shot ' + s + ': ' + byShot[s].length + ' frames\n  ' + byShot[s].slice(0, 4).join('\n  '));
  console.log(res.length ? res.length + ' bad samples' : 'ALL FRAMES PASS');
  await b.close();
})();
