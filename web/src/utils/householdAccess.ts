/**
 * Pure helpers for invite codes and auto-schedule backfill windows.
 */

const INVITE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Normalize user-entered invite codes for lookup / display. */
export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function isValidInviteCodeFormat(raw: string): boolean {
  const code = normalizeInviteCode(raw)
  return code.length >= 6 && code.length <= 12 && /^[A-Z0-9]+$/.test(code)
}

/** Build shareable path for an invite code. */
export function invitePath(code: string): string {
  return `/join?code=${encodeURIComponent(normalizeInviteCode(code))}`
}

export type HouseholdRole = 'owner' | 'editor' | 'viewer'

export function canEditHousehold(role: HouseholdRole | null | undefined): boolean {
  return role === 'owner' || role === 'editor'
}

export function isHouseholdOwner(role: HouseholdRole | null | undefined): boolean {
  return role === 'owner'
}

/**
 * Inclusive list of local civil dates from (today - lookbackDays) through today.
 * lookbackDays=0 → [today]; lookbackDays=3 → [today-3 … today]
 */
export function getBackfillDates(
  today: string,
  lookbackDays: number,
  addDays: (date: string, days: number) => string
): string[] {
  const days = Math.max(0, Math.floor(lookbackDays))
  const dates: string[] = []
  for (let offset = days; offset >= 0; offset -= 1) {
    dates.push(addDays(today, -offset))
  }
  return dates
}

export function summarizeBackfill(
  daily: Array<{ created?: number; replaced?: number; failed?: number }>
): { created: number; replaced: number; failed: number } {
  let created = 0
  let replaced = 0
  let failed = 0
  for (const day of daily) {
    created += day.created ?? 0
    replaced += day.replaced ?? 0
    failed += day.failed ?? 0
  }
  return { created, replaced, failed }
}

/** Exported for tests — alphabet used by SQL generate_invite_code. */
export const INVITE_CODE_CHARS = INVITE_CODE_ALPHABET
