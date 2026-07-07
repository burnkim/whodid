import { Icon } from '../common/Icon.jsx'
import { MemberAvatar } from '../common/MemberAvatar.jsx'

// Always visible on Manage — the one entry point that grows a solo log into a
// shared one. Attribution UI elsewhere only appears once 2+ members exist.
export function MemberSection({ members, activeId, onAdd, onEdit, onDelete, onSetActive }) {
  return (
    <div className="member-section">
      <div className="member-section__head">
        <span className="section-title">가족 구성원</span>
        {members.length > 0 && (
          <span className="member-section__count tnum">{members.length}</span>
        )}
      </div>

      {members.length === 0 ? (
        <p className="member-section__hint">
          함께 쓰는 사람을 추가하면 “누가 했는지”까지 기록할 수 있어요.
          혼자 쓴다면 그대로 두어도 좋아요.
        </p>
      ) : (
        <div className="member-list">
          {members.map((m) => {
            const active = m.id === activeId
            return (
              <div key={m.id} className="member-row">
                <button
                  className="member-row__main"
                  onClick={() => onSetActive(m.id)}
                  aria-pressed={active}
                  aria-label={`${m.name}${active ? ' · 기록 중' : ''} — 기록할 사람으로 지정`}
                >
                  <MemberAvatar member={m} selected={active} />
                  <span className="member-row__name">{m.name}</span>
                  {active && <span className="member-row__badge">기록 중</span>}
                </button>
                <button className="icon-btn" aria-label={`${m.name} 수정`} onClick={() => onEdit(m)}>
                  <Icon name="edit" size={18} />
                </button>
                <button
                  className="icon-btn"
                  aria-label={`${m.name} 삭제`}
                  style={{ color: 'var(--danger)' }}
                  onClick={() => onDelete(m)}
                >
                  <Icon name="trash" size={18} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <button className="btn btn--ghost btn--block member-section__add" onClick={onAdd}>
        <Icon name="plus" size={18} /> 구성원 추가
      </button>
    </div>
  )
}
