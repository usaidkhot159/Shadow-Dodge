import { ScreenManager }    from './ui/ScreenManager.js';
import { Game }             from './game/Game.js';
import { StorageManager }   from './utils/StorageManager.js';
import { InputManager }     from './game/InputManager.js';
import { AudioManager }     from './audio/AudioManager.js';
import { ParticleSystem }   from './ui/ParticleSystem.js';

// ── Bootstrap ────────────────────────────────────────────────────────────────
const storage   = new StorageManager();
const audio     = new AudioManager();
const screens   = new ScreenManager();
const input     = new InputManager();
const particles = new ParticleSystem();

let game = null;
let selectedDifficulty = 'normal';

// ── Utility ──────────────────────────────────────────────────────────────────
export function formatTime(ms) {
  const s  = Math.floor(ms / 1000);
  const m  = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
}

// ── Title Screen Particles ───────────────────────────────────────────────────
particles.spawnTitleParticles(document.getElementById('particle-field'));

// ── Load stats into title screen ─────────────────────────────────────────────
function refreshTitleStats() {
  const hs = storage.getHighScore();
  document.getElementById('hs-display').textContent           = hs ? formatTime(hs) : '--:--';
  document.getElementById('games-played-display').textContent = storage.getGamesPlayed();
}
refreshTitleStats();

// ── Difficulty selection ──────────────────────────────────────────────────────
document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedDifficulty = btn.dataset.diff;
    audio.play('click');
  });
});

// ── Button wiring ─────────────────────────────────────────────────────────────
document.getElementById('btn-play').addEventListener('click', () => {
  audio.play('click');
  startGame();
});

document.getElementById('btn-how').addEventListener('click', () => {
  audio.play('click');
  screens.show('howto');
});

document.getElementById('btn-back-howto').addEventListener('click', () => {
  audio.play('click');
  screens.show('title');
});

document.getElementById('btn-pause').addEventListener('click', () => {
  if (game) { game.pause(); screens.show('pause'); }
});

document.getElementById('btn-resume').addEventListener('click', () => {
  audio.play('click');
  screens.show('game');
  if (game) game.resume();
});

document.getElementById('btn-restart-pause').addEventListener('click', () => {
  audio.play('click');
  if (game) game.destroy();
  startGame();
});

document.getElementById('btn-menu-pause').addEventListener('click', () => {
  audio.play('click');
  if (game) { game.destroy(); game = null; }
  screens.show('title');
  refreshTitleStats();
});

document.getElementById('btn-restart').addEventListener('click', () => {
  audio.play('click');
  startGame();
});

document.getElementById('btn-menu-go').addEventListener('click', () => {
  audio.play('click');
  screens.show('title');
  refreshTitleStats();
});

// ── Mute button ───────────────────────────────────────────────────────────────
document.getElementById('btn-mute').addEventListener('click', () => {
  const btn   = document.getElementById('btn-mute');
  const muted = audio.toggleMute();
  btn.textContent = muted ? '🔇' : '🔊';
  btn.classList.toggle('muted', muted);
});

// ── Mobile D-pad ──────────────────────────────────────────────────────────────
document.querySelectorAll('.dpad-btn[data-dir]').forEach(btn => {
  const dir = btn.dataset.dir;
  btn.addEventListener('pointerdown', e => { e.preventDefault(); input.setMobileKey(dir, true);  });
  btn.addEventListener('pointerup',   e => { e.preventDefault(); input.setMobileKey(dir, false); });
  btn.addEventListener('pointerleave',e => { e.preventDefault(); input.setMobileKey(dir, false); });
});

// ── Wave Announcement ─────────────────────────────────────────────────────────
function showWaveAnnounce(wave) {
  const el  = document.getElementById('wave-announce');
  const num = document.getElementById('wave-announce-num');
  const sub = document.getElementById('wave-announce-sub');
  num.textContent = wave;
  const msgs = ['', '', 'Shadow speeds up!', 'Getting faster…', 'Danger level: HIGH',
                'Can you survive?', 'EXTREME SPEED!', 'No mercy.', 'Almost impossible…',
                '😱 RUN!', '💀 MAXIMUM'];
  sub.textContent = msgs[Math.min(wave, msgs.length - 1)] || 'Shadow speeds up!';
  el.classList.remove('hidden');
  const inner = el.querySelector('.wave-announce-inner');
  inner.style.animation = 'none';
  inner.offsetHeight; // reflow
  inner.style.animation = '';
  setTimeout(() => el.classList.add('hidden'), 2500);
}
window._showWaveAnnounce = showWaveAnnounce;

// ── Game Lifecycle ────────────────────────────────────────────────────────────
function startGame() {
  if (game) game.destroy();
  screens.show('game');

  const canvas = document.getElementById('game-canvas');
  game = new Game({
    canvas,
    difficulty: selectedDifficulty,
    input,
    audio,
    storage,
    onGameOver: handleGameOver,
  });

  runCountdown(() => game.start());
}

function runCountdown(cb) {
  const overlay = document.getElementById('countdown-overlay');
  const num     = document.getElementById('countdown-num');
  overlay.classList.remove('hidden');
  overlay.classList.add('active');
  let count = 3;
  num.textContent = count;

  const tick = () => {
    audio.play('countdown');
    count--;
    if (count > 0) {
      num.textContent = count;
      num.style.animation = 'none';
      num.offsetHeight;
      num.style.animation = '';
      setTimeout(tick, 1000);
    } else {
      num.textContent = 'GO!';
      num.style.animation = 'none';
      num.offsetHeight;
      num.style.animation = '';
      setTimeout(() => {
        overlay.classList.add('hidden');
        overlay.classList.remove('active');
        cb();
      }, 700);
    }
  };
  setTimeout(tick, 800);
}

function handleGameOver({ time, powerupsCollected, wave }) {
  storage.incrementGamesPlayed();
  const isNew = storage.saveScore(time);

  document.getElementById('go-time').textContent     = formatTime(time);
  document.getElementById('go-best').textContent     = formatTime(storage.getHighScore());
  document.getElementById('go-powerups').textContent = powerupsCollected;
  document.getElementById('go-wave').textContent     = wave;
  document.getElementById('go-record').textContent   = isNew ? '🏆 NEW RECORD!' : '';
  document.getElementById('best-display').textContent = formatTime(storage.getHighScore());

  screens.show('gameover');
  audio.play('gameover');
  particles.spawnGameOverParticles(document.getElementById('go-particles'));
}

// ── Keyboard Shortcuts ────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && screens.current === 'game' && game?.running) {
    game.pause();
    screens.show('pause');
  }
});
