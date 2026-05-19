import { PIECE_ORIENTATIONS } from './pentominoes.js';

export const ROWS = 5;
export const COLS = 11;

// Find the leftmost-empty cell (scanning row by row).
// Board is a 2D array of letters or null.
export function firstEmpty(board) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] === null) return [r, c];
    }
  }
  return null;
}

// Try to place piece (already-normalized cells) so that its top-left filled cell
// aligns at (anchorR, anchorC). Note: orientations are normalized so (0, *) is
// the top row; we anchor so the leftmost cell of the top row sits at (anchorR, anchorC).
function tryPlace(board, cells, anchorR, anchorC, letter) {
  // Find the leftmost column in row 0 of the orientation — that's the "anchor cell".
  let anchorCol = Infinity;
  for (const [r, c] of cells) {
    if (r === 0 && c < anchorCol) anchorCol = c;
  }
  const placed = [];
  for (const [dr, dc] of cells) {
    const r = anchorR + dr;
    const c = anchorC + (dc - anchorCol);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
    if (board[r][c] !== null) return null;
    placed.push([r, c]);
  }
  for (const [r, c] of placed) board[r][c] = letter;
  return placed;
}

function unplace(board, placed) {
  for (const [r, c] of placed) board[r][c] = null;
}

// Backtracking solver. `pieces` is an array of letters to try, in order.
// Returns a placements array on success: [{ letter, cells: [[r,c],...] }, ...]
// or null if no solution.
export function solve(board, pieces, placements = []) {
  if (pieces.length === 0) {
    if (firstEmpty(board) === null) return placements.slice();
    return null;
  }
  const empty = firstEmpty(board);
  if (empty === null) return null;
  const [er, ec] = empty;

  for (let pi = 0; pi < pieces.length; pi++) {
    const letter = pieces[pi];
    const orients = PIECE_ORIENTATIONS[letter];
    for (let oi = 0; oi < orients.length; oi++) {
      const placed = tryPlace(board, orients[oi], er, ec, letter);
      if (placed) {
        placements.push({ letter, cells: placed });
        const remaining = pieces.slice(0, pi).concat(pieces.slice(pi + 1));
        const result = solve(board, remaining, placements);
        if (result) return result;
        placements.pop();
        unplace(board, placed);
      }
    }
  }
  return null;
}

// Returns the first solution found AND the number of search nodes visited
// (a rough proxy for "computational difficulty"). Used by the difficulty scorer.
// Optional budget cap so pathological starts don't explode the runtime.
export function solveWithBranchCount(board, pieces, budgetMs = 500) {
  let branches = 0;
  const deadline = Date.now() + budgetMs;
  let timedOut = false;
  function rec(remaining, placements) {
    if (Date.now() > deadline) { timedOut = true; return null; }
    branches++;
    if (remaining.length === 0) {
      if (firstEmpty(board) === null) return placements.slice();
      return null;
    }
    const empty = firstEmpty(board);
    if (empty === null) return null;
    const [er, ec] = empty;
    for (let pi = 0; pi < remaining.length; pi++) {
      if (timedOut) return null;
      const letter = remaining[pi];
      const orients = PIECE_ORIENTATIONS[letter];
      for (let oi = 0; oi < orients.length; oi++) {
        if (timedOut) return null;
        const placed = tryPlace(board, orients[oi], er, ec, letter);
        if (placed) {
          placements.push({ letter, cells: placed });
          const next = remaining.slice(0, pi).concat(remaining.slice(pi + 1));
          const result = rec(next, placements);
          if (result) return result;
          placements.pop();
          unplace(board, placed);
        }
      }
    }
    return null;
  }
  const result = rec(pieces, []);
  return { result, branches, timedOut };
}

// Budgeted variant: aborts if elapsed time exceeds budgetMs.
// Returns { result, timedOut }.
export function solveWithBudget(board, pieces, budgetMs = 800) {
  const deadline = Date.now() + budgetMs;
  let timedOut = false;
  function rec(remaining, placements) {
    if (Date.now() > deadline) { timedOut = true; return null; }
    if (remaining.length === 0) {
      if (firstEmpty(board) === null) return placements.slice();
      return null;
    }
    const empty = firstEmpty(board);
    if (empty === null) return null;
    const [er, ec] = empty;
    for (let pi = 0; pi < remaining.length; pi++) {
      if (timedOut) return null;
      const letter = remaining[pi];
      const orients = PIECE_ORIENTATIONS[letter];
      for (let oi = 0; oi < orients.length; oi++) {
        if (timedOut) return null;
        const placed = tryPlace(board, orients[oi], er, ec, letter);
        if (placed) {
          placements.push({ letter, cells: placed });
          const next = remaining.slice(0, pi).concat(remaining.slice(pi + 1));
          const result = rec(next, placements);
          if (result) return result;
          placements.pop();
          unplace(board, placed);
        }
      }
    }
    return null;
  }
  const result = rec(pieces, []);
  return { result, timedOut };
}

export function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

// Count all distinct completions of `board` using `pieces` (in any order/orientation).
// Capped at `maxCount` AND budgetMs so deeply ambiguous starts can't hang.
// Returns { count: number, capped: boolean, timedOut: boolean }.
export function countCompletions(board, pieces, maxCount = 1000, budgetMs = 500) {
  let count = 0;
  let capped = false;
  let timedOut = false;
  const deadline = Date.now() + budgetMs;

  function rec(remaining) {
    if (timedOut || Date.now() > deadline) { timedOut = true; return; }
    if (count >= maxCount) {
      capped = true;
      return;
    }
    if (remaining.length === 0) {
      if (firstEmpty(board) === null) count++;
      return;
    }
    const empty = firstEmpty(board);
    if (empty === null) return;
    const [er, ec] = empty;
    for (let pi = 0; pi < remaining.length; pi++) {
      if (count >= maxCount) return;
      const letter = remaining[pi];
      const orients = PIECE_ORIENTATIONS[letter];
      for (let oi = 0; oi < orients.length; oi++) {
        const placed = tryPlace(board, orients[oi], er, ec, letter);
        if (placed) {
          const next = remaining.slice(0, pi).concat(remaining.slice(pi + 1));
          rec(next);
          unplace(board, placed);
          if (count >= maxCount) return;
        }
      }
    }
  }
  rec(pieces);
  return { count, capped, timedOut };
}
