export interface Gem {
  id: number
  name: string
}

export const ALL_GEMS: Gem[] = [
  { id: 1, name: 'Nandi Hills' },
  { id: 2, name: 'Savandurga' },
  { id: 3, name: 'Skandagiri' },
  { id: 4, name: 'Ramanagara' },
  { id: 5, name: 'Shivanasamudra' },
  { id: 6, name: 'Anthargange' },
  { id: 7, name: 'Bilikal Rangaswamy' },
  { id: 8, name: 'Chunchi Falls' },
  { id: 9, name: 'Makalidurga' },
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
    spawnAt: 60 + Math.floor(Math.random() * 440), // 60–500s
    lane: Math.floor(Math.random() * 3) as 0 | 1 | 2,
    y: -30,
    collected: false,
  }))
}
