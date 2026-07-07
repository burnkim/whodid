import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { todayKey } from '../lib/date.js'
import { reducer } from './reducer.js'
import { computeStreak } from './selectors.js'
import { CORRUPT_BACKUP_KEY, DEFAULT_LOGS, DEFAULT_SETTINGS, KEYS } from './defaults.js'
import { migrateChores, migrateLogs, migrateMembers, migrateSettings } from './migrate.js'
import { StoreContext } from './context.js'

// guarded read; snapshots corrupt blobs instead of wiping everything.
function readKey(key) {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return undefined
    return JSON.parse(raw)
  } catch {
    try {
      const raw = localStorage.getItem(key)
      if (raw != null) localStorage.setItem(`${CORRUPT_BACKUP_KEY}:${key}`, raw)
    } catch {
      /* ignore */
    }
    return undefined
  }
}

function loadInitialState() {
  let chores = []
  let logs = DEFAULT_LOGS
  let settings = DEFAULT_SETTINGS
  let members = []
  try {
    chores = migrateChores(readKey(KEYS.chores))
    logs = migrateLogs(readKey(KEYS.logs))
    settings = migrateSettings(readKey(KEYS.settings))
    members = migrateMembers(readKey(KEYS.members))
  } catch {
    /* fall back to defaults already set */
  }
  return {
    chores,
    logs,
    settings,
    members,
    streak: computeStreak(logs), // recompute; never trust the cached value
    undo: null,
    undoSeq: 0,
  }
}

const SLICE_BY_STORAGE_KEY = {
  [KEYS.chores]: 'chores',
  [KEYS.logs]: 'logs',
  [KEYS.settings]: 'settings',
  [KEYS.streak]: 'streak',
  [KEYS.members]: 'members',
}

const MIGRATE_BY_SLICE = {
  chores: migrateChores,
  logs: migrateLogs,
  settings: migrateSettings,
  members: migrateMembers,
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState)
  const [storageError, setStorageError] = useState(false)

  // --- persistence: write each slice when it changes (compare-skip = no ping-pong) ---
  const write = useCallback((key, value) => {
    try {
      const next = JSON.stringify(value)
      if (localStorage.getItem(key) === next) return
      localStorage.setItem(key, next)
    } catch {
      // Defer so we never call setState synchronously inside the write effect.
      queueMicrotask(() => setStorageError(true))
    }
  }, [])

  useEffect(() => write(KEYS.chores, state.chores), [state.chores, write])
  useEffect(() => write(KEYS.logs, state.logs), [state.logs, write])
  useEffect(() => write(KEYS.settings, state.settings), [state.settings, write])
  useEffect(() => write(KEYS.streak, state.streak), [state.streak, write])
  useEffect(() => write(KEYS.members, state.members), [state.members, write])

  // --- cross-tab sync ---
  useEffect(() => {
    function onStorage(e) {
      if (!e.key || !(e.key in SLICE_BY_STORAGE_KEY)) return
      const slice = SLICE_BY_STORAGE_KEY[e.key]
      if (slice === 'streak') return // derived; will be recomputed from logs
      let value
      if (e.newValue == null) {
        value =
          slice === 'chores' || slice === 'members'
            ? []
            : slice === 'logs'
              ? {}
              : DEFAULT_SETTINGS
      } else {
        try {
          value = MIGRATE_BY_SLICE[slice](JSON.parse(e.newValue))
        } catch {
          return
        }
      }
      dispatch({ type: 'HYDRATE_KEY', key: slice, value })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // --- actions ---
  const actions = useMemo(
    () => ({
      toggleChore: (choreId, dateKey = todayKey(), by) =>
        dispatch({ type: 'TOGGLE_CHORE', choreId, dateKey, by }),
      addEntry: (choreId, dateKey = todayKey(), by) =>
        dispatch({ type: 'ADD_ENTRY', choreId, dateKey, by }),
      removeLast: (choreId, dateKey = todayKey()) =>
        dispatch({ type: 'REMOVE_LAST_ENTRY', choreId, dateKey }),
      setNote: (dateKey, note) => dispatch({ type: 'SET_NOTE', dateKey, note }),
      clearDay: (dateKey) => dispatch({ type: 'CLEAR_DAY', dateKey }),
      addChore: (name, emoji, days) => dispatch({ type: 'ADD_CHORE', name, emoji, days }),
      editChore: (id, name, emoji, days) =>
        dispatch({ type: 'EDIT_CHORE', id, name, emoji, days }),
      archiveChore: (id) => dispatch({ type: 'ARCHIVE_CHORE', id }),
      unarchiveChore: (id) => dispatch({ type: 'UNARCHIVE_CHORE', id }),
      deleteChore: (id) => dispatch({ type: 'DELETE_CHORE', id }),
      reorderChores: (orderedActiveIds) =>
        dispatch({ type: 'REORDER_CHORES', orderedActiveIds }),
      addMember: (name, emoji, color) => dispatch({ type: 'ADD_MEMBER', name, emoji, color }),
      editMember: (id, name, emoji, color) =>
        dispatch({ type: 'EDIT_MEMBER', id, name, emoji, color }),
      deleteMember: (id) => dispatch({ type: 'DELETE_MEMBER', id }),
      reorderMembers: (orderedIds) => dispatch({ type: 'REORDER_MEMBERS', orderedIds }),
      setActiveMember: (id) => dispatch({ type: 'SET_ACTIVE_MEMBER', id }),
      updateSettings: (patch) => dispatch({ type: 'UPDATE_SETTINGS', patch }),
      undo: () => dispatch({ type: 'UNDO' }),
      clearUndo: (seq) => dispatch({ type: 'CLEAR_UNDO', seq }),
      importData: (payload) => dispatch({ type: 'IMPORT_DATA', ...payload }),
      resetAll: () => dispatch({ type: 'RESET_ALL' }),
      markConfetti: (dateKey) =>
        dispatch({ type: 'UPDATE_SETTINGS', patch: { lastConfettiDate: dateKey } }),
      markSeen: (dateKey) =>
        dispatch({ type: 'UPDATE_SETTINGS', patch: { lastSeenDate: dateKey } }),
      markExport: () =>
        dispatch({ type: 'UPDATE_SETTINGS', patch: { lastExportAt: new Date().toISOString() } }),
      onboardComplete: (presets) => {
        for (const p of presets) dispatch({ type: 'ADD_CHORE', name: p.name, emoji: p.emoji })
        dispatch({
          type: 'UPDATE_SETTINGS',
          patch: { onboarded: true, lastSeenDate: todayKey() },
        })
      },
    }),
    [],
  )

  const value = useMemo(
    () => ({ state, dispatch, actions, storageError, dismissStorageError: () => setStorageError(false) }),
    [state, actions, storageError],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
