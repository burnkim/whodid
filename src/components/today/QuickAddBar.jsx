import { useState } from 'react'
import { Icon } from '../common/Icon.jsx'

const MAX = 40

// Inline add: type a name, Enter adds it and keeps focus for rapid entry.
export function QuickAddBar({ onAdd }) {
  const [value, setValue] = useState('')

  function submit() {
    const name = value.trim().slice(0, MAX)
    if (!name) return
    onAdd(name)
    setValue('')
  }

  return (
    <div className="quick-add">
      <form
        className="quick-add__inner"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <span className="quick-add__icon">
          <Icon name="plus" size={20} />
        </span>
        <input
          className="quick-add__input"
          type="text"
          value={value}
          maxLength={MAX}
          placeholder="집안일 추가…"
          enterKeyHint="done"
          onChange={(e) => setValue(e.target.value)}
          aria-label="새 집안일 이름"
        />
        <button
          className="quick-add__btn"
          type="submit"
          disabled={!value.trim()}
          aria-label="추가"
        >
          <Icon name="check" size={20} />
        </button>
      </form>
    </div>
  )
}
