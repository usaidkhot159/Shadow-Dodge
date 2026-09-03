import { formatTime } from '../main.js';

export class HUD {
  constructor() {
    this._timer     = document.getElementById('timer-display');
    this._best      = document.getElementById('best-display');
    this._diffBadge = document.getElementById('diff-badge');
    this._waveNum   = document.getElementById('wave-num');
    this._activePU  = document.getElementById('active-powerups');
    this._pauseTime = document.getElementById('pause-time');
    this._puItems   = {};
  }

  setDifficulty(diff) {
    this._diffBadge.textContent = diff.toUpperCase();
    const colorMap = {
      easy:    '#22c55e',
      normal:  '#a855f7',
      hard:    '#f97316',
      extreme: '#ef4444',
    };
    const col = colorMap[diff] || '#a855f7';
    this._diffBadge.style.color       = col;
    this._diffBadge.style.borderColor = col + '66';
    this._diffBadge.style.background  = col + '22';
  }

  setBest(ms) {
    this._best.textContent = ms ? formatTime(ms) : '--:--';
  }

  update(elapsed, wave) {
    const t = formatTime(elapsed);
    this._timer.textContent = t;
    if (this._pauseTime) this._pauseTime.textContent = t;
    if (this._waveNum)   this._waveNum.textContent   = wave;
  }

  updateWave(wave) {
    if (this._waveNum) this._waveNum.textContent = wave;
  }

  // ── Power-up tracking ────────────────────────────────────────────────────
  addPowerUp(type, duration) {
    const icons = { speed: '⚡', freeze: '🧊', shield: '🛡️', teleport: '💨' };
    const item  = document.createElement('div');
    item.className = `pu-hud-item ${type}`;
    item.innerHTML = `
      <div class="pu-hud-icon">${icons[type] || '?'}</div>
      <div class="pu-hud-bar"><div class="pu-hud-fill" style="width:100%"></div></div>
    `;
    this._activePU.appendChild(item);
    this._puItems[type] = {
      el:       item,
      fill:     item.querySelector('.pu-hud-fill'),
      start:    Date.now(),
      duration,
    };
  }

  removePowerUp(type) {
    if (this._puItems[type]) {
      this._puItems[type].el.remove();
      delete this._puItems[type];
    }
  }

  tickPowerUps() {
    const now = Date.now();
    Object.entries(this._puItems).forEach(([, data]) => {
      const pct = Math.max(0, 1 - (now - data.start) / data.duration);
      data.fill.style.width = (pct * 100) + '%';
    });
  }
}
