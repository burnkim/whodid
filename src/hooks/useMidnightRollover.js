import { useEffect, useRef } from 'react'
import { todayKey } from '../lib/date.js'

// Fire onRollover(newKey) when the local calendar day changes while the app is open.
// Uses both a minute timer and visibilitychange (covers wake-from-sleep).
export function useMidnightRollover(onRollover) {
  const seenRef = useRef(todayKey())
  const cbRef = useRef(onRollover)

  useEffect(() => {
    cbRef.current = onRollover
  }, [onRollover])

  useEffect(() => {
    function check() {
      const now = todayKey()
      if (now !== seenRef.current) {
        seenRef.current = now
        cbRef.current(now)
      }
    }
    const id = setInterval(check, 60 * 1000)
    function onVisible() {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', check)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', check)
    }
  }, [])
}
