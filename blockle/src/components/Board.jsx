import { useLayoutEffect, useRef, useState } from 'react';
import Piece from './Piece.jsx';
import { PENTOMINOES } from '../game/pentominoes.js';
import './Board.css';

const GAP = 6;
const PAD = 12;

export default function Board({
  rows,
  cols,
  hints = [],
  placedPieces,
  selectedId,
  onPiecePointerDown,
  onReady,
}) {
  const ref = useRef(null);
  const [cellSize, setCellSize] = useState(0);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;
    const measure = () => {
      const pw = parent.clientWidth;
      const ph = parent.clientHeight;
      if (!pw || !ph) return;
      const csW = (pw - PAD * 2 - (cols - 1) * GAP) / cols;
      const csH = (ph - PAD * 2 - (rows - 1) * GAP) / rows;
      const cs = Math.max(0, Math.floor(Math.min(csW, csH)));
      setCellSize(cs);
      onReadyRef.current?.(cs, el);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [cols, rows]);

  const step = cellSize + GAP;
  const boardW = cellSize ? cols * step - GAP + PAD * 2 : '100%';
  const boardH = cellSize ? rows * step - GAP + PAD * 2 : '100%';

  return (
    <div
      ref={ref}
      className="board"
      style={{
        gridTemplateColumns: cellSize ? `repeat(${cols}, ${cellSize}px)` : `repeat(${cols}, 1fr)`,
        gridTemplateRows: cellSize ? `repeat(${rows}, ${cellSize}px)` : `repeat(${rows}, 1fr)`,
        gap: `${GAP}px`,
        width: boardW,
        height: boardH,
        padding: `${PAD}px`,
      }}
    >
      {Array.from({ length: rows * cols }).map((_, i) => (
        <div key={i} className="board__cell" />
      ))}

      <div
        className="board__overlay"
        style={{
          position: 'absolute',
          left: PAD,
          top: PAD,
          width: cellSize ? cols * step - GAP : `calc(100% - ${PAD * 2}px)`,
          height: cellSize ? rows * step - GAP : `calc(100% - ${PAD * 2}px)`,
          pointerEvents: 'none',
        }}
      >
        {hints.map((h, i) => (
          <Piece
            key={`hint-${i}`}
            cells={h.cells}
            color={PENTOMINOES[h.letter].color}
            cellSize={cellSize}
            gap={GAP}
            variant="hint"
          />
        ))}
        {placedPieces.map((p) => (
          <Piece
            key={p.id}
            cells={p.cells}
            color={PENTOMINOES[p.letter].color}
            cellSize={cellSize}
            gap={GAP}
            variant="placed"
            selected={selectedId === p.id}
            style={{ cursor: 'grab' }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onPiecePointerDown?.(e, p.id, 'placed');
            }}
          />
        ))}
      </div>
    </div>
  );
}

export { GAP, PAD };
