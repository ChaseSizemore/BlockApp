import { PIECE_LETTERS, PIECE_ORIENTATIONS, findOrientationIndex } from './pentominoes.js';
import { mulberry32, shuffled, dayNumber } from './rng.js';
import { solve, solveWithBudget, emptyBoard, ROWS, COLS } from './solver.js';
import curatedPuzzles from '../data/puzzles.json';

const HINT_COUNT = 2;

// All 66 unordered piece-letter pairs in a stable, deterministic order.
// Daily puzzles cycle through this list so every pair is exercised before any repeats.
const PIECE_PAIRS = (() => {
  const pairs = [];
  for (let i = 0; i < PIECE_LETTERS.length; i++) {
    for (let j = i + 1; j < PIECE_LETTERS.length; j++) {
      pairs.push([PIECE_LETTERS[i], PIECE_LETTERS[j]]);
    }
  }
  return pairs;
})();

// Process-wide cache so the same seed isn't re-solved repeatedly (e.g., by
// React StrictMode invoking the same useMemo factory twice in dev).
const _seedCache = new Map();
const _SEED_CACHE_MAX = 32;

// Generate a puzzle from an arbitrary 32-bit seed. Returns:
//   { day, solution: [...], hintIndices: [i, j] }
// (`day` is set to the seed for traceability; the field is just metadata.)
export function generatePuzzleForSeed(seed) {
  const key = seed >>> 0;
  if (_seedCache.has(key)) return _seedCache.get(key);

  const rand = mulberry32(key);

  // Most random orderings tile cleanly in <50ms. Cap each attempt so a
  // pathological order can't stall the main thread; cap total too.
  let placements = null;
  const totalDeadline = Date.now() + 3000;
  for (let attempt = 0; attempt < 80 && Date.now() < totalDeadline; attempt++) {
    const pieces = shuffled(PIECE_LETTERS, rand);
    const { result } = solveWithBudget(emptyBoard(), pieces, 400);
    if (result && result.length === PIECE_LETTERS.length) {
      placements = result;
      break;
    }
  }
  if (!placements) {
    // Last resort: no budget. The 12-piece set on 11x5 is tileable, so this returns.
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

  const puzzle = { day: seed, solution, hintIndices };
  // Insert into cache; evict oldest if over cap.
  _seedCache.set(key, puzzle);
  if (_seedCache.size > _SEED_CACHE_MAX) {
    const oldestKey = _seedCache.keys().next().value;
    _seedCache.delete(oldestKey);
  }
  return puzzle;
}

// Hydrate a compact curated-puzzle entry (anchor + orientationIndex per piece)
// back to the full runtime shape (with absolute cells).
function hydrateCurated(entry) {
  const solution = entry.solution.map((s) => {
    const orient = PIECE_ORIENTATIONS[s.letter][s.orientationIndex];
    const cells = orient.map(([r, c]) => [r + s.anchor[0], c + s.anchor[1]]);
    return {
      letter: s.letter,
      cells,
      orientationIndex: s.orientationIndex,
      anchor: s.anchor,
    };
  });
  return { day: entry.seed, solution, hintIndices: entry.hintIndices };
}

// Public: the daily puzzle. If a curated set exists, day N → puzzles[N mod N_curated].
// Otherwise falls back to live pair-rotated generation.
export function generatePuzzleForDay(day) {
  if (curatedPuzzles && curatedPuzzles.length > 0) {
    const idx = ((day % curatedPuzzles.length) + curatedPuzzles.length) % curatedPuzzles.length;
    const p = hydrateCurated(curatedPuzzles[idx]);
    return { ...p, day };
  }
  return generatePuzzleForDayLive(day);
}

// Live-generation fallback. Day N targets a specific piece-pair (cycled
// deterministically through the 66 pairs) and finds a tiling that contains both.
export function generatePuzzleForDayLive(day) {
  const targetPair = PIECE_PAIRS[((day % PIECE_PAIRS.length) + PIECE_PAIRS.length) % PIECE_PAIRS.length];
  const baseSeed = (0x9e3779b9 ^ (day * 2654435761)) >>> 0;
  const rand = mulberry32(baseSeed);

  // Find a tiling, then take the placements of the two target-pair letters as hints.
  let placements = null;
  const totalDeadline = Date.now() + 3000;
  for (let attempt = 0; attempt < 80 && Date.now() < totalDeadline; attempt++) {
    const pieces = shuffled(PIECE_LETTERS, rand);
    const { result } = solveWithBudget(emptyBoard(), pieces, 400);
    if (result && result.length === PIECE_LETTERS.length) {
      placements = result;
      break;
    }
  }
  if (!placements) placements = solve(emptyBoard(), PIECE_LETTERS.slice()) || [];

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

  // Hint indices = positions of the two target-pair letters in the solution.
  const hintIndices = targetPair
    .map((L) => solution.findIndex((s) => s.letter === L))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b);

  // Defensive fallback: if for any reason the target pair isn't present
  // (shouldn't happen — all 12 are in every tiling), use random hints.
  if (hintIndices.length !== HINT_COUNT) {
    const idx = shuffled(Array.from({ length: solution.length }, (_, i) => i), rand);
    return { day, solution, hintIndices: idx.slice(0, HINT_COUNT).sort((a, b) => a - b) };
  }

  return { day, solution, hintIndices };
}

export function todayLabel(date = new Date()) {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function getTodaysDay() {
  return dayNumber();
}

export { ROWS, COLS };
