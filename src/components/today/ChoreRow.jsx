import { useState } from 'react'
import { Icon } from '../common/Icon.jsx'

// A chore tile (2-up grid on Today). Tap to toggle done for the day; the check
// fills in and the tile tints. Recording the same chore multiple times (×N)
// lives in the date detail sheet, keeping these tiles clean.
export function ChoreRow({ chore, count, onTap }) {
  const [pop, setPop] = useState(0)
  const done = count > 0

  function handleTap() {
    setPop((p) => p + 1)
    onTap()
  }

  return (
    <div
      className={`chore-row ${done ? 'chore-row--done' : ''}`}
      onClick={handleTap}
      role="checkbox"
      aria-checked={done}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleTap()
        }
      }}
    >
      <span key={pop} className={`chore-row__check ${pop > 0 ? 'chore-pop' : ''}`}>
        {done && <Icon name="check" />}
      </span>
      <span className="chore-row__emoji">{chore.emoji}</span>
      <span className="chore-row__name">{chore.name}</span>
      {count > 1 && <span className="chore-row__badge tnum">×{count}</span>}
    </div>
  )
}
