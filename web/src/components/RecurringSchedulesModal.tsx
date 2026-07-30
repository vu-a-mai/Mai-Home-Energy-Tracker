import { useState, useEffect } from 'react'
import { useRecurringSchedules } from '../hooks/useRecurringSchedules'
import { useDevices } from '../hooks/useDevices'
import { useHouseholdUsers } from '../hooks/useHouseholdUsers'
import { useDeviceGroups } from '../hooks/useDeviceGroups'
import { useDemoMode } from '../contexts/DemoContext'
import { DEMO_CURRENT_USER_ID } from '../demo/demoStore'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Card, CardContent } from './ui/Card'
import { MultiDeviceSelector } from './MultiDeviceSelector'
import { SaveGroupModal } from './SaveGroupModal'
import { DayOfWeekChips, DAYS_OF_WEEK } from './DayOfWeekChips'
import { ReplaceExistingLogsPanel } from './ReplaceExistingLogsPanel'
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
import { parseLocalDate, todayLocal } from '../utils/dateUtils'
import { countMatchingScheduleDays, getMatchingScheduleDates, isDateInSchedule } from '../utils/scheduleDates'

interface RecurringSchedulesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RecurringSchedulesModal({ isOpen, onClose }: RecurringSchedulesModalProps) {
  const { schedules, loading, addSchedule, updateSchedule, toggleScheduleActive, deleteSchedule, generateLogsFromSchedule, bulkGenerateLogsForSchedule } = useRecurringSchedules()
  const { devices } = useDevices()
  const { users: householdUsers } = useHouseholdUsers()
  const { deviceGroups, addDeviceGroup } = useDeviceGroups()
  const { isDemoMode } = useDemoMode()
  
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
  
  // Resolve current user (demo sandbox uses fictional Park-family id)
  const [currentUserId, setCurrentUserId] = useState<string | null>(isDemoMode ? DEMO_CURRENT_USER_ID : null)
  useEffect(() => {
    if (isDemoMode) {
      setCurrentUserId(DEMO_CURRENT_USER_ID)
      setExpandedUsers(new Set([DEMO_CURRENT_USER_ID]))
      return
    }
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        setExpandedUsers(new Set([user.id]))
      }
    }
    getCurrentUser()
  }, [isDemoMode])
  
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
  const [formData, setFormData] = useState<ScheduleFormData>({
    schedule_name: '',
    device_id: '',
    device_ids: [],
    recurrence_type: 'weekly',
    days_of_week: [],
    start_time: '',
    end_time: '',
    schedule_start_date: todayLocal(),
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
      className={`flex flex-wrap sm:flex-nowrap items-center gap-2 px-3 py-2 hover:bg-muted/50 rounded-lg border border-border/50 transition-all group ${
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
      <div className="flex gap-1 ml-auto sm:ml-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => toggleScheduleActive(schedule.id, !schedule.is_active)}
          className={`p-2 rounded ${schedule.is_active ? 'hover:bg-yellow-500/20 text-yellow-500' : 'hover:bg-green-500/20 text-green-500'}`}
          title={schedule.is_active ? 'Pause' : 'Activate'}
        >
          {schedule.is_active ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={() => handleGenerateLog(schedule.id)}
          className="p-2 rounded hover:bg-cyan-500/20 text-cyan-500"
          title="Generate log"
          disabled={schedule.schedule_end_date ? todayLocal() > schedule.schedule_end_date : false}
        >
          <PlusIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => handleEdit(schedule)}
          className="p-2 rounded hover:bg-blue-500/20 text-blue-500"
          title="Edit"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => deleteSchedule(schedule.id)}
          className="p-2 rounded hover:bg-red-500/20 text-red-500"
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
      schedule_start_date: todayLocal(),
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

    const today = todayLocal()
    const check = isDateInSchedule(schedule, today)
    if (!check.ok) {
      toast.error(`Cannot generate log: ${check.reason}`)
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

  const calculateMatchingDays = (schedule: typeof schedules[0]) =>
    countMatchingScheduleDays(schedule, todayLocal())

  const fetchExistingLogsPreview = async () => {
    if (!replaceExisting || !bulkScheduleId) {
      setExistingLogsPreview([])
      return
    }
    
    const schedule = schedules.find(s => s.id === bulkScheduleId)
    if (!schedule) return
    
    setLoadingPreview(true)
    try {
      const matchingDates = getMatchingScheduleDates(schedule, todayLocal())
      
      if (matchingDates.length === 0) {
        setExistingLogsPreview([])
        return
      }
      
      // Query existing active logs (RLS already excludes soft-deleted)
      const { data, error } = await supabase
        .from('energy_logs')
        .select('usage_date, start_time, end_time')
        .eq('source_type', 'recurring')
        .eq('source_id', bulkScheduleId)
        .is('deleted_at', null)
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replaceExisting, bulkScheduleId])

  // Early return after all hooks
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-black/50 p-0 sm:p-4 overflow-y-auto overscroll-contain">
      <div className="w-full sm:max-w-5xl sm:my-4 flex flex-col max-h-[100dvh] sm:max-h-[min(90vh,100dvh)]">
        <div className="energy-card flex flex-col w-full bg-card border-0 sm:border border-border rounded-none sm:rounded-lg shadow-xl min-h-0 max-h-[100dvh] sm:max-h-[min(90vh,100dvh)]">
          {/* Header — always visible so close stays reachable */}
          <div className="p-4 sm:p-5 md:p-6 border-b border-border flex items-center justify-between flex-shrink-0 bg-slate-900 z-10">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <ArrowPathIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-green-400 flex-shrink-0" />
              <span className="truncate">Schedules (auto)</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
              Ongoing automation — generate today&apos;s logs at midnight or when someone opens the app. Use Templates for one-shot recipes.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close schedules"
            className="p-2 h-11 w-11 sm:h-10 sm:w-10 border border-border rounded hover:bg-muted flex-shrink-0 inline-flex items-center justify-center"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pt-4 pb-0 sm:p-5 md:p-6">
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
                              title={schedule.schedule_end_date && todayLocal() > schedule.schedule_end_date 
                                ? `Schedule ended ${schedule.schedule_end_date}. Use Quick kWh Entry to backfill.` 
                                : "Generate log for today"}
                              disabled={schedule.schedule_end_date ? todayLocal() > schedule.schedule_end_date : false}
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

              <DayOfWeekChips
                value={formData.days_of_week}
                onChange={(days_of_week) => setFormData({ ...formData, days_of_week })}
              />

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
                  Creates today&apos;s log automatically around local midnight (server) and when someone in your household opens the app. Uncheck to require manual generate / bulk create.
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sticky bottom-0 z-20 sm:static bg-slate-900 py-3 sm:py-0 -mx-4 sm:m-0 px-4 sm:px-0 border-t sm:border-t-0 border-border shadow-[0_-10px_20px_rgba(2,6,23,0.85)] sm:shadow-none">
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
          <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto overscroll-contain">
            <div className="energy-card bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-purple-500/50 rounded-2xl shadow-2xl shadow-purple-500/20 max-w-lg w-full max-h-[min(92dvh,100dvh)] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
              <div className="flex items-start justify-between gap-3 p-4 sm:p-6 pb-2 flex-shrink-0">
              <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <CalendarIcon className="w-7 h-7 text-purple-400" />
                </div>
                Generate All Logs?
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowBulkConfirm(false)
                  setBulkScheduleId(null)
                }}
                aria-label="Close bulk generate"
                className="p-2 h-11 w-11 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 flex-shrink-0 inline-flex items-center justify-center"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6">
              
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
                
                <div className="space-y-3">
                  <ReplaceExistingLogsPanel
                    checked={replaceExisting}
                    onCheckedChange={setReplaceExisting}
                    loading={loadingPreview}
                    existingLogs={existingLogsPreview}
                  />
                  {!replaceExisting && (
                    <p className="text-xs text-slate-400">
                      Existing logs will be skipped automatically. This may take a moment for large date ranges.
                    </p>
                  )}
                </div>
              </div>
              </div>
              
              <div className="flex gap-3 flex-shrink-0 border-t border-slate-700 px-4 sm:px-6 py-4">
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
