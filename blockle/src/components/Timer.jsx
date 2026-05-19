import './Timer.css';

function fmt(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function Timer({ elapsedMs, solved = false, onReopenSummary }) {
  if (solved && onReopenSummary) {
    return (
      <button
        type="button"
        className="tm tm--solved"
        onClick={onReopenSummary}
        aria-label="View win summary"
      >
        <div className="tm__label">SOLVED · TAP TO REOPEN</div>
        <div className="tm__value serif">{fmt(elapsedMs)}</div>
      </button>
    );
  }
  return (
    <div className="tm">
      <div className="tm__label">TIME</div>
      <div className="tm__value serif">{fmt(elapsedMs)}</div>
    </div>
  );
}
