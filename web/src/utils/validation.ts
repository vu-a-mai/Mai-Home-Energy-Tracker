/**
 * Input validation utilities
 * Provides validation functions for forms throughout the app
 */

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate wattage input
 */
export function validateWattage(wattage: number): ValidationResult {
  if (isNaN(wattage) || wattage === null || wattage === undefined) {
    return { valid: false, error: 'Wattage is required' }
  }
  
  if (wattage <= 0) {
    return { valid: false, error: 'Wattage must be greater than 0' }
  }
  
  if (wattage > 50000) {
    return { valid: false, error: 'Wattage seems unusually high (max 50,000W)' }
  }
  
  return { valid: true }
}

/**
 * Validate date input
 */
export function validateDate(dateString: string): ValidationResult {
  if (!dateString) {
    return { valid: false, error: 'Date is required' }
  }
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date format' }
  }
  
  // Check if date is in the future
  const today = new Date()
  today.setHours(23, 59, 59, 999) // End of today
  if (date > today) {
    return { valid: false, error: 'Date cannot be in the future' }
  }
  
  // Check if date is too far in the past (more than 5 years)
  const fiveYearsAgo = new Date()
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)
  if (date < fiveYearsAgo) {
    return { valid: false, error: 'Date is too far in the past (max 5 years)' }
  }
  
  return { valid: true }
}

/**
 * Validate time input (HH:MM format)
 */
export function validateTime(timeString: string): ValidationResult {
  if (!timeString) {
    return { valid: false, error: 'Time is required' }
  }
  
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(timeString)) {
    return { valid: false, error: 'Invalid time format (use HH:MM)' }
  }
  
  return { valid: true }
}

/**
 * Validate time range (start time vs end time)
 * Note: Allows overnight usage (end < start)
 */
export function validateTimeRange(startTime: string, endTime: string): ValidationResult {
  const startValidation = validateTime(startTime)
  if (!startValidation.valid) {
    return startValidation
  }
  
  const endValidation = validateTime(endTime)
  if (!endValidation.valid) {
    return endValidation
  }
  
  // Check if times are exactly the same
  if (startTime === endTime) {
    return { valid: false, error: 'End time must be different from start time' }
  }
  
  return { valid: true }
}

/**
 * Validate amount (for bill split)
 */
export function validateAmount(amount: number): ValidationResult {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return { valid: false, error: 'Amount is required' }
  }
  
  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' }
  }
  
  if (amount > 100000) {
    return { valid: false, error: 'Amount seems unusually high (max $100,000)' }
  }
  
  return { valid: true }
}

/**
 * Validate date range
 */
export function validateDateRange(startDate: string, endDate: string): ValidationResult {
  const startValidation = validateDate(startDate)
  if (!startValidation.valid) {
    return { valid: false, error: `Start date: ${startValidation.error}` }
  }
  
  const endValidation = validateDate(endDate)
  if (!endValidation.valid) {
    return { valid: false, error: `End date: ${endValidation.error}` }
  }
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (end <= start) {
    return { valid: false, error: 'End date must be after start date' }
  }
  
  // Check if range is too long (more than 1 year)
  const oneYearLater = new Date(start)
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1)
  if (end > oneYearLater) {
    return { valid: false, error: 'Date range cannot exceed 1 year' }
  }
  
  return { valid: true }
}

/**
 * Validate device name
 */
export function validateDeviceName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Device name is required' }
  }
  
  if (name.length < 2) {
    return { valid: false, error: 'Device name must be at least 2 characters' }
  }
  
  if (name.length > 100) {
    return { valid: false, error: 'Device name is too long (max 100 characters)' }
  }
  
  return { valid: true }
}

/**
 * Validate email
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: 'Email is required' }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' }
  }
  
  return { valid: true }
}

/**
 * Calculate usage duration in hours
 * Handles overnight usage
 */
export function calculateUsageDuration(startTime: string, endTime: string): number {
  const start = new Date(`2000-01-01T${startTime}`)
  const end = new Date(`2000-01-01T${endTime}`)
  
  let duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  
  // Handle overnight usage
  if (duration < 0) {
    duration += 24
  }
  
  return duration
}

/**
 * Validate usage duration (warn if too long)
 */
export function validateUsageDuration(startTime: string, endTime: string): ValidationResult {
  const duration = calculateUsageDuration(startTime, endTime)
  
  if (duration > 24) {
    return { valid: false, error: 'Usage duration cannot exceed 24 hours' }
  }
  
  if (duration > 12) {
    return { 
      valid: true, 
      error: 'Warning: Usage duration is quite long (over 12 hours)' 
    }
  }
  
  return { valid: true }
}
