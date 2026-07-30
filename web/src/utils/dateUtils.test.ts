import { describe, expect, it } from 'vitest'
import {
  addLocalDays,
  formatLocalDate,
  parseLocalDate,
  startOfLocalMonth,
  todayLocal
} from './dateUtils'

describe('dateUtils', () => {
  it('formats local civil dates without UTC shifting', () => {
    const evening = new Date(2026, 6, 29, 20, 0, 0) // Jul 29 8pm local
    expect(formatLocalDate(evening)).toBe('2026-07-29')
    // toISOString would be Jul 30 for US timezones west of UTC
  })

  it('parses YYYY-MM-DD as local midnight', () => {
    const date = parseLocalDate('2026-07-29')
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(6)
    expect(date.getDate()).toBe(29)
    expect(date.getHours()).toBe(0)
  })

  it('adds local days across month boundaries', () => {
    expect(addLocalDays('2026-07-31', 1)).toBe('2026-08-01')
    expect(addLocalDays('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('returns start of local month', () => {
    expect(startOfLocalMonth(new Date(2026, 6, 29))).toBe('2026-07-01')
  })

  it('todayLocal matches formatLocalDate(new Date())', () => {
    expect(todayLocal()).toBe(formatLocalDate(new Date()))
  })
})
