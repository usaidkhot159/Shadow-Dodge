export class Player {
  constructor() {
    this.x = 0; this.y = 0;
    this.radius = 12;
    this.speed  = 180;
    this._buffs = {};
    this._trail = [];
    this._teleportFlash = 0;
  }

  init(x, y, speed) {
    this.x = x; this.y = y; this.speed = speed;
    this._buffs = {};
    this._trail = [];
  }

  addBuff(name, duration) { this._buffs[name] = { end: Date.now() + duration }; }
  removeBuff(name) { delete this._buffs[name]; }
  hasBuff(name) {
    if (!this._buffs[name]) return false;
    if (Date.now() > this._buffs[name].end) { delete this._buffs[name]; return false; }
    return true;
  }

  teleportTo(x, y) {
    this.x = x; this.y = y;
    this._teleportFlash = 1;
    this._trail = [];
  }

  update(dt, dir, map, w, h) {
    const len = Math.hypot(dir.x, dir.y);
    if (len > 0) {
      dir.x /= len; dir.y /= len;
    }

    const speed = this.speed * (this.hasBuff('speed') ? 1.5 : 1);
    let nx = this.x + dir.x * speed * dt;
    let ny = this.y + dir.y * speed * dt;

    // Wall bounds
    const r = this.radius;
    nx = Math.max(r, Math.min(w - r, nx));
    ny = Math.max(r, Math.min(h - r, ny));

    // Obstacle collision
    let blocked = false;
    for (const obs of map.obstacles) {
      const res = this._resolveObstacle(nx, ny, r, obs);
      nx = res.x; ny = res.y;
      if (res.blocked) blocked = true;
    }

    // Trail
    if (len > 0) {
      this._trail.push({ x: this.x, y: this.y, t: Date.now() });
      if (this._trail.length > 12) this._trail.shift();
    }

    this.x = nx; this.y = ny;
    if (this._teleportFlash > 0) this._teleportFlash -= dt * 3;
  }

  _resolveObstacle(x, y, r, obs) {
    const closestX = Math.max(obs.x, Math.min(x, obs.x + obs.w));
    const closestY = Math.max(obs.y, Math.min(y, obs.y + obs.h));
    const dx = x - closestX, dy = y - closestY;
    const dist = Math.hypot(dx, dy);
    if (dist < r && dist > 0) {
      const push = (r - dist) / dist;
      return { x: x + dx * push, y: y + dy * push, blocked: true };
    }
    return { x, y, blocked: false };
  }

  draw(ctx, elapsed) {
    const { x, y, radius } = this;
    const now = Date.now();

    // Trail
    this._trail.forEach((pt, i) => {
      const age = (now - pt.t) / 300;
      if (age > 1) return;
      const alpha = (1 - age) * 0.35 * (i / this._trail.length);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius * (1 - age * 0.5), 0, Math.PI * 2);
      if (this.hasBuff('speed')) {
        ctx.fillStyle = `rgba(250,204,21,${alpha})`;
      } else {
        ctx.fillStyle = `rgba(168,85,247,${alpha})`;
      }
      ctx.fill();
    });

    // Teleport flash
    if (this._teleportFlash > 0) {
      ctx.beginPath();
      ctx.arc(x, y, radius * (1 + this._teleportFlash * 3), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(244,114,182,${this._teleportFlash * 0.5})`;
      ctx.fill();
    }

    // Shield ring
    if (this.hasBuff('shield')) {
      const pulse = 0.5 + 0.5 * Math.sin(elapsed * 0.006);
      ctx.beginPath();
      ctx.arc(x, y, radius + 8 + pulse * 3, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(74,222,128,${0.5 + pulse * 0.4})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // Outer glow
      ctx.beginPath();
      ctx.arc(x, y, radius + 14, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(74,222,128,0.15)`;
      ctx.lineWidth = 6;
      ctx.stroke();
    }

    // Speed aura
    if (this.hasBuff('speed')) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(250,204,21,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Outer glow
    const grd = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.5);
    grd.addColorStop(0, 'rgba(192,132,252,0.4)');
    grd.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(x, y, radius * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    // Player body
    const bodyGrd = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    bodyGrd.addColorStop(0, '#e2d9ff');
    bodyGrd.addColorStop(0.5, '#a855f7');
    bodyGrd.addColorStop(1, '#4c1d95');
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrd;
    ctx.fill();

    // Inner shine
    ctx.beginPath();
    ctx.arc(x - radius * 0.25, y - radius * 0.25, radius * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fill();

    // Dot
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }
}
