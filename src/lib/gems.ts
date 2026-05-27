// Gem image sheet: 3 files × 3 gems each, each sheet is 1536×1024, gems at col 0/1/2 (512px wide each)
const GEM_SHEETS = [
  '/assets/gems/gem-sheet-1.png',
  '/assets/gems/gem-sheet-2.png',
  '/assets/gems/gem-sheet-3.png',
]

export interface GemImageSlice {
  sheet: string   // path to image file
  sx: number      // source x in sheet
  sy: number      // source y
  sw: number      // source width
  sh: number      // source height
}

export interface Gem {
  id: number
  name: string
  slice: GemImageSlice
}

export const ALL_GEMS: Gem[] = [
  // Sheet 1 (09_05_26): Nandi Hills | Savandurga | Skandagiri
  { id: 1, name: 'Nandi Hills',         slice: { sheet: GEM_SHEETS[0], sx: 0,    sy: 0, sw: 512, sh: 1024 } },
  { id: 2, name: 'Savandurga',          slice: { sheet: GEM_SHEETS[0], sx: 512,  sy: 0, sw: 512, sh: 1024 } },
  { id: 3, name: 'Skandagiri',          slice: { sheet: GEM_SHEETS[0], sx: 1024, sy: 0, sw: 512, sh: 1024 } },
  // Sheet 2 (09_12_28): Ramanagara | Shivanasamudra | Anthargange
  { id: 4, name: 'Ramanagara',          slice: { sheet: GEM_SHEETS[1], sx: 0,    sy: 0, sw: 512, sh: 1024 } },
  { id: 5, name: 'Shivanasamudra',      slice: { sheet: GEM_SHEETS[1], sx: 512,  sy: 0, sw: 512, sh: 1024 } },
  { id: 6, name: 'Anthargange',         slice: { sheet: GEM_SHEETS[1], sx: 1024, sy: 0, sw: 512, sh: 1024 } },
  // Sheet 3 (09_12_41): Bilikal Rangaswamy | Chunchi Falls | Makalidurga
  { id: 7, name: 'Bilikal Rangaswamy',  slice: { sheet: GEM_SHEETS[2], sx: 0,    sy: 0, sw: 512, sh: 1024 } },
  { id: 8, name: 'Chunchi Falls',       slice: { sheet: GEM_SHEETS[2], sx: 512,  sy: 0, sw: 512, sh: 1024 } },
  { id: 9, name: 'Makalidurga',         slice: { sheet: GEM_SHEETS[2], sx: 1024, sy: 0, sw: 512, sh: 1024 } },
]

const STORAGE_KEY = 'scoop-run-gems'

export function loadCollectedGems(): number[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveCollectedGems(ids: number[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

// Pick 2 random gems for this run, each with a random spawn time and lane
export interface GemSpawn {
  gemId: number
  spawnAt: number  // elapsed seconds when gem appears
  lane: 0 | 1 | 2
  y: number
  collected: boolean
}

export function pickRunGems(): GemSpawn[] {
  const shuffled = [...ALL_GEMS].sort(() => Math.random() - 0.5)
  const picked = shuffled.slice(0, 2)
  return picked.map(g => ({
    gemId: g.id,
    spawnAt: 60 + Math.floor(Math.random() * 440),
    lane: Math.floor(Math.random() * 3) as 0 | 1 | 2,
    y: -30,
    collected: false,
  }))
}
