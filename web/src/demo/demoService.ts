/**
 * Demo service facade over the mutable demo store.
 * Kept for callers that previously used demoService helpers.
 */

import type { User, Device, EnergyLog } from '../lib/supabase'
import {
  DEMO_HOUSEHOLD_ID,
  demoGetDevices,
  demoAddDevice,
  demoUpdateDevice,
  demoDeleteDevice,
  demoGetEnergyLogs,
  demoAddEnergyLog,
  demoUpdateEnergyLog,
  demoDeleteEnergyLog,
  demoGetBillSplits,
  demoSaveBillSplit,
  demoDeleteBillSplit,
  getDemoCurrentUser,
  getDemoState,
} from './demoStore'
import { demoMonthlyTrendData } from './demoData'

export { DEMO_HOUSEHOLD_ID }

export const demoUserService = {
  async getCurrentUser(): Promise<User | null> {
    return getDemoCurrentUser()
  },

  async getHouseholdMembers(householdId: string): Promise<User[]> {
    return getDemoState().users.filter((user) => user.household_id === householdId)
  },
}

export const demoDeviceService = {
  async getHouseholdDevices(householdId: string): Promise<Device[]> {
    return demoGetDevices().filter((device) => device.household_id === householdId)
  },

  async createDevice(
    device: Omit<Device, 'id' | 'created_at' | 'updated_at' | 'household_id' | 'created_by' | 'kwh_per_hour'>
  ): Promise<Device | null> {
    return demoAddDevice(device)
  },

  async updateDevice(id: string, updates: Partial<Device>): Promise<Device | null> {
    return demoUpdateDevice(id, updates)
  },

  async deleteDevice(id: string): Promise<boolean> {
    return demoDeleteDevice(id)
  },
}

export const demoEnergyLogService = {
  async getHouseholdLogs(householdId: string, limit?: number): Promise<EnergyLog[]> {
    let logs = demoGetEnergyLogs().filter((log) => log.household_id === householdId)
    if (limit) logs = logs.slice(0, limit)
    return logs
  },

  async createEnergyLog(
    log: Omit<EnergyLog, 'id' | 'calculated_cost' | 'created_at' | 'updated_at' | 'household_id' | 'created_by' | 'total_kwh'> & {
      calculated_cost?: number
      total_kwh?: number
    },
    _userIds: string[]
  ): Promise<EnergyLog | null> {
    return demoAddEnergyLog({
      ...log,
      assigned_users: log.assigned_users?.length ? log.assigned_users : _userIds,
    })
  },

  async updateEnergyLog(id: string, updates: Partial<EnergyLog>): Promise<EnergyLog | null> {
    return demoUpdateEnergyLog(id, updates)
  },

  async deleteEnergyLog(id: string): Promise<boolean> {
    return demoDeleteEnergyLog(id)
  },

  async getMonthlyUsage(_householdId: string, _year: number): Promise<{ month: number; usage: number; cost: number }[]> {
    return demoMonthlyTrendData.map((data, index) => ({
      month: index + 1,
      usage: data.usage,
      cost: data.cost,
    }))
  },
}

export const demoBillSplitService = {
  async getHouseholdBillSplits(householdId: string) {
    return demoGetBillSplits().filter((split) => split.household_id === householdId)
  },

  async createBillSplit(
    billSplit: Parameters<typeof demoSaveBillSplit>[0]
  ) {
    return demoSaveBillSplit(billSplit)
  },

  async updateBillSplit(id: string, updates: Record<string, unknown>) {
    const existing = demoGetBillSplits().find((s) => s.id === id)
    if (!existing) return null
    demoDeleteBillSplit(id)
    return demoSaveBillSplit({ ...existing, ...updates } as Parameters<typeof demoSaveBillSplit>[0])
  },
}
