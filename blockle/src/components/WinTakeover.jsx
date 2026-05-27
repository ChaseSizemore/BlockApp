import { useEffect, useState } from 'react';
import './WinTakeover.css';
import SolvedBoardSVG from './SolvedBoardSVG.jsx';
import {
  fmt,
  fmtCountdown,
  nextMidnightDelta,
  buildPacingMosaic,
  buildPacingShareText,
  shareResult,
} from '../lib/winHelpers.js';

export default function WinTakeover({ day, elapsedMs, stats, puzzle, placements, onClose }) {
  const [countdown, setCountdown] = useState(nextMidnightDelta());
  const [shareState, setShareState] = useState(null);
  useEffect(() => {
    const id = setInterval(() => setCountdown(nextMidnightDelta()), 1000);
    return () => clearInterval(id);
  }, []);

  // Per-piece pacing mosaic: one square per piece colored by how long it took
  // to commit, relative to the user's own median pace. Spoiler-free and
  // distinctive enough to be visually identifiable as Cobble.
  const mosaic = buildPacingMosaic(placements);
  const shareText = buildPacingShareText(day, elapsedMs, placements, stats.currentStreak, puzzle.tier);

  const handleShare = async () => {
    const result = await shareResult(shareText);
    setShareState(result);
    setTimeout(() => setShareState(null), 2000);
  };

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

        {puzzle.tier && (
          <p className={`takeover__tier takeover__tier--${puzzle.tier.toLowerCase()}`}>{puzzle.tier.toUpperCase()}</p>
        )}
        <div className="takeover__time serif">{fmt(elapsedMs)}</div>

        <div className="takeover__board">
          <SolvedBoardSVG puzzle={puzzle} placements={placements} cell={16} gap={3} pad={8} />
        </div>

        <p className="takeover__stats">
          {stats.currentStreak > 0 && (
            <>
              <span className="serif">{stats.currentStreak}</span> day streak
              <span className="takeover__dot">·</span>
            </>
          )}
          <span className="serif">{stats.totalSolved}</span> solved
        </p>

        <div className="takeover__mosaic" aria-label="Pacing mosaic">{mosaic}</div>

        <button
          className="takeover__share"
          onClick={handleShare}
          aria-label="Share result"
        >
          {shareState === 'shared' ? 'Shared!' : shareState === 'copied' ? 'Copied to clipboard' : shareState === 'failed' ? 'Try again' : 'Share result'}
        </button>
        <p className="takeover__legend">
          <span className="takeover__legendSq" aria-hidden="true">🟩</span> fast
          <span className="takeover__legendDot">·</span>
          <span className="takeover__legendSq" aria-hidden="true">🟨</span> steady
          <span className="takeover__legendDot">·</span>
          <span className="takeover__legendSq" aria-hidden="true">🟧</span> slow
          <span className="takeover__legendDot">·</span>
          <span className="takeover__legendSq" aria-hidden="true">🟥</span> stuck
        </p>
        <p className="takeover__shareHint">One square per piece you placed, in order — colored by how long it took. If you pick pieces back up to try again, that time counts toward your next placement.</p>

        <p className="takeover__countdown">
          Next puzzle in <span className="serif">{fmtCountdown(countdown)}</span>
        </p>
      </div>
    </div>
  );
}
