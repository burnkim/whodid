// date.js — ALL date keys are LOCAL "YYYY-MM-DD" strings.
// Never use toISOString() for keys: it returns UTC and would shift the day.

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

function pad2(n) {
  return String(n).padStart(2, '0')
}

// Local YYYY-MM-DD for a Date (defaults to now).
export function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

// Today's local key — call at use-time, never cache across midnight.
export function todayKey() {
  return dateKey(new Date())
}

// Parse a "YYYY-MM-DD" key to a local Date at NOON (DST-safe for day math).
export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0, 0)
}

// Shift a key by n days (n can be negative) -> new key.
export function addDays(key, n) {
  const d = parseKey(key)
  d.setDate(d.getDate() + n)
  return dateKey(d)
}

// 0 = Sunday ... 6 = Saturday, for a key.
export function weekdayOf(key) {
  return parseKey(key).getDay()
}

export function weekdayKo(idx) {
  return WEEKDAYS_KO[idx]
}

// "월·수·금" for a weekday list; "매일" when all seven (or empty/legacy).
export function formatWeekdays(days) {
  if (!Array.isArray(days) || days.length === 0 || days.length >= 7) return '매일'
  return [...days]
    .sort((a, b) => a - b)
    .map((d) => WEEKDAYS_KO[d])
    .join('·')
}

export function isFuture(key) {
  return key > todayKey()
}

export function isToday(key) {
  return key === todayKey()
}

// "6월 22일 (일)"
export function formatKDate(key) {
  const d = parseKey(key)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS_KO[d.getDay()]})`
}

// "2026년 6월"
export function formatKMonth(year, monthIndex0) {
  return `${year}년 ${monthIndex0 + 1}월`
}

// Sunday-start week: key of the Sunday on/before the given key.
export function startOfWeekKey(key) {
  const dow = weekdayOf(key)
  return addDays(key, -dow)
}

// "08:12" local time from an ISO completedAt; "" if unparseable.
export function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

// ISO timestamp anchored at LOCAL noon of a given day-key.
// Used for retro (past-date) logging so the day-key never drifts.
export function noonIsoFor(key) {
  return parseKey(key).toISOString()
}
