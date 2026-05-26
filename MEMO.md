# Scoop Run — Project Memo

**Date:** May 26, 2026
**Status:** Live in production
**URL:** https://scoop-run.vercel.app

---

## What is this?

Scoop Run is a browser-based mobile game built as part of the Zepto Builder Series (Brief №01). The player controls a Zepto delivery rider navigating Bengaluru traffic — dodging vehicles and collecting coupon tokens to earn a discount reward.

---

## How it works

- **3-lane top-down canvas game** playable on mobile via swipe or tap, desktop via arrow keys
- **10-minute run** (600 seconds) — survive as long as possible
- Obstacles: auto-rickshaws, cars, and motorcycles spawn and move toward the player
- Coupon tokens (₹) appear periodically and award +100 points when collected
- Crashing into a vehicle costs −50 points and triggers a 1.2s recovery window
- 5 Bengaluru landmark milestones appear as toast notifications during the run
- Final score maps to a discount tier: 0–499 → 10% off, 500+ → 20% off

---

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 App Router |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 |
| Rendering | HTML5 Canvas |
| Hosting | Vercel |
| Package manager | pnpm |

No database, no auth, no third-party UI libraries. Pure front-end prototype.

---

## Architecture

```
/game         → Intro screen
/game/play    → Active gameplay (canvas + HUD)
/game/score   → Score card with discount and share
```

- `gameState.tsx` — React context + useReducer (score, lane, phase, elapsed)
- `gameLoop.ts` — Pure logic: spawn, tick, collision detection
- `sprites.ts` — Sprite sheet loader and draw helper
- `landmarks.ts` — 5 Bengaluru checkpoints with dialogue
- `scoring.ts` — Discount tier calculator

---

## Brand

- Background: `#EDE5F7` (lavender) — every screen
- Accent: `#7C3AED` (purple) — CTAs, player
- Crash state: `#F0436A` (pink)
- Fonts: Nunito (headlines) · DM Sans (body) · JetBrains Mono (HUD score only)

---

## Known gaps / next up

- New vehicle sprites pending (bicycle, open-roof car, bus, motorcycle with rider) — ChatGPT prompt ready
- No sound effects
- No persistent leaderboard
- Collision hitbox is functional but approximate — tied to sprite render math
