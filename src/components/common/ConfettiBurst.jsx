// ConfettiBurst.jsx — one restrained celebration. No canvas, no library.
// Pieces are built by the caller (makeConfettiPieces, in an event handler) and
// passed in, keeping render pure. Renders while `pieces` is set, then calls onDone.

import { useEffect } from 'react'
import { CONFETTI_DURATION } from '../../lib/confetti.js'

export function ConfettiBurst({ pieces, onDone }) {
  useEffect(() => {
    if (!pieces) return
    const t = setTimeout(() => onDone?.(), CONFETTI_DURATION)
    return () => clearTimeout(t)
  }, [pieces, onDone])

  if (!pieces) return null

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti__piece"
          style={{
            left: `${p.left}%`,
            width: `${p.w}px`,
            height: `${p.w * 1.6}px`,
            background: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
          }}
        />
      ))}
    </div>
  )
}
