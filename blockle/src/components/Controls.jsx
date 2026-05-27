import { useState, useEffect, useRef } from 'react';
import './Controls.css';

export default function Controls({ active, onRotate, onFlip, onReset, canReset }) {
  const dim = !active;
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Two-tap confirm: first tap arms the button (visual changes + "Tap again"
  // label), second tap within 2.5s actually resets. Times out silently
  // otherwise — protects against accidental clears without a modal.
  const handleReset = (e) => {
    e?.stopPropagation?.();
    if (confirming) {
      clearTimeout(timerRef.current);
      setConfirming(false);
      onReset?.();
    } else {
      setConfirming(true);
      timerRef.current = setTimeout(() => setConfirming(false), 2500);
    }
  };

  return (
    <div className="ctrls">
      <div className="ctrls__main">
        <button className="ctrls__btn" onClick={onRotate} disabled={dim}>
          <span className="ctrls__icon" aria-hidden="true">↻</span> ROTATE
        </button>
        <button className="ctrls__btn" onClick={onFlip} disabled={dim}>
          <span className="ctrls__icon" aria-hidden="true">⇄</span> FLIP
        </button>
      </div>
      <button
        className={`ctrls__btn ctrls__btn--reset${confirming ? ' ctrls__btn--confirm' : ''}`}
        onClick={handleReset}
        disabled={!canReset}
      >
        {confirming ? 'TAP AGAIN TO CLEAR' : 'RESET BOARD'}
      </button>
    </div>
  );
}
