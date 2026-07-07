import { describe, it, expect } from 'vitest'
import { reducer } from './reducer.js'
import { DEFAULT_SETTINGS } from './defaults.js'
import { todayKey } from '../lib/date.js'

const K = '2020-01-01' // fixed past key -> deterministic noon timestamps

function baseState(over = {}) {
  return {
    chores: [
      { id: 'a', name: '설거지', emoji: '🍽️', archived: false, order: 0, createdAt: 'x' },
      { id: 'b', name: '빨래', emoji: '🧺', archived: false, order: 1, createdAt: 'x' },
    ],
    logs: {},
    settings: { ...DEFAULT_SETTINGS },
    members: [],
    streak: { current: 0, longest: 0, lastActiveDate: null },
    undo: null,
    undoSeq: 0,
    ...over,
  }
}

describe('TOGGLE_CHORE', () => {
  it('adds an entry when undone, removes it when done', () => {
    let s = reducer(baseState(), { type: 'TOGGLE_CHORE', choreId: 'a', dateKey: K })
    expect(s.logs[K].entries).toHaveLength(1)
    expect(s.logs[K].entries[0].choreId).toBe('a')

    s = reducer(s, { type: 'TOGGLE_CHORE', choreId: 'a', dateKey: K })
    expect(s.logs[K]).toBeUndefined() // day cleaned up when empty
  })

  it('leaving a note keeps the day alive after untoggling', () => {
    let s = reducer(baseState(), { type: 'TOGGLE_CHORE', choreId: 'a', dateKey: K })
    s = reducer(s, { type: 'SET_NOTE', dateKey: K, note: '메모' })
    s = reducer(s, { type: 'TOGGLE_CHORE', choreId: 'a', dateKey: K })
    expect(s.logs[K].entries).toHaveLength(0)
    expect(s.logs[K].note).toBe('메모')
  })
})

describe('ADD_ENTRY (×N)', () => {
  it('stacks multiple entries for the same chore', () => {
    let s = baseState()
    s = reducer(s, { type: 'ADD_ENTRY', choreId: 'a', dateKey: K })
    s = reducer(s, { type: 'ADD_ENTRY', choreId: 'a', dateKey: K })
    s = reducer(s, { type: 'ADD_ENTRY', choreId: 'a', dateKey: K })
    expect(s.logs[K].entries).toHaveLength(3)
  })
})

describe('attribution (by)', () => {
  it('defaults an entry to the active member', () => {
    const s = reducer(baseState({ settings: { ...DEFAULT_SETTINGS, activeMemberId: 'mom' } }), {
      type: 'TOGGLE_CHORE',
      choreId: 'a',
      dateKey: K,
    })
    expect(s.logs[K].entries[0].by).toBe('mom')
  })

  it('is null when there is no active member (solo)', () => {
    const s = reducer(baseState(), { type: 'TOGGLE_CHORE', choreId: 'a', dateKey: K })
    expect(s.logs[K].entries[0].by).toBe(null)
  })

  it('an explicit by overrides the active member (retro attribution)', () => {
    const s = reducer(baseState({ settings: { ...DEFAULT_SETTINGS, activeMemberId: 'mom' } }), {
      type: 'ADD_ENTRY',
      choreId: 'a',
      dateKey: K,
      by: 'dad',
    })
    expect(s.logs[K].entries[0].by).toBe('dad')
  })

  it('an explicit null by stays 미지정 even with an active member', () => {
    const s = reducer(baseState({ settings: { ...DEFAULT_SETTINGS, activeMemberId: 'mom' } }), {
      type: 'ADD_ENTRY',
      choreId: 'a',
      dateKey: K,
      by: null,
    })
    expect(s.logs[K].entries[0].by).toBe(null)
  })
})

describe('undo', () => {
  it('restores a removed entry', () => {
    let s = reducer(baseState(), { type: 'ADD_ENTRY', choreId: 'a', dateKey: K })
    s = reducer(s, { type: 'REMOVE_LAST_ENTRY', choreId: 'a', dateKey: K })
    expect(s.logs[K]).toBeUndefined()
    expect(s.undo).toBeTruthy()
    s = reducer(s, { type: 'UNDO' })
    expect(s.logs[K].entries).toHaveLength(1)
    expect(s.undo).toBe(null)
  })
})

describe('chore CRUD', () => {
  it('adds a chore with the next order and defaults to daily', () => {
    const s = reducer(baseState(), { type: 'ADD_CHORE', name: '청소', emoji: '🧹' })
    const added = s.chores.at(-1)
    expect(added.name).toBe('청소')
    expect(added.order).toBe(2)
    expect(added.days).toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it('adds a chore with a specific weekday cadence', () => {
    const s = reducer(baseState(), { type: 'ADD_CHORE', name: '분리수거', emoji: '♻️', days: [3, 1] })
    expect(s.chores.at(-1).days).toEqual([1, 3])
  })

  it('edits days, leaving them unchanged when omitted', () => {
    let s = reducer(baseState(), { type: 'EDIT_CHORE', id: 'a', name: '설거지', days: [2, 4] })
    expect(s.chores.find((c) => c.id === 'a').days).toEqual([2, 4])
    s = reducer(s, { type: 'EDIT_CHORE', id: 'a', name: '설거지!', emoji: '🥘' })
    expect(s.chores.find((c) => c.id === 'a').days).toEqual([2, 4]) // preserved
  })

  it('edits name/emoji', () => {
    const s = reducer(baseState(), { type: 'EDIT_CHORE', id: 'a', name: '설거지!', emoji: '🥘' })
    expect(s.chores.find((c) => c.id === 'a')).toMatchObject({ name: '설거지!', emoji: '🥘' })
  })

  it('archives and unarchives (unarchive moves to the end)', () => {
    let s = reducer(baseState(), { type: 'ARCHIVE_CHORE', id: 'a' })
    expect(s.chores.find((c) => c.id === 'a').archived).toBe(true)
    s = reducer(s, { type: 'UNARCHIVE_CHORE', id: 'a' })
    const a = s.chores.find((c) => c.id === 'a')
    expect(a.archived).toBe(false)
    expect(a.order).toBe(2)
  })

  it('deletes then restores at the original index', () => {
    let s = reducer(baseState(), { type: 'DELETE_CHORE', id: 'a' })
    expect(s.chores.map((c) => c.id)).toEqual(['b'])
    expect(s.undo).toBeTruthy()
    s = reducer(s, { type: 'UNDO' })
    expect(s.chores.map((c) => c.id)).toEqual(['a', 'b'])
  })

  it('reorders active chores', () => {
    const s = reducer(baseState(), { type: 'REORDER_CHORES', orderedActiveIds: ['b', 'a'] })
    const order = Object.fromEntries(s.chores.map((c) => [c.id, c.order]))
    expect(order.b).toBe(0)
    expect(order.a).toBe(1)
  })
})

describe('member CRUD', () => {
  it('adds a member and auto-activates the first one', () => {
    const s = reducer(baseState(), { type: 'ADD_MEMBER', name: '엄마', emoji: '👩', color: '#111' })
    expect(s.members).toHaveLength(1)
    expect(s.settings.activeMemberId).toBe(s.members[0].id)
  })

  it('does not steal active status from an existing member', () => {
    let s = reducer(baseState(), { type: 'ADD_MEMBER', name: '엄마', emoji: '👩', color: '#111' })
    const firstId = s.members[0].id
    s = reducer(s, { type: 'ADD_MEMBER', name: '아빠', emoji: '👨', color: '#222' })
    expect(s.settings.activeMemberId).toBe(firstId)
  })

  it('editing updates fields', () => {
    let s = reducer(baseState(), { type: 'ADD_MEMBER', name: '엄마', emoji: '👩', color: '#111' })
    const id = s.members[0].id
    s = reducer(s, { type: 'EDIT_MEMBER', id, name: '엄마💚', emoji: '🌿', color: '#333' })
    expect(s.members[0]).toMatchObject({ name: '엄마💚', emoji: '🌿', color: '#333' })
  })

  it('deleting the active member reassigns active to a remaining one', () => {
    let s = reducer(baseState(), { type: 'ADD_MEMBER', name: '엄마', emoji: '👩', color: '#111' })
    s = reducer(s, { type: 'ADD_MEMBER', name: '아빠', emoji: '👨', color: '#222' })
    const [m1, m2] = s.members
    s = reducer({ ...s, settings: { ...s.settings, activeMemberId: m1.id } }, {
      type: 'DELETE_MEMBER',
      id: m1.id,
    })
    expect(s.members.map((m) => m.id)).toEqual([m2.id])
    expect(s.settings.activeMemberId).toBe(m2.id)
  })

  it('deleting the last member clears active to null', () => {
    let s = reducer(baseState(), { type: 'ADD_MEMBER', name: '엄마', emoji: '👩', color: '#111' })
    const id = s.members[0].id
    s = reducer(s, { type: 'DELETE_MEMBER', id })
    expect(s.members).toHaveLength(0)
    expect(s.settings.activeMemberId).toBe(null)
  })
})

describe('IMPORT_DATA / RESET_ALL', () => {
  it('import replaces chores, logs, members and clears undo', () => {
    const s = reducer(baseState({ undo: { seq: 1, label: 'x', action: {} } }), {
      type: 'IMPORT_DATA',
      chores: [{ id: 'z', name: '새', emoji: '⭐', archived: false, order: 0, createdAt: 'x' }],
      logs: {},
      settings: { theme: 'dark' },
      members: [{ id: 'm', name: '엄마', emoji: '👩', color: '#111', order: 0, createdAt: 'x' }],
    })
    expect(s.chores.map((c) => c.id)).toEqual(['z'])
    expect(s.members).toHaveLength(1)
    expect(s.settings.theme).toBe('dark')
    expect(s.undo).toBe(null)
  })

  it('reset clears chores, members and logs but keeps onboarded', () => {
    const s = reducer(baseState({ members: [{ id: 'm', name: 'x', emoji: '👩', color: '#1', order: 0, createdAt: 'x' }] }), {
      type: 'RESET_ALL',
    })
    expect(s.chores).toEqual([])
    expect(s.members).toEqual([])
    expect(s.logs).toEqual({})
    expect(s.settings.onboarded).toBe(true)
  })
})

describe('cross-tab hydrate', () => {
  it('replaces a slice and drops any pending undo', () => {
    const s = reducer(baseState({ undo: { seq: 1, label: 'x', action: {} } }), {
      type: 'HYDRATE_KEY',
      key: 'members',
      value: [{ id: 'm', name: '엄마', emoji: '👩', color: '#111', order: 0, createdAt: 'x' }],
    })
    expect(s.members).toHaveLength(1)
    expect(s.undo).toBe(null)
  })

  it('recomputes streak when logs are hydrated', () => {
    const logs = { [todayKey()]: { entries: [{ id: '1', choreId: 'a', completedAt: 'x', by: null }], note: '' } }
    const s = reducer(baseState(), { type: 'HYDRATE_KEY', key: 'logs', value: logs })
    expect(s.streak.current).toBe(1)
  })
})
