import { useState, useEffect } from 'react'
import { useTemplates } from '../hooks/useTemplates'
import { useDevices } from '../hooks/useDevices'
import { useHouseholdUsers } from '../hooks/useHouseholdUsers'
import { useDeviceGroups } from '../hooks/useDeviceGroups'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Card, CardContent } from './ui/Card'
import { MultiDeviceSelector } from './MultiDeviceSelector'
import { SaveGroupModal } from './SaveGroupModal'
import type { TemplateFormData } from '../types'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import {
  XMarkIcon,
  ClockIcon,
  BoltIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  DocumentDuplicateIcon,
  UserIcon,
  ChevronDownIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

interface TemplatesModalProps {
  isOpen: boolean
  onClose: () => void
  onUseTemplate?: (templateId: string) => void
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun', fullLabel: 'Sunday' },
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' }
]

export function TemplatesModal({ isOpen, onClose, onUseTemplate }: TemplatesModalProps) {
  const { templates, loading, addTemplate, updateTemplate, deleteTemplate, useTemplate, bulkUseTemplate } = useTemplates()
  const { devices } = useDevices()
  const { users: householdUsers } = useHouseholdUsers()
  const { deviceGroups, addDeviceGroup } = useDeviceGroups()
  
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [useMultiDevice, setUseMultiDevice] = useState(false)
  const [showSaveGroupModal, setShowSaveGroupModal] = useState(false)
  const [pendingGroupDevices, setPendingGroupDevices] = useState<string[]>([])
  const [showUseTemplateModal, setShowUseTemplateModal] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [useDateRange, setUseDateRange] = useState(false)
  const [useTemplateData, setUseTemplateData] = useState({
    singleDate: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6] as number[],
    replaceExisting: false
  })
  const [existingLogsPreview, setExistingLogsPreview] = useState<any[]>([])
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [formData, setFormData] = useState<TemplateFormData>({
    template_name: '',
    device_id: '',
    device_ids: [],
    default_start_time: '',
    default_end_time: '',
    assigned_users: []
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate device selection
    if (useMultiDevice) {
      if (!formData.device_ids || formData.device_ids.length === 0) {
        toast.error('Please select at least one device')
        return
      }
      
      // Create multiple templates (one per device)
      try {
        const today = new Date().toISOString().split('T')[0]
        for (const deviceId of formData.device_ids) {
          const device = devices.find(d => d.id === deviceId)
          const templateData = {
            template_name: formData.device_ids.length > 1 
              ? `${formData.template_name} - ${device?.name}`
              : formData.template_name,
            device_id: deviceId,
            default_start_time: formData.default_start_time,
            default_end_time: formData.default_end_time,
            assigned_users: formData.assigned_users
          }
          
          if (editingId && formData.device_ids.length === 1) {
            await updateTemplate(editingId, templateData)
          } else {
            await addTemplate(templateData)
          }
        }
        toast.success(`${formData.device_ids.length} template(s) created successfully!`)
        resetForm()
      } catch (err) {
        // Error handled in hook
      }
    } else {
      // Single device mode
      try {
        if (editingId) {
          await updateTemplate(editingId, formData)
        } else {
          await addTemplate(formData)
        }
        resetForm()
      } catch (err) {
        // Error handled in hook
      }
    }
  }

  const resetForm = () => {
    setFormData({
      template_name: '',
      device_id: '',
      device_ids: [],
      default_start_time: '',
      default_end_time: '',
      assigned_users: []
    })
    setShowForm(false)
    setEditingId(null)
    setUseMultiDevice(false)
  }

  const handleEdit = (template: typeof templates[0]) => {
    setFormData({
      template_name: template.template_name,
      device_id: template.device_id,
      device_ids: [template.device_id],
      default_start_time: template.default_start_time,
      default_end_time: template.default_end_time,
      assigned_users: template.assigned_users
    })
    setEditingId(template.id)
    setUseMultiDevice(false)
    setShowForm(true)
  }

  const handleUseTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId)
    setShowUseTemplateModal(true)
  }

  const confirmUseTemplate = async () => {
    if (!selectedTemplateId) return

    try {
      if (useDateRange) {
        await bulkUseTemplate(
          selectedTemplateId,
          useTemplateData.startDate,
          useTemplateData.endDate,
          useTemplateData.daysOfWeek,
          useTemplateData.replaceExisting
        )
      } else {
        await useTemplate(selectedTemplateId, useTemplateData.singleDate)
      }
      
      setShowUseTemplateModal(false)
      setSelectedTemplateId(null)
      setUseDateRange(false)
      setUseTemplateData({
        singleDate: new Date().toISOString().split('T')[0],
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        replaceExisting: false
      })
      
      if (onUseTemplate) {
        onUseTemplate(selectedTemplateId)
      }
    } catch (err) {
      // Error handled in hook
    }
  }

  const toggleDay = (day: number) => {
    setUseTemplateData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day].sort((a, b) => a - b)
    }))
  }

  const calculateMatchingDays = () => {
    if (!useDateRange || !selectedTemplateId) return 0
    
    const startDate = new Date(useTemplateData.startDate)
    const endDate = new Date(useTemplateData.endDate)
    const today = new Date()
    const actualEndDate = endDate > today ? today : endDate
    
    let count = 0
    const currentDate = new Date(startDate)
    
    while (currentDate <= actualEndDate) {
      const dayOfWeek = currentDate.getDay()
      if (useTemplateData.daysOfWeek.includes(dayOfWeek)) {
        count++
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return count
  }

  const fetchExistingLogsPreview = async () => {
    if (!useTemplateData.replaceExisting || !useDateRange || !selectedTemplateId) {
      setExistingLogsPreview([])
      return
    }
    
    const template = templates.find(t => t.id === selectedTemplateId)
    if (!template) return
    
    setLoadingPreview(true)
    try {
      // Calculate matching dates
      const startDate = new Date(useTemplateData.startDate)
      const endDate = new Date(useTemplateData.endDate)
      const today = new Date()
      const actualEndDate = endDate > today ? today : endDate
      
      const matchingDates: string[] = []
      const currentDate = new Date(startDate)
      
      while (currentDate <= actualEndDate) {
        const dayOfWeek = currentDate.getDay()
        if (useTemplateData.daysOfWeek.includes(dayOfWeek)) {
          matchingDates.push(currentDate.toISOString().split('T')[0])
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      if (matchingDates.length === 0) {
        setExistingLogsPreview([])
        return
      }
      
      // Query existing logs
      const { data, error } = await supabase
        .from('energy_logs')
        .select('usage_date, start_time, end_time')
        .eq('device_id', template.device_id)
        .in('usage_date', matchingDates)
        .eq('start_time', template.default_start_time)
        .eq('end_time', template.default_end_time)
        .order('usage_date', { ascending: true })
      
      if (error) throw error
      
      setExistingLogsPreview(data || [])
    } catch (err) {
      console.error('Error fetching preview:', err)
      setExistingLogsPreview([])
    } finally {
      setLoadingPreview(false)
    }
  }

  // Fetch preview when replace mode is enabled
  useEffect(() => {
    if (useTemplateData.replaceExisting && useDateRange && selectedTemplateId) {
      fetchExistingLogsPreview()
    } else {
      setExistingLogsPreview([])
      setShowPreview(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useTemplateData.replaceExisting, useTemplateData.startDate, useTemplateData.endDate, useTemplateData.daysOfWeek, useDateRange, selectedTemplateId])

  // Early return after all hooks
  if (!isOpen) return null

  const toggleUserAssignment = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      assigned_users: prev.assigned_users.includes(userId)
        ? prev.assigned_users.filter(id => id !== userId)
        : [...prev.assigned_users, userId]
    }))
  }

  const handleSaveAsGroup = (deviceIds: string[]) => {
    setPendingGroupDevices(deviceIds)
    setShowSaveGroupModal(true)
  }

  const handleConfirmSaveGroup = async (groupName: string) => {
    try {
      await addDeviceGroup({
        group_name: groupName,
        device_ids: pendingGroupDevices
      })
      setPendingGroupDevices([])
    } catch (err) {
      // Error handled in hook
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto">
      <div className="w-full sm:max-w-4xl min-h-screen sm:min-h-0 sm:my-8">
        <div className="energy-card w-full bg-card border-0 sm:border border-border rounded-none sm:rounded-lg shadow-xl min-h-screen sm:min-h-0">
          {/* Header */}
          <div className="p-4 sm:p-5 md:p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <DocumentDuplicateIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-blue-400 flex-shrink-0" />
              <span className="truncate">Energy Log Templates</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
              Save and reuse common usage patterns
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 h-9 w-9 sm:h-10 sm:w-10 border border-border rounded hover:bg-muted flex-shrink-0"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
          {!showForm ? (
            <>
              {/* Add Template Button */}
              <Button
                onClick={() => setShowForm(true)}
                className="w-full mb-3 sm:mb-4 energy-action-btn py-2.5 sm:py-2 text-sm sm:text-base"
              >
                <PlusIcon className="w-5 h-5 inline-block mr-2" />
                Create New Template
              </Button>

              {/* Templates List */}
              {loading ? (
                <div className="text-center py-6 sm:py-8 text-sm sm:text-base text-muted-foreground">Loading templates...</div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <DocumentDuplicateIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-50" />
                  <p className="text-sm sm:text-base text-muted-foreground">No templates yet. Create your first one!</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {templates.map(template => (
                    <Card key={template.id} className="energy-card hover:border-primary/50 transition-all">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm sm:text-base text-foreground mb-1 truncate">{template.template_name}</h3>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <BoltIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400 flex-shrink-0" />
                                <span className="truncate">{template.device_name} ({template.device_wattage}W)</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <ClockIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                                <span className="whitespace-nowrap">{template.default_start_time} - {template.default_end_time}</span>
                              </span>
                            </div>
                            {template.assigned_users.length > 0 && (
                              <div className="flex items-center gap-1.5 sm:gap-2 mt-2">
                                <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 flex-shrink-0" />
                                <div className="flex flex-wrap gap-1">
                                  {template.assigned_users.map(userId => {
                                    const user = householdUsers.find(u => u.id === userId)
                                    return user ? (
                                      <span key={userId} className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                                        {user.name}
                                      </span>
                                    ) : null
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap sm:flex-nowrap gap-1.5 sm:gap-2 w-full sm:w-auto">
                            <Button
                              onClick={() => handleUseTemplate(template.id)}
                              variant="outline"
                              size="sm"
                              className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border-green-300 text-green-500 hover:bg-green-500/10"
                            >
                              <CheckIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                              <span className="hidden sm:inline">Use</span>
                              <span className="sm:hidden">Use</span>
                            </Button>
                            <Button
                              onClick={() => handleEdit(template)}
                              variant="outline"
                              size="sm"
                              className="p-1.5 sm:p-2 border-blue-300 text-blue-500 hover:bg-blue-500/10"
                            >
                              <PencilIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              onClick={() => deleteTemplate(template.id)}
                              variant="outline"
                              size="sm"
                              className="p-1.5 sm:p-2 border-red-300 text-red-500 hover:bg-red-500/10"
                            >
                              <TrashIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Template Form */
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-foreground">
                  Template Name *
                </label>
                <Input
                  type="text"
                  value={formData.template_name}
                  onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                  placeholder="e.g., Morning Coffee Maker"
                  className="text-sm sm:text-base"
                  required
                />
              </div>

              {/* Device Selection Mode Toggle */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useMultiDevice}
                    onChange={(e) => {
                      setUseMultiDevice(e.target.checked)
                      if (e.target.checked) {
                        setFormData({ ...formData, device_ids: formData.device_id ? [formData.device_id] : [] })
                      } else {
                        setFormData({ ...formData, device_id: formData.device_ids?.[0] || '' })
                      }
                    }}
                    className="w-4 h-4"
                    disabled={!!editingId}
                  />
                  <span className="text-sm font-bold text-blue-300">
                    Multi-Device Mode
                  </span>
                </label>
                <span className="text-xs text-blue-200 break-words">
                  {useMultiDevice ? '✓ Select multiple devices at once (creates separate template for each)' : '○ Single device only'}
                </span>
              </div>

              {/* Device Selection */}
              <div>
                <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-foreground">
                  Device{useMultiDevice ? 's' : ''} *
                </label>
                {useMultiDevice ? (
                  <MultiDeviceSelector
                    devices={devices}
                    selectedDeviceIds={formData.device_ids || []}
                    onSelectionChange={(ids) => setFormData({ ...formData, device_ids: ids })}
                    deviceGroups={deviceGroups}
                    onSaveAsGroup={handleSaveAsGroup}
                  />
                ) : (
                  <select
                    value={formData.device_id}
                    onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                    className="w-full p-2.5 sm:p-3 text-sm sm:text-base border rounded-lg bg-background text-foreground border-border"
                    required
                  >
                    <option value="">Select a device</option>
                    {devices.map(device => (
                      <option key={device.id} value={device.id}>
                        {device.name} ({device.wattage}W)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-foreground">
                    Start Time *
                  </label>
                  <Input
                    type="time"
                    value={formData.default_start_time}
                    onChange={(e) => setFormData({ ...formData, default_start_time: e.target.value })}
                    className="text-sm sm:text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-foreground">
                    End Time *
                  </label>
                  <Input
                    type="time"
                    value={formData.default_end_time}
                    onChange={(e) => setFormData({ ...formData, default_end_time: e.target.value })}
                    className="text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              {householdUsers.length > 0 && (
                <div>
                  <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-foreground">
                    Assign to Users (optional)
                  </label>
                  <div className="bg-muted/50 p-2 sm:p-3 rounded-lg border border-border">
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {householdUsers.map(user => (
                        <label key={user.id} className={`flex items-center cursor-pointer px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded border transition-colors ${
                          formData.assigned_users.includes(user.id) 
                            ? 'bg-blue-100 border-blue-300 text-blue-800' 
                            : 'bg-background border-border hover:bg-muted/30'
                        }`}>
                          <input
                            type="checkbox"
                            checked={formData.assigned_users.includes(user.id)}
                            onChange={() => toggleUserAssignment(user.id)}
                            className="mr-2"
                          />
                          <span className="text-sm">{user.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 sticky bottom-0 sm:static bg-card pb-2 sm:pb-0 -mx-4 sm:mx-0 px-4 sm:px-0 border-t sm:border-t-0 border-border">
                <Button
                  type="button"
                  onClick={resetForm}
                  variant="outline"
                  className="flex-1 py-2.5 sm:py-2 text-sm sm:text-base"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 energy-action-btn py-2.5 sm:py-2 text-sm sm:text-base"
                >
                  {editingId ? 'Update Template' : 'Create Template'}
                </Button>
              </div>
            </form>
          )}
          </div>
        </div>
      </div>

      {/* Save Group Modal */}
      <SaveGroupModal
        isOpen={showSaveGroupModal}
        onClose={() => setShowSaveGroupModal(false)}
        onSave={handleConfirmSaveGroup}
        deviceCount={pendingGroupDevices.length}
      />

      {/* Use Template Modal */}
      {showUseTemplateModal && selectedTemplateId && (() => {
        const template = templates.find(t => t.id === selectedTemplateId)
        if (!template) return null
        
        const matchingDays = calculateMatchingDays()
        
        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="energy-card bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-blue-500/50 rounded-2xl shadow-2xl shadow-blue-500/20 max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
              <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <DocumentDuplicateIcon className="w-7 h-7 text-blue-400" />
                </div>
                Use Template
              </h3>
              
              <p className="text-slate-300 mb-6 text-sm">
                Create energy log(s) from: <span className="font-bold text-blue-400">{template.template_name}</span>
              </p>
              
              <div className="space-y-4 mb-6">
                {/* Mode Selection */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setUseDateRange(false)}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      !useDateRange
                        ? 'bg-blue-500/20 border-blue-400 shadow-lg shadow-blue-500/30'
                        : 'bg-slate-800/50 border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">📅</div>
                      <div className={`font-bold ${!useDateRange ? 'text-blue-400' : 'text-slate-400'}`}>
                        Single Date
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Quick log for one day</div>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setUseDateRange(true)}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      useDateRange
                        ? 'bg-purple-500/20 border-purple-400 shadow-lg shadow-purple-500/30'
                        : 'bg-slate-800/50 border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">📆</div>
                      <div className={`font-bold ${useDateRange ? 'text-purple-400' : 'text-slate-400'}`}>
                        Date Range
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Bulk generate logs</div>
                    </div>
                  </button>
                </div>

                {/* Single Date Mode */}
                {!useDateRange && (
                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 p-5 rounded-xl">
                    <label className="block mb-2 text-sm font-semibold text-slate-300">
                      Select Date
                    </label>
                    <Input
                      type="date"
                      value={useTemplateData.singleDate}
                      onChange={(e) => setUseTemplateData({ ...useTemplateData, singleDate: e.target.value })}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Date Range Mode */}
                {useDateRange && (
                  <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 p-5 rounded-xl space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-300">
                          Start Date
                        </label>
                        <Input
                          type="date"
                          value={useTemplateData.startDate}
                          onChange={(e) => setUseTemplateData({ ...useTemplateData, startDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-300">
                          End Date
                        </label>
                        <Input
                          type="date"
                          value={useTemplateData.endDate}
                          onChange={(e) => setUseTemplateData({ ...useTemplateData, endDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-semibold text-slate-300">
                        Select Days
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {DAYS_OF_WEEK.map(day => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleDay(day.value)}
                            className={`px-3 py-2 rounded-lg border-2 transition-all font-bold text-sm ${
                              useTemplateData.daysOfWeek.includes(day.value)
                                ? 'bg-cyan-500 border-cyan-400 text-white shadow-lg shadow-cyan-500/50'
                                : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setUseTemplateData({ ...useTemplateData, daysOfWeek: [1, 2, 3, 4, 5] })}
                          className="px-3 py-1.5 text-xs font-semibold bg-blue-500/20 border border-blue-500/40 text-blue-300 rounded-md hover:bg-blue-500/30"
                        >
                          📅 Weekdays
                        </button>
                        <button
                          type="button"
                          onClick={() => setUseTemplateData({ ...useTemplateData, daysOfWeek: [0, 6] })}
                          className="px-3 py-1.5 text-xs font-semibold bg-purple-500/20 border border-purple-500/40 text-purple-300 rounded-md hover:bg-purple-500/30"
                        >
                          🎉 Weekends
                        </button>
                        <button
                          type="button"
                          onClick={() => setUseTemplateData({ ...useTemplateData, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] })}
                          className="px-3 py-1.5 text-xs font-semibold bg-green-500/20 border border-green-500/40 text-green-300 rounded-md hover:bg-green-500/30"
                        >
                          🌟 Every Day
                        </button>
                      </div>
                    </div>

                    {matchingDays > 0 && (
                      <div className="bg-purple-500/20 border border-purple-500/40 p-3 rounded-lg">
                        <div className="text-center">
                          <div className="text-sm text-slate-300 mb-1">Total Logs to Create</div>
                          <div className="text-3xl font-bold text-purple-400">{matchingDays}</div>
                        </div>
                      </div>
                    )}

                    {/* Replace Mode Checkbox */}
                    <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={useTemplateData.replaceExisting}
                          onChange={(e) => setUseTemplateData({ ...useTemplateData, replaceExisting: e.target.checked })}
                          className="mt-0.5 w-4 h-4 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-bold text-yellow-300 group-hover:text-yellow-200 transition-colors">
                            Replace existing logs
                          </div>
                          <div className="text-xs text-yellow-400 mt-1">
                            ⚠️ This will delete and recreate any logs that already exist for these dates
                          </div>
                        </div>
                      </label>

                      {/* Preview of existing logs */}
                      {useTemplateData.replaceExisting && (
                        <div className="mt-3">
                          {loadingPreview ? (
                            <div className="text-xs text-yellow-300 flex items-center gap-2">
                              <div className="animate-spin">⏳</div>
                              <span>Checking for existing logs...</span>
                            </div>
                          ) : existingLogsPreview.length > 0 ? (
                            <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg">
                              <button
                                type="button"
                                onClick={() => setShowPreview(!showPreview)}
                                className="flex items-center justify-between w-full text-sm font-semibold text-red-300 hover:text-red-200 transition-colors"
                              >
                                <span className="flex items-center gap-2">
                                  🔄 {existingLogsPreview.length} existing log(s) will be replaced
                                </span>
                                <ChevronDownIcon className={`w-4 h-4 transition-transform ${showPreview ? 'rotate-180' : ''}`} />
                              </button>
                              
                              {showPreview && (
                                <div className="mt-3 space-y-1 max-h-40 overflow-y-auto">
                                  {existingLogsPreview.map((log, idx) => (
                                    <div key={idx} className="text-xs text-red-200 flex items-center gap-2 py-1">
                                      <CalendarIcon className="w-3 h-3 flex-shrink-0" />
                                      <span>{new Date(log.usage_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                      <span>•</span>
                                      <span>{log.start_time} - {log.end_time}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-green-300 flex items-center gap-2">
                              <span>✓</span>
                              <span>No existing logs found - all will be new</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Template Info */}
                <div className="bg-slate-800/50 border border-slate-600 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Device:</span>
                    <span className="font-semibold text-orange-400">{template.device_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Time:</span>
                    <span className="font-semibold text-cyan-400">
                      {template.default_start_time} - {template.default_end_time}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowUseTemplateModal(false)
                    setSelectedTemplateId(null)
                    setUseDateRange(false)
                  }}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmUseTemplate}
                  className={`flex-1 font-bold shadow-lg ${
                    useDateRange
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-purple-500/30'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/30'
                  } text-white`}
                >
                  {useDateRange ? `✨ Generate ${matchingDays} Logs` : '✓ Create Log'}
                </Button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
