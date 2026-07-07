import { useState } from 'react'
import { Sheet } from '../common/Sheet.jsx'
import { EmojiPicker } from '../common/EmojiPicker.jsx'
import { ALL_DAYS } from '../../store/defaults.js'
import { weekdayKo } from '../../lib/date.js'

const MAX = 40

// chore = null -> add mode; otherwise edit mode.
export function ChoreEditSheet({ chore, onClose, onSave }) {
  const [name, setName] = useState(chore?.name ?? '')
  const [emoji, setEmoji] = useState(chore?.emoji ?? '✅')
  const initialDays = chore?.days ?? ALL_DAYS
  const [mode, setMode] = useState(initialDays.length >= 7 ? 'daily' : 'custom')
  const [days, setDays] = useState(initialDays.length >= 7 ? [...ALL_DAYS] : [...initialDays])

  const trimmed = name.trim().slice(0, MAX)
  const customEmpty = mode === 'custom' && days.length === 0
  const canSave = trimmed.length > 0 && !customEmpty

  function toggleDay(d) {
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort((a, b) => a - b)))
  }

  function save() {
    if (!canSave) return
    onSave(trimmed, emoji, mode === 'daily' ? [...ALL_DAYS] : days)
    onClose()
  }

  return (
    <Sheet title={chore ? '집안일 수정' : '새 집안일'} onClose={onClose}>
      <div className="field">
        <label className="field__label" htmlFor="chore-name">
          이름
        </label>
        <input
          id="chore-name"
          className="field__input"
          type="text"
          value={name}
          maxLength={MAX}
          placeholder="예: 설거지"
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
          }}
        />
      </div>

      <div className="field">
        <span className="field__label">반복</span>
        <div className="segmented">
          <button
            className={`segmented__btn ${mode === 'daily' ? 'segmented__btn--active' : ''}`}
            onClick={() => setMode('daily')}
          >
            매일
          </button>
          <button
            className={`segmented__btn ${mode === 'custom' ? 'segmented__btn--active' : ''}`}
            onClick={() => setMode('custom')}
          >
            요일 선택
          </button>
        </div>
        {mode === 'custom' && (
          <>
            <div className="day-picker" role="group" aria-label="반복 요일">
              {ALL_DAYS.map((d) => {
                const on = days.includes(d)
                return (
                  <button
                    key={d}
                    type="button"
                    className={`day-chip ${on ? 'day-chip--active' : ''}`}
                    aria-pressed={on}
                    onClick={() => toggleDay(d)}
                  >
                    {weekdayKo(d)}
                  </button>
                )
              })}
            </div>
            {customEmpty && <p className="field__hint">요일을 하나 이상 골라주세요.</p>}
          </>
        )}
      </div>

      <div className="field">
        <span className="field__label">이모지</span>
        <EmojiPicker value={emoji} onChange={setEmoji} />
      </div>

      <div className="sheet-actions">
        <button className="btn" onClick={onClose}>
          취소
        </button>
        <button className="btn btn--primary" onClick={save} disabled={!canSave}>
          저장
        </button>
      </div>
    </Sheet>
  )
}
