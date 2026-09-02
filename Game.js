import { Renderer }          from './Renderer.js';
import { Player }            from './Player.js';
import { Shadow }            from './Shadow.js';
import { MapManager }        from './MapManager.js';
import { PowerUpManager }    from './PowerUpManager.js';
import { DifficultyManager } from './DifficultyManager.js';
import { HUD }               from '../ui/HUD.js';
import { CollisionDetector } from '../utils/CollisionDetector.js';

export class Game {
  constructor({ canvas, difficulty, input, audio, storage, onGameOver }) {
    this.canvas     = canvas;
    this.difficulty = difficulty;
    this.input      = input;
    this.audio      = audio;
    this.storage    = storage;
    this.onGameOver = onGameOver;

    this.running  = false;
    this.paused   = false;
    this._raf     = null;
    this._startTime         = 0;
    this._elapsed           = 0;
    this._lastTick          = 0;
    this._powerupsCollected = 0;
    this._wave              = 1;

    this._resize = this._resize.bind(this);
    window.addEventListener('resize', this._resize);
    this._resize();

    // Sub-systems
    this.renderer  = new Renderer(canvas);
    this.map       = new MapManager();
    this.player    = new Player();
    this.shadow    = new Shadow();
    this.powerUps  = new PowerUpManager();
    this.diffMgr   = new DifficultyManager(difficulty);
    this.hud       = new HUD();
    this.collision = new CollisionDetector();

    this.hud.setDifficulty(difficulty);
    this.hud.setBest(storage.getHighScore());
  }

  _resize() {
    const el = document.getElementById('screen-game');
    const r  = el.getBoundingClientRect();
    this.canvas.width  = r.width  || window.innerWidth;
    this.canvas.height = r.height || window.innerHeight;
  }

  start() {
    const { canvas } = this;
    const w = canvas.width;
    const h = canvas.height;

    this.map.generate(w, h);
    this.player.init(w / 2, h / 2, this.diffMgr.playerSpeed);

    const corners = [
      { x: 60, y: 70 }, { x: w - 60, y: 70 },
      { x: 60, y: h - 60 }, { x: w - 60, y: h - 60 },
    ];
    const corner = corners[Math.floor(Math.random() * corners.length)];
    this.shadow.init(corner.x, corner.y, this.diffMgr.shadowSpeed);
    this.powerUps.init(this.map, w, h);

    this.running    = true;
    this.paused     = false;
    this._startTime = performance.now();
    this._lastTick  = this._startTime;

    this.audio.startAmbient();
    this._raf = requestAnimationFrame(this._tick.bind(this));
  }

  pause() {
    this.paused  = true;
    this.running = false;
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    this.audio.stopAmbient();
  }

  resume() {
    this.paused    = false;
    this.running   = true;
    this._lastTick = performance.now();
    this.audio.startAmbient();
    this._raf = requestAnimationFrame(this._tick.bind(this));
  }

  _tick(now) {
    if (!this.running) return;
    const dt       = Math.min((now - this._lastTick) / 1000, 0.05);
    this._lastTick = now;
    this._elapsed  = now - this._startTime;

    this._update(dt);
    this._draw();
    this.hud.update(this._elapsed, this._wave);
    this.hud.tickPowerUps();

    this._raf = requestAnimationFrame(this._tick.bind(this));
  }

  _update(dt) {
    const { canvas, map, player, shadow, powerUps, diffMgr, collision } = this;
    const w = canvas.width, h = canvas.height;

    // Escalate difficulty
    diffMgr.update(this._elapsed);
    shadow.speed = diffMgr.currentShadowSpeed;
    player.speed = diffMgr.playerSpeed;

    // Wave tracking
    const wave = diffMgr.wave;
    if (wave !== this._wave) {
      this._wave = wave;
      this._onNewWave();
    }

    // Player movement
    const dir = { x: 0, y: 0 };
    if (this.input.up)    dir.y -= 1;
    if (this.input.down)  dir.y += 1;
    if (this.input.left)  dir.x -= 1;
    if (this.input.right) dir.x += 1;
    player.update(dt, dir, map, w, h);

    // Shadow movement
    if (!shadow.hasBuff('freeze')) {
      shadow.update(dt, player, map, w, h);
    }
    if (shadow.extras) {
      shadow.extras.forEach(s => {
        if (!s.hasBuff('freeze')) s.update(dt, player, map, w, h);
      });
    }

    // Power-up collection
    const collected = powerUps.checkCollection(player, w, h, map);
    collected.forEach(pu => {
      this._powerupsCollected++;
      this._applyPowerUp(pu.type);
      this.audio.play('powerup');
      this._showToast(pu.type);
    });
    powerUps.update(dt, this._elapsed);

    // Collision: player ↔ shadow
    if (!player.hasBuff('shield')) {
      const hit = collision.circleCircle(player, shadow)
        || (shadow.extras?.some(s => collision.circleCircle(player, s)));
      if (hit) { this._gameOver(); return; }
    }

    // Shadow vs obstacles
    map.obstacles.forEach(obs => {
      collision.pushOutRect(shadow, obs);
      shadow.extras?.forEach(s => collision.pushOutRect(s, obs));
    });
  }

  _draw() {
    const { renderer, map, player, shadow, powerUps } = this;
    const w = this.canvas.width, h = this.canvas.height;
    renderer.clear(w, h);
    map.draw(renderer.ctx, w, h);
    powerUps.draw(renderer.ctx, this._elapsed);
    shadow.draw(renderer.ctx, this._elapsed);
    shadow.extras?.forEach(s => s.draw(renderer.ctx, this._elapsed));
    player.draw(renderer.ctx, this._elapsed);
    renderer.drawVignette(w, h);
  }

  _applyPowerUp(type) {
    const { player, shadow, hud } = this;
    const durations = { speed: 4000, freeze: 3000, shield: 5000, teleport: 0 };
    const dur = durations[type];

    if (type === 'speed') {
      player.addBuff('speed', dur);
      hud.addPowerUp('speed', dur);
      setTimeout(() => { player.removeBuff('speed'); hud.removePowerUp('speed'); }, dur);

    } else if (type === 'freeze') {
      shadow.addBuff('freeze', dur);
      shadow.extras?.forEach(s => s.addBuff('freeze', dur));
      hud.addPowerUp('freeze', dur);
      setTimeout(() => {
        shadow.removeBuff('freeze');
        shadow.extras?.forEach(s => s.removeBuff('freeze'));
        hud.removePowerUp('freeze');
      }, dur);

    } else if (type === 'shield') {
      player.addBuff('shield', dur);
      hud.addPowerUp('shield', dur);
      setTimeout(() => { player.removeBuff('shield'); hud.removePowerUp('shield'); }, dur);

    } else if (type === 'teleport') {
      const w = this.canvas.width, h = this.canvas.height;
      const pos = this._findSafeSpot(w, h);
      player.teleportTo(pos.x, pos.y);
      this.audio.play('teleport');
    }
  }

  _findSafeSpot(w, h) {
    const margin = 60;
    for (let i = 0; i < 30; i++) {
      const x = margin + Math.random() * (w - margin * 2);
      const y = margin + Math.random() * (h - margin * 2);
      const farEnough = Math.hypot(x - this.shadow.x, y - this.shadow.y) > 120;
      const clear     = !this.map.obstacles.some(o =>
        x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h
      );
      if (farEnough && clear) return { x, y };
    }
    return { x: w / 2, y: h / 2 };
  }

  _onNewWave() {
    this.hud.updateWave(this._wave);
    if (this._wave > 1) {
      const el = document.getElementById('screen-game');
      el.classList.add('shake');
      setTimeout(() => el.classList.remove('shake'), 500);
      if (window._showWaveAnnounce) window._showWaveAnnounce(this._wave);
    }
    // Extreme mode: spawn extra shadow at wave 3
    if (this.difficulty === 'extreme' && this._wave === 3 && !this.shadow.extras) {
      const w = this.canvas.width, h = this.canvas.height;
      const s = new Shadow();
      s.init(Math.random() * w, Math.random() * h, this.diffMgr.currentShadowSpeed * 0.8);
      this.shadow.extras = [s];
    }
  }

  _showToast(type) {
    const labels = {
      speed:    '⚡ Speed Boost!',
      freeze:   '🧊 Shadow Frozen!',
      shield:   '🛡️ Shield Active!',
      teleport: '💨 Teleported!',
    };
    const toast = document.createElement('div');
    toast.className = `powerup-pickup-toast ${type}`;
    toast.textContent = labels[type] || 'Power-Up!';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2100);
  }

  _gameOver() {
    this.running = false;
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    this.audio.stopAmbient();
    this.renderer.drawDeathFlash(this.canvas.width, this.canvas.height);
    setTimeout(() => {
      this.onGameOver({
        time:               this._elapsed,
        powerupsCollected:  this._powerupsCollected,
        wave:               this._wave,
      });
    }, 600);
  }

  destroy() {
    this.running = false;
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    window.removeEventListener('resize', this._resize);
    this.audio.stopAmbient();
  }
}
