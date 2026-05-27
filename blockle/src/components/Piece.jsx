function darken(hex, factor = 0.72) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * factor)},${Math.round(g * factor)},${Math.round(b * factor)})`;
}

// Trace the outer boundary of a piece (cells + bridges + 2x2 corner fills) as
// a single SVG path. Rendering the piece as one path — instead of a composite
// of per-cell divs — means transforms, filters, and strokes apply to one
// unified alpha shape, so no internal sub-rect seams appear at any zoom level.
function buildOutlinePath(cells, minR, minC, cellSize, gap, radius) {
  if (!cellSize || !cells.length) return '';
  const step = cellSize + gap;
  const cellSet = new Set(cells.map(([r, c]) => `${r},${c}`));
  const has = (r, c) => cellSet.has(`${r},${c}`);

  // 1. Enumerate every exposed orthogonal edge — cell edges + exposed bridge
  // edges. Coordinates are relative to the piece's local origin.
  const edges = [];
  for (const [r, c] of cells) {
    const x = (c - minC) * step;
    const y = (r - minR) * step;
    if (!has(r - 1, c)) edges.push([x, y, x + cellSize, y]);
    if (!has(r, c + 1)) edges.push([x + cellSize, y, x + cellSize, y + cellSize]);
    if (!has(r + 1, c)) edges.push([x, y + cellSize, x + cellSize, y + cellSize]);
    if (!has(r, c - 1)) edges.push([x, y, x, y + cellSize]);

    if (has(r, c + 1)) {
      const aboveCovered = has(r - 1, c) && has(r - 1, c + 1);
      const belowCovered = has(r + 1, c) && has(r + 1, c + 1);
      if (!aboveCovered) edges.push([x + cellSize, y, x + cellSize + gap, y]);
      if (!belowCovered) edges.push([x + cellSize, y + cellSize, x + cellSize + gap, y + cellSize]);
    }
    if (has(r + 1, c)) {
      const leftCovered = has(r, c - 1) && has(r + 1, c - 1);
      const rightCovered = has(r, c + 1) && has(r + 1, c + 1);
      if (!leftCovered) edges.push([x, y + cellSize, x, y + cellSize + gap]);
      if (!rightCovered) edges.push([x + cellSize, y + cellSize, x + cellSize, y + cellSize + gap]);
    }
  }

  // 2. Merge collinear contiguous edges so the polygon walk sees long sides,
  // not per-cell-unit fragments.
  const horizByY = new Map();
  const vertByX = new Map();
  for (const [x1, y1, x2, y2] of edges) {
    if (y1 === y2) {
      const list = horizByY.get(y1) || [];
      list.push([Math.min(x1, x2), Math.max(x1, x2)]);
      horizByY.set(y1, list);
    } else {
      const list = vertByX.get(x1) || [];
      list.push([Math.min(y1, y2), Math.max(y1, y2)]);
      vertByX.set(x1, list);
    }
  }
  function mergeRanges(ranges) {
    ranges.sort((a, b) => a[0] - b[0]);
    const out = [];
    for (const r of ranges) {
      if (out.length && out[out.length - 1][1] >= r[0]) {
        out[out.length - 1][1] = Math.max(out[out.length - 1][1], r[1]);
      } else {
        out.push([...r]);
      }
    }
    return out;
  }
  const segs = [];
  for (const [y, list] of horizByY) {
    for (const [a, b] of mergeRanges(list)) segs.push([a, y, b, y]);
  }
  for (const [x, list] of vertByX) {
    for (const [a, b] of mergeRanges(list)) segs.push([x, a, x, b]);
  }

  // 3. Vertex → segments adjacency. Each boundary vertex has degree 2 in
  // simply-connected polyominoes, so the walk is unambiguous.
  const segsByV = new Map();
  for (const s of segs) {
    const k1 = `${s[0]},${s[1]}`;
    const k2 = `${s[2]},${s[3]}`;
    if (!segsByV.has(k1)) segsByV.set(k1, []);
    if (!segsByV.has(k2)) segsByV.set(k2, []);
    segsByV.get(k1).push(s);
    segsByV.get(k2).push(s);
  }

  // 4. Walk the boundary clockwise from the top-left vertex.
  let startKey = null;
  let bestY = Infinity, bestX = Infinity;
  for (const k of segsByV.keys()) {
    const [vx, vy] = k.split(',').map(Number);
    if (vy < bestY || (vy === bestY && vx < bestX)) {
      bestY = vy; bestX = vx; startKey = k;
    }
  }
  if (!startKey) return '';

  const startSegs = segsByV.get(startKey);
  let nextSeg = startSegs.find((s) => s[1] === s[3]) || startSegs[0];
  const polygon = [];
  let curKey = startKey;
  let prevSeg = null;
  for (let iter = 0; iter < 10000; iter++) {
    polygon.push(curKey);
    const [cx, cy] = curKey.split(',').map(Number);
    const otherX = nextSeg[0] === cx && nextSeg[1] === cy ? nextSeg[2] : nextSeg[0];
    const otherY = nextSeg[0] === cx && nextSeg[1] === cy ? nextSeg[3] : nextSeg[1];
    prevSeg = nextSeg;
    curKey = `${otherX},${otherY}`;
    if (curKey === startKey) break;
    const cands = segsByV.get(curKey);
    nextSeg = cands.find((s) => s !== prevSeg);
    if (!nextSeg) break;
  }

  // 5. Build the SVG path. Round convex corners; leave reflex corners sharp.
  const n = polygon.length;
  if (n < 3) return '';
  const pts = polygon.map((v) => v.split(',').map(Number));
  function dirOf(i) {
    const a = pts[i], b = pts[(i + 1) % n];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.abs(dx) + Math.abs(dy);
    return [dx / len, dy / len];
  }
  function lenOf(i) {
    const a = pts[i], b = pts[(i + 1) % n];
    return Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
  }

  let d = '';
  for (let i = 0; i < n; i++) {
    const curr = pts[i];
    const prev = pts[(i - 1 + n) % n];
    const next = pts[(i + 1) % n];
    const dx1 = curr[0] - prev[0], dy1 = curr[1] - prev[1];
    const dx2 = next[0] - curr[0], dy2 = next[1] - curr[1];
    const convex = dx1 * dy2 - dy1 * dx2 > 0;
    const r = convex ? Math.min(radius, lenOf((i - 1 + n) % n) / 2, lenOf(i) / 2) : 0;
    const pd = dirOf((i - 1 + n) % n);
    const nd = dirOf(i);
    const enterX = curr[0] - pd[0] * r;
    const enterY = curr[1] - pd[1] * r;
    const exitX = curr[0] + nd[0] * r;
    const exitY = curr[1] + nd[1] * r;
    d += i === 0 ? `M ${enterX} ${enterY} ` : `L ${enterX} ${enterY} `;
    if (r > 0) d += `A ${r} ${r} 0 0 1 ${exitX} ${exitY} `;
  }
  return d + 'Z';
}

export default function Piece({
  cells,
  color,
  cellSize,
  gap,
  variant = 'placed',
  className = '',
  style = {},
  selected = false,
  onPointerDown,
}) {
  if (!cellSize) return null;
  const dark = darken(color, 0.7);
  const radius = 4;

  let minR = Infinity, minC = Infinity, maxR = -Infinity, maxC = -Infinity;
  for (const [r, c] of cells) {
    if (r < minR) minR = r;
    if (c < minC) minC = c;
    if (r > maxR) maxR = r;
    if (c > maxC) maxC = c;
  }
  const step = cellSize + gap;
  const groupLeft = minC * step;
  const groupTop = minR * step;
  const groupWidth = (maxC - minC + 1) * step - gap;
  const groupHeight = (maxR - minR + 1) * step - gap;

  const interactive = variant === 'placed' || variant === 'floating';
  const isHint = variant === 'hint';

  const pathD = buildOutlinePath(cells, minR, minC, cellSize, gap, radius);

  // Variant-specific fill + stroke.
  let fill, fillOpacity, stroke, strokeDash;
  if (isHint) {
    const patternId = `hint-pat-${color.replace('#', '')}`;
    fill = `url(#${patternId})`;
    fillOpacity = 0.85;
    stroke = dark;
    strokeDash = '5 3';
  } else if (variant === 'preview-good') {
    fill = color;
    fillOpacity = 0.6;
    stroke = 'var(--good)';
    strokeDash = undefined;
  } else if (variant === 'preview-bad') {
    fill = 'var(--bad)';
    fillOpacity = 0.45;
    stroke = 'var(--bad)';
    strokeDash = undefined;
  } else {
    fill = color;
    fillOpacity = 1;
    stroke = dark;
    strokeDash = undefined;
  }

  const baseFilter =
    variant === 'placed' ? 'drop-shadow(0 1px 0 rgba(0,0,0,0.05))'
    : variant === 'floating' ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.10))'
    : 'none';
  const filter = selected
    ? `${baseFilter === 'none' ? '' : baseFilter + ' '}drop-shadow(0 0 0 #1F1A14) drop-shadow(0 0 0 #1F1A14)`
    : baseFilter;

  // Diagonal-stripe pattern for hints, sharing one continuous coordinate space
  // (patternUnits="userSpaceOnUse") so stripes never break at cell boundaries.
  let patternDef = null;
  if (isHint) {
    const patternId = `hint-pat-${color.replace('#', '')}`;
    const dim = darken(color, 0.55);
    patternDef = (
      <pattern
        id={patternId}
        patternUnits="userSpaceOnUse"
        width="12"
        height="12"
        patternTransform="rotate(45)"
      >
        <rect width="6" height="12" fill={color} />
        <rect x="6" width="6" height="12" fill={dim} />
      </pattern>
    );
  }

  return (
    <div
      className={`piece piece--${variant} ${className}`}
      onPointerDown={onPointerDown}
      style={{
        position: 'absolute',
        left: groupLeft,
        top: groupTop,
        width: groupWidth,
        height: groupHeight,
        pointerEvents: 'none',
        filter,
        ...style,
      }}
    >
      <svg
        width={groupWidth}
        height={groupHeight}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          overflow: 'visible',
          pointerEvents: interactive ? 'auto' : 'none',
        }}
        aria-hidden="true"
      >
        {patternDef && <defs>{patternDef}</defs>}
        <path
          d={pathD}
          fill={fill}
          fillOpacity={fillOpacity}
          stroke={stroke}
          strokeWidth={2}
          strokeDasharray={strokeDash}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
