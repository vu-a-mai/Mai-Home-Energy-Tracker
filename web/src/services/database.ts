import { supabase, type User, type Device, type EnergyLog, type BillSplit } from '../lib/supabase'
import { logger } from '../utils/logger'

// User Services
export const userService = {
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      logger.error('Error fetching user:', error)
      return null
    }
    return data
  },

  async getHouseholdMembers(householdId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('household_id', householdId)

    if (error) {
      logger.error('Error fetching household members:', error)
      return []
    }
    return data || []
  }
}

// Device Services
export const deviceService = {
  async getHouseholdDevices(householdId: string): Promise<Device[]> {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('household_id', householdId)
      .order('name')

    if (error) {
      logger.error('Error fetching devices:', error)
      return []
    }
    return data || []
  },

  async createDevice(device: Omit<Device, 'id' | 'created_at' | 'updated_at'>): Promise<Device | null> {
    const { data, error } = await supabase
      .from('devices')
      .insert([device])
      .select()
      .single()

    if (error) {
      logger.error('Error creating device:', error)
      return null
    }
    return data
  },

  async updateDevice(id: string, updates: Partial<Device>): Promise<Device | null> {
    const { data, error } = await supabase
      .from('devices')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Error updating device:', error)
      return null
    }
    return data
  },

  async deleteDevice(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Error deleting device:', error)
      return false
    }
    return true
  }
}

// Energy Log Services
export const energyLogService = {
  async getHouseholdLogs(householdId: string, limit?: number): Promise<EnergyLog[]> {
    let query = supabase
      .from('energy_logs')
      .select(`
        *,
        devices(name, wattage)
      `)
      .eq('household_id', householdId)
      .order('usage_date', { ascending: false })
      .order('start_time', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching energy logs:', error)
      return []
    }
    return data || []
  },

  async createEnergyLog(
    log: Omit<EnergyLog, 'id' | 'calculated_cost' | 'created_at' | 'updated_at'>,
    userIds: string[]
  ): Promise<EnergyLog | null> {
    // Include assigned_users in the log data
    const logWithUsers = {
      ...log,
      assigned_users: userIds
    }

    const { data: logData, error: logError } = await supabase
      .from('energy_logs')
      .insert([logWithUsers])
      .select()
      .single()

    if (logError) {
      logger.error('Error creating energy log:', logError)
      return null
    }

    return logData
  },

  async updateEnergyLog(id: string, updates: Partial<EnergyLog>): Promise<EnergyLog | null> {
    const { data, error } = await supabase
      .from('energy_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Error updating energy log:', error)
      return null
    }
    return data
  },

  async deleteEnergyLog(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('energy_logs')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Error deleting energy log:', error)
      return false
    }
    return true
  },

  async getMonthlyUsage(householdId: string, year: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('energy_logs')
      .select(`
        usage_date,
        calculated_cost,
        start_time,
        end_time,
        devices!inner(wattage)
      `)
      .eq('household_id', householdId)
      .gte('usage_date', `${year}-01-01`)
      .lte('usage_date', `${year}-12-31`)

    if (error) {
      logger.error('Error fetching monthly usage:', error)
      return []
    }

    // Group by month and calculate totals
    const monthlyData: Record<number, { usage: number; cost: number }> = {}
    
    data?.forEach(log => {
      const month = new Date(log.usage_date).getMonth() + 1
      const startTime = new Date(`2000-01-01T${log.start_time}`)
      const endTime = new Date(`2000-01-01T${log.end_time}`)
      let duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60) // hours
      
      if (duration < 0) duration += 24 // Handle overnight usage
      
      const deviceWattage = (log.devices as any)?.wattage || 0
      const kwh = (deviceWattage / 1000) * duration
      
      if (!monthlyData[month]) {
        monthlyData[month] = { usage: 0, cost: 0 }
      }
      
      monthlyData[month].usage += kwh
      monthlyData[month].cost += log.calculated_cost
    })

    return Object.entries(monthlyData).map(([month, data]) => ({
      month: parseInt(month),
      usage: Math.round(data.usage * 100) / 100,
      cost: Math.round(data.cost * 100) / 100
    }))
  }
}

// Bill Split Services
export const billSplitService = {
  async getHouseholdBillSplits(householdId: string): Promise<BillSplit[]> {
    const { data, error } = await supabase
      .from('bill_splits')
      .select('*')
      .eq('household_id', householdId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })

    if (error) {
      logger.error('Error fetching bill splits:', error)
      return []
    }
    return data || []
  },

  async createBillSplit(billSplit: Omit<BillSplit, 'id' | 'created_at' | 'updated_at'>): Promise<BillSplit | null> {
    const { data, error } = await supabase
      .from('bill_splits')
      .insert([billSplit])
      .select()
      .single()

    if (error) {
      logger.error('Error creating bill split:', error)
      return null
    }
    return data
  },

  async updateBillSplit(id: string, updates: Partial<BillSplit>): Promise<BillSplit | null> {
    const { data, error } = await supabase
      .from('bill_splits')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Error updating bill split:', error)
      return null
    }
    return data
  }
}
