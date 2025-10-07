import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { useDevices } from '../hooks/useDevices'
import { useHouseholdUsers } from '../hooks/useHouseholdUsers'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { toast } from 'sonner'
import {
  XMarkIcon,
  BoltIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface BulkEnergyEntryProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const RATE_PERIODS = [
  { value: 'super_off_peak', label: 'Super Off-Peak', rate: 0.10, hours: '12:00 AM - 6:00 AM' },
  { value: 'off_peak', label: 'Off-Peak', rate: 0.25, hours: '6:00 AM - 2:00 PM & 9:00 PM - 12:00 AM' },
  { value: 'mid_peak', label: 'Mid-Peak', rate: 0.35, hours: '2:00 PM - 4:00 PM' },
  { value: 'on_peak', label: 'On-Peak', rate: 0.50, hours: '4:00 PM - 9:00 PM' }
]

export function BulkEnergyEntry({ isOpen, onClose, onSuccess }: BulkEnergyEntryProps) {
  const { user } = useAuth()
  const { devices } = useDevices()
  const { users: householdUsers } = useHouseholdUsers()
  
  const [mode, setMode] = useState<'bulk' | 'daily'>('bulk')
  const [formData, setFormData] = useState({
    device_id: '',
    total_kwh: '',
    rate_period: 'off_peak',
    custom_rate: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    assigned_users: [] as string[],
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const selectedRate = RATE_PERIODS.find(r => r.value === formData.rate_period)
  const rateToUse = formData.custom_rate ? parseFloat(formData.custom_rate) : (selectedRate?.rate || 0)
  const totalCost = parseFloat(formData.total_kwh || '0') * rateToUse

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('household_id')
        .eq('id', user?.id)
        .single()

      if (!userData?.household_id) throw new Error('No household found')

      // For Quick kWh Entry, we bypass the automatic calculation and insert our own values
      // This prevents timeout issues with the trigger trying to calculate complex time ranges
      
      if (mode === 'bulk') {
        // Create a single bulk entry with manual cost calculation
        console.log('🔍 Bulk Entry - Inserting data:', {
          household_id: userData.household_id,
          device_id: formData.device_id,
          usage_date: formData.start_date,
          total_kwh: parseFloat(formData.total_kwh),
          calculated_cost: totalCost,
          source_type: 'manual'
        })

        const { data, error } = await supabase.from('energy_logs').insert({
          household_id: userData.household_id,
          device_id: formData.device_id,
          usage_date: formData.start_date,
          start_time: '00:00:00',
          end_time: '00:00:01', // Use minimal time range to avoid trigger timeout
          total_kwh: parseFloat(formData.total_kwh),
          calculated_cost: totalCost,
          rate_breakdown: JSON.stringify({
            type: 'bulk_entry',
            rate_period: formData.rate_period,
            rate: rateToUse,
            total_kwh: parseFloat(formData.total_kwh),
            date_range: {
              start: formData.start_date,
              end: formData.end_date
            },
            notes: formData.notes
          }),
          assigned_users: formData.assigned_users,
          created_by: user?.id,
          source_type: 'manual'
        }).select()

        console.log('🔍 Bulk Entry - Response:', { data, error })

        if (error) {
          console.error('❌ Bulk Entry - Error:', error)
          throw error
        }
        
        console.log('✅ Bulk Entry - Success! Data returned:', data)
        toast.success('Bulk entry created successfully!')
      } else {
        // Daily mode - create entry for single day with estimated times
        const defaultTimes = {
          super_off_peak: { start: '00:00:00', end: '06:00:00' },
          off_peak: { start: '21:00:00', end: '23:59:59' },
          mid_peak: { start: '14:00:00', end: '16:00:00' },
          on_peak: { start: '16:00:00', end: '21:00:00' }
        }

        const times = defaultTimes[formData.rate_period as keyof typeof defaultTimes] || { start: '00:00:00', end: '23:59:59' }

        const { error } = await supabase.from('energy_logs').insert({
          household_id: userData.household_id,
          device_id: formData.device_id,
          usage_date: formData.start_date,
          start_time: times.start,
          end_time: times.end,
          total_kwh: parseFloat(formData.total_kwh),
          calculated_cost: totalCost,
          rate_breakdown: JSON.stringify({
            type: 'quick_kwh_entry',
            rate_period: formData.rate_period,
            rate: rateToUse,
            total_kwh: parseFloat(formData.total_kwh),
            estimated_times: true,
            notes: formData.notes
          }),
          assigned_users: formData.assigned_users,
          created_by: user?.id,
          source_type: 'manual'
        })

        if (error) throw error
        toast.success('Quick entry created successfully!')
      }

      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      console.error('Error creating entry:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to create entry')
    } finally {
      setSubmitting(false)
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto">
      <div className="w-full sm:max-w-2xl min-h-screen sm:min-h-0 sm:my-4">
        <Card className="energy-card w-full bg-card border-0 sm:border border-border rounded-none sm:rounded-lg shadow-xl min-h-screen sm:min-h-0 sm:max-h-[90vh] flex flex-col">
          <CardHeader className="p-4 sm:p-5 md:p-6 border-b border-border flex-shrink-0 sticky top-0 bg-card z-10">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-lg sm:text-xl md:text-2xl text-foreground flex items-center gap-2 flex-1 min-w-0">
                <BoltIcon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 flex-shrink-0" />
                <span className="truncate">Quick Energy Entry</span>
              </CardTitle>
              <button onClick={onClose} className="p-2 h-9 w-9 sm:h-10 sm:w-10 border border-border rounded hover:bg-muted flex-shrink-0">
                <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              For when you know kWh but not exact times (e.g., Tesla charging data)
            </p>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 md:p-6 overflow-y-auto flex-1 min-h-0">
          {/* Mode Toggle */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
            <button
              type="button"
              onClick={() => setMode('bulk')}
              className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-bold transition-all border-2 ${
                mode === 'bulk' 
                  ? 'bg-purple-500 text-white border-purple-400 shadow-lg shadow-purple-500/50' 
                  : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Bulk Entry (Monthly Total)</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode('daily')}
              className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-bold transition-all border-2 ${
                mode === 'daily' 
                  ? 'bg-cyan-500 text-white border-cyan-400 shadow-lg shadow-cyan-500/50' 
                  : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Daily Entry (Per Day)</span>
              </div>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2.5 sm:p-3">
              <div className="flex gap-2">
                <InformationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-blue-300">
                  {mode === 'bulk' ? (
                    <>
                      <strong>Bulk Entry:</strong> Enter total kWh for a period (e.g., 435 kWh for last 31 days).
                      Perfect for Tesla app monthly totals.
                    </>
                  ) : (
                    <>
                      <strong>Daily Entry:</strong> Enter kWh for a single day. System uses typical times for the
                      selected rate period.
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Device */}
            <div>
              <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-foreground">
                Device *
              </label>
              <select
                value={formData.device_id}
                onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                className="w-full p-2.5 sm:p-3 text-sm sm:text-base border rounded-lg bg-background text-foreground border-border"
                required
              >
                <option value="">Select device (e.g., Tesla Model 3)</option>
                {devices.map(device => (
                  <option key={device.id} value={device.id}>
                    {device.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Total kWh */}
            <div>
              <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-foreground">
                Total kWh Used *
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.total_kwh}
                onChange={(e) => setFormData({ ...formData, total_kwh: e.target.value })}
                placeholder={mode === 'bulk' ? 'e.g., 435' : 'e.g., 14'}
                className="text-sm sm:text-base"
                required
              />
            </div>

            {/* Rate Period */}
            <div>
              <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-foreground">
                Rate Period *
              </label>
              <select
                value={formData.rate_period}
                onChange={(e) => setFormData({ ...formData, rate_period: e.target.value })}
                className="w-full p-2.5 sm:p-3 text-sm sm:text-base border rounded-lg bg-background text-foreground border-border"
                required
              >
                {RATE_PERIODS.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.label} (${period.rate}/kWh) - {period.hours}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Rate (Optional) */}
            <div>
              <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-foreground">
                Custom Rate (Optional)
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.custom_rate}
                onChange={(e) => setFormData({ ...formData, custom_rate: e.target.value })}
                placeholder="Override rate (e.g., 0.25)"
                className="text-sm sm:text-base"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank to use standard rate
              </p>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-foreground">
                  {mode === 'bulk' ? 'Period Start Date *' : 'Usage Date *'}
                </label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="text-sm sm:text-base"
                  required
                />
              </div>
              {mode === 'bulk' && (
                <div>
                  <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-foreground">
                    Period End Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="text-sm sm:text-base"
                    required
                  />
                </div>
              )}
            </div>

            {/* User Assignment */}
            {householdUsers.length > 0 && (
              <div>
                <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-foreground">
                  Assign to Users (Optional)
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

            {/* Notes */}
            <div>
              <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-foreground">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-2.5 sm:p-3 text-sm sm:text-base border rounded-lg bg-background text-foreground border-border"
                rows={2}
                placeholder="e.g., From Tesla app - last 31 days charging data"
              />
            </div>

            {/* Cost Preview */}
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 p-3 sm:p-4 rounded-lg">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm text-muted-foreground">Calculated Cost</div>
                  <div className="text-xl sm:text-2xl font-bold text-green-400 flex items-center gap-1.5 sm:gap-2">
                    <CurrencyDollarIcon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                    <span className="truncate">${totalCost.toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-right text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                  <div>{formData.total_kwh || '0'} kWh</div>
                  <div>@ ${rateToUse.toFixed(2)}/kWh</div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 sticky bottom-0 sm:static bg-card pb-2 sm:pb-0 -mx-4 sm:mx-0 px-4 sm:px-0 border-t sm:border-t-0 border-border">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1 py-2.5 sm:py-2 text-sm sm:text-base"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 energy-action-btn py-2.5 sm:py-2 text-sm sm:text-base"
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Entry'}
              </Button>
            </div>
          </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
