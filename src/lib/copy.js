// copy.js — Korean UI copy in one place for tone consistency.
// Tone: this is a RECORD of what got done, not a streak or a to-do you must
// clear. Copy stays warm and guilt-free, and never nags about "완료/목표".

// Line under the ring on the Today screen. Frames the tap as "기록"(recording
// what you did), counting up — not progress toward a goal.
// hasChores distinguishes "no chores at all" from "none scheduled today".
export function encouragement({ total, done, hasChores = false }) {
  if (total === 0) {
    return hasChores
      ? '오늘은 기록할 집안일이 없어요. 쉬어가도 좋아요 🌿'
      : '집안일을 추가하고, 한 것을 체크해 볼까요?'
  }
  if (done === 0) return '한 집안일을 탭해서 기록해요 🌱'
  if (done >= total) return '오늘 한 집안일을 모두 기록했어요 🎉'
  return `지금까지 ${done}개 기록했어요 👍`
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
