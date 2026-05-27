import { ObstacleType } from '@/lib/gameLoop'

export type Lane = 0 | 1 | 2
export type GamePhase = 'intro' | 'playing' | 'crashed' | 'done'

export interface ActiveZone {
  name: string
  oneliner: string
  image: string | null
}

export interface GameState {
  phase: GamePhase
  score: number
  crashes: number
  coupons: number
  elapsed: number
  lane: Lane
  activeLandmark: string | null   // kept for backward compat — used for zone banner text
  activeZone: ActiveZone | null
  crashedIntoType: ObstacleType | null
  gemsThisRun: number[]           // gem IDs collected this run
}

export type GameAction =
  | { type: 'START' }
  | { type: 'TICK'; delta: number }
  | { type: 'MOVE_LANE'; lane: Lane }
  | { type: 'COLLECT_COUPON' }
  | { type: 'CRASH'; obstacleType: ObstacleType }
  | { type: 'RECOVER' }
  | { type: 'SHOW_LANDMARK'; text: string }
  | { type: 'CLEAR_LANDMARK' }
  | { type: 'SHOW_ZONE'; zone: ActiveZone }
  | { type: 'CLEAR_ZONE' }
  | { type: 'COLLECT_GEM'; gemId: number }
  | { type: 'END_GAME' }

// Canvas roundRect polyfill declaration
declare global {
  interface CanvasRenderingContext2D {
    roundRect(x: number, y: number, w: number, h: number, r: number): void
  }
}
