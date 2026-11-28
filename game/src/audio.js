// Every sound in Gobble Dash is synthesised with the Web Audio API — no audio
// files, nothing to load. The board stays silent until the first key or click
// wakes it (browser policy), and every call is a safe no-op before that, so
// headless screenshot runs never hear a thing.

export class SoundBoard {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicTimer = null;
    this.musicStep = 0;
    this.muted = false;
  }

  wake() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.55;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.55;
  }

  tone(freqFrom, freqTo, seconds, type = 'sine', volume = 0.2, when = 0) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), t0 + seconds);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.02);
  }

  noise(seconds, volume = 0.15, when = 0, low = 400, high = 2400) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + when;
    const length = Math.max(1, Math.floor(this.ctx.sampleRate * seconds));
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(high, t0);
    filter.frequency.exponentialRampToValueAtTime(low, t0 + seconds);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t0);
  }

  gobble() {
    // A warbling gobble: a fast tremolo on a falling sawtooth.
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const trem = this.ctx.createOscillator();
    const tremGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, t0);
    osc.frequency.exponentialRampToValueAtTime(190, t0 + 0.34);
    trem.frequency.value = 38;
    tremGain.gain.value = 0.10;
    gain.gain.setValueAtTime(0.16, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.36);
    trem.connect(tremGain).connect(gain.gain);
    osc.connect(gain).connect(this.master);
    osc.start(t0); trem.start(t0);
    osc.stop(t0 + 0.38); trem.stop(t0 + 0.38);
  }

  squawk() { this.tone(700, 1180, 0.13, 'square', 0.10); }
  rally() {
    // The farmer's second wind, announced like a hunting horn: two low
    // blasts and a rising third, so the surge is heard before it is felt.
    this.tone(196, 185, 0.15, 'sawtooth', 0.13);
    this.tone(196, 185, 0.15, 'sawtooth', 0.13, 0.19);
    this.tone(262, 330, 0.24, 'sawtooth', 0.13, 0.38);
  }
  flutter() { this.noise(0.16, 0.10, 0, 900, 2600); }
  whistle() { this.tone(2600, 620, 0.5, 'sine', 0.12); }
  thunk() { this.tone(150, 55, 0.14, 'sine', 0.30); this.noise(0.06, 0.10); }
  pop() { this.tone(520, 940, 0.09, 'triangle', 0.22); }
  goldPop() { [660, 880, 1320].forEach((f, i) => this.tone(f, f, 0.10, 'triangle', 0.16, i * 0.05)); }
  thud() { this.tone(120, 45, 0.22, 'sine', 0.4); this.noise(0.12, 0.2, 0, 300, 900); }
  whoosh() { this.noise(0.2, 0.14, 0, 500, 3000); }
  sting() { [392, 370, 349, 311].forEach((f, i) => this.tone(f, f * 0.97, 0.22, 'triangle', 0.2, i * 0.19)); }
  fanfare() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, f, 0.16, 'triangle', 0.2, i * 0.11)); }

  startMusic() {
    if (!this.ctx || this.musicTimer) return;
    // A two-bar barnyard loop: walking bass plus sparse plucks, very quiet.
    const bass = [110, 0, 131, 0, 98, 0, 110, 0, 110, 0, 131, 0, 165, 147, 131, 0];
    const pluck = [440, 0, 0, 523, 0, 0, 392, 0, 440, 0, 0, 523, 0, 659, 0, 0];
    this.musicTimer = setInterval(() => {
      if (!this.ctx) return;
      const i = this.musicStep % 16;
      if (bass[i]) this.tone(bass[i], bass[i], 0.16, 'triangle', 0.10);
      if (pluck[i]) this.tone(pluck[i], pluck[i] * 0.99, 0.12, 'square', 0.035);
      this.musicStep++;
    }, 138);
  }

  stopMusic() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
  }
}
