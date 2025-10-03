/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useDemoMode } from './DemoContext'
import type { EnergyLog } from '../lib/supabase'
import { calculateUsageCost } from '../utils/rateCalculatorFixed'
import { logger } from '../utils/logger'
import { demoEnergyLogs, demoDevices } from '../demo/demoData'

// Re-export EnergyLog for convenience
export type { EnergyLog }

// Use EnergyLog type from supabase, extend it for display purposes
export interface EnergyLogWithDevice extends EnergyLog {
  device_name?: string
  device_wattage?: number
}

interface EnergyLogsContextType {
  energyLogs: EnergyLogWithDevice[]
  loading: boolean
  error: string | null
  addEnergyLog: (log: Omit<EnergyLog, 'id' | 'calculated_cost' | 'total_kwh' | 'household_id' | 'created_by' | 'created_at' | 'updated_at'>) => Promise<void>
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
            total_kwh: log.total_kwh || ((device?.wattage || 0) / 1000) * 
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

      // Get user's household_id to filter logs
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('household_id')
        .eq('id', user.id)
        .maybeSingle()

      if (userError) {
        logger.error('Error fetching user data:', userError)
        setLoading(false)
        return
      }

      if (!userData?.household_id) {
        logger.error('User has no household_id')
        setLoading(false)
        return
      }

      // Fetch energy logs with device information - FILTERED BY HOUSEHOLD
      const { data, error } = await supabase
        .from('energy_logs')
        .select(`
          *,
          devices (
            name,
            wattage
          )
        `)
        .eq('household_id', userData.household_id)
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
      logger.error('Error fetching energy logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateEnergyCost = async (
    deviceId: string,
    startTime: string,
    endTime: string,
    usageDate: string
  ): Promise<{ cost: number; kwh: number }> => {
    try {
      // Get device wattage
      const { data: device, error: deviceError } = await supabase
        .from('devices')
        .select('wattage')
        .eq('id', deviceId)
        .maybeSingle()

      if (deviceError) throw deviceError
      if (!device) throw new Error('Device not found')

      // Use the proper rate calculator for accurate time-of-use pricing
      const calculation = calculateUsageCost(
        device.wattage,
        startTime,
        endTime,
        usageDate
      )

      return {
        cost: Math.round(calculation.totalCost * 100) / 100, // Round to 2 decimal places
        kwh: Math.round(calculation.totalKwh * 1000) / 1000  // Round to 3 decimal places
      }
    } catch (err) {
      logger.error('Error calculating energy cost:', err)
      throw new Error('Failed to calculate energy cost')
    }
  }

  const addEnergyLog = async (logData: Omit<EnergyLog, 'id' | 'calculated_cost' | 'total_kwh' | 'household_id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated')

    try {
      setError(null)
      
      // Get user's household_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('household_id')
        .eq('id', user.id)
        .maybeSingle()

      if (userError) {
        logger.error('Error fetching user data:', userError)
        throw new Error('Failed to fetch user data. Please try logging out and back in.')
      }
      
      if (!userData) {
        logger.error('User not found in database. User ID:', user.id)
        throw new Error('User profile not found. Please try logging out and back in to sync your account.')
      }

      // Calculate cost and kWh
      const { cost, kwh } = await calculateEnergyCost(
        logData.device_id,
        logData.start_time,
        logData.end_time,
        logData.usage_date
      )

      // Extract assigned_users before creating the log entry
      const { assigned_users, ...logDataWithoutUsers } = logData

      const newLog = {
        ...logDataWithoutUsers,
        calculated_cost: cost,
        total_kwh: kwh,
        assigned_users: assigned_users || [], // Store assigned users in the array column
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
        .maybeSingle()

      if (error) throw error
      if (!data) throw new Error('Failed to create energy log')

      const transformedLog = {
        ...data,
        device_name: data.devices?.name,
        device_wattage: data.devices?.wattage,
        assigned_users: assigned_users
      }

      setEnergyLogs(prev => [transformedLog, ...prev])
    } catch (err) {
      logger.error('Error adding energy log:', err)
      setError('Failed to add energy log')
      throw err
    }
  }

  const updateEnergyLog = async (id: string, updates: Partial<EnergyLog>) => {
    try {
      setError(null)

      // If device, time, or date is being updated, recalculate cost
      let updateData = { ...updates }
      if (updates.device_id || updates.start_time || updates.end_time || updates.usage_date) {
        const currentLog = energyLogs.find(log => log.id === id)
        if (currentLog) {
          const { cost, kwh } = await calculateEnergyCost(
            updates.device_id || currentLog.device_id,
            updates.start_time || currentLog.start_time,
            updates.end_time || currentLog.end_time,
            updates.usage_date || currentLog.usage_date
          )
          updateData.calculated_cost = cost
          updateData.total_kwh = kwh
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
        .maybeSingle()

      if (error) throw error
      if (!data) throw new Error('Energy log not found')

      const transformedLog = {
        ...data,
        device_name: data.devices?.name,
        device_wattage: data.devices?.wattage
      }

      setEnergyLogs(prev => prev.map(log => 
        log.id === id ? { ...log, ...transformedLog } : log
      ))
    } catch (err) {
      logger.error('Error updating energy log:', err)
      setError('Failed to update energy log')
      throw err
    }
  }

  const deleteEnergyLog = async (id: string) => {
    try {
      setError(null)

      // First, verify the log exists and user has permission to delete it
      const { data: existingLog, error: fetchError } = await supabase
        .from('energy_logs')
        .select('id, created_by, household_id')
        .eq('id', id)
        .maybeSingle()

      if (fetchError) throw fetchError
      if (!existingLog) {
        throw new Error('Energy log not found')
      }

      // Delete the energy log (assigned_users are stored in the same table, no separate junction table)
      const { error, count } = await supabase
        .from('energy_logs')
        .delete({ count: 'exact' })
        .eq('id', id)

      if (error) throw error

      // Check if deletion was actually successful (RLS might block it silently)
      if (count === 0) {
        logger.error('Delete was blocked by RLS policy. Log details:', existingLog)
        logger.error('Current user:', user?.id)
        throw new Error('You do not have permission to delete this energy log. It may have been created by another user. Please contact your administrator.')
      }

      setEnergyLogs(prev => prev.filter(log => log.id !== id))
    } catch (err) {
      logger.error('Error deleting energy log:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete energy log'
      setError(errorMessage)
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
        totalKwh: totals.totalKwh + (log.total_kwh || 0),
        totalCost: totals.totalCost + (log.calculated_cost || 0)
      }),
      { totalKwh: 0, totalCost: 0 }
    )
  }

  useEffect(() => {
    if (user || isDemoMode) {
      refreshEnergyLogs()
    }
  }, [user, isDemoMode])

  // Set up realtime subscription for energy logs
  useEffect(() => {
    if (!user || isDemoMode) return

    const channel = supabase
      .channel('energy_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'energy_logs'
        },
        (payload) => {
          logger.debug('Energy log change detected:', payload)
          // Refresh logs when any change occurs
          refreshEnergyLogs()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
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
