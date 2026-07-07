// selectors.js — pure derived values from store slices. No side effects.

import { addDays, parseKey, startOfWeekKey, todayKey, weekdayOf } from '../lib/date.js'

export function activeChores(chores) {
  return chores.filter((c) => !c.archived).sort((a, b) => a.order - b.order)
}

export function archivedChores(chores) {
  return chores.filter((c) => c.archived).sort((a, b) => a.order - b.order)
}

// ---- members --------------------------------------------------------------

export function sortedMembers(members) {
  return [...members].sort((a, b) => a.order - b.order)
}

export function memberById(members, id) {
  return members.find((m) => m.id === id) || null
}

// Attribution UI (current-user chip, split view) only appears with 2+ members;
// 0–1 members = the original solo experience, untouched.
export function attributionEnabled(members) {
  return members.length >= 2
}

// Per-member completion counts in [startKey, endKey]. Entries with an unknown
// or missing `by` fall into a single "미지정" bucket (memberId: null).
export function memberSplit(logs, members, startKey, endKey) {
  const known = new Set(members.map((m) => m.id))
  const counts = new Map()
  let unassigned = 0
  for (const [key, day] of Object.entries(logs)) {
    if (key < startKey || key > endKey) continue
    for (const e of day.entries) {
      if (e.by && known.has(e.by)) counts.set(e.by, (counts.get(e.by) || 0) + 1)
      else unassigned += 1
    }
  }
  const rows = sortedMembers(members).map((m) => ({
    id: m.id,
    name: m.name,
    emoji: m.emoji,
    color: m.color,
    count: counts.get(m.id) || 0,
  }))
  const total = rows.reduce((s, r) => s + r.count, 0) + unassigned
  return { rows, unassigned, total }
}

// ---- cadence --------------------------------------------------------------

// Is a chore due on this date-key? A missing `days` means daily (legacy-safe).
export function choreDueOn(chore, key) {
  if (!chore.days || chore.days.length === 0) return true
  return chore.days.includes(weekdayOf(key))
}

export function isDaily(chore) {
  return !chore.days || chore.days.length >= 7
}

// Split active chores into those due on `key` and those not (still tappable).
export function splitByDue(active, key) {
  const due = []
  const notDue = []
  for (const c of active) (choreDueOn(c, key) ? due : notDue).push(c)
  return { due, notDue }
}

export function dayData(logs, key) {
  return logs[key] || { entries: [], note: '' }
}

export function entriesOn(logs, key) {
  return dayData(logs, key).entries
}

export function countFor(logs, key, choreId) {
  return entriesOn(logs, key).filter((e) => e.choreId === choreId).length
}

export function isDoneOn(logs, key, choreId) {
  return entriesOn(logs, key).some((e) => e.choreId === choreId)
}

export function dayActive(logs, key) {
  return entriesOn(logs, key).length > 0
}

// done = # of *active* chores with >=1 entry that day; total = # active chores.
export function progressOn(logs, key, active) {
  const total = active.length
  if (total === 0) return { done: 0, total: 0, ratio: 0 }
  let done = 0
  for (const c of active) {
    if (isDoneOn(logs, key, c.id)) done += 1
  }
  return { done, total, ratio: done / total }
}

// 5-bucket intensity from an entry count.
export function levelForCount(count) {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  if (count <= 4) return 3
  return 4
}

function isActiveDay(logs, key) {
  return (logs[key]?.entries?.length || 0) > 0
}

// current = consecutive active days ending today (or yesterday if today still pending).
// longest = max consecutive run across all history. Recomputed from logs (source of truth).
export function computeStreak(logs, today = todayKey()) {
  const activeKeys = Object.keys(logs)
    .filter((k) => isActiveDay(logs, k))
    .sort()

  if (activeKeys.length === 0) {
    return { current: 0, longest: 0, lastActiveDate: null }
  }

  // current
  let cursor = isActiveDay(logs, today) ? today : addDays(today, -1)
  let current = 0
  while (isActiveDay(logs, cursor)) {
    current += 1
    cursor = addDays(cursor, -1)
  }

  // longest
  let longest = 1
  let run = 1
  for (let i = 1; i < activeKeys.length; i++) {
    if (addDays(activeKeys[i - 1], 1) === activeKeys[i]) {
      run += 1
    } else {
      run = 1
    }
    if (run > longest) longest = run
  }

  return {
    current,
    longest: Math.max(longest, current),
    lastActiveDate: activeKeys[activeKeys.length - 1],
  }
}

// total completions (entries) whose day-key falls in [startKey, endKey] inclusive.
function countEntriesInRange(logs, startKey, endKey) {
  let n = 0
  for (const [key, day] of Object.entries(logs)) {
    if (key >= startKey && key <= endKey) n += day.entries.length
  }
  return n
}

export function weekSummary(logs, today = todayKey()) {
  const thisStart = startOfWeekKey(today)
  const lastStart = addDays(thisStart, -7)
  const lastEnd = addDays(thisStart, -1)
  const thisWeek = countEntriesInRange(logs, thisStart, today)
  const lastWeek = countEntriesInRange(logs, lastStart, lastEnd)
  return { thisWeek, lastWeek, delta: thisWeek - lastWeek }
}

export function monthSummary(logs, today = todayKey()) {
  const d = parseKey(today)
  const y = d.getFullYear()
  const m = d.getMonth()
  const pad = (n) => String(n).padStart(2, '0')
  const thisPrefix = `${y}-${pad(m + 1)}`
  const prev = new Date(y, m - 1, 1)
  const lastPrefix = `${prev.getFullYear()}-${pad(prev.getMonth() + 1)}`
  let thisMonth = 0
  let lastMonth = 0
  for (const [key, day] of Object.entries(logs)) {
    if (key.startsWith(thisPrefix)) thisMonth += day.entries.length
    else if (key.startsWith(lastPrefix)) lastMonth += day.entries.length
  }
  return { thisMonth, lastMonth, delta: thisMonth - lastMonth }
}

// Completions per week for the last `weeks` weeks, ending this week (chronological).
// Each bucket: { start, count }. Current week only counts up to today.
export function weeklyTrend(logs, today = todayKey(), weeks = 8) {
  const thisStart = startOfWeekKey(today)
  const out = []
  for (let i = weeks - 1; i >= 0; i--) {
    const start = addDays(thisStart, -7 * i)
    const rawEnd = addDays(start, 6)
    const end = rawEnd > today ? today : rawEnd
    out.push({ start, count: countEntriesInRange(logs, start, end) })
  }
  return out
}

// Resolve a chore's display label, preferring the current chore then a log snapshot.
function resolveChoreLabel(choreId, chores, logs) {
  const cur = chores.find((c) => c.id === choreId)
  if (cur) return { name: cur.name, emoji: cur.emoji }
  for (const day of Object.values(logs)) {
    for (const e of day.entries) {
      if (e.choreId === choreId) {
        return { name: e.nameSnapshot || '(삭제된 집안일)', emoji: e.emojiSnapshot || '✅' }
      }
    }
  }
  return { name: '(삭제된 집안일)', emoji: '✅' }
}

// An auto-generated monthly reflection for `today`'s month.
// Returns null-ish fields when there's nothing to show (guilt-free: never invents).
export function monthRecap(logs, chores, members, today = todayKey()) {
  const d = parseKey(today)
  const y = d.getFullYear()
  const m = d.getMonth()
  const pad = (n) => String(n).padStart(2, '0')
  const prefix = `${y}-${pad(m + 1)}`
  const monthStart = `${prefix}-01`
  const monthEnd = `${prefix}-${pad(new Date(y, m + 1, 0).getDate())}`

  let total = 0
  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0]
  const choreCounts = new Map()
  for (const [key, day] of Object.entries(logs)) {
    if (!key.startsWith(prefix)) continue
    total += day.entries.length
    weekdayCounts[weekdayOf(key)] += day.entries.length
    for (const e of day.entries) choreCounts.set(e.choreId, (choreCounts.get(e.choreId) || 0) + 1)
  }

  let bestWd = -1
  let bestWdN = 0
  weekdayCounts.forEach((n, i) => {
    if (n > bestWdN) {
      bestWdN = n
      bestWd = i
    }
  })

  let topChoreId = null
  let topChoreN = 0
  for (const [id, n] of choreCounts) {
    if (n > topChoreN) {
      topChoreN = n
      topChoreId = id
    }
  }
  const topChoreLabel = topChoreId ? resolveChoreLabel(topChoreId, chores, logs) : null

  const split = memberSplit(logs, members, monthStart, monthEnd)
  const topMember = [...split.rows].sort((a, b) => b.count - a.count)[0]

  return {
    monthLabel: `${m + 1}월`,
    total,
    bestWeekday: bestWd >= 0 ? { index: bestWd, count: bestWdN } : null,
    topChore: topChoreLabel ? { ...topChoreLabel, count: topChoreN } : null,
    topMember: members.length >= 2 && topMember && topMember.count > 0 ? topMember : null,
  }
}

// Top-N chores by total completions across all history (uses latest snapshot label).
export function topChores(logs, chores, n = 3) {
  const agg = new Map()
  const currentById = new Map(chores.map((c) => [c.id, c]))
  for (const day of Object.values(logs)) {
    for (const e of day.entries) {
      const prev = agg.get(e.choreId) || { choreId: e.choreId, count: 0, name: '', emoji: '✅' }
      prev.count += 1
      const cur = currentById.get(e.choreId)
      prev.name = cur ? cur.name : e.nameSnapshot || '(삭제된 집안일)'
      prev.emoji = cur ? cur.emoji : e.emojiSnapshot || '✅'
      agg.set(e.choreId, prev)
    }
  }
  return [...agg.values()].sort((a, b) => b.count - a.count).slice(0, n)
}

// Completions per weekday (0=Sun..6=Sat), all-time.
export function weekdayBars(logs) {
  const counts = [0, 0, 0, 0, 0, 0, 0]
  for (const [key, day] of Object.entries(logs)) {
    counts[weekdayOf(key)] += day.entries.length
  }
  return counts
}

// 53-week GitHub-style grid ending on today's week.
// Returns { weeks: cell[][], monthLabels: string[] } where cell = {key,count,level}|null.
export function heatmapGrid(logs, today = todayKey()) {
  const NUM_WEEKS = 53
  const startKey = startOfWeekKey(addDays(today, -7 * (NUM_WEEKS - 1)))
  const weeks = []
  const monthLabels = []
  let prevMonth = -1
  for (let w = 0; w < NUM_WEEKS; w++) {
    const col = []
    const sundayKey = addDays(startKey, w * 7)
    const month = parseKey(sundayKey).getMonth()
    monthLabels.push(month !== prevMonth ? `${month + 1}월` : '')
    prevMonth = month
    for (let d = 0; d < 7; d++) {
      const key = addDays(startKey, w * 7 + d)
      if (key > today) {
        col.push(null) // future placeholder
      } else {
        const count = logs[key]?.entries?.length || 0
        col.push({ key, count, level: levelForCount(count) })
      }
    }
    weeks.push(col)
  }
  return { weeks, monthLabels }
}
