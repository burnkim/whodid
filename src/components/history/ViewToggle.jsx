export function ViewToggle({ view, onChange }) {
  return (
    <div className="view-toggle" role="tablist" aria-label="기록 보기 방식">
      <button
        role="tab"
        aria-selected={view === 'grass'}
        className={`view-toggle__btn ${view === 'grass' ? 'view-toggle__btn--active' : ''}`}
        onClick={() => onChange('grass')}
      >
        잔디
      </button>
      <button
        role="tab"
        aria-selected={view === 'calendar'}
        className={`view-toggle__btn ${view === 'calendar' ? 'view-toggle__btn--active' : ''}`}
        onClick={() => onChange('calendar')}
      >
        달력
      </button>
    </div>
  )
}
