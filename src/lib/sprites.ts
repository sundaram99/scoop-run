// Precise sprite bounds measured from the 1536×1024 sheet
interface SpriteBounds { sx: number; sy: number; sw: number; sh: number }

const SPRITES: Record<string, SpriteBounds> = {
  'player':   { sx: 121,  sy: 302, sw: 159, sh: 357 },
  'auto':     { sx: 381,  sy: 304, sw: 196, sh: 357 },
  'car-grey': { sx: 682,  sy: 289, sw: 183, sh: 376 },
  'car-red':  { sx: 974,  sy: 297, sw: 187, sh: 368 },
  'bike':     { sx: 1243, sy: 305, sw: 152, sh: 331 },
}

export type SpriteKey = keyof typeof SPRITES

let spriteSheet: HTMLImageElement | null = null

export function loadSprites(): Promise<HTMLImageElement> {
  if (spriteSheet) return Promise.resolve(spriteSheet)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => { spriteSheet = img; resolve(img) }
    img.onerror = reject
    img.src = '/sprites.png'
  })
}

// In the sprite sheet: player/cars/bike all face UP. Auto faces DOWN.
// On screen obstacles must face DOWN (direction of travel). Player must face UP.
// So: player no flip needed for direction, but we flip to reverse it to face up on a down-scrolling road.
// Cars and bike: flip so they face down.
// Auto: already faces down, no flip.
const SPRITE_FLIP: Record<string, boolean> = {
  'player':   true,   // faces up in sheet → flip so rider faces toward top of screen
  'auto':     false,  // faces down in sheet → correct already
  'car-grey': true,   // taillights at bottom in sheet = backwards → flip so bonnet leads
  'car-red':  true,
  'bike':     true,   // faces up in sheet → flip to face down
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  key: SpriteKey,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  if (!spriteSheet) return
  const { sx, sy, sw, sh } = SPRITES[key]
  const flip = SPRITE_FLIP[key] ?? false

  // Scale to fit within dw×dh preserving aspect ratio
  const scale = Math.min(dw / sw, dh / sh)
  const rw = sw * scale
  const rh = sh * scale

  ctx.save()
  ctx.translate(dx + dw / 2, dy + dh / 2)
  if (flip) ctx.scale(1, -1)
  ctx.drawImage(spriteSheet, sx, sy, sw, sh, -rw / 2, -rh / 2, rw, rh)
  ctx.restore()
}
