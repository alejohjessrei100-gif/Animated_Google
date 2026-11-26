// ---------- player + phone renderer ----------
const $ = (id) => document.getElementById(id);
const msg = (s, err) => { $('msg').textContent = s; $('msg').className = err ? 'err' : ''; };
const fill = (k) => { $('fill').style.width = (k * 100).toFixed(1) + '%'; };
const audioBytes = () => Uint8Array.from(atob(window.AUDIO_B64), (c) => c.charCodeAt(0));
let audioURL = null; const audioEl = new Audio();
try { audioURL = URL.createObjectURL(new Blob([audioBytes()], { type: 'audio/mpeg' })); audioEl.src = audioURL; } catch (e) { }
let playing = false, busy = false;
$('play').onclick = () => {
  if (busy) return;
  if (playing) { playing = false; audioEl.pause(); $('play').textContent = '▶ Play preview'; return; }
  playing = true; $('play').textContent = '■ Stop'; audioEl.currentTime = 0; audioEl.play().catch(() => {});
  const t0 = performance.now();
  const loop = () => { if (!playing) return; const t = audioEl.paused || !isFinite(audioEl.currentTime) || audioEl.currentTime === 0 ? (performance.now() - t0) / 1000 : audioEl.currentTime; if (t >= END) { playing = false; $('play').textContent = '▶ Play preview'; drawFrame(END); return; } drawFrame(t); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
};

async function pickVideo() {
  const tries = [['avc1.640028', 'avc'], ['avc1.4d0028', 'avc'], ['avc1.42e028', 'avc'], ['vp09.00.40.08', 'vp9']];
  for (const [codec, mux] of tries) {
    const cfg = { codec, width: W, height: H, bitrate: 12e6, framerate: 30 };
    try { const s = await VideoEncoder.isConfigSupported(cfg); if (s.supported) return { cfg, mux }; } catch (e) { }
  }
  return null;
}
async function pickAudio(sr) {
  if (!('AudioEncoder' in window)) return null;
  for (const [codec, mux, rate] of [['mp4a.40.2', 'aac', sr], ['opus', 'opus', 48000]]) {
    const cfg = { codec, sampleRate: rate, numberOfChannels: 2, bitrate: 160000 };
    try { const s = await AudioEncoder.isConfigSupported(cfg); if (s.supported) return { cfg, mux }; } catch (e) { }
  }
  return null;
}
async function decodeAudio(rate) {
  const ac = new OfflineAudioContext(2, Math.ceil(rate * END), rate);
  const b = await ac.decodeAudioData(audioBytes().buffer);
  const out = new OfflineAudioContext(2, Math.ceil(rate * END), rate), src = out.createBufferSource(); src.buffer = b; src.connect(out.destination); src.start();
  return out.startRendering();
}
let result = null;
async function renderWebCodecs() {
  const v = await pickVideo(); if (!v) throw new Error('no-encoder');
  let buf = null, a = null;
  try { buf = await decodeAudio(48000); a = await pickAudio(48000); } catch (e) { a = null; }
  const muxer = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), fastStart: 'in-memory', firstTimestampBehavior: 'offset',
    video: { codec: v.mux, width: W, height: H, frameRate: 30 }, ...(a ? { audio: { codec: a.mux, numberOfChannels: 2, sampleRate: a.cfg.sampleRate } } : {}) });
  let fail = null;
  const venc = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: (e) => { fail = e; } });
  venc.configure(v.cfg);
  const N = Math.round(END * 30);
  for (let f = 0; f < N; f++) {
    if (fail) throw fail;
    drawFrame(f / 30);
    const frame = new VideoFrame(cv, { timestamp: Math.round(f * 1e6 / 30), duration: Math.round(1e6 / 30) });
    venc.encode(frame, { keyFrame: f % 60 === 0 }); frame.close();
    if (venc.encodeQueueSize > 6) await new Promise((r) => { const w = () => venc.encodeQueueSize <= 2 ? r() : setTimeout(w, 4); w(); });
    if (f % 6 === 0) { fill(f / N * .95); msg(`Rendering frame ${f + 1} of ${N}…`); await new Promise((r) => setTimeout(r, 0)); }
  }
  await venc.flush(); venc.close();
  if (a && buf) {
    msg('Encoding the sound…');
    const aenc = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: (e) => { fail = e; } });
    aenc.configure(a.cfg);
    const L = buf.getChannelData(0), R = buf.getChannelData(1), step = 4800;
    for (let i = 0; i < L.length; i += step) {
      const n = Math.min(step, L.length - i), data = new Float32Array(n * 2); data.set(L.subarray(i, i + n), 0); data.set(R.subarray(i, i + n), n);
      const ad = new AudioData({ format: 'f32-planar', sampleRate: buf.sampleRate, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(i / buf.sampleRate * 1e6), data });
      aenc.encode(ad); ad.close();
    }
    await aenc.flush(); aenc.close(); if (fail) throw fail;
  }
  muxer.finalize();
  return { blob: new Blob([muxer.target.buffer], { type: 'video/mp4' }), ext: 'mp4', note: a ? '' : ' (no sound: this browser cannot encode audio, use the preview audio)' };
}
async function renderRecorder() {
  // fallback for browsers without WebCodecs: record the canvas in real time with the soundtrack
  const types = ['video/mp4;codecs=avc1,mp4a', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'];
  const type = types.find((x) => window.MediaRecorder && MediaRecorder.isTypeSupported(x)); if (!type) throw new Error('no-recorder');
  const ac = new AudioContext(), dest = ac.createMediaStreamDestination(), b = await ac.decodeAudioData(audioBytes().buffer), src = ac.createBufferSource(); src.buffer = b; src.connect(dest);
  const stream = cv.captureStream(30); dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
  const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 12e6 }), parts = []; rec.ondataavailable = (e) => e.data.size && parts.push(e.data);
  const done = new Promise((r) => rec.onstop = r);
  rec.start(500); const t0 = ac.currentTime + .05; src.start(t0);
  await new Promise((resolve) => { const loop = () => { const t = ac.currentTime - t0; if (t >= END) return resolve(); drawFrame(Math.max(0, t)); fill(t / END); msg('Recording in real time (this browser has no video encoder)…'); requestAnimationFrame(loop); }; requestAnimationFrame(loop); });
  rec.stop(); await done; ac.close();
  return { blob: new Blob(parts, { type: type.split(';')[0] }), ext: type.includes('mp4') ? 'mp4' : 'webm', note: '' };
}
$('render').onclick = async () => {
  if (busy) return; busy = true; playing = false; audioEl.pause(); $('play').textContent = '▶ Play preview';
  $('render').disabled = true; $('play').disabled = true; $('saveRow').hidden = true; $('out').hidden = true; fill(0);
  const t0 = performance.now();
  try {
    result = ('VideoEncoder' in window) ? await renderWebCodecs().catch((e) => { if (String(e.message) === 'no-encoder') return renderRecorder(); throw e; }) : await renderRecorder();
    fill(1); const mb = (result.blob.size / 1048576).toFixed(1), s = ((performance.now() - t0) / 1000).toFixed(0);
    msg(`Done in ${s} s: ${mb} MB ${result.ext.toUpperCase()}${result.note}. Tap Save MP4.`);
    const u = URL.createObjectURL(result.blob); $('out').src = u; $('out').hidden = false; $('saveRow').hidden = false;
    $('save').textContent = 'Save ' + result.ext.toUpperCase();
  } catch (e) { msg('Render failed: ' + (e && e.message || e) + '. Try Chrome or Safari, and keep the screen on.', true); }
  busy = false; $('render').disabled = false; $('play').disabled = false;
};
$('again').onclick = () => $('render').onclick();
$('save').onclick = async () => {
  if (!result) return; const name = 'wolf-doorbell-story.' + result.ext;
  const dl = await (window.claude?.use ? window.claude.use('downloads').catch(() => null) : null);
  if (dl) {
    try { await dl.save({ filename: name, data: result.blob }); msg('Saved ' + name + '.'); }
    catch (e) { const c = e && e.code; msg(c === 'declined' ? 'Save cancelled.' : c === 'host_unavailable' ? 'This app cannot save files: open the page in your phone browser, or long-press the video above.' : 'Could not save (' + (c || e) + '). Long-press the video above to save it.', c !== 'declined'); }
    return;
  }
  const a = document.createElement('a'); a.href = $('out').src; a.download = name; document.body.appendChild(a); a.click(); a.remove(); msg('Download started: ' + name);
};
window.ready.then(() => { $('render').disabled = false; msg(('VideoEncoder' in window) ? 'Ready. Play the preview, or render the MP4 on this device.' : 'Ready. This browser has no video encoder, so the render records in real time (41 s).'); });
