const CONFIGS = {
  easy: {
    playerSpeed:      200,
    shadowSpeedBase:  55,
    shadowSpeedMax:   130,
    rampTime:         90000,  // ms to reach max speed
    waveInterval:     30000,
  },
  normal: {
    playerSpeed:      190,
    shadowSpeedBase:  80,
    shadowSpeedMax:   200,
    rampTime:         60000,
    waveInterval:     20000,
  },
  hard: {
    playerSpeed:      185,
    shadowSpeedBase:  110,
    shadowSpeedMax:   270,
    rampTime:         45000,
    waveInterval:     15000,
  },
  extreme: {
    playerSpeed:      180,
    shadowSpeedBase:  150,
    shadowSpeedMax:   360,
    rampTime:         30000,
    waveInterval:     10000,
  },
};

export class DifficultyManager {
  constructor(difficulty) {
    this._cfg   = CONFIGS[difficulty] || CONFIGS.normal;
    this._wave  = 1;
    this._waveTimer = 0;
    this.currentShadowSpeed = this._cfg.shadowSpeedBase;
  }

  get playerSpeed()  { return this._cfg.playerSpeed; }
  get shadowSpeed()  { return this._cfg.shadowSpeedBase; }
  get wave()         { return this._wave; }

  update(elapsed) {
    const cfg = this._cfg;

    // Smooth speed ramp
    const progress = Math.min(elapsed / cfg.rampTime, 1);
    // Ease-in curve
    const eased = progress * progress;
    this.currentShadowSpeed = cfg.shadowSpeedBase + (cfg.shadowSpeedMax - cfg.shadowSpeedBase) * eased;

    // Wave progression
    const newWave = 1 + Math.floor(elapsed / cfg.waveInterval);
    this._wave = Math.min(newWave, 10);
  }
}
