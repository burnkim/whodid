// MemberAvatar.jsx — circular emoji chip ringed in the member's color.
// `member` may be null (unknown/deleted attribution) -> a neutral "미지정" chip.

export function MemberAvatar({ member, size = 28, selected = false }) {
  const color = member?.color || 'var(--text-tertiary)'
  return (
    <span
      className="member-avatar"
      data-selected={selected || undefined}
      style={{ '--m-color': color, width: size, height: size, fontSize: Math.round(size * 0.55) }}
      aria-hidden="true"
    >
      {member?.emoji || '·'}
    </span>
  )
}
