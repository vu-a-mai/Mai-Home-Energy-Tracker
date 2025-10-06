import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { DeviceGroup, DeviceGroupFormData } from '../types'
import { toast } from 'sonner'

export function useDeviceGroups() {
  const [deviceGroups, setDeviceGroups] = useState<DeviceGroup[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDeviceGroups = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('device_groups')
        .select('*')
        .order('group_name')

      if (error) throw error
      setDeviceGroups(data || [])
    } catch (err) {
      console.error('Error fetching device groups:', err)
      toast.error('Failed to load device groups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeviceGroups()
  }, [])

  const addDeviceGroup = async (formData: DeviceGroupFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get user's household_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('household_id')
        .eq('id', user.id)
        .single()

      if (userError) throw userError
      if (!userData?.household_id) throw new Error('User not assigned to household')

      const { error } = await supabase
        .from('device_groups')
        .insert({
          ...formData,
          household_id: userData.household_id,
          created_by: user.id
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
    try {
      const { error } = await supabase
        .from('device_groups')
        .update(formData)
        .eq('id', id)

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
    try {
      const { error } = await supabase
        .from('device_groups')
        .delete()
        .eq('id', id)

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
    refreshDeviceGroups: fetchDeviceGroups
  }
}
