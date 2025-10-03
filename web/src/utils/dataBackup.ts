/**
 * Data Backup and Restore Utilities
 * Provides export/import functionality for energy logs and devices
 * Protects against data corruption and loss
 */

import type { Device } from '../contexts/DeviceContext'
import type { EnergyLogWithDevice } from '../contexts/EnergyLogsContext'

export interface BackupData {
  version: string
  timestamp: string
  household_id: string
  devices: Device[]
  energyLogs: EnergyLogWithDevice[]
  metadata: {
    deviceCount: number
    energyLogCount: number
    dateRange: {
      earliest: string | null
      latest: string | null
    }
  }
}

export interface ImportResult {
  success: boolean
  message: string
  stats?: {
    devicesImported: number
    energyLogsImported: number
    devicesSkipped: number
    energyLogsSkipped: number
  }
  errors?: string[]
}

/**
 * Export all data to JSON file
 */
export function exportDataToJSON(
  devices: Device[],
  energyLogs: EnergyLogWithDevice[],
  householdId: string
): void {
  // Calculate metadata
  const dates = energyLogs.map(log => log.usage_date).sort()
  const metadata = {
    deviceCount: devices.length,
    energyLogCount: energyLogs.length,
    dateRange: {
      earliest: dates.length > 0 ? dates[0] : null,
      latest: dates.length > 0 ? dates[dates.length - 1] : null
    }
  }

  const backupData: BackupData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    household_id: householdId,
    devices,
    energyLogs,
    metadata
  }

  const jsonString = JSON.stringify(backupData, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `mai-energy-backup-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Export data to CSV format
 */
export function exportEnergyLogsToCSV(energyLogs: EnergyLogWithDevice[]): void {
  const headers = [
    'Date',
    'Device Name',
    'Start Time',
    'End Time',
    'Duration (hours)',
    'Energy (kWh)',
    'Cost ($)',
    'Created By',
    'Assigned Users'
  ]

  const rows = energyLogs.map(log => {
    const startTime = new Date(`${log.usage_date}T${log.start_time}`)
    const endTime = new Date(`${log.usage_date}T${log.end_time}`)
    let duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
    if (duration < 0) duration += 24 // Handle overnight usage

    return [
      log.usage_date,
      log.device_name || 'Unknown',
      log.start_time,
      log.end_time,
      duration.toFixed(2),
      (log.total_kwh || 0).toFixed(4),
      log.calculated_cost.toFixed(2),
      log.created_by,
      (log.assigned_users || []).join('; ')
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `energy-logs-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Export devices to CSV format
 */
export function exportDevicesToCSV(devices: Device[]): void {
  const headers = [
    'Name',
    'Type',
    'Location',
    'Wattage',
    'Is Shared',
    'Created At'
  ]

  const rows = devices.map(device => [
    device.name,
    device.device_type,
    device.location,
    device.wattage.toString(),
    device.is_shared ? 'Yes' : 'No',
    device.created_at
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `devices-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Validate imported backup data
 */
export function validateBackupData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check version
  if (!data.version) {
    errors.push('Missing version field')
  }

  // Check required fields
  if (!data.timestamp) {
    errors.push('Missing timestamp field')
  }

  if (!data.household_id) {
    errors.push('Missing household_id field')
  }

  if (!Array.isArray(data.devices)) {
    errors.push('Devices must be an array')
  }

  if (!Array.isArray(data.energyLogs)) {
    errors.push('Energy logs must be an array')
  }

  // Validate devices
  if (Array.isArray(data.devices)) {
    data.devices.forEach((device: any, index: number) => {
      if (!device.name) errors.push(`Device ${index}: Missing name`)
      if (!device.wattage) errors.push(`Device ${index}: Missing wattage`)
      if (typeof device.is_shared !== 'boolean') {
        errors.push(`Device ${index}: is_shared must be boolean`)
      }
    })
  }

  // Validate energy logs
  if (Array.isArray(data.energyLogs)) {
    data.energyLogs.forEach((log: any, index: number) => {
      if (!log.device_id) errors.push(`Energy log ${index}: Missing device_id`)
      if (!log.usage_date) errors.push(`Energy log ${index}: Missing usage_date`)
      if (!log.start_time) errors.push(`Energy log ${index}: Missing start_time`)
      if (!log.end_time) errors.push(`Energy log ${index}: Missing end_time`)
    })
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Parse imported JSON file
 */
export async function parseBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)
        
        const validation = validateBackupData(data)
        if (!validation.valid) {
          reject(new Error(`Invalid backup file:\n${validation.errors.join('\n')}`))
          return
        }
        
        resolve(data as BackupData)
      } catch (error) {
        reject(new Error('Failed to parse backup file. Make sure it\'s a valid JSON file.'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsText(file)
  })
}

/**
 * Create automatic backup before dangerous operations
 */
export function createAutoBackup(
  devices: Device[],
  energyLogs: EnergyLogWithDevice[],
  householdId: string
): string {
  const backupData: BackupData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    household_id: householdId,
    devices,
    energyLogs,
    metadata: {
      deviceCount: devices.length,
      energyLogCount: energyLogs.length,
      dateRange: {
        earliest: null,
        latest: null
      }
    }
  }

  const jsonString = JSON.stringify(backupData)
  
  // Store in localStorage as emergency backup
  try {
    localStorage.setItem('mai-energy-auto-backup', jsonString)
    localStorage.setItem('mai-energy-auto-backup-timestamp', new Date().toISOString())
    return 'Auto-backup created successfully'
  } catch (error) {
    console.error('Failed to create auto-backup:', error)
    return 'Failed to create auto-backup'
  }
}

/**
 * Restore from auto-backup
 */
export function getAutoBackup(): BackupData | null {
  try {
    const backup = localStorage.getItem('mai-energy-auto-backup')
    if (!backup) return null
    
    return JSON.parse(backup) as BackupData
  } catch (error) {
    console.error('Failed to retrieve auto-backup:', error)
    return null
  }
}

/**
 * Get auto-backup timestamp
 */
export function getAutoBackupTimestamp(): string | null {
  return localStorage.getItem('mai-energy-auto-backup-timestamp')
}

/**
 * Clear auto-backup
 */
export function clearAutoBackup(): void {
  localStorage.removeItem('mai-energy-auto-backup')
  localStorage.removeItem('mai-energy-auto-backup-timestamp')
}
