import { useState } from 'react'
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
import {
  XMarkIcon,
  ClockIcon,
  BoltIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  DocumentDuplicateIcon,
  UserIcon
} from '@heroicons/react/24/outline'

interface TemplatesModalProps {
  isOpen: boolean
  onClose: () => void
  onUseTemplate?: (templateId: string) => void
}

export function TemplatesModal({ isOpen, onClose, onUseTemplate }: TemplatesModalProps) {
  const { templates, loading, addTemplate, updateTemplate, deleteTemplate, useTemplate } = useTemplates()
  const { devices } = useDevices()
  const { users: householdUsers } = useHouseholdUsers()
  const { deviceGroups, addDeviceGroup } = useDeviceGroups()
  
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [useMultiDevice, setUseMultiDevice] = useState(false)
  const [showSaveGroupModal, setShowSaveGroupModal] = useState(false)
  const [pendingGroupDevices, setPendingGroupDevices] = useState<string[]>([])
  const [formData, setFormData] = useState<TemplateFormData>({
    template_name: '',
    device_id: '',
    device_ids: [],
    default_start_time: '',
    default_end_time: '',
    assigned_users: []
  })

  if (!isOpen) return null

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

  const handleUseTemplate = async (templateId: string) => {
    const today = new Date().toISOString().split('T')[0]
    await useTemplate(templateId, today)
    if (onUseTemplate) {
      onUseTemplate(templateId)
    }
  }

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-4xl my-8">
        <div className="energy-card w-full bg-card border border-border rounded-lg shadow-xl">
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <DocumentDuplicateIcon className="w-7 h-7 text-blue-400" />
              Energy Log Templates
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Save and reuse common usage patterns
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 h-10 w-10 border border-border rounded hover:bg-muted"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!showForm ? (
            <>
              {/* Add Template Button */}
              <Button
                onClick={() => setShowForm(true)}
                className="w-full mb-4 energy-action-btn"
              >
                <PlusIcon className="w-5 h-5 inline-block mr-2" />
                Create New Template
              </Button>

              {/* Templates List */}
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading templates...</div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentDuplicateIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No templates yet. Create your first one!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map(template => (
                    <Card key={template.id} className="energy-card hover:border-primary/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-foreground mb-1">{template.template_name}</h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <BoltIcon className="w-4 h-4 text-orange-400" />
                                {template.device_name} ({template.device_wattage}W)
                              </span>
                              <span className="flex items-center gap-1">
                                <ClockIcon className="w-4 h-4 text-blue-400" />
                                {template.default_start_time} - {template.default_end_time}
                              </span>
                            </div>
                            {template.assigned_users.length > 0 && (
                              <div className="flex items-center gap-2 mt-2">
                                <UserIcon className="w-4 h-4 text-cyan-400" />
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
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleUseTemplate(template.id)}
                              variant="outline"
                              size="sm"
                              className="px-3 py-2 border-green-300 text-green-500 hover:bg-green-500/10"
                            >
                              <CheckIcon className="w-4 h-4 mr-1" />
                              Use
                            </Button>
                            <Button
                              onClick={() => handleEdit(template)}
                              variant="outline"
                              size="sm"
                              className="p-2 border-blue-300 text-blue-500 hover:bg-blue-500/10"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => deleteTemplate(template.id)}
                              variant="outline"
                              size="sm"
                              className="p-2 border-red-300 text-red-500 hover:bg-red-500/10"
                            >
                              <TrashIcon className="w-4 h-4" />
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-semibold text-foreground">
                  Template Name *
                </label>
                <Input
                  type="text"
                  value={formData.template_name}
                  onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                  placeholder="e.g., Morning Coffee Maker"
                  required
                />
              </div>

              {/* Device Selection Mode Toggle */}
              <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
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
                <span className="text-xs text-blue-200">
                  {useMultiDevice ? '✓ Select multiple devices at once (creates separate template for each)' : '○ Single device only'}
                </span>
              </div>

              {/* Device Selection */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-foreground">
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
                    className="w-full p-3 border rounded-lg bg-background text-foreground border-border"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-foreground">
                    Start Time *
                  </label>
                  <Input
                    type="time"
                    value={formData.default_start_time}
                    onChange={(e) => setFormData({ ...formData, default_start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold text-foreground">
                    End Time *
                  </label>
                  <Input
                    type="time"
                    value={formData.default_end_time}
                    onChange={(e) => setFormData({ ...formData, default_end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              {householdUsers.length > 0 && (
                <div>
                  <label className="block mb-2 text-sm font-semibold text-foreground">
                    Assign to Users (optional)
                  </label>
                  <div className="bg-muted/50 p-3 rounded-lg border border-border">
                    <div className="flex flex-wrap gap-2">
                      {householdUsers.map(user => (
                        <label key={user.id} className={`flex items-center cursor-pointer px-3 py-1.5 rounded border transition-colors ${
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

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={resetForm}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 energy-action-btn"
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
    </div>
  )
}
