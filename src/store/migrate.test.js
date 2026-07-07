import { describe, it, expect } from 'vitest'
import {
  migrateChores,
  migrateLogs,
  migrateMembers,
  migrateSettings,
  migrateStreak,
} from './migrate.js'
import { DEFAULT_SETTINGS, SCHEMA_VERSION } from './defaults.js'

describe('migrateChores', () => {
  it('returns [] for non-array input', () => {
    expect(migrateChores(null)).toEqual([])
    expect(migrateChores(undefined)).toEqual([])
    expect(migrateChores({})).toEqual([])
    expect(migrateChores('nope')).toEqual([])
  })

  it('drops entries without a string id', () => {
    const out = migrateChores([{ name: '설거지' }, { id: 'a', name: '빨래' }, null, 42])
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe('a')
  })

  it('fills defaults for missing fields', () => {
    const [c] = migrateChores([{ id: 'x' }])
    expect(c.name).toBe('집안일')
    expect(c.emoji).toBe('✅')
    expect(c.archived).toBe(false)
    expect(c.order).toBe(0)
    expect(typeof c.createdAt).toBe('string')
  })

  it('coerces order to its index when non-finite', () => {
    const out = migrateChores([
      { id: 'a', order: 'bad' },
      { id: 'b', order: NaN },
    ])
    expect(out[0].order).toBe(0)
    expect(out[1].order).toBe(1)
  })

  it('defaults legacy chores to daily and sanitizes bad days', () => {
    const out = migrateChores([
      { id: 'a' }, // no days -> daily
      { id: 'b', days: [1, 3, 5] },
      { id: 'c', days: [9, -1, 2, 2] }, // dedupe + drop out-of-range
      { id: 'd', days: [] }, // empty -> daily
    ])
    expect(out[0].days).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(out[1].days).toEqual([1, 3, 5])
    expect(out[2].days).toEqual([2])
    expect(out[3].days).toEqual([0, 1, 2, 3, 4, 5, 6])
  })
})

describe('migrateLogs', () => {
  it('returns {} for non-object / array input', () => {
    expect(migrateLogs(null)).toEqual({})
    expect(migrateLogs([])).toEqual({})
    expect(migrateLogs('x')).toEqual({})
  })

  it('drops malformed date keys', () => {
    const out = migrateLogs({
      'not-a-date': { entries: [{ choreId: 'a' }] },
      '2026-06-22': { entries: [{ choreId: 'a' }] },
    })
    expect(Object.keys(out)).toEqual(['2026-06-22'])
  })

  it('preserves entry.by and defaults missing attribution to null', () => {
    const out = migrateLogs({
      '2026-06-22': {
        entries: [
          { choreId: 'a', by: 'mom' },
          { choreId: 'b' },
          { choreId: 'c', by: 42 },
        ],
      },
    })
    const [e1, e2, e3] = out['2026-06-22'].entries
    expect(e1.by).toBe('mom')
    expect(e2.by).toBe(null) // legacy entry
    expect(e3.by).toBe(null) // invalid type coerced
  })

  it('drops empty days with no entries and no note', () => {
    const out = migrateLogs({ '2026-06-22': { entries: [], note: '' } })
    expect(out).toEqual({})
  })

  it('keeps a day that has only a note', () => {
    const out = migrateLogs({ '2026-06-22': { entries: [], note: '메모' } })
    expect(out['2026-06-22'].note).toBe('메모')
  })
})

describe('migrateSettings', () => {
  it('fills defaults and stamps the current schema version', () => {
    const s = migrateSettings(null)
    expect(s).toMatchObject(DEFAULT_SETTINGS)
    expect(s.schemaVersion).toBe(SCHEMA_VERSION)
  })

  it('keeps known overrides while adding new v2 fields', () => {
    const s = migrateSettings({ theme: 'dark', schemaVersion: 1 })
    expect(s.theme).toBe('dark')
    expect(s.schemaVersion).toBe(SCHEMA_VERSION)
    expect(s.activeMemberId).toBe(null) // new in v2
  })
})

describe('migrateMembers', () => {
  it('returns [] for non-array input', () => {
    expect(migrateMembers(null)).toEqual([])
    expect(migrateMembers({})).toEqual([])
  })

  it('drops members without a string id and fills defaults', () => {
    const out = migrateMembers([{ name: '엄마' }, { id: 'm1' }])
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe('m1')
    expect(out[0].name).toBe('가족')
    expect(out[0].emoji).toBe('🙂')
    expect(typeof out[0].color).toBe('string')
    expect(out[0].order).toBe(0)
  })

  it('assigns a palette color when none is provided', () => {
    const out = migrateMembers([{ id: 'a' }, { id: 'b' }])
    expect(out[0].color).not.toBe(out[1].color)
  })
})

describe('migrateStreak', () => {
  it('fills defaults', () => {
    expect(migrateStreak(null)).toEqual({ current: 0, longest: 0, lastActiveDate: null })
  })
})
