import { useEffect, useState } from 'react';
import './WinInline.css';
import {
  fmt,
  fmtCountdown,
  nextMidnightDelta,
  buildEmojiGrid,
  buildShareText,
  shareResult,
} from '../lib/winHelpers.js';

export default function WinInline({ day, elapsedMs, stats, puzzle, placements }) {
  const [countdown, setCountdown] = useState(nextMidnightDelta());
  useEffect(() => {
    const id = setInterval(() => setCountdown(nextMidnightDelta()), 1000);
    return () => clearInterval(id);
  }, []);

  const grid = buildEmojiGrid(puzzle, placements);
  const text = buildShareText(day, elapsedMs, grid);

  return (
    <div className="inlineWin">
      <div className="inlineWin__banner">
        <div className="inlineWin__main">
          <span className="inlineWin__check" aria-hidden="true">✓</span>
          <span className="inlineWin__label">SOLVED IN</span>
          <span className="inlineWin__time serif">{fmt(elapsedMs)}</span>
        </div>
        <button
          className="inlineWin__share"
          onClick={() => shareResult(text)}
          aria-label="Share result"
        >
          <span aria-hidden="true">↗</span> Share
        </button>
      </div>
      <div className="inlineWin__stats">
        <span><span className="serif">{stats.currentStreak}</span> streak</span>
        <span className="inlineWin__dot">·</span>
        <span><span className="serif">{stats.totalSolved}</span> solved</span>
        <span className="inlineWin__dot">·</span>
        <span>next in <span className="serif">{fmtCountdown(countdown)}</span></span>
      </div>
    </div>
  );
}
