export function TopChores({ items }) {
  if (items.length === 0) return null
  return (
    <>
      <h2 className="section-title">가장 많이 한 일</h2>
      <div className="top-chores">
        {items.map((it, i) => (
          <div key={it.choreId} className="top-chore">
            <span className="top-chore__rank">{i + 1}</span>
            <span className="top-chore__emoji">{it.emoji}</span>
            <span className="top-chore__name">{it.name}</span>
            <span className="top-chore__count tnum">{it.count}회</span>
          </div>
        ))}
      </div>
    </>
  )
}
