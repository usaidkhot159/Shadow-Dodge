const TYPES = ['speed', 'freeze', 'shield', 'teleport'];

const TYPE_CONFIG = {
  speed:    { color: '#facc15', glow: 'rgba(250,204,21,0.6)',   icon: '⚡', label: 'SPEED' },
  freeze:   { color: '#38bdf8', glow: 'rgba(56,189,248,0.6)',   icon: '🧊', label: 'FREEZE' },
  shield:   { color: '#4ade80', glow: 'rgba(74,222,128,0.6)',   icon: '🛡', label: 'SHIELD' },
  teleport: { color: '#f472b6', glow: 'rgba(244,114,182,0.6)', icon: '💨', label: 'WARP' },
};

class PowerUp {
  constructor(x, y, type) {
    this.x = x; this.y = y;
    this.type   = type;
    this.radius = 14;
    this.alive  = true;
    this._born  = Date.now();
    this._angle = Math.random() * Math.PI * 2;
  }

  draw(ctx, elapsed) {
    if (!this.alive) return;
    const { x, y, radius, type } = this;
    const cfg = TYPE_CONFIG[type];
    const t = elapsed * 0.001;
    const float = Math.sin(t * 2 + this._angle) * 4;
    const pulse  = 0.85 + 0.15 * Math.sin(t * 3 + this._angle);
    const fy = y + float;

    // Outer ring pulse
    ctx.beginPath();
    ctx.arc(x, fy, radius * 1.8 * pulse, 0, Math.PI * 2);
    ctx.strokeStyle = cfg.glow.replace('0.6', String(0.15 * pulse));
    ctx.lineWidth = 2;
    ctx.stroke();

    // Mid ring
    ctx.beginPath();
    ctx.arc(x, fy, radius * 1.3, 0, Math.PI * 2);
    ctx.strokeStyle = cfg.glow.replace('0.6', '0.3');
    ctx.lineWidth = 1;
    ctx.stroke();

    // Glow halo
    const grd = ctx.createRadialGradient(x, fy, 0, x, fy, radius * 2.2);
    grd.addColorStop(0, cfg.glow.replace('0.6', '0.3'));
    grd.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(x, fy, radius * 2.2, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    // Body
    const bodyGrd = ctx.createRadialGradient(x - 3, fy - 3, 0, x, fy, radius);
    bodyGrd.addColorStop(0, '#ffffff');
    bodyGrd.addColorStop(0.3, cfg.color);
    bodyGrd.addColorStop(1, cfg.glow.replace('0.6', '0.9'));
    ctx.beginPath();
    ctx.arc(x, fy, radius, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrd;
    ctx.fill();

    // Icon text
    ctx.save();
    ctx.font = `bold ${radius}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cfg.icon, x, fy + 1);
    ctx.restore();

    // Label
    ctx.save();
    ctx.font = `bold 8px 'Space Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = cfg.color;
    ctx.globalAlpha = 0.8;
    ctx.fillText(cfg.label, x, fy + radius + 4);
    ctx.restore();
  }
}

export class PowerUpManager {
  constructor() {
    this._items = [];
    this._spawnInterval = 8000; // ms
    this._lastSpawn = 0;
    this._map = null;
    this._w = 0; this._h = 0;
  }

  init(map, w, h) {
    this._map = map;
    this._w = w; this._h = h;
    this._items = [];
    this._lastSpawn = Date.now();
    // Spawn 2 initial power-ups
    this._spawn(); this._spawn();
  }

  _spawn() {
    const type = TYPES[Math.floor(Math.random() * TYPES.length)];
    const pos  = this._safePos();
    if (pos) this._items.push(new PowerUp(pos.x, pos.y, type));
  }

  _safePos() {
    const w = this._w, h = this._h, margin = 60, hud = 70;
    for (let i = 0; i < 40; i++) {
      const x = margin + Math.random() * (w - margin * 2);
      const y = hud + margin + Math.random() * (h - hud - margin * 2);
      const inObs = this._map.obstacles.some(o =>
        x > o.x - 20 && x < o.x + o.w + 20 && y > o.y - 20 && y < o.y + o.h + 20
      );
      if (!inObs) return { x, y };
    }
    return { x: w / 2, y: h / 2 };
  }

  update(dt, elapsed) {
    const now = Date.now();
    if (now - this._lastSpawn > this._spawnInterval) {
      this._lastSpawn = now;
      // Keep max 4 power-ups on field
      const alive = this._items.filter(p => p.alive).length;
      if (alive < 4) this._spawn();
    }
    // Remove dead ones periodically
    if (this._items.length > 12) {
      this._items = this._items.filter(p => p.alive);
    }
  }

  checkCollection(player, w, h, map) {
    const collected = [];
    this._items.forEach(pu => {
      if (!pu.alive) return;
      const floatY = pu.y + Math.sin(Date.now() * 0.002 + pu._angle) * 4;
      const dist = Math.hypot(player.x - pu.x, player.y - floatY);
      if (dist < player.radius + pu.radius) {
        pu.alive = false;
        collected.push(pu);
      }
    });
    return collected;
  }

  draw(ctx, elapsed) {
    this._items.forEach(pu => pu.draw(ctx, elapsed));
  }
}
