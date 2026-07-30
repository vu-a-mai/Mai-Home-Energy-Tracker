/**
 * Local civil-date helpers.
 * Never use Date#toISOString().slice(0, 10) for UI/filter calendar dates —
 * that converts to UTC and can shift the day for evening Americas users.
 */

/** Format a Date as YYYY-MM-DD in the local timezone. */
export function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Today's local calendar date as YYYY-MM-DD. */
export function todayLocal(): string {
  return formatLocalDate(new Date())
}

/** Parse YYYY-MM-DD as a local Date at midnight (not UTC). */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Add days to a YYYY-MM-DD local date string, returning YYYY-MM-DD. */
export function addLocalDays(dateStr: string, days: number): string {
  const date = parseLocalDate(dateStr)
  date.setDate(date.getDate() + days)
  return formatLocalDate(date)
}

/** First day of the month containing `date` (local). */
export function startOfLocalMonth(date: Date = new Date()): string {
  return formatLocalDate(new Date(date.getFullYear(), date.getMonth(), 1))
}

/** Last day of the month containing `date` (local). */
export function endOfLocalMonth(date: Date = new Date()): string {
  return formatLocalDate(new Date(date.getFullYear(), date.getMonth() + 1, 0))
}

/** First day of the year containing `date` (local). */
export function startOfLocalYear(date: Date = new Date()): string {
  return formatLocalDate(new Date(date.getFullYear(), 0, 1))
}

/** Start of the week (Sunday) containing `date` (local). */
export function startOfLocalWeek(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() - d.getDay())
  return formatLocalDate(d)
}
