import Piece from './Piece.jsx';
import { PENTOMINOES } from '../game/pentominoes.js';

const CELL = 26;
const GAP = 3;

export default function DragOverlay({ drag }) {
  if (!drag) return null;
  return (
    <div
      style={{
        position: 'fixed',
        left: drag.x - drag.grabDX,
        top: drag.y - drag.grabDY,
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      <Piece
        cells={drag.orient}
        color={PENTOMINOES[drag.letter].color}
        cellSize={drag.cellSize ?? CELL}
        gap={drag.gap ?? GAP}
        variant="floating"
      />
    </div>
  );
}

export { CELL as DRAG_CELL, GAP as DRAG_GAP };
