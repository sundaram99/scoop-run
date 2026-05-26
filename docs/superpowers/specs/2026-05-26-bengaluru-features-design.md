# Scoop Run — Bengaluru Features Design
**Date:** 2026-05-26  
**Status:** Approved  
**Layers:** 4 (Zone Progression → Crash Reactions → Special Obstacles → Collectibles)

---

## Overview

Four independent feature layers that deepen the Bengaluru identity of Scoop Run. Each layer is shippable on its own. Implementation order: Layer 1 → 2 → 3 → 4. Cyclist soft-hit mechanic is a post-Layer-4 polish pass.

---

## Layer 1: Zone Progression

### What It Does
As elapsed time increases, the game announces the current Bengaluru zone. A banner slides in with a zone name, witty one-liner, and a generated image icon. Extends the existing `landmarks.ts` system.

### Zone Definitions
| Elapsed (s) | Zone | One-liner |
|-------------|------|-----------|
| 0 | Silk Board | "You'll age here." |
| 60 | Koramangala | "Startups and sambar. Every. Lane." |
| 150 | HSR Layout | "Finally a straight road. Don't get used to it." |
| 240 | Marathahalli | "The bridge. Again. Why." |
| 360 | Sarjapur | "Is this still Bengaluru? Yes. Somehow." |
| 480 | Whitefield | "You've left the city. You're still in traffic." |
| 600 | Doorbell | "You made it. The coffee's cold." |

### Traffic Density Spike
Koramangala (60s) and Marathahalli (240s) trigger a 15-second window where obstacle spawn interval is halved. No speed change — just more vehicles. Flavor text in the zone banner acknowledges it.

### Image Assets
7 PNG images, ~200×150px, transparent or minimal background, generated via ChatGPT image generation. One per zone. Prompts to be written before implementation begins (see Image Prompt section below).

### State & File Changes
- `src/lib/landmarks.ts` → renamed to `src/lib/zones.ts`
- `Landmark` interface → `Zone` interface, adds `image: string` (asset path) and `trafficSpike: boolean`
- `GameState` gets `activeZone: Zone | null` replacing `activeLandmark: string | null`
- `GameAction` `SHOW_LANDMARK` → `SHOW_ZONE`, `CLEAR_LANDMARK` → `CLEAR_ZONE`

### Banner UI
- Slides in from left, stays 3 seconds, slides out
- Zone name in Nunito 800, one-liner in DM Sans 400
- Image icon left of text, 48×48px rendered
- Brand colors: `#7C3AED` background, white text

---

## Layer 2: Crash Reactions

### What It Does
On crash, two simultaneous reactions:
1. Angry traffic police overlay appears center-screen during the 1.2s recovery window
2. The crashed vehicle shows a type-specific dialogue bubble

### Police Character
Canvas-drawn during `crashed` phase only. Disappears on `RECOVER`. Geometric canvas drawing — circle head, khaki rectangle body, pointing arm. Not a generated image.

### Vehicle Dialogue
| Vehicle | Line |
|---------|------|
| Auto | "Aye! Meter jaega mera!" |
| Car | "Do you know who I am?" |
| Bike | "Bro chill, it's just a scratch" |
| Bus | "Next stop: insurance claim 🚌" |
| Landlord | "Damage deposit: ₹2 lakh" |
| Hiring Sign | "No experience handling crashes either?" |
| Tesla | "My autopilot saw you coming" |

### State & File Changes
- `checkCollisions` in `gameLoop.ts` returns `hitObstacleType: Obstacle['type'] | null` instead of `hitObstacle: boolean`
- `GameState` adds `crashedIntoType: Obstacle['type'] | null`
- `GameAction` `CRASH` becomes `{ type: 'CRASH'; obstacleType: Obstacle['type'] }`
- Police character drawn in `src/lib/drawVehicles.ts` as `drawPolice(ctx, x, y)`
- Dialogue bubble drawn in play canvas as overlay when `crashedIntoType` is set

---

## Layer 3: Special Obstacles

### What It Does
4 new obstacle types added to the spawn pool. Each has distinct visual and behavior.

### New Obstacle Types
| Type | Lanes | Speed | Visual |
|------|-------|-------|--------|
| `bus` | 2 adjacent lanes | −40% vs base | Generated image, wide sprite |
| `landlord` | 1 lane | Base speed | Canvas-drawn man + "2BHK 45k" sign |
| `hiring` | 1 lane | −20% vs base (slow float) | Canvas-drawn floating banner |
| `tesla` | 1 lane, switches every 3–4s | Base speed | White-colored version of car sprite |

### Speed Hierarchy (baseline = 150px/s at elapsed=0)
- Bike: base × 1.2
- Auto, Car, Landlord, Hiring, Tesla: base × 1.0
- Bus: base × 0.6

### Bus — 2-Lane Mechanic
- Bus spawns covering 2 adjacent lanes: `[0,1]` or `[1,2]`
- Obstacle gets `lanes: Lane[]` field (only bus uses this; others have `lanes: [lane]`)
- Collision check: if obstacle has `lanes`, player crashes if their lane is in `lanes`
- Player must be in the one free lane to survive

### Tesla — Lane Switching
- Every 3–4 seconds (random interval), Tesla picks a new random lane
- Uses existing `MOVE_LANE` logic pattern applied to obstacle state
- Does not telegraph the switch — no animation, just position change

### Spawn Weighting
Spawn pool weights (out of 10):
- auto: 3, car: 3, bike: 2, tesla: 1, landlord: 0.5, hiring: 0.5, bus: 0.1 (rare)
- Bus rarity is intentional — it should feel like an event

### State & File Changes
- `Obstacle['type']` expands: `'auto' | 'car' | 'bike' | 'bus' | 'landlord' | 'hiring' | 'tesla'`
- `Obstacle` interface adds `lanes: Lane[]` (replaces single `lane` field for all obstacles for consistency)
- `spawnObstacle` uses weighted random selection
- `drawVehicles.ts` gets `drawLandlord`, `drawHiringSign`, `drawTesla` functions
- Bus sprite: generated image asset loaded same way as zone images

---

## Layer 4: Collectibles — 9 Hidden Gems

### What It Does
2 randomly selected gems from a set of 9 spawn each run. Player collects by lane alignment. End screen shows gems found this run and cumulative total from localStorage.

### The 9 Gems
| ID | Name | Icon Description |
|----|------|-----------------|
| 1 | Nandi Hills | Flag on hilltop |
| 2 | Savandurga | Large grey rock |
| 3 | Skandagiri | Lantern in dark sky |
| 4 | Ramanagara | Orange cliff face |
| 5 | Shivanasamudra | Waterfall spray |
| 6 | Anthargange | Flaming torch |
| 7 | Bilikal Rangaswamy | Temple idol silhouette |
| 8 | Chunchi Falls | Water drop |
| 9 | Makalidurga | Stone fort outline |

### Spawn Behavior
- 2 gems selected randomly at game start, fixed for that run
- Each spawns once at a random elapsed time between 60s–500s, random lane
- Visually distinct from coupon tokens: generated image icon (40×40px), subtle purple glow ring
- Fall speed: 80px/s (slower than coupons at 120px/s)

### Collection
- On collect: `+50 points`, gem name flashes on screen for 2 seconds ("Nandi Hills found!")
- Flash text: Nunito 800, `#7C3AED`, center-screen above HUD

### Persistence — localStorage
- Key: `scoop-run-gems` → JSON array of collected gem IDs e.g. `[1, 3, 7]`
- Read on game load, write on each gem collect, never reset between runs
- New game does not clear gem history

### End Screen
- "Gems found this run: Nandi Hills, Savandurga"
- "Total discovered: 3/9 — find the rest on your next run"
- Each gem shown as small icon + name in a grid

### State & File Changes
- New file: `src/lib/gems.ts` — gem definitions, localStorage read/write helpers
- `GameState` adds `gemsThisRun: number[]` (IDs collected this run)
- `GameAction` adds `{ type: 'COLLECT_GEM'; gemId: number }`
- `gameLoop.ts` gets gem spawn/collision logic (same pattern as coupons)
- Score screen component updated to show gem grid

---

## Polish Layer (Post Layer 4): Cyclist Soft-Hit

### What It Does
Cyclist becomes a "soft obstacle" — hitting it doesn't end the run.

- **Hard hit:** Player stays in cyclist's lane. No crash phase. Cyclist wobbles briefly, shows "Thank you saar, you saved my life 🙏". Player loses −10 points (not −50). No recovery pause.
- **Close dodge:** Player switches lane when cyclist is within Y proximity (±60px). Cyclist shows "Thank you saar 🙏" dialogue. No score change.

### State Changes
- `checkCollisions` returns third state: `'soft'` hit type for cyclist
- Reducer handles `soft` hit: deduct 10 points, trigger cyclist dialogue, no phase change
- `MOVE_LANE` action checks for nearby cyclists in previous lane, triggers near-miss dialogue

---

## Image Assets Required

### Zone Landmark Images (7)
Generate via ChatGPT. 200×150px PNG, transparent background, flat 2D illustration style.

| Zone | Prompt |
|------|--------|
| Silk Board | "Flat 2D illustration of a chaotic traffic junction, multiple roads merging, small vehicles from top-down view, no text, transparent background" |
| Koramangala | "Flat 2D illustration of a South Indian filter coffee tumbler with steam, minimal style, no text, transparent background" |
| HSR Layout | "Flat 2D illustration of a straight empty road with trees on both sides, top-down view, no text, transparent background" |
| Marathahalli | "Flat 2D illustration of a curved bridge over a road, side view, minimal flat style, no text, transparent background" |
| Sarjapur | "Flat 2D illustration of apartment buildings under construction, cranes visible, flat style, no text, transparent background" |
| Whitefield | "Flat 2D illustration of a glass-facade IT office building, modern, flat style, no text, transparent background" |
| Doorbell | "Flat 2D illustration of a doorbell button being pressed, hand reaching out, flat style, no text, transparent background" |

### Gem Icons (9)
Generate via ChatGPT. 80×80px PNG, transparent background, flat icon style.

| Gem | Prompt |
|-----|--------|
| Nandi Hills | "Flat 2D icon of a hilltop with a flag, simple silhouette, no text, transparent background" |
| Savandurga | "Flat 2D icon of a large rounded grey monolith rock, simple silhouette, no text, transparent background" |
| Skandagiri | "Flat 2D icon of a glowing lantern against a dark sky, simple style, no text, transparent background" |
| Ramanagara | "Flat 2D icon of an orange rocky cliff face, simple silhouette, no text, transparent background" |
| Shivanasamudra | "Flat 2D icon of a waterfall with spray at the base, simple style, no text, transparent background" |
| Anthargange | "Flat 2D icon of a flaming torch, simple flat style, no text, transparent background" |
| Bilikal Rangaswamy | "Flat 2D icon of a Hindu temple idol silhouette, simple style, no text, transparent background" |
| Chunchi Falls | "Flat 2D icon of a large water drop with ripple, simple flat style, no text, transparent background" |
| Makalidurga | "Flat 2D icon of a stone fort with battlements on a hill, simple silhouette, no text, transparent background" |

### Bus Sprite (1)
Generate via ChatGPT. 300×150px PNG, transparent background.
Prompt: "Flat 2D illustration of a BMTC Bengaluru city bus, side view, green and cream colors, no text, transparent background"

---

## Implementation Order

1. **Layer 1** — zones.ts, zone banner UI, traffic spike, generate + add 7 zone images
2. **Layer 2** — crash reaction system, police overlay, vehicle dialogue bubbles
3. **Layer 3** — 4 new obstacle types, bus 2-lane mechanic, Tesla lane switch, weighted spawn
4. **Layer 4** — gems.ts, gem spawn/collect, localStorage persistence, end screen gem grid
5. **Polish** — cyclist soft-hit mechanic

---

## Files Changed Summary

| File | Change |
|------|--------|
| `src/lib/landmarks.ts` | Renamed → `zones.ts`, extended |
| `src/lib/gameLoop.ts` | Obstacle types, collision return type, gem spawning |
| `src/lib/drawVehicles.ts` | Police, landlord, hiring sign, tesla draw functions |
| `src/lib/gems.ts` | New file — gem definitions + localStorage helpers |
| `src/types/game.ts` | GameState, GameAction extended |
| `src/app/game/score/page.tsx` | Gem grid on end screen |
| `public/assets/zones/` | 7 zone images |
| `public/assets/gems/` | 9 gem icons |
| `public/assets/vehicles/` | Bus sprite |
