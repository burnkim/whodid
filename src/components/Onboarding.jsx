import { useState } from 'react'
import { useStore } from '../hooks/useStore.js'
import { PRESET_CHORES } from '../lib/copy.js'

export function Onboarding() {
  const { actions } = useStore()
  // pre-select all presets; tapping toggles.
  const [selected, setSelected] = useState(() => PRESET_CHORES.map((p) => p.name))

  function toggle(name) {
    setSelected((s) => (s.includes(name) ? s.filter((n) => n !== name) : [...s, name]))
  }

  function start() {
    const chosen = PRESET_CHORES.filter((p) => selected.includes(p.name))
    actions.onboardComplete(chosen)
  }

  return (
    <div className="onboarding">
      <div className="onboarding__logo">🧹</div>
      <h1 className="onboarding__title">whodid</h1>
      <p className="onboarding__sub">
        오늘 한 집안일을 체크하고
        <br />
        매일의 기록을 돌아보세요.
      </p>

      <p className="section-title" style={{ marginBottom: 0 }}>
        시작할 집안일을 골라주세요
      </p>
      <div className="onboarding__presets">
        {PRESET_CHORES.map((p) => {
          const on = selected.includes(p.name)
          return (
            <button
              key={p.name}
              className={`preset-chip ${on ? 'preset-chip--active' : ''}`}
              onClick={() => toggle(p.name)}
              aria-pressed={on}
            >
              <span>{p.emoji}</span>
              {p.name}
            </button>
          )
        })}
      </div>

      <div className="onboarding__spacer" />

      <div className="onboarding__actions">
        <button className="btn btn--primary btn--block" onClick={start}>
          {selected.length > 0 ? `${selected.length}개로 시작하기` : '시작하기'}
        </button>
        <button className="btn btn--ghost btn--block" onClick={() => actions.onboardComplete([])}>
          비어있는 채로 시작
        </button>
      </div>
    </div>
  )
}
