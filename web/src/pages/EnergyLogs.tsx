import { useState, useMemo } from 'react'
import { useEnergyLogs } from '../hooks/useEnergyLogs'
import { useDevices } from '../hooks/useDevices'
import { useHouseholdUsers } from '../hooks/useHouseholdUsers'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { BackupRestore } from '../components/BackupRestore'
import { calculateUsageCost, getSeason } from '../utils/rateCalculator'
import { validateDate, validateTimeRange, validateUsageDuration } from '../utils/validation'
import type { BackupData } from '../utils/dataBackup'
import { supabase } from '../lib/supabaseClient'

interface EnergyLogFormData {
  device_id: string
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

// Helper function to get device-specific icon
const getDeviceIcon = (deviceName: string): string => {
  const name = deviceName.toLowerCase()
  if (name.includes('tv') || name.includes('television')) return '📺'
  if (name.includes('refrigerator') || name.includes('fridge')) return '🧊'
  if (name.includes('ac') || name.includes('air conditioner')) return '❄️'
  if (name.includes('tesla') || name.includes('charger') || name.includes('ev')) return '🔋'
  if (name.includes('gaming') || name.includes('pc') || name.includes('computer')) return '🖥️'
  if (name.includes('laptop')) return '💻'
  if (name.includes('hair dryer') || name.includes('dryer')) return '💨'
  if (name.includes('tablet') || name.includes('ipad')) return '📱'
  if (name.includes('work computer')) return '💼'
  return '🔌' // Default icon
}

// Helper function to get user icon
const getUserIcon = (userName: string): string => {
  const name = userName.toLowerCase()
  if (name.includes('vu')) return '👨'
  if (name.includes('thuy')) return '👩'
  if (name.includes('vy')) return '👧'
  if (name.includes('han')) return '👦'
  return '👤'
}

export default function EnergyLogs() {
  const { energyLogs, loading, addEnergyLog, updateEnergyLog, deleteEnergyLog, getTotalUsage, refreshEnergyLogs } = useEnergyLogs()
  const { devices, refreshDevices } = useDevices()
  const { users: householdUsers } = useHouseholdUsers()
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [editingLog, setEditingLog] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const logsPerPage = 10
  const [formData, setFormData] = useState<EnergyLogFormData>({
    device_id: '',
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
    startDate: '',
    endDate: '',
    users: [] as string[], // Changed to array for multi-select
    sortBy: 'date'
  })
  const [showUserFilter, setShowUserFilter] = useState(false)
  const [showRateBreakdown, setShowRateBreakdown] = useState(false)

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
    if (!validateForm()) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      if (editingLog) {
        // Update existing log
        await updateEnergyLog(editingLog, {
          ...formData,
          assigned_users: formData.assigned_users.length > 0 ? formData.assigned_users : undefined
        })
      } else {
        // Add new log
        await addEnergyLog({
          ...formData,
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

  const resetForm = () => {
    setFormData({
      device_id: '',
      usage_date: new Date().toISOString().split('T')[0],
      start_time: '',
      end_time: '',
      assigned_users: []
    })
    setFormErrors({})
    setSubmitError(null)
    setShowForm(false)
    setEditingLog(null)
  }

  const toggleUserAssignment = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      assigned_users: prev.assigned_users.includes(userId)
        ? prev.assigned_users.filter(id => id !== userId)
        : [...prev.assigned_users, userId]
    }))
  }

  const totalUsage = getTotalUsage()
  
  const filteredLogs = useMemo(() => {
    let filtered = [...energyLogs]
    
    if (filters.device) {
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
      start_time: log.start_time,
      end_time: log.end_time,
      assigned_users: log.assigned_users || []
    })
    setShowForm(true)
  }

  // Handle restore from backup
  const handleRestore = async (backupData: BackupData) => {
    if (!user) throw new Error('User not authenticated')

    try {
      // Get user's household_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('household_id')
        .eq('id', user.id)
        .single()

      if (userError) throw userError

      // Restore devices first
      for (const device of backupData.devices) {
        const { error } = await supabase
          .from('devices')
          .upsert({
            ...device,
            household_id: userData.household_id,
            created_by: user.id
          })

        if (error) console.error('Error restoring device:', error)
      }

      // Restore energy logs
      for (const log of backupData.energyLogs) {
        const { error } = await supabase
          .from('energy_logs')
          .upsert({
            ...log,
            household_id: userData.household_id,
            created_by: user.id
          })

        if (error) console.error('Error restoring energy log:', error)
      }

      // Refresh data
      await refreshDevices(false)
      await refreshEnergyLogs()
    } catch (error) {
      console.error('Restore failed:', error)
      throw error
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
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 md:mb-2 energy-pulse">
            📝 Energy Logs
          </h1>
          <p className="opacity-90 text-xs sm:text-sm md:text-base">
            Track and analyze device usage sessions
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="energy-action-btn px-4 sm:px-5 md:px-6 py-2.5 md:py-3 text-sm sm:text-base md:text-lg font-semibold whitespace-nowrap shrink-0"
        >
          + Log Usage
        </Button>
      </header>

      {/* Backup & Restore */}
      {user && (
        <BackupRestore
          devices={devices}
          energyLogs={energyLogs}
          householdId={user.id}
          onRestore={handleRestore}
        />
      )}

      {/* Summary Statistics - Color Coded */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 slide-up">
        <Card className="energy-card bg-gradient-to-br from-slate-500/10 to-gray-500/10 border-slate-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📊</span>
              <span className="text-xs text-muted-foreground font-semibold">Total Entries</span>
            </div>
            <div className="text-3xl font-bold text-slate-300">
              {filteredLogs.length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="energy-card bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⚡</span>
              <span className="text-xs text-muted-foreground font-semibold">Total Energy</span>
            </div>
            <div className="text-3xl font-bold text-green-400">
              {totalUsage.totalKwh.toFixed(1)} kWh
            </div>
          </CardContent>
        </Card>
        
        <Card className="energy-card bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">💰</span>
              <span className="text-xs text-muted-foreground font-semibold">Total Cost</span>
            </div>
            <div className="text-3xl font-bold text-red-400">
              ${totalUsage.totalCost.toFixed(2)}
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
                  <span className="text-lg">🔍</span>
                  <span className="text-sm">Filters</span>
                </div>
                <Button
                  onClick={() => {
                    setFilters({ device: '', startDate: '', endDate: '', users: [], sortBy: 'date' })
                    setShowUserFilter(false)
                  }}
                  variant="outline"
                  size="sm"
                  className="px-3 py-1.5 text-xs border-red-300 text-red-500 hover:bg-red-500/10 hover:border-red-400"
                >
                  ✕ Clear
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {/* User Filter */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs text-muted-foreground mb-1 block">👤 Users</label>
                  <button
                    type="button"
                    onClick={() => setShowUserFilter(true)}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background text-foreground border-border hover:border-primary/50"
                  >
                    {filters.users.length === 0 ? 'All' : 
                     filters.users.length === householdUsers.length ? 'All' :
                     `${filters.users.length} selected`}
                  </button>
                </div>
                
                {/* Device Filter */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs text-muted-foreground mb-1 block">🔌 Device</label>
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
                  <label className="text-xs text-muted-foreground mb-1 block">📅 From</label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    className="px-3 py-2 text-sm h-auto w-full"
                  />
                </div>
                
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs text-muted-foreground mb-1 block">📅 To</label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    className="px-3 py-2 text-sm h-auto w-full"
                  />
                </div>
                
                {/* Sort By */}
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">⬇️ Sort By</label>
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
                <span className="text-lg">🔍</span>
                <span>Filters:</span>
              </div>
              
              {/* User Filter - Modal Button */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground whitespace-nowrap">👤 Users:</label>
                <button
                  type="button"
                  onClick={() => setShowUserFilter(true)}
                  className="px-3 py-1.5 text-sm border rounded-lg bg-background text-foreground border-border hover:border-primary/50 min-w-[120px]"
                >
                  {filters.users.length === 0 ? 'All' : 
                   filters.users.length === householdUsers.length ? 'All' :
                   `${filters.users.length} selected`}
                </button>
              </div>
              
              {/* Device Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground whitespace-nowrap">🔌 Device:</label>
                <select
                  value={filters.device}
                  onChange={(e) => setFilters({...filters, device: e.target.value})}
                  className="px-3 py-1.5 text-sm border rounded-lg bg-background text-foreground border-border min-w-[160px]"
                >
                  <option value="">All Devices</option>
                  {devices.map(device => (
                    <option key={device.id} value={device.id}>{device.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Date Range */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground whitespace-nowrap">📅 From:</label>
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
                <label className="text-sm text-muted-foreground whitespace-nowrap">⬇️ Sort:</label>
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
                  setFilters({ device: '', startDate: '', endDate: '', users: [], sortBy: 'date' })
                  setShowUserFilter(false)
                }}
                variant="outline"
                size="sm"
                className="ml-auto px-4 py-1.5 text-sm border-red-300 text-red-500 hover:bg-red-500/10 hover:border-red-400"
              >
                ✕ Clear All
              </Button>
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
                    <span className="truncate">{editingLog ? '✏️ Edit Log' : '📝 Log Usage'}</span>
                    <Button
                      type="button"
                      onClick={() => setShowForm(false)}
                      variant="outline"
                      size="sm"
                      className="text-xs shrink-0 h-8"
                    >
                      ✕
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
                    <div className="font-semibold mb-1">⚠️ Error</div>
                    <div>{submitError}</div>
                  </div>
                )}
                
                {/* Warning if no household users */}
                {householdUsers.length === 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 p-3 rounded-lg text-sm">
                    <div className="font-semibold mb-1">⚠️ No Household Members Found</div>
                    <div>You may not be assigned to a household. Contact your administrator.</div>
                  </div>
                )}
                {/* Device Selection */}
                <div>
                  <label className="block mb-2 text-sm sm:text-base font-semibold text-foreground">
                    Device *
                  </label>
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
                          <div className="text-sm sm:text-base font-bold text-green-400">
                            💰 Cost: ${calculation.totalCost.toFixed(2)}
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowRateBreakdown(!showRateBreakdown)}
                            className="text-xs text-blue-400 hover:text-blue-300 underline"
                          >
                            {showRateBreakdown ? '▲ Hide' : '▼ Details'}
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>⚡ {calculation.totalKwh.toFixed(2)} kWh</span>
                          <span>⏱️ {calculation.durationHours.toFixed(1)}h</span>
                          <span>🌡️ {season}</span>
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
                    <label className="block mb-1.5 text-xs sm:text-sm font-semibold text-foreground">
                      👤 Assign to Users (optional)
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

      {/* Energy Logs List - Compact with Expandable Details */}
      <section className="space-y-3 slide-up">
        {paginatedLogs.map(log => {
          // Use database cost and calculate rate breakdown for display
          const usageCalc = calculateUsageCost(
            log.device_wattage || 0,
            log.start_time,
            log.end_time,
            log.usage_date
          )
          // Override with actual database cost
          usageCalc.totalCost = log.calculated_cost
          usageCalc.totalKwh = log.total_kwh
          
          const isExpanded = expandedLog === log.id
          
          return (
            <Card key={log.id} className="energy-card hover:border-primary/50 transition-all">
              <CardContent className="p-3 sm:p-4">
                {/* Mobile View */}
                <div className="lg:hidden">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-foreground truncate">
                        {getDeviceIcon(log.device_name || '')} {log.device_name || 'Unknown Device'}
                      </h4>
                      <div className="text-xs text-muted-foreground">{log.device_wattage}W</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-green-400">
                        ⚡ {usageCalc.totalKwh.toFixed(2)} kWh
                      </div>
                      <div className="text-sm font-bold text-red-400">
                        ${usageCalc.totalCost.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span>📅 {new Date(log.usage_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span>⏰ {formatTime12Hour(log.start_time)} - {formatTime12Hour(log.end_time)}</span>
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
                    {usageCalc.breakdown.map((period, idx) => (
                      <div key={idx} className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                        period.ratePeriod === 'Off-Peak' ? 'bg-green-500/20 text-green-400' :
                        period.ratePeriod === 'Mid-Peak' ? 'bg-yellow-500/20 text-yellow-400' :
                        period.ratePeriod === 'On-Peak' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {period.ratePeriod === 'Off-Peak' && '🟢'}
                        {period.ratePeriod === 'Mid-Peak' && '🟡'}
                        {period.ratePeriod === 'On-Peak' && '🔴'}
                        {period.ratePeriod === 'Super Off-Peak' && '🔵'}
                        {' '}{period.hours.toFixed(1)}h
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1 p-2 h-8 text-xs"
                      title={isExpanded ? "Hide details" : "View details"}
                    >
                      {isExpanded ? '▲ Hide' : '▼ Details'}
                    </Button>
                    <Button
                      onClick={() => handleEdit(log)}
                      variant="outline"
                      size="sm"
                      className="p-2 h-8 w-8 border-blue-300 text-blue-500 hover:bg-blue-500/10"
                      title="Edit log"
                    >
                      ✏️
                    </Button>
                    <Button
                      onClick={() => deleteEnergyLog(log.id)}
                      variant="outline"
                      size="sm"
                      className="p-2 h-8 w-8 border-red-300 text-red-500 hover:bg-red-500/10"
                      title="Delete log"
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
                
                {/* Desktop View */}
                <div className="hidden lg:flex items-center justify-between gap-4">
                  {/* Left: Device & Basic Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-foreground truncate">
                        {getDeviceIcon(log.device_name || '')} {log.device_name || 'Unknown Device'}
                      </h4>
                      <span className="text-xs text-muted-foreground">{log.device_wattage}W</span>
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
                      <span>📅 {new Date(log.usage_date + 'T00:00:00').toLocaleDateString()}</span>
                      <span>⏰ {formatTime12Hour(log.start_time)} - {formatTime12Hour(log.end_time)}</span>
                      <span>({usageCalc.durationHours.toFixed(1)}h)</span>
                    </div>
                  </div>
                  
                  {/* Center: Quick Rate Summary */}
                  <div className="flex items-center gap-2">
                    {usageCalc.breakdown.map((period, idx) => (
                      <div key={idx} className={`px-2 py-1 rounded text-xs font-semibold ${
                        period.ratePeriod === 'Off-Peak' ? 'bg-green-500/20 text-green-400' :
                        period.ratePeriod === 'Mid-Peak' ? 'bg-yellow-500/20 text-yellow-400' :
                        period.ratePeriod === 'On-Peak' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {period.ratePeriod === 'Off-Peak' && '🟢'}
                        {period.ratePeriod === 'Mid-Peak' && '🟡'}
                        {period.ratePeriod === 'On-Peak' && '🔴'}
                        {period.ratePeriod === 'Super Off-Peak' && '🔵'}
                        {' '}{period.hours.toFixed(1)}h
                      </div>
                    ))}
                  </div>
                  
                  {/* Right: Total & Actions */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-400">
                        ⚡ {usageCalc.totalKwh.toFixed(2)} kWh
                      </div>
                      <div className="text-lg font-bold text-red-400">
                        💰 ${usageCalc.totalCost.toFixed(2)}
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
                        {isExpanded ? '▲' : '▼'}
                      </Button>
                      <Button
                        onClick={() => handleEdit(log)}
                        variant="outline"
                        size="sm"
                        className="p-2 h-8 w-8 border-blue-300 text-blue-500 hover:bg-blue-500/10"
                        title="Edit log"
                      >
                        ✏️
                      </Button>
                      <Button
                        onClick={() => deleteEnergyLog(log.id)}
                        variant="outline"
                        size="sm"
                        className="p-2 h-8 w-8 border-red-300 text-red-500 hover:bg-red-500/10"
                        title="Delete log"
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    <div className="text-sm font-bold text-foreground">Detailed Rate Breakdown:</div>
                    <div className="space-y-2">
                      {usageCalc.breakdown.map((period, idx) => {
                        const bgColor = period.ratePeriod === 'Off-Peak' ? 'bg-green-500/10' :
                                       period.ratePeriod === 'Mid-Peak' ? 'bg-yellow-500/10' :
                                       period.ratePeriod === 'On-Peak' ? 'bg-red-500/10' : 'bg-blue-500/10'
                        const textColor = period.ratePeriod === 'Off-Peak' ? 'text-green-400' :
                                         period.ratePeriod === 'Mid-Peak' ? 'text-yellow-400' :
                                         period.ratePeriod === 'On-Peak' ? 'text-red-400' : 'text-blue-400'
                        return (
                          <div key={idx} className={`${bgColor} rounded-lg p-3 space-y-1`}>
                            <div className="flex items-center justify-between">
                              <span className={`font-bold text-sm ${textColor}`}>
                                {period.ratePeriod === 'Off-Peak' && '🟢'}
                                {period.ratePeriod === 'Mid-Peak' && '🟡'}
                                {period.ratePeriod === 'On-Peak' && '🔴'}
                                {period.ratePeriod === 'Super Off-Peak' && '🔵'}
                                {' '}{period.ratePeriod}
                              </span>
                              <span className="text-xs text-muted-foreground font-semibold">
                                @ ${period.rate.toFixed(2)}/kWh
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatTime12Hour(period.startTime)} - {formatTime12Hour(period.endTime)} ({period.hours.toFixed(1)}h)
                            </div>
                            <div className="text-sm text-foreground font-mono font-semibold">
                              {period.kwh.toFixed(2)} kWh × ${period.rate.toFixed(2)} = ${period.cost.toFixed(2)}
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
          <div className="text-6xl mb-4 energy-pulse">📝</div>
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
                <h3 className="text-xl font-bold text-foreground">👤 Filter by Users</h3>
                <button
                  onClick={() => setShowUserFilter(false)}
                  className="p-2 h-8 w-8 border border-border rounded hover:bg-muted"
                >
                  ✕
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
                  ✕ Clear All
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
    </div>
  )
}
