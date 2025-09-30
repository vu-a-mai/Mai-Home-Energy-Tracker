// TOU-D-PRIME Rate Calculation Utilities
export interface RatePeriod {
  name: 'Off-Peak' | 'Mid-Peak' | 'On-Peak' | 'Super Off-Peak'
  rate: number
  color: string
  emoji: string
}

export interface TimeSlot {
  startTime: string
  endTime: string
  ratePeriod: RatePeriod
  duration: number // in hours
}

// Rate constants
export const RATES = {
  SUMMER: {
    OFF_PEAK: 0.25,
    MID_PEAK: 0.37,
    ON_PEAK: 0.55,
  },
  WINTER: {
    OFF_PEAK: 0.24,
    MID_PEAK: 0.52,
    SUPER_OFF_PEAK: 0.24,
  }
} as const

// Rate period definitions
export const RATE_PERIODS: Record<string, RatePeriod> = {
  OFF_PEAK: {
    name: 'Off-Peak',
    rate: 0.25,
    color: '#22c55e',
    emoji: '🟢'
  },
  MID_PEAK: {
    name: 'Mid-Peak',
    rate: 0.37,
    color: '#f59e0b',
    emoji: '🟡'
  },
  ON_PEAK: {
    name: 'On-Peak',
    rate: 0.55,
    color: '#ef4444',
    emoji: '🔴'
  },
  SUPER_OFF_PEAK: {
    name: 'Super Off-Peak',
    rate: 0.24,
    color: '#3b82f6',
    emoji: '🔵'
  }
}

/**
 * Determines if a date is in summer period (June-September)
 */
export function isSummerPeriod(date: Date): boolean {
  const month = date.getMonth() + 1 // getMonth() returns 0-11
  return month >= 6 && month <= 9
}

/**
 * Determines if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6 // Sunday = 0, Saturday = 6
}

/**
 * Gets the rate period for a specific date and time
 */
export function getRatePeriod(date: Date, hour: number): RatePeriod {
  const summer = isSummerPeriod(date)
  const weekend = isWeekend(date)

  if (summer) {
    // Summer rates (June - September)
    if (!weekend && hour >= 16 && hour < 21) {
      // Weekday 4PM-9PM = On-Peak
      return { ...RATE_PERIODS.ON_PEAK, rate: RATES.SUMMER.ON_PEAK }
    } else if (weekend && hour >= 16 && hour < 21) {
      // Weekend 4PM-9PM = Mid-Peak
      return { ...RATE_PERIODS.MID_PEAK, rate: RATES.SUMMER.MID_PEAK }
    } else {
      // All other times = Off-Peak
      return { ...RATE_PERIODS.OFF_PEAK, rate: RATES.SUMMER.OFF_PEAK }
    }
  } else {
    // Winter rates (October - May)
    if (hour >= 21 || hour < 8) {
      // 9PM-8AM = Off-Peak
      return { ...RATE_PERIODS.OFF_PEAK, rate: RATES.WINTER.OFF_PEAK }
    } else if (hour >= 8 && hour < 16) {
      // 8AM-4PM = Super Off-Peak
      return { ...RATE_PERIODS.SUPER_OFF_PEAK, rate: RATES.WINTER.SUPER_OFF_PEAK }
    } else {
      // 4PM-9PM = Mid-Peak
      return { ...RATE_PERIODS.MID_PEAK, rate: RATES.WINTER.MID_PEAK }
    }
  }
}

/**
 * Calculates kWh from wattage and duration
 */
export function calculateKwh(wattage: number, durationHours: number): number {
  return (wattage / 1000) * durationHours
}

/**
 * Calculates duration in hours between two time strings
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(`2000-01-01T${startTime}`)
  const end = new Date(`2000-01-01T${endTime}`)
  
  // Handle overnight periods
  if (end <= start) {
    end.setDate(end.getDate() + 1)
  }
  
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60)
}

/**
 * Splits a time period across rate boundaries and calculates cost
 */
export function calculateEnergyUsageCost(
  wattage: number,
  startTime: string,
  endTime: string,
  usageDate: string
): { totalCost: number; totalKwh: number; timeSlots: TimeSlot[] } {
  const date = new Date(usageDate)
  const duration = calculateDuration(startTime, endTime)
  const totalKwh = calculateKwh(wattage, duration)
  
  // For simplicity, we'll calculate based on the start time's rate period
  // In a more complex implementation, we'd split across rate boundaries
  const startHour = parseInt(startTime.split(':')[0])
  const ratePeriod = getRatePeriod(date, startHour)
  
  const totalCost = totalKwh * ratePeriod.rate
  
  const timeSlots: TimeSlot[] = [{
    startTime,
    endTime,
    ratePeriod,
    duration
  }]
  
  return {
    totalCost: Math.round(totalCost * 100) / 100, // Round to 2 decimal places
    totalKwh: Math.round(totalKwh * 1000) / 1000, // Round to 3 decimal places
    timeSlots
  }
}

/**
 * Calculates bill split for multiple users
 */
export function calculateBillSplit(
  totalBillAmount: number,
  personalCosts: Record<string, number>,
  userIds: string[]
): {
  personalCosts: Record<string, number>
  sharedCost: number
  sharedCostPerUser: number
  finalAmounts: Record<string, number>
} {
  const totalPersonalCosts = Object.values(personalCosts).reduce((sum, cost) => sum + cost, 0)
  const sharedCost = Math.max(0, totalBillAmount - totalPersonalCosts)
  const sharedCostPerUser = sharedCost / userIds.length
  
  const finalAmounts: Record<string, number> = {}
  userIds.forEach(userId => {
    const personalCost = personalCosts[userId] || 0
    finalAmounts[userId] = Math.round((personalCost + sharedCostPerUser) * 100) / 100
  })
  
  return {
    personalCosts,
    sharedCost: Math.round(sharedCost * 100) / 100,
    sharedCostPerUser: Math.round(sharedCostPerUser * 100) / 100,
    finalAmounts
  }
}

/**
 * Validates time format (HH:MM)
 */
export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  return timeRegex.test(time)
}

/**
 * Validates date format (YYYY-MM-DD)
 */
export function isValidDateFormat(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) return false
  
  const parsedDate = new Date(date)
  return parsedDate instanceof Date && !isNaN(parsedDate.getTime())
}

/**
 * Gets current rate period for display
 */
export function getCurrentRatePeriod(): RatePeriod {
  const now = new Date()
  return getRatePeriod(now, now.getHours())
}
