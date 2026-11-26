// Web Audio API Procedural Sound Synthesizer (Zero external audio files)

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.noiseBuffer = null;
    this.volume = 0.7;
    this.muted = false;
  }

  unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
      this.masterGain.connect(this.ctx.destination);
      this.noiseBuffer = this._createNoiseBuffer();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.muted ? 0 : this.volume,
        this.ctx.currentTime,
        0.02
      );
    }
  }

  setMuted(isMuted) {
    this.muted = Boolean(isMuted);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.muted ? 0 : this.volume,
        this.ctx.currentTime,
        0.02
      );
    }
  }

  _ready() {
    if (this.muted) return false;
    this.unlock();
    return Boolean(this.ctx && this.masterGain);
  }

  _createNoiseBuffer() {
    const length = this.ctx.sampleRate * 1.5;
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  _playNoise({ duration = 0.15, filterType = "bandpass", freq = 900, freqEnd = 300, q = 1.2, gain = 0.35 }) {
    if (!this._ready() || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(freq, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), now + duration);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);

    src.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    src.start(now);
    src.stop(now + duration + 0.02);
  }

  _playTone({ type = "sine", freq = 220, freqEnd = 110, duration = 0.15, gain = 0.3, delay = 0 }) {
    if (!this._ready()) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playUISelect() {
    this._playTone({ type: "triangle", freq: 520, freqEnd: 660, duration: 0.06, gain: 0.14 });
  }

  playUIConfirm() {
    this._playTone({ type: "square", freq: 440, freqEnd: 880, duration: 0.09, gain: 0.14 });
    this._playTone({ type: "triangle", freq: 660, freqEnd: 990, duration: 0.12, gain: 0.16, delay: 0.05 });
  }

  playWhiff(weight = "light") {
    const pitch = weight === "heavy" ? 550 : 950;
    const dur = weight === "heavy" ? 0.14 : 0.08;
    this._playNoise({ duration: dur, filterType: "bandpass", freq: pitch, freqEnd: 220, q: 1.8, gain: 0.18 });
  }

  playHit(weight = "light") {
    const jitter = 0.9 + Math.random() * 0.22;
    if (weight === "block") {
      this._playTone({ type: "triangle", freq: 340 * jitter, freqEnd: 120, duration: 0.08, gain: 0.24 });
      this._playNoise({ duration: 0.07, filterType: "highpass", freq: 1400, freqEnd: 700, gain: 0.2 });
      return;
    }
    if (weight === "launcher") {
      this._playTone({ type: "sawtooth", freq: 190 * jitter, freqEnd: 520, duration: 0.18, gain: 0.34 });
      this._playTone({ type: "sine", freq: 130, freqEnd: 42, duration: 0.2, gain: 0.45 });
      this._playNoise({ duration: 0.14, filterType: "lowpass", freq: 1600, freqEnd: 280, gain: 0.35 });
      return;
    }
    if (weight === "heavy") {
      this._playTone({ type: "sine", freq: 140 * jitter, freqEnd: 38, duration: 0.2, gain: 0.48 });
      this._playTone({ type: "square", freq: 210 * jitter, freqEnd: 65, duration: 0.11, gain: 0.22 });
      this._playNoise({ duration: 0.13, filterType: "lowpass", freq: 1800, freqEnd: 260, gain: 0.38 });
      return;
    }
    // Light
    this._playTone({ type: "sine", freq: 185 * jitter, freqEnd: 58, duration: 0.11, gain: 0.34 });
    this._playNoise({ duration: 0.08, filterType: "bandpass", freq: 1400 * jitter, freqEnd: 450, gain: 0.24 });
  }

  playDash() {
    this._playNoise({ duration: 0.11, filterType: "bandpass", freq: 1100, freqEnd: 340, q: 2.0, gain: 0.2 });
  }

  playTeleport() {
    this._playTone({ type: "sine", freq: 880, freqEnd: 190, duration: 0.14, gain: 0.25 });
    this._playTone({ type: "triangle", freq: 240, freqEnd: 1050, duration: 0.12, gain: 0.2, delay: 0.08 });
    this._playNoise({ duration: 0.16, filterType: "highpass", freq: 1800, freqEnd: 500, gain: 0.22 });
  }

  playDapKick() {
    this._playNoise({ duration: 0.24, filterType: "bandpass", freq: 950, freqEnd: 180, q: 1.2, gain: 0.3 });
    this._playTone({ type: "sawtooth", freq: 160, freqEnd: 42, duration: 0.28, gain: 0.42 });
  }

  playChairHit(isSilenceHit = false) {
    // Metallic clang harmonics
    this._playTone({ type: "square", freq: 740, freqEnd: 310, duration: 0.16, gain: 0.25 });
    this._playTone({ type: "sawtooth", freq: 1120, freqEnd: 480, duration: 0.14, gain: 0.2 });
    this._playNoise({ duration: 0.14, filterType: "bandpass", freq: 2400, freqEnd: 800, q: 3.0, gain: 0.32 });

    if (isSilenceHit) {
      // Resonant silence chime
      this._playTone({ type: "sine", freq: 1320, freqEnd: 660, duration: 0.45, gain: 0.24, delay: 0.05 });
      this._playTone({ type: "sine", freq: 990, freqEnd: 495, duration: 0.5, gain: 0.2, delay: 0.12 });
    }
  }

  playVeinCut() {
    // Sharp digital/blade slice
    this._playTone({ type: "sawtooth", freq: 1450, freqEnd: 290, duration: 0.13, gain: 0.25 });
    this._playNoise({ duration: 0.12, filterType: "highpass", freq: 2800, freqEnd: 950, gain: 0.28 });
  }

  playBleedTick() {
    this._playTone({ type: "sine", freq: 620, freqEnd: 280, duration: 0.06, gain: 0.14 });
  }

  playBellySlam() {
    // Heavy sub-bass ground slam + low bounce
    this._playTone({ type: "sine", freq: 110, freqEnd: 28, duration: 0.38, gain: 0.58 });
    this._playTone({ type: "triangle", freq: 160, freqEnd: 45, duration: 0.26, gain: 0.35 });
    this._playNoise({ duration: 0.24, filterType: "lowpass", freq: 650, freqEnd: 90, gain: 0.45 });
  }

  playBadJoke() {
    // Comical descending low-brass "wah-wah-wah" trombone groan
    this._playTone({ type: "sawtooth", freq: 233, freqEnd: 215, duration: 0.18, gain: 0.18, delay: 0 });
    this._playTone({ type: "sawtooth", freq: 220, freqEnd: 204, duration: 0.18, gain: 0.18, delay: 0.19 });
    this._playTone({ type: "sawtooth", freq: 196, freqEnd: 142, duration: 0.38, gain: 0.2, delay: 0.38 });
  }

  playBoulderRoll() {
    this._playTone({ type: "triangle", freq: 95, freqEnd: 62, duration: 0.22, gain: 0.3 });
    this._playNoise({ duration: 0.22, filterType: "lowpass", freq: 420, freqEnd: 160, gain: 0.28 });
  }

  playPoisonTick() {
    // Bubbly acid hiss
    this._playTone({ type: "sine", freq: 380, freqEnd: 640, duration: 0.08, gain: 0.12 });
    this._playNoise({ duration: 0.1, filterType: "bandpass", freq: 2600, freqEnd: 1500, q: 2.5, gain: 0.12 });
  }

  playWallBounce() {
    this._playTone({ type: "sine", freq: 130, freqEnd: 42, duration: 0.24, gain: 0.45 });
    this._playNoise({ duration: 0.16, filterType: "lowpass", freq: 900, freqEnd: 140, gain: 0.35 });
  }

  playAnnouncer(type) {
    if (type === "round") {
      this._playTone({ type: "triangle", freq: 330, freqEnd: 330, duration: 0.16, gain: 0.22 });
      this._playTone({ type: "triangle", freq: 440, freqEnd: 440, duration: 0.22, gain: 0.24, delay: 0.15 });
    } else if (type === "fight") {
      // Arena bell + hype chord
      this._playTone({ type: "sine", freq: 880, freqEnd: 870, duration: 0.45, gain: 0.3 });
      this._playTone({ type: "sawtooth", freq: 440, freqEnd: 660, duration: 0.25, gain: 0.22 });
    } else if (type === "ko") {
      // Massive KO crash
      this._playTone({ type: "sine", freq: 150, freqEnd: 30, duration: 0.55, gain: 0.6 });
      this._playTone({ type: "sawtooth", freq: 240, freqEnd: 48, duration: 0.42, gain: 0.32 });
      this._playNoise({ duration: 0.45, filterType: "lowpass", freq: 2400, freqEnd: 120, gain: 0.5 });
    } else if (type === "win") {
      this._playTone({ type: "triangle", freq: 440, freqEnd: 440, duration: 0.14, gain: 0.22, delay: 0 });
      this._playTone({ type: "triangle", freq: 554, freqEnd: 554, duration: 0.14, gain: 0.22, delay: 0.13 });
      this._playTone({ type: "triangle", freq: 659, freqEnd: 659, duration: 0.32, gain: 0.28, delay: 0.26 });
    }
  }
}

export const sound = new SoundEngine();
