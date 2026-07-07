// copy.js — Korean UI copy in one place for tone consistency.
// Encouragement is ALWAYS warm and guilt-free, even at 0%.

// Encouragement line on the Today screen, based on progress + whether any chore exists.
// hasChores distinguishes "no chores at all" from "none due today".
export function encouragement({ total, done, hasChores = false }) {
  if (total === 0) {
    return hasChores
      ? '오늘 예정된 집안일이 없어요. 쉬어가도 좋아요 🌿'
      : '첫 집안일을 추가하고 시작해 볼까요?'
  }
  if (done === 0) return '천천히 시작해요. 하나만 해도 좋아요 🌱'
  const ratio = done / total
  if (done >= total) return '오늘 할 일을 다 끝냈어요! 정말 멋져요 🎉'
  if (ratio >= 0.6) return '거의 다 왔어요. 조금만 더!'
  if (ratio >= 0.3) return '좋아요, 잘하고 있어요 👍'
  return '시작이 반이에요. 하나씩 해봐요'
}

// Streak badge text. current=consecutive active days. broken => never shame.
export function streakText(current) {
  if (current <= 0) return '괜찮아요, 오늘 다시 시작해요'
  if (current === 1) return '오늘부터 1일째 🔥'
  return `${current}일 연속 기록 중 🔥`
}

export function streakBroken(current) {
  return current <= 0
}

// Day-detail relative label.
export function dayRelativeLabel(key, todayK, yesterdayK) {
  if (key === todayK) return '오늘'
  if (key === yesterdayK) return '어제'
  return null
}

export const PRESET_CHORES = [
  { name: '설거지', emoji: '🍽️' },
  { name: '빨래', emoji: '🧺' },
  { name: '청소기 돌리기', emoji: '🧹' },
  { name: '분리수거', emoji: '♻️' },
  { name: '화장실 청소', emoji: '🚽' },
  { name: '이불 정리', emoji: '🛏️' },
  { name: '요리', emoji: '🍳' },
  { name: '바닥 닦기', emoji: '🧽' },
]

// People/pets emoji for the member picker (faces first, then family + pets).
export const MEMBER_EMOJI = [
  '🙂', '😀', '😎', '🥰', '🧑', '👩', '👨', '👧', '👦', '🧒', '👵', '👴',
  '🧔', '👱', '👩‍🦱', '👨‍🦱', '🐶', '🐱', '🐰', '🦊', '🐻', '🌷', '🌿', '⭐',
]

// A compact, friendly emoji set for the picker.
export const EMOJI_CHOICES = [
  '✅', '🍽️', '🧺', '🧹', '🧽', '♻️', '🚽', '🛁', '🛏️', '🍳', '🥘', '☕',
  '🪥', '🧴', '🌿', '🪴', '🌱', '🐶', '🐱', '🐟', '💧', '🚿', '🗑️', '📦',
  '👕', '🧦', '👟', '🧊', '🔌', '💡', '🪟', '🚪', '🧯', '🔧', '🛒', '💊',
  '📮', '✉️', '💰', '📚', '🖥️', '🎒', '🌬️', '🧷', '🪣', '🧼', '🌸', '⭐',
]
