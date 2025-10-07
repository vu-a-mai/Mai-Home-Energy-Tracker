import { useState, useEffect } from 'react'
import { useRecurringSchedules } from '../hooks/useRecurringSchedules'
import { useDevices } from '../hooks/useDevices'
import { useHouseholdUsers } from '../hooks/useHouseholdUsers'
import { useDeviceGroups } from '../hooks/useDeviceGroups'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Card, CardContent } from './ui/Card'
import { MultiDeviceSelector } from './MultiDeviceSelector'
import { SaveGroupModal } from './SaveGroupModal'
import type { ScheduleFormData } from '../types'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import {
  XMarkIcon,
  ClockIcon,
  BoltIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ArrowPathIcon,
  PlayIcon,
  PauseIcon,
  UserIcon,
  ChevronDownIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline'

interface RecurringSchedulesModalProps {
  isOpen: boolean
  onClose: () => void
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

export function RecurringSchedulesModal({ isOpen, onClose }: RecurringSchedulesModalProps) {
  const { schedules, loading, addSchedule, updateSchedule, toggleScheduleActive, deleteSchedule, generateLogsFromSchedule, bulkGenerateLogsForSchedule } = useRecurringSchedules()
  const { devices } = useDevices()
  const { users: householdUsers } = useHouseholdUsers()
  const { deviceGroups, addDeviceGroup } = useDeviceGroups()
  
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my')
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'card' | 'list'>(() => {
    // Load from localStorage or default to 'list' for space efficiency
    return (localStorage.getItem('schedulesViewMode') as 'card' | 'list') || 'list'
  })
  
  // Save view mode preference
  const toggleViewMode = () => {
    const newMode = viewMode === 'card' ? 'list' : 'card'
    setViewMode(newMode)
    localStorage.setItem('schedulesViewMode', newMode)
  }
  
  // Get current user ID from Supabase auth
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        setExpandedUsers(new Set([user.id]))
      }
    }
    getCurrentUser()
  }, [])
  
  // Reset modal state when closing
  const handleClose = () => {
    setShowForm(false)
    setEditingId(null)
    setUseMultiDevice(false)
    setActiveTab('my')
    onClose()
  }
  const [editingId, setEditingId] = useState<string | null>(null)
  const [useMultiDevice, setUseMultiDevice] = useState(false)
  const [showSaveGroupModal, setShowSaveGroupModal] = useState(false)
  const [pendingGroupDevices, setPendingGroupDevices] = useState<string[]>([])
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)
  const [bulkScheduleId, setBulkScheduleId] = useState<string | null>(null)
  const [replaceExisting, setReplaceExisting] = useState(false)
  const [existingLogsPreview, setExistingLogsPreview] = useState<any[]>([])
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [formData, setFormData] = useState<ScheduleFormData>({
    schedule_name: '',
    device_id: '',
    device_ids: [],
    recurrence_type: 'weekly',
    days_of_week: [],
    start_time: '',
    end_time: '',
    schedule_start_date: new Date().toISOString().split('T')[0],
    schedule_end_date: null,
    assigned_users: [],
    auto_create: true
  })

  // Group schedules by user
  const mySchedules = schedules.filter(s => s.created_by === currentUserId)
  const otherSchedules = schedules.filter(s => s.created_by !== currentUserId)
  
  // Group other schedules by user
  const schedulesByUser = otherSchedules.reduce((acc, schedule) => {
    const userId = schedule.created_by
    if (!acc[userId]) {
      acc[userId] = []
    }
    acc[userId].push(schedule)
    return acc
  }, {} as Record<string, typeof schedules>)
  
  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }
  
  // Compact list view rendering
  const renderScheduleListItem = (schedule: typeof schedules[0]) => (
    <div 
      key={schedule.id}
      className={`flex items-center gap-2 px-3 py-2 hover:bg-muted/50 rounded-lg border border-border/50 transition-all group ${
        !schedule.is_active ? 'opacity-60' : ''
      }`}
    >
      <BoltIcon className="w-4 h-4 text-orange-400 flex-shrink-0" />
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="font-medium text-sm text-foreground truncate">{schedule.schedule_name}</span>
        {schedule.auto_create && schedule.is_active && (
          <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded-full">Auto</span>
        )}
        {!schedule.is_active && (
          <span className="text-[10px] px-1.5 py-0.5 bg-gray-500/20 text-gray-400 rounded-full">Paused</span>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ClockIcon className="w-3.5 h-3.5 text-blue-400" />
        <span className="whitespace-nowrap">{schedule.start_time}-{schedule.end_time}</span>
      </div>
      <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => toggleScheduleActive(schedule.id, !schedule.is_active)}
          className={`p-1.5 rounded ${schedule.is_active ? 'hover:bg-yellow-500/20 text-yellow-500' : 'hover:bg-green-500/20 text-green-500'}`}
          title={schedule.is_active ? 'Pause' : 'Activate'}
        >
          {schedule.is_active ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
        </button>
        <button
          onClick={() => handleGenerateLog(schedule.id)}
          className="p-1.5 rounded hover:bg-cyan-500/20 text-cyan-500"
          title="Generate log"
          disabled={schedule.schedule_end_date ? new Date().toISOString().split('T')[0] > schedule.schedule_end_date : false}
        >
          <PlusIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleEdit(schedule)}
          className="p-1.5 rounded hover:bg-blue-500/20 text-blue-500"
          title="Edit"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => deleteSchedule(schedule.id)}
          className="p-1.5 rounded hover:bg-red-500/20 text-red-500"
          title="Delete"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate device selection
    if (useMultiDevice) {
      if (!formData.device_ids || formData.device_ids.length === 0) {
        toast.error('Please select at least one device')
        return
      }
      
      // Create multiple schedules (one per device)
      try {
        for (const deviceId of formData.device_ids) {
          const device = devices.find(d => d.id === deviceId)
          const scheduleData = {
            schedule_name: formData.device_ids.length > 1 
              ? `${formData.schedule_name} - ${device?.name}`
              : formData.schedule_name,
            device_id: deviceId,
            recurrence_type: formData.recurrence_type,
            days_of_week: formData.days_of_week,
            start_time: formData.start_time,
            end_time: formData.end_time,
            schedule_start_date: formData.schedule_start_date,
            schedule_end_date: formData.schedule_end_date,
            assigned_users: formData.assigned_users,
            auto_create: formData.auto_create
          }
          
          if (editingId && formData.device_ids.length === 1) {
            await updateSchedule(editingId, scheduleData)
          } else {
            await addSchedule(scheduleData)
          }
        }
        toast.success(`${formData.device_ids.length} schedule(s) created successfully!`)
        resetForm()
      } catch (err) {
        // Error handled in hook
      }
    } else {
      // Single device mode
      try {
        if (editingId) {
          await updateSchedule(editingId, formData)
        } else {
          await addSchedule(formData)
        }
        resetForm()
      } catch (err) {
        // Error handled in hook
      }
    }
  }

  const resetForm = () => {
    setFormData({
      schedule_name: '',
      device_id: '',
      device_ids: [],
      recurrence_type: 'weekly',
      days_of_week: [],
      start_time: '',
      end_time: '',
      schedule_start_date: new Date().toISOString().split('T')[0],
      schedule_end_date: null,
      assigned_users: [],
      auto_create: true
    })
    setShowForm(false)
    setEditingId(null)
    setUseMultiDevice(false)
  }

  const handleEdit = (schedule: typeof schedules[0]) => {
    setFormData({
      schedule_name: schedule.schedule_name,
      device_id: schedule.device_id,
      device_ids: [schedule.device_id],
      recurrence_type: schedule.recurrence_type,
      days_of_week: schedule.days_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      schedule_start_date: schedule.schedule_start_date,
      schedule_end_date: schedule.schedule_end_date,
      assigned_users: schedule.assigned_users,
      auto_create: schedule.auto_create
    })
    setEditingId(schedule.id)
    setUseMultiDevice(false)
    setShowForm(true)
  }

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day].sort((a, b) => a - b)
    }))
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

  const handleGenerateLog = async (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId)
    if (!schedule) return

    const today = new Date().toISOString().split('T')[0]
    
    // Check if today is within schedule range
    if (today < schedule.schedule_start_date) {
      toast.error('Cannot generate log: Today is before schedule start date')
      return
    }
    
    if (schedule.schedule_end_date && today > schedule.schedule_end_date) {
      toast.error(`Cannot generate log: Schedule ended on ${schedule.schedule_end_date}. Please update the schedule end date or remove it.`)
      return
    }
    
    // Check if today is in the selected days
    const dayOfWeek = new Date(today).getDay()
    if (!schedule.days_of_week.includes(dayOfWeek)) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      toast.error(`Cannot generate log: Schedule doesn't run on ${dayNames[dayOfWeek]}`)
      return
    }
    
    await generateLogsFromSchedule(scheduleId, today)
  }

  const getDaysLabel = (days: number[]) => {
    if (days.length === 7) return 'Every day'
    if (days.length === 5 && days.every(d => d >= 1 && d <= 5)) return 'Weekdays'
    if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends'
    return days.map(d => DAYS_OF_WEEK[d].label).join(', ')
  }

  const handleBulkGenerate = (scheduleId: string) => {
    setBulkScheduleId(scheduleId)
    setReplaceExisting(false)
    setExistingLogsPreview([])
    setShowPreview(false)
    setShowBulkConfirm(true)
  }

  const confirmBulkGenerate = async () => {
    if (!bulkScheduleId) return
    
    try {
      await bulkGenerateLogsForSchedule(bulkScheduleId, replaceExisting)
      setShowBulkConfirm(false)
      setBulkScheduleId(null)
      setReplaceExisting(false)
    } catch (err) {
      // Error handled in hook
    }
  }

  const calculateMatchingDays = (schedule: typeof schedules[0]) => {
    const startDate = new Date(schedule.schedule_start_date)
    const endDate = schedule.schedule_end_date ? new Date(schedule.schedule_end_date) : new Date()
    const today = new Date()
    const actualEndDate = endDate > today ? today : endDate
    
    let count = 0
    const currentDate = new Date(startDate)
    
    while (currentDate <= actualEndDate) {
      const dayOfWeek = currentDate.getDay()
      if (schedule.days_of_week.includes(dayOfWeek)) {
        count++
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return count
  }

  const fetchExistingLogsPreview = async () => {
    if (!replaceExisting || !bulkScheduleId) {
      setExistingLogsPreview([])
      return
    }
    
    const schedule = schedules.find(s => s.id === bulkScheduleId)
    if (!schedule) return
    
    setLoadingPreview(true)
    try {
      // Calculate matching dates
      const startDate = new Date(schedule.schedule_start_date)
      const endDate = schedule.schedule_end_date ? new Date(schedule.schedule_end_date) : new Date()
      const today = new Date()
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
        setExistingLogsPreview([])
        return
      }
      
      // Query existing logs
      const { data, error } = await supabase
        .from('energy_logs')
        .select('usage_date, start_time, end_time')
        .eq('source_type', 'recurring')
        .eq('source_id', bulkScheduleId)
        .in('usage_date', matchingDates)
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
    if (replaceExisting && bulkScheduleId) {
      fetchExistingLogsPreview()
    } else {
      setExistingLogsPreview([])
      setShowPreview(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replaceExisting, bulkScheduleId])

  // Early return after all hooks
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto">
      <div className="w-full sm:max-w-5xl min-h-screen sm:min-h-0 sm:my-4">
        <div className="energy-card w-full bg-card border-0 sm:border border-border rounded-none sm:rounded-lg shadow-xl min-h-screen sm:min-h-0 sm:max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 md:p-6 border-b border-border flex items-center justify-between flex-shrink-0 sticky top-0 bg-card z-10">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <ArrowPathIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-green-400 flex-shrink-0" />
              <span className="truncate">Recurring Schedules</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
              Automatically generate logs for regular usage patterns
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 h-9 w-9 sm:h-10 sm:w-10 border border-border rounded hover:bg-muted flex-shrink-0"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
          {!showForm ? (
            <>
              {/* Add Schedule Button */}
              <Button
                onClick={() => setShowForm(true)}
                className="w-full mb-3 sm:mb-4 energy-action-btn py-2.5 sm:py-2 text-sm sm:text-base"
              >
                <PlusIcon className="w-5 h-5 inline-block mr-2" />
                Create New Schedule
              </Button>

              {/* Tabs and View Toggle */}
              <div className="flex items-center justify-between mb-4 border-b border-border">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('my')}
                    className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                      activeTab === 'my'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="hidden sm:inline">My Schedules</span>
                    <span className="sm:hidden">My</span>
                    {mySchedules.length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                        {mySchedules.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                      activeTab === 'all'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="hidden sm:inline">All Schedules</span>
                    <span className="sm:hidden">All</span>
                    {schedules.length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                        {schedules.length}
                      </span>
                    )}
                  </button>
                </div>
                
                {/* View Mode Toggle */}
                <div className="flex gap-1 pb-2">
                  <button
                    onClick={toggleViewMode}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'card'
                        ? 'bg-primary/20 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    title="Card view"
                  >
                    <Squares2X2Icon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={toggleViewMode}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'list'
                        ? 'bg-primary/20 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    title="List view"
                  >
                    <ListBulletIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Schedules List */}
              {loading ? (
                <div className="text-center py-6 sm:py-8 text-sm sm:text-base text-muted-foreground">Loading schedules...</div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <ArrowPathIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-50" />
                  <p className="text-sm sm:text-base text-muted-foreground">No recurring schedules yet. Create your first one!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* My Schedules Tab */}
                  {activeTab === 'my' && (
                    mySchedules.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">You haven't created any schedules yet.</p>
                      </div>
                    ) : (
                      <div className={viewMode === 'list' ? 'space-y-1' : 'space-y-2'}>
                        {viewMode === 'list' ? (
                          mySchedules.map(schedule => renderScheduleListItem(schedule))
                        ) : (
                          mySchedules.map(schedule => (
                    <Card key={schedule.id} className={`energy-card transition-all ${schedule.is_active ? 'hover:border-primary/50' : 'opacity-60'}`}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col lg:flex-row items-start justify-between gap-3 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-bold text-sm sm:text-base text-foreground truncate">{schedule.schedule_name}</h3>
                              {!schedule.is_active && (
                                <span className="text-xs px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded-full">
                                  Paused
                                </span>
                              )}
                              {schedule.auto_create && schedule.is_active && (
                                <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                                  Auto
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <BoltIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400 flex-shrink-0" />
                                <span className="truncate">{schedule.device_name} ({schedule.device_wattage}W)</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <ClockIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                                <span className="whitespace-nowrap">{schedule.start_time} - {schedule.end_time}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 flex-shrink-0" />
                                <span className="truncate">{getDaysLabel(schedule.days_of_week)}</span>
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {schedule.schedule_start_date} {schedule.schedule_end_date ? `to ${schedule.schedule_end_date}` : '(ongoing)'}
                            </div>
                            {schedule.assigned_users.length > 0 && (
                              <div className="flex items-center gap-1.5 sm:gap-2 mt-2">
                                <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 flex-shrink-0" />
                                <div className="flex flex-wrap gap-1">
                                  {schedule.assigned_users.map(userId => {
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
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full lg:w-auto">
                            <Button
                              onClick={() => toggleScheduleActive(schedule.id, !schedule.is_active)}
                              variant="outline"
                              size="sm"
                              className={`p-1.5 sm:p-2 ${schedule.is_active ? 'border-yellow-300 text-yellow-500 hover:bg-yellow-500/10' : 'border-green-300 text-green-500 hover:bg-green-500/10'}`}
                              title={schedule.is_active ? 'Pause schedule' : 'Activate schedule'}
                            >
                              {schedule.is_active ? <PauseIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <PlayIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                            </Button>
                            <Button
                              onClick={() => handleBulkGenerate(schedule.id)}
                              variant="outline"
                              size="sm"
                              className="p-1.5 sm:p-2 border-purple-300 text-purple-500 hover:bg-purple-500/10"
                              title="Generate all logs for date range"
                            >
                              <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              onClick={() => handleGenerateLog(schedule.id)}
                              variant="outline"
                              size="sm"
                              className="p-1.5 sm:p-2 border-cyan-300 text-cyan-500 hover:bg-cyan-500/10"
                              title={schedule.schedule_end_date && new Date().toISOString().split('T')[0] > schedule.schedule_end_date 
                                ? `Schedule ended ${schedule.schedule_end_date}. Use Quick kWh Entry to backfill.` 
                                : "Generate log for today"}
                              disabled={schedule.schedule_end_date ? new Date().toISOString().split('T')[0] > schedule.schedule_end_date : false}
                            >
                              <PlusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              onClick={() => handleEdit(schedule)}
                              variant="outline"
                              size="sm"
                              className="p-1.5 sm:p-2 border-blue-300 text-blue-500 hover:bg-blue-500/10"
                            >
                              <PencilIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              onClick={() => deleteSchedule(schedule.id)}
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
                          ))
                        )}
                      </div>
                    )
                  )}

                  {/* All Schedules Tab */}
                  {activeTab === 'all' && (
                    <div className="space-y-4">
                      {/* My Schedules Section */}
                      {mySchedules.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2 px-2">
                            <UserIcon className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-semibold text-foreground">
                              My Schedules ({mySchedules.length})
                            </h3>
                          </div>
                          <div className="space-y-2">
                            {mySchedules.map(schedule => (
                              <Card key={schedule.id} className={`energy-card transition-all ${schedule.is_active ? 'hover:border-primary/50' : 'opacity-60'}`}>
                                <CardContent className="p-3 sm:p-4">
                                  {/* Same schedule card content - will extract to function later */}
                                  <div className="text-sm text-foreground">
                                    {schedule.schedule_name}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Other Users' Schedules */}
                      {Object.entries(schedulesByUser).map(([userId, userSchedules]) => {
                        const scheduleUser = householdUsers.find(u => u.id === userId)
                        if (!scheduleUser) return null
                        
                        const isExpanded = expandedUsers.has(userId)
                        
                        return (
                          <div key={userId}>
                            <button
                              onClick={() => toggleUserExpanded(userId)}
                              className="flex items-center gap-2 w-full px-2 py-2 hover:bg-muted/50 rounded transition-colors"
                            >
                              <ChevronDownIcon 
                                className={`w-4 h-4 text-muted-foreground transition-transform ${
                                  isExpanded ? 'rotate-0' : '-rotate-90'
                                }`}
                              />
                              <UserIcon className="w-4 h-4 text-blue-400" />
                              <h3 className="text-sm font-semibold text-foreground">
                                {scheduleUser.name}'s Schedules ({userSchedules.length})
                              </h3>
                            </button>
                            {isExpanded && (
                              <div className="space-y-2 mt-2">
                                {userSchedules.map(schedule => (
                                  <Card key={schedule.id} className={`energy-card transition-all ${schedule.is_active ? 'hover:border-primary/50' : 'opacity-60'}`}>
                                    <CardContent className="p-3 sm:p-4">
                                      <div className="text-sm text-foreground">
                                        {schedule.schedule_name}
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Schedule Form */
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-foreground">
                  Schedule Name *
                </label>
                <Input
                  type="text"
                  value={formData.schedule_name}
                  onChange={(e) => setFormData({ ...formData, schedule_name: e.target.value })}
                  placeholder="e.g., Weekday Work Computer"
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
                  {useMultiDevice ? '✓ Select multiple devices at once (creates separate schedule for each)' : '○ Single device only'}
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

              <div>
                <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-foreground">
                  Days of Week *
                </label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`px-3 sm:px-4 py-2 rounded-lg border-2 transition-all font-bold text-sm ${
                        formData.days_of_week.includes(day.value)
                          ? 'bg-cyan-500 border-cyan-400 text-white shadow-xl shadow-cyan-500/60 scale-105'
                          : 'bg-slate-900/80 border-slate-700/50 text-slate-500 hover:bg-slate-800 hover:border-slate-600 hover:text-slate-300'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                <div className="mt-2 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, days_of_week: [1, 2, 3, 4, 5] })}
                    className="px-3 py-1.5 text-xs font-semibold bg-blue-500/20 border border-blue-500/40 text-blue-300 rounded-md hover:bg-blue-500/30 hover:border-blue-500/60 transition-all"
                  >
                    📅 Weekdays
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, days_of_week: [0, 6] })}
                    className="px-3 py-1.5 text-xs font-semibold bg-purple-500/20 border border-purple-500/40 text-purple-300 rounded-md hover:bg-purple-500/30 hover:border-purple-500/60 transition-all"
                  >
                    🎉 Weekends
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, days_of_week: [0, 1, 2, 3, 4, 5, 6] })}
                    className="px-3 py-1.5 text-xs font-semibold bg-green-500/20 border border-green-500/40 text-green-300 rounded-md hover:bg-green-500/30 hover:border-green-500/60 transition-all"
                  >
                    🌟 Every Day
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-foreground">
                    Start Time *
                  </label>
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
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
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-foreground">
                    Start Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.schedule_start_date}
                    onChange={(e) => setFormData({ ...formData, schedule_start_date: e.target.value })}
                    className="text-sm sm:text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-foreground">
                    End Date (optional)
                  </label>
                  <Input
                    type="date"
                    value={formData.schedule_end_date || ''}
                    onChange={(e) => setFormData({ ...formData, schedule_end_date: e.target.value || null })}
                    className="text-sm sm:text-base"
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

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.auto_create}
                    onChange={(e) => setFormData({ ...formData, auto_create: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-semibold text-foreground">
                    Auto-create logs (recommended)
                  </span>
                </label>
                <p className="text-xs text-muted-foreground mt-1 ml-7">
                  Automatically generate logs for this schedule. Uncheck to manually trigger log creation.
                </p>
              </div>

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
                  {editingId ? 'Update Schedule' : 'Create Schedule'}
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

      {/* Bulk Generate Confirmation Modal */}
      {showBulkConfirm && bulkScheduleId && (() => {
        const schedule = schedules.find(s => s.id === bulkScheduleId)
        if (!schedule) return null
        
        const matchingDays = calculateMatchingDays(schedule)
        
        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="energy-card bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-purple-500/50 rounded-2xl shadow-2xl shadow-purple-500/20 max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
              <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <CalendarIcon className="w-7 h-7 text-purple-400" />
                </div>
                Generate All Logs?
              </h3>
              
              <p className="text-slate-300 mb-6 text-sm">
                This will create energy logs for all matching dates in the schedule range.
              </p>
              
              <div className="space-y-4 mb-6">
                <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 p-5 rounded-xl space-y-3">
                  <div className="grid grid-cols-[100px_1fr] gap-3 items-start">
                    <span className="text-slate-400 text-sm">Schedule:</span>
                    <span className="font-bold text-white break-words">
                      {schedule.schedule_name}
                    </span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-3 items-start">
                    <span className="text-slate-400 text-sm">Device:</span>
                    <span className="font-semibold text-orange-400 break-words">
                      {schedule.device_name}
                    </span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-3 items-start">
                    <span className="text-slate-400 text-sm">Date Range:</span>
                    <span className="font-semibold text-cyan-400 text-right">
                      {schedule.schedule_start_date} to {schedule.schedule_end_date || 'today'}
                    </span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-3 items-start">
                    <span className="text-slate-400 text-sm">Days:</span>
                    <span className="font-semibold text-blue-400 text-right">{getDaysLabel(schedule.days_of_week)}</span>
                  </div>
                  <div className="grid grid-cols-[auto_1fr] gap-3 items-center border-t border-purple-500/30 pt-3 mt-3">
                    <span className="text-slate-300 font-semibold">Total Logs to Create:</span>
                    <span className="font-bold text-purple-400 text-2xl text-right">{matchingDays}</span>
                  </div>
                </div>
                
                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={replaceExisting}
                      onChange={(e) => setReplaceExisting(e.target.checked)}
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
                  {replaceExisting && (
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
                  
                  {!replaceExisting && (
                    <p className="text-xs text-slate-400 flex items-start gap-2 pl-7">
                      <span>💡</span>
                      <span>
                        Existing logs will be skipped automatically. This may take a moment for large date ranges.
                      </span>
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowBulkConfirm(false)
                    setBulkScheduleId(null)
                  }}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmBulkGenerate}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold shadow-lg shadow-purple-500/30"
                >
                  ✨ Generate {matchingDays} Logs
                </Button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
