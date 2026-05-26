'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useGameState } from '@/lib/gameState'
import { GameObjects, tickObjects, checkCollisions } from '@/lib/gameLoop'
import { getNewLandmark, Landmark, LANDMARKS } from '@/lib/landmarks'
import { CANVAS_TOKENS } from '@/lib/tokens'
import { loadSprites, drawSprite } from '@/lib/sprites'
import { Lane } from '@/types/game'

const GAME_DURATION = 600 // 10 minutes
const CANVAS_W = 390
const CANVAS_H = 700
const ROAD_X = 90
const ROAD_W = 210
const LANE_W = ROAD_W / 3
const PLAYER_W = 28
const PLAYER_H = 48
const PLAYER_Y = CANVAS_H - 120

function laneX(lane: Lane): number {
  return ROAD_X + lane * LANE_W + (LANE_W - PLAYER_W) / 2
}

function drawRoad(ctx: CanvasRenderingContext2D) {
  // Gutters
  ctx.fillStyle = CANVAS_TOKENS.bg
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  // Road surface
  ctx.fillStyle = CANVAS_TOKENS.roadSurface
  ctx.fillRect(ROAD_X, 0, ROAD_W, CANVAS_H)

  // Lane dividers — dashed white
  ctx.strokeStyle = CANVAS_TOKENS.roadLine
  ctx.lineWidth = 2
  ctx.setLineDash([18, 12])
  ctx.globalAlpha = 0.55
  for (let i = 1; i < 3; i++) {
    const x = ROAD_X + i * LANE_W
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, CANVAS_H)
    ctx.stroke()
  }
  ctx.setLineDash([])
  ctx.globalAlpha = 1
}

// After 90° rotation: sprite source is wider-than-tall, so rotated result is taller-than-wide.
// We pass the LANE_W as the width budget, drawSprite scales to fill that width.
const PLAYER_RENDER_SIZE = Math.round((LANE_W - 4) * 0.70)  // 70% of original
const OBSTACLE_RENDER_SIZE = Math.round((LANE_W - 6) * 0.70)  // 70% of original size

function drawPlayer(ctx: CanvasRenderingContext2D, lane: Lane, crashed: boolean) {
  const cx = laneX(lane) + PLAYER_W / 2
  const cy = PLAYER_Y + PLAYER_H / 2
  if (crashed) ctx.globalAlpha = 0.55
  // Pass a square bounding box equal to lane width — drawSprite preserves aspect ratio within it
  drawSprite(ctx, 'player', cx - PLAYER_RENDER_SIZE / 2, cy - PLAYER_RENDER_SIZE / 2, PLAYER_RENDER_SIZE, PLAYER_RENDER_SIZE)
  ctx.globalAlpha = 1
}

function drawObstacle(
  ctx: CanvasRenderingContext2D,
  type: 'auto' | 'car' | 'bike',
  x: number, y: number, w: number, h: number
) {
  const spriteMap: Record<string, 'auto' | 'car-grey' | 'car-red' | 'bike'> = {
    auto: 'auto',
    car:  'car-grey',
    bike: 'bike',
  }
  const cx = x + w / 2
  const cy = y + h / 2
  drawSprite(ctx, spriteMap[type], cx - OBSTACLE_RENDER_SIZE / 2, cy - OBSTACLE_RENDER_SIZE / 2, OBSTACLE_RENDER_SIZE, OBSTACLE_RENDER_SIZE)
}

function drawCoupon(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.fillStyle = CANVAS_TOKENS.coupon
  ctx.beginPath()
  ctx.arc(cx, cy, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 11px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('%', cx, cy)
}

export default function PlayPage() {
  const { state, dispatch } = useGameState()
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const objectsRef = useRef<GameObjects>({
    obstacles: [],
    coupons: [],
    lastCouponSpawn: 0,
    nextObstacleIn: 1.5,
  })
  const landmarksRef = useRef<Landmark[]>(LANDMARKS.map(l => ({ ...l })))
  const lastTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const crashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const spritesReadyRef = useRef(false)
  const stateRef = useRef(state)
  stateRef.current = state

  // Load sprite sheet once on mount
  useEffect(() => {
    loadSprites().then(() => { spritesReadyRef.current = true })
  }, [])

  const endGame = useCallback(() => {
    dispatch({ type: 'END_GAME' })
    router.push('/game/score')
  }, [dispatch, router])

  const moveLeft = useCallback(() => {
    const lane = stateRef.current.lane
    if (lane > 0) dispatch({ type: 'MOVE_LANE', lane: (lane - 1) as Lane })
  }, [dispatch])

  const moveRight = useCallback(() => {
    const lane = stateRef.current.lane
    if (lane < 2) dispatch({ type: 'MOVE_LANE', lane: (lane + 1) as Lane })
  }, [dispatch])

  // Touch swipe
  useEffect(() => {
    let startX = 0
    const onTouchStart = (e: TouchEvent) => { startX = e.touches[0].clientX }
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX
      if (Math.abs(dx) > 30) dx < 0 ? moveLeft() : moveRight()
    }
    window.addEventListener('touchstart', onTouchStart)
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [moveLeft, moveRight])

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') moveLeft()
      if (e.key === 'ArrowRight') moveRight()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [moveLeft, moveRight])

  // Game loop
  useEffect(() => {
    if (state.phase !== 'playing') return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function loop(ts: number) {
      const delta = lastTimeRef.current === null ? 0 : (ts - lastTimeRef.current) / 1000
      lastTimeRef.current = ts

      const s = stateRef.current
      if (s.phase !== 'playing') return

      // Tick state
      dispatch({ type: 'TICK', delta })

      const elapsed = s.elapsed + delta

      // Check game end
      if (elapsed >= GAME_DURATION) {
        endGame()
        return
      }

      // Tick objects
      objectsRef.current = tickObjects(objectsRef.current, delta, elapsed)

      // Check collisions
      const { hitObstacle, hitCouponId } = checkCollisions(
        objectsRef.current, s.lane, ROAD_W
      )

      if (hitObstacle && s.phase === 'playing') {
        dispatch({ type: 'CRASH' })
        if (crashTimerRef.current) clearTimeout(crashTimerRef.current)
        crashTimerRef.current = setTimeout(() => dispatch({ type: 'RECOVER' }), 1200)
      }

      if (hitCouponId) {
        objectsRef.current = {
          ...objectsRef.current,
          coupons: objectsRef.current.coupons.map(c =>
            c.id === hitCouponId ? { ...c, collected: true } : c
          ),
        }
        dispatch({ type: 'COLLECT_COUPON' })
      }

      // Landmarks
      const lmResult = getNewLandmark(elapsed, landmarksRef.current)
      if (lmResult) {
        landmarksRef.current = lmResult.updated
        dispatch({ type: 'SHOW_LANDMARK', text: lmResult.text })
        setTimeout(() => dispatch({ type: 'CLEAR_LANDMARK' }), 2500)
      }

      // Draw
      if (!ctx || !canvas) return
      drawRoad(ctx)

      // Obstacles
      objectsRef.current.obstacles.forEach(o => {
        const ox = ROAD_X + o.lane * LANE_W + (LANE_W - o.width) / 2
        drawObstacle(ctx, o.type, ox, o.y, o.width, o.height)
      })

      // Coupons
      objectsRef.current.coupons.forEach(c => {
        const cx = ROAD_X + c.lane * LANE_W + LANE_W / 2
        drawCoupon(ctx, cx, c.y)
      })

      // Player — read phase fresh to catch crashed state set this tick
      drawPlayer(ctx, s.lane, stateRef.current.phase === 'crashed')

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lastTimeRef.current = null
    }
  }, [state.phase, dispatch, endGame])

  // Redirect if not playing
  useEffect(() => {
    if (state.phase === 'intro') router.replace('/game')
    if (state.phase === 'done') router.replace('/game/score')
  }, [state.phase, router])

  const timeLeft = Math.max(0, GAME_DURATION - Math.floor(state.elapsed))
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs = String(timeLeft % 60).padStart(2, '0')

  return (
    <div className="flex flex-col items-center"
      style={{ background: CANVAS_TOKENS.bg, height: '100svh', overflow: 'hidden' }}>

      {/* HUD */}
      <div className="w-full flex items-center justify-between px-5 py-3"
        style={{ maxWidth: CANVAS_W }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16,
          color: 'var(--color-text)'
        }}>
          Scoop Run
        </span>
        <div className="flex items-center gap-3">
          {/* Timer */}
          <span style={{
            fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15,
            color: timeLeft <= 10 ? CANVAS_TOKENS.dare : 'var(--color-text)',
            letterSpacing: '0.05em',
          }}>
            {mins}:{secs}
          </span>
          {/* Score */}
          <span className="px-3 py-1 rounded-full"
            style={{
              fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15,
              background: 'var(--color-accent)', color: '#fff',
              letterSpacing: '0.05em',
            }}>
            {state.score.toString().padStart(6, '0')}
          </span>
          {/* Quit */}
          <button
            onClick={endGame}
            style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none',
              background: 'var(--color-surface)', cursor: 'pointer',
              fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            ✕
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative" style={{ width: CANVAS_W }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: 'block' }}
        />

        {/* Crash overlay */}
        {state.phase === 'crashed' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ background: 'rgba(240,67,106,0.18)' }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32,
              color: CANVAS_TOKENS.dare,
            }}>
              💥 Crash!
            </span>
          </div>
        )}

        {/* Landmark toast */}
        {state.activeLandmark && (
          <div className="absolute left-4 right-4 flex justify-center pointer-events-none"
            style={{ top: '40%' }}>
            <div className="px-4 py-2 rounded-xl"
              style={{
                background: '#1A0A2E', color: '#fff',
                fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13,
                maxWidth: 260, textAlign: 'center',
              }}>
              {state.activeLandmark}
            </div>
          </div>
        )}
      </div>

      {/* Lane controls */}
      <div className="flex justify-between w-full px-6 py-4" style={{ maxWidth: CANVAS_W }}>
        <button
          onPointerDown={moveLeft}
          className="active:scale-90 transition-transform"
          style={{
            width: 64, height: 64, borderRadius: '50%', border: 'none',
            background: 'var(--color-surface)', cursor: 'pointer', fontSize: 24,
          }}>
          ←
        </button>
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-muted)',
          alignSelf: 'center',
        }}>
          swipe or tap
        </div>
        <button
          onPointerDown={moveRight}
          className="active:scale-90 transition-transform"
          style={{
            width: 64, height: 64, borderRadius: '50%', border: 'none',
            background: 'var(--color-surface)', cursor: 'pointer', fontSize: 24,
          }}>
          →
        </button>
      </div>
    </div>
  )
}
