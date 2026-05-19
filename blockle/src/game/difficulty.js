import { ROWS, COLS, emptyBoard, countCompletions, solveWithBranchCount } from './solver.js';
import { PIECE_LETTERS } from './pentominoes.js';

// Pieces with single-orientation or very constrained placement options.
// Their presence in the tray makes the puzzle objectively harder.
const HARD_PIECES = new Set(['T', 'F', 'V', 'N']);

// Score a puzzle (post-hint state) into a difficulty tier.
//
// Inputs (all derived from the current hints/pieces):
//   - branches: solver's search-node count for the FIRST solution (more = harder)
//   - completions: how many valid completions exist (more = easier; capped at 200)
//   - hintCoverage: total cells the 2 hints occupy (more = easier; fewer remaining cells)
//   - hardPieces: count of hard pieces (T/F/V/N) in the tray
//   - geometry: where the hints sit ('center' / 'edge' / 'corner') — center harder
//
// Weights tuned by intuition; revise once we have real player times.
export function scoreDifficulty(puzzle) {
  const board = emptyBoard();
  for (const i of puzzle.hintIndices) {
    const h = puzzle.solution[i];
    for (const [r, c] of h.cells) board[r][c] = h.letter;
  }
  const remainingPieces = puzzle.solution
    .map((s, i) => ({ letter: s.letter, idx: i }))
    .filter((s) => !puzzle.hintIndices.includes(s.idx))
    .map((s) => s.letter);

  // Snapshot the post-hint board for branch counting (mutated then restored by solver).
  // Budgets are conservative: even pathological searches won't stall.
  const branchBoard = board.map((row) => row.slice());
  const { branches } = solveWithBranchCount(branchBoard, remainingPieces, 300);

  const compBoard = board.map((row) => row.slice());
  const { count: completions, capped } = countCompletions(compBoard, remainingPieces, 200, 300);

  // Hint geometry
  const hintCells = puzzle.hintIndices.flatMap((i) => puzzle.solution[i].cells);
  const hintCoverage = hintCells.length;
  const geometry = classifyGeometry(hintCells);

  // Hard piece count
  const hardPieces = remainingPieces.filter((L) => HARD_PIECES.has(L)).length;

  // Combine. log() compresses big numbers so a 50k-branches puzzle isn't
  // 50x harder than a 1k-branches puzzle in score-space.
  const raw =
    1.6 * Math.log10(branches + 1)
    - 0.9 * Math.log10(completions + 1)
    + 0.25 * hardPieces
    + 0.18 * (10 - hintCoverage)
    + (geometry === 'center' ? 0.4 : geometry === 'edge' ? 0.1 : 0);

  let tier;
  if (raw < 1.6) tier = 'Easy';
  else if (raw < 2.6) tier = 'Medium';
  else if (raw < 3.5) tier = 'Hard';
  else tier = 'Expert';

  return {
    tier,
    raw: Math.round(raw * 100) / 100,
    branches,
    completions,
    completionsCapped: capped,
    hintCoverage,
    hardPieces,
    geometry,
  };
}

// Classify hint placement geometry.
// 'center' = both hints touch row 2 (middle), 'corner' = both touch a corner cell,
// otherwise 'edge'.
function classifyGeometry(cells) {
  const mid = Math.floor(ROWS / 2);
  const corners = new Set([`0,0`, `0,${COLS - 1}`, `${ROWS - 1},0`, `${ROWS - 1},${COLS - 1}`]);
  let touchesMid = false;
  let touchesCorner = false;
  for (const [r, c] of cells) {
    if (r === mid) touchesMid = true;
    if (corners.has(`${r},${c}`)) touchesCorner = true;
  }
  if (touchesCorner && !touchesMid) return 'corner';
  if (touchesMid) return 'center';
  return 'edge';
}
