/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useDemoMode } from './DemoContext'
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription'
import { useCache } from '../hooks/useCache'
import {
  demoGetDevices,
  demoAddDevice,
  demoUpdateDevice,
  demoDeleteDevice,
  subscribeDemoStore,
  DEMO_CURRENT_USER_ID,
} from '../demo/demoStore'
import { logger } from '../utils/logger'

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

function mapDemoDevices(): Device[] {
  return demoGetDevices().map((device) => ({
    ...device,
    kwh_per_hour: device.wattage / 1000,
    created_by: device.created_by || DEMO_CURRENT_USER_ID,
  }))
}

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { isDemoMode } = useDemoMode()
  const cache = useCache<Device[]>('devices', { ttl: 2 * 60 * 1000 })

  const refreshDevices = async (useCache = true) => {
    try {
      setLoading(true)
      setError(null)

      if (isDemoMode) {
        setDevices(mapDemoDevices())
        setLoading(false)
        return
      }

      if (!user) {
        setLoading(false)
        return
      }

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
        .eq('household_id', userData.household_id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const deviceData = data || []
      setDevices(deviceData)
      cache.set(cacheKey, deviceData)
    } catch (err) {
      logger.error('Error fetching devices:', err)
      setDevices([])
      setError(err instanceof Error ? err.message : 'Failed to load devices. Please retry.')
    } finally {
      setLoading(false)
    }
  }

  const addDevice = async (deviceData: Omit<Device, 'id' | 'kwh_per_hour' | 'household_id' | 'created_by' | 'created_at'>) => {
    if (isDemoMode) {
      setError(null)
      demoAddDevice({
        name: deviceData.name,
        device_type: deviceData.device_type,
        location: deviceData.location,
        wattage: deviceData.wattage,
        is_shared: deviceData.is_shared,
      })
      setDevices(mapDemoDevices())
      return
    }

    if (!user) throw new Error('User not authenticated')

    try {
      setError(null)

      let userData = null

      const { data: existingUser } = await supabase
        .from('users')
        .select('household_id')
        .eq('id', user.id)
        .maybeSingle()

      if (existingUser) {
        userData = existingUser
      } else {
        logger.log('User not found in database, creating user record...')
        const householdId = crypto.randomUUID()

        const newUser = {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          household_id: householdId,
        }

        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert([newUser])
          .select('household_id')
          .single()

        if (createError) {
          logger.error('Error creating user:', createError)
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
        created_by: user.id,
      }

      const { data, error } = await supabase
        .from('devices')
        .insert([newDevice])
        .select()
        .single()

      if (error) throw error

      setDevices((prev) => [data, ...prev])
      cache.remove(`devices-${user.id}`)
    } catch (err) {
      logger.error('Error adding device:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to add device'
      setError(errorMessage)
      throw err
    }
  }

  const updateDevice = async (id: string, updates: Partial<Device>) => {
    if (isDemoMode) {
      setError(null)
      const updated = demoUpdateDevice(id, updates)
      if (!updated) throw new Error('Device not found')
      setDevices(mapDemoDevices())
      return
    }

    try {
      setError(null)

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

      setDevices((prev) =>
        prev.map((device) => (device.id === id ? { ...device, ...data } : device))
      )

      if (user) cache.remove(`devices-${user.id}`)
    } catch (err) {
      logger.error('Error updating device:', err)
      setError('Failed to update device')
      throw err
    }
  }

  const deleteDevice = async (id: string) => {
    if (isDemoMode) {
      setError(null)
      demoDeleteDevice(id)
      setDevices(mapDemoDevices())
      return
    }

    try {
      setError(null)

      const { error } = await supabase.from('devices').delete().eq('id', id)

      if (error) throw error

      setDevices((prev) => prev.filter((device) => device.id !== id))

      if (user) cache.remove(`devices-${user.id}`)
    } catch (err) {
      logger.error('Error deleting device:', err)
      setError('Failed to delete device')
      throw err
    }
  }

  useRealtimeSubscription({
    table: 'devices',
    enabled: !isDemoMode && !!user,
    onInsert: (payload) => {
      setDevices((prev) => [payload.new, ...prev])
      if (user) cache.remove(`devices-${user.id}`)
    },
    onUpdate: (payload) => {
      setDevices((prev) =>
        prev.map((device) => (device.id === payload.new.id ? payload.new : device))
      )
      if (user) cache.remove(`devices-${user.id}`)
    },
    onDelete: (payload) => {
      setDevices((prev) => prev.filter((device) => device.id !== payload.old.id))
      if (user) cache.remove(`devices-${user.id}`)
    },
  })

  useEffect(() => {
    if (user || isDemoMode) {
      refreshDevices()
    }
  }, [user, isDemoMode])

  useEffect(() => {
    if (!isDemoMode) return
    return subscribeDemoStore(() => {
      void refreshDevices()
    })
  }, [isDemoMode])

  const value = {
    devices,
    loading,
    error,
    addDevice,
    updateDevice,
    deleteDevice,
    refreshDevices,
  }

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>
}

export function useDevices() {
  const context = useContext(DeviceContext)
  if (context === undefined) {
    throw new Error('useDevices must be used within a DeviceProvider')
  }
  return context
}
