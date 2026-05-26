'use client'

import { useRouter } from 'next/navigation'
import { useGameState } from '@/lib/gameState'

export default function IntroPage() {
  const { dispatch } = useGameState()
  const router = useRouter()

  function handleStart() {
    dispatch({ type: 'START' })
    router.push('/game/play')
  }

  return (
    <div className="flex flex-col min-h-screen px-5 pb-safe"
      style={{ background: 'var(--color-bg)' }}>

      {/* Top strip */}
      <div className="flex justify-center pt-5">
        <div className="flex items-center gap-2 px-6 py-2 rounded-full border"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--color-text)' }}>
            Ice cream confirmed 🍦
          </span>
        </div>
      </div>

      {/* Illustration */}
      <div className="mt-4 rounded-xl border overflow-hidden relative"
        style={{ borderColor: 'var(--color-border)' }}>
        <img
          src="/scooter-illustration.png"
          alt="Zepto rider on scooter in Bengaluru"
          style={{ width: '100%', display: 'block' }}
        />
      </div>

      {/* Headline */}
      <h1 className="text-center mt-4"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, lineHeight: 1.2, color: 'var(--color-text)' }}>
        Help your rider dodge<br />
        <span style={{ color: 'var(--color-accent)' }}>Bengaluru traffic.</span>
      </h1>

      {/* Sub */}
      <p className="text-center mt-2 mx-auto"
        style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 15, lineHeight: 1.5, color: 'var(--color-text-secondary)', maxWidth: 300 }}>
        Collect coupons, avoid crashes, and deliver the scoop before it melts!
      </p>

      {/* Rules strip */}
      <div className="mt-3 rounded-xl p-4 border"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--color-text)', marginBottom: 12 }}>
          How to play
        </p>
        <div className="flex flex-col gap-3">
          {[
            { icon: '👆', label: 'Swipe to Steer', sub: 'Navigate 3 lanes' },
            { icon: '💎', label: 'Grab Coupons', sub: '+100 each' },
            { icon: '⚠️', label: 'Avoid Crashes', sub: '−50 each' },
          ].map(({ icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: 'var(--color-accent-dim)' }}>
                {icon}
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--color-text)' }}>{label}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 12, color: 'var(--color-text-muted)' }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-4 mb-6">
        <button
          onClick={handleStart}
          className="w-full rounded-full active:scale-95 transition-transform"
          style={{
            height: 56,
            background: 'var(--color-accent)',
            color: 'var(--color-text-inverse)',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: 18,
            border: 'none',
            cursor: 'pointer',
            animation: 'pulseRing 2s infinite',
          }}>
          Start the run →
        </button>
      </div>
    </div>
  )
}
