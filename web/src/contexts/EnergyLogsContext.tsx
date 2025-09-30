/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { useDemoMode } from './DemoContext'
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription'
import { useCache } from '../hooks/useCache'
import { MockDataService } from '../services/mockDataService'
import { demoEnergyLogs, demoDevices } from '../demo/demoData'

export interface EnergyLog {
  id: string
  device_id: string
  device_name?: string
  device_wattage?: number
  start_time: string
  end_time: string
  usage_date: string
  calculated_cost: number
  calculated_kwh: number
  household_id: string
  created_by: string
  created_at: string
  assigned_users?: string[]
}

interface EnergyLogsContextType {
  energyLogs: EnergyLog[]
  loading: boolean
  error: string | null
  addEnergyLog: (log: Omit<EnergyLog, 'id' | 'calculated_cost' | 'calculated_kwh' | 'household_id' | 'created_by' | 'created_at'>) => Promise<void>
  updateEnergyLog: (id: string, updates: Partial<EnergyLog>) => Promise<void>
  deleteEnergyLog: (id: string) => Promise<void>
  refreshEnergyLogs: () => Promise<void>
  getLogsByDateRange: (startDate: string, endDate: string) => EnergyLog[]
  getLogsByDevice: (deviceId: string) => EnergyLog[]
  getTotalUsage: () => { totalKwh: number; totalCost: number }
}

const EnergyLogsContext = createContext<EnergyLogsContextType | undefined>(undefined)

export function EnergyLogsProvider({ children }: { children: ReactNode }) {
  const [energyLogs, setEnergyLogs] = useState<EnergyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { isDemoMode } = useDemoMode()

  const refreshEnergyLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      // Use demo data if in demo mode
      if (isDemoMode) {
        const transformedLogs = demoEnergyLogs.map(log => {
          const device = demoDevices.find(d => d.id === log.device_id)
          return {
            ...log,
            device_name: device?.name,
            device_wattage: device?.wattage,
            // Use actual calculated_kwh from demo data, or calculate it if missing
            calculated_kwh: log.calculated_kwh || ((device?.wattage || 0) / 1000) * 
              ((new Date(`2000-01-01T${log.end_time}`).getTime() - new Date(`2000-01-01T${log.start_time}`).getTime()) / (1000 * 60 * 60))
          }
        })
        setEnergyLogs(transformedLogs)
        setError('Using demo data - Supabase connection unavailable')
        setLoading(false)
        return
      }

      if (!user) {
        setLoading(false)
        return
      }

      // Fetch energy logs with device information
      const { data, error } = await supabase
        .from('energy_logs')
        .select(`
          *,
          devices (
            name,
            wattage
          )
        `)
        .order('usage_date', { ascending: false })
        .order('start_time', { ascending: false })

      if (error) throw error

      // Transform data to include device info
      const transformedLogs = data?.map(log => ({
        ...log,
        device_name: log.devices?.name,
        device_wattage: log.devices?.wattage
      })) || []

      setEnergyLogs(transformedLogs)
    } catch (err) {
      console.error('Error fetching energy logs:', err)
      setError('Failed to load energy logs')
    } finally {
      setLoading(false)
    }
  }

  const calculateEnergyCost = async (deviceId: string, startTime: string, endTime: string, usageDate: string) => {
    try {
      // Get device wattage
      const { data: device, error: deviceError } = await supabase
        .from('devices')
        .select('wattage')
        .eq('id', deviceId)
        .single()

      if (deviceError) throw deviceError

      // Use the rate calculation function from Supabase
      const { data, error } = await supabase
        .rpc('calculate_energy_cost', {
          wattage: device.wattage,
          start_time: startTime,
          end_time: endTime,
          usage_date: usageDate
        })

      if (error) throw error

      // Calculate kWh
      const startDateTime = new Date(`${usageDate}T${startTime}`)
      const endDateTime = new Date(`${usageDate}T${endTime}`)
      const durationHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60)
      const kwh = (device.wattage / 1000) * durationHours

      return {
        cost: data || 0,
        kwh: kwh
      }
    } catch (err) {
      console.error('Error calculating energy cost:', err)
      // Fallback calculation if function fails
      const { data: device } = await supabase
        .from('devices')
        .select('wattage')
        .eq('id', deviceId)
        .single()

      if (device) {
        const startDateTime = new Date(`${usageDate}T${startTime}`)
        const endDateTime = new Date(`${usageDate}T${endTime}`)
        const durationHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60)
        const kwh = (device.wattage / 1000) * durationHours
        const cost = kwh * 0.30 // Fallback average rate
        return { cost, kwh }
      }
      return { cost: 0, kwh: 0 }
    }
  }

  const addEnergyLog = async (logData: Omit<EnergyLog, 'id' | 'calculated_cost' | 'calculated_kwh' | 'household_id' | 'created_by' | 'created_at'>) => {
    if (!user) throw new Error('User not authenticated')

    try {
      setError(null)
      
      // Get user's household_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('household_id')
        .eq('id', user.id)
        .single()

      if (userError) throw userError

      // Calculate cost and kWh
      const { cost, kwh } = await calculateEnergyCost(
        logData.device_id,
        logData.start_time,
        logData.end_time,
        logData.usage_date
      )

      const newLog = {
        ...logData,
        calculated_cost: cost,
        calculated_kwh: kwh,
        household_id: userData.household_id,
        created_by: user.id
      }

      const { data, error } = await supabase
        .from('energy_logs')
        .insert([newLog])
        .select(`
          *,
          devices (
            name,
            wattage
          )
        `)
        .single()

      if (error) throw error

      // Add assigned users if provided
      if (logData.assigned_users && logData.assigned_users.length > 0) {
        const userAssignments = logData.assigned_users.map(userId => ({
          energy_log_id: data.id,
          user_id: userId
        }))

        await supabase
          .from('energy_log_users')
          .insert(userAssignments)
      }

      const transformedLog = {
        ...data,
        device_name: data.devices?.name,
        device_wattage: data.devices?.wattage,
        assigned_users: logData.assigned_users
      }

      setEnergyLogs(prev => [transformedLog, ...prev])
    } catch (err) {
      console.error('Error adding energy log:', err)
      setError('Failed to add energy log')
      throw err
    }
  }

  const updateEnergyLog = async (id: string, updates: Partial<EnergyLog>) => {
    try {
      setError(null)

      // If time or date is being updated, recalculate cost
      let updateData = { ...updates }
      if (updates.start_time || updates.end_time || updates.usage_date) {
        const currentLog = energyLogs.find(log => log.id === id)
        if (currentLog) {
          const { cost, kwh } = await calculateEnergyCost(
            currentLog.device_id,
            updates.start_time || currentLog.start_time,
            updates.end_time || currentLog.end_time,
            updates.usage_date || currentLog.usage_date
          )
          updateData.calculated_cost = cost
          updateData.calculated_kwh = kwh
        }
      }

      const { data, error } = await supabase
        .from('energy_logs')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          devices (
            name,
            wattage
          )
        `)
        .single()

      if (error) throw error

      const transformedLog = {
        ...data,
        device_name: data.devices?.name,
        device_wattage: data.devices?.wattage
      }

      setEnergyLogs(prev => prev.map(log => 
        log.id === id ? { ...log, ...transformedLog } : log
      ))
    } catch (err) {
      console.error('Error updating energy log:', err)
      setError('Failed to update energy log')
      throw err
    }
  }

  const deleteEnergyLog = async (id: string) => {
    try {
      setError(null)

      // Delete associated user assignments first
      await supabase
        .from('energy_log_users')
        .delete()
        .eq('energy_log_id', id)

      // Delete the energy log
      const { error } = await supabase
        .from('energy_logs')
        .delete()
        .eq('id', id)

      if (error) throw error

      setEnergyLogs(prev => prev.filter(log => log.id !== id))
    } catch (err) {
      console.error('Error deleting energy log:', err)
      setError('Failed to delete energy log')
      throw err
    }
  }

  const getLogsByDateRange = (startDate: string, endDate: string) => {
    return energyLogs.filter(log => 
      log.usage_date >= startDate && log.usage_date <= endDate
    )
  }

  const getLogsByDevice = (deviceId: string) => {
    return energyLogs.filter(log => log.device_id === deviceId)
  }

  const getTotalUsage = () => {
    return energyLogs.reduce(
      (totals, log) => ({
        totalKwh: totals.totalKwh + log.calculated_kwh,
        totalCost: totals.totalCost + log.calculated_cost
      }),
      { totalKwh: 0, totalCost: 0 }
    )
  }

  useEffect(() => {
    if (user || isDemoMode) {
      refreshEnergyLogs()
    }
  }, [user, isDemoMode])

  const value = {
    energyLogs,
    loading,
    error,
    addEnergyLog,
    updateEnergyLog,
    deleteEnergyLog,
    refreshEnergyLogs,
    getLogsByDateRange,
    getLogsByDevice,
    getTotalUsage
  }

  return (
    <EnergyLogsContext.Provider value={value}>
      {children}
    </EnergyLogsContext.Provider>
  )
}

export function useEnergyLogs() {
  const context = useContext(EnergyLogsContext)
  if (context === undefined) {
    throw new Error('useEnergyLogs must be used within an EnergyLogsProvider')
  }
  return context
}
