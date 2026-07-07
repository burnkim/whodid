import { useState } from 'react'
import { formatKMonth, isFuture, todayKey, weekdayKo } from '../../lib/date.js'
import { levelForCount } from '../../store/selectors.js'
import { Icon } from '../common/Icon.jsx'

const pad = (n) => String(n).padStart(2, '0')

export function CalendarMonth({ logs, onSelect }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0-indexed
  const today = todayKey()

  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  function shift(delta) {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  const cells = []
  for (let i = 0; i < firstDow; i++) {
    cells.push(<div key={`e${i}`} className="calendar__cell calendar__cell--empty" />)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${pad(month + 1)}-${pad(d)}`
    const count = logs[key]?.entries?.length || 0
    const future = isFuture(key)
    const level = levelForCount(count)
    cells.push(
      <button
        key={key}
        className={`calendar__cell ${future ? 'calendar__cell--future' : 'calendar__cell--has'} ${
          key === today ? 'calendar__cell--today' : ''
        }`}
        disabled={future}
        onClick={() => onSelect(key)}
      >
        <span className="calendar__daynum tnum">{d}</span>
        <span className={`calendar__dot calendar__dot--l${level}`} />
      </button>,
    )
  }

  return (
    <div className="calendar">
      <div className="calendar__head">
        <button className="icon-btn" onClick={() => shift(-1)} aria-label="이전 달">
          <Icon name="chevron-left" />
        </button>
        <span className="calendar__title">{formatKMonth(year, month)}</span>
        <button className="icon-btn" onClick={() => shift(1)} aria-label="다음 달">
          <Icon name="chevron-right" />
        </button>
      </div>
      <div className="calendar__weekdays">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className={`calendar__weekday ${i === 0 ? 'calendar__weekday--sun' : ''}`}
          >
            {weekdayKo(i)}
          </div>
        ))}
      </div>
      <div className="calendar__grid">{cells}</div>
    </div>
  )
}
