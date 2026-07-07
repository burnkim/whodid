// reducer.js — pure state transitions. The ONLY place store data mutates.

import { noonIsoFor, todayKey } from '../lib/date.js'
import { uid } from '../lib/id.js'
import { computeStreak } from './selectors.js'
import { ALL_DAYS, DEFAULT_SETTINGS, DEFAULT_STREAK } from './defaults.js'

// Normalize a days argument -> sorted valid weekday list, defaulting to daily.
function normalizeDays(days) {
  if (!Array.isArray(days)) return [...ALL_DAYS]
  const out = [...new Set(days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort(
    (a, b) => a - b,
  )
  return out.length ? out : [...ALL_DAYS]
}

// ---- helpers ---------------------------------------------------------------

function cleanupDay(day) {
  // Drop a day entirely once it has no entries and no note (keeps logs lean).
  if (day.entries.length === 0 && (!day.note || day.note === '')) return null
  return day
}

function setDay(logs, key, nextDay) {
  const next = { ...logs }
  if (nextDay === null) delete next[key]
  else next[key] = nextDay
  return next
}

function getDay(logs, key) {
  return logs[key] || { entries: [], note: '' }
}

function makeEntry(chore, key, by = null) {
  const completedAt = key === todayKey() ? new Date().toISOString() : noonIsoFor(key)
  return {
    id: uid(),
    choreId: chore.id,
    completedAt,
    nameSnapshot: chore.name,
    emojiSnapshot: chore.emoji,
    by: by || null, // memberId who did it; null = 미지정
  }
}

function indexOfMostRecent(entries, choreId) {
  let idx = -1
  let best = ''
  entries.forEach((e, i) => {
    if (e.choreId === choreId && e.completedAt >= best) {
      best = e.completedAt
      idx = i
    }
  })
  return idx
}

// recompute the derived streak cache after any logs change.
function withLogs(state, logs, extra = {}) {
  return { ...state, logs, streak: computeStreak(logs), ...extra }
}

function withUndo(state, label, action) {
  const seq = state.undoSeq + 1
  return { undoSeq: seq, undo: { seq, label, action } }
}

function addEntry(state, choreId, key, by) {
  const chore =
    state.chores.find((c) => c.id === choreId) || {
      id: choreId,
      name: '집안일',
      emoji: '✅',
    }
  // Undefined `by` falls back to the active member; an explicit null stays 미지정.
  const attributed = by !== undefined ? by : state.settings.activeMemberId || null
  const day = getDay(state.logs, key)
  const entry = makeEntry(chore, key, attributed)
  const nextDay = { ...day, entries: [...day.entries, entry] }
  return withLogs(state, setDay(state.logs, key, nextDay))
}

function removeMostRecent(state, choreId, key) {
  const day = getDay(state.logs, key)
  const idx = indexOfMostRecent(day.entries, choreId)
  if (idx === -1) return state
  const removed = day.entries[idx]
  const entries = day.entries.filter((_, i) => i !== idx)
  const nextDay = cleanupDay({ ...day, entries })
  return withLogs(state, setDay(state.logs, key, nextDay), {
    ...withUndo(state, '체크를 해제했어요', {
      type: 'RESTORE_ENTRY',
      dateKey: key,
      entry: removed,
    }),
  })
}

// ---- reducer ---------------------------------------------------------------

export function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE_KEY': {
      // Cross-tab sync: replace one slice from another tab's write.
      // A pending undo captured ids from this tab's old state, so drop it —
      // replaying it against another tab's data could orphan/corrupt entries.
      const next = { ...state, [action.key]: action.value, undo: null }
      if (action.key === 'logs') next.streak = computeStreak(action.value)
      return next
    }

    case 'TOGGLE_CHORE': {
      const key = action.dateKey
      const done = getDay(state.logs, key).entries.some((e) => e.choreId === action.choreId)
      return done
        ? removeMostRecent(state, action.choreId, key)
        : addEntry(state, action.choreId, key, action.by)
    }

    case 'ADD_ENTRY':
      return addEntry(state, action.choreId, action.dateKey, action.by)

    case 'REMOVE_LAST_ENTRY':
      return removeMostRecent(state, action.choreId, action.dateKey)

    case 'RESTORE_ENTRY': {
      const day = getDay(state.logs, action.dateKey)
      const nextDay = { ...day, entries: [...day.entries, action.entry] }
      return withLogs(state, setDay(state.logs, action.dateKey, nextDay))
    }

    case 'SET_NOTE': {
      const day = getDay(state.logs, action.dateKey)
      const nextDay = cleanupDay({ ...day, note: action.note })
      return withLogs(state, setDay(state.logs, action.dateKey, nextDay))
    }

    case 'CLEAR_DAY': {
      const day = state.logs[action.dateKey]
      if (!day) return state
      return withLogs(state, setDay(state.logs, action.dateKey, null), {
        ...withUndo(state, '하루 기록을 삭제했어요', {
          type: 'RESTORE_DAY',
          dateKey: action.dateKey,
          day,
        }),
      })
    }

    case 'RESTORE_DAY':
      return withLogs(state, setDay(state.logs, action.dateKey, action.day))

    case 'ADD_CHORE': {
      const maxOrder = state.chores.reduce((m, c) => Math.max(m, c.order), -1)
      const chore = {
        id: uid(),
        name: action.name,
        emoji: action.emoji || '✅',
        archived: false,
        order: maxOrder + 1,
        createdAt: new Date().toISOString(),
        days: normalizeDays(action.days),
      }
      return { ...state, chores: [...state.chores, chore] }
    }

    case 'EDIT_CHORE':
      return {
        ...state,
        chores: state.chores.map((c) =>
          c.id === action.id
            ? {
                ...c,
                name: action.name,
                emoji: action.emoji || c.emoji,
                days: action.days ? normalizeDays(action.days) : c.days,
              }
            : c,
        ),
      }

    case 'ARCHIVE_CHORE':
      return {
        ...state,
        chores: state.chores.map((c) =>
          c.id === action.id ? { ...c, archived: true } : c,
        ),
      }

    case 'UNARCHIVE_CHORE': {
      const maxOrder = state.chores.reduce((m, c) => Math.max(m, c.order), -1)
      return {
        ...state,
        chores: state.chores.map((c) =>
          c.id === action.id ? { ...c, archived: false, order: maxOrder + 1 } : c,
        ),
      }
    }

    case 'DELETE_CHORE': {
      const index = state.chores.findIndex((c) => c.id === action.id)
      if (index === -1) return state
      const chore = state.chores[index]
      const chores = state.chores.filter((c) => c.id !== action.id)
      return {
        ...state,
        chores,
        ...withUndo(state, '집안일을 삭제했어요', {
          type: 'RESTORE_CHORE',
          chore,
          index,
        }),
      }
    }

    case 'RESTORE_CHORE': {
      const chores = [...state.chores]
      const at = Math.min(action.index, chores.length)
      chores.splice(at, 0, action.chore)
      return { ...state, chores }
    }

    case 'REORDER_CHORES': {
      // action.orderedActiveIds = active chore ids in new display order.
      const orderMap = new Map(action.orderedActiveIds.map((id, i) => [id, i]))
      const base = action.orderedActiveIds.length
      let archivedCursor = 0
      const chores = state.chores.map((c) => {
        if (orderMap.has(c.id)) return { ...c, order: orderMap.get(c.id) }
        return { ...c, order: base + archivedCursor++ }
      })
      return { ...state, chores }
    }

    case 'ADD_MEMBER': {
      const maxOrder = state.members.reduce((m, x) => Math.max(m, x.order), -1)
      const member = {
        id: uid(),
        name: action.name,
        emoji: action.emoji || '🙂',
        color: action.color,
        order: maxOrder + 1,
        createdAt: new Date().toISOString(),
      }
      const members = [...state.members, member]
      // First member becomes active automatically so attribution "just works".
      const activeMemberId = state.settings.activeMemberId || member.id
      return { ...state, members, settings: { ...state.settings, activeMemberId } }
    }

    case 'EDIT_MEMBER':
      return {
        ...state,
        members: state.members.map((m) =>
          m.id === action.id
            ? { ...m, name: action.name, emoji: action.emoji || m.emoji, color: action.color || m.color }
            : m,
        ),
      }

    case 'DELETE_MEMBER': {
      // Past entries keep their `by` snapshot (history is immutable); selectors
      // resolve an unknown id to a "미지정/기타" bucket gracefully.
      const members = state.members.filter((m) => m.id !== action.id)
      let activeMemberId = state.settings.activeMemberId
      if (activeMemberId === action.id) {
        activeMemberId = members.length ? members[0].id : null
      }
      return { ...state, members, settings: { ...state.settings, activeMemberId } }
    }

    case 'REORDER_MEMBERS': {
      const orderMap = new Map(action.orderedIds.map((id, i) => [id, i]))
      const members = state.members.map((m) =>
        orderMap.has(m.id) ? { ...m, order: orderMap.get(m.id) } : m,
      )
      return { ...state, members }
    }

    case 'SET_ACTIVE_MEMBER':
      return { ...state, settings: { ...state.settings, activeMemberId: action.id } }

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.patch } }

    case 'IMPORT_DATA':
      // Replacing all data invalidates any pending undo (its ids are gone).
      return withLogs(
        {
          ...state,
          chores: action.chores,
          members: action.members || [],
          settings: { ...state.settings, ...action.settings },
          undo: null,
          undoSeq: 0,
        },
        action.logs,
      )

    case 'RESET_ALL':
      return withLogs(
        {
          ...state,
          chores: [],
          members: [],
          settings: { ...DEFAULT_SETTINGS, onboarded: true },
          undo: null,
          undoSeq: 0,
        },
        {},
      )

    case 'UNDO': {
      if (!state.undo) return state
      const cleared = { ...state, undo: null }
      return reducer(cleared, state.undo.action)
    }

    case 'CLEAR_UNDO':
      // Only clear if it's still the same toast (avoid racing a newer undo).
      if (action.seq && state.undo && state.undo.seq !== action.seq) return state
      return { ...state, undo: null }

    default:
      return state
  }
}

export { DEFAULT_STREAK }
