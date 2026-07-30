import { parseLocalDate, formatLocalDate } from './dateUtils'

export type RecurringGenerateStatus = 'created' | 'replaced' | 'skipped' | 'error'

export interface ScheduleDateRange {
  schedule_start_date: string
  schedule_end_date: string | null
  days_of_week: number[]
  is_active?: boolean
}

/**
 * Collect matching local civil dates for a schedule through endDateInclusive.
 * Uses local midnight parsing to avoid UTC day-of-week shifts.
 */
export function getMatchingScheduleDates(
  schedule: ScheduleDateRange,
  endDateInclusive: string
): string[] {
  const start = parseLocalDate(schedule.schedule_start_date)
  const scheduleEnd = schedule.schedule_end_date
    ? parseLocalDate(schedule.schedule_end_date)
    : null
  const end = parseLocalDate(endDateInclusive)
  const actualEnd =
    scheduleEnd && scheduleEnd.getTime() < end.getTime() ? scheduleEnd : end

  if (actualEnd.getTime() < start.getTime()) return []

  const dates: string[] = []
  const cursor = new Date(start)
  while (cursor.getTime() <= actualEnd.getTime()) {
    if (schedule.days_of_week.includes(cursor.getDay())) {
      dates.push(formatLocalDate(cursor))
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

export function countMatchingScheduleDays(
  schedule: ScheduleDateRange,
  endDateInclusive: string
): number {
  return getMatchingScheduleDates(schedule, endDateInclusive).length
}

export function isDateInSchedule(
  schedule: ScheduleDateRange,
  targetDate: string
): { ok: boolean; reason?: string } {
  if (schedule.is_active === false) {
    return { ok: false, reason: 'Schedule is paused' }
  }
  if (targetDate < schedule.schedule_start_date) {
    return { ok: false, reason: 'Target date is before schedule start date' }
  }
  if (schedule.schedule_end_date && targetDate > schedule.schedule_end_date) {
    return { ok: false, reason: 'Target date is after schedule end date' }
  }
  const day = parseLocalDate(targetDate).getDay()
  if (!schedule.days_of_week.includes(day)) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return { ok: false, reason: `Schedule does not run on ${dayNames[day]}` }
  }
  return { ok: true }
}

export function summarizeGenerateResults(
  results: Array<{ status?: string; success?: boolean }>
): { created: number; replaced: number; skipped: number; failed: number } {
  let created = 0
  let replaced = 0
  let skipped = 0
  let failed = 0

  for (const row of results) {
    const status = row.status
    if (status === 'created') created++
    else if (status === 'replaced') replaced++
    else if (status === 'skipped') skipped++
    else if (status === 'error') failed++
    else if (row.success === true) created++
    else if (row.success === false) failed++
  }

  return { created, replaced, skipped, failed }
}
