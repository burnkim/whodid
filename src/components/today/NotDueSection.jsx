import { useState } from 'react'
import { Icon } from '../common/Icon.jsx'
import { ChoreList } from './ChoreList.jsx'

// Chores not scheduled for today, tucked into a collapsed section but still
// tappable — routines shape the default view without hiding anything.
export function NotDueSection({ chores, logs, dateKey, sortMode, onTap }) {
  const [open, setOpen] = useState(false)
  if (chores.length === 0) return null

  return (
    <div className="notdue-section">
      <button
        className="notdue-header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>다른 집안일도 기록하기 ({chores.length})</span>
        <Icon name={open ? 'chevron-down' : 'chevron-right'} size={18} />
      </button>
      {open && (
        <ChoreList
          chores={chores}
          logs={logs}
          dateKey={dateKey}
          sortMode={sortMode}
          onTap={onTap}
        />
      )}
    </div>
  )
}
