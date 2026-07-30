import { describe, expect, it } from 'vitest'
import {
  countMatchingScheduleDays,
  getMatchingScheduleDates,
  isDateInSchedule,
  summarizeGenerateResults,
} from './scheduleDates'
import { parseLocalDate } from './dateUtils'

const weekdaySchedule = {
  schedule_start_date: '2026-07-01',
  schedule_end_date: '2026-07-31',
  days_of_week: [1, 2, 3, 4, 5], // Mon-Fri
  is_active: true,
}

describe('scheduleDates', () => {
  it('uses local civil dates so DOW is not UTC-shifted', () => {
    // 2026-07-30 is Thursday locally
    const thursday = parseLocalDate('2026-07-30')
    expect(thursday.getDay()).toBe(4)
    expect(isDateInSchedule(weekdaySchedule, '2026-07-30').ok).toBe(true)
    expect(isDateInSchedule(weekdaySchedule, '2026-07-26').ok).toBe(false) // Sunday
  })

  it('rejects dates outside range and paused schedules', () => {
    expect(isDateInSchedule(weekdaySchedule, '2026-06-30').ok).toBe(false)
    expect(isDateInSchedule(weekdaySchedule, '2026-08-01').ok).toBe(false)
    expect(
      isDateInSchedule({ ...weekdaySchedule, is_active: false }, '2026-07-30').reason
    ).toMatch(/paused/i)
  })

  it('counts matching days through today inclusive', () => {
    // Jul 1 2026 is Wednesday; through Jul 3 (Fri) => Wed,Thu,Fri = 3 weekdays
    expect(countMatchingScheduleDays(weekdaySchedule, '2026-07-03')).toBe(3)
    expect(getMatchingScheduleDates(weekdaySchedule, '2026-07-03')).toEqual([
      '2026-07-01',
      '2026-07-02',
      '2026-07-03',
    ])
  })

  it('caps matching dates at schedule_end_date', () => {
    const short = {
      ...weekdaySchedule,
      schedule_end_date: '2026-07-02',
    }
    expect(getMatchingScheduleDates(short, '2026-07-10')).toEqual([
      '2026-07-01',
      '2026-07-02',
    ])
  })

  it('summarizes generate statuses and treats skips separately from failures', () => {
    expect(
      summarizeGenerateResults([
        { status: 'created' },
        { status: 'replaced' },
        { status: 'skipped' },
        { status: 'skipped' },
        { status: 'error' },
      ])
    ).toEqual({ created: 1, replaced: 1, skipped: 2, failed: 1 })
  })
})
