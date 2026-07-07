import { useState } from 'react'
import { useStore } from '../../hooks/useStore.js'
import { ViewToggle } from './ViewToggle.jsx'
import { HeatmapGrid } from './HeatmapGrid.jsx'
import { CalendarMonth } from './CalendarMonth.jsx'
import { DayDetailSheet } from './DayDetailSheet.jsx'

export function HistoryScreen() {
  const { state } = useStore()
  const { logs } = state
  const [view, setView] = useState('grass')
  const [selected, setSelected] = useState(null)

  const hasAny = Object.keys(logs).length > 0

  return (
    <div className="screen">
      <div className="screen-header">
        <h1 className="screen__title">기록</h1>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {!hasAny && (
        <div className="empty-state">
          <div className="empty-state__emoji">🌱</div>
          <p className="empty-state__title">아직 기록이 없어요</p>
          <p className="empty-state__desc">오늘 한 집안일을 체크하면 여기에 쌓여요.</p>
        </div>
      )}

      {view === 'grass' ? (
        <HeatmapGrid logs={logs} onSelect={setSelected} />
      ) : (
        <CalendarMonth logs={logs} onSelect={setSelected} />
      )}

      {selected && (
        <DayDetailSheet dateKey={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
