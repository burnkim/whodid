import { useEffect } from 'react'
import { useStore } from '../hooks/useStore.js'

export function UndoToast() {
  const { state, actions } = useStore()
  const undo = state.undo

  useEffect(() => {
    if (!undo) return
    const t = setTimeout(() => actions.clearUndo(undo.seq), 4000)
    return () => clearTimeout(t)
  }, [undo?.seq, actions]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!undo) return null

  return (
    <div className="undo-toast" role="status">
      <span className="undo-toast__msg">{undo.label}</span>
      <button className="undo-toast__action" onClick={actions.undo}>
        실행취소
      </button>
    </div>
  )
}
