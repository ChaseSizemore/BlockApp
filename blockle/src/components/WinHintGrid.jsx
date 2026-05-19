import { useEffect, useState } from 'react';
import './WinModal.css';
import {
  fmt,
  fmtCountdown,
  nextMidnightDelta,
  buildHintOnlyGrid,
  shareResult,
} from '../lib/winHelpers.js';

// Variant 5: same shell as Classic (variant 1), but the emoji grid only reveals
// the hint cells (which are already public to anyone who plays the same day).
// Non-spoilery. This is the share artifact I'd actually ship.
export default function WinHintGrid({ day, elapsedMs, stats, puzzle }) {
  const [countdown, setCountdown] = useState(nextMidnightDelta());
  useEffect(() => {
    const id = setInterval(() => setCountdown(nextMidnightDelta()), 1000);
    return () => clearInterval(id);
  }, []);

  const grid = buildHintOnlyGrid(puzzle);
  const shareText = `COBBLE #${day} — ${fmt(elapsedMs)}\n${grid}\n🔥 ${stats.currentStreak} day streak · cobble.game`;

  return (
    <div className="win">
      <div className="win__card">
        <p className="win__kicker">SOLVED</p>
        <h2 className="win__title serif">Nicely done.</h2>
        <p className="win__sub">COBBLE #{day}</p>

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
        <p style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: -4, marginBottom: 8 }}>
          Only the hints are shown — your friends won't be spoiled.
        </p>

        <button className="win__share" onClick={() => shareResult(shareText)}>
          Share result
        </button>

        <p className="win__countdown">
          Next puzzle in <span className="serif">{fmtCountdown(countdown)}</span>
        </p>
      </div>
    </div>
  );
}
