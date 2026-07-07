// WeeklyTrend.jsx — last-8-weeks completion sparkline. Pure SVG, no library,
// same visual family as the heatmap and weekday bars.

const W = 320
const H = 64
const PAD = 6

export function WeeklyTrend({ data }) {
  if (!data || data.length < 2) return null
  const max = Math.max(1, ...data.map((d) => d.count))
  const n = data.length
  const step = (W - PAD * 2) / (n - 1)

  const pts = data.map((d, i) => {
    const x = PAD + i * step
    const y = PAD + (H - PAD * 2) * (1 - d.count / max)
    return [x, y]
  })
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const area = `${PAD},${H - PAD} ${line} ${W - PAD},${H - PAD}`
  const [lx, ly] = pts[pts.length - 1]
  const totalRecent = data.reduce((s, d) => s + d.count, 0)

  return (
    <>
      <h2 className="section-title">주간 추세</h2>
      <div className="trend-card">
        <svg
          className="trend-svg"
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`최근 ${n}주 완료 추세, 합계 ${totalRecent}회`}
        >
          <polygon className="trend-area" points={area} />
          <polyline className="trend-line" points={line} />
          <circle className="trend-dot" cx={lx} cy={ly} r="3.5" />
        </svg>
      </div>
    </>
  )
}
