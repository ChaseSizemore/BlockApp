import './Controls.css';

export default function Controls({ active, onRotate, onFlip, onCancel }) {
  const dim = !active;
  return (
    <div className="ctrls">
      <button
        className="ctrls__btn ctrls__btn--cancel"
        onClick={onCancel}
        disabled={dim}
        aria-label="Deselect piece"
        title="Deselect"
      >
        <span className="ctrls__icon" aria-hidden="true">↩</span>
      </button>
      <button className="ctrls__btn" onClick={onRotate} disabled={dim}>
        <span className="ctrls__icon" aria-hidden="true">↻</span> ROTATE
      </button>
      <button className="ctrls__btn" onClick={onFlip} disabled={dim}>
        <span className="ctrls__icon" aria-hidden="true">⇄</span> FLIP
      </button>
    </div>
  );
}
