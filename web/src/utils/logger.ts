/**
 * Logger utility for development and production environments
 * 
 * - In development: All logs are shown
 * - In production: Only errors are shown
 * 
 * Usage:
 *   import { logger } from '../utils/logger'
 *   logger.log('Info message')
 *   logger.error('Error message')
 *   logger.warn('Warning message')
 *   logger.debug('Debug data:', data)
 */

const isDev = import.meta.env.DEV

export const logger = {
  /**
   * General logging (development only)
   */
  log: (...args: any[]) => {
    if (isDev) console.log(...args)
  },

  /**
   * Error logging (always shown)
   */
  error: (...args: any[]) => {
    console.error(...args)
  },

  /**
   * Warning logging (development only)
   */
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args)
  },

  /**
   * Debug logging with prefix (development only)
   */
  debug: (...args: any[]) => {
    if (isDev) console.log('[DEBUG]', ...args)
  },

  /**
   * Info logging with prefix (development only)
   */
  info: (...args: any[]) => {
    if (isDev) console.info('[INFO]', ...args)
  }
}

