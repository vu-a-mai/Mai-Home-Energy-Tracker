/**
 * Resolve how a log's cost should be attributed for usage-based bill splits.
 *
 * Priority:
 * 1. Explicit assigned_users on the log (overrides device shared flag)
 * 2. Shared device with no assignees → household shared/remainder pool
 * 3. Otherwise → creator (personal)
 */
export type LogCostAttribution =
  | { kind: 'personal'; userIds: string[] }
  | { kind: 'shared' }

export function resolveLogCostAttribution(input: {
  assigned_users?: string[] | null
  created_by?: string | null
  deviceIsShared?: boolean | null
  fallbackUserId?: string | null
}): LogCostAttribution {
  const assignees = (input.assigned_users ?? []).filter(Boolean)
  if (assignees.length > 0) {
    return { kind: 'personal', userIds: assignees }
  }

  if (input.deviceIsShared) {
    return { kind: 'shared' }
  }

  const userId = input.created_by || input.fallbackUserId
  if (!userId) {
    return { kind: 'shared' }
  }

  return { kind: 'personal', userIds: [userId] }
}
