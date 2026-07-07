import { useStore } from '../../hooks/useStore.js'
import { startOfWeekKey, todayKey } from '../../lib/date.js'
import {
  attributionEnabled,
  memberSplit,
  monthRecap,
  monthSummary,
  topChores,
  weekSummary,
  weeklyTrend,
  weekdayBars,
} from '../../store/selectors.js'
import { PeriodSummary } from './PeriodSummary.jsx'
import { MonthlyRecap } from './MonthlyRecap.jsx'
import { WeeklySplit } from './WeeklySplit.jsx'
import { WeeklyTrend } from './WeeklyTrend.jsx'
import { TopChores } from './TopChores.jsx'
import { WeekdayBars } from './WeekdayBars.jsx'

export function StatsScreen() {
  const { state } = useStore()
  const { logs, chores, members } = state

  const hasAny = Object.keys(logs).length > 0
  const week = weekSummary(logs)
  const month = monthSummary(logs)
  const top = topChores(logs, chores, 3)
  const bars = weekdayBars(logs)
  const recap = monthRecap(logs, chores, members)
  const trend = weeklyTrend(logs)
  const showSplit = attributionEnabled(members)
  const today = todayKey()
  const split = showSplit ? memberSplit(logs, members, startOfWeekKey(today), today) : null

  return (
    <div className="screen">
      <h1 className="screen__title">통계</h1>

      <PeriodSummary week={week} month={month} />

      {!hasAny ? (
        <div className="empty-state">
          <div className="empty-state__emoji">📊</div>
          <p className="empty-state__title">아직 통계가 없어요</p>
          <p className="empty-state__desc">기록이 쌓이면 여기에서 한눈에 볼 수 있어요.</p>
        </div>
      ) : (
        <>
          {showSplit && <WeeklySplit split={split} />}
          <MonthlyRecap recap={recap} />
          <WeeklyTrend data={trend} />
          <TopChores items={top} />
          <WeekdayBars counts={bars} />
        </>
      )}
    </div>
  )
}
