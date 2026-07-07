import { formatKDate } from '../../lib/date.js'
import { Icon } from '../common/Icon.jsx'

export function DateHeader({ dateKey, onOpenSettings }) {
  return (
    <header className="date-header">
      <span className="date-header__date">{formatKDate(dateKey)}</span>
      <button className="icon-btn" onClick={onOpenSettings} aria-label="설정 열기">
        <Icon name="sliders" />
      </button>
    </header>
  )
}
