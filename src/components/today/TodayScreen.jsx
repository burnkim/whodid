import { useCallback, useState } from 'react'
import { useStore } from '../../hooks/useStore.js'
import { useMidnightRollover } from '../../hooks/useMidnightRollover.js'
import { todayKey } from '../../lib/date.js'
import { haptic } from '../../lib/haptic.js'
import {
  activeChores,
  attributionEnabled,
  countFor,
  progressOn,
  sortedMembers,
  splitByDue,
} from '../../store/selectors.js'
import { makeConfettiPieces } from '../../lib/confetti.js'
import { ProgressRing } from '../common/ProgressRing.jsx'
import { ConfettiBurst } from '../common/ConfettiBurst.jsx'
import { DateHeader } from './DateHeader.jsx'
import { EncouragementLine } from './EncouragementLine.jsx'
import { MemberSwitcher } from './MemberSwitcher.jsx'
import { ChoreList } from './ChoreList.jsx'
import { NotDueSection } from './NotDueSection.jsx'
import { QuickAddBar } from './QuickAddBar.jsx'

export function TodayScreen({ onOpenSettings, onGoManage }) {
  const { state, actions } = useStore()
  const { settings, logs, chores, members } = state
  const showMembers = attributionEnabled(members)

  const [todayK, setTodayK] = useState(todayKey())
  const [confettiPieces, setConfettiPieces] = useState(null)

  useMidnightRollover(
    useCallback(
      (k) => {
        setTodayK(k)
        actions.markSeen(k)
      },
      [actions],
    ),
  )

  const active = activeChores(chores)
  const { due, notDue } = splitByDue(active, todayK)
  const { done, total } = progressOn(logs, todayK, due)
  const complete = total > 0 && done >= total

  const onTap = useCallback(
    (id) => {
      haptic(settings.hapticEnabled)
      const wasDone = countFor(logs, todayK, id) > 0
      // Completing the final chore right now? Fire one confetti (once per day),
      // unless the user prefers reduced motion.
      const reduceMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      if (
        !wasDone &&
        total > 0 &&
        done + 1 === total &&
        settings.lastConfettiDate !== todayK &&
        !reduceMotion
      ) {
        setConfettiPieces(makeConfettiPieces())
        actions.markConfetti(todayK)
      }
      actions.toggleChore(id, todayK)
    },
    [actions, todayK, logs, done, total, settings.hapticEnabled, settings.lastConfettiDate],
  )

  return (
    <div className="screen">
      <DateHeader dateKey={todayK} onOpenSettings={onOpenSettings} />

      <div className="today-hero">
        <ProgressRing done={done} total={total} />
        <EncouragementLine total={total} done={done} hasChores={active.length > 0} />
        {complete && <div className="done-banner">🎉 오늘 할 집안일을 모두 기록했어요!</div>}
      </div>

      {active.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__emoji">🧺</div>
          <p className="empty-state__title">아직 집안일이 없어요</p>
          <p className="empty-state__desc">
            아래에서 바로 추가하거나, 관리 탭에서 정리할 수 있어요.
          </p>
          <button className="btn btn--primary" onClick={onGoManage}>
            집안일 관리하기
          </button>
        </div>
      ) : (
        <>
          {showMembers && (
            <MemberSwitcher
              members={sortedMembers(members)}
              activeId={settings.activeMemberId}
              onSelect={actions.setActiveMember}
            />
          )}
          {due.length > 0 ? (
            <ChoreList
              chores={due}
              logs={logs}
              dateKey={todayK}
              sortMode={settings.sortMode}
              onTap={onTap}
            />
          ) : (
            <div className="today-rest">🌿 오늘 예정된 집안일이 없어요</div>
          )}
          <NotDueSection
            chores={notDue}
            logs={logs}
            dateKey={todayK}
            sortMode={settings.sortMode}
            onTap={onTap}
          />
        </>
      )}

      <QuickAddBar onAdd={(name) => actions.addChore(name, '✅')} />
      <ConfettiBurst pieces={confettiPieces} onDone={() => setConfettiPieces(null)} />
    </div>
  )
}
