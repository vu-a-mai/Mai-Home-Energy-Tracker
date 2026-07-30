import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useDemoMode } from '../contexts/DemoContext'
import { supabase } from '../lib/supabase'
import { demoAddEnergyLog } from '../demo/demoStore'
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
import { BULK_RATE_PRESETS } from '../utils/rateCalculatorFixed'
import { todayLocal } from '../utils/dateUtils'

interface BulkEnergyEntryProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const RATE_PERIODS = BULK_RATE_PRESETS.map(p => ({
  value: p.value,
  label: p.label,
  rate: p.rate,
  hours: p.hours
}))

export function BulkEnergyEntry({ isOpen, onClose, onSuccess }: BulkEnergyEntryProps) {
  const { user } = useAuth()
  const { isDemoMode } = useDemoMode()
  const { devices } = useDevices()
  const { users: householdUsers } = useHouseholdUsers()
  
  const [mode, setMode] = useState<'bulk' | 'daily'>('bulk')
  const [formData, setFormData] = useState({
    device_id: '',
    total_kwh: '',
    rate_period: 'off_peak',
    custom_rate: '',
    start_date: todayLocal(),
    end_date: todayLocal(),
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
      const kwh = parseFloat(formData.total_kwh)
      const rateBreakdown = {
        type: mode === 'bulk' ? 'bulk_entry' : 'quick_kwh_entry',
        rate_period: formData.rate_period,
        rate: rateToUse,
        total_kwh: kwh,
        notes: formData.notes,
        ...(mode === 'bulk'
          ? { date_range: { start: formData.start_date, end: formData.end_date } }
          : { estimated_times: true })
      }

      if (isDemoMode) {
        const defaultTimes = {
          super_off_peak: { start: '00:00:00', end: '06:00:00' },
          off_peak: { start: '21:00:00', end: '23:59:59' },
          mid_peak: { start: '14:00:00', end: '16:00:00' },
          on_peak: { start: '16:00:00', end: '21:00:00' }
        }
        const times = mode === 'bulk'
          ? { start: '00:00:00', end: '00:00:01' }
          : (defaultTimes[formData.rate_period as keyof typeof defaultTimes] || { start: '00:00:00', end: '23:59:59' })

        demoAddEnergyLog({
          device_id: formData.device_id,
          usage_date: formData.start_date,
          start_time: times.start,
          end_time: times.end,
          assigned_users: formData.assigned_users,
          source_type: 'manual',
          total_kwh: kwh,
          calculated_cost: totalCost,
          rate_breakdown: rateBreakdown,
        })
        toast.success(mode === 'bulk' ? 'Bulk entry created successfully!' : 'Quick entry created successfully!')
        if (onSuccess) onSuccess()
        onClose()
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('household_id')
        .eq('id', user?.id)
        .single()

      if (!userData?.household_id) throw new Error('No household found')

      // For Quick kWh Entry, we bypass the automatic calculation and insert our own values
      // This prevents timeout issues with the trigger trying to calculate complex time ranges
      
      if (mode === 'bulk') {
        const { error } = await supabase.from('energy_logs').insert({
          household_id: userData.household_id,
          device_id: formData.device_id,
          usage_date: formData.start_date,
          start_time: '00:00:00',
          end_time: '00:00:01', // Use minimal time range to avoid trigger timeout
          total_kwh: kwh,
          calculated_cost: totalCost,
          rate_breakdown: JSON.stringify(rateBreakdown),
          assigned_users: formData.assigned_users,
          created_by: user?.id,
          source_type: 'manual'
        }).select()

        if (error) throw error
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
          total_kwh: kwh,
          calculated_cost: totalCost,
          rate_breakdown: JSON.stringify(rateBreakdown),
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
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-black/50 p-0 sm:p-4 overflow-y-auto overscroll-contain">
      <div className="w-full sm:max-w-2xl sm:my-4 flex flex-col max-h-[100dvh] sm:max-h-[min(90vh,100dvh)]">
        <Card className="energy-card flex flex-col w-full bg-card border-0 sm:border border-border rounded-none sm:rounded-lg shadow-xl min-h-0 max-h-[100dvh] sm:max-h-[min(90vh,100dvh)]">
        <CardHeader className="p-4 sm:p-5 md:p-6 border-b border-border flex-shrink-0 bg-slate-900 z-10">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-lg sm:text-xl md:text-2xl text-foreground flex items-center gap-2 flex-1 min-w-0">
                <BoltIcon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 flex-shrink-0" />
                <span className="truncate">Quick Energy Entry</span>
              </CardTitle>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close quick entry"
                className="p-2 h-11 w-11 sm:h-10 sm:w-10 border border-border rounded hover:bg-muted flex-shrink-0 inline-flex items-center justify-center"
              >
                <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Enter known kWh or bill chunks when you do not have exact start/end times.
              For accurate TOU pricing, use timed Add log instead.
            </p>
          </CardHeader>

          <CardContent className="px-4 pt-4 pb-0 sm:p-5 md:p-6 overflow-y-auto overscroll-contain flex-1 min-h-0">
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
                      <strong>Bulk Entry:</strong> Enter total kWh for a period (e.g., 435 kWh from an EV app).
                      Uses a typical rate-period window — not as accurate as timed Log Usage.
                    </>
                  ) : (
                    <>
                      <strong>Daily Entry:</strong> Enter kWh for a single day with a typical rate-period window.
                      Prefer timed Add log when you know exact hours.
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
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sticky bottom-0 z-20 sm:static bg-slate-900 py-3 sm:py-0 -mx-4 sm:m-0 px-4 sm:px-0 border-t sm:border-t-0 border-border shadow-[0_-10px_20px_rgba(2,6,23,0.85)] sm:shadow-none">
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
