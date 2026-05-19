import { useEffect, useState } from 'react';
import './WinScoreOnly.css';
import {
  fmt,
  fmtCountdown,
  nextMidnightDelta,
  shareResult,
} from '../lib/winHelpers.js';

// Variant 6: pure score share. No grid at all. The "Wordle-clean" minimal.
export default function WinScoreOnly({ day, elapsedMs, stats }) {
  const [countdown, setCountdown] = useState(nextMidnightDelta());
  useEffect(() => {
    const id = setInterval(() => setCountdown(nextMidnightDelta()), 1000);
    return () => clearInterval(id);
  }, []);

  const shareText = `COBBLE #${day} — ${fmt(elapsedMs)}\n🔥 ${stats.currentStreak} day streak · cobble.game`;

  return (
    <div className="scoreOnly">
      <div className="scoreOnly__card">
        <p className="scoreOnly__kicker">COBBLE #{day}</p>
        <div className="scoreOnly__time serif">{fmt(elapsedMs)}</div>
        <p className="scoreOnly__streak">
          <span aria-hidden="true">🔥</span> {stats.currentStreak} day streak
        </p>
        <button className="scoreOnly__share" onClick={() => shareResult(shareText)}>
          Share result
        </button>
        <p className="scoreOnly__countdown">
          Next puzzle in <span className="serif">{fmtCountdown(countdown)}</span>
        </p>
      </div>
    </div>
  );
}
