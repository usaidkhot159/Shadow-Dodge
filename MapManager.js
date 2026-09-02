export class MapManager {
  constructor() {
    this.obstacles = [];
  }

  generate(w, h) {
    this.obstacles = [];
    const hud = 60; // HUD height
    const margin = 40;
    const configs = this._getConfig(w, h, hud, margin);
    this.obstacles = configs;
  }

  _getConfig(w, h, hud, m) {
    const obs = [];
    const ow  = w - m * 2;
    const oh  = h - hud - m;

    // Pattern: 4-8 pillars/walls strategically placed
    const templates = [
      // Center cross
      { x: w/2 - 8, y: hud + oh * 0.3, w: 16, h: oh * 0.15 },
      { x: w/2 - 8, y: hud + oh * 0.55, w: 16, h: oh * 0.15 },
      // Left pillar
      { x: m + ow * 0.15, y: hud + oh * 0.2, w: 14, h: oh * 0.25 },
      // Right pillar
      { x: m + ow * 0.75, y: hud + oh * 0.55, w: 14, h: oh * 0.25 },
      // Top-left block
      { x: m + ow * 0.3, y: hud + oh * 0.1, w: oh * 0.1, h: 14 },
      // Bottom-right block
      { x: m + ow * 0.55, y: hud + oh * 0.75, w: oh * 0.1, h: 14 },
      // Diagonal pair
      { x: m + ow * 0.6, y: hud + oh * 0.2, w: 14, h: oh * 0.12 },
      { x: m + ow * 0.2, y: hud + oh * 0.65, w: 14, h: oh * 0.12 },
    ];

    templates.forEach(t => {
      obs.push({
        x: t.x,
        y: t.y,
        w: t.w,
        h: t.h,
      });
    });
    return obs;
  }

  draw(ctx, w, h) {
    this.obstacles.forEach(obs => {
      // Shadow/depth
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(obs.x + 3, obs.y + 3, obs.w, obs.h);

      // Obstacle body
      const grd = ctx.createLinearGradient(obs.x, obs.y, obs.x + obs.w, obs.y + obs.h);
      grd.addColorStop(0, '#1e1b33');
      grd.addColorStop(1, '#110e24');
      ctx.fillStyle = grd;
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

      // Border
      ctx.strokeStyle = 'rgba(124,58,237,0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

      // Top-left corner accent
      ctx.strokeStyle = 'rgba(168,85,247,0.5)';
      ctx.lineWidth = 1.5;
      const accent = Math.min(8, obs.w * 0.3, obs.h * 0.3);
      ctx.beginPath();
      ctx.moveTo(obs.x, obs.y + accent);
      ctx.lineTo(obs.x, obs.y);
      ctx.lineTo(obs.x + accent, obs.y);
      ctx.stroke();

      // Bottom-right corner accent
      ctx.beginPath();
      ctx.moveTo(obs.x + obs.w - accent, obs.y + obs.h);
      ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
      ctx.lineTo(obs.x + obs.w, obs.y + obs.h - accent);
      ctx.stroke();
    });
  }
}
