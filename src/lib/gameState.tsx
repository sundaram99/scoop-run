'use client'

import { createContext, useContext, useReducer, ReactNode } from 'react'
import { GameState, GameAction } from '@/types/game'

const INITIAL: GameState = {
  phase: 'intro',
  score: 0,
  crashes: 0,
  coupons: 0,
  elapsed: 0,
  lane: 1,
  activeLandmark: null,
  activeZone: null,
  crashedIntoType: null,
  gemsThisRun: [],
}

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START':
      return { ...INITIAL, phase: 'playing' }
    case 'TICK': {
      const newElapsed = state.elapsed + action.delta
      const secondsCrossed = Math.floor(newElapsed) - Math.floor(state.elapsed)
      return { ...state, elapsed: newElapsed, score: Math.max(0, state.score + secondsCrossed) }
    }
    case 'MOVE_LANE':
      return { ...state, lane: action.lane }
    case 'COLLECT_COUPON':
      return { ...state, score: state.score + 100, coupons: state.coupons + 1 }
    case 'CRASH':
      return {
        ...state,
        phase: 'crashed',
        score: Math.max(0, state.score - 50),
        crashes: state.crashes + 1,
        crashedIntoType: action.obstacleType,
      }
    case 'RECOVER':
      return { ...state, phase: 'playing', crashedIntoType: null }
    case 'SHOW_LANDMARK':
      return { ...state, activeLandmark: action.text }
    case 'CLEAR_LANDMARK':
      return { ...state, activeLandmark: null }
    case 'SHOW_ZONE':
      return { ...state, activeZone: action.zone }
    case 'CLEAR_ZONE':
      return { ...state, activeZone: null }
    case 'COLLECT_GEM':
      return {
        ...state,
        score: state.score + 50,
        gemsThisRun: state.gemsThisRun.includes(action.gemId)
          ? state.gemsThisRun
          : [...state.gemsThisRun, action.gemId],
      }
    case 'END_GAME':
      return { ...state, phase: 'done' }
    default:
      return state
  }
}

const GameContext = createContext<{
  state: GameState
  dispatch: React.Dispatch<GameAction>
} | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL)
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGameState() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGameState must be used inside GameProvider')
  return ctx
}
