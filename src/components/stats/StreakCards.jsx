export function StreakCards({ current, longest }) {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-card__label">현재 연속</div>
        <div className="stat-card__value">
          <span className="stat-card__flame">🔥</span> {current}
          <small>일</small>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-card__label">최장 연속</div>
        <div className="stat-card__value">
          {longest}
          <small>일</small>
        </div>
      </div>
    </div>
  )
}
