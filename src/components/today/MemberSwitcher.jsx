// MemberSwitcher.jsx — pick who today's taps attribute to.
// Only mounted when 2+ members exist (attributionEnabled).

export function MemberSwitcher({ members, activeId, onSelect }) {
  return (
    <div className="member-switcher">
      <span className="member-switcher__label">기록할 사람</span>
      <div className="member-switcher__pills" role="radiogroup" aria-label="기록할 사람">
        {members.map((m) => {
          const active = m.id === activeId
          return (
            <button
              key={m.id}
              role="radio"
              aria-checked={active}
              className={`member-pill ${active ? 'member-pill--active' : ''}`}
              style={{ '--m-color': m.color }}
              onClick={() => onSelect(m.id)}
            >
              <span className="member-pill__emoji">{m.emoji}</span>
              <span className="member-pill__name">{m.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
