#!/usr/bin/env node
// Curate a set of high-quality starting positions.
//
// Generates many candidate puzzles, scores each with the difficulty scorer,
// filters out the boring ones (trivial or pathological), distributes the
// surviving picks across Easy/Medium/Hard/Expert tiers, and writes the
// result to src/data/puzzles.json.
//
// Usage:
//   node scripts/curate.mjs           # default: ~365 puzzles, balanced tiers
//   node scripts/curate.mjs 1000      # specify target count
//
// The output JSON is shaped as an array of { tier, seed, solution, hintIndices }.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generatePuzzleForSeed } from '../src/game/puzzle.js';
import { scoreDifficulty } from '../src/game/difficulty.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_TOTAL = parseInt(process.argv[2], 10) || 365;
const PER_TIER = Math.ceil(TARGET_TOTAL / 4);
// Per-tier counters so we stop generating extras of a saturated tier.
const tierBuckets = { Easy: [], Medium: [], Hard: [], Expert: [] };

const MAX_CANDIDATES = TARGET_TOTAL * 30; // search budget
const startTime = Date.now();
let attempts = 0;

console.log(`Curating ${TARGET_TOTAL} puzzles (~${PER_TIER} per tier)...`);

for (let i = 0; i < MAX_CANDIDATES; i++) {
  attempts++;
  // Pseudo-random but reproducible: walk a 32-bit space from a salt.
  const seed = ((0xCAFEBABE + i * 2654435761) >>> 0);
  let puzzle;
  try {
    puzzle = generatePuzzleForSeed(seed);
  } catch {
    continue;
  }
  let score;
  try {
    score = scoreDifficulty(puzzle);
  } catch {
    continue;
  }
  if (!tierBuckets[score.tier]) continue;
  if (tierBuckets[score.tier].length >= PER_TIER) continue;

  tierBuckets[score.tier].push({
    tier: score.tier,
    seed,
    raw: score.raw,
    branches: score.branches,
    completions: score.completions,
    completionsCapped: score.completionsCapped,
    hintCoverage: score.hintCoverage,
    geometry: score.geometry,
    solution: puzzle.solution,
    hintIndices: puzzle.hintIndices,
  });

  const total = Object.values(tierBuckets).reduce((n, b) => n + b.length, 0);
  if (total % 50 === 0 || total === TARGET_TOTAL) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const sizes = Object.entries(tierBuckets)
      .map(([t, b]) => `${t[0]}:${b.length}`)
      .join(' ');
    console.log(`  [${elapsed}s] ${total}/${TARGET_TOTAL}  ${sizes}  (${attempts} candidates)`);
  }
  if (total >= TARGET_TOTAL) break;
}

const all = []
  .concat(tierBuckets.Easy, tierBuckets.Medium, tierBuckets.Hard, tierBuckets.Expert)
  // Sort by tier then by raw difficulty so puzzles flow easy → hard within tier.
  .sort((a, b) => {
    const tierOrder = { Easy: 0, Medium: 1, Hard: 2, Expert: 3 };
    return tierOrder[a.tier] - tierOrder[b.tier] || a.raw - b.raw;
  });

// Strip cells from each piece's `cells` field for compactness:
// store anchor + orient cells instead of absolute cells (~30% smaller).
// We re-hydrate at runtime from the orientation index + anchor.
const compact = all.map((p) => ({
  tier: p.tier,
  seed: p.seed,
  raw: p.raw,
  hintIndices: p.hintIndices,
  solution: p.solution.map((s) => ({
    letter: s.letter,
    orientationIndex: s.orientationIndex,
    anchor: s.anchor,
  })),
}));

const outDir = path.join(__dirname, '..', 'src', 'data');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'puzzles.json');
fs.writeFileSync(outFile, JSON.stringify(compact));

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
const bytes = fs.statSync(outFile).size;
const kb = (bytes / 1024).toFixed(1);
console.log(`\nWrote ${compact.length} puzzles to ${outFile}`);
console.log(`File size: ${kb} KB`);
console.log(`Elapsed: ${elapsed}s, ${attempts} candidates considered`);
console.log(`Tier distribution: ${Object.entries(tierBuckets).map(([t, b]) => `${t} ${b.length}`).join(', ')}`);
