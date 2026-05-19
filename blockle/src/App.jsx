import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import Header from './components/Header.jsx';
import Timer from './components/Timer.jsx';
import Board, { GAP as BOARD_GAP, PAD as BOARD_PAD } from './components/Board.jsx';
import Tray, { TRAY_CELL, TRAY_GAP } from './components/Tray.jsx';
import Controls from './components/Controls.jsx';
import FloatingLayer, { FLOATING_CELL, FLOATING_GAP } from './components/FloatingLayer.jsx';
import DragOverlay from './components/DragOverlay.jsx';
import WinModal from './components/WinModal.jsx';
import WinTakeover from './components/WinTakeover.jsx';
import WinBottomSheet from './components/WinBottomSheet.jsx';
import WinInline from './components/WinInline.jsx';
import WinHintGrid from './components/WinHintGrid.jsx';
import WinScoreOnly from './components/WinScoreOnly.jsx';
import WinPlaySignature from './components/WinPlaySignature.jsx';
import Confetti from './components/Confetti.jsx';
import HelpModal from './components/HelpModal.jsx';
import DevPanel from './components/DevPanel.jsx';
import { generatePuzzleForDay, generatePuzzleForSeed, getTodaysDay, todayLabel, ROWS, COLS } from './game/puzzle.js';
import { PIECE_ORIENTATIONS, bbox } from './game/pentominoes.js';
import { countCompletions, emptyBoard } from './game/solver.js';
import { scoreDifficulty } from './game/difficulty.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';

const DRAG_THRESHOLD = 8; // px

function normalizeCells(cells) {
  let minR = Infinity, minC = Infinity;
  for (const [r, c] of cells) {
    if (r < minR) minR = r;
    if (c < minC) minC = c;
  }
  return cells.map(([r, c]) => [r - minR, c - minC]);
}
function rotateCellsCW(cells) {
  return normalizeCells(cells.map(([r, c]) => [c, -r]));
}
function flipCellsH(cells) {
  return normalizeCells(cells.map(([r, c]) => [r, -c]));
}

const INITIAL_STATS = {
  currentStreak: 0,
  maxStreak: 0,
  totalSolved: 0,
  lastSolvedDayKey: null,
};

const INITIAL_PROGRESS = {
  placements: {},
  floating: {},
  solved: false,
  elapsedMs: 0,
  startedAt: null,
};

export default function App() {
  const [today] = useState(() => ({
    day: getTodaysDay(),
    dateLabel: todayLabel(),
  }));
  // Optional dev override: a custom seed replaces the day's deterministic puzzle.
  const [overrideSeed, setOverrideSeed] = useState(null);

  // One-time cleanup of stale override keys (from earlier sessions when overrides
  // were persisted to localStorage). Runs once per page load.
  useEffect(() => {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith('cobble:v1:override:')) localStorage.removeItem(k);
      }
    } catch {}
  }, []);

  // Stable key for the daily puzzle's progress. Overrides DON'T touch localStorage
  // (would churn keys on every regenerate); they use an in-memory state slot below.
  const dayKey = `cobble:v1:day:${today.day}`;

  const puzzle = useMemo(() => {
    if (overrideSeed !== null) {
      // Override puzzles aren't cached; regenerated fresh each session.
      return generatePuzzleForSeed(overrideSeed);
    }
    try {
      const cached = localStorage.getItem(`cobble:v1:puzzle:${today.day}`);
      if (cached) return JSON.parse(cached);
    } catch {}
    const p = generatePuzzleForDay(today.day);
    try {
      localStorage.setItem(`cobble:v1:puzzle:${today.day}`, JSON.stringify(p));
    } catch {}
    return p;
  }, [today.day, overrideSeed]);

  // Completion counting is disabled for now (the difficulty scorer covers it).
  const completionInfo = { count: null, capped: false, elapsedMs: 0, computing: false };

  // Difficulty scorer — runs off the render path. Computes once per puzzle.
  const [difficulty, setDifficulty] = useState({ computing: true });
  useEffect(() => {
    let cancelled = false;
    setDifficulty({ computing: true });
    const id = setTimeout(() => {
      if (cancelled) return;
      try {
        const t0 = performance.now();
        const score = scoreDifficulty(puzzle);
        const elapsedMs = Math.round(performance.now() - t0);
        if (!cancelled) setDifficulty({ ...score, elapsedMs, computing: false });
      } catch (e) {
        if (!cancelled) setDifficulty({ computing: false, error: String(e) });
      }
    }, 50);
    return () => { cancelled = true; clearTimeout(id); };
  }, [puzzle]);

  const hints = useMemo(() => {
    return puzzle.hintIndices.map((i) => ({
      index: i,
      letter: puzzle.solution[i].letter,
      cells: puzzle.solution[i].cells,
    }));
  }, [puzzle]);

  const hintIndexSet = useMemo(() => new Set(puzzle.hintIndices), [puzzle.hintIndices]);

  const trayDefs = useMemo(() => {
    return puzzle.solution
      .map((s, i) => ({ id: i, letter: s.letter }))
      .filter((_, i) => !hintIndexSet.has(i));
  }, [puzzle, hintIndexSet]);

  // Daily progress persists to localStorage (stable key). Override progress is
  // transient — lives in memory only, cleared on refresh.
  const [dailyProgress, setDailyProgress] = useLocalStorage(dayKey, INITIAL_PROGRESS);
  const [overrideProgress, setOverrideProgress] = useState(INITIAL_PROGRESS);
  const progress = overrideSeed === null ? dailyProgress : overrideProgress;
  const setProgress = overrideSeed === null ? setDailyProgress : setOverrideProgress;

  const [stats, setStats] = useLocalStorage('cobble:v1:stats', INITIAL_STATS);

  // Tray pieces remember their current orientation (in-memory; doesn't persist).
  const [trayOrients, setTrayOrients] = useState({});

  // Selection (highlighted, target of rotate/flip).
  const [selectedId, setSelectedId] = useState(null);

  // Active drag (transient).
  const [drag, setDrag] = useState(null);
  // drag = { pieceId, letter, orient, grabDX, grabDY, x, y, cellSize }

  // Gesture tracking (ref so handlers can read latest without re-binding).
  const gestureRef = useRef(null);
  // { pieceId, source: 'tray'|'placed'|'floating', startX, startY, grabDX, grabDY,
  //   originOrient, originCells (placed), originXY (floating), hasDragged, cellSize }

  const boardRef = useRef(null);
  const boardCellSizeRef = useRef(0);

  // Timer.
  const [elapsedMs, setElapsedMs] = useState(progress.elapsedMs || 0);
  const tickRef = useRef(null);
  useEffect(() => {
    if (progress.solved) return;
    if (!progress.startedAt) return;
    const baseElapsed = progress.elapsedMs || 0;
    const startStamp = Date.now() - baseElapsed;
    tickRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startStamp);
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [progress.solved, progress.startedAt]);

  useEffect(() => {
    if (progress.solved || !progress.startedAt) return;
    const id = setInterval(() => {
      setProgress((p) => ({ ...p, elapsedMs }));
    }, 3000);
    return () => clearInterval(id);
  }, [elapsedMs, progress.solved, progress.startedAt, setProgress]);

  const startTimerIfNeeded = () => {
    if (!progress.startedAt) {
      setProgress((p) => ({ ...p, startedAt: Date.now() }));
    }
  };

  // Helpers.
  const getPieceLetter = (id) => puzzle.solution[id].letter;
  const getPieceOrient = (id) => {
    if (progress.placements[id]) return progress.placements[id].orient || normalizeCells(progress.placements[id].cells);
    if (progress.floating[id]) return progress.floating[id].orient;
    return trayOrients[id] || PIECE_ORIENTATIONS[getPieceLetter(id)][0];
  };
  const getPieceState = (id) => {
    if (progress.placements[id]) return 'placed';
    if (progress.floating[id]) return 'floating';
    return 'tray';
  };

  // Build board occupancy, excluding the piece currently being dragged.
  const board = useMemo(() => {
    const b = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    for (const h of hints) {
      for (const [r, c] of h.cells) b[r][c] = { kind: 'hint', letter: h.letter };
    }
    for (const idStr of Object.keys(progress.placements)) {
      const id = Number(idStr);
      if (drag && drag.pieceId === id) continue;
      const p = progress.placements[idStr];
      for (const [r, c] of p.cells) b[r][c] = { kind: 'piece', pieceId: id, letter: p.letter };
    }
    return b;
  }, [hints, progress.placements, drag]);

  // Win detection: every cell occupied.
  useEffect(() => {
    if (progress.solved) return;
    let filled = 0;
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (board[r][c] !== null) filled++;
    if (filled === ROWS * COLS) {
      const finalMs = elapsedMs;
      const lastDay = stats.lastSolvedDayKey;
      const streak = lastDay === today.day - 1 ? stats.currentStreak + 1
        : lastDay === today.day ? stats.currentStreak
        : 1;
      setStats((s) => ({
        currentStreak: streak,
        maxStreak: Math.max(s.maxStreak, streak),
        totalSolved: s.totalSolved + 1,
        lastSolvedDayKey: today.day,
      }));
      setProgress((p) => ({ ...p, solved: true, elapsedMs: finalMs, solvedAt: Date.now() }));
    }
  }, [board, progress.solved, elapsedMs, stats, today.day, setProgress, setStats]);

  // Compute the screen-space top-left of a piece's bbox, given its source.
  // Used to derive the pixel grab offset at pointerdown.
  const computePieceScreenTopLeft = (id, source) => {
    if (source === 'placed') {
      const p = progress.placements[id];
      if (!p) return { x: 0, y: 0 };
      const minR = Math.min(...p.cells.map((c) => c[0]));
      const minC = Math.min(...p.cells.map((c) => c[1]));
      const boardEl = boardRef.current;
      const rect = boardEl?.getBoundingClientRect();
      const cs = boardCellSizeRef.current;
      if (!rect || !cs) return { x: 0, y: 0 };
      return {
        x: rect.left + BOARD_PAD + minC * (cs + BOARD_GAP),
        y: rect.top + BOARD_PAD + minR * (cs + BOARD_GAP),
      };
    }
    if (source === 'floating') {
      const f = progress.floating[id];
      if (!f) return { x: 0, y: 0 };
      return { x: f.x, y: f.y };
    }
    // tray: the slot's piece doesn't have a precise screen pos here; we'll compute from the event below.
    return null;
  };

  // Use board cell size everywhere a piece is "in motion" (drag) or "outside the grid" (floating).
  // This way the visual size doesn't jump between drag, placed, and floating states.
  const motionCellSize = () => boardCellSizeRef.current || FLOATING_CELL;
  const motionGap = () => BOARD_GAP;

  // Gesture handlers.
  const onPiecePointerDown = (e, pieceId, source) => {
    if (progress.solved) return;
    e.stopPropagation();
    e.preventDefault?.();

    const orient = getPieceOrient(pieceId);
    let grabDX = 0;
    let grabDY = 0;

    if (source === 'placed' || source === 'floating') {
      const tl = computePieceScreenTopLeft(pieceId, source);
      if (tl) {
        grabDX = e.clientX - tl.x;
        grabDY = e.clientY - tl.y;
      }
    } else if (source === 'tray') {
      // For tray pickup, grab the piece by its center when the drag begins.
      const cs = motionCellSize();
      const gp = motionGap();
      const { h, w } = bbox(orient);
      const totalW = w * cs + (w - 1) * gp;
      const totalH = h * cs + (h - 1) * gp;
      grabDX = totalW / 2;
      grabDY = totalH / 2;
    }

    gestureRef.current = {
      pieceId,
      source,
      startX: e.clientX,
      startY: e.clientY,
      grabDX,
      grabDY,
      originOrient: orient,
      originCells: source === 'placed' ? progress.placements[pieceId]?.cells : null,
      originXY: source === 'floating' ? { x: progress.floating[pieceId]?.x, y: progress.floating[pieceId]?.y } : null,
      hasDragged: false,
      cellSize: motionCellSize(),
      gap: motionGap(),
    };
  };

  // Background pointerdown: deselect unless the press is on an interactive element.
  const onBackgroundPointerDown = (e) => {
    if (
      e.target.closest?.(
        '.tray__slot, .ctrls__btn, .hd__help, .floating-piece, .piece--placed, .help, .win, button',
      )
    ) {
      return;
    }
    setSelectedId(null);
  };

  // Global pointermove: drag tracking.
  useEffect(() => {
    const onMove = (e) => {
      const g = gestureRef.current;
      if (!g) return;
      if (!g.hasDragged) {
        const dist = Math.hypot(e.clientX - g.startX, e.clientY - g.startY);
        if (dist < DRAG_THRESHOLD) return;
        g.hasDragged = true;
        // Begin actual drag: lift the piece from its source.
        const id = g.pieceId;
        if (g.source === 'placed') {
          setProgress((p) => {
            const next = { ...p.placements };
            delete next[id];
            return { ...p, placements: next };
          });
        } else if (g.source === 'floating') {
          setProgress((p) => {
            const next = { ...p.floating };
            delete next[id];
            return { ...p, floating: next };
          });
        }
        setDrag({
          pieceId: id,
          letter: getPieceLetter(id),
          orient: g.originOrient,
          grabDX: g.grabDX,
          grabDY: g.grabDY,
          x: e.clientX,
          y: e.clientY,
          cellSize: g.cellSize,
          gap: g.gap,
        });
        startTimerIfNeeded();
      } else {
        setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : null));
      }
    };
    const onUp = (e) => {
      const g = gestureRef.current;
      gestureRef.current = null;
      if (!g) return;

      if (!g.hasDragged) {
        // Tap: select this piece (toggle off if same).
        setSelectedId((cur) => (cur === g.pieceId ? null : g.pieceId));
        return;
      }

      // Was a drag: determine drop.
      const id = g.pieceId;
      const letter = getPieceLetter(id);
      const orient = drag?.orient || g.originOrient;
      const boardEl = boardRef.current;
      const rect = boardEl?.getBoundingClientRect();
      const cs = boardCellSizeRef.current;

      let placedCells = null;
      if (rect && cs) {
        const step = cs + BOARD_GAP;
        // Piece's bbox top-left in screen coords at drop time.
        const bboxX = e.clientX - g.grabDX;
        const bboxY = e.clientY - g.grabDY;
        // What grid anchor would this correspond to on the board?
        const innerX = rect.left + BOARD_PAD;
        const innerY = rect.top + BOARD_PAD;
        const anchorCol = Math.round((bboxX - innerX) / step);
        const anchorRow = Math.round((bboxY - innerY) / step);
        const cells = orient.map(([r, c]) => [anchorRow + r, anchorCol + c]);
        const valid = cells.every(([r, c]) =>
          r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === null,
        );
        if (valid) placedCells = cells;
      }

      if (placedCells) {
        setProgress((p) => ({
          ...p,
          placements: { ...p.placements, [id]: { letter, cells: placedCells, orient } },
        }));
      } else {
        // No valid board placement → become floating at drop point.
        const x = e.clientX - g.grabDX;
        const y = e.clientY - g.grabDY;
        setProgress((p) => ({
          ...p,
          floating: { ...p.floating, [id]: { letter, x, y, orient } },
        }));
      }
      setDrag(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [drag, board, setProgress]);

  // Rotate / flip on the selected piece.
  const transformSelected = (transform) => {
    if (selectedId === null) return;
    const id = selectedId;
    const orient = getPieceOrient(id);
    const newOrient = transform(orient);
    const state = getPieceState(id);

    if (state === 'placed') {
      // Try to apply in-place at the same anchor.
      const cells = progress.placements[id].cells;
      const minR = Math.min(...cells.map((c) => c[0]));
      const minC = Math.min(...cells.map((c) => c[1]));
      const candidate = newOrient.map(([r, c]) => [minR + r, minC + c]);
      const occupied = new Set();
      for (const h of hints) for (const [r, c] of h.cells) occupied.add(`${r},${c}`);
      for (const otherId of Object.keys(progress.placements)) {
        if (Number(otherId) === id) continue;
        for (const [r, c] of progress.placements[otherId].cells) occupied.add(`${r},${c}`);
      }
      const valid = candidate.every(([r, c]) =>
        r >= 0 && r < ROWS && c >= 0 && c < COLS && !occupied.has(`${r},${c}`),
      );
      if (valid) {
        setProgress((p) => ({
          ...p,
          placements: { ...p.placements, [id]: { ...p.placements[id], cells: candidate, orient: newOrient } },
        }));
      } else {
        // Lift to floating at the piece's current screen position.
        const tl = computePieceScreenTopLeft(id, 'placed');
        setProgress((p) => {
          const nextPlacements = { ...p.placements };
          delete nextPlacements[id];
          return {
            ...p,
            placements: nextPlacements,
            floating: { ...p.floating, [id]: { letter: getPieceLetter(id), x: tl.x, y: tl.y, orient: newOrient } },
          };
        });
      }
    } else if (state === 'floating') {
      setProgress((p) => ({
        ...p,
        floating: { ...p.floating, [id]: { ...p.floating[id], orient: newOrient } },
      }));
    } else {
      // tray
      setTrayOrients((t) => ({ ...t, [id]: newOrient }));
    }
  };

  const rotate = () => transformSelected(rotateCellsCW);
  const flip = () => transformSelected(flipCellsH);

  // Cancel: deselect.
  const cancelSelection = () => setSelectedId(null);

  const reset = () => {
    if (!window.confirm("Reset today's puzzle?")) return;
    setProgress(INITIAL_PROGRESS);
    setSelectedId(null);
    setDrag(null);
    setTrayOrients({});
    setElapsedMs(0);
  };

  const [helpOpen, setHelpOpen] = useState(false);

  // In-memory dismiss state for the win modal. Lets the player look at their
  // solved board without the modal in the way. Reopen via the "View summary"
  // button. Refreshing brings the modal back (state is not persisted).
  const [winDismissed, setWinDismissed] = useState(false);
  // Reset dismiss when the puzzle changes or the win state flips.
  useEffect(() => { setWinDismissed(false); }, [puzzle, progress.solved]);

  // Win-flow prototype selection (dev only). Default: classic modal.
  const [winVariant, setWinVariant] = useState(() => {
    const v = Number(localStorage.getItem('cobble:dev:winVariant'));
    return v >= 1 && v <= 7 ? v : 1;
  });
  const changeWinVariant = (v) => {
    setWinVariant(v);
    try { localStorage.setItem('cobble:dev:winVariant', String(v)); } catch {}
  };

  const autoSolve = () => {
    const newPlacements = {};
    puzzle.solution.forEach((s, i) => {
      if (hintIndexSet.has(i)) return;
      newPlacements[i] = {
        letter: s.letter,
        cells: s.cells,
        orient: normalizeCells(s.cells),
      };
    });
    setProgress((p) => ({
      ...p,
      placements: newPlacements,
      floating: {},
      startedAt: p.startedAt || Date.now(),
    }));
    setSelectedId(null);
    setDrag(null);
  };

  const devReset = () => {
    setProgress(INITIAL_PROGRESS);
    setSelectedId(null);
    setDrag(null);
    setTrayOrients({});
    setElapsedMs(0);
  };

  // Generate a brand new starting position with a random seed.
  // The deterministic per-day puzzle becomes overridden until reset.
  const regeneratePuzzle = () => {
    const seed = (Math.random() * 0x7fffffff) >>> 0;
    setOverrideSeed(seed);
    setProgress(INITIAL_PROGRESS);
    setSelectedId(null);
    setDrag(null);
    setTrayOrients({});
    setElapsedMs(0);
  };

  // Drop the override and return to today's deterministic puzzle.
  const restoreDailyPuzzle = () => {
    if (overrideSeed === null) return;
    setOverrideSeed(null);
    setProgress(INITIAL_PROGRESS);
    setSelectedId(null);
    setDrag(null);
    setTrayOrients({});
    setElapsedMs(0);
  };

  const placedPieces = Object.entries(progress.placements).map(([id, p]) => ({
    id: Number(id),
    letter: p.letter,
    cells: p.cells,
  }));

  const floatingPieces = Object.entries(progress.floating)
    .filter(([id]) => !drag || drag.pieceId !== Number(id))
    .map(([id, f]) => ({
      id: Number(id),
      letter: f.letter,
      x: f.x,
      y: f.y,
      orient: f.orient,
    }));

  const trayPieces = trayDefs
    .filter((d) => getPieceState(d.id) === 'tray' && (!drag || drag.pieceId !== d.id))
    .map((d) => ({ id: d.id, letter: d.letter }));

  const remaining = trayDefs.length
    - Object.keys(progress.placements).length;

  const handleBoardReady = (size, el) => {
    boardCellSizeRef.current = size;
    boardRef.current = el;
  };

  return (
    <div className="app" onPointerDown={onBackgroundPointerDown}>
      <div className="app__shell" onPointerDown={(e) => { /* don't deselect on shell taps that hit pieces */ }}>
        <Header
          day={today.day}
          dateLabel={today.dateLabel}
          streak={stats.currentStreak}
          onHelp={(e) => { e?.stopPropagation?.(); setHelpOpen(true); }}
        />
        <Timer
          elapsedMs={progress.solved ? progress.elapsedMs : elapsedMs}
          solved={progress.solved && winDismissed}
          onReopenSummary={() => setWinDismissed(false)}
        />
        {progress.solved && winVariant === 4 && (
          <WinInline
            day={today.day}
            elapsedMs={progress.elapsedMs}
            stats={stats}
            puzzle={puzzle}
            placements={progress.placements}
          />
        )}
        <div className="app__board-area">
          <Board
            rows={ROWS}
            cols={COLS}
            hints={hints}
            placedPieces={placedPieces}
            selectedId={selectedId}
            onPiecePointerDown={onPiecePointerDown}
            onReady={handleBoardReady}
          />
        </div>
        <Controls
          active={selectedId !== null}
          onRotate={(e) => { e?.stopPropagation?.(); rotate(); }}
          onFlip={(e) => { e?.stopPropagation?.(); flip(); }}
          onCancel={(e) => { e?.stopPropagation?.(); cancelSelection(); }}
        />
        <Tray
          pieces={trayPieces}
          remaining={Math.max(0, remaining)}
          selectedId={selectedId}
          trayOrients={trayOrients}
          onPiecePointerDown={onPiecePointerDown}
        />
      </div>

      <FloatingLayer
        pieces={floatingPieces}
        selectedId={selectedId}
        cellSize={motionCellSize()}
        gap={motionGap()}
        onPiecePointerDown={onPiecePointerDown}
      />

      <DragOverlay drag={drag} />

      {progress.solved && !winDismissed && (
        <>
          <Confetti />
          {winVariant === 1 && (
            <WinModal
              day={today.day}
              dateLabel={today.dateLabel}
              elapsedMs={progress.elapsedMs}
              stats={stats}
              puzzle={puzzle}
              placements={progress.placements}
              onClose={() => setWinDismissed(true)}
            />
          )}
          {winVariant === 2 && (
            <WinTakeover
              day={today.day}
              elapsedMs={progress.elapsedMs}
              stats={stats}
              puzzle={puzzle}
              placements={progress.placements}
              onClose={() => setWinDismissed(true)}
            />
          )}
          {winVariant === 3 && (
            <WinBottomSheet
              day={today.day}
              elapsedMs={progress.elapsedMs}
              stats={stats}
              puzzle={puzzle}
              placements={progress.placements}
              onClose={() => setWinDismissed(true)}
            />
          )}
          {winVariant === 5 && (
            <WinHintGrid
              day={today.day}
              elapsedMs={progress.elapsedMs}
              stats={stats}
              puzzle={puzzle}
              onClose={() => setWinDismissed(true)}
            />
          )}
          {winVariant === 6 && (
            <WinScoreOnly
              day={today.day}
              elapsedMs={progress.elapsedMs}
              stats={stats}
              onClose={() => setWinDismissed(true)}
            />
          )}
          {winVariant === 7 && (
            <WinPlaySignature
              day={today.day}
              elapsedMs={progress.elapsedMs}
              stats={stats}
              placements={progress.placements}
              onClose={() => setWinDismissed(true)}
            />
          )}
        </>
      )}

      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}

      {import.meta.env.DEV && (
        <DevPanel
          variant={winVariant}
          onVariantChange={changeWinVariant}
          onAutoSolve={autoSolve}
          onReset={devReset}
          onRegenerate={regeneratePuzzle}
          onRestoreDaily={restoreDailyPuzzle}
          solved={progress.solved}
          completionCount={completionInfo.count}
          completionCapped={completionInfo.capped}
          completionElapsedMs={completionInfo.elapsedMs}
          completionComputing={completionInfo.computing}
          difficulty={difficulty}
          puzzleIsOverride={overrideSeed !== null}
          puzzleSeed={overrideSeed}
        />
      )}
    </div>
  );
}
