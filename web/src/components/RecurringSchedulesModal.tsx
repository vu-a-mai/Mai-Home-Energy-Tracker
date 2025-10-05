import { useState } from 'react'
import { useRecurringSchedules } from '../hooks/useRecurringSchedules'
import { useDevices } from '../hooks/useDevices'
import { useHouseholdUsers } from '../hooks/useHouseholdUsers'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Card, CardContent } from './ui/Card'
import type { ScheduleFormData } from '../types'
import { toast } from 'sonner'
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
  UserIcon
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
  const { schedules, loading, addSchedule, updateSchedule, toggleScheduleActive, deleteSchedule, generateLogsFromSchedule } = useRecurringSchedules()
  const { devices } = useDevices()
  const { users: householdUsers } = useHouseholdUsers()
  
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<ScheduleFormData>({
    schedule_name: '',
    device_id: '',
    recurrence_type: 'weekly',
    days_of_week: [],
    start_time: '',
    end_time: '',
    schedule_start_date: new Date().toISOString().split('T')[0],
    schedule_end_date: null,
    assigned_users: [],
    auto_create: true
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

  const resetForm = () => {
    setFormData({
      schedule_name: '',
      device_id: '',
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
  }

  const handleEdit = (schedule: typeof schedules[0]) => {
    setFormData({
      schedule_name: schedule.schedule_name,
      device_id: schedule.device_id,
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-5xl my-8">
        <div className="energy-card w-full bg-card border border-border rounded-lg shadow-xl">
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ArrowPathIcon className="w-7 h-7 text-green-400" />
              Recurring Schedules
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Automatically generate logs for regular usage patterns
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
              {/* Add Schedule Button */}
              <Button
                onClick={() => setShowForm(true)}
                className="w-full mb-4 energy-action-btn"
              >
                <PlusIcon className="w-5 h-5 inline-block mr-2" />
                Create New Schedule
              </Button>

              {/* Schedules List */}
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading schedules...</div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-12">
                  <ArrowPathIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No recurring schedules yet. Create your first one!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {schedules.map(schedule => (
                    <Card key={schedule.id} className={`energy-card transition-all ${schedule.is_active ? 'hover:border-primary/50' : 'opacity-60'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-foreground">{schedule.schedule_name}</h3>
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
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <BoltIcon className="w-4 h-4 text-orange-400" />
                                {schedule.device_name} ({schedule.device_wattage}W)
                              </span>
                              <span className="flex items-center gap-1">
                                <ClockIcon className="w-4 h-4 text-blue-400" />
                                {schedule.start_time} - {schedule.end_time}
                              </span>
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="w-4 h-4 text-purple-400" />
                                {getDaysLabel(schedule.days_of_week)}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {schedule.schedule_start_date} {schedule.schedule_end_date ? `to ${schedule.schedule_end_date}` : '(ongoing)'}
                            </div>
                            {schedule.assigned_users.length > 0 && (
                              <div className="flex items-center gap-2 mt-2">
                                <UserIcon className="w-4 h-4 text-cyan-400" />
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
                          <div className="flex gap-2">
                            <Button
                              onClick={() => toggleScheduleActive(schedule.id, !schedule.is_active)}
                              variant="outline"
                              size="sm"
                              className={`p-2 ${schedule.is_active ? 'border-yellow-300 text-yellow-500 hover:bg-yellow-500/10' : 'border-green-300 text-green-500 hover:bg-green-500/10'}`}
                              title={schedule.is_active ? 'Pause schedule' : 'Activate schedule'}
                            >
                              {schedule.is_active ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                            </Button>
                            <Button
                              onClick={() => handleGenerateLog(schedule.id)}
                              variant="outline"
                              size="sm"
                              className="p-2 border-cyan-300 text-cyan-500 hover:bg-cyan-500/10"
                              title={schedule.schedule_end_date && new Date().toISOString().split('T')[0] > schedule.schedule_end_date 
                                ? `Schedule ended ${schedule.schedule_end_date}. Use Quick kWh Entry to backfill.` 
                                : "Generate log now"}
                              disabled={schedule.schedule_end_date ? new Date().toISOString().split('T')[0] > schedule.schedule_end_date : false}
                            >
                              <PlusIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleEdit(schedule)}
                              variant="outline"
                              size="sm"
                              className="p-2 border-blue-300 text-blue-500 hover:bg-blue-500/10"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => deleteSchedule(schedule.id)}
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
            /* Schedule Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-semibold text-foreground">
                  Schedule Name *
                </label>
                <Input
                  type="text"
                  value={formData.schedule_name}
                  onChange={(e) => setFormData({ ...formData, schedule_name: e.target.value })}
                  placeholder="e.g., Weekday Work Computer"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-foreground">
                  Device *
                </label>
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
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-foreground">
                  Days of Week *
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        formData.days_of_week.includes(day.value)
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-background border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, days_of_week: [1, 2, 3, 4, 5] })}
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    Weekdays
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, days_of_week: [0, 6] })}
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    Weekends
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, days_of_week: [0, 1, 2, 3, 4, 5, 6] })}
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    Every Day
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-foreground">
                    Start Time *
                  </label>
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold text-foreground">
                    End Time *
                  </label>
                  <Input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-foreground">
                    Start Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.schedule_start_date}
                    onChange={(e) => setFormData({ ...formData, schedule_start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold text-foreground">
                    End Date (optional)
                  </label>
                  <Input
                    type="date"
                    value={formData.schedule_end_date || ''}
                    onChange={(e) => setFormData({ ...formData, schedule_end_date: e.target.value || null })}
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
                  {editingId ? 'Update Schedule' : 'Create Schedule'}
                </Button>
              </div>
            </form>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
