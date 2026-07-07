import { useStore } from '../../hooks/useStore.js'
import { addDays, formatKDate, formatTime, isFuture, todayKey } from '../../lib/date.js'
import { haptic } from '../../lib/haptic.js'
import {
  activeChores,
  attributionEnabled,
  countFor,
  dayData,
  memberById,
} from '../../store/selectors.js'
import { dayRelativeLabel } from '../../lib/copy.js'
import { Sheet } from '../common/Sheet.jsx'
import { Icon } from '../common/Icon.jsx'
import { MemberAvatar } from '../common/MemberAvatar.jsx'

// Latest entry (by timestamp) for a chore, so its attribution wins the row.
function latestEntryFor(entries, choreId) {
  let best = null
  for (const e of entries) {
    if (e.choreId === choreId && (!best || e.completedAt > best.completedAt)) best = e
  }
  return best
}

export function DayDetailSheet({ dateKey, onClose }) {
  const { state, actions } = useStore()
  const { logs, chores, settings, members } = state
  const showMembers = attributionEnabled(members)

  const today = todayKey()
  const future = isFuture(dateKey)
  const day = dayData(logs, dateKey)
  const active = activeChores(chores)
  const knownIds = new Set(chores.map((c) => c.id))
  const legacy = day.entries.filter((e) => !knownIds.has(e.choreId))
  const relative = dayRelativeLabel(dateKey, today, addDays(today, -1))
  const hasData = day.entries.length > 0 || (day.note && day.note !== '')

  const title = `${formatKDate(dateKey)}${relative ? ` · ${relative}` : ''}`

  function tap(id) {
    haptic(settings.hapticEnabled)
    actions.toggleChore(id, dateKey)
  }
  function more(id) {
    haptic(settings.hapticEnabled)
    actions.addEntry(id, dateKey)
  }

  return (
    <Sheet title={title} onClose={onClose}>
      {future ? (
        <p className="day-detail__future">미래 날짜는 아직 기록할 수 없어요 🗓️</p>
      ) : (
        <>
          {active.length === 0 ? (
            <p className="day-detail__sub">
              집안일이 없어요. 관리 탭에서 먼저 추가해 주세요.
            </p>
          ) : (
            <>
              <p className="day-detail__sub">
                {dateKey === today ? '오늘 한 일을 체크하세요' : '이 날 한 일을 체크/수정할 수 있어요'}
              </p>
              <div className="day-toggle-list">
                {active.map((c) => {
                  const count = countFor(logs, dateKey, c.id)
                  const done = count > 0
                  const latest = latestEntryFor(day.entries, c.id)
                  const time = latest ? formatTime(latest.completedAt) : ''
                  const doer = latest && latest.by ? memberById(members, latest.by) : null
                  return (
                    <div
                      key={c.id}
                      className={`day-toggle ${done ? 'day-toggle--done' : ''}`}
                      onClick={() => tap(c.id)}
                      role="checkbox"
                      aria-checked={done}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          tap(c.id)
                        }
                      }}
                    >
                      <span className="chore-row__check">
                        {done && <Icon name="check" size={16} />}
                      </span>
                      <span className="day-toggle__emoji">{c.emoji}</span>
                      <span className="day-toggle__name">{c.name}</span>
                      {count > 1 && <span className="day-toggle__count tnum">×{count}</span>}
                      {showMembers && done && (
                        <span className="day-toggle__doer" title={doer ? doer.name : '미지정'}>
                          <MemberAvatar member={doer} size={22} />
                        </span>
                      )}
                      {time && <span className="day-toggle__time tnum">{time}</span>}
                      <button
                        className="chore-row__plus"
                        aria-label={`${c.name} 한 번 더`}
                        onClick={(e) => {
                          e.stopPropagation()
                          more(c.id)
                        }}
                      >
                        <Icon name="plus" size={16} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {legacy.length > 0 && (
            <div className="day-detail__legacy">
              <p className="day-detail__legacy-title">삭제된 집안일 기록</p>
              <div className="day-toggle-list">
                {legacy.map((e) => (
                  <div key={e.id} className="day-toggle">
                    <span className="day-toggle__emoji">{e.emojiSnapshot || '✅'}</span>
                    <span className="day-toggle__name">
                      {e.nameSnapshot || '(삭제된 집안일)'}
                    </span>
                    <span className="day-toggle__time tnum">{formatTime(e.completedAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <textarea
            className="day-note"
            placeholder="이 날의 메모… (선택)"
            value={day.note || ''}
            maxLength={200}
            onChange={(e) => actions.setNote(dateKey, e.target.value)}
          />

          {hasData && (
            <button
              className="btn btn--danger btn--block day-detail__delete"
              onClick={() => {
                actions.clearDay(dateKey)
                onClose()
              }}
            >
              <Icon name="trash" size={18} />이 날 기록 전체 삭제
            </button>
          )}
        </>
      )}
    </Sheet>
  )
}
