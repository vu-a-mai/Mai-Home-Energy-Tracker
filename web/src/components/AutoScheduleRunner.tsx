import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../hooks/useAuth'
import { useDemoMode } from '../contexts/DemoContext'
import { useRecurringSchedules } from '../hooks/useRecurringSchedules'
import { useEnergyLogs } from '../hooks/useEnergyLogs'
import { supabase } from '../lib/supabase'
import { todayLocal } from '../utils/dateUtils'

const STORAGE_PREFIX = 'mai-auto-schedules-last-run'

function storageKey(householdId: string) {
  return `${STORAGE_PREFIX}:${householdId}`
}

/**
 * Once per local civil day per household, generate auto_create schedules
 * for today. Complements the midnight server cron as an app-open fallback.
 */
export function AutoScheduleRunner() {
  const { user } = useAuth()
  const { isDemoMode } = useDemoMode()
  const { autoGenerateLogsForDate } = useRecurringSchedules()
  const { refreshEnergyLogs } = useEnergyLogs()
  const runningRef = useRef(false)

  useEffect(() => {
    if (isDemoMode || !user?.id) return

    let cancelled = false

    const run = async () => {
      if (runningRef.current) return
      runningRef.current = true

      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('household_id')
          .eq('id', user.id)
          .maybeSingle()

        if (userError) throw userError
        const householdId = userData?.household_id
        if (!householdId || cancelled) return

        const today = todayLocal()
        const key = storageKey(householdId)
        if (localStorage.getItem(key) === today) return

        const summary = await autoGenerateLogsForDate(today, { silent: true })
        if (cancelled) return

        // Mark complete only after a successful RPC (including zero due schedules)
        localStorage.setItem(key, today)

        const createdOrReplaced = (summary?.created ?? 0) + (summary?.replaced ?? 0)
        if (createdOrReplaced > 0) {
          toast.success(`Auto-created ${createdOrReplaced} schedule log(s) for today`)
          await refreshEnergyLogs()
        }

        if ((summary?.failed ?? 0) > 0) {
          toast.warning(`${summary.failed} auto-schedule(s) failed to generate`)
        }
      } catch (err) {
        // Leave storage unset so the next visit retries
        console.error('Auto-schedule runner failed:', err)
      } finally {
        runningRef.current = false
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [autoGenerateLogsForDate, isDemoMode, refreshEnergyLogs, user?.id])

  return null
}
