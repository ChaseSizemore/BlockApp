# Cobble — Pre-Launch Checklist

Tracking what stands between the current codebase and a public launch.
Estimated total focused work: **3–4 days**, assuming domain purchase happens in parallel.

Items are ordered by impact on the build → market → sell goal:
- **Must-fix** blocks launch.
- **High-value** is hygiene that materially affects first impression / virality.
- **Low-risk** is nice-to-have, defer until you see traffic.

---

## 1. Must-Fix Before Launch

These ship-blockers — a buyer should never see a half-finished prototype.

- [ ] **Cull win-flow variants to one.** Currently 7 in dev mode.
  - Recommended commit: **Variant 1 (Classic modal)** + **time-mosaic share** body.
  - Action: delete the other 6 variant components and `WIN_VARIANT` from dev panel.
  - Est: 30 min.

- [ ] **Build a real share mechanic.** The "play signature" is currently faked.
  - Recommended: time-mosaic (every 10s = one ▢ square; total mosaic = your solve time as a shape).
  - Non-spoilery, no piece-color collision, scales with effort, visually unique.
  - Est: ~1 hour.

- [ ] **Generate the full curated puzzle catalog.**
  - Command: `node scripts/curate.mjs 365`
  - Compute: ~5–6 minutes, one-time.
  - Without this, the game cycles through 40 puzzles every 40 days — a regular player notices.

- [ ] **Verify dev-only code is stripped in production builds.**
  - `DevPanel` is gated on `import.meta.env.DEV` — should be removed automatically.
  - Run `npm run build && npm run preview` and click around the production bundle to confirm no dev tools leak.

- [ ] **Real-device mobile testing.**
  - iOS Safari + Android Chrome. Specifically:
    - [ ] Pinch-zoom doesn't fight gameplay (`user-scalable=no` is set; double-check).
    - [ ] Long-press doesn't trigger iOS context menu over a piece.
    - [ ] `100dvh` layout isn't cut off by the URL bar.
    - [ ] Drag works smoothly one-thumbed.

- [ ] **First-time onboarding.**
  - Currently the HelpModal exists but never auto-opens — new players have no instructions.
  - Action: auto-open Help on first visit, gated by `localStorage.getItem('cobble:v1:seen')`.

---

## 2. High-Value Before Launch

These don't block deploy but they affect virality and first impressions.

- [ ] **Buy the domain.** Suggested in order:
  - [ ] `cobble.game` (ideal)
  - [ ] `cobble.fun`
  - [ ] `playcobble.com`
  - [ ] `cobble.daily`
  - Cost: ~$12/yr at Cloudflare.
  - **Do this first.** The name shouldn't be the blocker.

- [ ] **OG meta tags + social preview image.**
  - In `index.html`:
    - `<meta property="og:title">`, `og:description`, `og:image`, `og:url`
    - `<meta name="twitter:card" content="summary_large_image">`, `twitter:image`, etc.
  - Preview image: **1200 × 630 px PNG**. Wordmark over a board on cream paper. Reuse forever.
  - This is what determines if a tweet of your URL gets clicked.

- [ ] **Favicon + app icon.**
  - Replace the Vite default.
  - Simple cream square with the red dot suffices.
  - Sizes needed: `favicon.ico`, `apple-touch-icon.png` (180×180), `icon-192.png`, `icon-512.png`.

- [ ] **Privacy-friendly analytics.**
  - Plausible.io or Fathom — one-line script tag, ~$9/mo.
  - Gives daily-actives, retention, source-of-traffic.
  - You'll want this data when an acquirer asks "how many users?"

- [ ] **Review HelpModal content for clarity.**
  - A first-timer should grok the goal in <10 seconds.
  - Keep it to ~3 short sentences + one screenshot/diagram.

---

## 3. Low-Risk / Nice-to-Have (post-launch is fine)

- [ ] **Sound.** Subtle click on snap-in, chime on win. Toggleable. Big retention boost but not required.
- [ ] **Standalone stats modal** (separate from win modal): `🔥 Streak / 📊 Total / ⌛ Best time`.
- [ ] **React error boundary** wrapping `<App>` — show "Something went wrong, try refresh" instead of a white screen on JS errors.
- [ ] **Lighthouse performance check.** Bundle is 73 KB gzipped — should score 95+ already, but worth confirming.
- [ ] **Animated tutorial overlay** on first visit (hand pointing at the tray, then board). Higher-end onboarding; do if analytics show drop-off.

---

## 4. Deployment Steps (~20 min once the above is done)

- [ ] Push code to GitHub (private repo is fine).
- [ ] Sign up for Vercel; "Import Project," select repo.
- [ ] Vercel auto-detects Vite — runs `npm run build`, serves `dist/`.
- [ ] Add custom domain in Vercel's UI; update DNS at registrar.
- [ ] Test production URL on phone + desktop.
- [ ] Tweet it.

---

## 5. Explicitly Deferred (do NOT do for v1)

These come up eventually but are premature for the Wordle-precedent launch:

- Cross-device sync / accounts / login
- Leaderboards / friend comparisons
- Premium tier / subscriptions
- Push notifications
- Email capture / mailing list
- Server-rendered OG images per puzzle
- A/B testing platform
- Backend of any kind

Wordle had **none** of these at peak virality. Add them only when a clear user signal demands it.

---

## Tracking

Last updated: 2026-05-19
Next milestone: finish §1 (must-fix), then §2 (high-value), then deploy.
