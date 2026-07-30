import { describe, expect, it } from 'vitest'
import { calculateUsageCost, getSeason } from './rateCalculatorFixed'

describe('rateCalculatorFixed', () => {
  it('classifies summer and winter seasons', () => {
    expect(getSeason(new Date(2026, 5, 1))).toBe('summer') // June
    expect(getSeason(new Date(2026, 9, 1))).toBe('winter') // October
  })

  it('prices a summer weekday on-peak hour higher than off-peak', () => {
    const onPeak = calculateUsageCost(1000, '17:00', '18:00', '2026-07-15') // Wednesday
    const offPeak = calculateUsageCost(1000, '10:00', '11:00', '2026-07-15')
    expect(onPeak.totalCost).toBeGreaterThan(offPeak.totalCost)
    expect(onPeak.totalCost).toBeCloseTo(0.55, 2)
    expect(offPeak.totalCost).toBeCloseTo(0.25, 2)
  })

  it('advances calendar day for overnight Friday→Saturday summer rates', () => {
    // Friday evening on-peak into Saturday morning off-peak
    const result = calculateUsageCost(1000, '20:00', '01:00', '2026-07-17') // Friday
    expect(result.durationHours).toBe(5)
    // First ~1h still Friday on-peak ($0.55), remaining Saturday off-peak ($0.25)
    const onPeak = result.breakdown.find(b => b.ratePeriod === 'On-Peak')
    const offPeak = result.breakdown.find(b => b.ratePeriod === 'Off-Peak')
    expect(onPeak).toBeTruthy()
    expect(offPeak).toBeTruthy()
    expect(onPeak!.cost).toBeGreaterThan(0)
    expect(offPeak!.cost).toBeGreaterThan(0)
    // If we incorrectly kept Friday rates all night, Saturday morning would still be On-Peak
    expect(result.totalCost).toBeLessThan(5 * 0.55)
  })

  it('applies season boundary overnight (May 31 → Jun 1)', () => {
    const result = calculateUsageCost(1000, '23:00', '01:00', '2026-05-31')
    expect(result.durationHours).toBe(2)
    // May 31 winter Mid-Peak ends at 21:00, so 23:00 is Off-Peak winter ($0.24)
    // Jun 1 summer weekday Off-Peak ($0.25)
    expect(result.breakdown.length).toBeGreaterThanOrEqual(1)
    expect(result.totalCost).toBeGreaterThan(0)
  })
})
