import { describe, expect, it } from 'vitest'
import { addLocalDays } from './dateUtils'
import {
  canEditHousehold,
  getBackfillDates,
  invitePath,
  isHouseholdOwner,
  isValidInviteCodeFormat,
  normalizeInviteCode,
  summarizeBackfill,
} from './householdAccess'

describe('householdAccess', () => {
  it('normalizes invite codes', () => {
    expect(normalizeInviteCode('  ab-cd 12 ')).toBe('ABCD12')
    expect(isValidInviteCodeFormat('AB12CD')).toBe(true)
    expect(isValidInviteCodeFormat('abc')).toBe(false)
    expect(invitePath('ab12cd34')).toBe('/join?code=AB12CD34')
  })

  it('gates edit/owner roles', () => {
    expect(canEditHousehold('owner')).toBe(true)
    expect(canEditHousehold('editor')).toBe(true)
    expect(canEditHousehold('viewer')).toBe(false)
    expect(isHouseholdOwner('owner')).toBe(true)
    expect(isHouseholdOwner('editor')).toBe(false)
  })

  it('builds inclusive backfill date windows', () => {
    expect(getBackfillDates('2026-07-30', 0, addLocalDays)).toEqual(['2026-07-30'])
    expect(getBackfillDates('2026-07-30', 2, addLocalDays)).toEqual([
      '2026-07-28',
      '2026-07-29',
      '2026-07-30',
    ])
  })

  it('summarizes backfill day results', () => {
    expect(
      summarizeBackfill([
        { created: 1, replaced: 0, failed: 0 },
        { created: 0, replaced: 2, failed: 1 },
      ])
    ).toEqual({ created: 1, replaced: 2, failed: 1 })
  })
})
