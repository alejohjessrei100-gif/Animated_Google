// Retro arcade Web Audio: synthesized SFX, a tiny chiptune loop, and Kokoro voice clips.
let ac = null, master, sfxBus, musicBus, voiceBus, noiseBuf, crushCurve;
const settings = { sfx: 0.7, music: 0.35, voice: 0.9, muted: false };
const clips = new Map();
let manifest = null;

export function audioSettings() { return settings; }
export function setVolume(k, v) { settings[k] = v; apply(); }
export function setMuted(m) { settings.muted = m; apply(); }
function apply() {
  if (!ac) return;
  master.gain.value = settings.muted ? 0 : 1;
  sfxBus.gain.value = settings.sfx; musicBus.gain.value = settings.music; voiceBus.gain.value = settings.voice;
}

export function initAudio() {
  if (ac) { if (ac.state === "suspended") ac.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ac = new AC();
  master = ac.createGain(); master.connect(ac.destination);
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(master);
  sfxBus = ac.createGain(); sfxBus.connect(comp);
  musicBus = ac.createGain(); musicBus.connect(comp);
  voiceBus = ac.createGain(); voiceBus.connect(comp);
  noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  crushCurve = new Float32Array(256);
  for (let i = 0; i < 256; i++) { const x = i / 128 - 1; crushCurve[i] = Math.round(x * 6) / 6; }
  apply();
  loadManifest();
}

function env(g, t, a, peak, dec, sus = 0) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sus || 0.0001), t + a + dec);
}
function tone(type, f0, f1, dur, vol, t0 = 0, bus = sfxBus) {
  const t = ac.currentTime + t0;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  env(g, t, 0.004, vol, dur);
  o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur, vol, lp = 4000, hp = 100, t0 = 0, sweep = 0) {
  const t = ac.currentTime + t0;
  const s = ac.createBufferSource(); s.buffer = noiseBuf; s.playbackRate.value = 0.5 + Math.random() * 0.5;
  const f1 = ac.createBiquadFilter(); f1.type = "lowpass"; f1.frequency.setValueAtTime(lp, t);
  if (sweep) f1.frequency.exponentialRampToValueAtTime(Math.max(60, lp * sweep), t + dur);
  const f2 = ac.createBiquadFilter(); f2.type = "highpass"; f2.frequency.value = hp;
  const g = ac.createGain(); env(g, t, 0.002, vol, dur);
  s.connect(f1); f1.connect(f2); f2.connect(g); g.connect(sfxBus);
  s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
}

const SFX = {
  swing: () => noise(0.09, 0.18, 2500, 600, 0, 3),
  swingHeavy: () => noise(0.16, 0.25, 1800, 300, 0, 2.5),
  punch: () => { noise(0.08, 0.5, 2200, 80); tone("square", 180, 60, 0.08, 0.25); },
  kick: () => { noise(0.1, 0.5, 1600, 60); tone("square", 140, 45, 0.1, 0.3); },
  slash: () => { noise(0.12, 0.45, 7000, 1500, 0, 0.3); tone("sawtooth", 1400, 300, 0.08, 0.12); },
  heavyslash: () => { noise(0.22, 0.6, 8000, 900, 0, 0.2); tone("sawtooth", 900, 90, 0.2, 0.22); },
  bat: () => { tone("square", 420, 140, 0.07, 0.3); noise(0.07, 0.4, 3000, 200); },
  heavybat: () => { tone("square", 520, 90, 0.16, 0.35); noise(0.18, 0.55, 2600, 80); },
  homerun: () => { tone("square", 700, 120, 0.25, 0.4); noise(0.3, 0.7, 3000, 60); tone("square", 600, 1600, 0.5, 0.15, 0.12); },
  heavy: () => { noise(0.18, 0.7, 1400, 40); tone("square", 110, 35, 0.2, 0.45); },
  gravity: () => { tone("sine", 300, 60, 0.25, 0.35); tone("square", 90, 40, 0.2, 0.15); },
  slam: () => { noise(0.35, 0.8, 900, 30, 0, 0.3); tone("square", 70, 28, 0.35, 0.5); },
  fire: () => { noise(0.18, 0.45, 5000, 800, 0, 0.4); tone("sawtooth", 260, 120, 0.12, 0.12); },
  smoke: () => noise(0.5, 0.35, 1200, 200, 0, 0.5),
  disc: () => { tone("triangle", 900, 1500, 0.12, 0.18); noise(0.1, 0.2, 6000, 2000); },
  block: () => { tone("square", 900, 600, 0.04, 0.2); noise(0.04, 0.25, 6000, 2000); },
  parry: () => { tone("sine", 1850, 1800, 0.35, 0.35); tone("sine", 2770, 2700, 0.28, 0.22); tone("square", 3600, 1200, 0.05, 0.12); noise(0.06, 0.4, 9000, 3000); tone("sine", 220, 60, 0.3, 0.3, 0.02); },
  cast: () => { [0, 0.05, 0.1].forEach((d, i) => tone("square", 440 * (1 + i * 0.5), 440 * (1 + i * 0.5), 0.06, 0.12, d)); },
  ult: () => { [0, 0.06, 0.12, 0.18].forEach((d, i) => tone("square", 330 * Math.pow(1.26, i), 330 * Math.pow(1.26, i) * 1.01, 0.09, 0.16, d)); noise(0.4, 0.25, 3000, 400, 0.1, 0.3); },
  ko: () => { tone("square", 160, 30, 0.9, 0.5); noise(1.0, 0.8, 2000, 30, 0, 0.1); tone("sawtooth", 80, 25, 1.2, 0.3, 0.05); },
  jump: () => tone("square", 220, 440, 0.08, 0.08),
  land: () => noise(0.06, 0.2, 800, 40),
  dash: () => noise(0.12, 0.2, 2000, 300, 0, 0.4),
  stun: () => { [0, 0.08, 0.16].forEach((d) => tone("square", 1200, 900, 0.06, 0.12, d)); },
  counter: () => { tone("square", 660, 1320, 0.1, 0.2); tone("square", 990, 1980, 0.1, 0.15, 0.05); },
  wall: () => { noise(0.2, 0.7, 1200, 40); tone("square", 90, 40, 0.2, 0.4); },
  teleport: () => { tone("sine", 200, 1800, 0.15, 0.2); noise(0.15, 0.2, 5000, 1500); },
  dot: () => tone("square", 300, 200, 0.03, 0.05),
  select: () => tone("square", 880, 880, 0.04, 0.12),
  move: () => tone("square", 520, 520, 0.03, 0.08),
  confirm: () => { tone("square", 660, 660, 0.06, 0.15); tone("square", 990, 990, 0.1, 0.15, 0.06); },
  beep: () => tone("square", 1000, 1000, 0.05, 0.1),
  catch: () => { tone("triangle", 1200, 1800, 0.1, 0.18); },
  implode: () => { tone("sine", 80, 600, 0.3, 0.3); noise(0.3, 0.4, 3000, 100, 0.1); },
};
export function sfx(name) { if (!ac || settings.muted) return; const f = SFX[name]; if (f) try { f(); } catch {} }

// ---------- voice clips (pre-generated Kokoro-82M) ----------
async function loadManifest() {
  try { manifest = await (await fetch("voice/manifest.json")).json(); } catch { manifest = {}; }
  for (const k of ["round1", "fight", "ko", "parry"]) loadClip(k);
}
async function loadClip(key) {
  if (!manifest || !manifest[key]) return null;
  if (clips.has(key)) return clips.get(key);
  const p = fetch("voice/" + manifest[key]).then((r) => r.arrayBuffer()).then((b) => ac.decodeAudioData(b)).catch(() => null);
  clips.set(key, p);
  return p;
}
let lastVoice = 0, voiceSrc = null;
export async function voice(key, { interrupt = true, rate = 1, gain = 1 } = {}) {
  if (!ac || settings.muted || !manifest) return;
  const buf = await loadClip(key);
  if (!buf) return;
  if (interrupt && voiceSrc) { try { voiceSrc.stop(); } catch {} }
  const s = ac.createBufferSource(); s.buffer = buf; s.playbackRate.value = rate;
  const g = ac.createGain(); g.gain.value = gain;
  s.connect(g); g.connect(voiceBus); s.start();
  voiceSrc = s; lastVoice = performance.now();
}
export function preloadVoices(keys) { if (!ac) return; for (const k of keys) loadClip(k); }

// ---------- chiptune loop ----------
let musicTimer = null, step = 0, musicNext = 0, curTrack = null;
const TRACKS = {
  title: { bpm: 120, bass: [45, 0, 45, 0, 48, 0, 50, 0, 45, 0, 45, 0, 52, 0, 50, 48], lead: [69, 0, 72, 0, 76, 0, 74, 72, 69, 0, 67, 0, 69, 0, 0, 0] },
  fight: { bpm: 148, bass: [40, 40, 52, 40, 43, 43, 55, 43, 45, 45, 57, 45, 43, 43, 47, 50], lead: [64, 0, 67, 69, 0, 71, 69, 67, 64, 0, 62, 64, 0, 67, 0, 0, 64, 0, 67, 69, 0, 72, 71, 69, 71, 0, 74, 72, 71, 69, 67, 0] },
};
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
export function music(track) {
  if (!ac) return;
  if (curTrack === track) return;
  curTrack = track; step = 0;
  if (musicTimer) clearInterval(musicTimer);
  if (!track) return;
  musicNext = ac.currentTime + 0.05;
  musicTimer = setInterval(() => {
    const T = TRACKS[curTrack]; if (!T) return;
    const dt = 60 / T.bpm / 4;
    while (musicNext < ac.currentTime + 0.2) {
      const b = T.bass[step % T.bass.length], l = T.lead[step % T.lead.length];
      const t0 = musicNext - ac.currentTime;
      if (b) tone("triangle", mtof(b), mtof(b), dt * 0.9, 0.22, t0, musicBus);
      if (l) tone("square", mtof(l), mtof(l), dt * 0.8, 0.06, t0, musicBus);
      if (curTrack === "fight" && step % 4 === 0) { const t = musicNext; const s = ac.createBufferSource(); s.buffer = noiseBuf; const g = ac.createGain(); env(g, t, 0.001, 0.08, 0.05); const f = ac.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 6000; s.connect(f); f.connect(g); g.connect(musicBus); s.start(t); s.stop(t + 0.06); }
      if (curTrack === "fight" && step % 8 === 4) tone("square", 160, 50, 0.08, 0.12, t0, musicBus);
      musicNext += dt; step++;
    }
  }, 50);
}
