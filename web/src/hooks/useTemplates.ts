import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { EnergyLogTemplate, TemplateFormData } from '../types'
import { toast } from 'sonner'
import { calculateUsageCost } from '../utils/rateCalculatorFixed'

export function useTemplates() {
  const [templates, setTemplates] = useState<EnergyLogTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: templatesData, error: templatesError } = await supabase
        .from('energy_log_templates')
        .select(`
          *,
          devices:device_id (
            name,
            wattage
          )
        `)
        .order('created_at', { ascending: false })

      if (templatesError) throw templatesError

      // Map the data to include device info
      const mappedTemplates = (templatesData || []).map(template => ({
        ...template,
        device_name: template.devices?.name,
        device_wattage: template.devices?.wattage
      }))

      setTemplates(mappedTemplates)
    } catch (err) {
      console.error('Error fetching templates:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch templates'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const addTemplate = async (templateData: TemplateFormData) => {
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
        .from('energy_log_templates')
        .insert({
          ...templateData,
          household_id: userData.household_id,
          created_by: user.id
        })

      if (insertError) throw insertError

      await fetchTemplates()
      toast.success('Template created successfully!')
    } catch (err) {
      console.error('Error adding template:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create template'
      toast.error(errorMessage)
      throw err
    }
  }

  const updateTemplate = async (id: string, templateData: Partial<TemplateFormData>) => {
    try {
      const { error: updateError } = await supabase
        .from('energy_log_templates')
        .update(templateData)
        .eq('id', id)

      if (updateError) throw updateError

      await fetchTemplates()
      toast.success('Template updated successfully!')
    } catch (err) {
      console.error('Error updating template:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update template'
      toast.error(errorMessage)
      throw err
    }
  }

  const deleteTemplate = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('energy_log_templates')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      await fetchTemplates()
      toast.success('Template deleted successfully!')
    } catch (err) {
      console.error('Error deleting template:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete template'
      toast.error(errorMessage)
      throw err
    }
  }

  const useTemplate = async (templateId: string, usageDate: string) => {
    try {
      const template = templates.find(t => t.id === templateId)
      if (!template) throw new Error('Template not found')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase
        .from('users')
        .select('household_id')
        .eq('id', user.id)
        .single()

      if (!userData?.household_id) throw new Error('No household found')

      // Calculate cost and rate breakdown
      const device = await supabase
        .from('devices')
        .select('wattage')
        .eq('id', template.device_id)
        .single()
      
      const wattage = device.data?.wattage || 0
      const costCalc = calculateUsageCost(
        wattage,
        template.default_start_time,
        template.default_end_time,
        usageDate
      )

      const { error: insertError } = await supabase
        .from('energy_logs')
        .insert({
          household_id: userData.household_id,
          device_id: template.device_id,
          usage_date: usageDate,
          start_time: template.default_start_time,
          end_time: template.default_end_time,
          total_kwh: costCalc.totalKwh,
          calculated_cost: costCalc.totalCost,
          rate_breakdown: costCalc.breakdown,
          assigned_users: template.assigned_users,
          created_by: user.id,
          source_type: 'template',
          source_id: templateId
        })

      if (insertError) throw insertError

      toast.success('Log created from template!')
      return true
    } catch (err) {
      console.error('Error using template:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create log from template'
      toast.error(errorMessage)
      throw err
    }
  }

  const bulkUseTemplate = async (
    templateId: string,
    startDate: string,
    endDate: string,
    daysOfWeek: number[],
    replaceExisting: boolean = false
  ) => {
    try {
      const template = templates.find(t => t.id === templateId)
      if (!template) throw new Error('Template not found')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase
        .from('users')
        .select('household_id')
        .eq('id', user.id)
        .single()

      if (!userData?.household_id) throw new Error('No household found')

      // Calculate all matching dates
      const start = new Date(startDate)
      const end = new Date(endDate)
      const today = new Date()
      
      // Don't generate logs for future dates
      const actualEndDate = end > today ? today : end

      const matchingDates: string[] = []
      const currentDate = new Date(start)

      while (currentDate <= actualEndDate) {
        const dayOfWeek = currentDate.getDay()
        if (daysOfWeek.includes(dayOfWeek)) {
          matchingDates.push(currentDate.toISOString().split('T')[0])
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }

      if (matchingDates.length === 0) {
        toast.info('No matching dates found for the selected days')
        return { success: 0, failed: 0, skipped: 0 }
      }

      // Generate logs for all matching dates
      let successCount = 0
      let failedCount = 0
      let skippedCount = 0

      toast.info(`Generating ${matchingDates.length} log(s) from template...`)

      for (const date of matchingDates) {
        try {
          // Check if log already exists (with household_id for RLS)
          const { data: existingLog } = await supabase
            .from('energy_logs')
            .select('id')
            .eq('household_id', userData.household_id)
            .eq('device_id', template.device_id)
            .eq('usage_date', date)
            .eq('start_time', template.default_start_time)
            .eq('end_time', template.default_end_time)
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

          // Calculate cost and rate breakdown
          const device = await supabase
            .from('devices')
            .select('wattage')
            .eq('id', template.device_id)
            .single()
          
          const wattage = device.data?.wattage || 0
          const costCalc = calculateUsageCost(
            wattage,
            template.default_start_time,
            template.default_end_time,
            date
          )
          
          console.log('📊 Bulk Template - Cost Calculation:', {
            date,
            wattage,
            time: `${template.default_start_time} - ${template.default_end_time}`,
            totalKwh: costCalc.totalKwh,
            totalCost: costCalc.totalCost,
            breakdown: costCalc.breakdown
          })
          
          // Create the log with calculated values
          const { error: insertError } = await supabase
            .from('energy_logs')
            .insert({
              household_id: userData.household_id,
              device_id: template.device_id,
              usage_date: date,
              start_time: template.default_start_time,
              end_time: template.default_end_time,
              total_kwh: costCalc.totalKwh,
              calculated_cost: costCalc.totalCost,
              rate_breakdown: costCalc.breakdown,
              assigned_users: template.assigned_users,
              created_by: user.id,
              source_type: 'template',
              source_id: templateId
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
        toast.success(`✅ Generated ${successCount} log(s) from template!`)
      }
      if (skippedCount > 0) {
        toast.info(`⏭️ Skipped ${skippedCount} existing log(s)`)
      }
      if (failedCount > 0) {
        toast.error(`❌ Failed to generate ${failedCount} log(s)`)
      }

      return { success: successCount, failed: failedCount, skipped: skippedCount }
    } catch (err) {
      console.error('Error bulk using template:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk generate logs from template'
      toast.error(errorMessage)
      throw err
    }
  }

  return {
    templates,
    loading,
    error,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    useTemplate,
    bulkUseTemplate,
    refreshTemplates: fetchTemplates
  }
}
