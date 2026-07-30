/** Convert HH:MM or HH:MM:SS to minutes since midnight. */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + (minutes || 0)
}

/**
 * Normalize a time window to [start, end) minute ranges.
 * Overnight windows (end <= start) extend end by 24h.
 */
export function toMinuteRange(startTime: string, endTime: string): { start: number; end: number } {
  const start = timeToMinutes(startTime)
  let end = timeToMinutes(endTime)
  if (end <= start) {
    end += 24 * 60
  }
  return { start, end }
}

/**
 * Check whether two time windows overlap, including overnight sessions.
 * Uses half-open intervals [start, end) in minutes since midnight (with +24h for overnight).
 */
export function timesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const a = toMinuteRange(startA, endA)
  const b = toMinuteRange(startB, endB)

  // Also compare B shifted by -24h / A shifted by -24h for wraparound edge cases
  // where one interval is overnight and the other is early-morning same calendar day.
  const candidates = [
    [a.start, a.end, b.start, b.end],
    [a.start, a.end, b.start - 24 * 60, b.end - 24 * 60],
    [a.start - 24 * 60, a.end - 24 * 60, b.start, b.end],
  ] as const

  return candidates.some(([as, ae, bs, be]) => as < be && ae > bs)
}
