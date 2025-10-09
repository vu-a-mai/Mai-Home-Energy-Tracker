import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { EnergyLogTemplate, TemplateFormData } from '../types'
import { toast } from 'sonner'
import { calculateUsageCost } from '../utils/rateCalculatorFixed'

// Helper function to check for overlapping time periods
const checkForOverlap = async (
  deviceId: string,
  date: string,
  startTime: string,
  endTime: string,
  householdId: string
): Promise<any[]> => {
  const { data: existingLogs } = await supabase
    .from('energy_logs')
    .select('id, start_time, end_time, device_id')
    .eq('household_id', householdId)
    .eq('device_id', deviceId)
    .eq('usage_date', date)

  if (!existingLogs || existingLogs.length === 0) return []

  // Check for time overlap: (StartA < EndB) AND (EndA > StartB)
  return existingLogs.filter(log => {
    const existingStart = log.start_time
    const existingEnd = log.end_time
    return (startTime < existingEnd && endTime > existingStart)
  })
}

// Helper to get device IDs from template (handles both old and new format)
const getTemplateDeviceIds = (template: EnergyLogTemplate): string[] => {
  // New multi-device format
  if (template.device_ids && template.device_ids.length > 0) {
    return template.device_ids
  }
  // Old single-device format
  if (template.device_id) {
    return [template.device_id]
  }
  return []
}

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
      const mappedTemplates = await Promise.all((templatesData || []).map(async (template) => {
        // For multi-device templates, fetch all device info
        if (template.device_ids && template.device_ids.length > 0) {
          const { data: devicesData } = await supabase
            .from('devices')
            .select('id, name, wattage')
            .in('id', template.device_ids)
          
          return {
            ...template,
            devices: devicesData || [],
            device_name: devicesData?.map(d => d.name).join(', ') || 'Multiple Devices',
            device_wattage: undefined  // Not applicable for multi-device
          }
        }
        
        // Single device template (legacy)
        return {
          ...template,
          device_name: template.devices?.name,
          device_wattage: template.devices?.wattage
        }
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

      // Prepare template data based on single vs multi-device
      const insertData: any = {
        template_name: templateData.template_name,
        default_start_time: templateData.default_start_time,
        default_end_time: templateData.default_end_time,
        assigned_users: templateData.assigned_users,
        household_id: userData.household_id,
        created_by: user.id
      }

      // Multi-device mode: store in device_ids array
      if (templateData.device_ids && templateData.device_ids.length > 0) {
        insertData.device_ids = templateData.device_ids
        insertData.device_id = null
      } else {
        // Single device mode: store in device_id
        insertData.device_id = templateData.device_id
        insertData.device_ids = []
      }

      const { error: insertError } = await supabase
        .from('energy_log_templates')
        .insert(insertData)

      if (insertError) throw insertError

      await fetchTemplates()
      const deviceCount = insertData.device_ids?.length || 1
      toast.success(`Template created with ${deviceCount} device(s)!`)
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

      // Get device IDs (handles both single and multi-device templates)
      const deviceIds = getTemplateDeviceIds(template)
      if (deviceIds.length === 0) throw new Error('No devices in template')

      let createdCount = 0
      let skippedCount = 0
      let overlapCount = 0

      // Create logs for each device
      for (const deviceId of deviceIds) {
        // Check for exact duplicate
        const { data: existingLog } = await supabase
          .from('energy_logs')
          .select('id')
          .eq('household_id', userData.household_id)
          .eq('device_id', deviceId)
          .eq('usage_date', usageDate)
          .eq('start_time', template.default_start_time)
          .eq('end_time', template.default_end_time)
          .single()

        if (existingLog) {
          skippedCount++
          continue
        }

        // Check for overlaps
        const overlaps = await checkForOverlap(
          deviceId,
          usageDate,
          template.default_start_time,
          template.default_end_time,
          userData.household_id
        )

        if (overlaps.length > 0) {
          overlapCount++
          // Still create the log, but warn user
        }

        // Get device wattage
        const { data: device } = await supabase
          .from('devices')
          .select('wattage, name')
          .eq('id', deviceId)
          .single()
        
        const wattage = device?.wattage || 0
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
            device_id: deviceId,
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

        if (insertError) {
          console.error(`Failed to create log for device ${deviceId}:`, insertError)
          continue
        }

        createdCount++
      }

      // Show summary
      if (createdCount > 0) {
        toast.success(`✅ Created ${createdCount} log(s) from template!`)
      }
      if (skippedCount > 0) {
        toast.info(`⏭️ Skipped ${skippedCount} duplicate(s)`)
      }
      if (overlapCount > 0) {
        toast.warning(`⚠️ ${overlapCount} log(s) may overlap with existing entries`)
      }

      return createdCount > 0
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

      // Get device IDs (handles both single and multi-device templates)
      const deviceIds = getTemplateDeviceIds(template)
      if (deviceIds.length === 0) throw new Error('No devices in template')

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
        return { success: 0, failed: 0, skipped: 0, overlaps: 0 }
      }

      // Generate logs for all matching dates and devices
      let successCount = 0
      let failedCount = 0
      let skippedCount = 0
      let overlapCount = 0

      const totalOperations = matchingDates.length * deviceIds.length
      toast.info(`Generating ${totalOperations} log(s) from template...`)

      for (const date of matchingDates) {
        for (const deviceId of deviceIds) {
          try {
            // Check if log already exists (exact duplicate)
            const { data: existingLog } = await supabase
              .from('energy_logs')
              .select('id')
              .eq('household_id', userData.household_id)
              .eq('device_id', deviceId)
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

            // Check for overlaps (not exact duplicates)
            const overlaps = await checkForOverlap(
              deviceId,
              date,
              template.default_start_time,
              template.default_end_time,
              userData.household_id
            )

            if (overlaps.length > 0) {
              overlapCount++
              // Still create the log, but count the overlap
            }

            // Calculate cost and rate breakdown
            const { data: device } = await supabase
              .from('devices')
              .select('wattage')
              .eq('id', deviceId)
              .single()
            
            const wattage = device?.wattage || 0
            const costCalc = calculateUsageCost(
              wattage,
              template.default_start_time,
              template.default_end_time,
              date
            )
            
            console.log('📊 Bulk Template - Cost Calculation:', {
              date,
              deviceId,
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
                device_id: deviceId,
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
              console.error(`Failed to create log for device ${deviceId} on ${date}:`, insertError)
              failedCount++
            } else {
              successCount++
            }
          } catch (err) {
            console.error(`Error processing device ${deviceId} on ${date}:`, err)
            failedCount++
          }
        }
      }

      // Show results
      if (successCount > 0) {
        toast.success(`✅ Generated ${successCount} log(s) from template!`)
      }
      if (skippedCount > 0) {
        toast.info(`⏭️ Skipped ${skippedCount} existing log(s)`)
      }
      if (overlapCount > 0) {
        toast.warning(`⚠️ ${overlapCount} log(s) may overlap with existing entries`)
      }
      if (failedCount > 0) {
        toast.error(`❌ Failed to generate ${failedCount} log(s)`)
      }

      return { success: successCount, failed: failedCount, skipped: skippedCount, overlaps: overlapCount }
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
