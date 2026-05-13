import Piece from './Piece.jsx';
import { PENTOMINOES } from '../game/pentominoes.js';
import './FloatingLayer.css';

const FALLBACK_CELL = 26;
const FALLBACK_GAP = 3;

export default function FloatingLayer({ pieces, selectedId, cellSize, gap, onPiecePointerDown }) {
  const cs = cellSize || FALLBACK_CELL;
  const gp = gap ?? FALLBACK_GAP;
  return (
    <div className="floating-layer">
      {pieces.map((p) => (
        <div
          key={p.id}
          className={`floating-piece ${selectedId === p.id ? 'floating-piece--selected' : ''}`}
          style={{
            position: 'fixed',
            left: p.x,
            top: p.y,
            zIndex: 50,
            cursor: 'grab',
            touchAction: 'none',
          }}
          onPointerDown={(e) => onPiecePointerDown?.(e, p.id, 'floating')}
        >
          <Piece
            cells={p.orient}
            color={PENTOMINOES[p.letter].color}
            cellSize={cs}
            gap={gp}
            variant="floating"
            selected={selectedId === p.id}
          />
        </div>
      ))}
    </div>
  );
}

export { FALLBACK_CELL as FLOATING_CELL, FALLBACK_GAP as FLOATING_GAP };
