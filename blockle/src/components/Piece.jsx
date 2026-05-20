function darken(hex, factor = 0.72) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * factor)},${Math.round(g * factor)},${Math.round(b * factor)})`;
}

// Generate an SVG path 'd' string for a rectangle with per-corner radii.
// tl/tr/br/bl are the radii for top-left, top-right, bottom-right, bottom-left
// corners (0 = sharp). Mirrors the CSS border-radius shorthand order.
function roundedRectPath(x, y, w, h, tl, tr, br, bl) {
  const right = x + w;
  const bottom = y + h;
  return (
    `M ${x + tl},${y} ` +
    `H ${right - tr} ` +
    (tr ? `Q ${right},${y} ${right},${y + tr} ` : '') +
    `V ${bottom - br} ` +
    (br ? `Q ${right},${bottom} ${right - br},${bottom} ` : '') +
    `H ${x + bl} ` +
    (bl ? `Q ${x},${bottom} ${x},${bottom - bl} ` : '') +
    `V ${y + tl} ` +
    (tl ? `Q ${x},${y} ${x + tl},${y} ` : '') +
    'Z'
  );
}

// Render a piece as a set of small rectangles: cell body + per-direction bridges
// + a corner fill only when the diagonal cell is in the piece too. This avoids
// the "extra square" artifact that appeared at the inside concave corner of
// L/N/Z-shaped pieces with the old "extend the box by gap" approach.
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
  const cellSet = new Set(cells.map(([r, c]) => `${r},${c}`));
  const has = (r, c) => cellSet.has(`${r},${c}`);

  const step = cellSize + gap;
  const dark = darken(color, 0.7);
  const radius = 4;

  let minR = Infinity, minC = Infinity, maxR = -Infinity, maxC = -Infinity;
  for (const [r, c] of cells) {
    if (r < minR) minR = r;
    if (c < minC) minC = c;
    if (r > maxR) maxR = r;
    if (c > maxC) maxC = c;
  }
  const groupLeft = minC * step;
  const groupTop = minR * step;
  const groupWidth = (maxC - minC + 1) * step - gap;
  const groupHeight = (maxR - minR + 1) * step - gap;

  const interactive = variant === 'placed' || variant === 'floating';
  const isHint = variant === 'hint';
  const isPreview = variant === 'preview-good' || variant === 'preview-bad';

  // Hint pieces render the diagonal stripes as a single SVG with a <pattern>
  // element — patterns tile in one continuous coordinate space, so the stripes
  // never break at cell boundaries (the limitation of per-cell CSS gradients).
  // The per-cell divs still render on top, with TRANSPARENT background but
  // dashed borders, giving the "locked" hint cue.
  const baseColor = isPreview && variant === 'preview-bad' ? 'var(--bad)' : color;
  const baseOpacity = isPreview
    ? (variant === 'preview-good' ? 0.6 : 0.45)
    : 1; // hint opacity is applied to the SVG fill layer below, not per-part
  const borderStyle = isHint ? 'dashed' : 'solid';

  function basePartStyle(absX, absY, w, h) {
    const s = {
      position: 'absolute',
      left: absX,
      top: absY,
      width: w,
      height: h,
      pointerEvents: interactive ? 'auto' : 'none',
      opacity: baseOpacity,
    };
    if (isHint) {
      // Transparent background — the SVG layer below provides the fill.
      s.backgroundColor = 'transparent';
    } else {
      s.backgroundColor = baseColor;
    }
    return s;
  }

  const parts = [];
  let keyCounter = 0;

  for (const [r, c] of cells) {
    const top = has(r - 1, c);
    const right = has(r, c + 1);
    const bottom = has(r + 1, c);
    const left = has(r, c - 1);

    const x = (c - minC) * step;
    const y = (r - minR) * step;

    // --- Body cell -----------------------------------------------------------
    const tl = !top && !left ? radius : 0;
    const tr = !top && !right ? radius : 0;
    const bl = !bottom && !left ? radius : 0;
    const br = !bottom && !right ? radius : 0;
    const body = basePartStyle(x, y, cellSize, cellSize);
    body.borderRadius = `${tl}px ${tr}px ${br}px ${bl}px`;
    if (interactive || isHint) {
      if (!top) body.borderTop = `2px ${borderStyle} ${dark}`;
      if (!right) body.borderRight = `2px ${borderStyle} ${dark}`;
      if (!bottom) body.borderBottom = `2px ${borderStyle} ${dark}`;
      if (!left) body.borderLeft = `2px ${borderStyle} ${dark}`;
    }
    if (isPreview) {
      body.outline = `2px solid ${variant === 'preview-good' ? 'var(--good)' : 'var(--bad)'}`;
      body.outlineOffset = '-2px';
    }
    parts.push(<div key={keyCounter++} style={body} />);

    // --- Right bridge --------------------------------------------------------
    if (right) {
      const bridge = basePartStyle(x + cellSize, y, gap, cellSize);
      // Above the bridge is empty unless BOTH (r-1, c) and (r-1, c+1) are in piece.
      const aboveCovered = has(r - 1, c) && has(r - 1, c + 1);
      const belowCovered = has(r + 1, c) && has(r + 1, c + 1);
      if (interactive || isHint) {
        if (!aboveCovered) bridge.borderTop = `2px ${borderStyle} ${dark}`;
        if (!belowCovered) bridge.borderBottom = `2px ${borderStyle} ${dark}`;
      }
      parts.push(<div key={keyCounter++} style={bridge} />);
    }

    // --- Bottom bridge -------------------------------------------------------
    if (bottom) {
      const bridge = basePartStyle(x, y + cellSize, cellSize, gap);
      const leftCovered = has(r, c - 1) && has(r + 1, c - 1);
      const rightCovered = has(r, c + 1) && has(r + 1, c + 1);
      if (interactive || isHint) {
        if (!leftCovered) bridge.borderLeft = `2px ${borderStyle} ${dark}`;
        if (!rightCovered) bridge.borderRight = `2px ${borderStyle} ${dark}`;
      }
      parts.push(<div key={keyCounter++} style={bridge} />);
    }

    // --- Diagonal corner fill: only when the 2x2 block exists in the piece. --
    // For L/N/Z shapes where the diagonal cell is missing, we deliberately
    // leave this gap-sized square unfilled — that's what eliminates the bug.
    if (right && bottom && has(r + 1, c + 1)) {
      const corner = basePartStyle(x + cellSize, y + cellSize, gap, gap);
      parts.push(<div key={keyCounter++} style={corner} />);
    }
  }

  const baseFilter =
    variant === 'placed' ? 'drop-shadow(0 1px 0 rgba(0,0,0,0.05))'
    : variant === 'floating' ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.10))'
    : 'none';
  const filter = selected
    ? `${baseFilter === 'none' ? '' : baseFilter + ' '}drop-shadow(0 0 0 #1F1A14) drop-shadow(0 0 0 #1F1A14)`
    : baseFilter;

  // For hint pieces, build the SVG fill layer that renders behind the dashed-border
  // divs. Cell bodies use <path> with per-corner rounding (matching the regular
  // piece's exterior-convex-corner logic). Bridges + 2x2 corners are <rect> —
  // they're always at internal junctions where rounding doesn't apply.
  let hintSvg = null;
  if (isHint) {
    const bodyPaths = [];
    const fillRects = [];

    for (const [r, c] of cells) {
      const top = has(r - 1, c);
      const right = has(r, c + 1);
      const bottom = has(r + 1, c);
      const left = has(r, c - 1);
      const x = (c - minC) * step;
      const y = (r - minR) * step;

      const tl = !top && !left ? radius : 0;
      const tr = !top && !right ? radius : 0;
      const br = !bottom && !right ? radius : 0;
      const bl = !bottom && !left ? radius : 0;
      bodyPaths.push(roundedRectPath(x, y, cellSize, cellSize, tl, tr, br, bl));

      if (right) fillRects.push({ x: x + cellSize, y, w: gap, h: cellSize });
      if (bottom) fillRects.push({ x, y: y + cellSize, w: cellSize, h: gap });
      if (right && bottom && has(r + 1, c + 1)) {
        fillRects.push({ x: x + cellSize, y: y + cellSize, w: gap, h: gap });
      }
    }

    const patternId = `hint-pat-${color.replace('#', '')}`;
    const dimColor = darken(color, 0.55);
    hintSvg = (
      <svg
        width={groupWidth}
        height={groupHeight}
        style={{ position: 'absolute', left: 0, top: 0, opacity: 0.85, pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <defs>
          <pattern
            id={patternId}
            patternUnits="userSpaceOnUse"
            width="12"
            height="12"
            patternTransform="rotate(45)"
          >
            <rect width="6" height="12" fill={color} />
            <rect x="6" width="6" height="12" fill={dimColor} />
          </pattern>
        </defs>
        {bodyPaths.map((d, i) => (
          <path key={`b${i}`} d={d} fill={`url(#${patternId})`} />
        ))}
        {fillRects.map((r, i) => (
          <rect key={`r${i}`} x={r.x} y={r.y} width={r.w} height={r.h} fill={`url(#${patternId})`} />
        ))}
      </svg>
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
      {hintSvg}
      {parts}
    </div>
  );
}
