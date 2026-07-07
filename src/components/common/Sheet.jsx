// Sheet.jsx — reusable bottom sheet with backdrop, Esc, scroll-lock,
// focus trap, and focus restore.

import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon.jsx'

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

export function Sheet({ title, onClose, children }) {
  const panelRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const panel = panelRef.current
    const prevFocus = document.activeElement

    // Move focus into the sheet (first field, else the panel itself).
    const first = panel?.querySelector(FOCUSABLE)
    ;(first || panel)?.focus()

    function onKey(e) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const items = panel.querySelectorAll(FOCUSABLE)
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      // Restore focus to whatever opened the sheet.
      if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus()
    }
  }, [onClose])

  // Portal to <body> so the sheet escapes the `.screen` subtree — otherwise it
  // shares a stacking level with the fixed bottom tab bar (a later sibling),
  // which then paints over the sheet's action buttons.
  return createPortal(
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__handle" />
        <div className="sheet__header">
          <h2 className="sheet__title" id={titleId}>
            {title}
          </h2>
          <button className="icon-btn" onClick={onClose} aria-label="닫기">
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
