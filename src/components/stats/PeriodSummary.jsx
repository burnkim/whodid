function Delta({ delta, unit }) {
  if (delta === 0) {
    return <div className="stat-card__delta">{unit} 같아요</div>
  }
  const up = delta > 0
  return (
    <div className={`stat-card__delta ${up ? 'stat-card__delta--up' : 'stat-card__delta--down'}`}>
      {unit} {up ? '▲' : '▼'} {Math.abs(delta)}
    </div>
  )
}

export function PeriodSummary({ week, month }) {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-card__label">이번 주 완료</div>
        <div className="stat-card__value tnum">
          {week.thisWeek}
          <small>개</small>
        </div>
        <Delta delta={week.delta} unit="지난주보다" />
      </div>
      <div className="stat-card">
        <div className="stat-card__label">이번 달 완료</div>
        <div className="stat-card__value tnum">
          {month.thisMonth}
          <small>개</small>
        </div>
        <Delta delta={month.delta} unit="지난달보다" />
      </div>
    </div>
  )
}
