export function getDiscountTier(score: number): { percent: number; label: string } {
  if (score >= 500) return { percent: 20, label: '20% off your next order' }
  return { percent: 10, label: '10% off your next order' }
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
