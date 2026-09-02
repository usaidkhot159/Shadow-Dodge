export class InputManager {
  constructor() {
    this._keys    = new Set();
    this._mobile  = { up: false, down: false, left: false, right: false };
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp   = this._onKeyUp.bind(this);
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup',   this._onKeyUp);
  }

  _onKeyDown(e) {
    this._keys.add(e.code);
    // Prevent arrow keys from scrolling
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
      e.preventDefault();
    }
  }

  _onKeyUp(e) {
    this._keys.delete(e.code);
  }

  setMobileKey(dir, active) {
    this._mobile[dir] = active;
  }

  get up()    { return this._keys.has('ArrowUp')    || this._keys.has('KeyW') || this._mobile.up; }
  get down()  { return this._keys.has('ArrowDown')  || this._keys.has('KeyS') || this._mobile.down; }
  get left()  { return this._keys.has('ArrowLeft')  || this._keys.has('KeyA') || this._mobile.left; }
  get right() { return this._keys.has('ArrowRight') || this._keys.has('KeyD') || this._mobile.right; }

  destroy() {
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup',   this._onKeyUp);
  }
}
