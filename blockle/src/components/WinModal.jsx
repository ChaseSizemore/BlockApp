import { useEffect, useState } from 'react';
import { PENTOMINOES } from '../game/pentominoes.js';
import './WinModal.css';

const EMOJI_BY_COLOR_FAMILY = {
  F: '🟥', // coral red
  L: '🟧', // orange
  Y: '🟨', // yellow
  Z: '🟦', // light blue
  N: '🟦', // dark blue
  I: '🟪', // purple
  P: '🟪', // hot pink
  T: '🟫', // light pink
  S: '🟩', // light green
  J: '🟩', // dark green
  O: '⬜', // off-white
  V: '🟫', // beige
};

function fmt(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function nextMidnightDelta() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next - now;
}

function fmtCountdown(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function WinModal({ day, elapsedMs, stats, puzzle, placements }) {
  const [countdown, setCountdown] = useState(nextMidnightDelta());
  useEffect(() => {
    const id = setInterval(() => setCountdown(nextMidnightDelta()), 1000);
    return () => clearInterval(id);
  }, []);

  // Build emoji grid for the 11x5 board.
  const grid = (() => {
    const ROWS = 5, COLS = 11;
    const g = Array.from({ length: ROWS }, () => Array(COLS).fill('⬜'));
    for (const i of puzzle.hintIndices) {
      const h = puzzle.solution[i];
      for (const [r, c] of h.cells) g[r][c] = EMOJI_BY_COLOR_FAMILY[h.letter] || '⬛';
    }
    for (const id of Object.keys(placements)) {
      const p = placements[id];
      for (const [r, c] of p.cells) g[r][c] = EMOJI_BY_COLOR_FAMILY[p.letter] || '⬛';
    }
    return g.map((row) => row.join('')).join('\n');
  })();

  const shareText = `BLOCKLE #${day} — ${fmt(elapsedMs)}\n${grid}\nblockle.app`;

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ text: shareText });
        return;
      }
      await navigator.clipboard.writeText(shareText);
      alert('Copied to clipboard');
    } catch {
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Copied to clipboard');
      } catch {}
    }
  };

  return (
    <div className="win">
      <div className="win__card">
        <p className="win__kicker">SOLVED</p>
        <h2 className="win__title serif">Nicely done.</h2>
        <p className="win__sub">BLOCKLE #{day}</p>

        <div className="win__stats">
          <div className="win__stat">
            <div className="win__stat-num serif">{fmt(elapsedMs)}</div>
            <div className="win__stat-lbl">TIME</div>
          </div>
          <div className="win__stat">
            <div className="win__stat-num serif">{stats.currentStreak}</div>
            <div className="win__stat-lbl">STREAK</div>
          </div>
          <div className="win__stat">
            <div className="win__stat-num serif">{stats.totalSolved}</div>
            <div className="win__stat-lbl">SOLVED</div>
          </div>
        </div>

        <pre className="win__grid">{grid}</pre>

        <button className="win__share" onClick={share}>
          Share result
        </button>

        <p className="win__countdown">
          Next puzzle in <span className="serif">{fmtCountdown(countdown)}</span>
        </p>
      </div>
    </div>
  );
}
