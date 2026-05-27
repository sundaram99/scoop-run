'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useGameState } from '@/lib/gameState'
import { GameObjects, tickObjects, checkCollisions, Obstacle } from '@/lib/gameLoop'
import { CANVAS_TOKENS } from '@/lib/tokens'
import { loadSprites, drawSprite } from '@/lib/sprites'
import { Lane } from '@/types/game'
import { Zone, ZONES, checkZone } from '@/lib/zones'
import { pickRunGems, loadCollectedGems, saveCollectedGems, ALL_GEMS, GemSpawn } from '@/lib/gems'

const GAME_DURATION = 600
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

function laneCX(lane: Lane): number {
  return ROAD_X + lane * LANE_W + LANE_W / 2
}

function drawRoad(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = CANVAS_TOKENS.bg
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
  ctx.fillStyle = CANVAS_TOKENS.roadSurface
  ctx.fillRect(ROAD_X, 0, ROAD_W, CANVAS_H)
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

const PLAYER_RENDER_SIZE = Math.round((LANE_W - 4) * 0.70)
const OBSTACLE_RENDER_SIZE = Math.round((LANE_W - 6) * 0.70)

function drawPlayer(ctx: CanvasRenderingContext2D, lane: Lane, crashed: boolean) {
  const cx = laneX(lane) + PLAYER_W / 2
  const cy = PLAYER_Y + PLAYER_H / 2
  if (crashed) ctx.globalAlpha = 0.55
  drawSprite(ctx, 'player', cx - PLAYER_RENDER_SIZE / 2, cy - PLAYER_RENDER_SIZE / 2, PLAYER_RENDER_SIZE, PLAYER_RENDER_SIZE)
  ctx.globalAlpha = 1
}

function drawObstacleSprite(
  ctx: CanvasRenderingContext2D,
  obs: Obstacle,
) {
  if (!obs.sprite) return
  const cx = obs.lanes.length > 1
    ? ROAD_X + obs.lanes[0] * LANE_W + LANE_W  // bus: midpoint between 2 lanes
    : laneCX(obs.lanes[0])
  const size = obs.type === 'bus' ? OBSTACLE_RENDER_SIZE * 1.8 : OBSTACLE_RENDER_SIZE
  drawSprite(ctx, obs.sprite, cx - size / 2, obs.y, size, size)
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

function drawGem(ctx: CanvasRenderingContext2D, gem: GemSpawn) {
  const cx = laneCX(gem.lane)
  const cy = gem.y
  // Purple glow ring
  ctx.strokeStyle = '#7C3AED'
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.5
  ctx.beginPath()
  ctx.arc(cx, cy, 16, 0, Math.PI * 2)
  ctx.stroke()
  ctx.globalAlpha = 1
  // Gem body
  ctx.fillStyle = '#7C3AED'
  ctx.beginPath()
  ctx.arc(cx, cy, 11, 0, Math.PI * 2)
  ctx.fill()
  // Gem symbol
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 10px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('💎', cx, cy)
}

// Police character drawn during crashed phase (Layer 2)
function drawPolice(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Body — khaki
  ctx.fillStyle = '#A3A33A'
  ctx.beginPath()
  ctx.roundRect(x - 10, y + 18, 20, 26, 4)
  ctx.fill()
  // Head
  ctx.fillStyle = '#FBBF24'
  ctx.beginPath()
  ctx.arc(x, y + 12, 10, 0, Math.PI * 2)
  ctx.fill()
  // Cap
  ctx.fillStyle = '#1A0A2E'
  ctx.beginPath()
  ctx.roundRect(x - 11, y + 4, 22, 6, 2)
  ctx.fill()
  // Pointing arm
  ctx.strokeStyle = '#FBBF24'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(x + 10, y + 28)
  ctx.lineTo(x + 26, y + 22)
  ctx.stroke()
  // Whistle
  ctx.fillStyle = '#D97706'
  ctx.beginPath()
  ctx.arc(x + 26, y + 22, 3, 0, Math.PI * 2)
  ctx.fill()
}

// Vehicle-specific crash dialogue (Layer 2)
const CRASH_DIALOGUE: Record<string, string> = {
  auto:     'Aye! Meter jaega mera!',
  car:      'Do you know who I am?',
  bike:     "Bro chill, it's just a scratch",
  bus:      'Next stop: insurance claim',
  landlord: 'Damage deposit: ₹2 lakh',
  hiring:   'No experience handling crashes either?',
  tesla:    'My autopilot saw you coming',
}

export default function PlayPage() {
  const { state, dispatch } = useGameState()
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const objectsRef = useRef<GameObjects>({
    obstacles: [],
    coupons: [],
    gems: [],
    lastCouponSpawn: 0,
    nextObstacleIn: 1.5,
    trafficSpikeUntil: 0,
  })
  const zonesRef = useRef<Zone[]>(ZONES.map(z => ({ ...z })))
  const lastTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const crashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const spritesReadyRef = useRef(false)
  const stateRef = useRef(state)
  const gemFlashRef = useRef<{ name: string; until: number } | null>(null)
  stateRef.current = state

  useEffect(() => {
    loadSprites().then(() => { spritesReadyRef.current = true })
    // Pick 2 gems for this run
    objectsRef.current.gems = pickRunGems()
  }, [])

  const endGame = useCallback(() => {
    // Persist gems before navigating
    const existing = loadCollectedGems()
    const merged = Array.from(new Set([...existing, ...stateRef.current.gemsThisRun]))
    saveCollectedGems(merged)
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') moveLeft()
      if (e.key === 'ArrowRight') moveRight()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [moveLeft, moveRight])

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

      dispatch({ type: 'TICK', delta })
      const elapsed = s.elapsed + delta

      if (elapsed >= GAME_DURATION) { endGame(); return }

      objectsRef.current = tickObjects(objectsRef.current, delta, elapsed)

      // Zone check
      const zoneResult = checkZone(elapsed, zonesRef.current)
      if (zoneResult) {
        zonesRef.current = zoneResult.updated
        dispatch({ type: 'SHOW_ZONE', zone: { name: zoneResult.zone.name, oneliner: zoneResult.zone.oneliner, image: zoneResult.zone.image } })
        // Traffic spike
        if (zoneResult.zone.trafficSpike) {
          objectsRef.current = { ...objectsRef.current, trafficSpikeUntil: elapsed + 15 }
        }
        setTimeout(() => dispatch({ type: 'CLEAR_ZONE' }), 3000)
      }

      // Gem spawning — set y = -30 when spawnAt is crossed
      objectsRef.current = {
        ...objectsRef.current,
        gems: objectsRef.current.gems.map(g => {
          if (!g.collected && g.y === -30 && elapsed >= g.spawnAt) {
            return { ...g, y: -30 }
          }
          return g
        }),
      }

      const { hitObstacleType, hitCouponId, hitGemId } = checkCollisions(
        objectsRef.current, s.lane, ROAD_W
      )

      if (hitObstacleType && s.phase === 'playing') {
        dispatch({ type: 'CRASH', obstacleType: hitObstacleType })
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

      if (hitGemId !== null) {
        const gem = ALL_GEMS.find(g => g.id === hitGemId)
        objectsRef.current = {
          ...objectsRef.current,
          gems: objectsRef.current.gems.map(g =>
            g.gemId === hitGemId ? { ...g, collected: true } : g
          ),
        }
        dispatch({ type: 'COLLECT_GEM', gemId: hitGemId })
        if (gem) gemFlashRef.current = { name: gem.name, until: ts + 2000 }
      }

      // Draw
      if (!ctx || !canvas) return
      drawRoad(ctx)

      // Obstacles
      objectsRef.current.obstacles.forEach(o => {
        drawObstacleSprite(ctx, o)
      })

      // Coupons
      objectsRef.current.coupons.forEach(c => {
        drawCoupon(ctx, laneCX(c.lane), c.y)
      })

      // Gems (only those that have reached spawnAt)
      objectsRef.current.gems.forEach(g => {
        if (!g.collected && elapsed >= g.spawnAt) {
          drawGem(ctx, g)
        }
      })

      // Police overlay during crash (Layer 2)
      if (stateRef.current.phase === 'crashed') {
        drawPolice(ctx, CANVAS_W / 2 - 60, CANVAS_H / 2 - 40)
      }

      // Gem flash text
      if (gemFlashRef.current && ts < gemFlashRef.current.until) {
        ctx.fillStyle = '#7C3AED'
        ctx.font = 'bold 18px var(--font-display, sans-serif)'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${gemFlashRef.current.name} found!`, CANVAS_W / 2, CANVAS_H / 2 - 80)
      } else if (gemFlashRef.current && ts >= gemFlashRef.current.until) {
        gemFlashRef.current = null
      }

      drawPlayer(ctx, s.lane, stateRef.current.phase === 'crashed')

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lastTimeRef.current = null
    }
  }, [state.phase, dispatch, endGame])

  useEffect(() => {
    if (state.phase === 'intro') router.replace('/game')
    if (state.phase === 'done') router.replace('/game/score')
  }, [state.phase, router])

  const timeLeft = Math.max(0, GAME_DURATION - Math.floor(state.elapsed))
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs = String(timeLeft % 60).padStart(2, '0')

  const crashDialogue = state.crashedIntoType ? CRASH_DIALOGUE[state.crashedIntoType] : null

  return (
    <div className="flex flex-col items-center"
      style={{ background: CANVAS_TOKENS.bg, height: '100svh', overflow: 'hidden' }}>

      {/* HUD */}
      <div className="w-full flex items-center justify-between px-5 py-3" style={{ maxWidth: CANVAS_W }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--color-text)' }}>
          Scoop Run
        </span>
        <div className="flex items-center gap-3">
          <span style={{
            fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15,
            color: timeLeft <= 10 ? CANVAS_TOKENS.dare : 'var(--color-text)',
            letterSpacing: '0.05em',
          }}>
            {mins}:{secs}
          </span>
          <span className="px-3 py-1 rounded-full" style={{
            fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15,
            background: 'var(--color-accent)', color: '#fff', letterSpacing: '0.05em',
          }}>
            {state.score.toString().padStart(6, '0')}
          </span>
          <button onClick={endGame} style={{
            width: 32, height: 32, borderRadius: '50%', border: 'none',
            background: 'var(--color-surface)', cursor: 'pointer',
            fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative" style={{ width: CANVAS_W }}>
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} style={{ display: 'block' }} />

        {/* Crash overlay */}
        {state.phase === 'crashed' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-2"
            style={{ background: 'rgba(240,67,106,0.18)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: CANVAS_TOKENS.dare }}>
              💥 Crash!
            </span>
            {crashDialogue && (
              <div className="px-4 py-2 rounded-xl" style={{
                background: '#1A0A2E', color: '#fff',
                fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13,
                maxWidth: 240, textAlign: 'center',
              }}>
                "{crashDialogue}"
              </div>
            )}
          </div>
        )}

        {/* Zone banner — slides in from left */}
        {state.activeZone && (
          <div className="absolute left-0 right-0 flex pointer-events-none"
            style={{ top: '15%' }}>
            <div className="rounded-r-xl flex items-center gap-2"
              style={{
                background: '#7C3AED',
                animation: 'slideInZone 0.3s ease-out',
                padding: '8px 14px 8px 10px',
                maxWidth: 240,
              }}>
              {state.activeZone.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={state.activeZone.image} alt="" width={44} height={44}
                  style={{ borderRadius: 6, flexShrink: 0, objectFit: 'cover' }} />
              )}
              <div className="flex flex-col gap-0.5">
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: '#fff' }}>
                  {state.activeZone.name}
                </span>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 10, color: 'rgba(255,255,255,0.85)' }}>
                  {state.activeZone.oneliner}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lane controls */}
      <div className="flex justify-between w-full px-6 py-4" style={{ maxWidth: CANVAS_W }}>
        <button onPointerDown={moveLeft} className="active:scale-90 transition-transform"
          style={{ width: 64, height: 64, borderRadius: '50%', border: 'none', background: 'var(--color-surface)', cursor: 'pointer', fontSize: 24 }}>
          ←
        </button>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-muted)', alignSelf: 'center' }}>
          swipe or tap
        </div>
        <button onPointerDown={moveRight} className="active:scale-90 transition-transform"
          style={{ width: 64, height: 64, borderRadius: '50%', border: 'none', background: 'var(--color-surface)', cursor: 'pointer', fontSize: 24 }}>
          →
        </button>
      </div>
    </div>
  )
}
