# Cobble — Pre-Launch Checklist

Tracking what stands between the current codebase and a public launch.

Two deploy paths:
- **Mobile Test Deploy** (private URL on Vercel/Netlify to play on your own phone): minimal subset, ~30 min of code work + 15 min deploy
- **Public Launch**: full hygiene pass for the first wave of strangers

---

## 0. Done So Far

Game / engine:
- [x] Free-form drag interaction (tray / placed / floating piece states)
- [x] Concave-corner rendering bug fixed
- [x] Mobile viewport lock (100dvh, no scroll)
- [x] Selection visual (2px ink outline, no chunky shadows)
- [x] Difficulty scorer (Easy / Medium / Hard / Expert)
- [x] Hint-pair rotation (cycles all 66 piece pairs across days)
- [x] Curated puzzle catalog generator (`scripts/curate.mjs`) + 40-puzzle sample shipped
- [x] Daily generation prefers curated entries; live-generation fallback
- [x] Time-budgeted solver (no hangs on pathological seeds)

Win flow:
- [x] 7 win-modal variants prototyped, selectable in dev panel
- [x] Variant 2 (Takeover) polished with inline SVG of solved board (real piece colors)
- [x] Share text uses time-mosaic encoding (`🟫` per 10s, partial `🟨`) — non-spoilery, no emoji palette collisions
- [x] Win modal close `×` + tap-timer-to-reopen flow

Pre-game / timing:
- [x] **Start Puzzle screen** — puzzle hidden until tapped (eliminates pre-thinking exploit)
- [x] **Fair timer** — auto-pauses on `visibilitychange: hidden`, resumes silently, persists every 5s + on `beforeunload`
- [x] First-time onboarding handled by StartScreen (no separate tutorial needed)

Dev tooling:
- [x] DevPanel with auto-solve, regenerate, variant picker, difficulty tier (gated on `import.meta.env.DEV`)
- [x] Stale `cobble:v1:override:*` localStorage cleanup on mount

Brand:
- [x] Renamed BLOCKLE → Cobble
- [x] Tagline "A DAILY ARRANGEMENT"
- [x] Storage keys at `cobble:v1:*`

---

## 1. Mobile Test Deploy — Critical Subset

What you actually need before pushing this to Vercel and opening it on your phone:

- [ ] **Lock default win variant to 2 (Takeover).** Currently defaults to 1. Since the dev panel is hidden in prod builds, whatever the default is, that's what mobile testers see. ~1 line change.

- [ ] **Verify dev panel is invisible in production build.** Run `npm run build && npm run preview`, open on phone (or DevTools mobile mode), confirm no DevPanel renders. Should already be true via `import.meta.env.DEV` gate, but worth a sanity check.

- [ ] **Decide on share button for mobile test.**
  - Option A: leave enabled — actually useful to test `navigator.share` on a real phone (it pops the native share sheet on iOS/Android).
  - Option B: grey it out (your earlier instinct) if you'd rather not field "the share doesn't look right" feedback yet.
  - **My recommendation: keep enabled.** The point of a mobile test is exercising every path on real hardware.

- [ ] **Commit + push remaining changes to `test-win-flow`.** Then merge to `main`.

- [ ] **Deploy.** Vercel: connect the GitHub repo, takes ~2 minutes. Vercel auto-assigns `cobble-xxxx.vercel.app` URL. Open that on your phone.

- [ ] **Test on real devices:**
  - [ ] iOS Safari (iPhone)
  - [ ] Android Chrome (if available)
  - Specifically: drag-and-drop precision, Start screen tap, timer behavior across tab switches, win modal close+reopen, share button behavior.

**Estimated time: 30 min code work + 15 min deploy + however long you test = ~1–2 hours total to playable on phone.**

---

## 2. Public Launch — Additional Hygiene

Beyond the mobile test deploy, these matter for the first wave of strangers:

- [ ] **Generate the full curated puzzle catalog.** Currently 40 puzzles (40-day cycle). Run `node scripts/curate.mjs 365` for a year's worth. ~5–6 minutes of compute.

- [ ] **Domain.** Buy `cobble.game` or alternative (`cobble.fun`, `playcobble.com`, `cobble.daily`). Cost ~$12/yr.

- [ ] **OG meta tags + social preview image.** 1200 × 630 PNG for Twitter/iMessage rich previews. Without this, links look generic.

- [ ] **Favicon + app icon.** Replace Vite default. Sizes: `favicon.ico`, `apple-touch-icon.png` (180×180), `icon-192.png`, `icon-512.png`.

- [ ] **Privacy-friendly analytics.** Plausible or Fathom. ~$9/mo. Gives daily-actives, retention, source-of-traffic.

- [ ] **HelpModal content review.** The StartScreen handles first-time onboarding now, but the in-game HelpModal (via `?` button) should be reviewed for clarity.

- [ ] **One-line stats disclosure.** Add "Your stats are saved on this device" to the HelpModal so users don't ask why their phone streak doesn't sync to laptop.

---

## 3. Low-Risk / Post-Launch

Defer until you see traffic:

- [ ] Sound effects (snap-in click, win chime, toggleable)
- [ ] Standalone stats modal (separate from win modal)
- [ ] React error boundary
- [ ] Lighthouse performance audit
- [ ] Animated tutorial overlay (if drop-off data warrants)
- [ ] Manual pause button (most won't use)
- [ ] Cross-tab same-window focus/blur handling (rare edge case)

---

## 4. Deployment Procedure (Vercel)

When ready:

1. [ ] Make sure the `main` branch is up to date with the latest commits.
2. [ ] Sign up at vercel.com (free tier).
3. [ ] Click "Import Project" → connect GitHub → select `BlockApp` repo.
4. [ ] Vercel auto-detects Vite, sets build command to `npm run build`, output dir `dist/`.
5. [ ] **Important:** set "Root Directory" to `blockle` (since the Vite project lives in a subfolder).
6. [ ] Click Deploy. ~2 minutes. Vercel returns a URL like `cobble-xxxx.vercel.app`.
7. [ ] Open URL on your phone. Test.
8. [ ] (Later) Add custom domain via Vercel's UI → update DNS at your registrar.

---

## 5. Explicitly Deferred (do NOT do for v1)

- Cross-device sync / accounts / login
- Leaderboards / friend comparisons
- Premium tier / subscriptions
- Push notifications
- Email capture / mailing list
- Server-rendered OG images per puzzle
- A/B testing platform
- Backend of any kind

---

## Tracking

Last updated: 2026-05-19
Current branch: `test-win-flow` (pushed to `origin`)
Next milestone: lock variant 2 default → merge to `main` → deploy to Vercel → test on phone
