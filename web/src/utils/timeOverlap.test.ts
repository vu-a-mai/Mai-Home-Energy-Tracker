import { describe, expect, it } from 'vitest'
import { timesOverlap, toMinuteRange } from './timeOverlap'

describe('timeOverlap', () => {
  it('detects normal same-day overlaps', () => {
    expect(timesOverlap('10:00', '12:00', '11:00', '13:00')).toBe(true)
    expect(timesOverlap('10:00', '11:00', '11:00', '12:00')).toBe(false)
    expect(timesOverlap('08:00', '09:00', '10:00', '11:00')).toBe(false)
  })

  it('detects overnight overlaps that string-compare would miss', () => {
    // Existing overnight 22:00-06:00 vs new early morning 05:00-07:00
    expect(timesOverlap('22:00', '06:00', '05:00', '07:00')).toBe(true)
    // Overnight vs afternoon should not overlap
    expect(timesOverlap('22:00', '06:00', '14:00', '16:00')).toBe(false)
  })

  it('normalizes overnight ranges with +24h end', () => {
    const range = toMinuteRange('22:00', '06:00')
    expect(range.start).toBe(22 * 60)
    expect(range.end).toBe(6 * 60 + 24 * 60)
  })
})
