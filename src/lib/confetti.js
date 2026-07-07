// confetti.js — build a confetti burst. Call from an event handler (uses Math.random).

export const CONFETTI_COLORS = ['#2eb872', '#54c285', '#8fd6ae', '#f59e0b', '#1f9d63']
export const CONFETTI_COUNT = 36
export const CONFETTI_DURATION = 1300

export function makeConfettiPieces() {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.25,
    dur: 0.9 + Math.random() * 0.6,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    rotate: Math.random() * 360,
    w: 6 + Math.random() * 5,
  }))
}
