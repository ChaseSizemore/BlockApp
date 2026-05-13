// 12 mixed-size pieces totaling 55 cells (fits an 11x5 board, IQ Puzzler Pro style).
// Shapes APPROXIMATED from the reference photo — may not match exactly.
// Each piece: cells in [row, col] in base orientation; color is a saturated jewel tone.
export const PENTOMINOES = {
  // 8 pentominoes (5 cells each)
  F: { cells: [[0, 1], [0, 2], [1, 0], [1, 1], [2, 1]], color: '#E04B3F' }, // coral red
  L: { cells: [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]], color: '#E68A2D' }, // orange
  Y: { cells: [[0, 1], [1, 0], [1, 1], [2, 1], [3, 1]], color: '#D9C040' }, // yellow
  Z: { cells: [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2]], color: '#74CFEB' }, // light blue
  N: { cells: [[0, 1], [1, 1], [2, 0], [2, 1], [3, 0]], color: '#2554C7' }, // dark blue
  I: { cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], color: '#6B3782' }, // purple
  P: { cells: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]], color: '#D8408F' }, // hot pink
  T: { cells: [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1]], color: '#E5A8B8' }, // light pink

  // 3 tetrominoes (4 cells each)
  S: { cells: [[0, 0], [1, 0], [1, 1], [2, 1]], color: '#8FCB60' }, // light green
  J: { cells: [[0, 0], [1, 0], [2, 0], [2, 1]], color: '#2D6A3E' }, // dark green
  O: { cells: [[0, 0], [0, 1], [1, 0], [1, 1]], color: '#F1EAD0' }, // off-white

  // 1 tromino (3 cells)
  V: { cells: [[0, 0], [1, 0], [1, 1]], color: '#B89A6F' }, // beige/tan
};

export const PIECE_LETTERS = Object.keys(PENTOMINOES);

function normalize(cells) {
  let minR = Infinity, minC = Infinity;
  for (const [r, c] of cells) {
    if (r < minR) minR = r;
    if (c < minC) minC = c;
  }
  return cells.map(([r, c]) => [r - minR, c - minC]);
}

function rotate(cells) {
  return normalize(cells.map(([r, c]) => [c, -r]));
}

function flip(cells) {
  return normalize(cells.map(([r, c]) => [r, -c]));
}

function key(cells) {
  return cells
    .slice()
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
    .map((p) => p.join(','))
    .join(';');
}

export function getOrientations(cells) {
  const seen = new Set();
  const out = [];
  let current = normalize(cells);
  for (let f = 0; f < 2; f++) {
    let rot = current;
    for (let r = 0; r < 4; r++) {
      const norm = normalize(rot);
      const k = key(norm);
      if (!seen.has(k)) {
        seen.add(k);
        out.push(norm);
      }
      rot = rotate(rot);
    }
    current = flip(current);
  }
  return out;
}

export const PIECE_ORIENTATIONS = Object.fromEntries(
  PIECE_LETTERS.map((L) => [L, getOrientations(PENTOMINOES[L].cells)]),
);

export function bbox(cells) {
  let h = 0, w = 0;
  for (const [r, c] of cells) {
    if (r >= h) h = r + 1;
    if (c >= w) w = c + 1;
  }
  return { h, w };
}

export function findOrientationIndex(letter, cells) {
  const target = key(normalize(cells));
  const orients = PIECE_ORIENTATIONS[letter];
  for (let i = 0; i < orients.length; i++) {
    if (key(orients[i]) === target) return i;
  }
  return -1;
}
