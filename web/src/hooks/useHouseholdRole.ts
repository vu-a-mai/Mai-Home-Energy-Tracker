import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useDemoMode } from '../contexts/DemoContext'
import {
  canEditHousehold,
  isHouseholdOwner,
  type HouseholdRole,
} from '../utils/householdAccess'
import { DEMO_CURRENT_USER_ID, getDemoState } from '../demo/demoStore'

export function useHouseholdRole() {
  const { user } = useAuth()
  const { isDemoMode } = useDemoMode()
  const [role, setRole] = useState<HouseholdRole | null>(null)
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      if (isDemoMode) {
        const demoUser = getDemoState().users.find((u) => u.id === DEMO_CURRENT_USER_ID)
        setRole(((demoUser as { household_role?: HouseholdRole } | undefined)?.household_role) || 'owner')
        setHouseholdId(demoUser?.household_id ?? null)
        return
      }

      if (!user?.id) {
        setRole(null)
        setHouseholdId(null)
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('household_id, household_role')
        .eq('id', user.id)
        .maybeSingle()

      if (error) throw error
      setHouseholdId(data?.household_id ?? null)
      setRole((data?.household_role as HouseholdRole | undefined) || 'editor')
    } catch (err) {
      console.error('Failed to load household role:', err)
      setRole(null)
      setHouseholdId(null)
    } finally {
      setLoading(false)
    }
  }, [isDemoMode, user?.id])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    role,
    householdId,
    loading,
    refresh,
    canEdit: canEditHousehold(role),
    isOwner: isHouseholdOwner(role),
  }
}
