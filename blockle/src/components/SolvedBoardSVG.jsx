import { PENTOMINOES } from '../game/pentominoes.js';

function darken(hex, factor = 0.7) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * factor)},${Math.round(g * factor)},${Math.round(b * factor)})`;
}

// Compact inline SVG of the solved board with the real piece colors.
// Used in the win modal so we get all 12 distinct colors instead of being
// constrained by the 9-emoji palette of a text share.
export default function SolvedBoardSVG({ puzzle, placements, cell = 14, gap = 2, pad = 6 }) {
  const ROWS = 5;
  const COLS = 11;
  const step = cell + gap;
  const width = COLS * cell + (COLS - 1) * gap + 2 * pad;
  const height = ROWS * cell + (ROWS - 1) * gap + 2 * pad;

  // Assemble all pieces (hints + placements), each tagged with its cells + color.
  const pieces = [];
  for (const i of puzzle.hintIndices) {
    const s = puzzle.solution[i];
    pieces.push({ letter: s.letter, cells: s.cells, isHint: true });
  }
  for (const id of Object.keys(placements)) {
    const p = placements[id];
    pieces.push({ letter: p.letter, cells: p.cells, isHint: false });
  }

  // Render each cell of each piece as a rounded rect. Same-piece adjacency is
  // implicit (matching color); a thin stroke gives the 2px darker outline look
  // at small scale without needing to compute per-cell border sides.
  const cellRects = [];
  let key = 0;
  for (const piece of pieces) {
    const color = PENTOMINOES[piece.letter].color;
    const dark = darken(color, 0.7);
    for (const [r, c] of piece.cells) {
      cellRects.push(
        <rect
          key={key++}
          x={pad + c * step}
          y={pad + r * step}
          width={cell}
          height={cell}
          rx={2}
          ry={2}
          fill={color}
          stroke={dark}
          strokeWidth={1}
          opacity={piece.isHint ? 0.92 : 1}
        />,
      );
    }
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Solved Cobble board"
      style={{ display: 'block' }}
    >
      <rect x={0} y={0} width={width} height={height} fill="var(--cream-deep)" rx={6} />
      {cellRects}
    </svg>
  );
}
