import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../hooks/useAuth'
import { useDemoMode } from '../contexts/DemoContext'
import { useRecurringSchedules } from '../hooks/useRecurringSchedules'
import { useEnergyLogs } from '../hooks/useEnergyLogs'
import { supabase } from '../lib/supabase'
import { addLocalDays, todayLocal } from '../utils/dateUtils'
import { getBackfillDates, summarizeBackfill } from '../utils/householdAccess'

const STORAGE_PREFIX = 'mai-auto-schedules-last-run'
/** Catch up missed auto_create days when the app opens (today inclusive). */
const BACKFILL_LOOKBACK_DAYS = 7

function storageKey(householdId: string) {
  return `${STORAGE_PREFIX}:${householdId}`
}

/**
 * Once per local civil day per household, generate auto_create schedules
 * for today plus a short missed-day backfill window.
 * Complements the midnight server cron as an app-open fallback.
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

        const dates = getBackfillDates(today, BACKFILL_LOOKBACK_DAYS, addLocalDays)
        const daily = []
        for (const date of dates) {
          if (cancelled) return
          const summary = await autoGenerateLogsForDate(date, { silent: true })
          daily.push(summary || { created: 0, replaced: 0, failed: 0 })
        }

        if (cancelled) return

        // Mark complete only after a successful RPC pass (including zero due schedules)
        localStorage.setItem(key, today)

        const totals = summarizeBackfill(daily)
        const createdOrReplaced = totals.created + totals.replaced
        if (createdOrReplaced > 0) {
          toast.success(
            `Auto-created ${createdOrReplaced} schedule log(s) (including up to ${BACKFILL_LOOKBACK_DAYS} missed days)`
          )
          await refreshEnergyLogs()
        }

        if (totals.failed > 0) {
          toast.warning(`${totals.failed} auto-schedule(s) failed to generate`)
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
