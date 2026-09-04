const KEY_HIGHSCORE   = 'shadowdodge_hs';
const KEY_GAMES       = 'shadowdodge_games';
const KEY_SCORES      = 'shadowdodge_scores'; // top 10

export class StorageManager {
  getHighScore() {
    const val = localStorage.getItem(KEY_HIGHSCORE);
    return val ? Number(val) : 0;
  }

  saveScore(ms) {
    const prev = this.getHighScore();
    const isNew = ms > prev;
    if (isNew) {
      localStorage.setItem(KEY_HIGHSCORE, String(ms));
    }

    // Save to leaderboard
    const scores = this.getScores();
    scores.push({ time: ms, date: new Date().toISOString() });
    scores.sort((a, b) => b.time - a.time);
    const top10 = scores.slice(0, 10);
    localStorage.setItem(KEY_SCORES, JSON.stringify(top10));

    return isNew;
  }

  getScores() {
    try {
      return JSON.parse(localStorage.getItem(KEY_SCORES) || '[]');
    } catch {
      return [];
    }
  }

  getGamesPlayed() {
    return Number(localStorage.getItem(KEY_GAMES) || 0);
  }

  incrementGamesPlayed() {
    const n = this.getGamesPlayed() + 1;
    localStorage.setItem(KEY_GAMES, String(n));
    return n;
  }

  clearAll() {
    localStorage.removeItem(KEY_HIGHSCORE);
    localStorage.removeItem(KEY_GAMES);
    localStorage.removeItem(KEY_SCORES);
  }
}
