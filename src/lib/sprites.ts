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

// Sprites are top-down view, facing downward by default.
// Player needs to face UP — flip vertically (scaleY -1).
// Obstacles already face down — no transform needed.
const SPRITE_FLIP: Record<string, boolean> = {
  'player':   true,   // flip to face up
  'auto':     false,
  'car-grey': false,
  'car-red':  false,
  'bike':     false,
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
