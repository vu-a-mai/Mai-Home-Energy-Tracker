import {
  isSummerPeriod,
  isWeekend,
  getRatePeriod,
  calculateKwh,
  calculateDuration,
  calculateEnergyUsageCost,
  calculateBillSplit,
  isValidTimeFormat,
  isValidDateFormat,
  getCurrentRatePeriod,
  RATES
} from '../rateCalculations'

describe('Rate Calculations', () => {
  describe('isSummerPeriod', () => {
    test('should return true for summer months (June-September)', () => {
      expect(isSummerPeriod(new Date('2024-06-15'))).toBe(true)
      expect(isSummerPeriod(new Date('2024-07-01'))).toBe(true)
      expect(isSummerPeriod(new Date('2024-08-15'))).toBe(true)
      expect(isSummerPeriod(new Date('2024-09-30'))).toBe(true)
    })

    test('should return false for winter months (October-May)', () => {
      expect(isSummerPeriod(new Date('2024-01-15'))).toBe(false)
      expect(isSummerPeriod(new Date('2024-05-31'))).toBe(false)
      expect(isSummerPeriod(new Date('2024-10-01'))).toBe(false)
      expect(isSummerPeriod(new Date('2024-12-25'))).toBe(false)
    })
  })

  describe('isWeekend', () => {
    test('should return true for Saturday and Sunday', () => {
      expect(isWeekend(new Date('2024-01-06'))).toBe(true) // Saturday
      expect(isWeekend(new Date('2024-01-07'))).toBe(true) // Sunday
    })

    test('should return false for weekdays', () => {
      expect(isWeekend(new Date('2024-01-01'))).toBe(false) // Monday
      expect(isWeekend(new Date('2024-01-02'))).toBe(false) // Tuesday
      expect(isWeekend(new Date('2024-01-03'))).toBe(false) // Wednesday
      expect(isWeekend(new Date('2024-01-04'))).toBe(false) // Thursday
      expect(isWeekend(new Date('2024-01-05'))).toBe(false) // Friday
    })
  })

  describe('getRatePeriod', () => {
    describe('Summer rates (July weekday)', () => {
      const summerWeekday = new Date('2024-07-10') // Wednesday

      test('should return On-Peak for weekday 4PM-9PM', () => {
        const ratePeriod = getRatePeriod(summerWeekday, 18) // 6PM
        expect(ratePeriod.name).toBe('On-Peak')
        expect(ratePeriod.rate).toBe(RATES.SUMMER.ON_PEAK)
        expect(ratePeriod.emoji).toBe('🔴')
      })

      test('should return Off-Peak for other weekday times', () => {
        const morningPeriod = getRatePeriod(summerWeekday, 10) // 10AM
        expect(morningPeriod.name).toBe('Off-Peak')
        expect(morningPeriod.rate).toBe(RATES.SUMMER.OFF_PEAK)
      })
    })

    describe('Summer rates (July weekend)', () => {
      const summerWeekend = new Date('2024-07-13') // Saturday

      test('should return Mid-Peak for weekend 4PM-9PM', () => {
        const ratePeriod = getRatePeriod(summerWeekend, 18) // 6PM
        expect(ratePeriod.name).toBe('Mid-Peak')
        expect(ratePeriod.rate).toBe(RATES.SUMMER.MID_PEAK)
        expect(ratePeriod.emoji).toBe('🟡')
      })

      test('should return Off-Peak for other weekend times', () => {
        const morningPeriod = getRatePeriod(summerWeekend, 10) // 10AM
        expect(morningPeriod.name).toBe('Off-Peak')
        expect(morningPeriod.rate).toBe(RATES.SUMMER.OFF_PEAK)
      })
    })

    describe('Winter rates (January)', () => {
      const winterDay = new Date('2024-01-15') // Monday

      test('should return Off-Peak for 9PM-8AM', () => {
        const nightPeriod = getRatePeriod(winterDay, 23) // 11PM
        expect(nightPeriod.name).toBe('Off-Peak')
        expect(nightPeriod.rate).toBe(RATES.WINTER.OFF_PEAK)

        const earlyMorning = getRatePeriod(winterDay, 6) // 6AM
        expect(earlyMorning.name).toBe('Off-Peak')
        expect(earlyMorning.rate).toBe(RATES.WINTER.OFF_PEAK)
      })

      test('should return Super Off-Peak for 8AM-4PM', () => {
        const midDayPeriod = getRatePeriod(winterDay, 12) // 12PM
        expect(midDayPeriod.name).toBe('Super Off-Peak')
        expect(midDayPeriod.rate).toBe(RATES.WINTER.SUPER_OFF_PEAK)
        expect(midDayPeriod.emoji).toBe('🔵')
      })

      test('should return Mid-Peak for 4PM-9PM', () => {
        const eveningPeriod = getRatePeriod(winterDay, 18) // 6PM
        expect(eveningPeriod.name).toBe('Mid-Peak')
        expect(eveningPeriod.rate).toBe(RATES.WINTER.MID_PEAK)
      })
    })
  })

  describe('calculateKwh', () => {
    test('should correctly calculate kWh from wattage and duration', () => {
      expect(calculateKwh(1000, 1)).toBe(1) // 1000W for 1 hour = 1 kWh
      expect(calculateKwh(500, 2)).toBe(1) // 500W for 2 hours = 1 kWh
      expect(calculateKwh(150, 4)).toBe(0.6) // 150W for 4 hours = 0.6 kWh
      expect(calculateKwh(2000, 0.5)).toBe(1) // 2000W for 0.5 hours = 1 kWh
    })

    test('should handle zero values', () => {
      expect(calculateKwh(0, 5)).toBe(0)
      expect(calculateKwh(1000, 0)).toBe(0)
    })
  })

  describe('calculateDuration', () => {
    test('should calculate duration for same-day periods', () => {
      expect(calculateDuration('09:00', '17:00')).toBe(8) // 8 hours
      expect(calculateDuration('14:30', '16:30')).toBe(2) // 2 hours
      expect(calculateDuration('10:15', '10:45')).toBe(0.5) // 30 minutes
    })

    test('should handle overnight periods', () => {
      expect(calculateDuration('22:00', '06:00')).toBe(8) // 10PM to 6AM = 8 hours
      expect(calculateDuration('23:30', '01:30')).toBe(2) // 11:30PM to 1:30AM = 2 hours
    })
  })

  describe('calculateEnergyUsageCost', () => {
    test('should calculate cost for summer on-peak period', () => {
      const result = calculateEnergyUsageCost(
        1000, // 1000W
        '18:00', // 6PM
        '20:00', // 8PM
        '2024-07-10' // Summer weekday
      )

      expect(result.totalKwh).toBe(2) // 1kW * 2 hours
      expect(result.totalCost).toBe(1.1) // 2 kWh * $0.55
      expect(result.timeSlots).toHaveLength(1)
      expect(result.timeSlots[0].ratePeriod.name).toBe('On-Peak')
    })

    test('should calculate cost for winter super off-peak period', () => {
      const result = calculateEnergyUsageCost(
        500, // 500W
        '10:00', // 10AM
        '14:00', // 2PM
        '2024-01-15' // Winter weekday
      )

      expect(result.totalKwh).toBe(2) // 0.5kW * 4 hours
      expect(result.totalCost).toBe(0.48) // 2 kWh * $0.24
      expect(result.timeSlots[0].ratePeriod.name).toBe('Super Off-Peak')
    })

    test('should handle fractional hours and round properly', () => {
      const result = calculateEnergyUsageCost(
        150, // 150W
        '09:30', // 9:30AM
        '11:00', // 11:00AM
        '2024-01-15' // Winter weekday
      )

      expect(result.totalKwh).toBe(0.225) // 0.15kW * 1.5 hours
      expect(result.totalCost).toBe(0.05) // 0.225 kWh * $0.24 = $0.054, rounded to $0.05
    })
  })

  describe('calculateBillSplit', () => {
    const userIds = ['user1', 'user2', 'user3', 'user4']
    
    test('should split bill correctly with personal costs', () => {
      const personalCosts = {
        user1: 25.50,
        user2: 18.75,
        user3: 0,
        user4: 12.25
      }
      
      const result = calculateBillSplit(200, personalCosts, userIds)
      
      expect(result.sharedCost).toBe(143.5) // 200 - 56.5 personal costs
      expect(result.sharedCostPerUser).toBe(35.88) // 143.5 / 4 users
      expect(result.finalAmounts.user1).toBe(61.38) // 25.50 + 35.88
      expect(result.finalAmounts.user2).toBe(54.63) // 18.75 + 35.88
      expect(result.finalAmounts.user3).toBe(35.88) // 0 + 35.88
      expect(result.finalAmounts.user4).toBe(48.13) // 12.25 + 35.88
    })

    test('should handle case where personal costs exceed total bill', () => {
      const personalCosts = {
        user1: 150,
        user2: 100,
        user3: 0,
        user4: 0
      }
      
      const result = calculateBillSplit(200, personalCosts, userIds)
      
      expect(result.sharedCost).toBe(0) // No shared cost when personal exceeds total
      expect(result.sharedCostPerUser).toBe(0)
      expect(result.finalAmounts.user1).toBe(150)
      expect(result.finalAmounts.user2).toBe(100)
    })

    test('should handle equal split when no personal costs', () => {
      const personalCosts = {}
      
      const result = calculateBillSplit(100, personalCosts, userIds)
      
      expect(result.sharedCost).toBe(100)
      expect(result.sharedCostPerUser).toBe(25)
      userIds.forEach(userId => {
        expect(result.finalAmounts[userId]).toBe(25)
      })
    })
  })

  describe('Validation functions', () => {
    describe('isValidTimeFormat', () => {
      test('should validate correct time formats', () => {
        expect(isValidTimeFormat('09:30')).toBe(true)
        expect(isValidTimeFormat('23:59')).toBe(true)
        expect(isValidTimeFormat('00:00')).toBe(true)
        expect(isValidTimeFormat('12:45')).toBe(true)
      })

      test('should reject invalid time formats', () => {
        expect(isValidTimeFormat('25:00')).toBe(false) // Invalid hour
        expect(isValidTimeFormat('12:60')).toBe(false) // Invalid minute
        expect(isValidTimeFormat('9:30')).toBe(false) // Missing leading zero
        expect(isValidTimeFormat('12:5')).toBe(false) // Missing leading zero
        expect(isValidTimeFormat('abc:def')).toBe(false) // Non-numeric
        expect(isValidTimeFormat('12-30')).toBe(false) // Wrong separator
      })
    })

    describe('isValidDateFormat', () => {
      test('should validate correct date formats', () => {
        expect(isValidDateFormat('2024-01-15')).toBe(true)
        expect(isValidDateFormat('2024-12-31')).toBe(true)
        expect(isValidDateFormat('2000-02-29')).toBe(true) // Leap year
      })

      test('should reject invalid date formats', () => {
        expect(isValidDateFormat('2024-13-01')).toBe(false) // Invalid month
        expect(isValidDateFormat('2024-02-30')).toBe(false) // Invalid day for February
        expect(isValidDateFormat('24-01-15')).toBe(false) // Wrong year format
        expect(isValidDateFormat('2024/01/15')).toBe(false) // Wrong separator
        expect(isValidDateFormat('invalid-date')).toBe(false) // Non-date string
      })
    })
  })

  describe('getCurrentRatePeriod', () => {
    test('should return a valid rate period', () => {
      const ratePeriod = getCurrentRatePeriod()
      
      expect(ratePeriod).toHaveProperty('name')
      expect(ratePeriod).toHaveProperty('rate')
      expect(ratePeriod).toHaveProperty('color')
      expect(ratePeriod).toHaveProperty('emoji')
      expect(typeof ratePeriod.rate).toBe('number')
      expect(ratePeriod.rate).toBeGreaterThan(0)
    })
  })
})

// Integration test for complete workflow
describe('Rate Calculation Integration', () => {
  test('should calculate complete energy usage scenario', () => {
    // Scenario: Family uses AC (2000W) from 6PM-10PM on a summer weekday
    const wattage = 2000
    const startTime = '18:00'
    const endTime = '22:00'
    const usageDate = '2024-07-15' // Summer weekday
    
    const energyResult = calculateEnergyUsageCost(wattage, startTime, endTime, usageDate)
    
    // Should be 8 kWh at on-peak rate ($0.55)
    expect(energyResult.totalKwh).toBe(8)
    expect(energyResult.totalCost).toBe(4.4) // 8 * 0.55
    
    // Now split a $150 bill among 4 users with this personal cost for user1
    const personalCosts = {
      user1: energyResult.totalCost,
      user2: 0,
      user3: 0,
      user4: 0
    }
    
    const billResult = calculateBillSplit(150, personalCosts, ['user1', 'user2', 'user3', 'user4'])
    
    expect(billResult.finalAmounts.user1).toBe(40.8) // 4.4 personal + 36.4 shared
    expect(billResult.finalAmounts.user2).toBe(36.4) // 0 personal + 36.4 shared
    expect(billResult.finalAmounts.user3).toBe(36.4) // 0 personal + 36.4 shared
    expect(billResult.finalAmounts.user4).toBe(36.4) // 0 personal + 36.4 shared
    
    // Verify total adds up to original bill
    const total = Object.values(billResult.finalAmounts).reduce((sum, amount) => sum + amount, 0)
    expect(Math.round(total * 100) / 100).toBe(150)
  })
})
