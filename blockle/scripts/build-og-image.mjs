// One-shot script: converts scripts/og-image.svg to public/og-image.png at
// 1200x630 (standard OG ratio). Run after editing the SVG.
//   node scripts/build-og-image.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SVG_PATH = path.join(__dirname, 'og-image.svg');
const OUT_PATH = path.join(__dirname, '..', 'public', 'og-image.png');

const svg = fs.readFileSync(SVG_PATH);
await sharp(svg, { density: 144 })
  .resize(1200, 630, { fit: 'fill' })
  .png({ compressionLevel: 9 })
  .toFile(OUT_PATH);

console.log(`Wrote ${OUT_PATH}`);
