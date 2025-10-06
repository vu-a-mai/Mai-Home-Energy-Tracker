import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { RecurringSchedule, ScheduleFormData } from '../types'
import { toast } from 'sonner'

export function useRecurringSchedules() {
  const [schedules, setSchedules] = useState<RecurringSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

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

      // Map the data to include device info
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
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  const addSchedule = async (scheduleData: ScheduleFormData) => {
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

  const autoGenerateLogsForDate = async (targetDate: string) => {
    try {
      const { data, error } = await supabase.rpc('auto_generate_recurring_logs', {
        p_target_date: targetDate
      })

      if (error) throw error

      const results = data || []
      const successCount = results.filter((r: any) => r.success).length
      const failCount = results.filter((r: any) => !r.success).length

      if (successCount > 0) {
        toast.success(`Generated ${successCount} log(s) from schedules!`)
      }
      if (failCount > 0) {
        toast.warning(`${failCount} schedule(s) failed to generate logs`)
      }

      return results
    } catch (err) {
      console.error('Error auto-generating logs:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to auto-generate logs'
      toast.error(errorMessage)
      throw err
    }
  }

  const bulkGenerateLogsForSchedule = async (scheduleId: string, replaceExisting: boolean = false) => {
    try {
      const schedule = schedules.find(s => s.id === scheduleId)
      if (!schedule) throw new Error('Schedule not found')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase
        .from('users')
        .select('household_id')
        .eq('id', user.id)
        .single()

      if (!userData?.household_id) throw new Error('No household found')

      // Calculate all matching dates
      const startDate = new Date(schedule.schedule_start_date)
      const endDate = schedule.schedule_end_date ? new Date(schedule.schedule_end_date) : new Date()
      const today = new Date()
      
      // Don't generate logs for future dates
      const actualEndDate = endDate > today ? today : endDate

      const matchingDates: string[] = []
      const currentDate = new Date(startDate)

      while (currentDate <= actualEndDate) {
        const dayOfWeek = currentDate.getDay()
        if (schedule.days_of_week.includes(dayOfWeek)) {
          matchingDates.push(currentDate.toISOString().split('T')[0])
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }

      if (matchingDates.length === 0) {
        toast.info('No matching dates found for this schedule')
        return { success: 0, failed: 0, skipped: 0 }
      }

      // Generate logs for all matching dates
      let successCount = 0
      let failedCount = 0
      let skippedCount = 0

      toast.info(`Generating ${matchingDates.length} log(s)...`)

      for (const date of matchingDates) {
        try {
          // Check if log already exists
          const { data: existingLog } = await supabase
            .from('energy_logs')
            .select('id')
            .eq('source_type', 'recurring')
            .eq('source_id', scheduleId)
            .eq('usage_date', date)
            .single()

          if (existingLog) {
            if (replaceExisting) {
              // Delete existing log first
              const { error: deleteError } = await supabase
                .from('energy_logs')
                .delete()
                .eq('id', existingLog.id)

              if (deleteError) {
                console.error(`Failed to delete existing log for ${date}:`, deleteError)
                failedCount++
                continue
              }
            } else {
              // Skip if not replacing
              skippedCount++
              continue
            }
          }

          // Create the log
          const { error: insertError } = await supabase
            .from('energy_logs')
            .insert({
              household_id: userData.household_id,
              device_id: schedule.device_id,
              usage_date: date,
              start_time: schedule.start_time,
              end_time: schedule.end_time,
              assigned_users: schedule.assigned_users,
              created_by: user.id,
              source_type: 'recurring',
              source_id: scheduleId
            })

          if (insertError) {
            console.error(`Failed to create log for ${date}:`, insertError)
            failedCount++
          } else {
            successCount++
          }
        } catch (err) {
          console.error(`Error processing date ${date}:`, err)
          failedCount++
        }
      }

      // Show results
      if (successCount > 0) {
        toast.success(`✅ Generated ${successCount} log(s) successfully!`)
      }
      if (skippedCount > 0) {
        toast.info(`⏭️ Skipped ${skippedCount} existing log(s)`)
      }
      if (failedCount > 0) {
        toast.error(`❌ Failed to generate ${failedCount} log(s)`)
      }

      return { success: successCount, failed: failedCount, skipped: skippedCount }
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
