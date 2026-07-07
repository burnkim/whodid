import { useRef, useState } from 'react'
import { Icon } from '../common/Icon.jsx'
import { formatWeekdays } from '../../lib/date.js'
import { isDaily } from '../../store/selectors.js'

// Pointer-based drag reorder (no dnd library). Works on touch + mouse.
// While dragging we keep a local order override; otherwise we render `chores` directly.
export function ChoreEditList({ chores, onReorder, onEdit, onArchive, onDelete }) {
  const [dragId, setDragId] = useState(null)
  const [dragOrder, setDragOrder] = useState(null) // array of ids, only while dragging
  const [menuFor, setMenuFor] = useState(null) // { id, x, y }
  const listRef = useRef(null)

  const byId = new Map(chores.map((c) => [c.id, c]))
  const orderIds = dragOrder ?? chores.map((c) => c.id)
  const rows = orderIds.map((id) => byId.get(id)).filter(Boolean)

  function pointerDown(e, id) {
    e.preventDefault()
    setDragId(id)
    setDragOrder(chores.map((c) => c.id))
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  function pointerMove(e) {
    if (dragId == null || !listRef.current) return
    const els = [...listRef.current.querySelectorAll('[data-id]')]
    const y = e.clientY
    let target = els.length - 1
    for (let i = 0; i < els.length; i++) {
      const r = els[i].getBoundingClientRect()
      if (y < r.top + r.height / 2) {
        target = i
        break
      }
    }
    setDragOrder((order) => {
      const cur = order ?? chores.map((c) => c.id)
      const from = cur.indexOf(dragId)
      if (target === from || from === -1) return cur
      const next = [...cur]
      next.splice(from, 1)
      next.splice(target, 0, dragId)
      return next
    })
  }

  function pointerUp() {
    if (dragId == null) return
    if (dragOrder) onReorder(dragOrder)
    setDragId(null)
    setDragOrder(null)
  }

  return (
    <>
      <div className="chore-edit-list" ref={listRef}>
        {rows.map((c) => (
          <div
            key={c.id}
            data-id={c.id}
            className={`chore-edit-row ${dragId === c.id ? 'chore-edit-row--dragging' : ''}`}
          >
            <button
              className="chore-edit-row__handle"
              aria-label="순서 변경 (드래그)"
              onPointerDown={(e) => pointerDown(e, c.id)}
              onPointerMove={pointerMove}
              onPointerUp={pointerUp}
              onPointerCancel={pointerUp}
            >
              <Icon name="grip" />
            </button>
            <span className="chore-edit-row__emoji">{c.emoji}</span>
            <span className="chore-edit-row__name">{c.name}</span>
            {!isDaily(c) && (
              <span className="chore-edit-row__days">{formatWeekdays(c.days)}</span>
            )}
            <button
              className="icon-btn chore-edit-row__menu"
              aria-label={`${c.name} 메뉴`}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                setMenuFor({ id: c.id, x: r.right, y: r.bottom })
              }}
            >
              <Icon name="more" />
            </button>
          </div>
        ))}
      </div>

      {menuFor && (
        <div className="menu-overlay" onClick={() => setMenuFor(null)}>
          <div
            className="menu-popover"
            style={{
              top: Math.min(menuFor.y + 4, window.innerHeight - 160),
              left: Math.min(menuFor.x - 160, window.innerWidth - 172),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="menu-item"
              onClick={() => {
                onEdit(byId.get(menuFor.id))
                setMenuFor(null)
              }}
            >
              <Icon name="edit" size={18} /> 수정
            </button>
            <button
              className="menu-item"
              onClick={() => {
                onArchive(menuFor.id)
                setMenuFor(null)
              }}
            >
              <Icon name="archive" size={18} /> 보관함으로
            </button>
            <button
              className="menu-item menu-item--danger"
              onClick={() => {
                onDelete(byId.get(menuFor.id))
                setMenuFor(null)
              }}
            >
              <Icon name="trash" size={18} /> 삭제
            </button>
          </div>
        </div>
      )}
    </>
  )
}
