// EmojiPicker.jsx — pick from a curated set; controlled by parent.

import { EMOJI_CHOICES } from '../../lib/copy.js'

export function EmojiPicker({ value, onChange, choices = EMOJI_CHOICES, fallback = '✅' }) {
  return (
    <div className="emoji-picker">
      <div className="emoji-picker__current">{value || fallback}</div>
      <div className="emoji-picker__grid">
        {choices.map((e) => (
          <button
            key={e}
            type="button"
            className={`emoji-picker__item ${e === value ? 'emoji-picker__item--active' : ''}`}
            onClick={() => onChange(e)}
            aria-label={`이모지 ${e}`}
            aria-pressed={e === value}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  )
}
