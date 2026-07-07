// haptic.js — tiny tap feedback, gated by the user setting + device support.

export function haptic(enabled, ms = 15) {
  if (!enabled) return
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(ms)
    } catch {
      /* no-op */
    }
  }
}
