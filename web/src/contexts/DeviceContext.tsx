/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
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

      // Get user's household_id to filter devices
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('household_id')
        .eq('id', user.id)
        .maybeSingle()

      if (userError) {
        console.error('Error fetching user data:', userError)
        setLoading(false)
        return
      }

      if (!userData?.household_id) {
        console.error('User has no household_id')
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

      // Fetch devices - FILTERED BY HOUSEHOLD
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('household_id', userData.household_id)
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
      
      // Get or create user's household_id
      let userData = null
      
      // First try to get existing user
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('household_id')
        .eq('id', user.id)
        .maybeSingle()

      if (existingUser) {
        userData = existingUser
      } else {
        // User doesn't exist in database, create them
        console.log('User not found in database, creating user record...')
        const householdId = crypto.randomUUID()
        
        const newUser = {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          household_id: householdId
        }

        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert([newUser])
          .select('household_id')
          .single()

        if (createError) {
          console.error('Error creating user:', createError)
          throw new Error('Failed to create user profile. Please try again.')
        }
        
        userData = createdUser
      }

      if (!userData) {
        throw new Error('Failed to get user data. Please try again.')
      }

      const newDevice = {
        ...deviceData,
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to add device'
      setError(errorMessage)
      throw err
    }
  }

  const updateDevice = async (id: string, updates: Partial<Device>) => {
    try {
      setError(null)

      // Remove kwh_per_hour from updates since it's auto-calculated
      const updateData = { ...updates }
      delete updateData.kwh_per_hour

      const { data, error } = await supabase
        .from('devices')
        .update(updateData)
        .eq('id', id)
        .select()
        .maybeSingle()

      if (error) throw error
      if (!data) throw new Error('Device not found')

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
