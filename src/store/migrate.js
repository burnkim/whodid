// migrate.js — normalize loaded data to the current schema.
// Defensive: tolerates missing/legacy fields without throwing.

import {
  ALL_DAYS,
  DEFAULT_SETTINGS,
  DEFAULT_STREAK,
  MEMBER_COLORS,
  SCHEMA_VERSION,
} from './defaults.js'

// Keep only valid weekday indices; empty/invalid -> daily (all days).
function cleanDays(raw) {
  if (!Array.isArray(raw)) return [...ALL_DAYS]
  const days = [...new Set(raw.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort(
    (a, b) => a - b,
  )
  return days.length ? days : [...ALL_DAYS]
}

export function migrateSettings(raw) {
  const s = raw && typeof raw === 'object' ? raw : {}
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    schemaVersion: SCHEMA_VERSION,
  }
}

export function migrateChores(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((c) => c && typeof c === 'object' && typeof c.id === 'string')
    .map((c, i) => ({
      id: c.id,
      name: typeof c.name === 'string' ? c.name : '집안일',
      emoji: typeof c.emoji === 'string' && c.emoji ? c.emoji : '✅',
      archived: Boolean(c.archived),
      order: Number.isFinite(c.order) ? c.order : i,
      createdAt: typeof c.createdAt === 'string' ? c.createdAt : new Date(0).toISOString(),
      // v2: weekday cadence. Legacy chores have no `days` -> daily.
      days: cleanDays(c.days),
    }))
}

export function migrateLogs(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out = {}
  for (const [key, day] of Object.entries(raw)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue
    const entries = Array.isArray(day?.entries) ? day.entries : []
    const cleanEntries = entries
      .filter((e) => e && typeof e === 'object' && typeof e.choreId === 'string')
      .map((e) => ({
        id: typeof e.id === 'string' ? e.id : `${key}-${Math.random().toString(36).slice(2)}`,
        choreId: e.choreId,
        completedAt: typeof e.completedAt === 'string' ? e.completedAt : new Date().toISOString(),
        nameSnapshot: typeof e.nameSnapshot === 'string' ? e.nameSnapshot : '',
        emojiSnapshot: typeof e.emojiSnapshot === 'string' ? e.emojiSnapshot : '✅',
        // v2: attribution. Legacy entries have no `by` → null (미지정).
        by: typeof e.by === 'string' && e.by ? e.by : null,
      }))
    const note = typeof day?.note === 'string' ? day.note : ''
    if (cleanEntries.length === 0 && note === '') continue
    out[key] = { entries: cleanEntries, note }
  }
  return out
}

export function migrateStreak(raw) {
  const s = raw && typeof raw === 'object' ? raw : {}
  return {
    ...DEFAULT_STREAK,
    ...s,
  }
}

export function migrateMembers(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((m) => m && typeof m === 'object' && typeof m.id === 'string')
    .map((m, i) => ({
      id: m.id,
      name: typeof m.name === 'string' && m.name ? m.name : '가족',
      emoji: typeof m.emoji === 'string' && m.emoji ? m.emoji : '🙂',
      color:
        typeof m.color === 'string' && m.color
          ? m.color
          : MEMBER_COLORS[i % MEMBER_COLORS.length],
      order: Number.isFinite(m.order) ? m.order : i,
      createdAt: typeof m.createdAt === 'string' ? m.createdAt : new Date(0).toISOString(),
    }))
}
