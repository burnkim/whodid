import { useEffect, useState } from 'react'

// Captures the browser's `beforeinstallprompt` so we can offer "홈 화면에 추가"
// on our own terms. canInstall is false where install isn't available (iOS
// Safari, already-installed, unsupported) — the UI simply hides the option.
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState(null)

  useEffect(() => {
    function onPrompt(e) {
      e.preventDefault()
      setDeferred(e)
    }
    function onInstalled() {
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function promptInstall() {
    if (!deferred) return
    deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }

  return { canInstall: Boolean(deferred), promptInstall }
}
