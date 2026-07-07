import { useState } from 'react'
import { useStore } from '../../hooks/useStore.js'
import { activeChores, archivedChores, sortedMembers } from '../../store/selectors.js'
import { Icon } from '../common/Icon.jsx'
import { ChoreEditList } from './ChoreEditList.jsx'
import { ChoreEditSheet } from './ChoreEditSheet.jsx'
import { ArchiveSection } from './ArchiveSection.jsx'
import { MemberSection } from './MemberSection.jsx'
import { MemberEditSheet } from './MemberEditSheet.jsx'

export function ManageScreen({ onOpenSettings }) {
  const { state, actions } = useStore()
  const active = activeChores(state.chores)
  const archived = archivedChores(state.chores)
  const members = sortedMembers(state.members)

  // editing: null (closed) | 'new' | chore object
  const [editing, setEditing] = useState(null)
  const editChore = editing && editing !== 'new' ? editing : null
  // memberEditing: null (closed) | 'new' | member object
  const [memberEditing, setMemberEditing] = useState(null)
  const editMember = memberEditing && memberEditing !== 'new' ? memberEditing : null

  function confirmThen(message, run) {
    if (state.settings.confirmDelete && !window.confirm(message)) return
    run()
  }

  function handleDelete(chore) {
    confirmThen(
      `'${chore.name}'을(를) 삭제할까요?\n달력과 통계의 지난 기록은 그대로 남아요.`,
      () => actions.deleteChore(chore.id),
    )
  }

  function handleSave(name, emoji, days) {
    if (editChore) actions.editChore(editChore.id, name, emoji, days)
    else actions.addChore(name, emoji, days)
  }

  function handleMemberDelete(member) {
    confirmThen(
      `'${member.name}'을(를) 삭제할까요?\n이 사람이 한 지난 기록은 그대로 남아요.`,
      () => actions.deleteMember(member.id),
    )
  }

  function handleMemberSave(name, emoji, color) {
    if (editMember) actions.editMember(editMember.id, name, emoji, color)
    else actions.addMember(name, emoji, color)
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h1 className="screen__title">관리</h1>
        <button className="icon-btn" onClick={onOpenSettings} aria-label="설정 열기">
          <Icon name="sliders" />
        </button>
      </div>

      <button className="btn btn--primary btn--block manage-add" onClick={() => setEditing('new')}>
        <Icon name="plus" size={18} /> 새 집안일 추가
      </button>

      {active.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__emoji">📝</div>
          <p className="empty-state__title">집안일을 추가해 보세요</p>
          <p className="empty-state__desc">자주 하는 집안일을 등록해두면 매일 체크가 빨라져요.</p>
        </div>
      ) : (
        <ChoreEditList
          chores={active}
          onReorder={actions.reorderChores}
          onEdit={(c) => setEditing(c)}
          onArchive={actions.archiveChore}
          onDelete={handleDelete}
        />
      )}

      <ArchiveSection
        chores={archived}
        onRestore={actions.unarchiveChore}
        onDelete={handleDelete}
      />

      <MemberSection
        members={members}
        activeId={state.settings.activeMemberId}
        onAdd={() => setMemberEditing('new')}
        onEdit={(m) => setMemberEditing(m)}
        onDelete={handleMemberDelete}
        onSetActive={actions.setActiveMember}
      />

      {editing && (
        <ChoreEditSheet
          chore={editChore}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}

      {memberEditing && (
        <MemberEditSheet
          member={editMember}
          takenColors={members
            .filter((m) => m.id !== editMember?.id)
            .map((m) => m.color)}
          onClose={() => setMemberEditing(null)}
          onSave={handleMemberSave}
        />
      )}
    </div>
  )
}
