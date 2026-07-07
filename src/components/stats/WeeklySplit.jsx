// WeeklySplit.jsx — this week's contribution per member as one stacked bar.
// Only rendered when 2+ members exist. Tone: "함께 해냈어요", never blame.

export function WeeklySplit({ split }) {
  const { rows, unassigned, total } = split
  const segs = rows.filter((r) => r.count > 0)
  const pct = (n) => Math.round((n / total) * 100)

  return (
    <>
      <h2 className="section-title">이번 주 분담</h2>
      {total === 0 ? (
        <div className="split-empty">이번 주 기록이 아직 없어요. 하나씩 함께 채워봐요.</div>
      ) : (
        <div className="split-card">
          <div className="split-bar" role="img" aria-label="구성원별 이번 주 분담">
            {segs.map((r) => (
              <span
                key={r.id}
                className="split-seg"
                style={{ width: `${(r.count / total) * 100}%`, background: r.color }}
                title={`${r.name} ${r.count}회`}
              />
            ))}
            {unassigned > 0 && (
              <span
                className="split-seg split-seg--none"
                style={{ width: `${(unassigned / total) * 100}%` }}
                title={`미지정 ${unassigned}회`}
              />
            )}
          </div>

          <div className="split-legend">
            {segs.map((r) => (
              <div key={r.id} className="split-legend__row">
                <span className="split-dot" style={{ background: r.color }} />
                <span className="split-legend__name">
                  {r.emoji} {r.name}
                </span>
                <span className="split-legend__count tnum">
                  {r.count}회 · {pct(r.count)}%
                </span>
              </div>
            ))}
            {unassigned > 0 && (
              <div className="split-legend__row">
                <span className="split-dot split-dot--none" />
                <span className="split-legend__name">미지정</span>
                <span className="split-legend__count tnum">
                  {unassigned}회 · {pct(unassigned)}%
                </span>
              </div>
            )}
          </div>

          <p className="split-note">이번 주, 함께 {total}번 해냈어요 💚</p>
        </div>
      )}
    </>
  )
}
