export class ScreenManager {
  constructor() {
    this.current = 'title';
    this._screens = {
      title:    document.getElementById('screen-title'),
      howto:    document.getElementById('screen-howto'),
      game:     document.getElementById('screen-game'),
      pause:    document.getElementById('screen-pause'),
      gameover: document.getElementById('screen-gameover'),
    };
  }

  show(name) {
    // Hide all
    Object.entries(this._screens).forEach(([key, el]) => {
      const isOverlay = el.classList.contains('overlay-screen');
      if (key === name) {
        el.classList.add('active');
      } else if (!isOverlay || name !== 'pause') {
        // Don't hide game screen when showing pause (it's an overlay)
        if (!(key === 'game' && name === 'pause')) {
          el.classList.remove('active');
        }
      }
    });

    // Special handling
    if (name === 'pause') {
      this._screens.pause.classList.add('active');
    } else if (name === 'game') {
      this._screens.pause.classList.remove('active');
    } else {
      this._screens.pause.classList.remove('active');
      this._screens.game.classList.remove('active');
    }

    this.current = name;
  }
}
