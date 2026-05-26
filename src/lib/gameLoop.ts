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

const CANVAS_HEIGHT = 600
const PLAYER_Y = CANVAS_HEIGHT - 120
const PLAYER_HEIGHT = 60
const PLAYER_WIDTH = 36

export function getObstacleSpeed(elapsed: number): number {
  return Math.min(350, 150 + Math.floor(elapsed / 30) * 10)
}

export function spawnObstacle(elapsed: number): Obstacle {
  const types: Obstacle['type'][] = ['auto', 'car', 'bike']
  const type = types[Math.floor(Math.random() * types.length)]
  const dims: Record<Obstacle['type'], [number, number]> = {
    auto: [28, 44],
    car: [32, 52],
    bike: [20, 38],
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
    .filter(o => o.y < CANVAS_HEIGHT + 100)

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
    if (o.lane !== playerLane) return false
    const oX = o.lane * laneWidth + (laneWidth - o.width) / 2
    return (
      playerX < oX + o.width &&
      playerX + PLAYER_WIDTH > oX &&
      PLAYER_Y < o.y + o.height &&
      PLAYER_Y + PLAYER_HEIGHT > o.y
    )
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
