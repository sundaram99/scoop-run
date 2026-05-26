export interface Landmark {
  triggerAt: number
  text: string
  triggered: boolean
}

export const LANDMARKS: Landmark[] = [
  { triggerAt: 30,  text: 'Silk Board junction... uh oh 😅', triggered: false },
  { triggerAt: 90,  text: 'Koramangala signal. Every. Single. Time. 🚦', triggered: false },
  { triggerAt: 150, text: "Forum Mall! Almost there, don't crash now 🙏", triggered: false },
  { triggerAt: 240, text: 'HSR Layout straight road — finally some peace 😤', triggered: false },
  { triggerAt: 540, text: 'Doorbell! You made it 🎉', triggered: false },
]

export function getNewLandmark(
  elapsed: number,
  landmarks: Landmark[]
): { text: string; updated: Landmark[] } | null {
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i]
    if (!lm.triggered && elapsed >= lm.triggerAt) {
      const updated = landmarks.map((l, idx) =>
        idx === i ? { ...l, triggered: true } : l
      )
      return { text: lm.text, updated }
    }
  }
  return null
}
