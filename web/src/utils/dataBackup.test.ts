import { describe, expect, it, vi } from 'vitest'
import { importHouseholdBackup, validateBackupData, type BackupData } from './dataBackup'

function sampleBackup(overrides: Partial<BackupData> = {}): BackupData {
  return {
    version: '1.1',
    timestamp: new Date().toISOString(),
    household_id: 'old-household',
    devices: [
      {
        id: 'd1',
        name: 'TV',
        device_type: 'TV',
        location: 'Living Room',
        wattage: 120,
        kwh_per_hour: 0.12,
        is_shared: true,
        household_id: 'old-household',
        created_by: 'u1',
        created_at: new Date().toISOString(),
      },
    ],
    energyLogs: [
      {
        id: 'l1',
        device_id: 'd1',
        usage_date: '2026-07-01',
        start_time: '18:00:00',
        end_time: '20:00:00',
        calculated_cost: 1,
        total_kwh: 0.24,
        household_id: 'old-household',
        created_by: 'u1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assigned_users: ['u1', 'foreign-user'],
      } as BackupData['energyLogs'][number],
    ],
    templates: [
      {
        template_name: 'Evening TV',
        device_id: 'd1',
        device_ids: [],
        default_start_time: '18:00:00',
        default_end_time: '20:00:00',
        assigned_users: ['u1'],
      },
    ],
    schedules: [],
    metadata: {
      deviceCount: 1,
      energyLogCount: 1,
      dateRange: { earliest: '2026-07-01', latest: '2026-07-01' },
    },
    ...overrides,
  }
}

describe('validateBackupData', () => {
  it('accepts wattage 0', () => {
    const data = sampleBackup({
      devices: [
        {
          ...sampleBackup().devices[0],
          wattage: 0,
        },
      ],
    })
    expect(validateBackupData(data).valid).toBe(true)
  })
})

describe('importHouseholdBackup', () => {
  it('creates devices, remaps logs, and filters unknown assignees', async () => {
    const addDevice = vi.fn(async () => ({
      id: 'new-d1',
      name: 'TV',
      device_type: 'TV',
      location: 'Living Room',
      wattage: 120,
      kwh_per_hour: 0.12,
      is_shared: true,
      household_id: 'current',
      created_by: 'u1',
      created_at: new Date().toISOString(),
    }))
    const addEnergyLog = vi.fn(async () => undefined)
    const addTemplate = vi.fn(async () => undefined)

    const result = await importHouseholdBackup(sampleBackup(), {
      existingDevices: [],
      knownUserIds: ['u1'],
      addDevice,
      addEnergyLog,
      addTemplate,
    })

    expect(result.devicesCreated).toBe(1)
    expect(result.logsImported).toBe(1)
    expect(result.templatesImported).toBe(1)
    expect(addEnergyLog).toHaveBeenCalledWith(
      expect.objectContaining({
        device_id: 'new-d1',
        assigned_users: ['u1'],
      })
    )
  })

  it('reuses matching existing devices', async () => {
    const existing = sampleBackup().devices[0]
    const addDevice = vi.fn()
    const addEnergyLog = vi.fn(async () => undefined)

    const result = await importHouseholdBackup(sampleBackup(), {
      existingDevices: [{ ...existing, id: 'already-here' }],
      knownUserIds: ['u1'],
      addDevice,
      addEnergyLog,
    })

    expect(result.devicesCreated).toBe(0)
    expect(result.devicesReused).toBe(1)
    expect(addDevice).not.toHaveBeenCalled()
    expect(addEnergyLog).toHaveBeenCalledWith(
      expect.objectContaining({ device_id: 'already-here' })
    )
  })
})
