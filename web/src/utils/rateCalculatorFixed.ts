// Simplified and accurate rate calculator
import type { RatePeriod } from '../types'

export const WINTER_RATES: RatePeriod[] = [
  { name: 'Off-Peak', start: '21:00', end: '07:59', rate: 0.24, color: '🟢' },
  { name: 'Super Off-Peak', start: '08:00', end: '15:59', rate: 0.24, color: '🔵' },
  { name: 'Mid-Peak', start: '16:00', end: '20:59', rate: 0.52, color: '🟡' }
]

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

// Convert time string to minutes since midnight
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Convert minutes to time string
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60) % 24
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

// Get season
const getSeason = (date: Date): 'summer' | 'winter' => {
  const month = date.getMonth() + 1
  return (month >= 6 && month <= 9) ? 'summer' : 'winter'
}

// Get rate periods
const getRatePeriods = (date: Date): RatePeriod[] => {
  const season = getSeason(date)
  
  if (season === 'summer') {
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    return isWeekend ? SUMMER_RATES.weekend : SUMMER_RATES.weekday
  } else {
    return WINTER_RATES
  }
}

// Find which rate period applies to a specific time
const findRatePeriod = (timeMinutes: number, ratePeriods: RatePeriod[]): RatePeriod | null => {
  for (const period of ratePeriods) {
    const startMinutes = timeToMinutes(period.start)
    const endMinutes = timeToMinutes(period.end)
    
    if (endMinutes < startMinutes) {
      // Period crosses midnight
      if (timeMinutes >= startMinutes || timeMinutes <= endMinutes) {
        return period
      }
    } else {
      // Normal period
      if (timeMinutes >= startMinutes && timeMinutes <= endMinutes) {
        return period
      }
    }
  }
  return null
}

export const calculateUsageCost = (
  wattage: number,
  startTime: string,
  endTime: string,
  usageDate: string
): UsageCalculation => {
  // Parse date
  const [year, month, day] = usageDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const ratePeriods = getRatePeriods(date)
  
  // Convert times to minutes
  const startMinutes = timeToMinutes(startTime)
  let endMinutes = timeToMinutes(endTime)
  
  // Handle overnight usage
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60
  }
  
  const totalDurationMinutes = endMinutes - startMinutes
  const totalDurationHours = totalDurationMinutes / 60
  const totalKwh = (wattage / 1000) * totalDurationHours
  
  let totalCost = 0
  const breakdown: UsageCalculation['breakdown'] = []
  
  // Process minute by minute to ensure accuracy
  for (let currentMinutes = startMinutes; currentMinutes < endMinutes; currentMinutes++) {
    const timeOfDay = currentMinutes % (24 * 60)
    const period = findRatePeriod(timeOfDay, ratePeriods)
    
    if (period) {
      // Find existing breakdown entry or create new one
      let entry = breakdown.find(b => 
        b.ratePeriod === period.name && 
        b.rate === period.rate
      )
      
      if (!entry) {
        entry = {
          ratePeriod: period.name,
          hours: 0,
          kwh: 0,
          rate: period.rate,
          cost: 0,
          startTime: minutesToTime(currentMinutes),
          endTime: minutesToTime(currentMinutes + 1)
        }
        breakdown.push(entry)
      }
      
      // Add one minute to this period
      const minuteHours = 1 / 60
      const minuteKwh = (wattage / 1000) * minuteHours
      const minuteCost = minuteKwh * period.rate
      
      entry.hours += minuteHours
      entry.kwh += minuteKwh
      entry.cost += minuteCost
      entry.endTime = minutesToTime(currentMinutes + 1)
      
      totalCost += minuteCost
    }
  }
  
  // Round values for display
  breakdown.forEach(entry => {
    entry.hours = Math.round(entry.hours * 10) / 10
    entry.kwh = Math.round(entry.kwh * 100) / 100
    entry.cost = Math.round(entry.cost * 100) / 100
  })
  
  return {
    totalKwh: Math.round(totalKwh * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    durationHours: Math.round(totalDurationHours * 10) / 10,
    breakdown
  }
}
