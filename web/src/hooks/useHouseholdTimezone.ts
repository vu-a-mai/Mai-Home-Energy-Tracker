import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useDemoMode } from '../contexts/DemoContext'
import { toast } from 'sonner'

const DEFAULT_TIMEZONE = 'America/Los_Angeles'

export function useHouseholdTimezone() {
  const { user } = useAuth()
  const { isDemoMode } = useDemoMode()
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const browserTimezone =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE
      : DEFAULT_TIMEZONE

  const refresh = useCallback(async () => {
    if (isDemoMode || !user) {
      setTimezone(browserTimezone || DEFAULT_TIMEZONE)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('get_household_timezone')
      if (error) throw error
      setTimezone((data as string) || DEFAULT_TIMEZONE)
    } catch (err) {
      console.error('Failed to load household timezone:', err)
      setTimezone(DEFAULT_TIMEZONE)
    } finally {
      setLoading(false)
    }
  }, [browserTimezone, isDemoMode, user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const saveTimezone = async (nextTimezone: string) => {
    if (isDemoMode) {
      setTimezone(nextTimezone)
      toast.success('Demo timezone updated (local only)')
      return nextTimezone
    }

    try {
      setSaving(true)
      const { data, error } = await supabase.rpc('upsert_household_timezone', {
        p_timezone: nextTimezone,
      })
      if (error) throw error
      const saved = (data as string) || nextTimezone
      setTimezone(saved)
      toast.success(`Household timezone set to ${saved}`)
      return saved
    } catch (err) {
      console.error('Failed to save timezone:', err)
      const message = err instanceof Error ? err.message : 'Failed to save timezone'
      toast.error(message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  return {
    timezone,
    browserTimezone,
    loading,
    saving,
    saveTimezone,
    refresh,
    defaultTimezone: DEFAULT_TIMEZONE,
  }
}
