import { weekdayKo } from '../../lib/date.js'

// MonthlyRecap.jsx — an auto-generated, warm reflection on the current month.
// Renders nothing until there's something worth reflecting on.
export function MonthlyRecap({ recap }) {
  if (!recap || recap.total === 0) return null

  return (
    <div className="recap-card">
      <div className="recap-card__head">
        <span className="recap-card__month">{recap.monthLabel} 돌아보기</span>
        <span className="recap-card__total tnum">
          {recap.total}
          <small>번</small>
        </span>
      </div>
      <div className="recap-card__facts">
        {recap.topChore && (
          <div className="recap-fact">
            <span className="recap-fact__emoji">{recap.topChore.emoji}</span>
            <span>
              가장 많이 한 일 <b>{recap.topChore.name}</b> · {recap.topChore.count}회
            </span>
          </div>
        )}
        {recap.bestWeekday && (
          <div className="recap-fact">
            <span className="recap-fact__emoji">📅</span>
            <span>
              가장 활발한 요일 <b>{weekdayKo(recap.bestWeekday.index)}요일</b>
            </span>
          </div>
        )}
        {recap.topMember && (
          <div className="recap-fact">
            <span className="recap-fact__emoji">{recap.topMember.emoji}</span>
            <span>
              이번 달 최다 기여 <b>{recap.topMember.name}</b> · {recap.topMember.count}회
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
