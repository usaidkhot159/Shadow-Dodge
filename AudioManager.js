export class AudioManager {
  constructor() {
    this._ctx = null;
    this._ambient = null;
    this._ambientGain = null;
    this._muted = false;
    this._init();
  }

  _init() {
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio not supported');
    }
  }

  _ensure() {
    if (!this._ctx) return false;
    if (this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
    return true;
  }

  play(name) {
    if (!this._ensure() || this._muted) return;
    const ctx = this._ctx;

    switch (name) {
      case 'click':      this._tone(880, 0.05, 'sine', 0.08);    break;
      case 'countdown':  this._tone(660, 0.15, 'sine', 0.12);    break;
      case 'powerup':    this._powerupSound();                     break;
      case 'teleport':   this._teleportSound();                    break;
      case 'hit':        this._hitSound();                         break;
      case 'gameover':   this._gameoverSound();                    break;
      default: break;
    }
  }

  _tone(freq, dur, type = 'sine', gain = 0.1) {
    const ctx = this._ctx;
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + dur);
  }

  _powerupSound() {
    const ctx = this._ctx;
    const freqs = [440, 554, 659, 880];
    freqs.forEach((f, i) => {
      setTimeout(() => this._tone(f, 0.1, 'sine', 0.08), i * 60);
    });
  }

  _teleportSound() {
    const ctx = this._ctx;
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.25);
    g.gain.setValueAtTime(0.12, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
  }

  _hitSound() {
    const ctx = this._ctx;
    const bufSize = ctx.sampleRate * 0.3;
    const buf     = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data    = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    }
    const src = ctx.createBufferSource();
    const g   = ctx.createGain();
    src.buffer = buf;
    g.gain.setValueAtTime(0.4, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    src.connect(g); g.connect(ctx.destination);
    src.start();

    // Low rumble underneath
    this._tone(60, 0.4, 'sawtooth', 0.15);
  }

  _gameoverSound() {
    [220, 185, 150, 110].forEach((f, i) => {
      setTimeout(() => this._tone(f, 0.4, 'sawtooth', 0.12), i * 200);
    });
  }

  startAmbient() {
    if (!this._ensure() || this._muted || this._ambient) return;
    const ctx = this._ctx;

    // Low drone
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.value = 55;
    osc2.type = 'sine';
    osc2.frequency.value = 57.5; // slight detune for beating

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(); osc2.start();
    this._ambient = [osc1, osc2];
    this._ambientGain = gain;
  }

  stopAmbient() {
    if (!this._ctx || !this._ambient) return;
    const ctx = this._ctx;
    if (this._ambientGain) {
      this._ambientGain.gain.setValueAtTime(this._ambientGain.gain.value, ctx.currentTime);
      this._ambientGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    }
    setTimeout(() => {
      if (this._ambient) {
        this._ambient.forEach(o => { try { o.stop(); } catch {} });
        this._ambient = null;
      }
    }, 600);
  }

  toggleMute() {
    this._muted = !this._muted;
    if (this._muted) this.stopAmbient();
    return this._muted;
  }
}
