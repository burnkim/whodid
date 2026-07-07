import { streakBroken, streakText } from '../../lib/copy.js'

export function StreakBadge({ current }) {
  const broken = streakBroken(current)
  return (
    <span className={`streak-badge ${broken ? 'streak-badge--broken' : ''}`}>
      <span className="streak-badge__flame">{broken ? '🌙' : '🔥'}</span>
      {streakText(current)}
    </span>
  )
}
