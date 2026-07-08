import { useMemo } from 'react'
import { countFor } from '../../store/selectors.js'
import { ChoreRow } from './ChoreRow.jsx'

export function ChoreList({ chores, logs, dateKey, sortMode, onTap }) {
  const idsKey = `${dateKey}|${chores.map((c) => c.id).join(',')}`

  // Freeze the row order. undone-first grouping is snapshotted here and only
  // re-applied when the date or the set/order of chores changes — deliberately
  // NOT when a done-count flips. Otherwise checking a chore would slide it to
  // the bottom mid-tap, reflowing the list and making the page jump under the
  // user's scroll. Done state itself stays live (see countFor below).
  const orderedIds = useMemo(() => {
    const ids = chores.map((c) => c.id)
    if (sortMode !== 'undone-first') return ids
    return [...chores]
      .sort(
        (a, b) =>
          (countFor(logs, dateKey, a.id) > 0 ? 1 : 0) -
          (countFor(logs, dateKey, b.id) > 0 ? 1 : 0),
      )
      .map((c) => c.id)
    // `logs` is intentionally omitted: the order is a snapshot, not reactive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, sortMode])

  const byId = new Map(chores.map((c) => [c.id, c]))
  const ordered = orderedIds.map((id) => byId.get(id)).filter(Boolean)

  return (
    <div className="chore-list">
      {ordered.map((chore) => (
        <ChoreRow
          key={chore.id}
          chore={chore}
          count={countFor(logs, dateKey, chore.id)}
          onTap={() => onTap(chore.id)}
        />
      ))}
    </div>
  )
}
