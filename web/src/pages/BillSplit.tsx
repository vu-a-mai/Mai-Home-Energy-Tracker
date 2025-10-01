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
import { validateAmount, validateDateRange } from '../utils/validation'

interface BillSplitData {
  billingPeriod: string
  totalBillAmount: number
  personalCosts: { [userId: string]: number }
  sharedCost: number
  finalAmounts: { [userId: string]: number }
}

interface BillFormData {
  startDate: string
  endDate: string
  totalAmount: number
}

// Helper function to get user icon
const getUserIcon = (userName: string): string => {
  const name = userName.toLowerCase()
  if (name.includes('vu')) return '👨'
  if (name.includes('thuy')) return '👩'
  if (name.includes('vy')) return '👧'
  if (name.includes('han')) return '👦'
  return '👤' // Default icon
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
    totalAmount: isDemoMode ? 555 : 0 // Demo mode shows 555, live mode starts at 0
  })
  const [formErrors, setFormErrors] = useState<Partial<BillFormData>>({})
  const [showResults, setShowResults] = useState(false)
  const [saving, setSaving] = useState(false)

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
    
    // Validate date range
    if (formData.startDate && formData.endDate) {
      const dateRangeValidation = validateDateRange(formData.startDate, formData.endDate)
      if (!dateRangeValidation.valid) {
        errors.endDate = dateRangeValidation.error
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
    
    // Calculate personal costs for each user (only from personal devices)
    const personalCosts: { [userId: string]: number } = {}
    let totalTrackedCosts = 0
    let totalSharedDeviceCosts = 0

    // Initialize personal costs
    householdUsers.forEach(user => {
      personalCosts[user.id] = 0
    })

    // Calculate costs from energy logs
    periodLogs.forEach(log => {
      const device = devices.find(d => d.id === log.device_id)
      
      // Check both is_shared (boolean) and sharing_type (text) for compatibility
      const isSharedDevice = device?.is_shared === true || (device as any)?.sharing_type === 'shared'
      const isPersonalDevice = device?.is_shared === false || (device as any)?.sharing_type === 'personal'
      
      if (device && isPersonalDevice) {
        // Personal device - assign full cost to creator
        const userId = log.created_by || householdUsers[0]?.id || 'unknown'
        personalCosts[userId] = (personalCosts[userId] || 0) + log.calculated_cost
        totalTrackedCosts += log.calculated_cost
      } else if (device && isSharedDevice) {
        // Shared device - split cost among assigned users (or all users if no assignments)
        const assignedUsers = log.assigned_users && log.assigned_users.length > 0 
          ? log.assigned_users 
          : householdUsers.map(u => u.id) // Default to all users if no assignments
        
        const costPerUser = log.calculated_cost / assignedUsers.length
        
        assignedUsers.forEach((userId: string) => {
          personalCosts[userId] = (personalCosts[userId] || 0) + costPerUser
        })
        
        totalTrackedCosts += log.calculated_cost
        totalSharedDeviceCosts += log.calculated_cost
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
      sharedCost: remainingAmount,
      finalAmounts
    }
    
    console.log('BillSplit - Final calculation:', {
      totalTrackedCosts,
      remainingAmount,
      sharedCostPerUser,
      personalCosts,
      finalAmounts
    })
    
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
      console.error('Error fetching logs:', error)
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
      
      await saveBillSplit({
        billing_period_start: formData.startDate,
        billing_period_end: formData.endDate,
        total_bill_amount: formData.totalAmount,
        user_allocations: userAllocations
      })
      
      toast.success('Bill split saved successfully!')
      
      // Reset form
      setShowResults(false)
      setFormData({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        totalAmount: 0
      })
    } catch (error) {
      console.error('Error saving bill split:', error)
      toast.error('Failed to save bill split. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteBillSplit = async (id: string) => {
    if (confirm('Are you sure you want to delete this bill split?')) {
      try {
        await deleteBillSplit(id)
        toast.success('Bill split deleted successfully!')
      } catch (error) {
        console.error('Error deleting bill split:', error)
        toast.error('Failed to delete bill split. Please try again.')
      }
    }
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
          <h1 className="text-2xl md:text-3xl font-bold mb-2 energy-pulse">
            💳 Bill Split Calculator
          </h1>
          <p className="opacity-90 text-sm md:text-base">
            Fairly allocate electricity costs among family members
          </p>
        </div>
      </header>

      {/* Bill Input Form - Compact Design */}
      <section className="mb-4 slide-up">
        <Card className="energy-card">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-4 flex-wrap">
                {/* Title */}
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <span className="text-lg">📅</span>
                  <span>Bill Period:</span>
                </div>
                
                {/* Billing Period Start */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground whitespace-nowrap">📆 From:</label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className={`px-3 py-1.5 text-sm h-auto ${formErrors.startDate ? 'border-red-500' : ''}`}
                  />
                </div>

                {/* Billing Period End */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground whitespace-nowrap">To:</label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className={`px-3 py-1.5 text-sm h-auto ${formErrors.endDate ? 'border-red-500' : ''}`}
                  />
                </div>

                {/* Total Bill Amount */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground whitespace-nowrap">💵 Total:</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.totalAmount || ''}
                    onChange={(e) => setFormData({...formData, totalAmount: parseFloat(e.target.value) || 0})}
                    placeholder="e.g., 245.67"
                    className={`px-3 py-1.5 text-sm h-auto w-32 ${formErrors.totalAmount ? 'border-red-500' : ''}`}
                  />
                </div>

                {/* Calculate Button */}
                <Button
                  type="submit"
                  className="ml-auto energy-action-btn px-6 py-1.5 text-sm"
                >
                  📊 Calculate Split
                </Button>
              </div>
              
              {/* Error Messages */}
              {(formErrors.startDate || formErrors.endDate || formErrors.totalAmount) && (
                <div className="mt-3 text-sm text-red-500">
                  {formErrors.startDate || formErrors.endDate || formErrors.totalAmount}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </section>

      {/* Bill Split Results */}
      {showResults && calculateBillSplit && (
        <section className="mb-6 slide-up">
          <Card className="energy-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl text-foreground flex items-center gap-2">
                  📈 Bill Split Results
                </CardTitle>
                <div className="flex gap-3">
                  <Button
                    onClick={exportBillSplit}
                    variant="outline"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                  >
                    📄 Export
                  </Button>
                  <Button
                    onClick={handleSaveBillSplit}
                    disabled={saving}
                    size="sm"
                    className="energy-action-btn"
                  >
                    {saving ? '⏳ Saving...' : '💾 Save'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>

              {/* Summary - Color Coded */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Billing Period */}
                <Card className="energy-card bg-gradient-to-br from-slate-500/10 to-gray-500/10 border-slate-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">📅</span>
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
                      <span className="text-2xl">💰</span>
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
                      <span className="text-2xl">🏠</span>
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
                      <span className="text-2xl">👥</span>
                      <span className="text-xs text-muted-foreground font-semibold">Per Person (Shared)</span>
                    </div>
                    <div className="font-bold text-xl text-green-400">
                      ${(calculateBillSplit.sharedCost / householdUsers.length).toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
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
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">🔌 Personal:</span>
                          <span className="font-semibold text-blue-400">
                            ${calculateBillSplit.personalCosts[user.id].toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">🏠 Shared:</span>
                          <span className="font-semibold text-green-400">
                            ${(calculateBillSplit.sharedCost / householdUsers.length).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Total */}
                      <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 p-3 rounded-lg border border-red-500/30">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground font-semibold">💰 Total Owed:</span>
                          <span className="text-xl font-bold text-red-400">
                            ${calculateBillSplit.finalAmounts[user.id].toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Bill Split History */}
      {savedBillSplits.length > 0 && (
        <section className="mb-6 slide-up">
          <Card className="energy-card">
            <CardHeader>
              <CardTitle className="text-xl text-foreground flex items-center gap-2">
                📁 Bill Split History
              </CardTitle>
              <CardDescription>
                Previous bill calculations and cost allocations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {savedBillSplits.map((split) => {
                  const totalSharedCost = Object.values(split.user_allocations).reduce((sum, alloc) => sum + alloc.sharedCost, 0)
                  
                  return (
                    <Card key={split.id} className="bg-gradient-to-br from-muted/50 to-muted/30 border-border hover:border-primary/50 transition-all hover:shadow-lg">
                      <CardContent className="p-5">
                        {/* Header Section */}
                        <div className="flex justify-between items-start mb-4 pb-4 border-b border-border/50">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-2xl">📅</span>
                              <h4 className="font-bold text-foreground text-lg">
                                {split.billing_period_start} to {split.billing_period_end}
                              </h4>
                            </div>
                            <p className="text-xs text-muted-foreground ml-8">
                              Saved on {new Date(split.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground mb-1">Total Bill</p>
                              <Badge variant="off-peak" className="text-xl font-bold px-4 py-2">
                                ${split.total_bill_amount.toFixed(2)}
                              </Badge>
                            </div>
                            <Button
                              onClick={() => handleDeleteBillSplit(split.id)}
                              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 px-3 py-2 h-auto text-sm transition-all hover:scale-105"
                            >
                              🗑️
                            </Button>
                          </div>
                        </div>
                        
                        {/* Shared Cost Info */}
                        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">🏠</span>
                              <span className="text-sm font-semibold text-blue-400">Shared Amount</span>
                            </div>
                            <span className="text-lg font-bold text-blue-400">
                              ${totalSharedCost.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 ml-8">
                            Base charges split equally among {householdUsers.length} members
                          </p>
                        </div>
                        
                        {/* Individual Allocations */}
                        <div>
                          <h5 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                            <span>👥</span>
                            Individual Allocations
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {householdUsers.map(user => {
                              const userAllocation = split.user_allocations[user.id]
                              if (!userAllocation) return null
                              
                              const percentage = (userAllocation.totalOwed / split.total_bill_amount) * 100
                              return (
                                <div 
                                  key={user.id} 
                                  className="bg-card/50 border border-border/50 rounded-lg p-3 hover:border-primary/50 transition-all"
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">{getUserIcon(user.name)}</span>
                                    <span className="font-semibold text-foreground text-sm">{user.name}</span>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-baseline">
                                      <span className="text-xs text-muted-foreground">Amount:</span>
                                      <span className="text-lg font-bold text-green-400">
                                        ${userAllocation.totalOwed.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-baseline">
                                      <span className="text-xs text-muted-foreground">Share:</span>
                                      <span className="text-xs font-semibold text-yellow-400">
                                        {percentage.toFixed(1)}%
                                      </span>
                                    </div>
                                    {userAllocation.personalCost > 0 && (
                                      <div className="flex justify-between items-baseline pt-1 border-t border-border/30">
                                        <span className="text-xs text-muted-foreground">Personal:</span>
                                        <span className="text-xs text-blue-400">
                                          ${userAllocation.personalCost.toFixed(2)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Empty State */}
      {!showResults && savedBillSplits.length === 0 && (
        <section className="text-center py-20 slide-up">
          <div className="text-6xl mb-4 energy-pulse">💳</div>
          <h3 className="text-xl font-bold text-foreground mb-2">No bill splits yet</h3>
          <p className="text-muted-foreground">
            Enter your monthly bill information above to calculate fair cost allocation
          </p>
        </section>
      )}
    </div>
  )
}
