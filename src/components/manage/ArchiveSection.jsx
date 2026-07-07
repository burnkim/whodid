import { useState } from 'react'
import { Icon } from '../common/Icon.jsx'

export function ArchiveSection({ chores, onRestore, onDelete }) {
  const [open, setOpen] = useState(false)
  if (chores.length === 0) return null

  return (
    <div className="archive-section">
      <button className="archive-header" onClick={() => setOpen((o) => !o)}>
        <span>보관함 ({chores.length})</span>
        <Icon name={open ? 'chevron-down' : 'chevron-right'} size={18} />
      </button>
      {open &&
        chores.map((c) => (
          <div key={c.id} className="archive-row">
            <span className="archive-row__emoji">{c.emoji}</span>
            <span className="archive-row__name">{c.name}</span>
            <button className="icon-btn" aria-label="복구" onClick={() => onRestore(c.id)}>
              <Icon name="restore" size={18} />
            </button>
            <button
              className="icon-btn"
              aria-label="완전 삭제"
              style={{ color: 'var(--danger)' }}
              onClick={() => onDelete(c)}
            >
              <Icon name="trash" size={18} />
            </button>
          </div>
        ))}
    </div>
  )
}
