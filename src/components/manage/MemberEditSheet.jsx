import { useState } from 'react'
import { Sheet } from '../common/Sheet.jsx'
import { EmojiPicker } from '../common/EmojiPicker.jsx'
import { MEMBER_COLORS } from '../../store/defaults.js'
import { MEMBER_EMOJI } from '../../lib/copy.js'

const MAX = 20

// member = null -> add mode. takenColors: colors already used by others,
// so a fresh member defaults to the first unused swatch.
export function MemberEditSheet({ member, takenColors = [], onClose, onSave }) {
  const firstFree = MEMBER_COLORS.find((c) => !takenColors.includes(c)) || MEMBER_COLORS[0]
  const [name, setName] = useState(member?.name ?? '')
  const [emoji, setEmoji] = useState(member?.emoji ?? MEMBER_EMOJI[0])
  const [color, setColor] = useState(member?.color ?? firstFree)

  const trimmed = name.trim().slice(0, MAX)
  const canSave = trimmed.length > 0

  function save() {
    if (!canSave) return
    onSave(trimmed, emoji, color)
    onClose()
  }

  return (
    <Sheet title={member ? '구성원 수정' : '구성원 추가'} onClose={onClose}>
      <div className="field">
        <label className="field__label" htmlFor="member-name">
          이름
        </label>
        <input
          id="member-name"
          className="field__input"
          type="text"
          value={name}
          maxLength={MAX}
          placeholder="예: 엄마, 아빠, 지호"
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
          }}
        />
      </div>

      <div className="field">
        <span className="field__label">색상</span>
        <div className="color-swatches" role="radiogroup" aria-label="색상">
          {MEMBER_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={c === color}
              aria-label={`색상 ${c}`}
              className={`color-swatch ${c === color ? 'color-swatch--active' : ''}`}
              style={{ '--m-color': c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field__label">이모지</span>
        <EmojiPicker value={emoji} onChange={setEmoji} choices={MEMBER_EMOJI} fallback="🙂" />
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
