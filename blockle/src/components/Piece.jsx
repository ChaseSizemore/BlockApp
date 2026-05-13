function darken(hex, factor = 0.72) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * factor)},${Math.round(g * factor)},${Math.round(b * factor)})`;
}

// Render a pentomino as absolutely-positioned cells that bridge same-piece gaps.
// `cells` is a list of [r, c] in BOARD coordinates. Position is relative to the board.
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

  // Bounding box for positioning the group container.
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

  const cellNodes = cells.map(([r, c], i) => {
    const top = has(r - 1, c);
    const right = has(r, c + 1);
    const bottom = has(r + 1, c);
    const left = has(r, c - 1);

    const x = (c - minC) * step;
    const y = (r - minR) * step;
    const width = cellSize + (right ? gap : 0);
    const height = cellSize + (bottom ? gap : 0);

    const tl = !top && !left ? radius : 0;
    const tr = !top && !right ? radius : 0;
    const bl = !bottom && !left ? radius : 0;
    const br = !bottom && !right ? radius : 0;

    const cellInteractive = variant === 'placed' || variant === 'floating';
    const cellStyle = {
      position: 'absolute',
      left: x,
      top: y,
      width,
      height,
      backgroundColor: color,
      borderRadius: `${tl}px ${tr}px ${br}px ${bl}px`,
      pointerEvents: cellInteractive ? 'auto' : 'none',
    };

    if (variant === 'placed' || variant === 'floating') {
      // 2px darker border on exterior sides only
      if (!top) cellStyle.borderTop = `2px solid ${dark}`;
      if (!right) cellStyle.borderRight = `2px solid ${dark}`;
      if (!bottom) cellStyle.borderBottom = `2px solid ${dark}`;
      if (!left) cellStyle.borderLeft = `2px solid ${dark}`;
    } else if (variant === 'hint') {
      cellStyle.backgroundColor = 'transparent';
      cellStyle.backgroundImage = `repeating-linear-gradient(45deg, ${color} 0 6px, ${darken(color, 0.55)} 6px 12px)`;
      cellStyle.opacity = 0.85;
      if (!top) cellStyle.borderTop = `2px dashed ${dark}`;
      if (!right) cellStyle.borderRight = `2px dashed ${dark}`;
      if (!bottom) cellStyle.borderBottom = `2px dashed ${dark}`;
      if (!left) cellStyle.borderLeft = `2px dashed ${dark}`;
    } else if (variant === 'preview-good') {
      cellStyle.opacity = 0.6;
      cellStyle.outline = '2px solid var(--good)';
      cellStyle.outlineOffset = '-2px';
    } else if (variant === 'preview-bad') {
      cellStyle.opacity = 0.45;
      cellStyle.backgroundColor = 'var(--bad)';
      cellStyle.outline = '2px solid var(--bad)';
      cellStyle.outlineOffset = '-2px';
    }

    return <div key={i} style={cellStyle} />;
  });

  const baseFilter =
    variant === 'placed' ? 'drop-shadow(0 2px 0 rgba(0,0,0,0.06)) drop-shadow(0 4px 6px rgba(0,0,0,0.06))'
    : variant === 'floating' ? 'drop-shadow(0 8px 14px rgba(0,0,0,0.18))'
    : 'none';
  const filter = selected
    ? `${baseFilter === 'none' ? '' : baseFilter + ' '}drop-shadow(0 0 0 #1F1A14) drop-shadow(0 0 0 #1F1A14) drop-shadow(0 0 0 #1F1A14)`
    : baseFilter;

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
        // Container is always pointer-transparent — only the actual cell rects
        // accept pointer events. This prevents the bbox of an L/Y/N piece from
        // intercepting taps meant for adjacent empty board cells.
        pointerEvents: 'none',
        filter,
        ...style,
      }}
    >
      {cellNodes}
    </div>
  );
}
