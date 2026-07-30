import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { DeviceGroup, DeviceGroupFormData } from '../types'
import { toast } from 'sonner'
import { useDemoMode } from '../contexts/DemoContext'
import {
  demoGetDeviceGroups,
  demoAddDeviceGroup,
  demoUpdateDeviceGroup,
  demoDeleteDeviceGroup,
} from '../demo/demoStore'

export function useDeviceGroups() {
  const [deviceGroups, setDeviceGroups] = useState<DeviceGroup[]>([])
  const [loading, setLoading] = useState(true)
  const { isDemoMode } = useDemoMode()

  const fetchDeviceGroups = async () => {
    try {
      setLoading(true)

      if (isDemoMode) {
        setDeviceGroups(demoGetDeviceGroups())
        return
      }

      const { data, error } = await supabase
        .from('device_groups')
        .select('*')
        .order('group_name')

      if (error) throw error
      setDeviceGroups(data || [])
    } catch (err) {
      console.error('Error fetching device groups:', err)
      if (!isDemoMode) {
        toast.error('Failed to load device groups')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeviceGroups()
  }, [isDemoMode])

  const addDeviceGroup = async (formData: DeviceGroupFormData) => {
    if (isDemoMode) {
      demoAddDeviceGroup(formData)
      setDeviceGroups(demoGetDeviceGroups())
      toast.success('Device group created successfully!')
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('household_id')
        .eq('id', user.id)
        .single()

      if (userError) throw userError
      if (!userData?.household_id) throw new Error('User not assigned to household')

      const { error } = await supabase.from('device_groups').insert({
        ...formData,
        household_id: userData.household_id,
        created_by: user.id,
      })

      if (error) throw error

      toast.success('Device group created successfully!')
      await fetchDeviceGroups()
    } catch (err) {
      console.error('Error creating device group:', err)
      toast.error('Failed to create device group')
      throw err
    }
  }

  const updateDeviceGroup = async (id: string, formData: DeviceGroupFormData) => {
    if (isDemoMode) {
      demoUpdateDeviceGroup(id, formData)
      setDeviceGroups(demoGetDeviceGroups())
      toast.success('Device group updated successfully!')
      return
    }

    try {
      const { error } = await supabase.from('device_groups').update(formData).eq('id', id)

      if (error) throw error

      toast.success('Device group updated successfully!')
      await fetchDeviceGroups()
    } catch (err) {
      console.error('Error updating device group:', err)
      toast.error('Failed to update device group')
      throw err
    }
  }

  const deleteDeviceGroup = async (id: string) => {
    if (isDemoMode) {
      demoDeleteDeviceGroup(id)
      setDeviceGroups(demoGetDeviceGroups())
      toast.success('Device group deleted successfully!')
      return
    }

    try {
      const { error } = await supabase.from('device_groups').delete().eq('id', id)

      if (error) throw error

      toast.success('Device group deleted successfully!')
      await fetchDeviceGroups()
    } catch (err) {
      console.error('Error deleting device group:', err)
      toast.error('Failed to delete device group')
      throw err
    }
  }

  return {
    deviceGroups,
    loading,
    addDeviceGroup,
    updateDeviceGroup,
    deleteDeviceGroup,
    refreshDeviceGroups: fetchDeviceGroups,
  }
}
