import { useEffect, useState } from 'react';
import './WinBottomSheet.css';
import {
  fmt,
  fmtCountdown,
  nextMidnightDelta,
  buildEmojiGrid,
  buildShareText,
  shareResult,
} from '../lib/winHelpers.js';

export default function WinBottomSheet({ day, elapsedMs, stats, puzzle, placements }) {
  const [countdown, setCountdown] = useState(nextMidnightDelta());
  useEffect(() => {
    const id = setInterval(() => setCountdown(nextMidnightDelta()), 1000);
    return () => clearInterval(id);
  }, []);

  const grid = buildEmojiGrid(puzzle, placements);
  const text = buildShareText(day, elapsedMs, grid);

  return (
    <div className="sheet-scrim">
      <div className="sheet">
        <div className="sheet__handle" aria-hidden="true" />
        <div className="sheet__header">
          <div className="sheet__title">
            <span className="sheet__kicker">SOLVED</span>
            <span className="sheet__time serif">{fmt(elapsedMs)}</span>
          </div>
          <div className="sheet__streak">
            <span aria-hidden="true">🔥</span> {stats.currentStreak} day streak
          </div>
        </div>

        <pre className="sheet__grid">{grid}</pre>

        <div className="sheet__statsRow">
          <span><span className="serif">{stats.totalSolved}</span> solved</span>
          <span className="sheet__sep">·</span>
          <span>max streak <span className="serif">{stats.maxStreak}</span></span>
        </div>

        <button className="sheet__share" onClick={() => shareResult(text)}>
          Share result
        </button>

        <p className="sheet__countdown">
          Next puzzle in <span className="serif">{fmtCountdown(countdown)}</span>
        </p>
      </div>
    </div>
  );
}
