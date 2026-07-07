import { describe, it, expect } from 'vitest'
import {
  attributionEnabled,
  choreDueOn,
  computeStreak,
  heatmapGrid,
  isDaily,
  levelForCount,
  memberById,
  memberSplit,
  monthRecap,
  monthSummary,
  progressOn,
  sortedMembers,
  splitByDue,
  topChores,
  weekSummary,
  weeklyTrend,
  weekdayBars,
} from './selectors.js'

// Build a logs map from { key: [ {choreId, by?}, ... ] }.
function mkLogs(spec) {
  const out = {}
  for (const [key, entries] of Object.entries(spec)) {
    out[key] = {
      entries: entries.map((e, i) => ({
        id: `${key}-${i}`,
        choreId: e.choreId,
        completedAt: `${key}T12:00:00.000Z`,
        nameSnapshot: e.name || '',
        emojiSnapshot: e.emoji || '✅',
        by: e.by ?? null,
      })),
      note: '',
    }
  }
  return out
}

describe('levelForCount', () => {
  it('buckets counts into 0..4', () => {
    expect(levelForCount(0)).toBe(0)
    expect(levelForCount(1)).toBe(1)
    expect(levelForCount(2)).toBe(2)
    expect(levelForCount(3)).toBe(3)
    expect(levelForCount(4)).toBe(3)
    expect(levelForCount(5)).toBe(4)
    expect(levelForCount(99)).toBe(4)
  })
})

describe('progressOn', () => {
  const active = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]

  it('is 0/0 when there are no active chores', () => {
    expect(progressOn({}, '2026-07-05', [])).toEqual({ done: 0, total: 0, ratio: 0 })
  })

  it('counts distinct active chores done that day', () => {
    const logs = mkLogs({ '2026-07-05': [{ choreId: 'a' }, { choreId: 'a' }, { choreId: 'b' }] })
    const p = progressOn(logs, '2026-07-05', active)
    expect(p.done).toBe(2) // a and b (a's duplicate doesn't double-count)
    expect(p.total).toBe(3)
    expect(p.ratio).toBeCloseTo(2 / 3)
  })
})

describe('computeStreak', () => {
  it('is zeroed for empty logs', () => {
    expect(computeStreak({}, '2026-07-05')).toEqual({ current: 0, longest: 0, lastActiveDate: null })
  })

  it('counts consecutive days ending today', () => {
    const logs = mkLogs({
      '2026-07-03': [{ choreId: 'a' }],
      '2026-07-04': [{ choreId: 'a' }],
      '2026-07-05': [{ choreId: 'a' }],
    })
    expect(computeStreak(logs, '2026-07-05').current).toBe(3)
  })

  it('keeps the current streak alive when today is still pending', () => {
    // active through yesterday, nothing today yet -> current still counts yesterday's run
    const logs = mkLogs({
      '2026-07-03': [{ choreId: 'a' }],
      '2026-07-04': [{ choreId: 'a' }],
    })
    expect(computeStreak(logs, '2026-07-05').current).toBe(2)
  })

  it('resets current to 0 after a two-day gap', () => {
    const logs = mkLogs({
      '2026-07-01': [{ choreId: 'a' }],
      '2026-07-02': [{ choreId: 'a' }],
    })
    expect(computeStreak(logs, '2026-07-05').current).toBe(0)
  })

  it('finds the longest historical run', () => {
    const logs = mkLogs({
      '2026-06-01': [{ choreId: 'a' }],
      '2026-06-02': [{ choreId: 'a' }],
      '2026-06-03': [{ choreId: 'a' }],
      '2026-06-04': [{ choreId: 'a' }],
      // gap
      '2026-07-04': [{ choreId: 'a' }],
      '2026-07-05': [{ choreId: 'a' }],
    })
    const s = computeStreak(logs, '2026-07-05')
    expect(s.longest).toBe(4)
    expect(s.current).toBe(2)
    expect(s.lastActiveDate).toBe('2026-07-05')
  })
})

describe('weekSummary / monthSummary', () => {
  it('computes this-week vs last-week deltas', () => {
    const logs = mkLogs({
      '2026-07-05': [{ choreId: 'a' }, { choreId: 'b' }], // this week (Sun)
      '2026-06-30': [{ choreId: 'a' }], // last week
      '2026-07-01': [{ choreId: 'a' }], // last week
    })
    const w = weekSummary(logs, '2026-07-05')
    expect(w.thisWeek).toBe(2)
    expect(w.lastWeek).toBe(2)
    expect(w.delta).toBe(0)
  })

  it('computes this-month vs last-month deltas', () => {
    const logs = mkLogs({
      '2026-07-05': [{ choreId: 'a' }, { choreId: 'b' }],
      '2026-06-15': [{ choreId: 'a' }],
    })
    const m = monthSummary(logs, '2026-07-05')
    expect(m.thisMonth).toBe(2)
    expect(m.lastMonth).toBe(1)
    expect(m.delta).toBe(1)
  })
})

describe('topChores', () => {
  it('ranks by total completions and uses the current label', () => {
    const logs = mkLogs({
      '2026-07-04': [{ choreId: 'a' }, { choreId: 'a' }, { choreId: 'b' }],
      '2026-07-05': [{ choreId: 'a' }, { choreId: 'c' }],
    })
    const chores = [
      { id: 'a', name: '설거지', emoji: '🍽️' },
      { id: 'b', name: '빨래', emoji: '🧺' },
    ]
    const top = topChores(logs, chores, 3)
    expect(top[0]).toMatchObject({ choreId: 'a', count: 3, name: '설거지' })
    expect(top.map((t) => t.choreId)).toEqual(['a', 'b', 'c'])
  })

  it('falls back to snapshot label for deleted chores', () => {
    const logs = {
      '2026-07-05': {
        entries: [{ id: '1', choreId: 'gone', completedAt: 'x', nameSnapshot: '옛일', emojiSnapshot: '🧽', by: null }],
        note: '',
      },
    }
    const [t] = topChores(logs, [], 3)
    expect(t.name).toBe('옛일')
  })
})

describe('weekdayBars', () => {
  it('sums completions per weekday (0=Sun)', () => {
    const logs = mkLogs({
      '2026-07-05': [{ choreId: 'a' }, { choreId: 'b' }], // Sunday
      '2026-07-06': [{ choreId: 'a' }], // Monday
    })
    const bars = weekdayBars(logs)
    expect(bars[0]).toBe(2)
    expect(bars[1]).toBe(1)
    expect(bars.reduce((s, n) => s + n, 0)).toBe(3)
  })
})

describe('heatmapGrid', () => {
  it('produces 53 weeks of 7 days with today included', () => {
    const { weeks, monthLabels } = heatmapGrid({}, '2026-07-05')
    expect(weeks).toHaveLength(53)
    expect(weeks.every((w) => w.length === 7)).toBe(true)
    expect(monthLabels).toHaveLength(53)
  })

  it('marks future cells as null and counts real days', () => {
    const logs = mkLogs({ '2026-07-05': [{ choreId: 'a' }, { choreId: 'a' }] })
    const { weeks } = heatmapGrid(logs, '2026-07-05')
    const cells = weeks.flat()
    const today = cells.find((c) => c && c.key === '2026-07-05')
    expect(today.count).toBe(2)
    // day after today (2026-07-06) is in the future -> null placeholder
    const future = cells.some((c) => c && c.key === '2026-07-06')
    expect(future).toBe(false)
  })
})

describe('cadence', () => {
  // 2026-07-05 is a Sunday (weekday 0); 2026-07-06 Monday (1).
  it('choreDueOn respects weekday membership; missing days = daily', () => {
    expect(choreDueOn({ days: [0] }, '2026-07-05')).toBe(true) // Sunday
    expect(choreDueOn({ days: [1, 3, 5] }, '2026-07-05')).toBe(false)
    expect(choreDueOn({ days: [1] }, '2026-07-06')).toBe(true) // Monday
    expect(choreDueOn({}, '2026-07-06')).toBe(true) // legacy -> daily
    expect(choreDueOn({ days: [] }, '2026-07-06')).toBe(true)
  })

  it('isDaily is true for all-seven or missing days', () => {
    expect(isDaily({ days: [0, 1, 2, 3, 4, 5, 6] })).toBe(true)
    expect(isDaily({})).toBe(true)
    expect(isDaily({ days: [1, 2] })).toBe(false)
  })

  it('splitByDue partitions active chores by the date', () => {
    const active = [
      { id: 'a', days: [0, 1, 2, 3, 4, 5, 6] }, // daily
      { id: 'b', days: [1, 3, 5] }, // weekdays only
      { id: 'c', days: [0] }, // Sundays
    ]
    const { due, notDue } = splitByDue(active, '2026-07-05') // Sunday
    expect(due.map((c) => c.id)).toEqual(['a', 'c'])
    expect(notDue.map((c) => c.id)).toEqual(['b'])
  })
})

describe('weeklyTrend', () => {
  it('returns one bucket per week, chronological, ending this week', () => {
    const t = weeklyTrend({}, '2026-07-05', 8)
    expect(t).toHaveLength(8)
    expect(t[7].start).toBe('2026-07-05') // this week (Sunday)
    expect(t[0].start).toBe('2026-05-17') // 7 weeks earlier
  })

  it('counts entries within each week and caps the current week at today', () => {
    const logs = mkLogs({
      '2026-07-05': [{ choreId: 'a' }, { choreId: 'b' }], // this week
      '2026-06-28': [{ choreId: 'a' }], // last week
    })
    const t = weeklyTrend(logs, '2026-07-05', 4)
    expect(t.at(-1).count).toBe(2)
    expect(t.at(-2).count).toBe(1)
    expect(t[0].count).toBe(0)
  })
})

describe('monthRecap', () => {
  const chores = [{ id: 'a', name: '설거지', emoji: '🍽️' }]
  const members = [
    { id: 'm1', name: '엄마', emoji: '👩', color: '#111', order: 0 },
    { id: 'm2', name: '아빠', emoji: '👨', color: '#222', order: 1 },
  ]

  it('summarizes total, best weekday and top chore for the month', () => {
    const logs = mkLogs({
      '2026-07-05': [{ choreId: 'a', by: 'm1' }, { choreId: 'a', by: 'm2' }], // Sunday
      '2026-07-06': [{ choreId: 'a', by: 'm1' }], // Monday
      '2026-06-30': [{ choreId: 'a', by: 'm1' }], // previous month, excluded
    })
    const r = monthRecap(logs, chores, members, '2026-07-15')
    expect(r.monthLabel).toBe('7월')
    expect(r.total).toBe(3)
    expect(r.bestWeekday.index).toBe(0) // Sunday had 2
    expect(r.topChore).toMatchObject({ name: '설거지', count: 3 })
    expect(r.topMember).toMatchObject({ id: 'm1', count: 2 })
  })

  it('omits topMember when fewer than 2 members', () => {
    const logs = mkLogs({ '2026-07-05': [{ choreId: 'a', by: 'm1' }] })
    const r = monthRecap(logs, chores, [members[0]], '2026-07-15')
    expect(r.topMember).toBe(null)
  })

  it('is empty-safe for a month with no entries', () => {
    const r = monthRecap({}, chores, members, '2026-07-15')
    expect(r.total).toBe(0)
    expect(r.bestWeekday).toBe(null)
    expect(r.topChore).toBe(null)
    expect(r.topMember).toBe(null)
  })
})

describe('members selectors', () => {
  const members = [
    { id: 'm2', name: '아빠', emoji: '👨', color: '#111', order: 1 },
    { id: 'm1', name: '엄마', emoji: '👩', color: '#222', order: 0 },
  ]

  it('sortedMembers orders by .order', () => {
    expect(sortedMembers(members).map((m) => m.id)).toEqual(['m1', 'm2'])
  })

  it('memberById resolves or returns null', () => {
    expect(memberById(members, 'm1').name).toBe('엄마')
    expect(memberById(members, 'nope')).toBe(null)
  })

  it('attributionEnabled only at 2+ members', () => {
    expect(attributionEnabled([])).toBe(false)
    expect(attributionEnabled([members[0]])).toBe(false)
    expect(attributionEnabled(members)).toBe(true)
  })

  it('memberSplit tallies per member and buckets unknown/missing to unassigned', () => {
    const logs = mkLogs({
      '2026-07-04': [{ choreId: 'a', by: 'm1' }, { choreId: 'b', by: 'm2' }],
      '2026-07-05': [{ choreId: 'a', by: 'm1' }, { choreId: 'c' }, { choreId: 'd', by: 'ghost' }],
    })
    const split = memberSplit(logs, members, '2026-07-01', '2026-07-31')
    const byId = Object.fromEntries(split.rows.map((r) => [r.id, r.count]))
    expect(byId.m1).toBe(2)
    expect(byId.m2).toBe(1)
    expect(split.unassigned).toBe(2) // null + unknown 'ghost'
    expect(split.total).toBe(5)
    expect(split.rows.map((r) => r.id)).toEqual(['m1', 'm2']) // sorted by order
  })
})
