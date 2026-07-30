/**
 * Mutable local demo sandbox.
 * Clones seed data; persists to localStorage while demo_mode is active.
 * Never touches Supabase.
 */

import type { User, Device, EnergyLog, BillSplit } from '../lib/supabase'
import type {
  EnergyLogTemplate,
  RecurringSchedule,
  DeviceGroup,
  TemplateFormData,
  ScheduleFormData,
  DeviceGroupFormData,
} from '../types'
import {
  DEMO_HOUSEHOLD_ID,
  DEMO_CURRENT_USER_ID,
  demoUsers,
  demoDevices,
  demoEnergyLogs,
  demoBillSplits,
  demoTemplates,
  demoSchedules,
  demoDeviceGroups,
} from './demoData'
import { calculateUsageCost } from '../utils/rateCalculatorFixed'
import { timesOverlap } from '../utils/timeOverlap'

/** Bump when seed shape changes so stale localStorage sandboxes reset. */
export const DEMO_STATE_KEY = 'demo_state_v2'
export { DEMO_HOUSEHOLD_ID, DEMO_CURRENT_USER_ID }

export interface DemoBillSplit extends BillSplit {
  split_method?: 'even' | 'usage_based'
}

export interface DemoState {
  users: User[]
  devices: Device[]
  energyLogs: EnergyLog[]
  billSplits: DemoBillSplit[]
  templates: EnergyLogTemplate[]
  schedules: RecurringSchedule[]
  deviceGroups: DeviceGroup[]
}

type Listener = () => void

let state: DemoState | null = null
const listeners = new Set<Listener>()

function cloneSeed(): DemoState {
  return {
    users: structuredClone(demoUsers),
    devices: structuredClone(demoDevices),
    energyLogs: structuredClone(demoEnergyLogs),
    billSplits: structuredClone(demoBillSplits) as DemoBillSplit[],
    templates: structuredClone(demoTemplates),
    schedules: structuredClone(demoSchedules),
    deviceGroups: structuredClone(demoDeviceGroups),
  }
}

function loadFromStorage(): DemoState | null {
  try {
    const raw = localStorage.getItem(DEMO_STATE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DemoState
    if (!parsed?.users || !parsed?.devices || !parsed?.energyLogs) return null
    return {
      users: parsed.users,
      devices: parsed.devices,
      energyLogs: parsed.energyLogs,
      billSplits: parsed.billSplits || [],
      templates: parsed.templates || [],
      schedules: parsed.schedules || [],
      deviceGroups: parsed.deviceGroups || [],
    }
  } catch {
    return null
  }
}

function persist() {
  if (!state) return
  try {
    localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota / private mode
  }
}

function notify() {
  listeners.forEach((l) => l())
}

function commit() {
  persist()
  notify()
}

function ensureState(): DemoState {
  if (!state) {
    state = loadFromStorage() ?? cloneSeed()
    persist()
  }
  return state
}

export function subscribeDemoStore(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Enter/restore demo sandbox. Pass forceReset=true to wipe edits. */
export function initDemoStore(forceReset = false): DemoState {
  if (!forceReset) {
    const stored = loadFromStorage()
    if (stored) {
      state = stored
      return state
    }
  }
  state = cloneSeed()
  persist()
  notify()
  return state
}

/** Exit demo — wipe mutable state and storage. */
export function clearDemoStore(): void {
  state = null
  try {
    localStorage.removeItem(DEMO_STATE_KEY)
  } catch {
    // ignore
  }
  notify()
}

export function getDemoState(): DemoState {
  return ensureState()
}

export function getDemoHouseholdId(): string {
  return DEMO_HOUSEHOLD_ID
}

export function getDemoCurrentUser(): User {
  const s = ensureState()
  return s.users.find((u) => u.id === DEMO_CURRENT_USER_ID) ?? s.users[0]
}

// ---- Devices ----

export function demoGetDevices(): Device[] {
  return [...ensureState().devices]
}

export function demoAddDevice(
  device: Omit<Device, 'id' | 'household_id' | 'created_by' | 'created_at' | 'updated_at' | 'kwh_per_hour'>
): Device {
  const s = ensureState()
  const now = new Date().toISOString()
  const newDevice: Device = {
    ...device,
    id: `demo-device-${Date.now()}`,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: DEMO_CURRENT_USER_ID,
    created_at: now,
    updated_at: now,
    kwh_per_hour: device.wattage / 1000,
  }
  s.devices = [newDevice, ...s.devices]
  commit()
  return newDevice
}

export function demoUpdateDevice(id: string, updates: Partial<Device>): Device | null {
  const s = ensureState()
  const index = s.devices.findIndex((d) => d.id === id)
  if (index === -1) return null
  const { kwh_per_hour: _k, ...rest } = updates
  s.devices[index] = {
    ...s.devices[index],
    ...rest,
    updated_at: new Date().toISOString(),
    kwh_per_hour: (rest.wattage ?? s.devices[index].wattage) / 1000,
  }
  commit()
  return s.devices[index]
}

export function demoDeleteDevice(id: string): boolean {
  const s = ensureState()
  const before = s.devices.length
  s.devices = s.devices.filter((d) => d.id !== id)
  if (s.devices.length === before) return false
  commit()
  return true
}

// ---- Energy logs ----

export function demoGetEnergyLogs(): EnergyLog[] {
  return [...ensureState().energyLogs]
}

export function demoAddEnergyLog(
  log: Omit<EnergyLog, 'id' | 'household_id' | 'created_by' | 'created_at' | 'updated_at' | 'calculated_cost' | 'total_kwh'> & {
    calculated_cost?: number
    total_kwh?: number
  }
): EnergyLog {
  const s = ensureState()
  const device = s.devices.find((d) => d.id === log.device_id)
  const wattage = device?.wattage ?? 0
  let cost = log.calculated_cost
  let kwh = log.total_kwh
  let breakdown = log.rate_breakdown

  if (cost == null || kwh == null) {
    const calc = calculateUsageCost(wattage, log.start_time, log.end_time, log.usage_date)
    cost = calc.totalCost
    kwh = calc.totalKwh
    breakdown = calc.breakdown
  }

  const now = new Date().toISOString()
  const newLog: EnergyLog = {
    ...log,
    id: `demo-log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: DEMO_CURRENT_USER_ID,
    calculated_cost: Math.round((cost ?? 0) * 100) / 100,
    total_kwh: Math.round((kwh ?? 0) * 1000) / 1000,
    rate_breakdown: breakdown,
    created_at: now,
    updated_at: now,
    device_name: device?.name,
    device_wattage: device?.wattage,
  }
  s.energyLogs = [newLog, ...s.energyLogs]
  commit()
  return newLog
}

export function demoUpdateEnergyLog(id: string, updates: Partial<EnergyLog>): EnergyLog | null {
  const s = ensureState()
  const index = s.energyLogs.findIndex((l) => l.id === id)
  if (index === -1) return null

  const current = s.energyLogs[index]
  const next = { ...current, ...updates, updated_at: new Date().toISOString() }

  if (updates.device_id || updates.start_time || updates.end_time || updates.usage_date) {
    const device = s.devices.find((d) => d.id === next.device_id)
    const calc = calculateUsageCost(
      device?.wattage ?? 0,
      next.start_time,
      next.end_time,
      next.usage_date
    )
    next.calculated_cost = Math.round(calc.totalCost * 100) / 100
    next.total_kwh = Math.round(calc.totalKwh * 1000) / 1000
    next.rate_breakdown = calc.breakdown
    next.device_name = device?.name
    next.device_wattage = device?.wattage
  }

  s.energyLogs[index] = next
  commit()
  return next
}

export function demoDeleteEnergyLog(id: string): boolean {
  const s = ensureState()
  const before = s.energyLogs.length
  s.energyLogs = s.energyLogs.filter((l) => l.id !== id)
  if (s.energyLogs.length === before) return false
  commit()
  return true
}

export function demoFindOverlappingLogs(
  deviceId: string,
  date: string,
  startTime: string,
  endTime: string
): EnergyLog[] {
  return ensureState().energyLogs.filter(
    (log) =>
      log.device_id === deviceId &&
      log.usage_date === date &&
      timesOverlap(startTime, endTime, log.start_time, log.end_time)
  )
}

// ---- Bill splits ----

export function demoGetBillSplits(): DemoBillSplit[] {
  return [...ensureState().billSplits]
}

export function demoSaveBillSplit(
  billSplit: Omit<DemoBillSplit, 'id' | 'household_id' | 'created_by' | 'created_at' | 'updated_at'>
): DemoBillSplit {
  const s = ensureState()
  const now = new Date().toISOString()
  const saved: DemoBillSplit = {
    ...billSplit,
    id: `demo-bill-${Date.now()}`,
    household_id: DEMO_HOUSEHOLD_ID,
    created_by: DEMO_CURRENT_USER_ID,
    created_at: now,
    updated_at: now,
  }
  s.billSplits = [saved, ...s.billSplits]
  commit()
  return saved
}

export function demoDeleteBillSplit(id: string): boolean {
  const s = ensureState()
  const before = s.billSplits.length
  s.billSplits = s.billSplits.filter((b) => b.id !== id)
  if (s.billSplits.length === before) return false
  commit()
  return true
}

// ---- Templates ----

function enrichTemplate(template: EnergyLogTemplate, devices: Device[]): EnergyLogTemplate {
  const ids =
    template.device_ids && template.device_ids.length > 0
      ? template.device_ids
      : template.device_id
        ? [template.device_id]
        : []
  const matched = devices.filter((d) => ids.includes(d.id))
  return {
    ...template,
    devices: matched as unknown as EnergyLogTemplate['devices'],
    device_name: matched.map((d) => d.name).join(', ') || 'Unknown',
    device_wattage: matched.length === 1 ? matched[0].wattage : undefined,
  }
}

export function demoGetTemplates(): EnergyLogTemplate[] {
  const s = ensureState()
  return s.templates.map((t) => enrichTemplate(t, s.devices))
}

export function demoAddTemplate(data: TemplateFormData): EnergyLogTemplate {
  const s = ensureState()
  const now = new Date().toISOString()
  const isMulti = !!(data.device_ids && data.device_ids.length > 0)
  const template: EnergyLogTemplate = {
    id: `demo-template-${Date.now()}`,
    household_id: DEMO_HOUSEHOLD_ID,
    template_name: data.template_name,
    device_id: isMulti ? null : data.device_id,
    device_ids: isMulti ? data.device_ids! : data.device_id ? [data.device_id] : [],
    default_start_time: data.default_start_time,
    default_end_time: data.default_end_time,
    assigned_users: data.assigned_users,
    created_by: DEMO_CURRENT_USER_ID,
    created_at: now,
    updated_at: now,
  }
  s.templates = [template, ...s.templates]
  commit()
  return enrichTemplate(template, s.devices)
}

export function demoUpdateTemplate(id: string, data: Partial<TemplateFormData>): EnergyLogTemplate | null {
  const s = ensureState()
  const index = s.templates.findIndex((t) => t.id === id)
  if (index === -1) return null
  const current = s.templates[index]
  const next: EnergyLogTemplate = {
    ...current,
    ...data,
    device_id:
      data.device_ids && data.device_ids.length > 0
        ? null
        : data.device_id !== undefined
          ? data.device_id
          : current.device_id,
    device_ids:
      data.device_ids !== undefined
        ? data.device_ids
        : data.device_id
          ? [data.device_id]
          : current.device_ids,
    updated_at: new Date().toISOString(),
  }
  s.templates[index] = next
  commit()
  return enrichTemplate(next, s.devices)
}

export function demoDeleteTemplate(id: string): boolean {
  const s = ensureState()
  const before = s.templates.length
  s.templates = s.templates.filter((t) => t.id !== id)
  if (s.templates.length === before) return false
  commit()
  return true
}

// ---- Schedules ----

function enrichSchedule(schedule: RecurringSchedule, devices: Device[]): RecurringSchedule {
  const device = devices.find((d) => d.id === schedule.device_id)
  return {
    ...schedule,
    device_name: device?.name,
    device_wattage: device?.wattage,
  }
}

export function demoGetSchedules(): RecurringSchedule[] {
  const s = ensureState()
  return s.schedules.map((sch) => enrichSchedule(sch, s.devices))
}

export function demoAddSchedule(data: ScheduleFormData): RecurringSchedule {
  const s = ensureState()
  const now = new Date().toISOString()
  const schedule: RecurringSchedule = {
    id: `demo-schedule-${Date.now()}`,
    household_id: DEMO_HOUSEHOLD_ID,
    schedule_name: data.schedule_name,
    device_id: data.device_id,
    recurrence_type: data.recurrence_type,
    days_of_week: data.days_of_week,
    start_time: data.start_time,
    end_time: data.end_time,
    schedule_start_date: data.schedule_start_date,
    schedule_end_date: data.schedule_end_date,
    assigned_users: data.assigned_users,
    is_active: true,
    auto_create: data.auto_create,
    created_by: DEMO_CURRENT_USER_ID,
    created_at: now,
    updated_at: now,
  }
  s.schedules = [schedule, ...s.schedules]
  commit()
  return enrichSchedule(schedule, s.devices)
}

export function demoUpdateSchedule(
  id: string,
  data: Partial<ScheduleFormData> & { is_active?: boolean }
): RecurringSchedule | null {
  const s = ensureState()
  const index = s.schedules.findIndex((sch) => sch.id === id)
  if (index === -1) return null
  s.schedules[index] = {
    ...s.schedules[index],
    ...data,
    updated_at: new Date().toISOString(),
  }
  commit()
  return enrichSchedule(s.schedules[index], s.devices)
}

export function demoDeleteSchedule(id: string): boolean {
  const s = ensureState()
  const before = s.schedules.length
  s.schedules = s.schedules.filter((sch) => sch.id !== id)
  if (s.schedules.length === before) return false
  commit()
  return true
}

// ---- Device groups ----

export function demoGetDeviceGroups(): DeviceGroup[] {
  return [...ensureState().deviceGroups]
}

export function demoAddDeviceGroup(data: DeviceGroupFormData): DeviceGroup {
  const s = ensureState()
  const now = new Date().toISOString()
  const group: DeviceGroup = {
    id: `demo-group-${Date.now()}`,
    household_id: DEMO_HOUSEHOLD_ID,
    group_name: data.group_name,
    device_ids: data.device_ids,
    created_by: DEMO_CURRENT_USER_ID,
    created_at: now,
    updated_at: now,
  }
  s.deviceGroups = [group, ...s.deviceGroups]
  commit()
  return group
}

export function demoUpdateDeviceGroup(id: string, data: DeviceGroupFormData): DeviceGroup | null {
  const s = ensureState()
  const index = s.deviceGroups.findIndex((g) => g.id === id)
  if (index === -1) return null
  s.deviceGroups[index] = {
    ...s.deviceGroups[index],
    ...data,
    updated_at: new Date().toISOString(),
  }
  commit()
  return s.deviceGroups[index]
}

export function demoDeleteDeviceGroup(id: string): boolean {
  const s = ensureState()
  const before = s.deviceGroups.length
  s.deviceGroups = s.deviceGroups.filter((g) => g.id !== id)
  if (s.deviceGroups.length === before) return false
  commit()
  return true
}
