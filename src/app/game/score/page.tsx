'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGameState } from '@/lib/gameState'
import { getDiscountTier, formatTime } from '@/lib/scoring'

export default function ScorePage() {
  const { state, dispatch } = useGameState()
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const tier = getDiscountTier(state.score)

  async function handleShare() {
    const text = `I scored ${Math.round(state.score)} on Scoop Run by Zepto! Earned ${tier.label}. 🍦 #ZeptoNow`
    if (navigator.share) {
      await navigator.share({ text, title: 'Scoop Run' }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(text).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handlePlayAgain() {
    dispatch({ type: 'START' })
    router.push('/game/play')
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-5"
      style={{ background: 'var(--color-bg)' }}>

      <div className="w-full rounded-xl overflow-hidden"
        style={{
          maxWidth: 380,
          background: 'var(--color-surface)',
          border: '2px solid',
          borderColor: 'var(--color-border)',
          borderBottomWidth: 4,
          borderRightWidth: 3,
        }}>

        {/* Gradient header */}
        <div className="flex flex-col items-center justify-center"
          style={{
            height: 80,
            background: 'linear-gradient(135deg, #F0436A, #7C3AED)',
          }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff' }}>
            Scoop Run
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 12, color: '#fff', marginTop: 2 }}>
            Your ice cream is here 🍦
          </p>
        </div>

        {/* Card body */}
        <div className="flex flex-col items-center p-6 gap-4">

          {/* Hero score */}
          <div className="flex flex-col items-center mt-2">
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 12, color: 'var(--color-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Final Score
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 56, lineHeight: 1, color: 'var(--color-text)', marginTop: 4 }}>
              {Math.round(state.score).toLocaleString()}
            </p>
          </div>

          {/* Discount tier */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border"
            style={{ borderColor: 'var(--color-accent)', background: 'var(--color-accent-dim)' }}>
            <span style={{ fontSize: 16 }}>🏆</span>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--color-accent)' }}>
              {tier.label}
            </p>
          </div>

          {/* Stats row */}
          <div className="w-full grid grid-cols-3 rounded-xl p-4 border mt-2"
            style={{ background: 'var(--color-surface-raised)', borderColor: 'var(--color-border)' }}>
            {[
              { icon: '⏱', value: formatTime(state.elapsed), label: 'Time' },
              { icon: '🏷', value: state.coupons, label: 'Coupons' },
              { icon: '⚠️', value: state.crashes, label: 'Crashes' },
            ].map(({ icon, value, label }, i) => (
              <div key={label} className="flex flex-col items-center gap-1"
                style={{ borderLeft: i > 0 ? '1px solid var(--color-border)' : 'none' }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 16, color: 'var(--color-text)' }}>
                  {value}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Share CTA */}
          <button
            onClick={handleShare}
            className="w-full rounded-full active:scale-95 transition-transform mt-2"
            style={{
              height: 48,
              background: 'var(--color-accent)',
              color: 'var(--color-text-inverse)',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: 16,
              border: 'none',
              cursor: 'pointer',
            }}>
            Share your run
          </button>

          {copied && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-muted)' }}>
              Copied to clipboard! 🍦
            </p>
          )}

          {/* Play again */}
          <button
            onClick={handlePlayAgain}
            className="w-full rounded-full active:scale-95 transition-transform"
            style={{
              height: 48,
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: 16,
              border: '2px solid',
              borderColor: 'var(--color-border)',
              cursor: 'pointer',
            }}>
            Play Again
          </button>

          {/* Footer */}
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>
            Tag @ZeptoNow = extra coupon
          </p>
        </div>
      </div>
    </div>
  )
}
