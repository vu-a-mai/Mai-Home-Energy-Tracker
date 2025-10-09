import { useState, useMemo } from 'react'
import { useEnergyLogs } from '../hooks/useEnergyLogs'
import { useDevices } from '../hooks/useDevices'
import { useHouseholdUsers } from '../hooks/useHouseholdUsers'
import { useAuth } from '../hooks/useAuth'
import { useDeviceGroups } from '../hooks/useDeviceGroups'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { calculateUsageCost, getSeason } from '../utils/rateCalculatorFixed'
import { validateDate, validateTimeRange, validateUsageDuration } from '../utils/validation'
import { supabase } from '../lib/supabase'
import { TemplatesModal } from '../components/TemplatesModal'
import { RecurringSchedulesModal } from '../components/RecurringSchedulesModal'
import { BulkEnergyEntry } from '../components/BulkEnergyEntry'
import { MultiDeviceSelector } from '../components/MultiDeviceSelector'
import { SaveGroupModal } from '../components/SaveGroupModal'
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal'
import type { DeleteOptions } from '../components/DeleteConfirmationModal'
import { TemplateNameModal } from '../components/TemplateNameModal'
import { useTemplates } from '../hooks/useTemplates'
import {
  ClipboardDocumentListIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TvIcon,
  ComputerDesktopIcon,
  UserIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowsUpDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface EnergyLogFormData {
  device_id: string
  device_ids?: string[]
  usage_date: string
  start_time: string
  end_time: string
  assigned_users: string[]
}

// Helper function to convert 24-hour time to 12-hour format
const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours % 12 || 12
  return `${hours12}:${minutes.toString().padStart(2, '0')}${period}`
}

// Helper function to ensure time is in HH:MM format for HTML time inputs
const formatTimeForInput = (timeString: string): string => {
  if (!timeString) return ''
  // If time includes seconds (HH:MM:SS), remove them
  const parts = timeString.split(':')
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
  }
  return timeString
}

// Helper function to get device-specific icon
const getDeviceIcon = (deviceName: string): JSX.Element => {
  const name = deviceName.toLowerCase()
  const iconClass = "w-4 h-4 inline-block"
  
  if (name.includes('tv') || name.includes('television')) return <TvIcon className={`${iconClass} text-indigo-400`} />
  if (name.includes('refrigerator') || name.includes('fridge')) return <ComputerDesktopIcon className={`${iconClass} text-cyan-400`} />
  if (name.includes('ac') || name.includes('air conditioner')) return <ComputerDesktopIcon className={`${iconClass} text-blue-400`} />
  if (name.includes('tesla') || name.includes('charger') || name.includes('ev')) return <BoltIcon className={`${iconClass} text-green-400`} />
  if (name.includes('gaming') || name.includes('pc') || name.includes('computer')) return <ComputerDesktopIcon className={`${iconClass} text-purple-400`} />
  if (name.includes('laptop')) return <ComputerDesktopIcon className={`${iconClass} text-blue-400`} />
  if (name.includes('hair dryer') || name.includes('dryer')) return <BoltIcon className={`${iconClass} text-orange-400`} />
  if (name.includes('tablet') || name.includes('ipad')) return <ComputerDesktopIcon className={`${iconClass} text-gray-400`} />
  if (name.includes('work computer')) return <ComputerDesktopIcon className={`${iconClass} text-slate-400`} />
  return <BoltIcon className={`${iconClass} text-orange-400`} /> // Default icon
}

// Helper function to get user icon
const getUserIcon = (userName: string): JSX.Element => {
  const name = userName.toLowerCase()
  const iconClass = "w-4 h-4 inline-block"
  
  if (name.includes('vu')) return <UserIcon className={`${iconClass} text-green-400`} />
  if (name.includes('thuy')) return <UserIcon className={`${iconClass} text-purple-400`} />
  if (name.includes('vy')) return <UserIcon className={`${iconClass} text-pink-400`} />
  if (name.includes('han')) return <UserIcon className={`${iconClass} text-blue-400`} />
  return <UserIcon className={`${iconClass} text-slate-400`} />
}

export default function EnergyLogs() {
  const { energyLogs, loading, addEnergyLog, updateEnergyLog, deleteEnergyLog, getTotalUsage, refreshEnergyLogs } = useEnergyLogs()
  const { devices, refreshDevices } = useDevices()
  const { users: householdUsers } = useHouseholdUsers()
  const { user } = useAuth()
  const { addTemplate } = useTemplates()
  const { deviceGroups, addDeviceGroup } = useDeviceGroups()
  const [showForm, setShowForm] = useState(false)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [editingLog, setEditingLog] = useState<string | null>(null)
  const [useMultiDevice, setUseMultiDevice] = useState(false)
  const [showSaveGroupModal, setShowSaveGroupModal] = useState(false)
  const [pendingGroupDevices, setPendingGroupDevices] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const logsPerPage = 10
  const [formData, setFormData] = useState<EnergyLogFormData>({
    device_id: '',
    device_ids: [],
    usage_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    assigned_users: []
  })
  const [formErrors, setFormErrors] = useState<Partial<EnergyLogFormData>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    device: '',
    devices: [] as string[], // Multi-device filter
    startDate: '',
    endDate: '',
    users: [] as string[], // Changed to array for multi-select
    sortBy: 'date'
  })
  const [showUserFilter, setShowUserFilter] = useState(false)
  const [showDeviceFilter, setShowDeviceFilter] = useState(false)
  const [showRateBreakdown, setShowRateBreakdown] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSchedules, setShowSchedules] = useState(false)
  const [showBulkEntry, setShowBulkEntry] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showTemplateNameModal, setShowTemplateNameModal] = useState(false)
  const [templateLogData, setTemplateLogData] = useState<typeof energyLogs[0] | null>(null)

  const validateForm = (): boolean => {
    const errors: Partial<EnergyLogFormData> = {}
    
    // Device validation
    if (!formData.device_id) {
      errors.device_id = 'Device is required'
    }
    
    // Date validation
    if (!formData.usage_date) {
      errors.usage_date = 'Date is required'
    } else {
      const dateValidation = validateDate(formData.usage_date)
      if (!dateValidation.valid) {
        errors.usage_date = dateValidation.error
      }
    }
    
    // Time validation
    if (!formData.start_time) {
      errors.start_time = 'Start time is required'
    }
    if (!formData.end_time) {
      errors.end_time = 'End time is required'
    }
    
    // Time range validation
    if (formData.start_time && formData.end_time) {
      const timeRangeValidation = validateTimeRange(formData.start_time, formData.end_time)
      if (!timeRangeValidation.valid) {
        errors.end_time = timeRangeValidation.error
      }
      
      // Duration validation (warn if too long)
      const durationValidation = validateUsageDuration(formData.start_time, formData.end_time)
      if (durationValidation.error && durationValidation.error.includes('Warning')) {
        toast.warning(durationValidation.error)
      }
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate device selection
    if (useMultiDevice) {
      if (!formData.device_ids || formData.device_ids.length === 0) {
        toast.error('Please select at least one device')
        return
      }
      
      // Validate other fields manually for multi-device
      if (!formData.usage_date || !formData.start_time || !formData.end_time) {
        toast.error('Please fill in all required fields')
        return
      }
      
      // Create multiple logs (one per device)
      setSubmitting(true)
      setSubmitError(null)
      try {
        for (const deviceId of formData.device_ids) {
          await addEnergyLog({
            device_id: deviceId,
            usage_date: formData.usage_date,
            start_time: formData.start_time,
            end_time: formData.end_time,
            assigned_users: formData.assigned_users.length > 0 ? formData.assigned_users : undefined
          })
        }
        toast.success(`${formData.device_ids.length} energy log(s) created successfully!`)
        resetForm()
      } catch (err) {
        console.error('Error adding energy logs:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to add energy logs. Please try again.'
        setSubmitError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setSubmitting(false)
      }
    } else {
      // Single device mode
      if (!validateForm()) return

      setSubmitting(true)
      setSubmitError(null)
      try {
        if (editingLog) {
          // Update existing log - exclude device_ids
          const { device_ids, ...updateData } = formData
          await updateEnergyLog(editingLog, {
            ...updateData,
            assigned_users: formData.assigned_users.length > 0 ? formData.assigned_users : undefined
          })
        } else {
          // Add new log - exclude device_ids
          const { device_ids, ...logData } = formData
          await addEnergyLog({
            ...logData,
            assigned_users: formData.assigned_users.length > 0 ? formData.assigned_users : undefined
          })
        }
        toast.success(editingLog ? 'Energy log updated successfully!' : 'Energy log added successfully!')
        resetForm()
      } catch (err) {
        console.error(editingLog ? 'Error updating energy log:' : 'Error adding energy log:', err)
        const errorMessage = err instanceof Error ? err.message : `Failed to ${editingLog ? 'update' : 'add'} energy log. Please try again.`
        setSubmitError(errorMessage)
        toast.error(errorMessage)
        // Don't close the form on error
      } finally {
        setSubmitting(false)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      device_id: '',
      device_ids: [],
      usage_date: new Date().toISOString().split('T')[0],
      start_time: '',
      end_time: '',
      assigned_users: []
    })
    setFormErrors({})
    setSubmitError(null)
    setShowForm(false)
    setEditingLog(null)
    setUseMultiDevice(false)
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

  // Filter logs first before calculating totals
  const filteredLogs = useMemo(() => {
    let filtered = [...energyLogs]
    
    // Device filtering: support multi-device (devices[]) first, then single device fallback
    if (filters.devices && filters.devices.length > 0) {
      filtered = filtered.filter(log => filters.devices.includes(log.device_id))
    } else if (filters.device) {
      filtered = filtered.filter(log => log.device_id === filters.device)
    }
    
    if (filters.startDate) {
      filtered = filtered.filter(log => log.usage_date >= filters.startDate)
    }
    
    if (filters.endDate) {
      filtered = filtered.filter(log => log.usage_date <= filters.endDate)
    }
    
    if (filters.users.length > 0) {
      // Filter by users - check both created_by and assigned_users for shared devices
      filtered = filtered.filter(log => {
        // Check if any selected user created the log or is in assigned_users
        return filters.users.some(userId => {
          if (log.created_by === userId) return true
          if (log.assigned_users && log.assigned_users.includes(userId)) return true
          return false
        })
      })
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'cost':
          return b.calculated_cost - a.calculated_cost
        case 'duration':
          const aDuration = new Date(`2000-01-01T${a.end_time}`).getTime() - new Date(`2000-01-01T${a.start_time}`).getTime()
          const bDuration = new Date(`2000-01-01T${b.end_time}`).getTime() - new Date(`2000-01-01T${b.start_time}`).getTime()
          return bDuration - aDuration
        case 'device':
          return (a.device_name || '').localeCompare(b.device_name || '')
        default:
          return new Date(b.usage_date + 'T' + b.start_time).getTime() - new Date(a.usage_date + 'T' + a.start_time).getTime()
      }
    })
    
    return filtered
  }, [energyLogs, filters])

  // Calculate overall totals (filtered logs)
  const totalUsage = useMemo(() => {
    return filteredLogs.reduce((totals, log) => {
      const calc = calculateUsageCost(
        log.device_wattage || 0,
        log.start_time,
        log.end_time,
        log.usage_date
      )
      // Use stored values if available (from bulk entry), otherwise use calculated values
      const kwh = log.total_kwh ?? calc.totalKwh
      const cost = log.calculated_cost ?? calc.totalCost
      return {
        totalKwh: totals.totalKwh + kwh,
        totalCost: totals.totalCost + cost
      }
    }, { totalKwh: 0, totalCost: 0 })
  }, [filteredLogs])

  // Calculate monthly totals (current month only)
  const monthlyUsage = useMemo(() => {
    const currentDate = new Date()
    const monthlyLogs = energyLogs.filter(log => {
      const logDate = new Date(log.usage_date)
      return logDate.getMonth() === currentDate.getMonth() && 
             logDate.getFullYear() === currentDate.getFullYear()
    })
    
    return monthlyLogs.reduce((totals, log) => {
      const calc = calculateUsageCost(
        log.device_wattage || 0,
        log.start_time,
        log.end_time,
        log.usage_date
      )
      // Use stored values if available (from bulk entry), otherwise use calculated values
      const kwh = log.total_kwh ?? calc.totalKwh
      const cost = log.calculated_cost ?? calc.totalCost
      return {
        totalKwh: totals.totalKwh + kwh,
        totalCost: totals.totalCost + cost
      }
    }, { totalKwh: 0, totalCost: 0 })
  }, [energyLogs])

  // Get current month name
  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' })

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage)
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * logsPerPage
    return filteredLogs.slice(startIndex, startIndex + logsPerPage)
  }, [filteredLogs, currentPage, logsPerPage])

  // Handle edit
  const handleEdit = (log: typeof energyLogs[0]) => {
    setEditingLog(log.id)
    setFormData({
      device_id: log.device_id,
      usage_date: log.usage_date,
      start_time: formatTimeForInput(log.start_time),
      end_time: formatTimeForInput(log.end_time),
      assigned_users: log.assigned_users || []
    })
    setShowForm(true)
  }

  // Handle save as template
  const handleSaveAsTemplate = (log: typeof energyLogs[0]) => {
    setTemplateLogData(log)
    setShowTemplateNameModal(true)
  }

  // Toggle a device in the multi-select filter
  const toggleDevice = (deviceId: string) => {
    setFilters(prev => ({
      ...prev,
      devices: prev.devices.includes(deviceId)
        ? prev.devices.filter(id => id !== deviceId)
        : [...prev.devices, deviceId]
    }))
  }

  const confirmSaveTemplate = async (templateName: string) => {
    if (!templateLogData) return
    
    try {
      await addTemplate({
        template_name: templateName,
        device_id: templateLogData.device_id,
        default_start_time: formatTimeForInput(templateLogData.start_time),
        default_end_time: formatTimeForInput(templateLogData.end_time),
        assigned_users: templateLogData.assigned_users || []
      })
      toast.success('Template created successfully!')
      setShowTemplateNameModal(false)
      setTemplateLogData(null)
    } catch (err) {
      // Error handled in hook
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async (options: DeleteOptions) => {
    try {
      const logIds = filteredLogs.map(log => log.id)
      
      if (options.mode === 'permanent' || options.skipRecovery) {
        // Permanent delete
        const { error } = await supabase.rpc('permanent_delete_energy_logs', {
          p_log_ids: logIds
        })
        if (error) throw error
        toast.success(`Permanently deleted ${logIds.length} log(s)`)
      } else {
        // Soft delete
        const { error } = await supabase.rpc('soft_delete_energy_logs', {
          p_log_ids: logIds,
          p_recovery_days: options.recoveryDays
        })
        if (error) throw error
        toast.success(`Soft deleted ${logIds.length} log(s) (recoverable for ${options.recoveryDays} days)`, {
          action: {
            label: 'View Deleted',
            onClick: () => window.location.href = '/logs/deleted'
          }
        })
      }
      
      setShowDeleteModal(false)
      refreshEnergyLogs()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete logs')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96 text-xl text-muted-foreground">
        <div className="energy-pulse">Loading energy logs...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-3 md:p-5 min-h-screen bg-background text-foreground font-sans fade-in">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-6 md:mb-8 p-4 md:p-6 energy-header-gradient rounded-2xl text-white shadow-xl energy-glow">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 md:mb-2 energy-pulse flex items-center gap-3">
            <ClipboardDocumentListIcon className="w-7 h-7 md:w-8 md:h-8 text-orange-400" />
            Energy Logs
          </h1>
          <p className="opacity-90 text-xs sm:text-sm md:text-base">
            Track and analyze device usage sessions
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setShowBulkEntry(true)}
            className="px-2.5 sm:px-3 md:px-4 py-2 text-xs sm:text-sm md:text-base font-semibold whitespace-nowrap bg-purple-500 hover:bg-purple-600 text-white border-0 shadow-lg shadow-purple-500/30"
          >
            <BoltIcon className="w-4 h-4 md:w-5 md:h-5 inline-block mr-1 md:mr-2" />
            <span className="hidden xs:inline">Quick </span>kWh
          </Button>
          <Button
            onClick={() => setShowTemplates(true)}
            className="px-2.5 sm:px-3 md:px-4 py-2 text-xs sm:text-sm md:text-base font-semibold whitespace-nowrap bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-lg shadow-blue-500/30"
          >
            <DocumentDuplicateIcon className="w-4 h-4 md:w-5 md:h-5 inline-block mr-1 md:mr-2" />
            <span className="hidden sm:inline">Templates</span>
            <span className="sm:hidden">Temp</span>
          </Button>
          <Button
            onClick={() => setShowSchedules(true)}
            className="px-2.5 sm:px-3 md:px-4 py-2 text-xs sm:text-sm md:text-base font-semibold whitespace-nowrap bg-cyan-500 hover:bg-cyan-600 text-white border-0 shadow-lg shadow-cyan-500/30"
          >
            <ArrowPathIcon className="w-4 h-4 md:w-5 md:h-5 inline-block mr-1 md:mr-2" />
            <span className="hidden sm:inline">Schedules</span>
            <span className="sm:hidden">Sched</span>
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="px-2.5 sm:px-3 md:px-4 py-2 text-xs sm:text-sm md:text-base font-semibold whitespace-nowrap bg-green-500 hover:bg-green-600 text-white border-0 shadow-lg shadow-green-500/30"
          >
            <PlusIcon className="w-4 h-4 md:w-5 md:h-5 inline-block mr-1" />
            <span className="hidden xs:inline">Log </span>Usage
          </Button>
        </div>
      </header>

      {/* Summary Statistics - Color Coded */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6 slide-up">
        <Card className="energy-card bg-gradient-to-br from-slate-500/10 to-gray-500/10 border-slate-500/30">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1 md:mb-2">
              <ChartBarIcon className="w-6 h-6 md:w-7 md:h-7 text-blue-400" />
              <span className="text-xs text-muted-foreground font-semibold">Entries (Filtered / Total)</span>
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <div className="text-2xl md:text-3xl font-bold text-blue-400">
                {filteredLogs.length}
              </div>
              <div className="text-xl md:text-2xl font-bold text-slate-400">
                / {energyLogs.length}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="energy-card bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1 md:mb-2">
              <BoltIcon className="w-6 h-6 md:w-7 md:h-7 text-orange-400" />
              <span className="text-xs text-muted-foreground font-semibold">Total Energy & Cost</span>
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <div className="text-2xl md:text-3xl font-bold text-green-400">
                {totalUsage.totalKwh.toFixed(1)} kWh
              </div>
              <div className="text-xl md:text-2xl font-bold text-red-400">
                ${totalUsage.totalCost.toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="energy-card bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1 md:mb-2">
              <CalendarIcon className="w-6 h-6 md:w-7 md:h-7 text-cyan-400" />
              <span className="text-xs text-muted-foreground font-semibold">{currentMonthName} Total</span>
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <div className="text-2xl md:text-3xl font-bold text-cyan-400">
                {monthlyUsage.totalKwh.toFixed(1)} kWh
              </div>
              <div className="text-xl md:text-2xl font-bold text-purple-400">
                ${monthlyUsage.totalCost.toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Filters - Responsive Design */}
      <section className="mb-4 slide-up">
        <Card className="energy-card">
          <CardContent className="p-3 sm:p-4">
            {/* Mobile: Stacked Layout */}
            <div className="lg:hidden space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <FunnelIcon className="w-5 h-5 text-blue-400" />
                  <span className="text-sm">Filters</span>
                </div>
                <Button
                  onClick={() => {
                    setFilters({ device: '', devices: [], startDate: '', endDate: '', users: [], sortBy: 'date' })
                    setShowUserFilter(false)
                    setShowDeviceFilter(false)
                  }}
                  variant="outline"
                  size="sm"
                  className="px-3 py-1.5 text-xs border-red-300 text-red-500 hover:bg-red-500/10 hover:border-red-400"
                >
                  <XMarkIcon className="w-4 h-4 inline-block mr-1" />
                  Clear
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {/* User Filter */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <UserIcon className="w-3 h-3" />
                    Users
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUserFilter(true)}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background text-foreground border-border hover:border-primary/50 flex items-center justify-between gap-2 group"
                  >
                    <span className="flex items-center gap-2">
                      <UsersIcon className="w-4 h-4 text-cyan-400" />
                      {filters.users.length === 0 ? 'All Users' : 
                       filters.users.length === householdUsers.length ? 'All Users' :
                       `${filters.users.length} selected`}
                    </span>
                    <ChevronDownIcon className="w-4 h-4 text-cyan-400 group-hover:text-blue-400 transition-colors" />
                  </button>
                </div>
                
                {/* Device Filter */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <BoltIcon className="w-3 h-3" />
                    Device
                  </label>
                  <select
                    value={filters.device}
                    onChange={(e) => setFilters({...filters, device: e.target.value})}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background text-foreground border-border"
                  >
                    <option value="">All Devices</option>
                    {devices.map(device => (
                      <option key={device.id} value={device.id}>{device.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Date Range */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    From
                  </label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    className="px-3 py-2 text-sm h-auto w-full"
                  />
                </div>
                
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    To
                  </label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    className="px-3 py-2 text-sm h-auto w-full"
                  />
                </div>
                
                {/* Sort By */}
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <ArrowsUpDownIcon className="w-3 h-3" />
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background text-foreground border-border"
                  >
                    <option value="date">Newest First</option>
                    <option value="cost">Highest Cost</option>
                    <option value="duration">Longest Duration</option>
                    <option value="device">Device Name</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Desktop: Horizontal Layout */}
            <div className="hidden lg:flex items-center gap-4 flex-wrap">
              {/* Filter Icon & Title */}
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <FunnelIcon className="w-5 h-5 text-blue-400" />
                <span>Filters:</span>
              </div>
              
              {/* User Filter - Modal Button */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground whitespace-nowrap flex items-center gap-1">
                  <UserIcon className="w-4 h-4" />
                  Users:
                </label>
                <button
                  type="button"
                  onClick={() => setShowUserFilter(true)}
                  className="px-3 py-1.5 text-sm border rounded-lg bg-background text-foreground border-border hover:border-primary/50 min-w-[140px] flex items-center justify-between gap-2 group"
                >
                  <span className="flex items-center gap-1">
                    <UsersIcon className="w-4 h-4 text-cyan-400" />
                    {filters.users.length === 0 ? 'All Users' : 
                     filters.users.length === householdUsers.length ? 'All Users' :
                     `${filters.users.length} selected`}
                  </span>
                  <ChevronDownIcon className="w-3 h-3 text-orange-400 group-hover:text-yellow-400 transition-colors" />
                </button>
              </div>
              
              {/* Device Filter (Multi-Select) */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground whitespace-nowrap flex items-center gap-1">
                  <BoltIcon className="w-4 h-4" />
                  Devices:
                </label>
                <button
                  type="button"
                  onClick={() => setShowDeviceFilter(true)}
                  className="px-3 py-1.5 text-sm border rounded-lg bg-background text-foreground border-border hover:border-primary/50 min-w-[160px] flex items-center justify-between gap-2 group"
                >
                  <span className="flex items-center gap-2">
                    <BoltIcon className="w-4 h-4 text-orange-400" />
                    {filters.devices.length === 0
                      ? 'All Devices'
                      : (filters.devices.length === devices.length ? 'All Devices' : `${filters.devices.length} selected`)}
                  </span>
                  <ChevronDownIcon className="w-3 h-3 text-orange-400 group-hover:text-yellow-400 transition-colors" />
                </button>
              </div>
              
              {/* Date Range */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground whitespace-nowrap flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  From:
                </label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                  className="px-3 py-1.5 text-sm h-auto"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground whitespace-nowrap">To:</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                  className="px-3 py-1.5 text-sm h-auto"
                />
              </div>
              
              {/* Sort By */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground whitespace-nowrap flex items-center gap-1">
                  <ArrowsUpDownIcon className="w-4 h-4" />
                  Sort:
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                  className="px-3 py-1.5 text-sm border rounded-lg bg-background text-foreground border-border min-w-[140px]"
                >
                  <option value="date">Newest First</option>
                  <option value="cost">Highest Cost</option>
                  <option value="duration">Longest Duration</option>
                  <option value="device">Device Name</option>
                </select>
              </div>
              
              {/* Clear Filters Button */}
              <Button
                onClick={() => {
                  setFilters({ device: '', devices: [], startDate: '', endDate: '', users: [], sortBy: 'date' })
                  setShowUserFilter(false)
                  setShowDeviceFilter(false)
                }}
                variant="outline"
                size="sm"
                className="ml-auto px-4 py-1.5 text-sm border-red-300 text-red-500 hover:bg-red-500/10 hover:border-red-400"
              >
                <XMarkIcon className="w-4 h-4 inline-block mr-1" />
                Clear All
              </Button>

              {/* Delete Filtered Logs Button */}
              {(filters.device || filters.devices.length > 0 || filters.startDate || filters.endDate || filters.users.length > 0) && filteredLogs.length > 0 && (
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  variant="outline"
                  size="sm"
                  className="ml-2 px-4 py-1.5 text-sm border-red-500 text-red-500 hover:bg-red-500/20 hover:border-red-600"
                >
                  <TrashIcon className="w-4 h-4 inline-block mr-1" />
                  Delete Filtered ({filteredLogs.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Add Energy Log Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 overflow-y-auto p-0 sm:p-4">
          <div className="w-full min-h-screen sm:min-h-0 sm:max-h-[90vh] flex items-start sm:items-center justify-center py-4 sm:py-0">
            <Card className="energy-card w-full max-w-4xl mx-2 sm:mx-0 my-auto">
              <div className="max-h-[calc(100vh-2rem)] sm:max-h-[85vh] overflow-y-auto">
                <CardHeader className="p-3 sm:p-4 md:p-6 sticky top-0 bg-card z-10 border-b border-border">
                  <CardTitle className="text-base sm:text-lg md:text-xl text-foreground flex items-center justify-between gap-2">
                    <span className="truncate flex items-center gap-2">
                      {editingLog ? <PencilIcon className="w-5 h-5 text-blue-400" /> : <PlusIcon className="w-5 h-5 text-green-400" />}
                      {editingLog ? 'Edit Log' : 'Log Usage'}
                    </span>
                    <Button
                      type="button"
                      onClick={() => setShowForm(false)}
                      variant="outline"
                      size="sm"
                      className="text-xs shrink-0 h-8"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </Button>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm hidden sm:block">
                    Record device usage to track energy consumption
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6">
            
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Error Message */}
                {submitError && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm">
                    <div className="font-semibold mb-1 flex items-center gap-1">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      Error
                    </div>
                    <div>{submitError}</div>
                  </div>
                )}
                
                {/* Warning if no household users */}
                {householdUsers.length === 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 p-3 rounded-lg text-sm">
                    <div className="font-semibold mb-1 flex items-center gap-1">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      No Household Members Found
                    </div>
                    <div>You may not be assigned to a household. Contact your administrator.</div>
                  </div>
                )}
                {/* Device Selection Mode Toggle */}
                {!editingLog && (
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
                      />
                      <span className="text-sm font-bold text-blue-300">
                        Multi-Device Mode
                      </span>
                    </label>
                    <span className="text-xs text-blue-200">
                      {useMultiDevice ? '✓ Select multiple devices at once (creates separate log for each)' : '○ Single device only'}
                    </span>
                  </div>
                )}

                {/* Device Selection */}
                <div>
                  <label className="block mb-2 text-sm sm:text-base font-semibold text-foreground">
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
                    <>
                      <select
                        value={formData.device_id}
                        onChange={(e) => setFormData({...formData, device_id: e.target.value})}
                        className={`w-full p-2 sm:p-3 text-sm sm:text-base border rounded-lg bg-background text-foreground ${formErrors.device_id ? 'border-red-500' : 'border-border'}`}
                      >
                        <option value="">Select a device</option>
                        {devices.map(device => (
                          <option key={device.id} value={device.id}>
                            {device.name} ({device.wattage}W)
                          </option>
                        ))}
                      </select>
                      {formErrors.device_id && (
                        <div className="text-red-500 text-xs sm:text-sm mt-1">
                          {formErrors.device_id}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Usage Date */}
                <div>
                  <label className="block mb-2 text-sm sm:text-base font-semibold text-foreground">
                    Usage Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.usage_date}
                    onChange={(e) => setFormData({...formData, usage_date: e.target.value})}
                    className={`text-sm sm:text-base ${formErrors.usage_date ? 'border-red-500' : ''}`}
                  />
                  {formErrors.usage_date && (
                    <div className="text-red-500 text-xs sm:text-sm mt-1">
                      {formErrors.usage_date}
                    </div>
                  )}
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block mb-2 text-sm sm:text-base font-semibold text-foreground">
                      Start Time *
                    </label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                      className={`text-sm sm:text-base ${formErrors.start_time ? 'border-red-500' : ''}`}
                    />
                    {formErrors.start_time && (
                      <div className="text-red-500 text-xs sm:text-sm mt-1">
                        {formErrors.start_time}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm sm:text-base font-semibold text-foreground">
                      End Time *
                    </label>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                      className={`text-sm sm:text-base ${formErrors.end_time ? 'border-red-500' : ''}`}
                    />
                    {formErrors.end_time && (
                      <div className="text-red-500 text-xs sm:text-sm mt-1">
                        {formErrors.end_time}
                      </div>
                    )}
                  </div>
                </div>

                {/* Cost Calculation Preview - Compact */}
                {formData.device_id && formData.start_time && formData.end_time && formData.usage_date && (() => {
                  const selectedDevice = devices.find(d => d.id === formData.device_id)
                  if (!selectedDevice) return null
                  
                  try {
                    const calculation = calculateUsageCost(
                      selectedDevice.wattage,
                      formData.start_time,
                      formData.end_time,
                      formData.usage_date
                    )
                    
                    const season = getSeason(new Date(formData.usage_date))
                    
                    return (
                      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 p-2 sm:p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm sm:text-base font-bold text-green-400 flex items-center gap-1">
                            <CurrencyDollarIcon className="w-4 h-4" />
                            Cost: ${calculation.totalCost.toFixed(2)}
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowRateBreakdown(!showRateBreakdown)}
                            className="text-xs text-blue-400 hover:text-blue-300 underline"
                          >
                            {showRateBreakdown ? (
                              <>
                                <ChevronUpIcon className="w-4 h-4 inline-block" />
                                Hide
                              </>
                            ) : (
                              <>
                                <ChevronDownIcon className="w-4 h-4 inline-block" />
                                Details
                              </>
                            )}
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BoltIcon className="w-3 h-3" />
                            {calculation.totalKwh.toFixed(2)} kWh
                          </span>
                          <span className="flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            {calculation.durationHours.toFixed(1)}h
                          </span>
                          <span>{season}</span>
                        </div>
                        
                        {showRateBreakdown && calculation.breakdown.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-green-500/30 space-y-1">
                            {calculation.breakdown.map((period, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">
                                  {period.ratePeriod} ({period.hours.toFixed(1)}h)
                                </span>
                                <span className="font-semibold text-foreground">
                                  ${period.cost.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  } catch (error) {
                    return null
                  }
                })()}

                {/* User Assignment - Compact */}
                {householdUsers.length > 0 && (
                  <div>
                    <label className="block mb-1.5 text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1">
                      <UserIcon className="w-4 h-4" />
                      Assign to Users (optional)
                    </label>
                    <div className="bg-muted/50 p-2 sm:p-3 rounded-lg border border-border">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {householdUsers.map(user => (
                          <label key={user.id} className={`flex items-center cursor-pointer px-2 py-1 rounded border transition-colors text-xs ${
                            formData.assigned_users.includes(user.id) 
                              ? 'bg-blue-100 border-blue-300 text-blue-800' 
                              : 'bg-background border-border hover:bg-muted/30'
                          }`}>
                            <input
                              type="checkbox"
                              checked={formData.assigned_users.includes(user.id)}
                              onChange={() => toggleUserAssignment(user.id)}
                              className="mr-1.5 w-3 h-3"
                            />
                            <span>{user.name}</span>
                          </label>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, assigned_users: householdUsers.map(u => u.id)})}
                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                      >
                        Select All
                      </button>
                    </div>
                  </div>
                )}

                {/* Form Actions - Sticky on mobile */}
                <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2 sm:pt-3 sticky bottom-0 bg-card pb-2 sm:pb-0 sm:static border-t sm:border-t-0 border-border -mx-3 sm:mx-0 px-3 sm:px-0 mt-2">
                  <Button
                    type="button"
                    onClick={resetForm}
                    disabled={submitting}
                    variant="outline"
                    className="px-4 py-2 text-sm w-full sm:w-auto order-2 sm:order-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="energy-action-btn px-4 py-2 text-sm w-full sm:w-auto order-1 sm:order-2"
                  >
                    {submitting 
                      ? (editingLog ? '⏳ Updating...' : '⏳ Logging...') 
                      : (editingLog ? '✓ Update Log' : '✓ Log Usage')
                    }
                  </Button>
                </div>
              </form>
                </CardContent>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Device Filter Modal */}
      {showDeviceFilter && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeviceFilter(false)
            }
          }}
        >
          <div className="energy-card w-full max-w-md bg-card border border-border rounded-lg shadow-xl">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <BoltIcon className="w-6 h-6 text-orange-400" />
                  Filter by Devices
                </h3>
                <button
                  onClick={() => setShowDeviceFilter(false)}
                  className="p-2 h-8 w-8 border border-border rounded hover:bg-muted"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                Select which devices to show in the logs
              </p>
            </div>
            
            <div className="p-6">
              <div className="space-y-2 mb-4 max-h-80 overflow-y-auto pr-1">
                {devices.map(device => (
                  <label 
                    key={device.id} 
                    className="flex items-center gap-3 px-3 py-3 hover:bg-muted rounded-lg cursor-pointer transition-colors border border-transparent hover:border-primary/30"
                  >
                    <input
                      type="checkbox"
                      checked={filters.devices.includes(device.id)}
                      onChange={() => toggleDevice(device.id)}
                      className="w-5 h-5 cursor-pointer accent-primary"
                    />
                    <span className="text-base text-foreground font-medium flex-1">{device.name}</span>
                    {device.wattage && (
                      <span className="text-xs text-muted-foreground">{device.wattage}W</span>
                    )}
                  </label>
                ))}
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  onClick={() => setFilters({...filters, devices: devices.map(d => d.id)})}
                  className="flex-1 px-3 py-2 text-sm bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 rounded font-medium"
                >
                  ✓ Select All
                </button>
                <button
                  onClick={() => setFilters({...filters, devices: []})}
                  className="flex-1 px-3 py-2 text-sm bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded font-medium"
                >
                  <XMarkIcon className="w-4 h-4 inline-block mr-1" />
                  Clear All
                </button>
                <button
                  onClick={() => setShowDeviceFilter(false)}
                  className="flex-1 px-3 py-2 text-sm energy-action-btn rounded font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Energy Logs List - Compact with Expandable Details */}
      <section className="space-y-3 slide-up">
        {paginatedLogs.map(log => {
          // Calculate usage from time range
          const calculation = calculateUsageCost(
            log.device_wattage || 0,
            log.start_time,
            log.end_time,
            log.usage_date
          )
          
          // Use stored values if available (from bulk entry or template), otherwise use calculated values
          const storedBreakdown = log.rate_breakdown
          const calculatedBreakdown = calculation.breakdown
          
          const usageCalc = {
            totalKwh: log.total_kwh ?? calculation.totalKwh,
            totalCost: log.calculated_cost ?? calculation.totalCost,
            durationHours: calculation.durationHours,
            breakdown: Array.isArray(storedBreakdown) ? storedBreakdown : 
                      Array.isArray(calculatedBreakdown) ? calculatedBreakdown : []
          }
          
          const isExpanded = expandedLog === log.id
          
          return (
            <Card key={log.id} className="energy-card hover:border-primary/50 transition-all">
              <CardContent className="p-3 sm:p-4">
                {/* Mobile View */}
                <div className="lg:hidden">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <h4 className="font-bold text-sm text-foreground truncate">
                          {getDeviceIcon(log.device_name || '')} {log.device_name || 'Unknown Device'}
                        </h4>
                        {log.source_type === 'template' && (
                          <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] sm:text-xs rounded-full flex items-center gap-0.5 sm:gap-1 shrink-0 border border-blue-500/30">
                            <DocumentDuplicateIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            <span className="hidden xs:inline">Template</span>
                            <span className="xs:hidden">T</span>
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{log.device_wattage}W</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-orange-400 flex items-center justify-end gap-1">
                        <BoltIcon className="w-3 h-3" />
                        {usageCalc.totalKwh.toFixed(2)} kWh
                      </div>
                      <div className="text-sm font-bold text-red-400 flex items-center justify-end gap-1">
                        {usageCalc.totalCost > 10 && (
                          <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400" title="High cost!" />
                        )}
                        ${usageCalc.totalCost.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      {new Date(log.usage_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" />
                      {formatTime12Hour(log.start_time)} - {formatTime12Hour(log.end_time)}
                    </span>
                    <span>({usageCalc.durationHours.toFixed(1)}h)</span>
                  </div>
                  
                  {/* Show who used it */}
                  {log.assigned_users && log.assigned_users.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mb-2">
                      <span className="text-xs text-muted-foreground">Used by:</span>
                      {log.assigned_users.map((userId: string) => {
                        const assignedUser = householdUsers.find(u => u.id === userId)
                        return assignedUser ? (
                          <span key={userId} className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                            {getUserIcon(assignedUser.name)} {assignedUser.name}
                          </span>
                        ) : null
                      })}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-1 mb-2">
                    {usageCalc.breakdown.map((period: any, idx: number) => {
                      if (!period || !period.ratePeriod) return null
                      return (
                        <div key={idx} className={`px-1.5 py-0.5 rounded text-xs font-semibold flex items-center gap-1 ${
                          period.ratePeriod === 'Off-Peak' ? 'bg-green-500/20 text-green-400' :
                          period.ratePeriod === 'Mid-Peak' ? 'bg-yellow-500/20 text-yellow-400' :
                          period.ratePeriod === 'On-Peak' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          <ClockIcon className="w-3 h-3" />
                          {period.ratePeriod === 'On-Peak' && (
                            <ExclamationTriangleIcon className="w-3 h-3" title="Peak pricing!" />
                          )}
                          {period.hours?.toFixed(1) || '0.0'}h {period.ratePeriod}
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1 p-2 h-8 text-xs"
                      title={isExpanded ? "Hide details" : "View details"}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUpIcon className="w-4 h-4 inline-block mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <ChevronDownIcon className="w-4 h-4 inline-block mr-1" />
                          Details
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleSaveAsTemplate(log)}
                      variant="outline"
                      size="sm"
                      className="p-2 h-8 w-8 border-purple-300 text-purple-500 hover:bg-purple-500/10"
                      title="Save as template"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleEdit(log)}
                      variant="outline"
                      size="sm"
                      className="p-2 h-8 w-8 border-blue-300 text-blue-500 hover:bg-blue-500/10"
                      title="Edit log"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => deleteEnergyLog(log.id)}
                      variant="outline"
                      size="sm"
                      className="p-2 h-8 w-8 border-red-300 text-red-500 hover:bg-red-500/10"
                      title="Delete log"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Desktop View */}
                <div className="hidden lg:flex items-center justify-between gap-4">
                  {/* Left: Device & Basic Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-bold text-foreground truncate">
                        {getDeviceIcon(log.device_name || '')} {log.device_name || 'Unknown Device'}
                      </h4>
                      <span className="text-xs text-muted-foreground">{log.device_wattage}W</span>
                      {log.source_type === 'template' && (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full flex items-center gap-1 border border-blue-500/30">
                          <DocumentDuplicateIcon className="w-3 h-3" />
                          Template
                        </span>
                      )}
                      {/* Show who used it */}
                      {log.assigned_users && log.assigned_users.length > 0 && (
                        <div className="flex items-center gap-1">
                          {log.assigned_users.map((userId: string) => {
                            const assignedUser = householdUsers.find(u => u.id === userId)
                            return assignedUser ? (
                              <span key={userId} className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                                {getUserIcon(assignedUser.name)} {assignedUser.name}
                              </span>
                            ) : null
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {new Date(log.usage_date + 'T00:00:00').toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {formatTime12Hour(log.start_time)} - {formatTime12Hour(log.end_time)}
                      </span>
                      <span>({usageCalc.durationHours.toFixed(1)}h)</span>
                    </div>
                  </div>
                  
                  {/* Center: Quick Rate Summary */}
                  <div className="flex items-center gap-2">
                    {usageCalc.breakdown.map((period: any, idx: number) => {
                      if (!period || !period.ratePeriod) return null
                      return (
                        <div key={idx} className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                          period.ratePeriod === 'Off-Peak' ? 'bg-green-500/20 text-green-400' :
                          period.ratePeriod === 'Mid-Peak' ? 'bg-yellow-500/20 text-yellow-400' :
                          period.ratePeriod === 'On-Peak' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          <ClockIcon className="w-3 h-3" />
                          {period.ratePeriod === 'On-Peak' && (
                            <ExclamationTriangleIcon className="w-3 h-3" title="Peak pricing!" />
                          )}
                          {period.hours?.toFixed(1) || '0.0'}h {period.ratePeriod}
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Right: Total & Actions */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-bold text-orange-400 flex items-center justify-end gap-1">
                        <BoltIcon className="w-4 h-4" />
                        {usageCalc.totalKwh.toFixed(2)} kWh
                      </div>
                      <div className="text-lg font-bold text-red-400 flex items-center justify-end gap-1">
                        {usageCalc.totalCost > 10 && (
                          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" title="High cost!" />
                        )}
                        ${usageCalc.totalCost.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                        variant="outline"
                        size="sm"
                        className="p-2 h-8 w-8 text-xs"
                        title={isExpanded ? "Hide details" : "View details"}
                      >
                        {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                      </Button>
                      <Button
                        onClick={() => handleSaveAsTemplate(log)}
                        variant="outline"
                        size="sm"
                        className="p-2 h-8 w-8 border-purple-300 text-purple-500 hover:bg-purple-500/10"
                        title="Save as template"
                      >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleEdit(log)}
                        variant="outline"
                        size="sm"
                        className="p-2 h-8 w-8 border-blue-300 text-blue-500 hover:bg-blue-500/10"
                        title="Edit log"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => deleteEnergyLog(log.id)}
                        variant="outline"
                        size="sm"
                        className="p-2 h-8 w-8 border-red-300 text-red-500 hover:bg-red-500/10"
                        title="Delete log"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    {/* Show related devices from same template */}
                    {log.source_type === 'template' && log.source_id && (() => {
                      const relatedLogs = energyLogs.filter(l => 
                        l.source_type === 'template' && 
                        l.source_id === log.source_id && 
                        l.usage_date === log.usage_date &&
                        l.start_time === log.start_time &&
                        l.end_time === log.end_time &&
                        l.id !== log.id
                      )
                      
                      if (relatedLogs.length > 0) {
                        const totalKwh = relatedLogs.reduce((sum, l) => sum + (l.total_kwh || 0), 0) + (log.total_kwh || usageCalc.totalKwh)
                        const totalCost = relatedLogs.reduce((sum, l) => sum + (l.calculated_cost || 0), 0) + (log.calculated_cost || usageCalc.totalCost)
                        
                        return (
                          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2 text-sm font-bold text-blue-400">
                              <DocumentDuplicateIcon className="w-4 h-4" />
                              Template Group ({relatedLogs.length + 1} devices)
                            </div>
                            <div className="space-y-1.5">
                              {/* Current device */}
                              <div className="flex items-center justify-between text-xs bg-blue-500/20 rounded px-2 py-1.5 border border-blue-500/40">
                                <span className="font-semibold text-blue-300 flex items-center gap-1">
                                  {getDeviceIcon(log.device_name || '')} {log.device_name}
                                </span>
                                <span className="text-blue-400 font-mono">
                                  {(log.total_kwh || usageCalc.totalKwh).toFixed(2)} kWh • ${(log.calculated_cost || usageCalc.totalCost).toFixed(2)}
                                </span>
                              </div>
                              {/* Related devices */}
                              {relatedLogs.map(relLog => (
                                <div key={relLog.id} className="flex items-center justify-between text-xs bg-slate-800/50 rounded px-2 py-1.5">
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    {getDeviceIcon(relLog.device_name || '')} {relLog.device_name}
                                  </span>
                                  <span className="text-foreground font-mono">
                                    {(relLog.total_kwh || 0).toFixed(2)} kWh • ${(relLog.calculated_cost || 0).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-blue-500/30">
                              <span className="text-sm font-bold text-blue-300">Total:</span>
                              <span className="text-sm font-bold text-blue-400 font-mono">
                                {totalKwh.toFixed(2)} kWh • ${totalCost.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )
                      }
                      return null
                    })()}
                    
                    <div className="text-sm font-bold text-foreground">Detailed Rate Breakdown:</div>
                    <div className="space-y-2">
                      {usageCalc.breakdown.map((period: any, idx: number) => {
                        if (!period || !period.ratePeriod) return null
                        const bgColor = period.ratePeriod === 'Off-Peak' ? 'bg-green-500/10' :
                                       period.ratePeriod === 'Mid-Peak' ? 'bg-yellow-500/10' :
                                       period.ratePeriod === 'On-Peak' ? 'bg-red-500/10' : 'bg-blue-500/10'
                        const textColor = period.ratePeriod === 'Off-Peak' ? 'text-green-400' :
                                         period.ratePeriod === 'Mid-Peak' ? 'text-yellow-400' :
                                         period.ratePeriod === 'On-Peak' ? 'text-red-400' : 'text-blue-400'
                        return (
                          <div key={idx} className={`${bgColor} rounded-lg p-3 space-y-1`}>
                            <div className="flex items-center justify-between">
                              <span className={`font-bold text-sm ${textColor} flex items-center gap-1`}>
                                {period.ratePeriod === 'Off-Peak' && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                                {period.ratePeriod === 'Mid-Peak' && <div className="w-2 h-2 rounded-full bg-yellow-500"></div>}
                                {period.ratePeriod === 'On-Peak' && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
                                {period.ratePeriod === 'Super Off-Peak' && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                                {period.ratePeriod}
                              </span>
                              <span className="text-xs text-muted-foreground font-semibold">
                                @ ${period.rate?.toFixed(2) || '0.00'}/kWh
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatTime12Hour(period.startTime)} - {formatTime12Hour(period.endTime)} ({period.hours?.toFixed(1) || '0.0'}h)
                            </div>
                            <div className="text-sm text-foreground font-mono font-semibold">
                              {period.kwh?.toFixed(2) || '0.00'} kWh × ${period.rate?.toFixed(2) || '0.00'} = ${period.cost?.toFixed(2) || '0.00'}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </section>

      {/* Pagination Controls */}
      {filteredLogs.length > logsPerPage && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 slide-up">
          <div className="text-xs sm:text-sm text-muted-foreground">
            Showing {((currentPage - 1) * logsPerPage) + 1} to {Math.min(currentPage * logsPerPage, filteredLogs.length)} of {filteredLogs.length} logs
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              className="px-2 sm:px-3 py-2 text-xs sm:text-sm"
            >
              ← <span className="hidden sm:inline">Previous</span>
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                // Show first page, last page, current page, and pages around current
                let page;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className={`px-2 sm:px-3 py-2 text-xs sm:text-sm ${currentPage === page ? 'energy-action-btn' : ''}`}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <Button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              className="px-2 sm:px-3 py-2 text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Next</span> →
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredLogs.length === 0 && !loading && (
        <section className="text-center py-20 slide-up">
          <ClipboardDocumentListIcon className="w-24 h-24 md:w-32 md:h-32 mb-4 energy-pulse text-orange-400 mx-auto opacity-50" />
          <h3 className="text-xl font-bold text-foreground mb-2">No energy logs yet</h3>
          <p className="text-muted-foreground mb-6">
            Start logging device usage to track energy consumption
          </p>
          <Button
            onClick={() => setShowForm(true)}
            className="energy-action-btn px-6 py-3 text-lg font-semibold"
          >
            Log Your First Usage
          </Button>
        </section>
      )}

      {/* Bulk/Quick kWh Entry Modal */}
      <BulkEnergyEntry
        isOpen={showBulkEntry}
        onClose={() => setShowBulkEntry(false)}
        onSuccess={() => {
          setShowBulkEntry(false)
          refreshEnergyLogs()
        }}
      />

      {/* Templates Modal */}
      <TemplatesModal
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onUseTemplate={() => {
          setShowTemplates(false)
          refreshEnergyLogs()
        }}
      />

      {/* Recurring Schedules Modal */}
      <RecurringSchedulesModal
        isOpen={showSchedules}
        onClose={() => setShowSchedules(false)}
      />

      {/* Save Group Modal */}
      <SaveGroupModal
        isOpen={showSaveGroupModal}
        onClose={() => setShowSaveGroupModal(false)}
        onSave={handleConfirmSaveGroup}
        deviceCount={pendingGroupDevices.length}
      />

      {/* User Filter Modal */}
      {showUserFilter && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowUserFilter(false)
            }
          }}
        >
          <div className="energy-card w-full max-w-md bg-card border border-border rounded-lg shadow-xl">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <UsersIcon className="w-6 h-6 text-cyan-400" />
                  Filter by Users
                </h3>
                <button
                  onClick={() => setShowUserFilter(false)}
                  className="p-2 h-8 w-8 border border-border rounded hover:bg-muted"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                Select which users to show in the logs
              </p>
            </div>
            
            <div className="p-6">
              <div className="space-y-2 mb-4">
                {householdUsers.map(user => (
                  <label 
                    key={user.id} 
                    className="flex items-center gap-3 px-3 py-3 hover:bg-muted rounded-lg cursor-pointer transition-colors border border-transparent hover:border-primary/30"
                  >
                    <input
                      type="checkbox"
                      checked={filters.users.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters({...filters, users: [...filters.users, user.id]})
                        } else {
                          setFilters({...filters, users: filters.users.filter(id => id !== user.id)})
                        }
                      }}
                      className="w-5 h-5 cursor-pointer accent-primary"
                    />
                    <span className="text-base text-foreground font-medium">{user.name}</span>
                  </label>
                ))}
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  onClick={() => setFilters({...filters, users: householdUsers.map(u => u.id)})}
                  className="flex-1 px-3 py-2 text-sm bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 rounded font-medium"
                >
                  ✓ Select All
                </button>
                <button
                  onClick={() => setFilters({...filters, users: []})}
                  className="flex-1 px-3 py-2 text-sm bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded font-medium"
                >
                  <XMarkIcon className="w-4 h-4 inline-block mr-1" />
                  Clear All
                </button>
                <button
                  onClick={() => setShowUserFilter(false)}
                  className="flex-1 px-3 py-2 text-sm energy-action-btn rounded font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        logsToDelete={filteredLogs}
        totalKwh={totalUsage.totalKwh}
        totalCost={totalUsage.totalCost}
        calculateCost={(log) => {
          const calc = calculateUsageCost(
            log.device_wattage || 0,
            log.start_time,
            log.end_time,
            log.usage_date
          )
          // Use stored cost if available (from bulk entry), otherwise use calculated
          return log.calculated_cost ?? calc.totalCost
        }}
        onConfirm={handleBulkDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Template Name Modal */}
      <TemplateNameModal
        isOpen={showTemplateNameModal}
        defaultName={templateLogData ? `${templateLogData.device_name} Template` : ''}
        onConfirm={confirmSaveTemplate}
        onCancel={() => {
          setShowTemplateNameModal(false)
          setTemplateLogData(null)
        }}
      />
    </div>
  )
}
