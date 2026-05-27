const EMOJI_BY_LETTER = {
  F: '🟥', // coral red
  L: '🟧', // orange
  Y: '🟨', // yellow
  Z: '🟦', // light blue
  N: '🟦', // dark blue
  I: '🟪', // purple
  P: '🟪', // hot pink
  T: '🟫', // light pink
  S: '🟩', // light green
  J: '🟩', // dark green
  O: '⬜', // off-white
  V: '🟫', // beige
};

export function fmt(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function fmtCountdown(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function nextMidnightDelta() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next - now;
}

export function buildEmojiGrid(puzzle, placements) {
  const ROWS = 5;
  const COLS = 11;
  const g = Array.from({ length: ROWS }, () => Array(COLS).fill('⬜'));
  for (const i of puzzle.hintIndices) {
    const h = puzzle.solution[i];
    for (const [r, c] of h.cells) g[r][c] = EMOJI_BY_LETTER[h.letter] || '⬛';
  }
  for (const id of Object.keys(placements)) {
    const p = placements[id];
    for (const [r, c] of p.cells) g[r][c] = EMOJI_BY_LETTER[p.letter] || '⬛';
  }
  return g.map((row) => row.join('')).join('\n');
}

// Non-spoilery grid: hint cells colored (they're public to all players),
// every other cell rendered as opaque black. Day-unique silhouette, zero leak.
export function buildHintOnlyGrid(puzzle) {
  const ROWS = 5;
  const COLS = 11;
  const g = Array.from({ length: ROWS }, () => Array(COLS).fill('⬛'));
  for (const i of puzzle.hintIndices) {
    const h = puzzle.solution[i];
    for (const [r, c] of h.cells) g[r][c] = EMOJI_BY_LETTER[h.letter] || '⬛';
  }
  return g.map((row) => row.join('')).join('\n');
}

// Wordle-style "play signature": one emoji per piece placed (in placement order),
// colored by effort. Until we track real telemetry, this returns a deterministic
// fake sample so the visual can be evaluated. effortLevels[i] in [0..2]:
//   0 = clean (first try) → 🟩
//   1 = some adjustment → 🟨
//   2 = multiple retries → 🟥
export function buildPlaySignature(numPieces = 10, effortLevels = null) {
  const seq = effortLevels || sampleEfforts(numPieces);
  const palette = ['🟩', '🟨', '🟥'];
  return seq.map((e) => palette[Math.max(0, Math.min(2, e))]).join('');
}

function sampleEfforts(n) {
  // Deterministic fake: mostly green, a few yellows, one red.
  const arr = new Array(n).fill(0);
  if (n >= 3) arr[2] = 1;
  if (n >= 7) arr[6] = 1;
  if (n >= 5) arr[4] = 2;
  return arr;
}

// Time-mosaic: one filled square per 10s elapsed + a partial yellow if remainder.
// Wraps at `cols` per row for visual scanning. Compact, non-spoilery, recognizable.
//   elapsedMs=154000 (02:34), cols=6  → 15 full + 1 partial, layout:
//     🟫🟫🟫🟫🟫🟫
//     🟫🟫🟫🟫🟫🟫
//     🟫🟫🟫🟨
export function buildTimeMosaic(elapsedMs, { cols = 6, fullChar = '🟫', partialChar = '🟨' } = {}) {
  const totalSec = Math.floor(elapsedMs / 1000);
  const fullBuckets = Math.floor(totalSec / 10);
  const hasPartial = totalSec % 10 !== 0;
  const squares = [];
  for (let i = 0; i < fullBuckets; i++) squares.push(fullChar);
  if (hasPartial) squares.push(partialChar);
  const rows = [];
  for (let i = 0; i < squares.length; i += cols) {
    rows.push(squares.slice(i, i + cols).join(''));
  }
  return rows.join('\n');
}

export function buildShareText(day, elapsedMs, grid) {
  return `COBBLE #${day} — ${fmt(elapsedMs)}\n${grid}\ncobble.game`;
}

// Pacing mosaic: one square per piece (in placement order), colored by the gap
// from the previous final-placement timestamp. Tells the story of where the
// solver got stuck without revealing any piece positions.
//   🟩 fast    — well under your median pace (or under the absolute fast floor)
//   🟨 steady  — around your median
//   🟧 slow    — meaningfully longer than median
//   🟥 stuck   — much longer than median (or above the absolute stuck ceiling)
//
// Backtracking is naturally absorbed: time spent on a failed-and-undone attempt
// becomes the gap before whatever piece you commit next. So the FIRST piece's
// "gap" is just elapsed-to-first-placement — and if you tried-and-removed for
// 5 minutes before settling on a real layout, that 5 min lands on piece 1.
export function buildPacingMosaic(placements) {
  const sorted = Object.values(placements)
    .filter((p) => typeof p.placedAt === 'number')
    .sort((a, b) => a.placedAt - b.placedAt);
  if (!sorted.length) return '';

  const gaps = sorted.map((p, i) => (i === 0 ? p.placedAt : p.placedAt - sorted[i - 1].placedAt));

  // Relative median for normalizing color across fast and slow solves alike.
  const asc = [...gaps].sort((a, b) => a - b);
  const mid = Math.floor(asc.length / 2);
  const median = asc.length % 2 === 0 ? (asc[mid - 1] + asc[mid]) / 2 : asc[mid];

  // Absolute floor + ceiling. Anything under FAST is always green regardless
  // of solve-relative pace; anything over STUCK is always red. Keeps a
  // sub-minute speedrun from rendering a fake "red" piece and stops a
  // multi-minute pause from being lost in a sea of yellows.
  const FAST_MS = 8 * 1000;
  const STUCK_MS = 120 * 1000;

  return gaps
    .map((g) => {
      if (g <= FAST_MS) return '🟩';
      if (g >= STUCK_MS) return '🟥';
      if (g < median * 0.7) return '🟩';
      if (g < median * 1.4) return '🟨';
      if (g < median * 2.5) return '🟧';
      return '🟥';
    })
    .join('');
}

export function buildPacingShareText(day, elapsedMs, placements, currentStreak, tier) {
  const mosaic = buildPacingMosaic(placements);
  const tierLabel = tier ? ` · ${tier}` : '';
  const streakLine = currentStreak > 0 ? ` · 🔥 ${currentStreak}` : '';
  return `Cobble #${day}${tierLabel}\n${fmt(elapsedMs)}${streakLine}\n${mosaic}\ncobble.day`;
}

export async function shareResult(text) {
  try {
    if (navigator.share) {
      await navigator.share({ text });
      return 'shared';
    }
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    try {
      await navigator.clipboard.writeText(text);
      return 'copied';
    } catch {
      return 'failed';
    }
  }
}
