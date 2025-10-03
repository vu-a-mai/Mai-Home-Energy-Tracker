import { useAuth } from '../hooks/useAuth'
import { useDemoMode } from '../contexts/DemoContext'
import { useEnergyLogs } from '../hooks/useEnergyLogs'
import { useDevices } from '../hooks/useDevices'
import { useHouseholdUsers } from '../hooks/useHouseholdUsers'
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts'
import { calculateUsageCost } from '../utils/rateCalculatorFixed'
import {
  BoltIcon,
  HomeIcon,
  CpuChipIcon,
  ChartBarIcon,
  ChartPieIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  ClockIcon,
  SunIcon,
  MoonIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

export default function Dashboard() {
  const { user } = useAuth()
  const { isDemoMode, disableDemoMode } = useDemoMode()
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Use the same hooks as other pages for consistency
  const { energyLogs, loading: logsLoading } = useEnergyLogs()
  const { devices, loading: devicesLoading } = useDevices()
  const { users: householdMembers } = useHouseholdUsers()

  const loading = logsLoading || devicesLoading

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Calculate data from actual energy logs using the same logic as Energy Logs page
  const calculateDashboardData = useMemo(() => {
    if (energyLogs.length === 0) {
      return {
        personalUsage: {
          daily: { kwh: 0, cost: 0 },
          weekly: { kwh: 0, cost: 0 },
          monthly: { kwh: 0, cost: 0 }
        },
        householdUsage: {
          total: { kwh: 0, cost: 0 },
          members: householdMembers.map(member => ({
            name: member.name,
            kwh: 0,
            cost: 0
          }))
        },
        topDevices: [],
        ratePeriods: {
          offPeak: { kwh: 0, cost: 0 },
          midPeak: { kwh: 0, cost: 0 },
          onPeak: { kwh: 0, cost: 0 },
          superOffPeak: { kwh: 0, cost: 0 }
        }
      }
    }

    // Initialize user totals
    const userTotals: { [key: string]: { kwh: number, cost: number } } = {}
    householdMembers.forEach(member => {
      userTotals[member.id] = { kwh: 0, cost: 0 }
    })

    // Initialize device totals
    const deviceTotals: { [key: string]: { kwh: number, cost: number, name: string } } = {}
    
    // Initialize rate period totals
    const ratePeriods = {
      offPeak: { kwh: 0, cost: 0 },
      midPeak: { kwh: 0, cost: 0 },
      onPeak: { kwh: 0, cost: 0 },
      superOffPeak: { kwh: 0, cost: 0 }
    }

    // Process each energy log
    energyLogs.forEach(log => {
      const device = devices.find(d => d.id === log.device_id)
      if (!device) return

      // Calculate usage using the rate calculator (same as Energy Logs page)
      const calculation = calculateUsageCost(
        device.wattage,
        log.start_time,
        log.end_time,
        log.usage_date
      )

      // Determine assigned users (same logic as Bill Split)
      const assignedUsers = log.assigned_users && log.assigned_users.length > 0 
        ? log.assigned_users 
        : [log.created_by]

      const splitCount = assignedUsers.length

      // Distribute usage among assigned users
      assignedUsers.forEach((userId: string) => {
        if (userTotals[userId]) {
          userTotals[userId].kwh += calculation.totalKwh / splitCount
          userTotals[userId].cost += calculation.totalCost / splitCount
        }
      })

      // Track device totals
      if (!deviceTotals[log.device_id]) {
        deviceTotals[log.device_id] = {
            name: device.name,
            kwh: 0,
          cost: 0
        }
      }
      deviceTotals[log.device_id].kwh += calculation.totalKwh
      deviceTotals[log.device_id].cost += calculation.totalCost

      // Track rate period totals
      calculation.breakdown.forEach(period => {
        if (period.ratePeriod === 'Off-Peak') {
          ratePeriods.offPeak.kwh += period.kwh
          ratePeriods.offPeak.cost += period.cost
        } else if (period.ratePeriod === 'On-Peak') {
          ratePeriods.onPeak.kwh += period.kwh
          ratePeriods.onPeak.cost += period.cost
        } else if (period.ratePeriod === 'Mid-Peak') {
          ratePeriods.midPeak.kwh += period.kwh
          ratePeriods.midPeak.cost += period.cost
        } else if (period.ratePeriod === 'Super Off-Peak') {
          ratePeriods.superOffPeak.kwh += period.kwh
          ratePeriods.superOffPeak.cost += period.cost
        }
      })
    })

    // Calculate totals
    const totalKwh = Object.values(userTotals).reduce((sum, user) => sum + user.kwh, 0)
    const totalCost = Object.values(userTotals).reduce((sum, user) => sum + user.cost, 0)

    // Convert to member array
    const members = householdMembers.map(member => ({
      name: member.name,
      kwh: userTotals[member.id]?.kwh || 0,
      cost: userTotals[member.id]?.cost || 0
    }))

    // Get top devices
    const topDevices = Object.values(deviceTotals)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5)
      .map(device => ({
        name: device.name,
        kwh: device.kwh,
        cost: device.cost
      }))

    // Calculate personal usage for current user (current month only)
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    // Get first day of current month
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    
    // Get first day of current week (Sunday)
    const currentDay = now.getDay()
    const firstDayOfWeek = new Date(now.getTime() - currentDay * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const calculatePersonalUsage = (startDate: string, endDate: string = today) => {
      let kwh = 0
      let cost = 0
      
      energyLogs
        .filter(log => log.usage_date >= startDate && log.usage_date <= endDate)
        .forEach(log => {
          const device = devices.find(d => d.id === log.device_id)
          if (!device) return

          const calculation = calculateUsageCost(
            device.wattage,
            log.start_time,
            log.end_time,
            log.usage_date
          )

          const assignedUsers = log.assigned_users && log.assigned_users.length > 0 
            ? log.assigned_users 
            : [log.created_by]

          if (assignedUsers.includes(user?.id || '')) {
            const splitCount = assignedUsers.length
            kwh += calculation.totalKwh / splitCount
            cost += calculation.totalCost / splitCount
          }
        })

      return { kwh, cost }
    }
    
    return {
      personalUsage: {
        daily: calculatePersonalUsage(today, today), // Today only
        weekly: calculatePersonalUsage(firstDayOfWeek), // This week (from Sunday)
        monthly: calculatePersonalUsage(firstDayOfMonth) // This month (from 1st)
      },
      householdUsage: {
        total: { kwh: totalKwh, cost: totalCost },
        members
      },
      topDevices,
      ratePeriods
    }
  }, [energyLogs, devices, householdMembers, user])

  const dashboardData = calculateDashboardData

  // Debug logging for troubleshooting
  useEffect(() => {
    if (import.meta.env.DEV && energyLogs.length > 0) {
      console.log('📊 Dashboard Data Summary:', {
        totalLogs: energyLogs.length,
        totalDevices: devices.length,
        householdMembers: householdMembers.length,
        personalUsage: dashboardData.personalUsage,
        householdTotal: dashboardData.householdUsage.total,
        topDevices: dashboardData.topDevices,
        ratePeriods: dashboardData.ratePeriods
      })
    }
  }, [energyLogs, devices, householdMembers, dashboardData])

  const getCurrentRatePeriod = () => {
    const hour = currentTime.getHours()
    const month = currentTime.getMonth() + 1
    const isWeekend = currentTime.getDay() === 0 || currentTime.getDay() === 6
    
    // Summer rates (June-September)
    if (month >= 6 && month <= 9) {
      if (!isWeekend) {
        if (hour >= 16 && hour < 21) return { name: 'On-Peak', rate: 0.55, color: '#ef4444', emoji: '🔴' }
        return { name: 'Off-Peak', rate: 0.25, color: '#22c55e', emoji: '🟢' }
      } else {
        if (hour >= 16 && hour < 21) return { name: 'Mid-Peak', rate: 0.37, color: '#f59e0b', emoji: '🟡' }
        return { name: 'Off-Peak', rate: 0.25, color: '#22c55e', emoji: '🟢' }
      }
    }
    // Winter rates (October-May)
    else {
      if (hour >= 21 || hour < 8) return { name: 'Off-Peak', rate: 0.24, color: '#22c55e', emoji: '🟢' }
      if (hour >= 8 && hour < 16) return { name: 'Super Off-Peak', rate: 0.24, color: '#3b82f6', emoji: '🔵' }
      return { name: 'Mid-Peak', rate: 0.52, color: '#f59e0b', emoji: '🟡' }
    }
  }

  const currentRate = getCurrentRatePeriod()

  // Quick Action handlers
  const handleManageDevices = () => {
    navigate('/devices')
  }

  const handleLogEnergyUsage = () => {
    navigate('/logs')
  }

  const handleSplitBill = () => {
    navigate('/bill-split')
  }

  // Calculate weekly usage data from real energy logs (with proper assigned_users support)
  const weeklyUsageData = useMemo(() => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const weeklyData: any[] = []
    
    // Get logs from the last 7 days
    const today = new Date()
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000)
      const dayName = weekDays[date.getDay()]
      const dateStr = date.toISOString().split('T')[0]
      
      const dayLogs = energyLogs.filter(log => log.usage_date === dateStr)
      
      const dayData: any = { day: dayName, date: dateStr }
      
      // Initialize all members to 0
      householdMembers.forEach(member => {
        dayData[member.name] = 0
      })
      
      // Calculate per-user usage for this day using proper assigned_users logic
      dayLogs.forEach(log => {
        const device = devices.find(d => d.id === log.device_id)
        if (!device) return

        const calculation = calculateUsageCost(
          device.wattage,
          log.start_time,
          log.end_time,
          log.usage_date
        )

        const assignedUsers = log.assigned_users && log.assigned_users.length > 0 
          ? log.assigned_users 
          : [log.created_by]

        const splitCount = assignedUsers.length

        assignedUsers.forEach((userId: string) => {
          const member = householdMembers.find(m => m.id === userId)
          if (member) {
            dayData[member.name] = Number((dayData[member.name] + (calculation.totalKwh / splitCount)).toFixed(2))
          }
        })
      })
      
      weeklyData.push(dayData)
    }
    
    // Return data or empty array if no logs
    return weeklyData
  }, [energyLogs, devices, householdMembers])

  // Calculate monthly trend data from energy logs (last 12 months)
  const monthlyTrendData = useMemo(() => {
    const months: any[] = []
    const now = new Date()
    
    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('en', { month: 'short', year: 'numeric' })
      
      // Filter logs for this month
      const monthLogs = energyLogs.filter(log => {
        const logDate = new Date(log.usage_date)
        return logDate.getFullYear() === date.getFullYear() && 
               logDate.getMonth() === date.getMonth()
      })
      
      // Calculate total usage for the month
      let totalKwh = 0
      let totalCost = 0
      
      monthLogs.forEach(log => {
        const device = devices.find(d => d.id === log.device_id)
        if (device) {
          const calculation = calculateUsageCost(
            device.wattage,
            log.start_time,
            log.end_time,
            log.usage_date
          )
          totalKwh += calculation.totalKwh
          totalCost += calculation.totalCost
        }
      })
      
      months.push({
        month: monthName,
        monthKey,
        usage: Number(totalKwh.toFixed(2)),
        cost: Number(totalCost.toFixed(2)),
        logs: monthLogs.length
      })
    }
    
    return months
  }, [energyLogs, devices])

  // Device usage data for pie chart
  const deviceUsageData = dashboardData.topDevices.map(device => ({
    name: device.name,
    value: device.kwh,
      cost: device.cost
  }))

  const COLORS = ['#22c55e', '#eab308', '#ef4444', '#3b82f6', '#8b5cf6']

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-5 min-h-screen bg-background text-foreground font-sans fade-in flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl md:text-6xl mb-4 energy-pulse">⚡</div>
          <h2 className="text-xl md:text-2xl font-bold mb-2">Loading Dashboard...</h2>
          <p className="text-sm md:text-base text-muted-foreground">Fetching your energy data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-5 min-h-screen bg-background text-foreground font-sans fade-in">
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="mb-4 p-3 md:p-4 bg-yellow-500/20 border-2 border-yellow-500 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-2xl md:text-3xl">👁️</span>
            <div>
              <h3 className="font-bold text-yellow-500 text-sm md:text-base">Demo Mode Active</h3>
              <p className="text-xs md:text-sm text-yellow-200">Using demo data - Supabase unavailable</p>
            </div>
          </div>
          <Button 
            onClick={() => {
              disableDemoMode()
              navigate('/login')
            }}
            variant="outline"
            className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/20 text-sm w-full sm:w-auto"
          >
            Exit Demo
          </Button>
        </div>
      )}

      {/* Header */}
      <header className="mb-6 md:mb-8 p-4 md:p-8 energy-header-gradient rounded-2xl text-white shadow-xl energy-glow">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold energy-pulse">
            ⚡ Energy Dashboard
          </h1>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <span className="text-sm md:text-base font-semibold opacity-90 whitespace-nowrap">Current Rate:</span>
          <div className="grid grid-cols-2 md:flex md:items-center gap-2 md:gap-4 flex-1">
            {/* Off-Peak */}
            <div className={`flex-1 px-2 md:px-4 py-2 md:py-2.5 rounded-lg transition-all flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${
              currentRate.name === 'Off-Peak' 
                ? 'bg-green-500 text-white font-bold shadow-lg ring-2 ring-white/50' 
                : 'bg-white/20 text-white/80 border border-white/30'
            }`}>
              <span className="text-base">🟢</span>
              <span className="text-xs md:text-sm whitespace-nowrap">Off-Peak</span>
              <span className="text-xs opacity-80">$0.25/kWh</span>
            </div>
            {/* Mid-Peak */}
            <div className={`flex-1 px-2 md:px-4 py-2 md:py-2.5 rounded-lg transition-all flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${
              currentRate.name === 'Mid-Peak' 
                ? 'bg-yellow-500 text-white font-bold shadow-lg ring-2 ring-white/50' 
                : 'bg-white/20 text-white/80 border border-white/30'
            }`}>
              <span className="text-base">🟡</span>
              <span className="text-xs md:text-sm whitespace-nowrap">Mid-Peak</span>
              <span className="text-xs opacity-80">$0.37/kWh</span>
            </div>
            {/* On-Peak */}
            <div className={`flex-1 px-2 md:px-4 py-2 md:py-2.5 rounded-lg transition-all flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${
              currentRate.name === 'On-Peak' 
                ? 'bg-red-500 text-white font-bold shadow-lg ring-2 ring-white/50' 
                : 'bg-white/20 text-white/80 border border-white/30'
            }`}>
              <span className="text-base">🔴</span>
              <span className="text-xs md:text-sm whitespace-nowrap">On-Peak</span>
              <span className="text-xs opacity-80">$0.55/kWh</span>
            </div>
            {/* Super Off-Peak */}
            <div className={`flex-1 px-2 md:px-4 py-2 md:py-2.5 rounded-lg transition-all flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${
              currentRate.name === 'Super Off-Peak' 
                ? 'bg-blue-500 text-white font-bold shadow-lg ring-2 ring-white/50' 
                : 'bg-white/20 text-white/80 border border-white/30'
            }`}>
              <span className="text-base">🔵</span>
              <span className="text-xs md:text-sm whitespace-nowrap">Super Off-Peak</span>
              <span className="text-xs opacity-80">$0.24/kWh</span>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Actions */}
      <section className="mb-6 slide-up">
        <h2 className="mb-3 md:mb-4 text-lg md:text-xl font-bold text-foreground">🚀 Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <button 
            onClick={handleManageDevices}
            className="quick-actions-card p-4 md:p-5 rounded-lg text-left flex items-center gap-3 md:gap-4 hover:scale-105 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all duration-300 text-foreground group"
          >
            <div className="text-2xl md:text-3xl group-hover:scale-110 transition-transform">🔌</div>
            <div>
              <div className="font-bold text-sm md:text-base mb-1">Manage Devices</div>
              <div className="text-xs text-muted-foreground">Add or edit devices</div>
            </div>
          </button>
          
          <button 
            onClick={handleLogEnergyUsage}
            className="quick-actions-card p-4 md:p-5 rounded-lg text-left flex items-center gap-3 md:gap-4 hover:scale-105 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all duration-300 text-foreground group"
          >
            <div className="text-2xl md:text-3xl group-hover:scale-110 transition-transform">📝</div>
            <div>
              <div className="font-bold text-sm md:text-base mb-1">Log Energy Usage</div>
              <div className="text-xs text-muted-foreground">Record usage sessions</div>
            </div>
          </button>
          
          <button 
            onClick={handleSplitBill}
            className="quick-actions-card p-4 md:p-5 rounded-lg text-left flex items-center gap-3 md:gap-4 hover:scale-105 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all duration-300 text-foreground group"
          >
            <div className="text-2xl md:text-3xl group-hover:scale-110 transition-transform">💳</div>
            <div>
              <div className="font-bold text-sm md:text-base mb-1">Split Monthly Bill</div>
              <div className="text-xs text-muted-foreground">Calculate cost allocation</div>
            </div>
          </button>
        </div>
      </section>

      {/* Rate Period Breakdown */}
      <section className="mb-6 slide-up">
        <h2 className="mb-3 md:mb-4 text-lg md:text-xl font-bold text-foreground">⏰ Rate Period Breakdown</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="energy-gradient-green p-4 rounded-lg text-center rate-indicator hover:scale-105 transition-transform shadow-lg">
            <div className="text-3xl mb-2">🟢</div>
            <div className="font-bold text-white text-base mb-2">Off-Peak</div>
            <div className="text-sm text-white font-semibold">{dashboardData.ratePeriods.offPeak.kwh.toFixed(1)} kWh</div>
            <div className="text-xs text-white/80">${dashboardData.ratePeriods.offPeak.cost.toFixed(2)}</div>
          </div>
        
          <div className="energy-gradient-yellow p-4 rounded-lg text-center rate-indicator hover:scale-105 transition-transform shadow-lg">
            <div className="text-3xl mb-2">🟡</div>
            <div className="font-bold text-white text-base mb-2">Mid-Peak</div>
            <div className="text-sm text-white font-semibold">{dashboardData.ratePeriods.midPeak.kwh.toFixed(1)} kWh</div>
            <div className="text-xs text-white/80">${dashboardData.ratePeriods.midPeak.cost.toFixed(2)}</div>
          </div>
        
          <div className="energy-gradient-red p-4 rounded-lg text-center rate-indicator hover:scale-105 transition-transform shadow-lg">
            <div className="text-3xl mb-2">🔴</div>
            <div className="font-bold text-white text-base mb-2">On-Peak</div>
            <div className="text-sm text-white font-semibold">{dashboardData.ratePeriods.onPeak.kwh.toFixed(1)} kWh</div>
            <div className="text-xs text-white/80">${dashboardData.ratePeriods.onPeak.cost.toFixed(2)}</div>
          </div>
        
          <div className="energy-gradient-blue p-4 rounded-lg text-center rate-indicator hover:scale-105 transition-transform shadow-lg">
            <div className="text-3xl mb-2">🔵</div>
            <div className="font-bold text-white text-base mb-2">Super Off-Peak</div>
            <div className="text-sm text-white font-semibold">{dashboardData.ratePeriods.superOffPeak.kwh.toFixed(1)} kWh</div>
            <div className="text-xs text-white/80">${dashboardData.ratePeriods.superOffPeak.cost.toFixed(2)}</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20 border-2 border-red-500/50 rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-center gap-3">
            <div className="text-3xl animate-pulse">⚠️</div>
            <div className="text-center">
              <div className="text-red-400 font-bold text-lg mb-1">⚡ Peak Usage Time Alert</div>
              <div className="text-white font-semibold text-base">
                🕓 4:00 PM - 9:00 PM 🕘
              </div>
              <div className="text-red-300 text-sm mt-1">
                On-Peak Period - Highest Rates ($0.55/kWh)
              </div>
            </div>
            <div className="text-3xl animate-pulse">⚠️</div>
          </div>
        </div>
      </section>

      {/* Personal Usage Stats - Color Coded */}
      <section className="mb-6 slide-up">
        <h2 className="mb-3 md:mb-4 text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
          <UserGroupIcon className="w-6 h-6 text-primary" />
          Personal Usage Analytics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <Card className="energy-card bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 hover:border-green-500/50 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <SunIcon className="w-6 h-6 text-green-400" />
                <span className="text-xs text-muted-foreground font-semibold">Current Daily Usage</span>
              </div>
              <div className="text-2xl font-bold text-green-400 mb-1">
                {dashboardData.personalUsage.daily.kwh.toFixed(1)} kWh
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                Cost: <strong className="text-green-400">${dashboardData.personalUsage.daily.cost.toFixed(2)}</strong>
              </div>
              <Badge variant="off-peak" className="text-xs flex items-center gap-1 w-fit">
                <ArrowTrendingDownIcon className="w-3 h-3" />
                12% from yesterday
              </Badge>
            </CardContent>
          </Card>

          <Card className="energy-card bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30 hover:border-blue-500/50 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDaysIcon className="w-6 h-6 text-blue-400" />
                <span className="text-xs text-muted-foreground font-semibold">Current Weekly Usage</span>
              </div>
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {dashboardData.personalUsage.weekly.kwh.toFixed(1)} kWh
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                Cost: <strong className="text-blue-400">${dashboardData.personalUsage.weekly.cost.toFixed(2)}</strong>
              </div>
              <Badge variant="mid-peak" className="text-xs flex items-center gap-1 w-fit">
                <ArrowTrendingUpIcon className="w-3 h-3" />
                5% from last week
              </Badge>
            </CardContent>
          </Card>

          <Card className="energy-card bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30 hover:border-red-500/50 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <MoonIcon className="w-6 h-6 text-red-400" />
                <span className="text-xs text-muted-foreground font-semibold">Current Monthly Usage</span>
              </div>
              <div className="text-2xl font-bold text-red-400 mb-1">
                {dashboardData.personalUsage.monthly.kwh.toFixed(1)} kWh
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                Cost: <strong className="text-red-400">${dashboardData.personalUsage.monthly.cost.toFixed(2)}</strong>
              </div>
              <Badge variant="off-peak" className="text-xs flex items-center gap-1 w-fit">
                <ArrowTrendingDownIcon className="w-3 h-3" />
                8% from last month
              </Badge>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Household Summary & Device Analysis */}
      <section className="mb-6 slide-up">
        <h2 className="mb-3 md:mb-4 text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
          <HomeIcon className="w-6 h-6 text-primary" />
          Household Summary & Device Analysis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Total Household Usage - Enhanced */}
          <Card className="energy-card bg-gradient-to-br from-primary/15 via-emerald-500/10 to-cyan-500/15 border-primary/40 hover:border-primary/60 transition-all shadow-lg hover:shadow-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <HomeIcon className="w-5 h-5 text-primary" />
                Total Household Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-gradient-to-r from-primary/20 to-emerald-500/20 rounded-xl border border-primary/40">
                <div className="text-4xl font-bold text-orange-400 mb-1">
                  {dashboardData.householdUsage.total.kwh.toFixed(1)} kWh
              </div>
                <div className="text-sm text-foreground/80">
                  Total Cost: <strong className="text-xl text-green-400 ml-1">${dashboardData.householdUsage.total.cost.toFixed(2)}</strong>
                </div>
              </div>
              
              <div className="space-y-2.5">
                {dashboardData.householdUsage.members.map((member, index) => {
                  // Color code each user uniquely
                  const getUserColor = (name: string) => {
                    // Match name dynamically or use index-based colors
                    const normalizedName = name.toLowerCase()
                    if (normalizedName.includes('vu')) return 'text-green-400'
                    if (normalizedName.includes('vy')) return 'text-red-400'
                    if (normalizedName.includes('thuy')) return 'text-yellow-400'
                    if (normalizedName.includes('han')) return 'text-blue-400'
                    // Fallback to index-based colors
                    const colors = ['text-green-400', 'text-yellow-400', 'text-red-400', 'text-blue-400', 'text-purple-400']
                    return colors[index % colors.length]
                  }
                  
                  const getUserIcon = (name: string) => {
                    const normalizedName = name.toLowerCase()
                    if (normalizedName.includes('vu')) return '👨'
                    if (normalizedName.includes('vy')) return '👩'
                    if (normalizedName.includes('thuy')) return '👩'
                    if (normalizedName.includes('han')) return '👦'
                    return '👤'
                  }
                  
                  const percentage = dashboardData.householdUsage.total.kwh > 0 
                    ? ((member.kwh / dashboardData.householdUsage.total.kwh) * 100).toFixed(0)
                    : 0
                  
                  return (
                    <div key={index} className="group">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-sm font-medium ${getUserColor(member.name)} flex items-center gap-1.5`}>
                          <span className="text-base">{getUserIcon(member.name)}</span>
                          {member.name}
                        </span>
                        <span className={`text-sm font-bold ${getUserColor(member.name)}`}>
                          {member.kwh.toFixed(1)} kWh
                        </span>
                        </div>
                      <div className="w-full bg-muted/30 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-500 ${getUserColor(member.name).replace('text-', 'bg-')}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Device Usage - Combined Chart & List - Spans 2 columns on large screens */}
          <Card className="energy-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <CpuChipIcon className="w-5 h-5 text-primary" />
                Device Usage Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deviceUsageData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pie Chart */}
                  <div>
                    <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={deviceUsageData}
                    cx="50%"
                    cy="50%"
                          outerRadius={90}
                    fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          labelLine={{ stroke: 'hsl(var(--color-foreground))', strokeWidth: 1 }}
                  >
                    {deviceUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--color-card))', 
                            border: '2px solid hsl(var(--color-primary))',
                      borderRadius: '8px',
                            color: 'hsl(var(--color-foreground))',
                            fontSize: '13px',
                            fontWeight: '600'
                          }}
                          itemStyle={{
                            color: 'hsl(var(--color-foreground))'
                          }}
                          labelStyle={{
                            color: 'hsl(var(--color-primary))',
                            fontWeight: 'bold'
                          }}
                          formatter={(value: any, name: any, props: any) => [
                            `${Number(value).toFixed(2)} kWh ($${props.payload.cost.toFixed(2)})`,
                            name
                          ]}
                  />
                </PieChart>
              </ResponsiveContainer>
                  </div>
                  
                  {/* Device List - Scrollable if many devices */}
                  <div className="flex flex-col">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <span>📋</span>
                      Device Breakdown {dashboardData.topDevices.length > 5 && `(Top ${Math.min(10, dashboardData.topDevices.length)})`}
                    </h3>
                    <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                      {dashboardData.topDevices.slice(0, 10).map((device, index) => {
                  const getCostColor = (cost: number) => {
                    if (cost > 100) return 'text-red-400'
                    if (cost > 20) return 'text-yellow-400'
                    return 'text-green-400'
                  }
                  
                        const percentage = dashboardData.householdUsage.total.kwh > 0
                          ? ((device.kwh / dashboardData.householdUsage.total.kwh) * 100).toFixed(1)
                          : 0
                        
                  return (
                          <div key={index} className="group p-2.5 rounded-lg hover:bg-muted/50 transition-all">
                            <div className="flex justify-between items-center mb-1.5">
                              <div className="flex items-center gap-2.5 flex-1">
                                <div 
                                  className="w-3 h-3 rounded-full flex-shrink-0" 
                                  style={{ 
                                    backgroundColor: COLORS[index % COLORS.length]
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-foreground text-sm truncate">
                                    {device.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                                    {device.kwh.toFixed(2)} kWh • {percentage}% of total
                        </div>
                      </div>
                              </div>
                              <div className={`text-right font-bold text-sm ml-3 ${getCostColor(device.cost)}`}>
                        ${device.cost.toFixed(2)}
                              </div>
                            </div>
                            <div className="w-full bg-muted/30 rounded-full h-1 overflow-hidden">
                              <div 
                                className="h-1 rounded-full transition-all duration-300" 
                                style={{ 
                                  width: `${percentage}%`,
                                  backgroundColor: COLORS[index % COLORS.length]
                                }}
                              />
                      </div>
                    </div>
                  )
                })}
              </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground text-sm py-12">
                  <div className="text-4xl mb-3">🔌</div>
                  <p className="text-base font-medium">No device usage data available</p>
                  <p className="text-xs mt-1">Start logging energy usage to see device breakdown</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Data Visualization Charts */}
      <section className="mb-8 slide-up">
        <h2 className="mb-3 md:mb-5 text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
          <ChartPieIcon className="w-6 h-6 text-primary" />
          Usage Trends & Analysis
        </h2>
        
        {/* Top Row: Weekly Usage */}
        <div className="mb-4 md:mb-6">
          <Card className="energy-card chart-hover">
            <CardHeader>
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-primary" />
                Weekly Usage by Person
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weeklyUsageData.length > 0 && weeklyUsageData.some(day => Object.keys(day).length > 2) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyUsageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--color-muted-foreground))" />
                  <YAxis 
                    stroke="hsl(var(--color-muted-foreground))" 
                    label={{ value: 'Usage (kWh)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'hsl(var(--color-muted-foreground))' } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--color-card))', 
                      border: '1px solid hsl(var(--color-border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--color-foreground))',
                      fontSize: '14px'
                    }}
                    labelStyle={{ color: 'hsl(var(--color-foreground))' }}
                    formatter={(value, name) => [`${value} kWh`, name]}
                      labelFormatter={(label, payload) => {
                        const dayData = payload && payload[0] ? payload[0].payload : null
                        return `${label}${dayData?.date ? ` (${dayData.date})` : ''}`
                      }}
                    />
                    {householdMembers.map((member, index) => (
                      <Bar key={member.id} dataKey={member.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                </BarChart>
              </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📊</div>
                    <p className="text-sm">No energy logs in the past 7 days</p>
                    <p className="text-xs mt-1">Start logging usage to see trends</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trend Chart - Full Width */}
          <Card className="energy-card chart-hover">
            <CardHeader>
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <ArrowTrendingUpIcon className="w-5 h-5 text-primary" />
              Monthly Usage Trend (Last 12 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
            {monthlyTrendData.some(m => m.usage > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--color-muted-foreground))" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis 
                    stroke="hsl(var(--color-muted-foreground))" 
                    label={{ value: 'Total Usage (kWh)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'hsl(var(--color-muted-foreground))' } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--color-card))', 
                      border: '1px solid hsl(var(--color-border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--color-foreground))',
                      fontSize: '14px'
                    }}
                    labelStyle={{ color: 'hsl(var(--color-foreground))' }}
                    formatter={(value: any, name: any, props: any) => {
                      const cost = props.payload.cost || 0
                      const logs = props.payload.logs || 0
                      return [`${value} kWh (Cost: $${cost}, Logs: ${logs})`, 'Total Usage']
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="usage" 
                    stroke="#22c55e" 
                    strokeWidth={3} 
                    dot={{ fill: '#22c55e', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <div className="text-4xl mb-2">📈</div>
                  <p className="text-sm">No monthly usage data available</p>
                  <p className="text-xs mt-1">Log energy usage to see monthly trends</p>
                </div>
              </div>
            )}
            </CardContent>
          </Card>
      </section>

    </div>
  )
}
