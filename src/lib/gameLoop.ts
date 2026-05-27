import { Lane } from '@/types/game'
import { SpriteKey } from './sprites'
import { GemSpawn } from './gems'

export type ObstacleType = 'auto' | 'car' | 'bike' | 'bus' | 'landlord' | 'hiring' | 'tesla'

export interface Obstacle {
  id: string
  lanes: Lane[]       // multi-lane for bus; single-element for all others
  y: number
  speed: number
  type: ObstacleType
  sprite: SpriteKey | null
  width: number
  height: number
  // tesla only — countdown to next lane switch
  teslaSwitchIn?: number
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
  gems: GemSpawn[]
  lastCouponSpawn: number
  nextObstacleIn: number
  trafficSpikeUntil: number  // elapsed time when spike ends (0 = no spike)
}

const CANVAS_HEIGHT = 700
const PLAYER_RENDERED_H = 46
const PLAYER_CENTER_Y = 604
const PLAYER_Y = PLAYER_CENTER_Y - PLAYER_RENDERED_H / 2  // 581
const PLAYER_HEIGHT = PLAYER_RENDERED_H
const PLAYER_WIDTH = Math.round(159 * (46 / 357))  // 20

const HIT_INSET_TOP = 10
const HIT_INSET_BOTTOM = 10

export function getBaseSpeed(elapsed: number): number {
  return Math.min(350, 150 + Math.floor(elapsed / 30) * 10)
}

// Sprites available per obstacle type — picked randomly at spawn
const SPRITE_OPTIONS: Partial<Record<ObstacleType, SpriteKey[]>> = {
  auto:     ['auto'],
  car:      ['car-grey', 'car-red', 'car-red2', 'car-open'],
  bike:     ['bike', 'bike2', 'cyclist'],
  bus:      ['bus'],
  landlord: ['landlord'],
  hiring:   ['hiring'],
  tesla:    ['tesla'],
}

// Base spawn weights — landlord/hiring are gated by elapsed time, not in base pool
const SPAWN_WEIGHTS: { type: ObstacleType; weight: number }[] = [
  { type: 'auto',     weight: 3   },
  { type: 'car',      weight: 3   },
  { type: 'bike',     weight: 2   },
  { type: 'tesla',    weight: 1   },
  { type: 'bus',      weight: 0.1 },
]

// Landlord: Koramangala (60s) + HSR Layout (150s) only → off at 240s
// Hiring: Marathahalli (240s) + Sarjapur (360s) only → off at 480s
function getSpawnWeights(elapsed: number): { type: ObstacleType; weight: number }[] {
  const weights = [...SPAWN_WEIGHTS]
  if (elapsed >= 60  && elapsed < 240) weights.push({ type: 'landlord', weight: 0.5 })
  if (elapsed >= 240 && elapsed < 480) weights.push({ type: 'hiring',   weight: 0.5 })
  return weights
}

function pickWeightedType(elapsed: number): ObstacleType {
  const weights = getSpawnWeights(elapsed)
  const total = weights.reduce((s, w) => s + w.weight, 0)
  let r = Math.random() * total
  for (const { type, weight } of weights) {
    r -= weight
    if (r <= 0) return type
  }
  return 'car'
}

export function spawnObstacle(elapsed: number): Obstacle {
  const type = pickWeightedType(elapsed)
  const base = getBaseSpeed(elapsed)

  const speedMult: Record<ObstacleType, number> = {
    auto: 1.0, car: 1.0, bike: 1.2,
    bus: 0.6, landlord: 1.0, hiring: 0.8, tesla: 1.0,
  }
  const speed = base * speedMult[type]

  // Bus occupies 2 adjacent lanes
  let lanes: Lane[]
  if (type === 'bus') {
    const startLane = Math.random() < 0.5 ? 0 : 1
    lanes = [startLane, startLane + 1] as Lane[]
  } else if (type === 'tesla') {
    lanes = [Math.floor(Math.random() * 3) as Lane]
  } else {
    lanes = [Math.floor(Math.random() * 3) as Lane]
  }

  const options = SPRITE_OPTIONS[type]
  const sprite = options
    ? options[Math.floor(Math.random() * options.length)]
    : null

  const dims: Record<ObstacleType, [number, number]> = {
    auto:     [13, 45],
    car:      [25, 45],
    bike:     [20, 45],
    bus:      [50, 80],
    landlord: [22, 45],
    hiring:   [30, 30],
    tesla:    [25, 45],
  }
  const [w, h] = dims[type]

  return {
    id: `obs-${Date.now()}-${Math.random()}`,
    lanes,
    y: -h,
    speed,
    type,
    sprite,
    width: w,
    height: h,
    ...(type === 'tesla' ? { teslaSwitchIn: 3 + Math.random() } : {}),
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
  const inSpike = elapsed < objects.trafficSpikeUntil

  // Move obstacles; tick tesla lane switches
  const obstacles = objects.obstacles
    .map(o => {
      let updated = { ...o, y: o.y + o.speed * delta }
      if (o.type === 'tesla' && o.teslaSwitchIn !== undefined) {
        const switchIn = o.teslaSwitchIn - delta
        if (switchIn <= 0) {
          const newLane = Math.floor(Math.random() * 3) as Lane
          updated = { ...updated, lanes: [newLane], teslaSwitchIn: 3 + Math.random() }
        } else {
          updated = { ...updated, teslaSwitchIn: switchIn }
        }
      }
      return updated
    })
    .filter(o => o.y < PLAYER_Y + 60)

  // Move coupons
  const coupons = objects.coupons
    .map(c => ({ ...c, y: c.y + 120 * delta }))
    .filter(c => c.y < CANVAS_HEIGHT + 40 && !c.collected)

  // Move active gems (only those already spawned)
  const gems = objects.gems.map(g => {
    if (g.collected || elapsed < g.spawnAt) return g
    return { ...g, y: g.y + 80 * delta }
  }).filter(g => g.collected || elapsed < g.spawnAt || g.y < CANVAS_HEIGHT + 40)

  // Coupon spawn
  const shouldSpawnCoupon = elapsed - objects.lastCouponSpawn >= 20
  const lastCouponSpawn = shouldSpawnCoupon ? elapsed : objects.lastCouponSpawn
  const newCoupons = shouldSpawnCoupon ? [...coupons, spawnCoupon()] : coupons

  // Obstacle spawn — halved interval during traffic spike
  const baseInterval = Math.max(0.8, 2.0 - elapsed * 0.01)
  const spawnInterval = inSpike ? baseInterval / 2 : baseInterval
  const nextObstacleIn = objects.nextObstacleIn - delta
  const shouldSpawnObstacle = nextObstacleIn <= 0
  const newObstacles = shouldSpawnObstacle
    ? [...obstacles, spawnObstacle(elapsed)]
    : obstacles

  return {
    obstacles: newObstacles,
    coupons: newCoupons,
    gems,
    lastCouponSpawn,
    nextObstacleIn: shouldSpawnObstacle ? spawnInterval : nextObstacleIn,
    trafficSpikeUntil: objects.trafficSpikeUntil,
  }
}

export function checkCollisions(
  objects: GameObjects,
  playerLane: Lane,
  canvasWidth: number
): { hitObstacleType: ObstacleType | null; hitCouponId: string | null; hitGemId: number | null } {
  const laneWidth = canvasWidth / 3
  const playerX = playerLane * laneWidth + (laneWidth - PLAYER_WIDTH) / 2

  let hitObstacleType: ObstacleType | null = null
  for (const o of objects.obstacles) {
    if (o.type === 'landlord' || o.type === 'hiring') continue  // side-rendered, no collision
    if (!o.lanes.includes(playerLane)) continue
    const pTop = PLAYER_Y + HIT_INSET_TOP
    const pBottom = PLAYER_Y + PLAYER_HEIGHT - HIT_INSET_BOTTOM
    const oTop = o.y + o.height * 0.1
    const oBottom = o.y + o.height * 0.9
    if (pTop < oBottom && pBottom > oTop) {
      hitObstacleType = o.type
      break
    }
  }

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

  // Gem collision — only gems that have spawned and not yet collected
  const hitGem = objects.gems.find(g => {
    if (g.collected || g.lane !== playerLane) return false
    const gX = g.lane * laneWidth + laneWidth / 2
    return (
      playerX < gX + 20 &&
      playerX + PLAYER_WIDTH > gX - 20 &&
      PLAYER_Y < g.y + 20 &&
      PLAYER_Y + PLAYER_HEIGHT > g.y - 20
    )
  })

  return {
    hitObstacleType,
    hitCouponId: hitCoupon?.id ?? null,
    hitGemId: hitGem?.gemId ?? null,
  }
}
