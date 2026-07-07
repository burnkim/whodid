import { useRef, useState } from 'react'
import { useStore } from '../hooks/useStore.js'
import { Onboarding } from './Onboarding.jsx'
import { ScreenRouter } from './ScreenRouter.jsx'
import { BottomTabBar } from './BottomTabBar.jsx'
import { UndoToast } from './UndoToast.jsx'

export function AppShell() {
  const { state, storageError, dismissStorageError } = useStore()
  const [view, setView] = useState('today')
  const lastTab = useRef('today')

  function go(v) {
    if (v !== 'settings') lastTab.current = v
    setView(v)
  }

  if (!state.settings.onboarded) return <Onboarding />

  return (
    <div className="app-shell">
      <main className="app-main">
        {storageError && (
          <div className="banner banner--warn" onClick={dismissStorageError}>
            저장 공간이 부족해요. 설정에서 내보내기로 백업해 주세요.
          </div>
        )}
        <ScreenRouter
          view={view}
          onOpenSettings={() => setView('settings')}
          onBack={() => setView(lastTab.current)}
          onGoManage={() => go('manage')}
        />
      </main>
      <BottomTabBar view={view} onChange={go} />
      <UndoToast />
    </div>
  )
}
