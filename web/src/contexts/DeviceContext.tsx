/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { useDemoMode } from './DemoContext'
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription'
import { useCache } from '../hooks/useCache'
import { MockDataService } from '../services/mockDataService'
import { demoDevices } from '../demo/demoData'

export interface Device {
  id: string
  name: string
  device_type: string
  location: string
  wattage: number
  kwh_per_hour: number
  is_shared: boolean
  household_id: string
  created_by: string
  created_at: string
}

interface DeviceContextType {
  devices: Device[]
  loading: boolean
  error: string | null
  addDevice: (device: Omit<Device, 'id' | 'kwh_per_hour' | 'household_id' | 'created_by' | 'created_at'>) => Promise<void>
  updateDevice: (id: string, updates: Partial<Device>) => Promise<void>
  deleteDevice: (id: string) => Promise<void>
  refreshDevices: (useCache?: boolean) => Promise<void>
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined)

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { isDemoMode } = useDemoMode()
  const cache = useCache<Device[]>('devices', { ttl: 2 * 60 * 1000 }) // 2 minutes cache

  const refreshDevices = async (useCache = true) => {
    try {
      setLoading(true)
      setError(null)

      // Use demo data if in demo mode
      if (isDemoMode) {
        const deviceData = demoDevices.map(device => {
          // Determine owner based on device name
          let owner = 'demo-user-vu'
          if (device.name.includes("Thuy's")) owner = 'demo-user-thuy'
          else if (device.name.includes("Vy's")) owner = 'demo-user-vy'
          else if (device.name.includes("Han's")) owner = 'demo-user-han'
          
          return {
            ...device,
            kwh_per_hour: device.wattage / 1000,
            // Use is_shared from demo data (already correctly set)
            created_by: owner
          }
        })
        setDevices(deviceData)
        setError('Using demo data - Supabase connection unavailable')
        setLoading(false)
        return
      }

      if (!user) {
        setLoading(false)
        return
      }

      // Check cache first
      const cacheKey = `devices-${user.id}`
      if (useCache && cache.has(cacheKey)) {
        const cachedDevices = cache.get(cacheKey)
        if (cachedDevices) {
          setDevices(cachedDevices)
          setLoading(false)
          return
        }
      }

      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const deviceData = data || []
      setDevices(deviceData)
      cache.set(cacheKey, deviceData)
    } catch (err) {
      console.error('Error fetching devices:', err)
      console.log('Falling back to mock data...')
      
      // Fallback to mock data
      try {
        const mockDevices = await MockDataService.getDevices()
        const deviceData = mockDevices.map(device => ({
          ...device,
          kwh_per_hour: device.wattage / 1000,
          household_id: 'mock-household',
          created_by: user?.id || 'mock-user'
        }))
        setDevices(deviceData)
        setError('Using demo data - Supabase connection unavailable')
      } catch (mockErr) {
        console.error('Mock data error:', mockErr)
        setError('Failed to load devices')
      }
    } finally {
      setLoading(false)
    }
  }

  const addDevice = async (deviceData: Omit<Device, 'id' | 'kwh_per_hour' | 'household_id' | 'created_by' | 'created_at'>) => {
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

      const newDevice = {
        ...deviceData,
        kwh_per_hour: deviceData.wattage / 1000, // Convert watts to kWh/hour
        household_id: userData.household_id,
        created_by: user.id
      }

      const { data, error } = await supabase
        .from('devices')
        .insert([newDevice])
        .select()
        .single()

      if (error) throw error

      // Update local state (real-time will also update)
      setDevices(prev => [data, ...prev])
      
      // Invalidate cache
      cache.remove(`devices-${user.id}`)
    } catch (err) {
      console.error('Error adding device:', err)
      setError('Failed to add device')
      throw err
    }
  }

  const updateDevice = async (id: string, updates: Partial<Device>) => {
    try {
      setError(null)

      // If wattage is being updated, also update kwh_per_hour
      const updateData = { ...updates }
      if (updates.wattage) {
        updateData.kwh_per_hour = updates.wattage / 1000
      }

      const { data, error } = await supabase
        .from('devices')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Update local state (real-time will also update)
      setDevices(prev => prev.map(device => 
        device.id === id ? { ...device, ...data } : device
      ))
      
      // Invalidate cache
      if (user) cache.remove(`devices-${user.id}`)
    } catch (err) {
      console.error('Error updating device:', err)
      setError('Failed to update device')
      throw err
    }
  }

  const deleteDevice = async (id: string) => {
    try {
      setError(null)

      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Update local state (real-time will also update)
      setDevices(prev => prev.filter(device => device.id !== id))
      
      // Invalidate cache
      if (user) cache.remove(`devices-${user.id}`)
    } catch (err) {
      console.error('Error deleting device:', err)
      setError('Failed to delete device')
      throw err
    }
  }

  // Real-time subscription for devices
  useRealtimeSubscription({
    table: 'devices',
    onInsert: (payload) => {
      setDevices(prev => [payload.new, ...prev])
      if (user) cache.remove(`devices-${user.id}`)
    },
    onUpdate: (payload) => {
      setDevices(prev => prev.map(device => 
        device.id === payload.new.id ? payload.new : device
      ))
      if (user) cache.remove(`devices-${user.id}`)
    },
    onDelete: (payload) => {
      setDevices(prev => prev.filter(device => device.id !== payload.old.id))
      if (user) cache.remove(`devices-${user.id}`)
    }
  })

  useEffect(() => {
    if (user || isDemoMode) {
      refreshDevices()
    }
  }, [user, isDemoMode])

  const value = {
    devices,
    loading,
    error,
    addDevice,
    updateDevice,
    deleteDevice,
    refreshDevices
  }

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  )
}

export function useDevices() {
  const context = useContext(DeviceContext)
  if (context === undefined) {
    throw new Error('useDevices must be used within a DeviceProvider')
  }
  return context
}
