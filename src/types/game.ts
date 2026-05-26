export type Lane = 0 | 1 | 2
export type GamePhase = 'intro' | 'playing' | 'crashed' | 'done'

export interface GameState {
  phase: GamePhase
  score: number
  crashes: number
  coupons: number
  elapsed: number
  lane: Lane
  activeLandmark: string | null
}

export type GameAction =
  | { type: 'START' }
  | { type: 'TICK'; delta: number }
  | { type: 'MOVE_LANE'; lane: Lane }
  | { type: 'COLLECT_COUPON' }
  | { type: 'CRASH' }
  | { type: 'RECOVER' }
  | { type: 'SHOW_LANDMARK'; text: string }
  | { type: 'CLEAR_LANDMARK' }
  | { type: 'END_GAME' }

// Canvas roundRect polyfill declaration
declare global {
  interface CanvasRenderingContext2D {
    roundRect(x: number, y: number, w: number, h: number, r: number): void
  }
}
