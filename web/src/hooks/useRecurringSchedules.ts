import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { RecurringSchedule, ScheduleFormData } from '../types'
import { toast } from 'sonner'
import { todayLocal } from '../utils/dateUtils'
import {
  getMatchingScheduleDates,
  isDateInSchedule,
  summarizeGenerateResults,
} from '../utils/scheduleDates'
import { useDemoMode } from '../contexts/DemoContext'
import {
  demoGetSchedules,
  demoAddSchedule,
  demoUpdateSchedule,
  demoDeleteSchedule,
  demoGetEnergyLogs,
  demoAddEnergyLog,
  demoDeleteEnergyLog,
} from '../demo/demoStore'

export function useRecurringSchedules() {
  const [schedules, setSchedules] = useState<RecurringSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isDemoMode } = useDemoMode()

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (isDemoMode) {
        setSchedules(demoGetSchedules())
        return
      }

      const { data: schedulesData, error: schedulesError } = await supabase
        .from('recurring_schedules')
        .select(`
          *,
          devices:device_id (
            name,
            wattage
          )
        `)
        .order('created_at', { ascending: false })

      if (schedulesError) throw schedulesError

      const mappedSchedules = (schedulesData || []).map(schedule => ({
        ...schedule,
        device_name: schedule.devices?.name,
        device_wattage: schedule.devices?.wattage
      }))

      setSchedules(mappedSchedules)
    } catch (err) {
      console.error('Error fetching schedules:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch schedules'
      setError(errorMessage)
      if (!isDemoMode) toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [isDemoMode])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  const addSchedule = async (scheduleData: ScheduleFormData) => {
    if (isDemoMode) {
      demoAddSchedule(scheduleData)
      setSchedules(demoGetSchedules())
      toast.success('Recurring schedule created successfully!')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase
        .from('users')
        .select('household_id')
        .eq('id', user.id)
        .single()

      if (!userData?.household_id) throw new Error('No household found')

      const { error: insertError } = await supabase
        .from('recurring_schedules')
        .insert({
          ...scheduleData,
          household_id: userData.household_id,
          created_by: user.id,
          is_active: true
        })

      if (insertError) throw insertError

      await fetchSchedules()
      toast.success('Recurring schedule created successfully!')
    } catch (err) {
      console.error('Error adding schedule:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create schedule'
      toast.error(errorMessage)
      throw err
    }
  }

  const updateSchedule = async (id: string, scheduleData: Partial<ScheduleFormData>) => {
    if (isDemoMode) {
      demoUpdateSchedule(id, scheduleData)
      setSchedules(demoGetSchedules())
      toast.success('Schedule updated successfully!')
      return
    }

    try {
      const { error: updateError } = await supabase
        .from('recurring_schedules')
        .update(scheduleData)
        .eq('id', id)

      if (updateError) throw updateError

      await fetchSchedules()
      toast.success('Schedule updated successfully!')
    } catch (err) {
      console.error('Error updating schedule:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update schedule'
      toast.error(errorMessage)
      throw err
    }
  }

  const toggleScheduleActive = async (id: string, isActive: boolean) => {
    if (isDemoMode) {
      demoUpdateSchedule(id, { is_active: isActive } as Partial<ScheduleFormData> & { is_active?: boolean })
      setSchedules(demoGetSchedules())
      toast.success(`Schedule ${isActive ? 'activated' : 'paused'} successfully!`)
      return
    }

    try {
      const { error: updateError } = await supabase
        .from('recurring_schedules')
        .update({ is_active: isActive })
        .eq('id', id)

      if (updateError) throw updateError

      await fetchSchedules()
      toast.success(`Schedule ${isActive ? 'activated' : 'paused'} successfully!`)
    } catch (err) {
      console.error('Error toggling schedule:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle schedule'
      toast.error(errorMessage)
      throw err
    }
  }

  const deleteSchedule = async (id: string) => {
    if (isDemoMode) {
      demoDeleteSchedule(id)
      setSchedules(demoGetSchedules())
      toast.success('Schedule deleted successfully!')
      return
    }

    try {
      const { error: deleteError } = await supabase
        .from('recurring_schedules')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      await fetchSchedules()
      toast.success('Schedule deleted successfully!')
    } catch (err) {
      console.error('Error deleting schedule:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete schedule'
      toast.error(errorMessage)
      throw err
    }
  }

  const generateLogsFromSchedule = async (scheduleId: string, targetDate: string) => {
    if (isDemoMode) {
      const schedule = demoGetSchedules().find(s => s.id === scheduleId)
      if (!schedule) throw new Error('Schedule not found')

      const check = isDateInSchedule(schedule, targetDate)
      if (!check.ok) throw new Error(check.reason || 'Cannot generate log')

      const existing = demoGetEnergyLogs().find(
        (l) =>
          l.source_type === 'recurring' &&
          l.source_id === scheduleId &&
          l.usage_date === targetDate &&
          !l.deleted_at
      )
      if (existing) throw new Error('Log already exists for this date and schedule')

      demoAddEnergyLog({
        device_id: schedule.device_id,
        usage_date: targetDate,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        assigned_users: schedule.assigned_users,
        source_type: 'recurring',
        source_id: scheduleId,
      })
      toast.success('Log generated from schedule!')
      return { success: true }
    }

    try {
      const { data, error } = await supabase.rpc('generate_recurring_logs', {
        p_schedule_id: scheduleId,
        p_target_date: targetDate
      })

      if (error) throw error

      toast.success('Log generated from schedule!')
      return data
    } catch (err) {
      console.error('Error generating log from schedule:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate log'
      toast.error(errorMessage)
      throw err
    }
  }

  /**
   * Generate auto_create schedules for a local civil date.
   * @param silent When true, only toast real failures (used by app-open runner).
   */
  const autoGenerateLogsForDate = async (
    targetDate: string,
    options: { silent?: boolean } = {}
  ) => {
    const silent = options.silent === true

    if (isDemoMode) {
      const active = demoGetSchedules().filter(s => s.is_active && s.auto_create)
      let created = 0
      for (const schedule of active) {
        const check = isDateInSchedule(schedule, targetDate)
        if (!check.ok) continue

        const existing = demoGetEnergyLogs().find(
          (l) =>
            l.source_type === 'recurring' &&
            l.source_id === schedule.id &&
            l.usage_date === targetDate &&
            !l.deleted_at
        )
        if (existing) continue

        demoAddEnergyLog({
          device_id: schedule.device_id,
          usage_date: targetDate,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          assigned_users: schedule.assigned_users,
          source_type: 'recurring',
          source_id: schedule.id,
        })
        created++
      }
      if (!silent && created > 0) {
        toast.success(`Generated ${created} log(s) from schedules!`)
      }
      return { created, replaced: 0, skipped: 0, failed: 0, results: [] }
    }

    try {
      const { data, error } = await supabase.rpc('auto_generate_recurring_logs', {
        p_target_date: targetDate
      })

      if (error) throw error

      const results = data || []
      const summary = summarizeGenerateResults(results)
      const createdOrReplaced = summary.created + summary.replaced

      if (!silent && createdOrReplaced > 0) {
        toast.success(`Generated ${createdOrReplaced} log(s) from schedules!`)
      }
      if (!silent && summary.failed > 0) {
        toast.warning(`${summary.failed} schedule(s) failed to generate logs`)
      }
      // Expected skips stay silent

      return { ...summary, results }
    } catch (err) {
      console.error('Error auto-generating logs:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to auto-generate logs'
      if (!silent) toast.error(errorMessage)
      throw err
    }
  }

  const bulkGenerateLogsForSchedule = async (
    scheduleId: string,
    replaceExisting: boolean = false
  ) => {
    try {
      const schedule = schedules.find(s => s.id === scheduleId)
      if (!schedule) throw new Error('Schedule not found')

      const endDate = todayLocal()

      if (isDemoMode) {
        const matchingDates = getMatchingScheduleDates(schedule, endDate)
        if (matchingDates.length === 0) {
          toast.info('No matching dates found for this schedule')
          return { success: 0, failed: 0, skipped: 0 }
        }

        let successCount = 0
        let skippedCount = 0
        toast.info(`Generating ${matchingDates.length} log(s)...`)

        for (const date of matchingDates) {
          const existing = demoGetEnergyLogs().find(
            (l) =>
              l.source_type === 'recurring' &&
              l.source_id === scheduleId &&
              l.usage_date === date &&
              !l.deleted_at
          )
          if (existing) {
            if (replaceExisting) demoDeleteEnergyLog(existing.id)
            else {
              skippedCount++
              continue
            }
          }
          demoAddEnergyLog({
            device_id: schedule.device_id,
            usage_date: date,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            assigned_users: schedule.assigned_users,
            source_type: 'recurring',
            source_id: scheduleId,
          })
          successCount++
        }

        if (successCount > 0) toast.success(`✅ Generated ${successCount} log(s) successfully!`)
        if (skippedCount > 0) toast.info(`⏭️ Skipped ${skippedCount} existing log(s)`)
        return { success: successCount, failed: 0, skipped: skippedCount }
      }

      const { data, error } = await supabase.rpc('bulk_generate_recurring_logs', {
        p_schedule_id: scheduleId,
        p_end_date: endDate,
        p_replace_existing: replaceExisting,
      })

      if (error) throw error

      const results = data || []
      if (results.length === 0) {
        toast.info('No matching dates found for this schedule')
        return { success: 0, failed: 0, skipped: 0 }
      }

      const summary = summarizeGenerateResults(results)
      const successCount = summary.created + summary.replaced

      if (successCount > 0) {
        toast.success(`✅ Generated ${successCount} log(s) successfully!`)
      }
      if (summary.skipped > 0) {
        toast.info(`⏭️ Skipped ${summary.skipped} existing log(s)`)
      }
      if (summary.failed > 0) {
        toast.error(`❌ Failed to generate ${summary.failed} log(s)`)
      }

      return {
        success: successCount,
        failed: summary.failed,
        skipped: summary.skipped,
      }
    } catch (err) {
      console.error('Error bulk generating logs:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk generate logs'
      toast.error(errorMessage)
      throw err
    }
  }

  return {
    schedules,
    loading,
    error,
    addSchedule,
    updateSchedule,
    toggleScheduleActive,
    deleteSchedule,
    generateLogsFromSchedule,
    autoGenerateLogsForDate,
    bulkGenerateLogsForSchedule,
    refreshSchedules: fetchSchedules
  }
}

// Re-export helpers used by modal/preview for consistency
export { getMatchingScheduleDates, countMatchingScheduleDays } from '../utils/scheduleDates'
export { formatLocalDate, parseLocalDate } from '../utils/dateUtils'
