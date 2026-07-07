import { weekdayKo } from '../../lib/date.js'

export function WeekdayBars({ counts }) {
  const max = Math.max(1, ...counts)
  return (
    <>
      <h2 className="section-title">요일별 활동</h2>
      <div className="weekday-bars">
        {counts.map((c, i) => {
          const pct = Math.round((c / max) * 100)
          return (
            <div key={i} className="weekday-bar">
              <span className="weekday-bar__count tnum">{c}</span>
              <div className="weekday-bar__track">
                <div
                  className={`weekday-bar__fill ${c === 0 ? 'weekday-bar__fill--empty' : ''}`}
                  style={{ height: `${c === 0 ? 4 : pct}%` }}
                />
              </div>
              <span className="weekday-bar__label">{weekdayKo(i)}</span>
            </div>
          )
        })}
      </div>
    </>
  )
}
