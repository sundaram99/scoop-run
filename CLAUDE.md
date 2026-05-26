# Scoop Run — Claude Code Context

**Project:** Scoop Run — Zepto Builder Series Brief №01 · 2026
**Stack:** Next.js 15 App Router · TypeScript strict · Tailwind CSS 4 · HTML5 Canvas · `next/font/google`

---

## Stack Rules

- No shadcn. No Radix. No Material UI. No component library of any kind.
- No icon library (Lucide, Heroicons, Phosphor). Use emoji or inline SVG.
- No ORM, no database, no auth. Pure front-end prototype.
- No analytics (PostHog, Sentry, etc.).
- No dark mode. Single light mode only.
- `pnpm` as package manager.
- TypeScript strict. No `any`.

---

## Brand Rules (enforced, not suggested)

- **Background:** `#EDE5F7` lavender on every screen. Never white as a page background.
- **Accent purple:** `#7C3AED` — CTAs, brand elements, rider colour
- **Dare pink:** `#F0436A` — crash state only. Max 3 pink elements per screen.
- **Score card gradient:** `linear-gradient(135deg, #F0436A, #7C3AED)` — score card header only.
- **Fonts:** Nunito (700, 800) headlines · DM Sans (400–700) body/UI · JetBrains Mono (700) score HUD only.
- No fourth font family. No italics.

---

## Architecture

```
/game         → Intro screen ("Start the run")
/game/play    → Canvas game (active gameplay, HUD, overlays)
/game/score   → Score card (final score, discount, share)
```

- `src/app/game/layout.tsx` wraps all /game/* in GameProvider
- `src/lib/gameState.tsx` — Context + useReducer (score, lane, phase, elapsed)
- `src/lib/gameLoop.ts` — pure canvas logic (spawn, move, collide)
- `src/lib/landmarks.ts` — 5 Bengaluru checkpoints + dialogue
- `src/lib/tokens.ts` — hex colours for canvas 2D API
- `src/lib/scoring.ts` — discount tier calculator

---

## Game Mechanics

| Event | Points |
|-------|--------|
| Every second survived | +1 |
| Coupon token collected | +100 |
| Car crash | −50 (floor 0) |

| Score | Discount |
|-------|----------|
| 0–499 | 10% off |
| 500+  | 20% off |

GAME_DURATION = 600 (10 min). Use 60 during dev/testing only.

---

## Source of Truth

1. `../builder-os/sessions/IMPLEMENTATION_GUIDE.md` — routing, state, canvas, token wiring
2. `../builder-os/docs/input/stitch-tokens.md` — token values, screen audits
3. `../builder-os/brand/full-brand-guide.md` — visual system, anti-patterns

---

## Forbidden

- White page background
- Gradient anywhere except score card header
- JetBrains Mono outside score HUD
- shadcn, @radix-ui, lucide-react
- dark: Tailwind variants
- console.log in committed code

---

## UI Testing Rule (non-negotiable)

For ANY visual or UI change — SVG illustrations, layout shifts, canvas drawing, new components — you MUST verify in the browser before telling the user it's done.

**Required steps:**
1. `pnpm dev` if not already running
2. Take a screenshot: `npx playwright screenshot --browser chromium http://localhost:3000/<route> screenshot-<route>.png --viewport-size "430,932"`
3. Read the screenshot file to visually inspect the result
4. Fix any obvious issues, re-screenshot, confirm it looks correct
5. Only then tell the user what was done — with an honest description of what's visible

Never say "check localhost:3000" and hand it back. Never describe the output as "looks good" without actually reading the screenshot. Never call something "decent" without evidence.
