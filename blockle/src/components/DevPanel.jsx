import { useState } from 'react';
import './DevPanel.css';

const VARIANT_LABELS = [
  'Classic',
  'Takeover',
  'Bottom Sheet',
  'Inline',
  'Hint Grid',
  'Score Only',
  'Play Signature',
];

export default function DevPanel({
  variant,
  onVariantChange,
  onAutoSolve,
  onReset,
  onRegenerate,
  onRestoreDaily,
  solved,
  completionCount,
  completionCapped,
  completionElapsedMs,
  completionComputing,
  difficulty,
  puzzleIsOverride,
  puzzleSeed,
}) {
  const [open, setOpen] = useState(true);
  if (!open) {
    return (
      <button className="dev-panel dev-panel--mini" onClick={() => setOpen(true)} title="Dev panel">
        ⚙
      </button>
    );
  }

  const solutionsLabel = completionComputing
    ? '…'
    : completionCount == null
      ? '—'
      : completionCapped
        ? `${completionCount}+`
        : `${completionCount}`;

  return (
    <div className="dev-panel">
      <div className="dev-panel__head">
        <span>DEV</span>
        <button className="dev-panel__close" onClick={() => setOpen(false)} aria-label="Hide dev panel">×</button>
      </div>

      <div className="dev-panel__stats">
        <div className="dev-panel__stat">
          <div className={`dev-panel__statValue dev-panel__tier dev-panel__tier--${(difficulty?.tier || 'unknown').toLowerCase()}`}>
            {difficulty?.computing ? '…' : difficulty?.tier || '—'}
          </div>
          <div className="dev-panel__statLabel">
            {difficulty?.computing
              ? 'scoring…'
              : difficulty?.tier
                ? `b=${difficulty.branches} · c=${difficulty.completions}${difficulty.completionsCapped ? '+' : ''} · ${difficulty.geometry}`
                : 'difficulty'}
          </div>
        </div>
        <div className="dev-panel__stat">
          <div className="dev-panel__statValue">{puzzleIsOverride ? 'override' : 'daily'}</div>
          <div className="dev-panel__statLabel">
            {puzzleIsOverride ? `seed ${puzzleSeed}` : 'today'}
          </div>
        </div>
      </div>

      <div className="dev-panel__row">
        <button className="dev-panel__btn" onClick={onAutoSolve} disabled={solved}>
          Auto-solve
        </button>
        <button className="dev-panel__btn" onClick={onReset}>
          Reset board
        </button>
      </div>
      <div className="dev-panel__row">
        <button className="dev-panel__btn dev-panel__btn--primary" onClick={onRegenerate}>
          Generate new
        </button>
        <button
          className="dev-panel__btn"
          onClick={onRestoreDaily}
          disabled={!puzzleIsOverride}
        >
          Back to daily
        </button>
      </div>

      <div className="dev-panel__variantRow">
        <span className="dev-panel__lbl">Win variant</span>
        <div className="dev-panel__variants">
          {VARIANT_LABELS.map((label, i) => (
            <button
              key={i}
              className={`dev-panel__variant ${variant === i + 1 ? 'is-active' : ''}`}
              onClick={() => onVariantChange(i + 1)}
              title={label}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <span className="dev-panel__variantLabel">{VARIANT_LABELS[variant - 1]}</span>
      </div>
    </div>
  );
}
