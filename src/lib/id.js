// id.js — stable unique ids, with a fallback for older browsers / non-secure contexts.

let counter = 0

export function uid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback: time + counter + random-ish. Good enough for a single-user store.
  counter = (counter + 1) % 0xffff
  const t = Date.now().toString(36)
  const r = Math.floor(Math.random() * 0xffffff).toString(36)
  return `id-${t}-${counter.toString(36)}-${r}`
}
