import type { RatePeriod, TimeRange } from '../types'

// Define rate periods for summer and winter
export const SUMMER_RATES: Record<string, RatePeriod[]> = {
  weekday: [
    { name: 'Off-Peak', start: '00:00', end: '16:00', rate: 0.25, color: '🟢' },
    { name: 'On-Peak', start: '16:01', end: '21:00', rate: 0.55, color: '🔴' },
    { name: 'Off-Peak', start: '21:01', end: '23:59', rate: 0.25, color: '🟢' }
  ],
  weekend: [
    { name: 'Off-Peak', start: '00:00', end: '16:00', rate: 0.25, color: '🟢' },
    { name: 'Mid-Peak', start: '16:01', end: '21:00', rate: 0.37, color: '🟡' },
    { name: 'Off-Peak', start: '21:01', end: '23:59', rate: 0.25, color: '🟢' }
  ]
}

export const WINTER_RATES: Record<string, RatePeriod[]> = {
  allDays: [
    { name: 'Off-Peak', start: '21:00', end: '07:59', rate: 0.24, color: '🟢' },
    { name: 'Super Off-Peak', start: '08:00', end: '15:59', rate: 0.24, color: '🔵' },
    { name: 'Mid-Peak', start: '16:00', end: '20:59', rate: 0.52, color: '🟡' }
  ]
}

// Convert time string to minutes since midnight
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Convert minutes since midnight to time string
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

// Determine if a date is in summer or winter
export const getSeason = (date: Date): 'summer' | 'winter' => {
  const month = date.getMonth() + 1 // getMonth() is zero-indexed
  return (month >= 6 && month <= 9) ? 'summer' : 'winter'
}

// Get rate periods based on date and season
export const getRatePeriods = (date: Date): RatePeriod[] => {
  const season = getSeason(date)
  
  if (season === 'summer') {
    const dayOfWeek = date.getDay()
    // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    return isWeekend ? SUMMER_RATES.weekend : SUMMER_RATES.weekday
  } else {
    return WINTER_RATES.allDays
  }
}

// Calculate kWh from wattage and hours
export const calculateKwh = (wattage: number, hours: number): number => {
  return (wattage / 1000) * hours
}

// Split time range across rate periods
export const splitTimeAcrossRates = (startTime: string, endTime: string, date: Date): TimeRange[] => {
  const ratePeriods = getRatePeriods(date)
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  
  const result: TimeRange[] = []
  
  // Handle case where end time is next day (crosses midnight)
  const adjustedEndMinutes = endMinutes < startMinutes ? endMinutes + 24 * 60 : endMinutes
  
  for (const period of ratePeriods) {
    const periodStart = timeToMinutes(period.start)
    const periodEnd = timeToMinutes(period.end)
    
    // Check if there's overlap between the usage time and rate period
    if (startMinutes <= periodEnd && adjustedEndMinutes >= periodStart) {
      const overlapStart = Math.max(startMinutes, periodStart)
      const overlapEnd = Math.min(adjustedEndMinutes, periodEnd)
      
      if (overlapStart < overlapEnd) {
        result.push({
          start: minutesToTime(overlapStart),
          end: minutesToTime(overlapEnd)
        })
      }
    }
  }
  
  return result
}

// Calculate cost for a specific time range and rate
export const calculateCost = (wattage: number, startTime: string, endTime: string, rate: number): number => {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  
  // Handle case where end time is next day (crosses midnight)
  const durationMinutes = endMinutes < startMinutes ? endMinutes + 24 * 60 - startMinutes : endMinutes - startMinutes
  const durationHours = durationMinutes / 60
  
  const kwh = calculateKwh(wattage, durationHours)
  return kwh * rate
}

// Calculate total cost and kWh for a usage session across multiple rate periods
export interface UsageCalculation {
  totalKwh: number
  totalCost: number
  durationHours: number
  breakdown: {
    ratePeriod: string
    hours: number
    kwh: number
    rate: number
    cost: number
    startTime: string
    endTime: string
  }[]
}

export const calculateUsageCost = (
  wattage: number,
  startTime: string,
  endTime: string,
  usageDate: string
): UsageCalculation => {
  // Parse date in local timezone to avoid timezone issues
  const [year, month, day] = usageDate.split('-').map(Number)
  const date = new Date(year, month - 1, day) // month is 0-indexed
  const season = getSeason(date)
  const ratePeriods = getRatePeriods(date)
  const startMinutes = timeToMinutes(startTime)
  let endMinutes = timeToMinutes(endTime)
  
  // Handle overnight usage (crosses midnight)
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60
  }
  
  const totalDurationMinutes = endMinutes - startMinutes
  const totalDurationHours = totalDurationMinutes / 60
  const totalKwh = calculateKwh(wattage, totalDurationHours)
  
  let totalCost = 0
  const breakdown: UsageCalculation['breakdown'] = []
  
  // Calculate cost for each rate period
  for (const period of ratePeriods) {
    let periodStart = timeToMinutes(period.start)
    let periodEnd = timeToMinutes(period.end)
    
    // Handle rate periods that cross midnight
    if (periodEnd < periodStart) {
      periodEnd += 24 * 60
    }
    
    // Find overlap between usage time and rate period
    const overlapStart = Math.max(startMinutes, periodStart)
    const overlapEnd = Math.min(endMinutes, periodEnd)
    
    if (overlapStart < overlapEnd) {
      const overlapMinutes = overlapEnd - overlapStart
      const overlapHours = overlapMinutes / 60
      const overlapKwh = calculateKwh(wattage, overlapHours)
      const overlapCost = overlapKwh * period.rate
      
      totalCost += overlapCost
      
      breakdown.push({
        ratePeriod: period.name,
        hours: overlapHours,
        kwh: overlapKwh,
        rate: period.rate,
        cost: overlapCost,
        startTime: minutesToTime(overlapStart % (24 * 60)),
        endTime: minutesToTime(overlapEnd % (24 * 60))
      })
    }
  }
  
  return {
    totalKwh,
    totalCost,
    durationHours: totalDurationHours,
    breakdown
  }
}
