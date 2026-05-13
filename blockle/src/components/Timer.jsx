import './Timer.css';

function fmt(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function Timer({ elapsedMs }) {
  return (
    <div className="tm">
      <div className="tm__label">TIME</div>
      <div className="tm__value serif">{fmt(elapsedMs)}</div>
    </div>
  );
}
