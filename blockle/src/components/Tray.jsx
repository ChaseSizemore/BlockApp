import { forwardRef } from 'react';
import Piece from './Piece.jsx';
import { PENTOMINOES, PIECE_ORIENTATIONS, bbox } from '../game/pentominoes.js';
import './Tray.css';

const TRAY_CELL = 14;
const TRAY_GAP = 2;

const Tray = forwardRef(function Tray(
  { pieces, remaining, selectedId, trayOrients, dropActive = false, onPiecePointerDown },
  ref,
) {
  return (
    <div
      ref={ref}
      className={`tray ${dropActive ? 'tray--drop-active' : ''}`}
    >
      <div className="tray__head">
        <span className="tray__title">Your blocks</span>
        <span className="tray__count">{remaining} LEFT</span>
      </div>
      <div className="tray__row">
        {pieces.map((p) => {
          const isSelected = selectedId === p.id;
          const orient = trayOrients?.[p.id] || PIECE_ORIENTATIONS[p.letter][0];
          const { h, w } = bbox(orient);
          const width = w * TRAY_CELL + (w - 1) * TRAY_GAP;
          const height = h * TRAY_CELL + (h - 1) * TRAY_GAP;
          return (
            <div
              key={p.id}
              className={`tray__slot ${isSelected ? 'tray__slot--selected' : ''}`}
              onPointerDown={(e) => {
                onPiecePointerDown?.(e, p.id, 'tray');
              }}
              role="button"
              tabIndex={0}
              aria-label={`${p.letter} pentomino`}
            >
              <div
                className="tray__piece"
                style={{ width, height, position: 'relative' }}
              >
                <Piece
                  cells={orient}
                  color={PENTOMINOES[p.letter].color}
                  cellSize={TRAY_CELL}
                  gap={TRAY_GAP}
                  variant="placed"
                  selected={isSelected}
                  style={{ pointerEvents: 'none' }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default Tray;
export { TRAY_CELL, TRAY_GAP };
