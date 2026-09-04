export class ParticleSystem {
  spawnTitleParticles(container) {
    if (!container) return;
    container.innerHTML = '';
    const count = 60;
    for (let i = 0; i < count; i++) {
      this._createParticle(container, 'title');
    }
  }

  spawnGameOverParticles(container) {
    if (!container) return;
    container.innerHTML = '';
    const count = 40;
    for (let i = 0; i < count; i++) {
      this._createParticle(container, 'gameover');
    }
  }

  _createParticle(container, type) {
    const el = document.createElement('div');
    const size = Math.random() * 3 + 1;
    const x = Math.random() * 100;
    const delay = Math.random() * 8;
    const duration = Math.random() * 10 + 8;
    const driftX = (Math.random() - 0.5) * 200;

    let color;
    if (type === 'gameover') {
      const colors = ['rgba(239,68,68,0.7)', 'rgba(168,85,247,0.5)', 'rgba(248,113,113,0.4)'];
      color = colors[Math.floor(Math.random() * colors.length)];
    } else {
      const colors = ['rgba(168,85,247,0.6)', 'rgba(192,132,252,0.4)', 'rgba(124,58,237,0.5)', 'rgba(240,238,255,0.3)'];
      color = colors[Math.floor(Math.random() * colors.length)];
    }

    el.style.cssText = `
      position: absolute;
      left: ${x}%;
      bottom: -10px;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: 50%;
      --drift-x: ${driftX}px;
      animation: particleDrift ${duration}s ease-in ${delay}s infinite;
      box-shadow: 0 0 ${size * 2}px ${color};
    `;
    container.appendChild(el);
  }
}
