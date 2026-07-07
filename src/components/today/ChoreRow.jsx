import { useState } from 'react'
import { Icon } from '../common/Icon.jsx'

// Tap the row to toggle (add when none, remove most-recent when done).
// The + button stacks another completion of the same chore for the day.
export function ChoreRow({ chore, count, onTap, onAddMore }) {
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
      <span
        key={pop}
        className={`chore-row__check ${pop > 0 ? 'chore-pop' : ''}`}
      >
        {done && <Icon name="check" />}
      </span>
      <span className="chore-row__emoji">{chore.emoji}</span>
      <span className="chore-row__name">{chore.name}</span>
      {count > 1 && <span className="chore-row__badge tnum">×{count}</span>}
      <button
        className="chore-row__plus"
        aria-label={`${chore.name} 한 번 더 기록`}
        onClick={(e) => {
          e.stopPropagation()
          setPop((p) => p + 1)
          onAddMore()
        }}
      >
        <Icon name="plus" size={18} />
      </button>
    </div>
  )
}
