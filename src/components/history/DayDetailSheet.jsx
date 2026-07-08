import { useState } from 'react'
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
  const isToday = dateKey === today
  const future = isFuture(dateKey)
  const day = dayData(logs, dateKey)
  const active = activeChores(chores)
  const knownIds = new Set(chores.map((c) => c.id))
  const legacy = day.entries.filter((e) => !knownIds.has(e.choreId))
  const relative = dayRelativeLabel(dateKey, today, addDays(today, -1))
  const hasData = day.entries.length > 0 || (day.note && day.note !== '')

  // Split into what was actually done (the record) and what wasn't. The record
  // is ordered by completion time — a real chronological log of the day.
  const done = []
  const notDone = []
  for (const c of active) {
    const count = countFor(logs, dateKey, c.id)
    if (count > 0) {
      const latest = latestEntryFor(day.entries, c.id)
      done.push({
        chore: c,
        count,
        at: latest?.completedAt || '',
        time: latest ? formatTime(latest.completedAt) : '',
        doer: latest && latest.by ? memberById(members, latest.by) : null,
      })
    } else {
      notDone.push(c)
    }
  }
  done.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0))

  // Record-first: when there's already a record, keep the rest tucked away.
  // When nothing's recorded yet, open it so backfilling is one tap.
  const [showRest, setShowRest] = useState(done.length === 0)

  const title = `${formatKDate(dateKey)}${relative ? ` · ${relative}` : ''}`

  function tap(id) {
    haptic(settings.hapticEnabled)
    actions.toggleChore(id, dateKey)
  }
  function more(id) {
    haptic(settings.hapticEnabled)
    actions.addEntry(id, dateKey)
  }

  function keyToggle(e, id) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      tap(id)
    }
  }

  return (
    <Sheet title={title} onClose={onClose}>
      {future ? (
        <p className="day-detail__future">미래 날짜는 아직 기록할 수 없어요 🗓️</p>
      ) : active.length === 0 ? (
        <p className="day-detail__sub">집안일이 없어요. 관리 탭에서 먼저 추가해 주세요.</p>
      ) : (
        <>
          <p className="day-detail__sub">
            {isToday ? '오늘 한 일을 기록하세요' : '이 날의 기록이에요. 탭하면 고칠 수 있어요'}
          </p>

          {/* 한 일 = the record: only what was done, in the order it happened */}
          {done.length > 0 ? (
            <>
              <div className="day-detail__section-title">
                한 일 <span className="day-detail__count tnum">{done.length}가지</span>
              </div>
              <div className="day-toggle-list">
                {done.map(({ chore: c, count, time, doer }) => (
                  <div
                    key={c.id}
                    className="day-toggle day-toggle--done"
                    onClick={() => tap(c.id)}
                    role="checkbox"
                    aria-checked="true"
                    tabIndex={0}
                    onKeyDown={(e) => keyToggle(e, c.id)}
                  >
                    <span className="chore-row__check">
                      <Icon name="check" size={16} />
                    </span>
                    <span className="day-toggle__emoji">{c.emoji}</span>
                    <span className="day-toggle__name">{c.name}</span>
                    {count > 1 && <span className="day-toggle__count tnum">×{count}</span>}
                    {showMembers && (
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
                ))}
              </div>
            </>
          ) : (
            <p className="day-detail__empty">이 날은 기록된 집안일이 없어요.</p>
          )}

          {legacy.length > 0 && (
            <div className="day-detail__legacy">
              <p className="day-detail__legacy-title">삭제된 집안일 기록</p>
              <div className="day-toggle-list">
                {legacy.map((e) => (
                  <div key={e.id} className="day-toggle day-toggle--done">
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

          {/* the rest: not done this day, tucked away but one tap to record */}
          {notDone.length > 0 && (
            <div className="day-rest">
              <button
                className="day-rest__header"
                onClick={() => setShowRest((o) => !o)}
                aria-expanded={showRest}
              >
                <span>다른 집안일 기록하기 ({notDone.length})</span>
                <Icon name={showRest ? 'chevron-down' : 'chevron-right'} size={18} />
              </button>
              {showRest && (
                <div className="day-toggle-list day-rest__list">
                  {notDone.map((c) => (
                    <div
                      key={c.id}
                      className="day-toggle"
                      onClick={() => tap(c.id)}
                      role="checkbox"
                      aria-checked="false"
                      tabIndex={0}
                      onKeyDown={(e) => keyToggle(e, c.id)}
                    >
                      <span className="chore-row__check" />
                      <span className="day-toggle__emoji">{c.emoji}</span>
                      <span className="day-toggle__name">{c.name}</span>
                      <button
                        className="chore-row__plus"
                        aria-label={`${c.name} 기록`}
                        onClick={(e) => {
                          e.stopPropagation()
                          more(c.id)
                        }}
                      >
                        <Icon name="plus" size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
