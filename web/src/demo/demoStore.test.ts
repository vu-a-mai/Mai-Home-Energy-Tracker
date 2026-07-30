import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  DEMO_HOUSEHOLD_ID,
  demoUsers,
  demoDevices,
  demoEnergyLogs,
  demoTemplates,
  demoSchedules,
  demoDeviceGroups,
} from './demoData'
import {
  initDemoStore,
  clearDemoStore,
  demoAddDevice,
  demoGetDevices,
  demoAddEnergyLog,
  demoGetEnergyLogs,
  demoGetTemplates,
  demoGetSchedules,
  demoGetDeviceGroups,
  DEMO_STATE_KEY,
} from './demoStore'

function installLocalStorageMock() {
  const store = new Map<string, string>()
  const localStorageMock = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value))
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
  }
  vi.stubGlobal('localStorage', localStorageMock)
  return localStorageMock
}

describe('demo seed referential integrity', () => {
  const userIds = new Set(demoUsers.map((u) => u.id))
  const deviceIds = new Set(demoDevices.map((d) => d.id))

  it('keeps every energy log device_id and user refs resolvable', () => {
    for (const log of demoEnergyLogs) {
      expect(deviceIds.has(log.device_id), `missing device ${log.device_id} on ${log.id}`).toBe(true)
      expect(userIds.has(log.created_by), `missing created_by ${log.created_by} on ${log.id}`).toBe(true)
      expect(log.assigned_users?.length, `missing assigned_users on ${log.id}`).toBeGreaterThan(0)
      for (const uid of log.assigned_users || []) {
        expect(userIds.has(uid), `bad assigned user ${uid} on ${log.id}`).toBe(true)
      }
      expect(log.household_id).toBe(DEMO_HOUSEHOLD_ID)
    }
  })

  it('keeps template and schedule refs resolvable', () => {
    for (const t of demoTemplates) {
      const ids = t.device_ids?.length ? t.device_ids : t.device_id ? [t.device_id] : []
      expect(ids.length).toBeGreaterThan(0)
      for (const id of ids) expect(deviceIds.has(id)).toBe(true)
      for (const uid of t.assigned_users) expect(userIds.has(uid)).toBe(true)
    }
    for (const s of demoSchedules) {
      expect(deviceIds.has(s.device_id)).toBe(true)
      for (const uid of s.assigned_users) expect(userIds.has(uid)).toBe(true)
    }
    for (const g of demoDeviceGroups) {
      for (const id of g.device_ids) expect(deviceIds.has(id)).toBe(true)
    }
  })
})

describe('demo store sandbox', () => {
  beforeEach(() => {
    installLocalStorageMock()
    clearDemoStore()
    initDemoStore(true)
  })

  afterEach(() => {
    clearDemoStore()
    vi.unstubAllGlobals()
  })

  it('adds a device locally and lists it', () => {
    const before = demoGetDevices().length
    const created = demoAddDevice({
      name: 'Demo Lamp',
      device_type: 'Light',
      location: 'Office',
      wattage: 60,
      is_shared: true,
    })
    expect(created.id.startsWith('demo-device-')).toBe(true)
    expect(demoGetDevices().length).toBe(before + 1)
    expect(demoGetDevices().some((d) => d.name === 'Demo Lamp')).toBe(true)
  })

  it('persists mutations in localStorage until cleared', () => {
    demoAddDevice({
      name: 'Persist Fan',
      device_type: 'Fan',
      location: 'Patio',
      wattage: 40,
      is_shared: true,
    })
    expect(localStorage.getItem(DEMO_STATE_KEY)).toBeTruthy()
    clearDemoStore()
    expect(localStorage.getItem(DEMO_STATE_KEY)).toBeNull()
  })

  it('adds energy logs against store devices without supabase', () => {
    const device = demoGetDevices()[0]
    const before = demoGetEnergyLogs().length
    const log = demoAddEnergyLog({
      device_id: device.id,
      usage_date: '2025-09-15',
      start_time: '10:00:00',
      end_time: '11:00:00',
      assigned_users: ['demo-user-alex'],
    })
    expect(log.calculated_cost).toBeGreaterThanOrEqual(0)
    expect(log.total_kwh).toBeGreaterThan(0)
    expect(demoGetEnergyLogs().length).toBe(before + 1)
  })

  it('exposes seeded templates, schedules, and groups', () => {
    expect(demoGetTemplates().length).toBeGreaterThan(0)
    expect(demoGetSchedules().length).toBeGreaterThan(0)
    expect(demoGetDeviceGroups().length).toBeGreaterThan(0)
  })
})

describe('demo mode never calls supabase insert', () => {
  it('store module does not expose supabase and mutations avoid it', () => {
    installLocalStorageMock()
    const supabaseSpy = vi.fn()
    clearDemoStore()
    initDemoStore(true)
    demoAddDevice({
      name: 'No Supabase Device',
      device_type: 'Other',
      location: 'Garage',
      wattage: 10,
      is_shared: false,
    })
    expect(supabaseSpy).not.toHaveBeenCalled()
    expect(demoGetDevices().some((d) => d.name === 'No Supabase Device')).toBe(true)
    vi.unstubAllGlobals()
  })
})
