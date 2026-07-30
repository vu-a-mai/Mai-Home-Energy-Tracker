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
  templates?: unknown[]
  schedules?: unknown[]
  billSplits?: unknown[]
  metadata: {
    deviceCount: number
    energyLogCount: number
    templateCount?: number
    scheduleCount?: number
    billSplitCount?: number
    dateRange: {
      earliest: string | null
      latest: string | null
    }
  }
}

export interface HouseholdExportExtras {
  templates?: unknown[]
  schedules?: unknown[]
  billSplits?: unknown[]
}

/**
 * Export household data to JSON file (devices, logs, and optional extras).
 */
export function exportDataToJSON(
  devices: Device[],
  energyLogs: EnergyLogWithDevice[],
  householdId: string,
  extras: HouseholdExportExtras = {}
): void {
  // Calculate metadata
  const dates = energyLogs.map(log => log.usage_date).sort()
  const templates = extras.templates ?? []
  const schedules = extras.schedules ?? []
  const billSplits = extras.billSplits ?? []
  const metadata = {
    deviceCount: devices.length,
    energyLogCount: energyLogs.length,
    templateCount: templates.length,
    scheduleCount: schedules.length,
    billSplitCount: billSplits.length,
    dateRange: {
      earliest: dates.length > 0 ? dates[0] : null,
      latest: dates.length > 0 ? dates[dates.length - 1] : null
    }
  }

  const backupData: BackupData = {
    version: '1.1',
    timestamp: new Date().toISOString(),
    household_id: householdId,
    devices,
    energyLogs,
    templates,
    schedules,
    billSplits,
    metadata
  }

  const jsonString = JSON.stringify(backupData, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `mai-household-export-${new Date().toISOString().split('T')[0]}.json`
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
 * Create automatic backup checkpoint before dangerous operations.
 * Stores metadata only in localStorage — use exportDataToJSON for a full backup.
 */
export function createAutoBackup(
  devices: Device[],
  energyLogs: EnergyLogWithDevice[],
  householdId: string
): string {
  const dates = energyLogs.map(log => log.usage_date).sort()
  const checkpoint = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    household_id: householdId,
    metadata: {
      deviceCount: devices.length,
      energyLogCount: energyLogs.length,
      dateRange: {
        earliest: dates.length > 0 ? dates[0] : null,
        latest: dates.length > 0 ? dates[dates.length - 1] : null
      }
    }
  }

  try {
    localStorage.setItem('mai-energy-auto-backup', JSON.stringify(checkpoint))
    localStorage.setItem('mai-energy-auto-backup-timestamp', new Date().toISOString())
    return 'Auto-backup checkpoint created (metadata only)'
  } catch (error) {
    console.error('Failed to create auto-backup:', error)
    return 'Failed to create auto-backup'
  }
}

/**
 * Restore from auto-backup.
 * Full restore requires a downloaded JSON export; localStorage holds metadata only.
 */
export function getAutoBackup(): BackupData | null {
  try {
    const backup = localStorage.getItem('mai-energy-auto-backup')
    if (!backup) return null

    const parsed = JSON.parse(backup)
    // Legacy full backups are cleared — do not rehydrate sensitive payloads from storage
    if (Array.isArray(parsed.devices) || Array.isArray(parsed.energyLogs)) {
      clearAutoBackup()
      return null
    }

    return {
      version: parsed.version || '1.0',
      timestamp: parsed.timestamp || new Date().toISOString(),
      household_id: parsed.household_id || '',
      devices: [],
      energyLogs: [],
      metadata: parsed.metadata || {
        deviceCount: 0,
        energyLogCount: 0,
        dateRange: { earliest: null, latest: null }
      }
    }
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
