import { useEffect, useState } from 'react';
import './WinTakeover.css';
import SolvedBoardSVG from './SolvedBoardSVG.jsx';
import {
  fmt,
  fmtCountdown,
  nextMidnightDelta,
  buildTimeMosaic,
  shareResult,
} from '../lib/winHelpers.js';

export default function WinTakeover({ day, elapsedMs, stats, puzzle, placements, onClose }) {
  const [countdown, setCountdown] = useState(nextMidnightDelta());
  useEffect(() => {
    const id = setInterval(() => setCountdown(nextMidnightDelta()), 1000);
    return () => clearInterval(id);
  }, []);

  // Share text uses the time-mosaic encoding — one color, no palette collision,
  // non-spoilery, scales naturally with solve time.
  const mosaic = buildTimeMosaic(elapsedMs);
  const shareText = `COBBLE #${day} — ${fmt(elapsedMs)}\n${mosaic}\n🔥 ${stats.currentStreak} day streak · cobble.game`;

  return (
    <div className="takeover">
      {onClose && (
        <button
          className="takeover__close"
          onClick={onClose}
          aria-label="Close summary"
          title="Close"
        >
          ×
        </button>
      )}
      <div className="takeover__inner">
        <div className="takeover__top">
          <p className="takeover__kicker">COBBLE #{day}</p>
          <p className="takeover__sub">SOLVED</p>
        </div>

        <div className="takeover__time serif">{fmt(elapsedMs)}</div>

        <div className="takeover__board">
          <SolvedBoardSVG puzzle={puzzle} placements={placements} cell={16} gap={3} pad={8} />
        </div>

        <p className="takeover__stats">
          <span className="serif">{stats.currentStreak}</span> day streak
          <span className="takeover__dot">·</span>
          <span className="serif">{stats.totalSolved}</span> solved
        </p>

        <button className="takeover__share" onClick={() => shareResult(shareText)}>
          Share result
        </button>

        <p className="takeover__countdown">
          Next puzzle in <span className="serif">{fmtCountdown(countdown)}</span>
        </p>
      </div>
    </div>
  );
}
