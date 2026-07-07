import { describe, it, expect } from 'vitest'
import {
  addDays,
  dateKey,
  formatKDate,
  formatTime,
  noonIsoFor,
  parseKey,
  startOfWeekKey,
  weekdayOf,
} from './date.js'

describe('dateKey', () => {
  it('formats a local Date as zero-padded YYYY-MM-DD', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(dateKey(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('uses local components, not UTC (no day drift near midnight)', () => {
    // 2026-03-10 00:30 local — toISOString() would report the previous UTC day
    // west of GMT; dateKey must stay on the local day.
    const d = new Date(2026, 2, 10, 0, 30)
    expect(dateKey(d)).toBe('2026-03-10')
  })
})

describe('parseKey', () => {
  it('parses to a local Date anchored at noon', () => {
    const d = parseKey('2026-06-22')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(5)
    expect(d.getDate()).toBe(22)
    expect(d.getHours()).toBe(12)
  })

  it('round-trips through dateKey', () => {
    for (const k of ['2024-02-29', '2026-01-01', '2026-12-31']) {
      expect(dateKey(parseKey(k))).toBe(k)
    }
  })
})

describe('addDays', () => {
  it('crosses month boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('crosses year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('handles leap years', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01')
    expect(addDays('2025-02-28', 1)).toBe('2025-03-01')
  })

  it('is noon-anchored so DST spring-forward never skips a day', () => {
    // US DST 2026 begins 2026-03-08. Noon anchoring keeps arithmetic exact.
    expect(addDays('2026-03-07', 1)).toBe('2026-03-08')
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09')
  })

  it('is a no-op for 0', () => {
    expect(addDays('2026-06-15', 0)).toBe('2026-06-15')
  })
})

describe('weekdayOf', () => {
  it('returns 0=Sun .. 6=Sat', () => {
    expect(weekdayOf('2026-07-05')).toBe(0) // Sunday
    expect(weekdayOf('2026-07-06')).toBe(1) // Monday
    expect(weekdayOf('2026-07-11')).toBe(6) // Saturday
  })
})

describe('startOfWeekKey', () => {
  it('returns the Sunday on/before the key', () => {
    expect(startOfWeekKey('2026-07-05')).toBe('2026-07-05') // already Sunday
    expect(startOfWeekKey('2026-07-08')).toBe('2026-07-05') // Wed -> Sun
    expect(startOfWeekKey('2026-07-11')).toBe('2026-07-05') // Sat -> Sun
  })

  it('crosses month boundaries backward', () => {
    expect(startOfWeekKey('2026-07-01')).toBe('2026-06-28')
  })
})

describe('formatKDate', () => {
  it('formats Korean date with weekday', () => {
    expect(formatKDate('2026-06-22')).toBe('6월 22일 (월)')
  })
})

describe('formatTime', () => {
  it('formats HH:mm from an ISO string', () => {
    const iso = new Date(2026, 5, 22, 8, 12).toISOString()
    expect(formatTime(iso)).toBe('08:12')
  })

  it('returns empty string for missing/invalid input', () => {
    expect(formatTime('')).toBe('')
    expect(formatTime('not-a-date')).toBe('')
  })
})

describe('noonIsoFor', () => {
  it('anchors an ISO timestamp at local noon of the key', () => {
    const iso = noonIsoFor('2026-06-22')
    const d = new Date(iso)
    // Whatever the timezone, dateKey of the noon anchor must be the same day.
    expect(dateKey(d)).toBe('2026-06-22')
  })
})
