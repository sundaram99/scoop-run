import { Lane } from '@/types/game'

export interface Obstacle {
  id: string
  lane: Lane
  y: number
  speed: number
  type: 'auto' | 'car' | 'bike'
  width: number
  height: number
}

export interface CouponToken {
  id: string
  lane: Lane
  y: number
  collected: boolean
}

export interface GameObjects {
  obstacles: Obstacle[]
  coupons: CouponToken[]
  lastCouponSpawn: number
  nextObstacleIn: number
}

const CANVAS_HEIGHT = 700
// PLAYER_RENDER_SIZE = round(66 * 0.70) = 46 (bounding box is 46×46)
// Player sprite 159×357: scale = min(46/159, 46/357) = 46/357 = 0.129 (height-constrained)
// Rendered: 159*0.129=20w × 46h, centred at cy = PLAYER_Y + PLAYER_H/2 = 580+24 = 604
const PLAYER_RENDERED_H = 46
const PLAYER_CENTER_Y = 604
const PLAYER_Y = PLAYER_CENTER_Y - PLAYER_RENDERED_H / 2  // 581
const PLAYER_HEIGHT = PLAYER_RENDERED_H
const PLAYER_WIDTH = Math.round(159 * (46 / 357))  // 20

// Hitbox insets — small trim so collision fires on first visual touch
const HIT_INSET_TOP = 10
const HIT_INSET_BOTTOM = 10
const HIT_INSET_X = 6

export function getObstacleSpeed(elapsed: number): number {
  return Math.min(350, 150 + Math.floor(elapsed / 30) * 10)
}

export function spawnObstacle(elapsed: number): Obstacle {
  const types: Obstacle['type'][] = ['auto', 'car', 'bike']
  const type = types[Math.floor(Math.random() * types.length)]
  // OBSTACLE_RENDER_SIZE = 45 (70% of 64) — bounding box is 45×45
  // Sprite aspect ratios: auto 196×357, car 183×376, bike 152×331
  // scale = min(45/sw, 45/sh) — height-constrained for all (sh > sw)
  // auto: scale=45/357=0.126 → 25w×45h, car: scale=45/376=0.120→22w×45h, bike: scale=45/331=0.136→21w×45h
  const dims: Record<Obstacle['type'], [number, number]> = {
    auto: [25, 45],
    car:  [22, 45],
    bike: [21, 45],
  }
  const [w, h] = dims[type]
  return {
    id: `obs-${Date.now()}-${Math.random()}`,
    lane: Math.floor(Math.random() * 3) as Lane,
    y: -h,
    speed: getObstacleSpeed(elapsed),
    type,
    width: w,
    height: h,
  }
}

export function spawnCoupon(): CouponToken {
  return {
    id: `coup-${Date.now()}`,
    lane: Math.floor(Math.random() * 3) as Lane,
    y: -20,
    collected: false,
  }
}

export function tickObjects(
  objects: GameObjects,
  delta: number,
  elapsed: number
): GameObjects {
  const obstacles = objects.obstacles
    .map(o => ({ ...o, y: o.y + o.speed * delta }))
    .filter(o => o.y < PLAYER_Y)

  const coupons = objects.coupons
    .map(c => ({ ...c, y: c.y + 120 * delta }))
    .filter(c => c.y < CANVAS_HEIGHT + 40 && !c.collected)

  const shouldSpawnCoupon = elapsed - objects.lastCouponSpawn >= 20
  const lastCouponSpawn = shouldSpawnCoupon ? elapsed : objects.lastCouponSpawn
  const newCoupons = shouldSpawnCoupon ? [...coupons, spawnCoupon()] : coupons

  const spawnInterval = Math.max(0.8, 2.0 - elapsed * 0.01)
  const nextObstacleIn = objects.nextObstacleIn - delta
  const shouldSpawnObstacle = nextObstacleIn <= 0
  const newObstacles = shouldSpawnObstacle
    ? [...obstacles, spawnObstacle(elapsed)]
    : obstacles

  return {
    obstacles: newObstacles,
    coupons: newCoupons,
    lastCouponSpawn,
    nextObstacleIn: shouldSpawnObstacle ? spawnInterval : nextObstacleIn,
  }
}

export function checkCollisions(
  objects: GameObjects,
  playerLane: Lane,
  canvasWidth: number
): { hitObstacle: boolean; hitCouponId: string | null } {
  const laneWidth = canvasWidth / 3
  const playerX = playerLane * laneWidth + (laneWidth - PLAYER_WIDTH) / 2

  const hitObstacle = objects.obstacles.some(o => {
    // Lane number is the source of truth for X — no cross-lane bleed
    if (o.lane !== playerLane) return false
    // Only check Y overlap — obstacle top/bottom vs player top/bottom with insets
    const pTop = PLAYER_Y + HIT_INSET_TOP
    const pBottom = PLAYER_Y + PLAYER_HEIGHT - HIT_INSET_BOTTOM
    const oTop = o.y + o.height * 0.1
    const oBottom = o.y + o.height * 0.9
    return pTop < oBottom && pBottom > oTop
  })

  const hitCoupon = objects.coupons.find(c => {
    if (c.lane !== playerLane || c.collected) return false
    const cX = c.lane * laneWidth + laneWidth / 2
    return (
      playerX < cX + 14 &&
      playerX + PLAYER_WIDTH > cX - 14 &&
      PLAYER_Y < c.y + 14 &&
      PLAYER_Y + PLAYER_HEIGHT > c.y - 14
    )
  })

  return { hitObstacle, hitCouponId: hitCoupon?.id ?? null }
}
