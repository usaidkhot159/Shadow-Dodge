export class Shadow {
  constructor() {
    this.x = 0; this.y = 0;
    this.radius = 16;
    this.speed  = 80;
    this._buffs = {};
    this._trail = [];
    this._tentacles = [];
    this._wobble = 0;
    this.extras = null; // extra shadow instances
  }

  init(x, y, speed) {
    this.x = x; this.y = y; this.speed = speed;
    this._buffs = {};
    this._trail = [];
    this._initTentacles();
  }

  _initTentacles() {
    this._tentacles = [];
    const count = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      this._tentacles.push({
        angle: (Math.PI * 2 * i) / count + Math.random() * 0.5,
        length: 20 + Math.random() * 18,
        speed:  0.8 + Math.random() * 1.2,
        phase:  Math.random() * Math.PI * 2,
      });
    }
  }

  addBuff(name, duration) { this._buffs[name] = { end: Date.now() + duration }; }
  removeBuff(name)        { delete this._buffs[name]; }
  hasBuff(name) {
    if (!this._buffs[name]) return false;
    if (Date.now() > this._buffs[name].end) { delete this._buffs[name]; return false; }
    return true;
  }

  update(dt, player, map, w, h) {
    this._wobble += dt * 2.5;

    // Chase player with slight steering
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return;

    const nx = dx / dist;
    const ny = dy / dist;

    let moveX = nx * this.speed * dt;
    let moveY = ny * this.speed * dt;

    // Try to navigate around obstacles
    let tx = this.x + moveX;
    let ty = this.y + moveY;

    // Check obstacle collision
    const r = this.radius;
    for (const obs of map.obstacles) {
      const res = this._resolveObstacle(tx, ty, r, obs);
      tx = res.x; ty = res.y;
    }

    // Wall bounds
    tx = Math.max(r, Math.min(w - r, tx));
    ty = Math.max(r, Math.min(h - r, ty));

    // Trail
    this._trail.push({ x: this.x, y: this.y, t: Date.now() });
    if (this._trail.length > 20) this._trail.shift();

    this.x = tx; this.y = ty;
  }

  _resolveObstacle(x, y, r, obs) {
    const closestX = Math.max(obs.x, Math.min(x, obs.x + obs.w));
    const closestY = Math.max(obs.y, Math.min(y, obs.y + obs.h));
    const dx = x - closestX, dy = y - closestY;
    const dist = Math.hypot(dx, dy);
    if (dist < r && dist > 0) {
      const push = (r - dist) / dist;
      return { x: x + dx * push, y: y + dy * push };
    }
    return { x, y };
  }

  draw(ctx, elapsed) {
    const { x, y, radius } = this;
    const now = Date.now();
    const frozen = this.hasBuff('freeze');
    const t = elapsed * 0.001;

    // Shadow trail
    this._trail.forEach((pt, i) => {
      const age = (now - pt.t) / 400;
      if (age > 1) return;
      const alpha = (1 - age) * 0.25 * (i / this._trail.length);
      const r2 = radius * (1 - age * 0.5);
      const grd = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r2 * 2);
      grd.addColorStop(0, `rgba(0,0,0,${alpha * 2})`);
      grd.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r2 * 2, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    });

    // Tentacles / wisps
    this._tentacles.forEach((tent, i) => {
      if (frozen) return;
      const wobble = Math.sin(t * tent.speed * 3 + tent.phase) * 0.4;
      const angle = tent.angle + this._wobble * 0.3 + wobble;
      const len = tent.length * (0.8 + 0.2 * Math.sin(t * tent.speed + tent.phase));

      const ex = x + Math.cos(angle) * len;
      const ey = y + Math.sin(angle) * len;

      ctx.beginPath();
      ctx.moveTo(x, y);
      const cpx = x + Math.cos(angle + 0.5) * len * 0.6;
      const cpy = y + Math.sin(angle + 0.5) * len * 0.6;
      ctx.quadraticCurveTo(cpx, cpy, ex, ey);
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.lineWidth = 3 - i * 0.1;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Tip glow
      ctx.beginPath();
      ctx.arc(ex, ey, 2, 0, Math.PI * 2);
      ctx.fillStyle = frozen ? 'rgba(56,189,248,0.6)' : 'rgba(80,20,140,0.8)';
      ctx.fill();
    });

    // Outer shadow aura
    const auraGrd = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
    if (frozen) {
      auraGrd.addColorStop(0, 'rgba(56,189,248,0.3)');
      auraGrd.addColorStop(0.5, 'rgba(56,189,248,0.08)');
    } else {
      auraGrd.addColorStop(0, 'rgba(15,0,30,0.6)');
      auraGrd.addColorStop(0.5, 'rgba(40,0,80,0.2)');
    }
    auraGrd.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
    ctx.fillStyle = auraGrd;
    ctx.fill();

    // Core body — wobbly shape
    ctx.save();
    ctx.translate(x, y);
    if (!frozen) ctx.rotate(Math.sin(t * 1.5) * 0.15);

    const pulse = frozen ? 1 : (1 + 0.06 * Math.sin(t * 3));
    ctx.beginPath();
    const bodyGrd = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * pulse);
    if (frozen) {
      bodyGrd.addColorStop(0, '#bae6fd');
      bodyGrd.addColorStop(0.4, '#38bdf8');
      bodyGrd.addColorStop(1, '#0c4a6e');
    } else {
      bodyGrd.addColorStop(0, '#1a0035');
      bodyGrd.addColorStop(0.3, '#0a0020');
      bodyGrd.addColorStop(1, '#000005');
    }

    // Organic shape
    const pts = 12;
    for (let i = 0; i <= pts; i++) {
      const angle = (i / pts) * Math.PI * 2;
      const r2 = radius * pulse * (1 + 0.15 * Math.sin(angle * 3 + t * 2));
      const px = Math.cos(angle) * r2;
      const py = Math.sin(angle) * r2;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = bodyGrd;
    ctx.fill();

    // Eyes
    if (!frozen) {
      const eyeGap = radius * 0.3;
      const eyeY   = -radius * 0.1;
      [- eyeGap, eyeGap].forEach(ex2 => {
        // Eye glow
        const eyeGrd = ctx.createRadialGradient(ex2, eyeY, 0, ex2, eyeY, 5);
        eyeGrd.addColorStop(0, '#ff0066');
        eyeGrd.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(ex2, eyeY, 7, 0, Math.PI * 2);
        ctx.fillStyle = eyeGrd;
        ctx.fill();

        // Pupil
        ctx.beginPath();
        ctx.arc(ex2, eyeY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0044';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(ex2 - 1, eyeY - 1, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,200,200,0.8)';
        ctx.fill();
      });
    } else {
      // Frozen X eyes
      [-5, 5].forEach(ex2 => {
        ctx.strokeStyle = 'rgba(56,189,248,0.9)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(ex2-3, -5); ctx.lineTo(ex2+3, 1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ex2+3, -5); ctx.lineTo(ex2-3, 1); ctx.stroke();
      });
    }

    ctx.restore();

    // Freeze crystal overlay
    if (frozen) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56,189,248,0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}
