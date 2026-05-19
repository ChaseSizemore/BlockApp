import { useEffect, useState } from 'react';
import './WinPlaySignature.css';
import {
  fmt,
  fmtCountdown,
  nextMidnightDelta,
  buildPlaySignature,
  shareResult,
} from '../lib/winHelpers.js';

// Variant 7: Wordle-equivalent "play signature".
// One emoji per piece placed (in order), color-coded by effort:
//   🟩 clean placement · 🟨 needed rotations · 🟥 multiple retries
// We currently fake the effort data — telemetry would replace it.
export default function WinPlaySignature({ day, elapsedMs, stats, placements }) {
  const [countdown, setCountdown] = useState(nextMidnightDelta());
  useEffect(() => {
    const id = setInterval(() => setCountdown(nextMidnightDelta()), 1000);
    return () => clearInterval(id);
  }, []);

  const numPieces = Object.keys(placements).length || 10;
  const signature = buildPlaySignature(numPieces);
  const shareText = `COBBLE #${day} — ${fmt(elapsedMs)}\n${signature}\n🔥 ${stats.currentStreak} day streak · cobble.game`;

  return (
    <div className="psig">
      <div className="psig__card">
        <p className="psig__kicker">COBBLE #{day}</p>
        <div className="psig__time serif">{fmt(elapsedMs)}</div>

        <div className="psig__signature" aria-label="Play signature">
          {[...signature].map((e, i) => (
            <span key={i} className="psig__pip">{e}</span>
          ))}
        </div>
        <div className="psig__legend">
          <span><span className="psig__sw psig__sw--g" /> clean</span>
          <span><span className="psig__sw psig__sw--y" /> rotated</span>
          <span><span className="psig__sw psig__sw--r" /> retried</span>
        </div>

        <div className="psig__statsRow">
          <span><span className="serif">{stats.currentStreak}</span> streak</span>
          <span className="psig__sep">·</span>
          <span><span className="serif">{stats.totalSolved}</span> solved</span>
        </div>

        <button className="psig__share" onClick={() => shareResult(shareText)}>
          Share signature
        </button>

        <p className="psig__countdown">
          Next puzzle in <span className="serif">{fmtCountdown(countdown)}</span>
        </p>
        <p className="psig__demoNote">
          (Effort data is faked for this prototype — would track real placement attempts.)
        </p>
      </div>
    </div>
  );
}
