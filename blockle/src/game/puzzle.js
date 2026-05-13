import { PIECE_LETTERS, findOrientationIndex } from './pentominoes.js';
import { mulberry32, shuffled, dayNumber } from './rng.js';
import { solve, emptyBoard, ROWS, COLS } from './solver.js';

const HINT_COUNT = 2;

// Generate the puzzle for a given day number. Returns:
// {
//   day,
//   solution: [{ letter, cells, orientationIndex, anchor }, ...],
//   hintIndices: [i, j],
// }
// All 12 pieces are used each day (mixed-size, totaling 55 = 11*5 cells).
export function generatePuzzleForDay(day) {
  const rand = mulberry32(0x9e3779b9 ^ (day * 2654435761));

  let placements = null;
  for (let attempt = 0; attempt < 80; attempt++) {
    const pieces = shuffled(PIECE_LETTERS, rand);
    const board = emptyBoard();
    const result = solve(board, pieces);
    if (result && result.length === PIECE_LETTERS.length) {
      placements = result;
      break;
    }
  }
  if (!placements) {
    placements = solve(emptyBoard(), PIECE_LETTERS.slice()) || [];
  }

  const solution = placements.map((p) => {
    const minR = Math.min(...p.cells.map((c) => c[0]));
    const minC = Math.min(...p.cells.map((c) => c[1]));
    const norm = p.cells.map(([r, c]) => [r - minR, c - minC]);
    return {
      letter: p.letter,
      cells: p.cells.slice(),
      orientationIndex: findOrientationIndex(p.letter, norm),
      anchor: [minR, minC],
    };
  });

  // Pick HINT_COUNT random distinct hint indices.
  const indices = Array.from({ length: solution.length }, (_, i) => i);
  const shuffledIdx = shuffled(indices, rand);
  const hintIndices = shuffledIdx.slice(0, HINT_COUNT).sort((a, b) => a - b);

  return { day, solution, hintIndices };
}

export function todayLabel(date = new Date()) {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function getTodaysDay() {
  return dayNumber();
}

export { ROWS, COLS };
