# Cobble — Pre-Launch Checklist

Tracking what stands between the current codebase and a public launch.

Two deploy paths:
- **Mobile Test Deploy** (private URL to play on your own phone): ✅ DONE
- **Public Launch**: full hygiene pass for the first wave of strangers — still in progress

---

## 0. Done So Far

### Game engine + interaction
- [x] Free-form drag interaction (tray / placed / floating piece states)
- [x] Tray functions as a "snap-back" drop zone (drag piece into "Your blocks" → returns to tray)
- [x] Concave-corner rendering bug fixed (L/N/Z pieces no longer have phantom extra square)
- [x] Mobile viewport lock (100dvh, no scroll, proper touch-action)
- [x] Landscape rotation blocker (overlay shows below 500px viewport height)
- [x] Selection visual (static 2px ink outline; pulse/glow attempts reverted — needs better solution, see §2)
- [x] Cancel button removed (redundant — selection cleared via tap-active-slot, tap-empty-area, or drag-back-to-tray)

### Puzzle engine
- [x] Difficulty scorer (Easy / Medium / Hard / Expert) — branches + completions + geometry
- [x] Hint-pair rotation (deterministic cycle through all 66 piece pairs across days)
- [x] Curated puzzle catalog generator (`scripts/curate.mjs`) + **40-puzzle sample shipped** (needs 365 — see §2)
- [x] Daily generation prefers curated entries; live fallback if catalog is empty
- [x] Time-budgeted solver (`solveWithBudget`, `countCompletions` all bounded — no hangs on pathological seeds)
- [x] Seed-cache for puzzle generation (StrictMode-safe)

### Pre-game + timing
- [x] **Start Puzzle screen** — puzzle hidden until tapped (eliminates pre-thinking exploit, doubles as first-time onboarding)
- [x] **Fair timer** — auto-pauses on `visibilitychange: hidden`, resumes silently, persists every 5s + on `beforeunload`
- [x] Win modal close `×` + tap-timer-to-reopen flow

### Win flow
- [x] 7 win-modal variants prototyped (dev-only gallery)
- [x] **Variant 2 (Takeover) chosen as launch variant**
- [x] Inline SVG of solved board with real piece colors (avoids emoji palette collisions)
- [x] Time-mosaic share text encoding (`🟫` per 10s + `🟨` for partial — non-spoilery, no color limits)
- [x] Share button currently **disabled** in production (greyed out, "coming soon") — see §2

### Dev tooling
- [x] DevPanel with auto-solve, regenerate, variant picker, difficulty tier
- [x] **DevPanel gated build-time AND runtime** (`import.meta.env.DEV` + `window.location.hostname === 'localhost'`) — verified zero references in prod bundle
- [x] Stale `cobble:v1:override:*` localStorage cleanup on mount

### Brand + identity
- [x] Renamed BLOCKLE → Cobble
- [x] Tagline "A DAILY ARRANGEMENT"
- [x] Storage keys at `cobble:v1:*`

### Deployment
- [x] **Domain `cobble.day` purchased** (Cloudflare Registrar)
- [x] DNS connected to Vercel (Cloudflare-managed, DNS-only mode)
- [x] Deployed to Vercel production
- [x] **Vercel Web Analytics** wired in (`@vercel/analytics`) — enabled in dashboard, sending real events
- [x] **Vercel Speed Insights** wired in (`@vercel/speed-insights`) — enabled in dashboard, sending real events
- [x] Production telemetry props hardcoded (`mode="production"`, `debug={false}`) to bypass env-detection quirks with Vite

---

## 1. Mobile Test Deploy — Status

✅ **Complete.** Cobble is live at `https://cobble.day`, playable on phone, analytics flowing.

---

## 2. Public Launch — Critical Remaining

**Estimated total work: ~3–4 hours focused.**

### Ship-blockers
- [ ] **Build the share mechanic.** Currently greyed out. Plan:
  - Use the time-mosaic share text (already coded, just disabled).
  - Re-enable the share button on WinTakeover.
  - Test `navigator.share` on real iOS Safari + Android Chrome.
  - ~1 hour.

- [ ] **Generate the full 365-puzzle catalog.**
  - `node scripts/curate.mjs 365`
  - ~5–6 min compute, one-time.
  - Without this, the game cycles through 40 puzzles every 40 days — a regular player will notice.

- [ ] **Better selected-piece indicator.**
  - Previous attempts rejected: drop-shadow outline (too subtle/heavy), pulse animation (annoying).
  - New plan: dim non-selected pieces to ~70% opacity ("spotlight"), keep selected at 100%.
  - Optional companion: small "SELECTED: [mini piece]" indicator near controls.
  - ~15 min.

- [ ] **Custom event tracking** (strategic for a sale).
  - Add `track()` calls via `@vercel/analytics`:
    - `puzzle_started` — fires on Start Puzzle tap
    - `puzzle_solved` — fires on win, includes `elapsedSec` and `difficulty`
    - `puzzle_abandoned` — fires on `beforeunload` while unsolved
    - `help_opened` — fires when HelpModal opens
    - `share_clicked` — fires when share button is clicked
  - Gives funnel data: completion rate, drop-off, median solve time, share-intent rate.
  - ~20 min.

### High-value polish

- [ ] **OG meta tags + social preview image.**
  - 1200 × 630 PNG: wordmark over a styled board on cream paper.
  - `<meta property="og:image">`, `<meta property="og:title">`, `<meta name="twitter:card" content="summary_large_image">` in `index.html`.
  - Determines whether shared cobble.day links look clickable in Twitter/iMessage.
  - ~30 min.

- [ ] **Favicon + app icon.**
  - Replace Vite default.
  - Simple cream square with red dot = fine.
  - Sizes: `favicon.ico`, `apple-touch-icon.png` (180×180), `icon-192.png`, `icon-512.png`.
  - ~15 min.

- [ ] **HelpModal content review.**
  - StartScreen handles first-time onboarding, but the in-game `?` modal needs an editorial pass.
  - Add one-line disclosure: "Your stats are saved on this device."
  - ~10 min.

---

## 3. Polish / Post-Launch

Defer until traffic is real:

- [ ] React error boundary wrapping `<App>` (avoid white-screen on JS error)
- [ ] Lighthouse performance audit (bundle should already score 95+)
- [ ] Sound effects (snap-in click, win chime, toggleable)
- [ ] Standalone stats modal (separate from win modal): streak / total / best time
- [ ] Animated tutorial overlay on first visit (if drop-off analytics warrant)
- [ ] Manual pause button (auto-pause covers 95% of cases; explicit pause is extra)
- [ ] Streak retention metrics (`streak_continued` / `streak_broken` custom events)
- [ ] Cross-tab same-window focus/blur handling (rare edge case)

---

## 4. Explicitly Deferred (do NOT do for v1)

These come up eventually but are premature for the Wordle-precedent launch:

- Cross-device sync / accounts / login
- Leaderboards / friend comparisons
- Premium tier / subscriptions
- Push notifications
- Email capture / mailing list
- Server-rendered OG images per puzzle
- A/B testing platform
- Backend of any kind

Wordle had none of these at peak virality. Add them only when a clear user signal demands it.

---

## 5. Useful References

- Repo: `https://github.com/ChaseSizemore/BlockApp` (private)
- Production URL: `https://cobble.day`
- Vercel dashboard: cobble project, region IAD1
- Domain: Cloudflare Registrar
- DNS mode: Cloudflare DNS-only (grey cloud), points to Vercel
- Latest commit on `main`: see `git log --oneline -1`

---

## Tracking

Last updated: 2026-05-20
Mobile Test Deploy: ✅ DONE
Public Launch readiness: ~3–4 hours of focused work remaining (see §2)

**Recommended next-step order:**
1. Selected-piece dimming indicator (§2, ~15 min)
2. Custom events tracking (§2, ~20 min)
3. Generate 365-puzzle catalog (§2, ~6 min compute)
4. OG meta tags + preview image (§2, ~30 min)
5. Favicon swap (§2, ~15 min)
6. HelpModal review (§2, ~10 min)
7. Re-enable share mechanic + real-device test (§2, ~1 hour)
