import { useLayoutEffect, useRef } from 'react'
import { todayKey } from '../../lib/date.js'
import { heatmapGrid } from '../../store/selectors.js'

function shortLabel(key, count) {
  const [, mm, dd] = key.split('-')
  return `${+mm}/${+dd} · ${count}개`
}

export function HeatmapGrid({ logs, onSelect }) {
  const today = todayKey()
  const { weeks, monthLabels } = heatmapGrid(logs, today)
  const cardRef = useRef(null)

  // The most recent week (today) is the rightmost column — start scrolled to it.
  useLayoutEffect(() => {
    const el = cardRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [])

  return (
    <div className="heatmap-card" ref={cardRef}>
      <div className="heatmap-scroll">
        <div className="heatmap__months" aria-hidden="true">
          {monthLabels.map((m, i) => (
            <span key={i} style={{ width: 14, flexShrink: 0, whiteSpace: 'nowrap' }}>
              {m}
            </span>
          ))}
        </div>
        <div className="heatmap__grid">
          {weeks.map((week, wi) =>
            week.map((cell, di) => {
              if (!cell) {
                return (
                  <span
                    key={`${wi}-${di}`}
                    className="heatmap__cell heatmap__cell--placeholder"
                  />
                )
              }
              const isToday = cell.key === today
              return (
                <button
                  key={`${wi}-${di}`}
                  className={`heatmap__cell heatmap__cell--l${cell.level} ${
                    isToday ? 'heatmap__cell--today' : ''
                  }`}
                  title={shortLabel(cell.key, cell.count)}
                  aria-label={shortLabel(cell.key, cell.count)}
                  onClick={() => onSelect(cell.key)}
                />
              )
            }),
          )}
        </div>
        <div className="heatmap__legend">
          <span>적음</span>
          <span className="heatmap__cell heatmap__cell--l0" />
          <span className="heatmap__cell heatmap__cell--l1" />
          <span className="heatmap__cell heatmap__cell--l2" />
          <span className="heatmap__cell heatmap__cell--l3" />
          <span className="heatmap__cell heatmap__cell--l4" />
          <span>많음</span>
        </div>
      </div>
    </div>
  )
}
