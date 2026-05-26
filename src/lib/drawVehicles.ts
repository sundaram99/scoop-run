import { CANVAS_TOKENS } from './tokens'
import { Obstacle, CouponToken } from './gameLoop'
import { Lane } from '@/types/game'

const LANE_COUNT = 3

// All drawing is top-down. x/y is the center-top of the vehicle.

export function drawRoad(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  // Road surface
  ctx.fillStyle = CANVAS_TOKENS.roadSurface
  ctx.fillRect(0, 0, width, height)

  // Dashed lane dividers
  const laneW = width / LANE_COUNT
  ctx.setLineDash([18, 14])
  ctx.strokeStyle = CANVAS_TOKENS.roadLine
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.35
  for (let i = 1; i < LANE_COUNT; i++) {
    ctx.beginPath()
    ctx.moveTo(i * laneW, 0)
    ctx.lineTo(i * laneW, height)
    ctx.stroke()
  }
  ctx.setLineDash([])
  ctx.globalAlpha = 1
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  lane: Lane,
  laneWidth: number,
  playerY: number
) {
  const cx = lane * laneWidth + laneWidth / 2
  const W = 28   // vehicle width
  const H = 52   // vehicle height
  const x = cx - W / 2

  // Drop shadow
  ctx.fillStyle = 'rgba(26,10,46,0.12)'
  ctx.beginPath()
  ctx.ellipse(cx, playerY + H + 4, W / 2 + 2, 5, 0, 0, Math.PI * 2)
  ctx.fill()

  // Front wheel
  ctx.fillStyle = '#1A0A2E'
  roundRect(ctx, cx - 10, playerY, 20, 18, 9)
  ctx.fillStyle = '#4C1D95'
  roundRect(ctx, cx - 7, playerY + 3, 14, 12, 6)

  // Body
  ctx.fillStyle = CANVAS_TOKENS.accent
  roundRect(ctx, x, playerY + 14, W, H - 28, 10)

  // Side footrests
  ctx.fillStyle = '#5B21B6'
  roundRect(ctx, x - 8, playerY + 22, 10, 7, 3)
  roundRect(ctx, x + W - 2, playerY + 22, 10, 7, 3)

  // Rear wheel
  ctx.fillStyle = '#1A0A2E'
  roundRect(ctx, cx - 10, playerY + H - 18, 20, 18, 9)
  ctx.fillStyle = '#4C1D95'
  roundRect(ctx, cx - 7, playerY + H - 15, 14, 12, 6)

  // Rider helmet (circle, top-down)
  ctx.fillStyle = '#1A0A2E'
  ctx.beginPath()
  ctx.arc(cx, playerY + 20, 11, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = CANVAS_TOKENS.accent
  ctx.beginPath()
  ctx.arc(cx, playerY + 20, 7, 0, Math.PI * 2)
  ctx.fill()
  // Visor strip
  ctx.fillStyle = 'rgba(26,10,46,0.5)'
  roundRect(ctx, cx - 6, playerY + 18, 12, 4, 2)

  // Delivery bag (rear)
  ctx.fillStyle = '#EDE5F7'
  ctx.strokeStyle = '#1A0A2E'
  ctx.lineWidth = 1.5
  roundRectStroke(ctx, cx - 11, playerY + H - 22, 22, 16, 4)
  ctx.fillStyle = CANVAS_TOKENS.accent
  ctx.font = 'bold 9px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Z', cx, playerY + H - 14)
}

export function drawObstacle(
  ctx: CanvasRenderingContext2D,
  obs: Obstacle,
  laneWidth: number
) {
  const cx = obs.lane * laneWidth + laneWidth / 2
  const x = cx - obs.width / 2

  if (obs.type === 'auto') {
    drawAuto(ctx, cx, obs.y, obs.width, obs.height)
  } else if (obs.type === 'car') {
    drawCar(ctx, cx, obs.y, obs.width, obs.height)
  } else {
    drawBike(ctx, cx, obs.y, obs.width, obs.height)
  }
}

// Top-down auto-rickshaw: squat, wide, yellow
function drawAuto(
  ctx: CanvasRenderingContext2D,
  cx: number, y: number, w: number, h: number
) {
  // Body
  ctx.fillStyle = '#D97706'
  roundRect(ctx, cx - w / 2, y, w, h, 6)
  // Roof (darker centre strip)
  ctx.fillStyle = '#B45309'
  roundRect(ctx, cx - w / 2 + 4, y + 6, w - 8, h - 12, 4)
  // Front wheels
  ctx.fillStyle = '#1A0A2E'
  roundRect(ctx, cx - w / 2 - 3, y + 2, 7, 10, 3)
  roundRect(ctx, cx + w / 2 - 4, y + 2, 7, 10, 3)
  // Rear wheel (single centre)
  roundRect(ctx, cx - 5, y + h - 10, 10, 10, 4)
}

// Top-down car: longer, sedan shape
function drawCar(
  ctx: CanvasRenderingContext2D,
  cx: number, y: number, w: number, h: number
) {
  // Body shell
  ctx.fillStyle = CANVAS_TOKENS.obstacleCar
  roundRect(ctx, cx - w / 2, y, w, h, 8)
  // Windshield (front)
  ctx.fillStyle = '#9B72CF'
  roundRect(ctx, cx - w / 2 + 5, y + 4, w - 10, 10, 3)
  // Rear window
  ctx.fillStyle = '#9B72CF'
  roundRect(ctx, cx - w / 2 + 5, y + h - 14, w - 10, 10, 3)
  // Wheels (4 corners)
  ctx.fillStyle = '#1A0A2E'
  roundRect(ctx, cx - w / 2 - 3, y + 4, 7, 12, 3)
  roundRect(ctx, cx + w / 2 - 4, y + 4, 7, 12, 3)
  roundRect(ctx, cx - w / 2 - 3, y + h - 16, 7, 12, 3)
  roundRect(ctx, cx + w / 2 - 4, y + h - 16, 7, 12, 3)
}

// Top-down bike: very narrow, elongated
function drawBike(
  ctx: CanvasRenderingContext2D,
  cx: number, y: number, w: number, h: number
) {
  // Body — thin oval
  ctx.fillStyle = CANVAS_TOKENS.obstacleBike
  roundRect(ctx, cx - w / 2, y, w, h, 9)
  // Rider helmet circle
  ctx.fillStyle = '#1A0A2E'
  ctx.beginPath()
  ctx.arc(cx, y + 10, 6, 0, Math.PI * 2)
  ctx.fill()
  // Front / rear wheel
  ctx.fillStyle = '#1A0A2E'
  roundRect(ctx, cx - 5, y, 10, 12, 5)
  roundRect(ctx, cx - 5, y + h - 12, 10, 12, 5)
}

export function drawCoupon(
  ctx: CanvasRenderingContext2D,
  token: CouponToken,
  laneWidth: number
) {
  if (token.collected) return
  const cx = token.lane * laneWidth + laneWidth / 2
  const cy = token.y

  // Gold glow
  ctx.fillStyle = 'rgba(245,158,11,0.2)'
  ctx.beginPath()
  ctx.arc(cx, cy, 18, 0, Math.PI * 2)
  ctx.fill()

  // Gold coin
  ctx.fillStyle = CANVAS_TOKENS.coupon
  ctx.beginPath()
  ctx.arc(cx, cy, 13, 0, Math.PI * 2)
  ctx.fill()

  // Inner ring
  ctx.strokeStyle = '#D97706'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(cx, cy, 9, 0, Math.PI * 2)
  ctx.stroke()

  // Rupee symbol
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 12px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('₹', cx, cy + 1)
}

// Helpers
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fill()
}

function roundRectStroke(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fill()
  ctx.stroke()
}
