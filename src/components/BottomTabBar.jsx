import { Icon } from './common/Icon.jsx'

const TABS = [
  { key: 'today', label: '오늘', icon: 'sun' },
  { key: 'history', label: '기록', icon: 'calendar' },
  { key: 'stats', label: '통계', icon: 'chart' },
  { key: 'manage', label: '관리', icon: 'list' },
]

export function BottomTabBar({ view, onChange }) {
  return (
    <nav className="tabbar" aria-label="메인 탭">
      {TABS.map((t) => {
        const active = view === t.key
        return (
          <button
            key={t.key}
            className={`tabbar__btn ${active ? 'tabbar__btn--active' : ''}`}
            onClick={() => onChange(t.key)}
            aria-current={active ? 'page' : undefined}
          >
            {active && <span className="tabbar__indicator" />}
            <Icon name={t.icon} size={22} />
            <span className="tabbar__label">{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
