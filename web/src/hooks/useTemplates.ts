import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { EnergyLogTemplate, TemplateFormData } from '../types'
import { toast } from 'sonner'

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

      const { error: insertError } = await supabase
        .from('energy_logs')
        .insert({
          household_id: userData.household_id,
          device_id: template.device_id,
          usage_date: usageDate,
          start_time: template.default_start_time,
          end_time: template.default_end_time,
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

  return {
    templates,
    loading,
    error,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    useTemplate,
    refreshTemplates: fetchTemplates
  }
}
