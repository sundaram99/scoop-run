export interface Zone {
  triggerAt: number
  name: string
  oneliner: string
  trafficSpike: boolean
  triggered: boolean
  image: string | null  // path under /assets/zones/, null = not available yet
}

export const ZONES: Zone[] = [
  { triggerAt: 0,   name: 'Silk Board',   oneliner: 'You\'ll age here.',                               trafficSpike: false, triggered: false, image: '/assets/zones/silk-board.png' },
  { triggerAt: 60,  name: 'Koramangala',  oneliner: 'Startups and sambar. Every. Lane.',               trafficSpike: true,  triggered: false, image: '/assets/zones/koramangala.png' },
  { triggerAt: 150, name: 'HSR Layout',   oneliner: 'Finally a straight road. Don\'t get used to it.', trafficSpike: false, triggered: false, image: '/assets/zones/hsr-layout.png' },
  { triggerAt: 240, name: 'Marathahalli', oneliner: 'The bridge. Again. Why.',                         trafficSpike: true,  triggered: false, image: '/assets/zones/marathahalli.png' },
  { triggerAt: 360, name: 'Sarjapur',     oneliner: 'Is this still Bengaluru? Yes. Somehow.',          trafficSpike: false, triggered: false, image: '/assets/zones/sarjapur.png' },
  { triggerAt: 480, name: 'Whitefield',   oneliner: 'You\'ve left the city. Still in traffic.',        trafficSpike: false, triggered: false, image: '/assets/zones/whitefield.png' },
  { triggerAt: 600, name: 'Doorbell',     oneliner: 'Order delivered. Bengaluru traffic: 0, You: 1.',  trafficSpike: false, triggered: false, image: '/assets/zones/doorbell.png' },
]

export function checkZone(
  elapsed: number,
  zones: Zone[]
): { zone: Zone; updated: Zone[] } | null {
  for (let i = 0; i < zones.length; i++) {
    const z = zones[i]
    if (!z.triggered && elapsed >= z.triggerAt) {
      const updated = zones.map((z2, idx) => idx === i ? { ...z2, triggered: true } : z2)
      return { zone: z, updated }
    }
  }
  return null
}
