// ProgressRing.jsx — SVG donut driven by ratio (0..1).

export function ProgressRing({ done, total }) {
  const size = 128
  const stroke = 10
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const ratio = total > 0 ? Math.min(done / total, 1) : 0
  const offset = circumference * (1 - ratio)

  return (
    <div
      className="progress-ring"
      role="img"
      aria-label={`오늘 ${total}가지 중 ${done}가지 기록`}
    >
      <svg width={size} height={size}>
        <circle
          className="progress-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className="progress-ring__fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="progress-ring__center">
        <span className="progress-ring__num tnum">{done}</span>
        <span className="progress-ring__total tnum">/ {total}</span>
        <span className="progress-ring__pct">기록</span>
      </div>
    </div>
  )
}
