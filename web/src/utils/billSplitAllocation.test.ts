import { describe, expect, it } from 'vitest'
import { resolveLogCostAttribution } from './billSplitAllocation'

describe('resolveLogCostAttribution', () => {
  it('uses assigned_users even on shared devices', () => {
    expect(
      resolveLogCostAttribution({
        assigned_users: ['u1', 'u2'],
        created_by: 'u3',
        deviceIsShared: true,
      })
    ).toEqual({ kind: 'personal', userIds: ['u1', 'u2'] })
  })

  it('puts shared-device logs with no assignees into the shared pool', () => {
    expect(
      resolveLogCostAttribution({
        assigned_users: [],
        created_by: 'u1',
        deviceIsShared: true,
      })
    ).toEqual({ kind: 'shared' })
  })

  it('charges personal-device logs with no assignees to the creator', () => {
    expect(
      resolveLogCostAttribution({
        assigned_users: null,
        created_by: 'u1',
        deviceIsShared: false,
        fallbackUserId: 'fallback',
      })
    ).toEqual({ kind: 'personal', userIds: ['u1'] })
  })

  it('falls back to household user when creator is missing', () => {
    expect(
      resolveLogCostAttribution({
        assigned_users: [],
        created_by: null,
        deviceIsShared: false,
        fallbackUserId: 'fallback',
      })
    ).toEqual({ kind: 'personal', userIds: ['fallback'] })
  })
})
