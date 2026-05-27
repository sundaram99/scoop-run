'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGameState } from '@/lib/gameState'
import { getDiscountTier, formatTime } from '@/lib/scoring'
import { ALL_GEMS, loadCollectedGems } from '@/lib/gems'

export default function ScorePage() {
  const { state, dispatch } = useGameState()
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [allCollected, setAllCollected] = useState<number[]>([])

  useEffect(() => {
    setAllCollected(loadCollectedGems())
  }, [])

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

  const gemsFoundThisRun = state.gemsThisRun.length
  const totalFound = allCollected.length

  return (
    <div className="flex items-center justify-center min-h-screen p-4"
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
          style={{ height: 80, background: 'linear-gradient(135deg, #F0436A, #7C3AED)' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff' }}>
            Scoop Run
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 12, color: '#fff', marginTop: 2 }}>
            Your ice cream is here 🍦
          </p>
        </div>

        <div className="flex flex-col items-center p-4 gap-3">

          {/* Score + tier inline */}
          <div className="flex flex-col items-center mt-1">
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 11, color: 'var(--color-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Final Score
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 48, lineHeight: 1, color: 'var(--color-text)', marginTop: 2 }}>
              {Math.round(state.score).toLocaleString()}
            </p>
          </div>

          {/* Discount tier */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border"
            style={{ borderColor: 'var(--color-accent)', background: 'var(--color-accent-dim)' }}>
            <span style={{ fontSize: 14 }}>🏆</span>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--color-accent)' }}>
              {tier.label}
            </p>
          </div>

          {/* Stats row */}
          <div className="w-full grid grid-cols-3 rounded-xl p-3 border"
            style={{ background: 'var(--color-surface-raised)', borderColor: 'var(--color-border)' }}>
            {[
              { icon: '⏱', value: formatTime(state.elapsed), label: 'Time' },
              { icon: '🏷', value: state.coupons, label: 'Coupons' },
              { icon: '⚠️', value: state.crashes, label: 'Crashes' },
            ].map(({ icon, value, label }, i) => (
              <div key={label} className="flex flex-col items-center gap-0.5"
                style={{ borderLeft: i > 0 ? '1px solid var(--color-border)' : 'none' }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: 'var(--color-text)' }}>
                  {value}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Gems — compact horizontal scroll */}
          <div className="w-full rounded-xl p-3 border"
            style={{ background: 'var(--color-surface-raised)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between mb-2">
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: 'var(--color-text)' }}>
                💎 Hidden Gems
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 11, color: 'var(--color-text-muted)' }}>
                {totalFound}/9 found
              </p>
            </div>
            {gemsFoundThisRun > 0 && (
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 11, color: 'var(--color-accent)', marginBottom: 6 }}>
                This run: {state.gemsThisRun.map(id => ALL_GEMS.find(g => g.id === id)?.name).join(', ')}
              </p>
            )}
            {/* Horizontal scrolling gem row */}
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {ALL_GEMS.map(gem => {
                const found = allCollected.includes(gem.id)
                const foundThisRun = state.gemsThisRun.includes(gem.id)
                return (
                  <div key={gem.id} className="flex flex-col items-center gap-1 rounded-lg flex-shrink-0"
                    style={{
                      width: 56, paddingTop: 6, paddingBottom: 6,
                      background: foundThisRun ? '#7C3AED' : found ? 'var(--color-accent-dim)' : 'var(--color-surface)',
                      border: '1px solid',
                      borderColor: found ? 'var(--color-accent)' : 'var(--color-border)',
                      opacity: found ? 1 : 0.4,
                    }}>
                    <span style={{ fontSize: 14 }}>💎</span>
                    <p style={{
                      fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 8,
                      color: foundThisRun ? '#fff' : found ? 'var(--color-accent)' : 'var(--color-text-muted)',
                      textAlign: 'center', lineHeight: 1.2, padding: '0 3px',
                    }}>
                      {gem.name}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Share + Play Again */}
          <button onClick={handleShare} className="w-full rounded-full active:scale-95 transition-transform"
            style={{ height: 44, background: 'var(--color-accent)', color: 'var(--color-text-inverse)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>
            {copied ? 'Copied! 🍦' : 'Share your run'}
          </button>

          <button onClick={handlePlayAgain} className="w-full rounded-full active:scale-95 transition-transform"
            style={{ height: 44, background: 'var(--color-surface)', color: 'var(--color-text)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, border: '2px solid', borderColor: 'var(--color-border)', cursor: 'pointer' }}>
            Play Again
          </button>

          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center' }}>
            Tag @ZeptoNow = extra coupon
          </p>
        </div>
      </div>
    </div>
  )
}
