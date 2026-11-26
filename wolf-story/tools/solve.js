const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 500, height: 900 } });
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await p.route('**/three@0.170.0/build/three.module.js', (r) => r.fulfill({ path: '/home/user/Animated_Google/oddtilt/node_modules/three/build/three.module.js', contentType: 'text/javascript' }));
  await p.route('**/mp4-muxer@5.2.2/build/mp4-muxer.js', (r) => r.fulfill({ path: '/tmp/mm/package/build/mp4-muxer.js', contentType: 'text/javascript' }));
  await p.route('**fonts.g**', (r) => r.abort());
  await p.goto('file://' + path.resolve(process.argv[2])); await p.waitForFunction(() => window.ready && window.__solve); await p.evaluate(() => window.ready);
  const r = await p.evaluate(() => window.__solve());
  console.log(r.report.join('\n')); fs.writeFileSync(process.argv[3], JSON.stringify(r.shots)); await b.close();
})();
