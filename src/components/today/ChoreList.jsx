import { countFor } from '../../store/selectors.js'
import { ChoreRow } from './ChoreRow.jsx'

export function ChoreList({ chores, logs, dateKey, sortMode, onTap, onAddMore }) {
  // undone-first: pending chores on top, completed slide to the bottom.
  const withCount = chores.map((c) => ({ chore: c, count: countFor(logs, dateKey, c.id) }))
  const sorted =
    sortMode === 'undone-first'
      ? [...withCount].sort((a, b) => (a.count > 0 ? 1 : 0) - (b.count > 0 ? 1 : 0))
      : withCount

  return (
    <div className="chore-list">
      {sorted.map(({ chore, count }) => (
        <ChoreRow
          key={chore.id}
          chore={chore}
          count={count}
          onTap={() => onTap(chore.id)}
          onAddMore={() => onAddMore(chore.id)}
        />
      ))}
    </div>
  )
}
