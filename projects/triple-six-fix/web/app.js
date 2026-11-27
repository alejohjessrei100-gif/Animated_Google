// Page controller: preview playback with audio, scrubbing, and a frame-exact GPU render to MP4 (WebCodecs) with the mixed audio.
(() => {
  const $ = (id) => document.getElementById(id);
  const gl = document.createElement('canvas');
  const out = $('screen'), og = out.getContext('2d');
  const audio = $('mix');
  const S = STORY, FPS = S.FPS, TOTAL = S.TOTAL;
  let size = null, playing = false, cur = 0, busy = false;

  const setSize = (w, h) => { if (size && size[0] === w) return; size = [w, h]; ENGINE.init(gl, w, h); out.width = w; out.height = h; };
  const draw = (f) => {
    const F = S.frame(f); ENGINE.render(F);
    og.drawImage(gl, 0, 0, out.width, out.height);
    S.drawCaption(og, F.t, out.width, out.height);
    return F;
  };
  const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}.${String(Math.floor((t % 1) * 10))}`;
  const show = (f) => { cur = Math.max(0, Math.min(TOTAL - 1, f)); draw(cur); $('scrub').value = cur; $('time').textContent = `${fmt(cur / FPS)} / ${fmt(TOTAL / FPS)}`; markShot(cur / FPS); };

  // shot chips
  const NAMES = { workshop: 'Paint workshop', studio: 'TV studio', living: 'Living room', street: 'Ticket stand', classroom: 'Classroom', bookie: 'Bookie office', court: 'Courtroom' };
  $('shots').innerHTML = S.SHOTS.map((s, i) => `<button class="chip" data-t="${s.t}" type="button"><b>${i + 1}</b><span>${NAMES[s.set]}</span><i>${fmt(s.t)}</i></button>`).join('');
  const chips = [...document.querySelectorAll('.chip')];
  chips.forEach((c) => c.addEventListener('click', () => { pause(); show(Math.round(+c.dataset.t * FPS) + 6); }));
  const markShot = (t) => { let k = 0; S.SHOTS.forEach((s, i) => { if (t >= s.t) k = i; }); chips.forEach((c, i) => c.classList.toggle('on', i === k)); };

  // playback (draft resolution, synced to the audio clock)
  const loop = () => { if (!playing) return; const f = Math.floor(audio.currentTime * FPS); if (f >= TOTAL - 1 || audio.ended) { pause(); return; } show(f); requestAnimationFrame(loop); };
  const play = () => { if (busy) return; setSize(540, 960); playing = true; $('play').textContent = 'Pause'; audio.currentTime = cur / FPS; audio.play().catch(() => {}); requestAnimationFrame(loop); };
  const pause = () => { playing = false; $('play').textContent = 'Play preview'; audio.pause(); };
  $('play').addEventListener('click', () => (playing ? pause() : play()));
  $('scrub').max = TOTAL - 1;
  $('scrub').addEventListener('input', (e) => { pause(); setSize(540, 960); show(+e.target.value); });

  // ---------- export ----------
  const status = (s, cls = '') => { $('status').textContent = s; $('status').className = 'status ' + cls; };
  async function pickFormat(w, h) {
    if (!('VideoEncoder' in window) || !('AudioEncoder' in window)) return null;
    const vbase = { width: w, height: h, bitrate: w >= 1080 ? 16e6 : 6e6, framerate: FPS };
    const tryV = async (codec) => { for (const hw of ['prefer-hardware', 'no-preference']) { const c = { ...vbase, codec, hardwareAcceleration: hw, avc: codec.startsWith('avc') ? { format: 'avc' } : undefined }; try { const r = await VideoEncoder.isConfigSupported(c); if (r.supported) return { ...c, hw }; } catch (e) { /* next */ } } return null; };
    const tryA = async (codec) => { const c = { codec, sampleRate: 48000, numberOfChannels: 2, bitrate: 192000 }; try { const r = await AudioEncoder.isConfigSupported(c); return r.supported ? c : null; } catch (e) { return null; } };
    for (const vc of ['avc1.640034', 'avc1.640033', 'avc1.4d0033']) { const v = await tryV(vc); if (!v) continue; const a = (await tryA('mp4a.40.2')) || (await tryA('opus')); if (a) return { box: 'mp4', v, a }; }
    const v9 = await tryV('vp09.00.41.08'); const op = await tryA('opus');
    if (v9 && op) return { box: 'webm', v: v9, a: op };
    return null;
  }
  async function render() {
    if (busy) return; pause(); busy = true; $('render').disabled = true; $('play').disabled = true;
    const [w, h] = $('res').value.split('x').map(Number);
    try {
      status('Checking your browser’s GPU video encoder…');
      const fmtSel = await pickFormat(w, h);
      if (!fmtSel) { status('This browser can’t encode video here. Open the page in desktop Chrome or Edge and try again.', 'bad'); return; }
      setSize(w, h);
      const { box, v, a } = fmtSel;
      const target = box === 'mp4' ? new Mp4Muxer.ArrayBufferTarget() : new WebMMuxer.ArrayBufferTarget();
      const muxer = box === 'mp4'
        ? new Mp4Muxer.Muxer({ target, video: { codec: 'avc', width: w, height: h, frameRate: FPS }, audio: { codec: a.codec === 'opus' ? 'opus' : 'aac', sampleRate: 48000, numberOfChannels: 2 }, fastStart: 'in-memory', firstTimestampBehavior: 'offset' })
        : new WebMMuxer.Muxer({ target, video: { codec: 'V_VP9', width: w, height: h, frameRate: FPS }, audio: { codec: 'A_OPUS', sampleRate: 48000, numberOfChannels: 2 }, firstTimestampBehavior: 'offset' });
      let failed = null;
      const venc = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: (e) => { failed = e; } });
      venc.configure(v);
      const aenc = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: (e) => { failed = e; } });
      aenc.configure(a);
      // audio first (decoded at 48 kHz, fed in 1024-sample planar chunks)
      status('Encoding the soundtrack…');
      const buf = await (await fetch($('mix').currentSrc || 'mix.mp3')).arrayBuffer();
      const ab = await new OfflineAudioContext(2, 48000, 48000).decodeAudioData(buf);
      const n = Math.min(ab.length, Math.ceil(S.END * 48000)), L = ab.getChannelData(0), R = ab.numberOfChannels > 1 ? ab.getChannelData(1) : L;
      for (let i = 0; i < n; i += 1024) { const m = Math.min(1024, n - i), d = new Float32Array(m * 2); d.set(L.subarray(i, i + m), 0); d.set(R.subarray(i, i + m), m);
        const ad = new AudioData({ format: 'f32-planar', sampleRate: 48000, numberOfFrames: m, numberOfChannels: 2, timestamp: Math.round(i / 48000 * 1e6), data: d }); aenc.encode(ad); ad.close(); }
      await aenc.flush();
      // video
      const t0 = performance.now(); $('bar').style.width = '0%';
      for (let f = 0; f < TOTAL; f++) {
        if (failed) throw failed;
        draw(f);
        const vf = new VideoFrame(out, { timestamp: Math.round(f * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
        venc.encode(vf, { keyFrame: f % 60 === 0 }); vf.close();
        while (venc.encodeQueueSize > 6) await new Promise((r) => setTimeout(r, 1));
        if (f % 3 === 0 || f === TOTAL - 1) {
          const el = (performance.now() - t0) / 1000, fps = (f + 1) / el, eta = (TOTAL - f - 1) / fps;
          $('bar').style.width = `${((f + 1) / TOTAL * 100).toFixed(1)}%`; $('time').textContent = `${fmt(f / FPS)} / ${fmt(TOTAL / FPS)}`; $('scrub').value = f; markShot(f / FPS);
          status(`Rendering frame ${f + 1} of ${TOTAL} · ${fps.toFixed(1)} fps · about ${Math.ceil(eta)} s left · ${v.hw === 'prefer-hardware' ? 'GPU encoder' : 'encoder'}`);
          await new Promise((r) => setTimeout(r, 0));
        }
      }
      await venc.flush(); muxer.finalize();
      const blob = new Blob([target.buffer], { type: box === 'mp4' ? 'video/mp4' : 'video/webm' });
      const name = `triple_six_fix_${w}x${h}.${box}`;
      const url = URL.createObjectURL(blob); $('result').hidden = false; $('vid').src = url; $('dl').href = url; $('dl').download = name;
      $('size').textContent = `${name} · ${(blob.size / 1048576).toFixed(1)} MB · ${((performance.now() - t0) / 1000).toFixed(0)} s render`;
      status('Done. Saving the file…', 'good');
      const dls = await (window.claude?.use ? window.claude.use('downloads') : null);
      if (dls) { try { await dls.save({ filename: name, data: blob }); status('Saved. Check your Downloads folder.', 'good'); } catch (e) { status(e?.code === 'declined' ? 'Save cancelled. Press “Save again” when you’re ready.' : 'Saving was blocked here. Use “Save again” or right-click the video below.', 'bad'); } }
      else status('Done. Use the Save button below.', 'good');
      $('again').onclick = async () => { const d = await window.claude?.use?.('downloads'); if (d) d.save({ filename: name, data: blob }).then(() => status('Saved. Check your Downloads folder.', 'good')).catch(() => status('Save was not completed.', 'bad')); };
    } catch (e) { console.error(e); status('Render stopped: ' + (e?.message || e), 'bad'); }
    finally { busy = false; $('render').disabled = false; $('play').disabled = false; }
  }
  $('render').addEventListener('click', render);

  // first paint: a frame from the hook
  setSize(540, 960); show(36);
  window.renderFrame = (f) => { setSize(1080, 1920); draw(f); return true; };
  window.renderAt = (f, w, h) => { setSize(w, h); draw(f); return true; };
  window.ready = true;
})();
