import { StoreProvider } from './store/StoreProvider.jsx'
import { useStore } from './hooks/useStore.js'
import { useTheme } from './hooks/useTheme.js'
import { AppShell } from './components/AppShell.jsx'

function ThemedApp() {
  const { state } = useStore()
  useTheme(state.settings.theme)
  return <AppShell />
}

export default function App() {
  return (
    <StoreProvider>
      <ThemedApp />
    </StoreProvider>
  )
}
