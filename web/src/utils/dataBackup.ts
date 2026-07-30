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
      if (typeof device.wattage !== 'number') errors.push(`Device ${index}: Missing wattage`)
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

export interface HouseholdImportAdapters {
  existingDevices: Device[]
  knownUserIds?: string[]
  addDevice: (device: Omit<Device, 'id' | 'kwh_per_hour' | 'household_id' | 'created_by' | 'created_at'>) => Promise<Device>
  addEnergyLog: (log: {
    device_id: string
    usage_date: string
    start_time: string
    end_time: string
    assigned_users?: string[]
    source_type?: string
    source_id?: string
  }) => Promise<void>
  addTemplate?: (template: {
    template_name: string
    device_id: string
    device_ids?: string[]
    default_start_time: string
    default_end_time: string
    assigned_users: string[]
  }) => Promise<void>
  addSchedule?: (schedule: {
    schedule_name: string
    device_id: string
    device_ids?: string[]
    recurrence_type: 'daily' | 'weekly' | 'custom'
    days_of_week: number[]
    start_time: string
    end_time: string
    schedule_start_date: string
    schedule_end_date: string | null
    assigned_users: string[]
    auto_create: boolean
  }) => Promise<void>
}

export interface HouseholdImportResult {
  devicesCreated: number
  devicesReused: number
  logsImported: number
  logsSkipped: number
  templatesImported: number
  templatesSkipped: number
  schedulesImported: number
  schedulesSkipped: number
  errors: string[]
}

function deviceKey(device: { name?: string; wattage?: number; location?: string; device_type?: string }) {
  return [
    (device.name || '').trim().toLowerCase(),
    String(device.wattage ?? ''),
    (device.location || '').trim().toLowerCase(),
    (device.device_type || '').trim().toLowerCase(),
  ].join('|')
}

function filterKnownUsers(ids: unknown, knownUserIds?: string[]): string[] {
  if (!Array.isArray(ids)) return []
  const cleaned = ids.filter((id): id is string => typeof id === 'string' && id.length > 0)
  if (!knownUserIds || knownUserIds.length === 0) return []
  const known = new Set(knownUserIds)
  return cleaned.filter((id) => known.has(id))
}

/**
 * Merge-import a household JSON export into the current household.
 * Remaps device IDs; skips bill splits (user allocation IDs are household-specific).
 */
export async function importHouseholdBackup(
  data: BackupData,
  adapters: HouseholdImportAdapters
): Promise<HouseholdImportResult> {
  const result: HouseholdImportResult = {
    devicesCreated: 0,
    devicesReused: 0,
    logsImported: 0,
    logsSkipped: 0,
    templatesImported: 0,
    templatesSkipped: 0,
    schedulesImported: 0,
    schedulesSkipped: 0,
    errors: [],
  }

  const deviceIdMap = new Map<string, string>()
  const existingByKey = new Map(adapters.existingDevices.map((d) => [deviceKey(d), d.id]))

  for (const device of data.devices) {
    try {
      const key = deviceKey(device)
      const reusedId = existingByKey.get(key)
      if (reusedId) {
        deviceIdMap.set(device.id, reusedId)
        result.devicesReused++
        continue
      }

      const created = await adapters.addDevice({
        name: device.name,
        device_type: device.device_type || 'Other',
        location: device.location || 'Other',
        wattage: device.wattage,
        is_shared: Boolean(device.is_shared),
      })
      deviceIdMap.set(device.id, created.id)
      existingByKey.set(key, created.id)
      result.devicesCreated++
    } catch (err) {
      result.errors.push(
        `Device “${device.name}”: ${err instanceof Error ? err.message : 'failed to import'}`
      )
    }
  }

  for (const log of data.energyLogs) {
    const mappedDeviceId = deviceIdMap.get(log.device_id)
    if (!mappedDeviceId) {
      result.logsSkipped++
      continue
    }
    try {
      await adapters.addEnergyLog({
        device_id: mappedDeviceId,
        usage_date: log.usage_date,
        start_time: log.start_time,
        end_time: log.end_time,
        assigned_users: filterKnownUsers(log.assigned_users, adapters.knownUserIds),
        source_type: 'manual',
      })
      result.logsImported++
    } catch (err) {
      result.logsSkipped++
      result.errors.push(
        `Log ${log.usage_date}: ${err instanceof Error ? err.message : 'failed to import'}`
      )
    }
  }

  const templates = Array.isArray(data.templates) ? data.templates : []
  for (const raw of templates) {
    const template = raw as Record<string, unknown>
    const name = typeof template.template_name === 'string' ? template.template_name : ''
    const start = typeof template.default_start_time === 'string' ? template.default_start_time : ''
    const end = typeof template.default_end_time === 'string' ? template.default_end_time : ''
    if (!name || !start || !end || !adapters.addTemplate) {
      result.templatesSkipped++
      continue
    }

    const deviceIdsRaw = Array.isArray(template.device_ids) ? template.device_ids : []
    const mappedMulti = deviceIdsRaw
      .map((id) => (typeof id === 'string' ? deviceIdMap.get(id) : undefined))
      .filter((id): id is string => Boolean(id))
    const singleOld = typeof template.device_id === 'string' ? template.device_id : ''
    const mappedSingle = singleOld ? deviceIdMap.get(singleOld) : undefined
    const primary = mappedMulti[0] || mappedSingle
    if (!primary) {
      result.templatesSkipped++
      continue
    }

    try {
      await adapters.addTemplate({
        template_name: name,
        device_id: primary,
        device_ids: mappedMulti.length > 0 ? mappedMulti : undefined,
        default_start_time: start,
        default_end_time: end,
        assigned_users: filterKnownUsers(template.assigned_users, adapters.knownUserIds),
      })
      result.templatesImported++
    } catch (err) {
      result.templatesSkipped++
      result.errors.push(
        `Template “${name}”: ${err instanceof Error ? err.message : 'failed to import'}`
      )
    }
  }

  const schedules = Array.isArray(data.schedules) ? data.schedules : []
  for (const raw of schedules) {
    const schedule = raw as Record<string, unknown>
    const name = typeof schedule.schedule_name === 'string' ? schedule.schedule_name : ''
    const startTime = typeof schedule.start_time === 'string' ? schedule.start_time : ''
    const endTime = typeof schedule.end_time === 'string' ? schedule.end_time : ''
    const startDate = typeof schedule.schedule_start_date === 'string' ? schedule.schedule_start_date : ''
    if (!name || !startTime || !endTime || !startDate || !adapters.addSchedule) {
      result.schedulesSkipped++
      continue
    }

    const deviceIdsRaw = Array.isArray(schedule.device_ids) ? schedule.device_ids : []
    const mappedMulti = deviceIdsRaw
      .map((id) => (typeof id === 'string' ? deviceIdMap.get(id) : undefined))
      .filter((id): id is string => Boolean(id))
    const singleOld = typeof schedule.device_id === 'string' ? schedule.device_id : ''
    const mappedSingle = singleOld ? deviceIdMap.get(singleOld) : undefined
    const primary = mappedMulti[0] || mappedSingle
    if (!primary) {
      result.schedulesSkipped++
      continue
    }

    const days = Array.isArray(schedule.days_of_week)
      ? schedule.days_of_week.filter((d): d is number => typeof d === 'number')
      : [0, 1, 2, 3, 4, 5, 6]
    const recurrence =
      schedule.recurrence_type === 'daily' ||
      schedule.recurrence_type === 'weekly' ||
      schedule.recurrence_type === 'custom'
        ? schedule.recurrence_type
        : 'weekly'

    try {
      await adapters.addSchedule({
        schedule_name: name,
        device_id: primary,
        device_ids: mappedMulti.length > 0 ? mappedMulti : undefined,
        recurrence_type: recurrence,
        days_of_week: days,
        start_time: startTime,
        end_time: endTime,
        schedule_start_date: startDate,
        schedule_end_date:
          typeof schedule.schedule_end_date === 'string' ? schedule.schedule_end_date : null,
        assigned_users: filterKnownUsers(schedule.assigned_users, adapters.knownUserIds),
        auto_create: Boolean(schedule.auto_create),
      })
      result.schedulesImported++
    } catch (err) {
      result.schedulesSkipped++
      result.errors.push(
        `Schedule “${name}”: ${err instanceof Error ? err.message : 'failed to import'}`
      )
    }
  }

  return result
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
