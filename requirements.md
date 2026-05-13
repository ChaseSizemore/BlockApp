Here's a prompt you can paste into Claude Code:

Build BLOCKLE, a daily pentomino puzzle game in the spirit of Wordle. Single-page web app, mobile-first, designed to be shareable.
Game mechanics

5×6 grid (30 cells), filled with exactly 6 pentominoes drawn from the 12 canonical pentomino shapes (F, I, L, N, P, T, U, V, W, X, Y, Z)
One piece is pre-placed on the board as a locked "hint" (render with a dashed/striped pattern so it's visually distinct)
The remaining 5 pieces sit in a tray; the player must place them all to fill the board exactly
Each day's puzzle is deterministic from the date — every player worldwide gets the same puzzle. Use a seeded RNG (mulberry32) keyed on day number since an epoch (e.g., 2024-01-01)
For the first ~30 puzzle-generation attempts per day, exclude X and U pentominoes (they're hardest to fit and produce ugly failures); fall back to the full set only if needed
Generation algorithm: place pieces via backtracking solver that anchors at the leftmost-empty cell, tries all orientations of all remaining pieces, recurses. Use this same solver to generate puzzles (run it forward with shuffled piece order) and to verify solvability

Interaction model (this is the key UX decision)
Do NOT do drag-from-tray. It's fiddly on mobile. Instead:

Tap a piece in the tray to pick it up — it becomes the "active" piece, shown floating near the cursor/finger
Rotate and Flip buttons appear while a piece is active
Drag the active piece over the board — show a translucent preview snapped to grid cells, green if it fits, red if it doesn't
Tap/release on the board to commit the placement
Tap a placed piece to pick it back up and reposition

Use pointer events (not separate mouse/touch handlers) for unified input. Critical: when calculating which grid cell the pointer is over, account for the CSS grid gap between cells — the math is cellSize = (boardWidth - (cols-1)*gap) / cols and cellLeft = col * (cellSize + gap). Getting this wrong is the #1 source of "the piece doesn't drop where I tapped" bugs.
Win flow

On solve: confetti, modal with completion time, current streak, and a Wordle-style emoji grid using the 6 piece colors (🟥🟦🟨🟩🟪🟧 etc.)
Share button uses navigator.share with clipboard fallback
Countdown timer to next puzzle (midnight local)
Persist via localStorage: stats (currentStreak, maxStreak, totalSolved, lastSolvedDayKey), today's in-progress board state, and a cache of generated puzzles by day number so revisits are instant

Visual design (this matters — avoid generic AI aesthetic)

Background: warm cream paper (#F4EFE4), not white, not gray
Typography: Fraunces (serif) for the wordmark and display numbers, DM Sans for UI text. Both from Google Fonts
Piece colors: vivid jewel tones, one per pentomino letter. Example palette: F=coral red, I=cobalt blue, L=mustard yellow, N=forest green, P=plum purple, T=burnt orange, U=teal, V=magenta, W=olive, X=sky blue, Y=rust, Z=pine. Saturated but not neon
Vibe: toy-like, tactile, disciplined. Think wooden puzzle on a writing desk, not a candy-crush slot machine
Board cells: subtle off-white with a soft inner shadow so empty cells feel recessed
Pieces when placed: flat color with a 2px darker border, slight rounded corners (4px radius), tiny drop shadow for lift
Buttons: dark charcoal text on cream, no gradients, no glass-morphism, no purple
Animations: stagger fade-up on initial load; gentle scale-bounce when a piece locks in; confetti on win
Mobile layout: tray below board, controls (rotate/flip/reset) as a fixed bottom row

Deliverable
Single self-contained HTML file with embedded CSS and vanilla JS. No build step, no framework. Should work by double-clicking the file.