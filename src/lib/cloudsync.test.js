import { describe, it, expect } from 'vitest'
import {
  canonicalSig,
  chooseRepull,
  chooseSync,
  docTimestamp,
  isEmptyDoc,
} from './cloudsync.js'

const withData = (extra = {}) => ({
  chores: [{ id: 'c1', name: '설거지' }],
  logs: { '2026-07-05': { entries: [{ id: 'e1', choreId: 'c1' }], note: '' } },
  members: [],
  ...extra,
})

describe('canonicalSig', () => {
  it('is order-independent across logs keys', () => {
    const a = { chores: [], members: [], logs: { '2026-01-02': 1, '2026-01-01': 2 } }
    const b = { chores: [], members: [], logs: { '2026-01-01': 2, '2026-01-02': 1 } }
    expect(canonicalSig(a)).toBe(canonicalSig(b))
  })

  it('ignores fields outside the shared record (settings/timestamps)', () => {
    const a = withData({ settings: { theme: 'dark' }, syncedAt: 'x' })
    const b = withData({ settings: { theme: 'light' }, syncedAt: 'y' })
    expect(canonicalSig(a)).toBe(canonicalSig(b))
  })

  it('changes when the shared record changes', () => {
    expect(canonicalSig(withData())).not.toBe(canonicalSig({ chores: [], logs: {}, members: [] }))
  })

  it('tolerates missing/garbage fields', () => {
    expect(canonicalSig(undefined)).toBe(canonicalSig({}))
    expect(canonicalSig({ chores: 'no', logs: 5, members: null })).toBe(
      canonicalSig({ chores: [], logs: {}, members: [] }),
    )
  })
})

describe('isEmptyDoc', () => {
  it('treats null / no-chores-no-logs as empty', () => {
    expect(isEmptyDoc(null)).toBe(true)
    expect(isEmptyDoc({})).toBe(true)
    expect(isEmptyDoc({ chores: [], logs: {} })).toBe(true)
  })
  it('is non-empty with any chore or any logged day', () => {
    expect(isEmptyDoc({ chores: [{ id: 'a' }], logs: {} })).toBe(false)
    expect(isEmptyDoc({ chores: [], logs: { '2026-01-01': {} } })).toBe(false)
  })
})

describe('docTimestamp', () => {
  it('reads syncedAt, then exportedAt, else 0', () => {
    expect(docTimestamp({ syncedAt: '2026-07-05T00:00:00Z' })).toBe(Date.parse('2026-07-05T00:00:00Z'))
    expect(docTimestamp({ exportedAt: '2026-07-05T00:00:00Z' })).toBe(Date.parse('2026-07-05T00:00:00Z'))
    expect(docTimestamp({})).toBe(0)
    expect(docTimestamp(null)).toBe(0)
    expect(docTimestamp({ syncedAt: 'garbage' })).toBe(0)
  })
})

describe('chooseSync (first connect)', () => {
  const empty = { chores: [], logs: {}, members: [] }
  it('noop when both empty', () => {
    expect(chooseSync(empty, empty)).toBe('noop')
  })
  it('push when only local has data (seed the file)', () => {
    expect(chooseSync(withData(), empty)).toBe('push')
    expect(chooseSync(withData(), null)).toBe('push')
  })
  it('adopt when only the file has data (join a family file)', () => {
    expect(chooseSync(empty, withData())).toBe('adopt')
  })
  it('noop when both hold identical records', () => {
    expect(chooseSync(withData({ syncedAt: 'a' }), withData({ syncedAt: 'b' }))).toBe('noop')
  })
  it('newer timestamp wins when records differ', () => {
    const local = withData({ syncedAt: '2026-07-06T00:00:00Z' })
    const cloud = withData({ members: [{ id: 'm1' }], syncedAt: '2026-07-05T00:00:00Z' })
    expect(chooseSync(local, cloud)).toBe('push')
    expect(chooseSync(cloud, local)).toBe('adopt')
  })
  it('conflict when records differ and timestamps tie', () => {
    const local = withData({ syncedAt: '2026-07-06T00:00:00Z' })
    const cloud = withData({ members: [{ id: 'm1' }], syncedAt: '2026-07-06T00:00:00Z' })
    expect(chooseSync(local, cloud)).toBe('conflict')
  })
})

describe('chooseRepull (later passes)', () => {
  const base = canonicalSig(withData())
  const localDoc = withData()
  const cloudDoc = withData({ members: [{ id: 'm1', name: '엄마' }] })
  const cloudSig = canonicalSig(cloudDoc)

  it('noop when both sides still agree', () => {
    expect(chooseRepull(base, base, base, localDoc, localDoc)).toBe('noop')
  })
  it('adopt when only the file moved', () => {
    expect(chooseRepull(base, base, cloudSig, localDoc, cloudDoc)).toBe('adopt')
  })
  it('push when only local moved', () => {
    expect(chooseRepull(base, cloudSig, base, cloudDoc, localDoc)).toBe('push')
  })
  it('newer wins when both moved independently', () => {
    const l = withData({ members: [{ id: 'mL' }], syncedAt: '2026-07-06T00:00:00Z' })
    const c = withData({ members: [{ id: 'mC' }], syncedAt: '2026-07-05T00:00:00Z' })
    expect(chooseRepull(base, canonicalSig(l), canonicalSig(c), l, c)).toBe('push')
  })
  it('conflict when both moved and timestamps tie', () => {
    const l = withData({ members: [{ id: 'mL' }], syncedAt: '2026-07-06T00:00:00Z' })
    const c = withData({ members: [{ id: 'mC' }], syncedAt: '2026-07-06T00:00:00Z' })
    expect(chooseRepull(base, canonicalSig(l), canonicalSig(c), l, c)).toBe('conflict')
  })
})
