// Precise sprite bounds measured from each sprite sheet
interface SpriteBounds { sx: number; sy: number; sw: number; sh: number; sheet: 1 | 2 | 3 | 4 }

const SPRITES: Record<string, SpriteBounds> = {
  // --- sprites.png (sheet 1) ---
  // Zepto scooter with rider + delivery box
  'player':    { sx: 121,  sy: 302, sw: 159, sh: 357, sheet: 1 },
  // Yellow auto-rickshaw, faces down in sheet
  'auto':      { sx: 381,  sy: 304, sw: 196, sh: 357, sheet: 1 },
  // Dark grey sedan, front at top in sheet
  'car-grey':  { sx: 682,  sy: 289, sw: 183, sh: 376, sheet: 1 },
  // Red sedan, front at top in sheet
  'car-red':   { sx: 974,  sy: 297, sw: 187, sh: 368, sheet: 1 },
  // Motorcycle with rider, front at top in sheet
  'bike':      { sx: 1243, sy: 305, sw: 152, sh: 331, sheet: 1 },

  // --- sprites3.png (sheet 3) — landlord / hiring sign / tesla ---
  // South Indian landlord holding "2BHK ₹45k" sign, top-down
  'landlord':  { sx: 89,  sy: 76,  sw: 636, sh: 618, sheet: 3 },
  // Purple "ENTRY LEVEL HIRING" banner, landscape
  'hiring':    { sx: 759, sy: 273, sw: 1044, sh: 350, sheet: 3 },
  // White Tesla sedan, top-down, front at top (sprites4.png = original sheet 3)
  'tesla':     { sx: 1199, sy: 398, sw: 166, sh: 248, sheet: 4 },

  // --- sprites2.png (sheet 2) ---
  // Cyclist with yellow helmet, front at bottom (faces down already)
  'cyclist':   { sx: 166,  sy: 330, sw: 122, sh: 299, sheet: 2 },
  // Open-roof red car (convertible), front at bottom (faces down already)
  'car-open':  { sx: 400,  sy: 313, sw: 223, sh: 340, sheet: 2 },
  // Blue bus (BMTC-style), front at bottom (faces down already)
  'bus':       { sx: 727,  sy: 237, sw: 215, sh: 485, sheet: 2 },
  // Red standard car (alt style), front at bottom (faces down already)
  'car-red2':  { sx: 1009, sy: 311, sw: 197, sh: 358, sheet: 2 },
  // Motorcycle with rider (alt style), front at bottom (faces down already)
  'bike2':     { sx: 1271, sy: 319, sw: 144, sh: 310, sheet: 2 },
}

export type SpriteKey = keyof typeof SPRITES

// sheet 1: player/cars/bike face UP in image → flip vertically so front points down (direction of travel)
// sheet 1: auto faces DOWN already → no flip
// sheet 2: all sprites face DOWN already → no flip needed
const SPRITE_FLIP: Record<string, boolean> = {
  'player':   true,
  'auto':     false,
  'car-grey': true,
  'car-red':  true,
  'bike':     true,
  'cyclist':  false,
  'car-open': false,
  'bus':      false,
  'car-red2': false,
  'bike2':    true,
  'landlord': false,
  'hiring':   false,
  'tesla':    true,
}

let sheet1: HTMLImageElement | null = null
let sheet2: HTMLImageElement | null = null
let sheet3: HTMLImageElement | null = null
let sheet4: HTMLImageElement | null = null

export function loadSprites(): Promise<void> {
  const load = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })

  return Promise.all([
    load('/sprites.png').then(img => { sheet1 = img }),
    load('/sprites2.png').then(img => { sheet2 = img }),
    load('/sprites3.png').then(img => { sheet3 = img }),
    load('/sprites4.png').then(img => { sheet4 = img }),
  ]).then(() => {})
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  key: SpriteKey,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const bounds = SPRITES[key]
  if (!bounds) return
  const sheet = bounds.sheet === 1 ? sheet1 : bounds.sheet === 2 ? sheet2 : bounds.sheet === 3 ? sheet3 : sheet4
  if (!sheet) return

  const { sx, sy, sw, sh } = bounds
  const flip = SPRITE_FLIP[key] ?? false

  const scale = Math.min(dw / sw, dh / sh)
  const rw = sw * scale
  const rh = sh * scale

  ctx.save()
  ctx.translate(dx + dw / 2, dy + dh / 2)
  if (flip) ctx.scale(1, -1)
  ctx.drawImage(sheet, sx, sy, sw, sh, -rw / 2, -rh / 2, rw, rh)
  ctx.restore()
}
