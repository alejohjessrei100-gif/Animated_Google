// Reference export: page frames (lossless PNG) -> ffmpeg x264 CRF 16, yuv420p BT.709 limited range, AAC 192k.
//   node tools/export.js wolf-story.html out.mp4 [start end]
const { chromium } = require('playwright'); const path = require('path'), { spawn } = require('child_process');
(async () => {
  const [page_, out, s0 = '0', s1 = ''] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 500, height: 900 } });
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await p.route('**/three@0.170.0/build/three.module.js', (r) => r.fulfill({ path: '/home/user/Animated_Google/oddtilt/node_modules/three/build/three.module.js', contentType: 'text/javascript' }));
  await p.route('**/mp4-muxer@5.2.2/build/mp4-muxer.js', (r) => r.fulfill({ path: '/tmp/mm/package/build/mp4-muxer.js', contentType: 'text/javascript' }));
  await p.route('**fonts.g**', (r) => r.abort());
  await p.goto('file://' + path.resolve(page_)); await p.waitForFunction(() => window.ready); await p.evaluate(() => window.ready);
  const END = await p.evaluate(() => window.END), a = +s0, e = s1 ? +s1 : END, f0 = Math.round(a * 30), f1 = Math.round(e * 30);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-i', '-', '-ss', String(a), '-t', String(e - a), '-i', 'build/mix.wav',
    '-sws_flags', 'neighbor', '-vf', 'scale=1080:1920:flags=neighbor:in_range=full:out_range=limited:out_color_matrix=bt709,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-tune', 'animation', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-af', 'alimiter=limit=0.88:level=false', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = f0; f < f1; f++) {
    const png = await p.evaluate((t) => { drawFrame(t); return document.getElementById('c').toDataURL('image/png').split(',')[1]; }, f / 30);
    if (!ff.stdin.write(Buffer.from(png, 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 150 === 0) console.log('frame', f);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r)); await b.close(); console.log('wrote', out);
})();
