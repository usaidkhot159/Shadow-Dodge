export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
  }

  clear(w, h) {
    const ctx = this.ctx;
    // Deep space background gradient
    const bg = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h) * 0.7);
    bg.addColorStop(0, '#0f0f1e');
    bg.addColorStop(1, '#050508');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Subtle grid
    ctx.strokeStyle = 'rgba(124,58,237,0.04)';
    ctx.lineWidth = 0.5;
    const gridSize = 48;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Arena border
    ctx.strokeStyle = 'rgba(124,58,237,0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, w - 4, h - 4);

    // Inner glow border
    ctx.strokeStyle = 'rgba(168,85,247,0.06)';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, w - 16, h - 16);
  }

  drawVignette(w, h) {
    const ctx = this.ctx;
    const vg = ctx.createRadialGradient(w/2, h/2, Math.min(w, h)*0.3, w/2, h/2, Math.max(w, h)*0.7);
    vg.addColorStop(0, 'transparent');
    vg.addColorStop(1, 'rgba(5,5,8,0.7)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }

  drawDeathFlash(w, h) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(239,68,68,0.35)';
    ctx.fillRect(0, 0, w, h);
  }
}
