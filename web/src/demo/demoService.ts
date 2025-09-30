// Demo service that mimics the database service but uses local demo data
import type { User, Device, EnergyLog, BillSplit } from '../lib/supabase'
import {
  demoUsers,
  demoDevices,
  demoEnergyLogs,
  demoBillSplits,
  DEMO_HOUSEHOLD_ID,
  demoMonthlyTrendData
} from './demoData'

// Demo User Services
export const demoUserService = {
  async getCurrentUser(): Promise<User | null> {
    // Return the first demo user (Vu)
    return demoUsers[0]
  },

  async getHouseholdMembers(householdId: string): Promise<User[]> {
    return demoUsers.filter(user => user.household_id === householdId)
  }
}

// Demo Device Services
export const demoDeviceService = {
  async getHouseholdDevices(householdId: string): Promise<Device[]> {
    return demoDevices.filter(device => device.household_id === householdId)
  },

  async createDevice(device: Omit<Device, 'id' | 'created_at' | 'updated_at'>): Promise<Device | null> {
    const newDevice: Device = {
      ...device,
      id: `demo-device-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    demoDevices.push(newDevice)
    return newDevice
  },

  async updateDevice(id: string, updates: Partial<Device>): Promise<Device | null> {
    const index = demoDevices.findIndex(d => d.id === id)
    if (index === -1) return null
    
    demoDevices[index] = {
      ...demoDevices[index],
      ...updates,
      updated_at: new Date().toISOString()
    }
    return demoDevices[index]
  },

  async deleteDevice(id: string): Promise<boolean> {
    const index = demoDevices.findIndex(d => d.id === id)
    if (index === -1) return false
    
    demoDevices.splice(index, 1)
    return true
  }
}

// Demo Energy Log Services
export const demoEnergyLogService = {
  async getHouseholdLogs(householdId: string, limit?: number): Promise<EnergyLog[]> {
    let logs = demoEnergyLogs.filter(log => log.household_id === householdId)
    if (limit) {
      logs = logs.slice(0, limit)
    }
    return logs
  },

  async createEnergyLog(
    log: Omit<EnergyLog, 'id' | 'calculated_cost' | 'created_at' | 'updated_at'>,
    userIds: string[]
  ): Promise<EnergyLog | null> {
    const newLog: EnergyLog = {
      ...log,
      id: `demo-log-${Date.now()}`,
      calculated_cost: 0, // Would be calculated in real implementation
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    demoEnergyLogs.push(newLog)
    return newLog
  },

  async updateEnergyLog(id: string, updates: Partial<EnergyLog>): Promise<EnergyLog | null> {
    const index = demoEnergyLogs.findIndex(l => l.id === id)
    if (index === -1) return null
    
    demoEnergyLogs[index] = {
      ...demoEnergyLogs[index],
      ...updates,
      updated_at: new Date().toISOString()
    }
    return demoEnergyLogs[index]
  },

  async deleteEnergyLog(id: string): Promise<boolean> {
    const index = demoEnergyLogs.findIndex(l => l.id === id)
    if (index === -1) return false
    
    demoEnergyLogs.splice(index, 1)
    return true
  },

  async getMonthlyUsage(householdId: string, year: number): Promise<any[]> {
    // Return demo monthly trend data
    return demoMonthlyTrendData.map((data, index) => ({
      month: index + 1,
      usage: data.usage,
      cost: data.cost
    }))
  }
}

// Demo Bill Split Services
export const demoBillSplitService = {
  async getHouseholdBillSplits(householdId: string): Promise<BillSplit[]> {
    return demoBillSplits.filter(split => split.household_id === householdId)
  },

  async createBillSplit(billSplit: Omit<BillSplit, 'id' | 'created_at' | 'updated_at'>): Promise<BillSplit | null> {
    const newSplit: BillSplit = {
      ...billSplit,
      id: `demo-bill-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    demoBillSplits.push(newSplit)
    return newSplit
  },

  async updateBillSplit(id: string, updates: Partial<BillSplit>): Promise<BillSplit | null> {
    const index = demoBillSplits.findIndex(s => s.id === id)
    if (index === -1) return null
    
    demoBillSplits[index] = {
      ...demoBillSplits[index],
      ...updates,
      updated_at: new Date().toISOString()
    }
    return demoBillSplits[index]
  }
}
