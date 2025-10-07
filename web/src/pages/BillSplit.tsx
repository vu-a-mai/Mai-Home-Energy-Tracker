import { useState, useMemo, useEffect } from 'react'
import { useEnergyLogs } from '../hooks/useEnergyLogs'
import { useDevices } from '../hooks/useDevices'
import { useHouseholdUsers } from '../hooks/useHouseholdUsers'
import { useDemoMode } from '../contexts/DemoContext'
import { useBillSplits } from '../contexts/BillSplitContext'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog'
import { validateAmount, validateDateRange } from '../utils/validation'
import { calculateUsageCost } from '../utils/rateCalculatorFixed'
import { logger } from '../utils/logger'
import {
  CurrencyDollarIcon,
  PlusIcon,
  TrashIcon,
  CalendarIcon,
  UsersIcon,
  ChartBarIcon,
  UserIcon,
  BoltIcon,
  HomeIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  DocumentArrowDownIcon,
  CloudArrowDownIcon,
  FolderIcon,
  DocumentTextIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface BillSplitData {
  billingPeriod: string
  totalBillAmount: number
  personalCosts: { [userId: string]: number }
  personalKwh: { [userId: string]: number }
  sharedCost: number
  finalAmounts: { [userId: string]: number }
  totalTrackedCosts: number
  totalTrackedKwh: number
}

interface BillFormData {
  startDate: string
  endDate: string
  totalAmount: number
  splitMethod: 'even' | 'usage_based'
}

// Helper function to get user icon
const getUserIcon = (userName: string): JSX.Element => {
  const name = userName.toLowerCase()
  const iconClass = "w-4 h-4 inline-block"
  
  if (name.includes('vu')) return <UserIcon className={`${iconClass} text-green-400`} />
  if (name.includes('thuy')) return <UserIcon className={`${iconClass} text-purple-400`} />
  if (name.includes('vy')) return <UserIcon className={`${iconClass} text-pink-400`} />
  if (name.includes('han')) return <UserIcon className={`${iconClass} text-blue-400`} />
  return <UserIcon className={`${iconClass} text-slate-400`} /> // Default icon
}

export default function BillSplit() {
  const { getLogsByDateRange } = useEnergyLogs()
  const { devices, refreshDevices } = useDevices()
  const { users: householdUsers } = useHouseholdUsers()
  const { isDemoMode } = useDemoMode()
  const { billSplits: savedBillSplits, saveBillSplit, deleteBillSplit, loading: billSplitsLoading } = useBillSplits()
  
  // State for period-specific data
  const [periodLogs, setPeriodLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  
  // Get current month's date range
  const getCurrentMonthRange = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0]
    }
  }
  
  const currentMonth = getCurrentMonthRange()
  
  const [formData, setFormData] = useState<BillFormData>({
    startDate: currentMonth.start,
    endDate: currentMonth.end,
    totalAmount: isDemoMode ? 555 : 0, // Demo mode shows 555, live mode starts at 0
    splitMethod: 'usage_based' // Default to usage-based split
  })
  const [formErrors, setFormErrors] = useState<Partial<BillFormData>>({})
  const [showResults, setShowResults] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [viewingBillSplit, setViewingBillSplit] = useState<typeof savedBillSplits[0] | null>(null)
  const [deletingBillSplit, setDeletingBillSplit] = useState<typeof savedBillSplits[0] | null>(null)

  // Auto-show results in demo mode only
  useEffect(() => {
    if (isDemoMode && !showResults) {
      const logs = getLogsByDateRange(formData.startDate, formData.endDate)
      setPeriodLogs(logs)
      setShowResults(true)
    }
  }, [isDemoMode, formData.startDate, formData.endDate, getLogsByDateRange])

  const validateForm = (): boolean => {
    const errors: Partial<BillFormData> = {}
    
    if (!formData.startDate) {
      errors.startDate = 'Start date is required'
    }
    if (!formData.endDate) {
      errors.endDate = 'End date is required'
    }
    
    // Validate date range (custom validation for bill splits)
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.endDate)
      
      if (isNaN(start.getTime())) {
        errors.startDate = 'Invalid start date format'
      }
      if (isNaN(end.getTime())) {
        errors.endDate = 'Invalid end date format'
      }
      
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        if (end <= start) {
          errors.endDate = 'End date must be after start date'
        }
        
        // Check if range is too long (more than 1 year)
        const oneYearLater = new Date(start)
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1)
        if (end > oneYearLater) {
          errors.endDate = 'Date range cannot exceed 1 year'
        }
      }
    }
    
    // Validate amount
    const amountValidation = validateAmount(formData.totalAmount)
    if (!amountValidation.valid) {
      errors.totalAmount = amountValidation.error as any
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const calculateBillSplit = useMemo((): BillSplitData | null => {
    if (!showResults) return null
    
    // Calculate personal costs and kWh for each user
    const personalCosts: { [userId: string]: number } = {}
    const personalKwh: { [userId: string]: number } = {}
    let totalTrackedCosts = 0
    let totalSharedDeviceCosts = 0

    // Initialize personal costs and kWh
    householdUsers.forEach(user => {
      personalCosts[user.id] = 0
      personalKwh[user.id] = 0
    })

    // If split method is "even", just divide total bill evenly
    if (formData.splitMethod === 'even') {
      const evenSplit = formData.totalAmount / householdUsers.length
      const finalAmounts: { [userId: string]: number } = {}
      
      householdUsers.forEach(user => {
        finalAmounts[user.id] = evenSplit
      })

      return {
        billingPeriod: `${formData.startDate} to ${formData.endDate}`,
        totalBillAmount: formData.totalAmount,
        personalCosts,
        personalKwh,
        sharedCost: formData.totalAmount, // All is shared in even split
        finalAmounts,
        totalTrackedCosts: 0,
        totalTrackedKwh: 0
      }
    }

    // Usage-based split: Calculate costs from energy logs using live rate calculator
    periodLogs.forEach(log => {
      const device = devices.find(d => d.id === log.device_id)
      
      // Calculate actual cost using rate calculator
      const calc = calculateUsageCost(
        device?.wattage || 0,
        log.start_time,
        log.end_time,
        log.usage_date
      )
      
      // Use stored values if available (from bulk entry), otherwise use calculated values
      const totalCost = log.calculated_cost ?? calc.totalCost
      const totalKwh = log.total_kwh ?? calc.totalKwh
      
      // Check both is_shared (boolean) and sharing_type (text) for compatibility
      const isSharedDevice = device?.is_shared === true || (device as any)?.sharing_type === 'shared'
      
      // If device is shared AND has assigned users, split among them
      if (device && isSharedDevice && log.assigned_users && log.assigned_users.length > 0) {
        const costPerUser = totalCost / log.assigned_users.length
        const kwhPerUser = totalKwh / log.assigned_users.length
        
        log.assigned_users.forEach((userId: string) => {
          personalCosts[userId] = (personalCosts[userId] || 0) + costPerUser
          personalKwh[userId] = (personalKwh[userId] || 0) + kwhPerUser
        })
        
        totalTrackedCosts += totalCost
        totalSharedDeviceCosts += totalCost
      } else if (log.assigned_users && log.assigned_users.length > 0) {
        // Has assigned users (personal device) - credit to assigned user(s)
        const costPerUser = totalCost / log.assigned_users.length
        const kwhPerUser = totalKwh / log.assigned_users.length
        
        log.assigned_users.forEach((userId: string) => {
          personalCosts[userId] = (personalCosts[userId] || 0) + costPerUser
          personalKwh[userId] = (personalKwh[userId] || 0) + kwhPerUser
        })
        
        totalTrackedCosts += totalCost
      } else {
        // Fallback: no assigned users - credit to creator
        const userId = log.created_by || householdUsers[0]?.id || 'unknown'
        personalCosts[userId] = (personalCosts[userId] || 0) + totalCost
        personalKwh[userId] = (personalKwh[userId] || 0) + totalKwh
        totalTrackedCosts += totalCost
      }
    })

    // Remaining amount after all logged usage is split evenly (base charges, taxes, etc.)
    const remainingAmount = Math.max(0, formData.totalAmount - totalTrackedCosts)
    const sharedCostPerUser = remainingAmount / householdUsers.length

    // Calculate final amounts owed by each user
    const finalAmounts: { [userId: string]: number } = {}
    householdUsers.forEach(user => {
      finalAmounts[user.id] = personalCosts[user.id] + sharedCostPerUser
    })

    const result = {
      billingPeriod: `${formData.startDate} to ${formData.endDate}`,
      totalBillAmount: formData.totalAmount,
      personalCosts,
      personalKwh,
      sharedCost: remainingAmount,
      finalAmounts,
      totalTrackedCosts,
      totalTrackedKwh: Object.values(personalKwh).reduce((sum, kwh) => sum + kwh, 0)
    }
    
    return result
  }, [showResults, formData, periodLogs, devices, householdUsers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    
    // Force refresh devices to clear cache and get latest data
    await refreshDevices(false) // false = bypass cache
    
    // Fetch logs for the billing period
    setLoadingLogs(true)
    try {
      const logs = getLogsByDateRange(formData.startDate, formData.endDate)
      setPeriodLogs(logs)
      setShowResults(true)
    } catch (error) {
      logger.error('Error fetching logs:', error)
    } finally {
      setLoadingLogs(false)
    }
  }

  const handleSaveBillSplit = async () => {
    if (!calculateBillSplit) return
    
    setSaving(true)
    try {
      // Convert to database format
      const userAllocations: any = {}
      householdUsers.forEach(user => {
        userAllocations[user.id] = {
          personalCost: calculateBillSplit.personalCosts[user.id] || 0,
          sharedCost: calculateBillSplit.sharedCost / householdUsers.length,
          totalOwed: calculateBillSplit.finalAmounts[user.id] || 0
        }
      })
      
      // Extract month and year from END date (when bill is received)
      const [yearStr, monthStr] = formData.endDate.split('-')
      const month = parseInt(monthStr, 10)
      const year = parseInt(yearStr, 10)
      
      await saveBillSplit({
        month,
        year,
        billing_period_start: formData.startDate,
        billing_period_end: formData.endDate,
        total_bill_amount: formData.totalAmount,
        split_method: formData.splitMethod,
        user_allocations: userAllocations
      })
      
      toast.success('Bill split saved successfully!')
      
      // Reset form
      setShowResults(false)
      setFormData({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        totalAmount: 0,
        splitMethod: 'usage_based'
      })
    } catch (error) {
      logger.error('Error saving bill split:', error)
      toast.error('Failed to save bill split. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteBillSplit = async () => {
    if (!deletingBillSplit) return
    
      try {
      await deleteBillSplit(deletingBillSplit.id)
        toast.success('Bill split deleted successfully!')
      setDeletingBillSplit(null)
      setViewingBillSplit(null)
      } catch (error) {
        logger.error('Error deleting bill split:', error)
        toast.error('Failed to delete bill split. Please try again.')
      }
    }

  // Get available years from saved bill splits (data-driven)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const years = new Set<number>()
    
    // Add years from saved bill splits
    savedBillSplits.forEach(split => years.add(split.year))
    
    // Always include current year even if no data yet
    years.add(currentYear)
    
    return Array.from(years).sort((a, b) => b - a) // Descending order
  }, [savedBillSplits])

  // Get bill split for a specific month and year
  const getBillSplitForMonth = (month: number, year: number) => {
    return savedBillSplits.find(split => split.month === month && split.year === year)
  }

  // Month names for display
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Calculate usage statistics for a bill split
  const calculateUsageStats = (split: typeof savedBillSplits[0]) => {
    const logs = getLogsByDateRange(split.billing_period_start, split.billing_period_end)
    logger.debug(`📊 Bill Split Details:`)
    logger.debug(`- Month/Year: ${monthNames[split.month - 1]} ${split.year}`)
    logger.debug(`- Billing Period: ${split.billing_period_start} to ${split.billing_period_end}`)
    logger.debug(`- Energy Logs Found: ${logs.length}`)
    logger.debug(`- Total Bill: $${split.total_bill_amount.toFixed(2)}`)
    
    // Group by user and rate period
    const userStats: Record<string, {
      totalKwh: number
      offPeak: { kwh: number, cost: number }
      onPeak: { kwh: number, cost: number }
      midPeak: { kwh: number, cost: number }
      superOffPeak: { kwh: number, cost: number }
    }> = {}

    householdUsers.forEach(user => {
      userStats[user.id] = {
        totalKwh: 0,
        offPeak: { kwh: 0, cost: 0 },
        onPeak: { kwh: 0, cost: 0 },
        midPeak: { kwh: 0, cost: 0 },
        superOffPeak: { kwh: 0, cost: 0 }
      }
    })

    logs.forEach(log => {
      const device = devices.find(d => d.id === log.device_id)
      if (!device) return

      const assignedUsers = log.assigned_users && log.assigned_users.length > 0 
        ? log.assigned_users 
        : [log.created_by]

      const kwh = log.total_kwh || 0
      const cost = log.calculated_cost || 0
      const kwPerUser = kwh / assignedUsers.length
      const costPerUser = cost / assignedUsers.length

      // Calculate rate breakdown
      const calculation = calculateUsageCost(
        device.wattage,
        log.start_time,
        log.end_time,
        log.usage_date
      )

      assignedUsers.forEach((userId: string) => {
        if (userStats[userId]) {
          // Calculate total kWh from the breakdown (more accurate than log.total_kwh)
          let totalKwhForThisLog = 0

          calculation.breakdown.forEach(period => {
            const periodKwh = period.kwh / assignedUsers.length
            const periodCost = period.cost / assignedUsers.length

            // Add to total
            totalKwhForThisLog += periodKwh

            if (period.ratePeriod === 'Off-Peak') {
              userStats[userId].offPeak.kwh += periodKwh
              userStats[userId].offPeak.cost += periodCost
            } else if (period.ratePeriod === 'On-Peak') {
              userStats[userId].onPeak.kwh += periodKwh
              userStats[userId].onPeak.cost += periodCost
            } else if (period.ratePeriod === 'Mid-Peak') {
              userStats[userId].midPeak.kwh += periodKwh
              userStats[userId].midPeak.cost += periodCost
            } else if (period.ratePeriod === 'Super Off-Peak') {
              userStats[userId].superOffPeak.kwh += periodKwh
              userStats[userId].superOffPeak.cost += periodCost
            }
          })

          // Update total kWh with calculated value
          userStats[userId].totalKwh += totalKwhForThisLog
        }
      })
    })

    // Log summary
    const totalKwhCalculated = Object.values(userStats).reduce((sum, stat) => sum + stat.totalKwh, 0)
    logger.debug(`- Total kWh Calculated: ${totalKwhCalculated.toFixed(2)}`)
    logger.debug('- Per User:')
    householdUsers.forEach(user => {
      const stats = userStats[user.id]
      if (stats) {
        logger.debug(`  ${user.name}: ${stats.totalKwh.toFixed(2)} kWh`)
      }
    })

    return userStats
  }

  const exportBillSplit = () => {
    if (!calculateBillSplit) return
    
    const content = `
Mai Family Energy Bill Split
${calculateBillSplit.billingPeriod}

Total Bill: $${calculateBillSplit.totalBillAmount.toFixed(2)}
Shared Amount: $${calculateBillSplit.sharedCost.toFixed(2)}

Breakdown by User:
${householdUsers.map(user => 
  `${user.name}: Personal $${calculateBillSplit.personalCosts[user.id].toFixed(2)} + Shared $${(calculateBillSplit.sharedCost / householdUsers.length).toFixed(2)} = $${calculateBillSplit.finalAmounts[user.id].toFixed(2)}`
).join('\n')}
`
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bill-split-${calculateBillSplit.billingPeriod.replace(/ /g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-7xl mx-auto p-3 md:p-5 min-h-screen bg-background text-foreground font-sans fade-in">
      {/* Header */}
      <header className="flex justify-center items-center mb-6 md:mb-8 p-4 md:p-6 energy-header-gradient rounded-2xl text-white shadow-xl energy-glow">
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 energy-pulse flex items-center gap-2">
            <CurrencyDollarIcon className="w-7 h-7 md:w-8 md:h-8 text-green-400" />
            Bill Split Calculator
          </h1>
          <p className="opacity-90 text-sm md:text-base">
            Fairly allocate electricity costs among family members
          </p>
        </div>
      </header>

      {/* Bill Input Form - Responsive Design */}
      <section className="mb-4 slide-up">
        <Card className="energy-card">
          <CardContent className="p-3 md:p-4">
            <form onSubmit={handleSubmit}>
              {/* Title */}
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm md:text-base mb-3">
                <CalendarIcon className="w-5 h-5 text-blue-400" />
                <span>Bill Period:</span>
              </div>
              
              {/* Form Fields Grid - Fully Responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
                {/* Billing Period Start */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs md:text-sm text-muted-foreground font-medium flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3 text-blue-400" />
                    From:
                  </label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className={`px-2 md:px-3 py-2 text-xs md:text-sm ${formErrors.startDate ? 'border-red-500' : ''}`}
                  />
                </div>

                {/* Billing Period End */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs md:text-sm text-muted-foreground font-medium flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3 text-blue-400" />
                    To:
                  </label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className={`px-2 md:px-3 py-2 text-xs md:text-sm ${formErrors.endDate ? 'border-red-500' : ''}`}
                  />
                </div>

                {/* Total Bill Amount */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs md:text-sm text-muted-foreground font-medium flex items-center gap-1">
                    <CurrencyDollarIcon className="w-4 h-4 text-green-400" />
                    Total:
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.totalAmount || ''}
                    onChange={(e) => setFormData({...formData, totalAmount: parseFloat(e.target.value) || 0})}
                    placeholder="e.g., 245.67"
                    className={`px-2 md:px-3 py-2 text-xs md:text-sm ${formErrors.totalAmount ? 'border-red-500' : ''}`}
                  />
                </div>

                {/* Split Method */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs md:text-sm text-muted-foreground font-medium flex items-center gap-1">
                    <UsersIcon className="w-4 h-4 text-cyan-400" />
                    Method:
                  </label>
                  <select
                    value={formData.splitMethod}
                    onChange={(e) => setFormData({...formData, splitMethod: e.target.value as 'even' | 'usage_based'})}
                    className="px-2 md:px-3 py-2 text-xs md:text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring h-[38px]"
                  >
                    <option value="usage_based">Usage-Based</option>
                    <option value="even">Even Split</option>
                  </select>
                </div>

                {/* Calculate Button */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs md:text-sm text-transparent font-medium">Action</label>
                  <Button
                    type="submit"
                    className="energy-action-btn px-4 py-2 text-xs md:text-sm w-full h-[38px]"
                  >
                    <ChartBarIcon className="w-4 h-4 inline-block mr-1" />
                    Calculate
                  </Button>
                </div>
              </div>
              
              {/* Error Messages */}
              {(formErrors.startDate || formErrors.endDate || formErrors.totalAmount) && (
                <div className="mt-2 text-sm text-red-500">
                  {formErrors.startDate || formErrors.endDate || formErrors.totalAmount}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </section>

      {/* Bill Split Results Modal */}
      <Dialog open={showResults && !!calculateBillSplit} onOpenChange={(open) => !open && setShowResults(false)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-900 border-2 border-green-600">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <ArrowTrendingUpIcon className="w-7 h-7 text-green-400" />
                  Bill Split Results
                  <Badge 
                    variant={formData.splitMethod === 'even' ? 'secondary' : 'default'}
                    className={`text-sm ${
                      formData.splitMethod === 'even' 
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/50' 
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                    }`}
                  >
                    {formData.splitMethod === 'even' ? '⚖️ Even Split' : '⚡ Usage-Based'}
                  </Badge>
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Detailed breakdown of energy costs for the billing period
            </DialogDescription>
          </DialogHeader>
          
          {calculateBillSplit && (
            <div className="space-y-4">

              {/* Summary - Color Coded */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Billing Period */}
                <Card className="energy-card bg-gradient-to-br from-slate-500/10 to-gray-500/10 border-slate-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarIcon className="w-6 h-6 md:w-7 md:h-7 text-blue-400" />
                      <span className="text-xs text-muted-foreground font-semibold">Billing Period</span>
                    </div>
                    <div className="font-bold text-slate-300">
                      {calculateBillSplit.billingPeriod}
                    </div>
                  </CardContent>
                </Card>

                {/* Total Bill */}
                <Card className="energy-card bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CurrencyDollarIcon className="w-6 h-6 md:w-7 md:h-7 text-green-400" />
                      <span className="text-xs text-muted-foreground font-semibold">Total Bill</span>
                    </div>
                    <div className="font-bold text-2xl text-red-400">
                      ${calculateBillSplit.totalBillAmount.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>

                {/* Shared Amount */}
                <Card className="energy-card bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <HomeIcon className="w-6 h-6 md:w-7 md:h-7 text-cyan-400" />
                      <span className="text-xs text-muted-foreground font-semibold">Shared Amount</span>
                    </div>
                    <div className="font-bold text-xl text-blue-400">
                      ${calculateBillSplit.sharedCost.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>

                {/* Per Person */}
                <Card className="energy-card bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <UsersIcon className="w-7 h-7 text-cyan-400" />
                      <span className="text-xs text-muted-foreground font-semibold">Per Person (Shared)</span>
                    </div>
                    <div className="font-bold text-xl text-green-400">
                      ${(calculateBillSplit.sharedCost / householdUsers.length).toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Usage Summary */}
              <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 p-4 rounded-lg border border-slate-600/50 mb-6">
                <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                  <ChartBarIcon className="w-5 h-5 text-blue-400" />
                  Usage Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-yellow-400 font-bold text-xl">
                      {calculateBillSplit.totalTrackedKwh.toFixed(2)} kWh
                    </div>
                    <div className="text-muted-foreground">Total Tracked Usage</div>
                  </div>
                  <div className="text-center">
                    <div className="text-blue-400 font-bold text-xl">
                      ${calculateBillSplit.totalTrackedCosts.toFixed(2)}
                    </div>
                    <div className="text-muted-foreground">Total Tracked Cost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-bold text-xl">
                      ${calculateBillSplit.sharedCost.toFixed(2)}
                    </div>
                    <div className="text-muted-foreground">Untracked (Base Charges)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-red-400 font-bold text-xl">
                      ${calculateBillSplit.totalBillAmount.toFixed(2)}
                    </div>
                    <div className="text-muted-foreground">Total Bill</div>
                  </div>
                </div>
              </div>

              {/* Individual Breakdowns - Compact Design */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {householdUsers.map(user => (
                  <Card key={user.id} className="energy-card hover:border-primary/50 transition-all">
                    <CardContent className="p-4">
                      {/* User Header */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">{getUserIcon(user.name)}</span>
                        <h3 className="font-bold text-foreground">{user.name}</h3>
                      </div>
                      
                      {/* Cost Breakdown */}
                      <div className="space-y-2 mb-3">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <BoltIcon className="w-3 h-3 text-orange-400" />
                              Personal Usage:
                            </span>
                            <span className="font-semibold text-yellow-400">
                              {calculateBillSplit.personalKwh[user.id].toFixed(2)} kWh
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <CurrencyDollarIcon className="w-3 h-3 text-green-400" />
                              Personal Cost:
                            </span>
                            <span className="font-semibold text-blue-400">
                              ${calculateBillSplit.personalCosts[user.id].toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <HomeIcon className="w-3 h-3 text-cyan-400" />
                            Shared:
                          </span>
                          <span className="font-semibold text-green-400">
                            ${(calculateBillSplit.sharedCost / householdUsers.length).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Total */}
                      <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 p-3 rounded-lg border border-red-500/30">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                            <CurrencyDollarIcon className="w-3 h-3 text-green-400" />
                            Total Owed:
                          </span>
                          <span className="text-xl font-bold text-red-400">
                            ${calculateBillSplit.finalAmounts[user.id].toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-700">
                <Button
                  onClick={exportBillSplit}
                  variant="outline"
                  className="bg-green-600 hover:bg-green-700 text-white border-green-600 flex items-center gap-2"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  Export
                </Button>
                <Button
                  onClick={handleSaveBillSplit}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-none flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CloudArrowDownIcon className="w-5 h-5" />
                      Save
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowResults(false)}
                  variant="outline"
                  className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bill Split History - Yearly Calendar View */}
        <section className="mb-6 slide-up">
          <Card className="energy-card">
            <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="flex-1">
              <CardTitle className="text-lg md:text-xl text-foreground flex items-center gap-2">
                <FolderIcon className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
                Bill Split History
              </CardTitle>
              <CardDescription className="text-xs md:text-sm mt-1">
                  View and manage your monthly bill splits for {selectedYear}
                  {(() => {
                    const count = savedBillSplits.filter(split => split.year === selectedYear).length
                    return count > 0 ? ` • ${count} month${count !== 1 ? 's' : ''} recorded` : ' • No data yet'
                  })()}
              </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs md:text-sm text-muted-foreground font-semibold whitespace-nowrap flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  Year:
                </span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-gradient-to-r from-slate-800 to-slate-700 border-2 border-slate-600 hover:border-slate-500 rounded-lg px-3 md:px-4 py-1.5 md:py-2 text-sm md:text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year} className="bg-slate-800">
                      {year} {year === new Date().getFullYear() ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            </CardHeader>
            <CardContent>
            {/* 12-Month Grid - Compact & Modern */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 12 }, (_, index) => {
                const month = index + 1
                const split = getBillSplitForMonth(month, selectedYear)
                const isCurrentMonth = month === new Date().getMonth() + 1 && selectedYear === new Date().getFullYear()
                  
                  return (
                  <div 
                    key={month} 
                    className={`relative group rounded-xl border-2 p-2.5 md:p-3 transition-all duration-300 ${
                      split 
                        ? 'bg-gradient-to-br from-emerald-950/90 via-green-900/60 to-teal-900/50 border-emerald-500/50 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-1' 
                        : 'bg-gradient-to-br from-slate-900/50 to-slate-800/30 border-slate-700/50 hover:border-slate-600'
                    } ${isCurrentMonth ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-950' : ''}`}
                  >
                    {/* Month Header - Compact */}
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs md:text-sm font-bold text-white">{monthNames[index]}</h3>
                        {isCurrentMonth && (
                          <div className="px-1 md:px-1.5 py-0.5 bg-blue-500 rounded text-[8px] md:text-[10px] font-bold text-white">NOW</div>
                        )}
                            </div>
                      {split && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeletingBillSplit(split)
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4 text-red-400" />
                        </button>
                      )}
                        </div>
                        
                    {/* Bill Split Data */}
                    {split ? (
                      <div className="space-y-2">
                        {/* Split Method Badge */}
                        <div className="flex flex-col gap-1">
                          <Badge 
                            variant={split.split_method === 'even' ? 'secondary' : 'default'}
                            className={`text-[8px] md:text-[9px] px-1.5 py-0.5 w-fit ${
                              split.split_method === 'even' 
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50' 
                                : 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                            }`}
                          >
                            {split.split_method === 'even' ? '⚖️ Even' : '⚡ Usage'}
                          </Badge>
                          {/* Billing Cycle Dates */}
                          <div className="text-[10px] md:text-xs text-slate-300 font-medium">
                            📅 {split.billing_period_start.split('-').slice(1).join('/')} - {split.billing_period_end.split('-').slice(1).join('/')}
                          </div>
                        </div>
                        
                        {/* Total Bill - Prominent */}
                        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-2 md:p-2.5 border border-emerald-500/30">
                          <div className="flex items-baseline justify-between">
                            <span className="text-[9px] md:text-[10px] text-emerald-300 font-semibold uppercase tracking-wide">Total</span>
                            <div className="text-lg md:text-xl font-bold text-emerald-400">
                              ${split.total_bill_amount.toFixed(0)}
                              <span className="text-xs md:text-sm text-emerald-300">.{split.total_bill_amount.toFixed(2).split('.')[1]}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* User Grid - Compact 2x2 */}
                        <div className="grid grid-cols-2 gap-1 md:gap-1.5">
                          {householdUsers.slice(0, 4).map(user => {
                              const userAllocation = split.user_allocations[user.id]
                              if (!userAllocation) return null
                              
                              return (
                                <div 
                                  key={user.id} 
                                className="bg-slate-800/50 backdrop-blur-sm rounded px-1.5 md:px-2 py-1 md:py-1.5 border border-slate-700/50"
                              >
                                <div className="text-[9px] md:text-[10px] text-slate-400 truncate">{getUserIcon(user.name)} {user.name}</div>
                                <div className="text-[10px] md:text-xs font-bold text-green-400">
                                        ${userAllocation.totalOwed.toFixed(2)}
                                    </div>
                                    </div>
                              )
                            })}
                                      </div>

                        {/* View Details Button - Sleek */}
                        <button
                          onClick={() => setViewingBillSplit(split)}
                          className="w-full py-1.5 px-2 md:px-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-[10px] md:text-[11px] font-semibold text-white transition-colors"
                        >
                          View Details →
                        </button>
                                  </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 md:py-6 opacity-50">
                        <DocumentTextIcon className="w-10 h-10 md:w-12 md:h-12 mb-1 text-slate-500" />
                        <div className="text-[9px] md:text-[10px] text-slate-500 font-medium">No data</div>
                      </div>
                    )}
                                </div>
                              )
                            })}
                          </div>

            {/* Empty State */}
            {savedBillSplits.length === 0 && (
              <div className="text-center py-8 md:py-12 px-4">
                <CalendarIcon className="w-16 h-16 md:w-20 md:h-20 mb-3 md:mb-4 energy-pulse text-blue-400 mx-auto opacity-50" />
                <h3 className="text-base md:text-lg font-bold text-foreground mb-2">No saved bill splits yet</h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Calculate and save your first bill split above to see it here
                </p>
                        </div>
            )}
                      </CardContent>
                    </Card>
        </section>

      {/* Bill Split Detail Modal */}
      <Dialog open={viewingBillSplit !== null} onOpenChange={() => setViewingBillSplit(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 p-3 md:p-4">
          {viewingBillSplit && (() => {
            const usageStats = calculateUsageStats(viewingBillSplit)
            const totalSharedCost = Object.values(viewingBillSplit.user_allocations).reduce((sum, alloc) => sum + alloc.sharedCost, 0)
            
            return (
              <>
                <DialogHeader className="pb-2">
                  <DialogTitle className="text-lg md:text-xl flex items-center gap-2 text-white">
                    <ChartBarIcon className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                    {monthNames[viewingBillSplit.month - 1]} {viewingBillSplit.year}
                    <Badge 
                      variant={viewingBillSplit.split_method === 'even' ? 'secondary' : 'default'}
                      className={`text-xs ${
                        viewingBillSplit.split_method === 'even' 
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/50' 
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                      }`}
                    >
                      {viewingBillSplit.split_method === 'even' ? '⚖️ Even Split' : '⚡ Usage-Based'}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Billing Period: {viewingBillSplit.billing_period_start} to {viewingBillSplit.billing_period_end}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                  {/* Top Summary Cards - 4 Column Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Billing Period */}
                    <Card className="energy-card bg-gradient-to-br from-slate-500/10 to-gray-500/10 border-slate-500/30">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CalendarIcon className="w-7 h-7 text-blue-400" />
                          <span className="text-xs text-muted-foreground font-semibold">Billing Period</span>
                        </div>
                        <div className="font-bold text-slate-300 text-sm">
                          {viewingBillSplit.billing_period_start} to {viewingBillSplit.billing_period_end}
              </div>
            </CardContent>
          </Card>

                    {/* Total Bill */}
                    <Card className="energy-card bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CurrencyDollarIcon className="w-7 h-7 text-green-400" />
                          <span className="text-xs text-muted-foreground font-semibold">Total Bill</span>
                        </div>
                        <div className="font-bold text-2xl text-red-400">
                          ${viewingBillSplit.total_bill_amount.toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Shared Amount */}
                    <Card className="energy-card bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <HomeIcon className="w-7 h-7 text-cyan-400" />
                          <span className="text-xs text-muted-foreground font-semibold">Shared Amount</span>
                        </div>
                        <div className="font-bold text-xl text-blue-400">
                          ${totalSharedCost.toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Per Person (Shared) */}
                    <Card className="energy-card bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <UsersIcon className="w-7 h-7 text-cyan-400" />
                          <span className="text-xs text-muted-foreground font-semibold">Per Person (Shared)</span>
                        </div>
                        <div className="font-bold text-xl text-green-400">
                          ${(totalSharedCost / householdUsers.length).toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Usage Summary Bar */}
                  {(() => {
                    const totalTrackedKwh = Object.values(usageStats).reduce((sum, stat) => sum + stat.totalKwh, 0)
                    const totalTrackedCost = Object.values(usageStats).reduce((sum, stat) => 
                      sum + stat.offPeak.cost + stat.onPeak.cost + stat.midPeak.cost + stat.superOffPeak.cost, 0
                    )
                    const untrackedCost = viewingBillSplit.total_bill_amount - totalTrackedCost
                    
                    return (
                      <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 p-4 rounded-lg border border-slate-600/50">
                        <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                          <ChartBarIcon className="w-5 h-5 text-blue-400" />
                          Usage Summary
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-yellow-400 font-bold text-2xl mb-1">{totalTrackedKwh.toFixed(2)} kWh</div>
                            <div className="text-muted-foreground">Total Tracked Usage</div>
                          </div>
                          <div className="text-center">
                            <div className="text-blue-400 font-bold text-2xl mb-1">${totalTrackedCost.toFixed(2)}</div>
                            <div className="text-muted-foreground">Total Tracked Cost</div>
                          </div>
                          <div className="text-center">
                            <div className="text-green-400 font-bold text-2xl mb-1">${untrackedCost.toFixed(2)}</div>
                            <div className="text-muted-foreground">Untracked (Base Charges)</div>
                          </div>
                          <div className="text-center">
                            <div className="text-red-400 font-bold text-2xl mb-1">${viewingBillSplit.total_bill_amount.toFixed(2)}</div>
                            <div className="text-muted-foreground">Total Bill</div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Individual User Details - Card Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {householdUsers.map(user => {
                      const userAllocation = viewingBillSplit.user_allocations[user.id]
                      if (!userAllocation) return null
                      
                      const userStat = usageStats[user.id]
                      const percentage = (userAllocation.totalOwed / viewingBillSplit.total_bill_amount) * 100
                      
                      return (
                        <Card key={user.id} className="energy-card bg-gradient-to-br from-slate-800/80 to-slate-900/60 border-slate-600">
                          <CardContent className="p-4">
                            {/* User Header */}
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-3xl">{getUserIcon(user.name)}</span>
                              <div className="flex-1">
                                <h3 className="font-bold text-xl text-white">{user.name}</h3>
                                <span className="text-sm text-yellow-300">({percentage.toFixed(1)}%)</span>
                              </div>
                            </div>

                            {/* Usage Stats Row */}
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              <div>
                                <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                                  <BoltIcon className="w-3 h-3 text-orange-400" />
                                  Personal Usage:
                                </div>
                                <div className="text-yellow-400 font-bold">{userStat.totalKwh.toFixed(2)} kWh</div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                                  <CurrencyDollarIcon className="w-3 h-3 text-green-400" />
                                  Personal Cost:
                                </div>
                                <div className="text-blue-400 font-bold">${userAllocation.personalCost.toFixed(2)}</div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                                  <HomeIcon className="w-3 h-3 text-cyan-400" />
                                  Shared:
                                </div>
                                <div className="text-green-400 font-bold">${userAllocation.sharedCost.toFixed(2)}</div>
                              </div>
                            </div>

                            {/* Rate Breakdown Badges */}
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {userStat.offPeak.kwh > 0 && (
                                <div className="bg-green-900/50 rounded px-2 py-1 border border-green-700 flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                  <span className="text-green-200 text-xs font-semibold">{userStat.offPeak.kwh.toFixed(1)} kWh</span>
                                  <span className="text-green-100 text-xs">${userStat.offPeak.cost.toFixed(2)}</span>
                                </div>
                              )}
                              {userStat.midPeak.kwh > 0 && (
                                <div className="bg-yellow-900/50 rounded px-2 py-1 border border-yellow-700 flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                  <span className="text-yellow-200 text-xs font-semibold">{userStat.midPeak.kwh.toFixed(1)} kWh</span>
                                  <span className="text-yellow-100 text-xs">${userStat.midPeak.cost.toFixed(2)}</span>
                                </div>
                              )}
                              {userStat.onPeak.kwh > 0 && (
                                <div className="bg-red-900/50 rounded px-2 py-1 border border-red-700 flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                  <span className="text-red-200 text-xs font-semibold">{userStat.onPeak.kwh.toFixed(1)} kWh</span>
                                  <span className="text-red-100 text-xs">${userStat.onPeak.cost.toFixed(2)}</span>
                                </div>
                              )}
                              {userStat.superOffPeak.kwh > 0 && (
                                <div className="bg-blue-900/50 rounded px-2 py-1 border border-blue-700 flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                  <span className="text-blue-200 text-xs font-semibold">{userStat.superOffPeak.kwh.toFixed(1)} kWh</span>
                                  <span className="text-blue-100 text-xs">${userStat.superOffPeak.cost.toFixed(2)}</span>
                                </div>
                              )}
                            </div>

                            {/* Total Owed - Prominent */}
                            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg p-3 border-2 border-slate-700">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-300 text-sm font-semibold flex items-center gap-1">
                                  <CurrencyDollarIcon className="w-4 h-4 text-green-400" />
                                  Total Owed:
                                </span>
                                <span className="text-red-400 font-bold text-2xl">${userAllocation.totalOwed.toFixed(2)}</span>
                              </div>
                              <div className="text-xs text-slate-400 mt-1">
                                Personal: ${userAllocation.personalCost.toFixed(2)} + Shared: ${userAllocation.sharedCost.toFixed(2)}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  {/* Action Buttons - Compact */}
                  <div className="flex justify-end items-center gap-2 pt-1.5 border-t border-slate-700">
                    <Button
                      onClick={() => setDeletingBillSplit(viewingBillSplit)}
                      className="bg-red-600 hover:bg-red-700 text-white border-none px-3 py-1 text-xs flex items-center gap-1"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Delete
                    </Button>
                    <Button
                      onClick={() => setViewingBillSplit(null)}
                      className="bg-blue-600 hover:bg-blue-700 text-white border-none px-3 py-1 text-xs"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deletingBillSplit !== null} onOpenChange={() => setDeletingBillSplit(null)}>
        <DialogContent className="max-w-md bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-red-500/50 shadow-2xl shadow-red-500/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <ExclamationTriangleIcon className="w-8 h-8 text-yellow-400" />
              Delete Bill Split
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-base pt-2">
              Are you sure you want to delete this bill split?
            </DialogDescription>
          </DialogHeader>

          {deletingBillSplit && (
            <div className="space-y-4 py-4">
              {/* Bill Split Info */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Period:</span>
                  <span className="font-bold text-white">
                    {monthNames[deletingBillSplit.month - 1]} {deletingBillSplit.year}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Dates:</span>
                  <span className="text-sm text-slate-300">
                    {deletingBillSplit.billing_period_start} to {deletingBillSplit.billing_period_end}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Total Amount:</span>
                  <span className="font-bold text-xl text-red-400">
                    ${deletingBillSplit.total_bill_amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Warning Message */}
              <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-3">
                <p className="text-sm text-red-200 font-medium flex items-start gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                  This action cannot be undone. All data for this bill split will be permanently deleted.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setDeletingBillSplit(null)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white border-none py-3 text-base font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteBillSplit}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-none py-3 text-base font-bold shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                >
                  <TrashIcon className="w-5 h-5" />
                  Delete Forever
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}

