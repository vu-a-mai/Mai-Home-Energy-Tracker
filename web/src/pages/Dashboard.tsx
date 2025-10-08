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
import { calculateUsageCost, getSeason, WINTER_RATES, SUMMER_RATES } from '../utils/rateCalculatorFixed'
import { useUsageTimeframe } from '../hooks/useUsageTimeframe'
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
  UserGroupIcon,
  EyeIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  RocketLaunchIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline'

export default function Dashboard() {
  const { user } = useAuth()
  const { isDemoMode, disableDemoMode } = useDemoMode()
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [projectionView, setProjectionView] = useState<'personal' | 'household'>('personal')
  const [ratePeriodView, setRatePeriodView] = useState<'personal' | 'household'>('personal')
  
  // Use the same hooks as other pages for consistency
  const { energyLogs, loading: logsLoading } = useEnergyLogs()
  const { devices, loading: devicesLoading } = useDevices()
  const { users: householdMembers } = useHouseholdUsers()

  // URL-synced timeframe with computed date range
  const { 
    timeframe: usageTimeframe, 
    setTimeframe: setUsageTimeframe,
    dateRange,
    label: currentRangeLabel 
  } = useUsageTimeframe(energyLogs)

  const loading = logsLoading || devicesLoading

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Calculate log counts per timeframe for filter labels
  const filterCounts = useMemo(() => {
    const now = new Date()
    const counts = {
      month: 0,
      lastMonth: 0,
      year: 0,
      all: energyLogs.length
    }
    
    energyLogs.forEach(log => {
      const logDate = new Date(log.usage_date)
      const logYear = logDate.getFullYear()
      const logMonth = logDate.getMonth()
      
      if (logYear === now.getFullYear()) {
        counts.year++
        if (logMonth === now.getMonth()) {
          counts.month++
        }
      }
      
      // Last month (handle year boundary)
      if (logYear === now.getFullYear() && logMonth === now.getMonth() - 1) {
        counts.lastMonth++
      } else if (logYear === now.getFullYear() - 1 && logMonth === 11 && now.getMonth() === 0) {
        counts.lastMonth++
      }
    })
    
    return counts
  }, [energyLogs])

  // Filter logs based on timeframe using dateRange from hook
  const filteredLogs = useMemo(() => {
    return energyLogs.filter(log => 
      log.usage_date >= dateRange.from && log.usage_date <= dateRange.to
    )
  }, [energyLogs, dateRange])

  // Calculate data from actual energy logs using the same logic as Energy Logs page
  const calculateDashboardData = useMemo(() => {
    if (filteredLogs.length === 0) {
      return {
        personalUsage: {
          daily: { kwh: 0, cost: 0 },
          weekly: { kwh: 0, cost: 0 },
          monthly: { kwh: 0, cost: 0 },
          yearToDate: { kwh: 0, cost: 0 }
        },
        householdUsage: {
          total: { kwh: 0, cost: 0 },
          members: householdMembers.map(member => ({
            name: member.name,
            kwh: 0,
            cost: 0
          }))
        },
        personalInFilter: { kwh: 0, cost: 0 },
        topDevices: [],
        ratePeriods: {
          personal: {
            offPeak: { kwh: 0, cost: 0 },
            midPeak: { kwh: 0, cost: 0 },
            onPeak: { kwh: 0, cost: 0 },
            superOffPeak: { kwh: 0, cost: 0 }
          },
          household: {
            offPeak: { kwh: 0, cost: 0 },
            midPeak: { kwh: 0, cost: 0 },
            onPeak: { kwh: 0, cost: 0 },
            superOffPeak: { kwh: 0, cost: 0 }
          }
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
    
    // Initialize rate period totals (household)
    const ratePeriods = {
      offPeak: { kwh: 0, cost: 0 },
      midPeak: { kwh: 0, cost: 0 },
      onPeak: { kwh: 0, cost: 0 },
      superOffPeak: { kwh: 0, cost: 0 }
    }

    // Initialize personal rate period totals
    const personalRatePeriods = {
      offPeak: { kwh: 0, cost: 0 },
      midPeak: { kwh: 0, cost: 0 },
      onPeak: { kwh: 0, cost: 0 },
      superOffPeak: { kwh: 0, cost: 0 }
    }

    // Initialize household totals
    let totalKwh = 0
    let totalCost = 0

    // Process each energy log
    filteredLogs.forEach(log => {
      const device = devices.find(d => d.id === log.device_id)
      if (!device) return

      // Calculate usage using the rate calculator (same as Energy Logs page)
      const calculation = calculateUsageCost(
        device.wattage,
        log.start_time,
        log.end_time,
        log.usage_date
      )

      // Use stored values if available (from bulk entry), otherwise use calculated values
      const kwh = log.total_kwh ?? calculation.totalKwh
      const cost = log.calculated_cost ?? calculation.totalCost

      // Add to household totals
      totalKwh += kwh
      totalCost += cost

      // Determine assigned users (same logic as Bill Split)
      const assignedUsers = log.assigned_users && log.assigned_users.length > 0 
        ? log.assigned_users 
        : [log.created_by]

      const splitCount = assignedUsers.length

      // Distribute usage among assigned users
      assignedUsers.forEach((userId: string) => {
        if (userTotals[userId]) {
          userTotals[userId].kwh += kwh / splitCount
          userTotals[userId].cost += cost / splitCount
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
      deviceTotals[log.device_id].kwh += kwh
      deviceTotals[log.device_id].cost += cost

      // Track rate period totals (household)
      // For bulk entries, distribute across rate periods based on rate_breakdown if available
      if (log.total_kwh && log.rate_breakdown) {
        try {
          const breakdown = typeof log.rate_breakdown === 'string' 
            ? JSON.parse(log.rate_breakdown) 
            : log.rate_breakdown
          
          if (breakdown.rate_period) {
            const period = breakdown.rate_period
            if (period === 'off_peak') {
              ratePeriods.offPeak.kwh += kwh
              ratePeriods.offPeak.cost += cost
            } else if (period === 'on_peak') {
              ratePeriods.onPeak.kwh += kwh
              ratePeriods.onPeak.cost += cost
            } else if (period === 'mid_peak') {
              ratePeriods.midPeak.kwh += kwh
              ratePeriods.midPeak.cost += cost
            } else if (period === 'super_off_peak') {
              ratePeriods.superOffPeak.kwh += kwh
              ratePeriods.superOffPeak.cost += cost
            }
          }
        } catch (e) {
          // If parsing fails, use calculated breakdown
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
        }
      } else {
        // Use calculated breakdown for normal entries
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
      }

      // Track personal rate periods (only for current user's assigned logs)
      if (assignedUsers.includes(user?.id || '')) {
        const personalKwh = kwh / splitCount
        const personalCost = cost / splitCount
        
        if (log.total_kwh && log.rate_breakdown) {
          try {
            const breakdown = typeof log.rate_breakdown === 'string' 
              ? JSON.parse(log.rate_breakdown) 
              : log.rate_breakdown
            
            if (breakdown.rate_period) {
              const period = breakdown.rate_period
              if (period === 'off_peak') {
                personalRatePeriods.offPeak.kwh += personalKwh
                personalRatePeriods.offPeak.cost += personalCost
              } else if (period === 'on_peak') {
                personalRatePeriods.onPeak.kwh += personalKwh
                personalRatePeriods.onPeak.cost += personalCost
              } else if (period === 'mid_peak') {
                personalRatePeriods.midPeak.kwh += personalKwh
                personalRatePeriods.midPeak.cost += personalCost
              } else if (period === 'super_off_peak') {
                personalRatePeriods.superOffPeak.kwh += personalKwh
                personalRatePeriods.superOffPeak.cost += personalCost
              }
            }
          } catch (e) {
            calculation.breakdown.forEach(period => {
              if (period.ratePeriod === 'Off-Peak') {
                personalRatePeriods.offPeak.kwh += period.kwh / splitCount
                personalRatePeriods.offPeak.cost += period.cost / splitCount
              } else if (period.ratePeriod === 'On-Peak') {
                personalRatePeriods.onPeak.kwh += period.kwh / splitCount
                personalRatePeriods.onPeak.cost += period.cost / splitCount
              } else if (period.ratePeriod === 'Mid-Peak') {
                personalRatePeriods.midPeak.kwh += period.kwh / splitCount
                personalRatePeriods.midPeak.cost += period.cost / splitCount
              } else if (period.ratePeriod === 'Super Off-Peak') {
                personalRatePeriods.superOffPeak.kwh += period.kwh / splitCount
                personalRatePeriods.superOffPeak.cost += period.cost / splitCount
              }
            })
          }
        } else {
          calculation.breakdown.forEach(period => {
            if (period.ratePeriod === 'Off-Peak') {
              personalRatePeriods.offPeak.kwh += period.kwh / splitCount
              personalRatePeriods.offPeak.cost += period.cost / splitCount
            } else if (period.ratePeriod === 'On-Peak') {
              personalRatePeriods.onPeak.kwh += period.kwh / splitCount
              personalRatePeriods.onPeak.cost += period.cost / splitCount
            } else if (period.ratePeriod === 'Mid-Peak') {
              personalRatePeriods.midPeak.kwh += period.kwh / splitCount
              personalRatePeriods.midPeak.cost += period.cost / splitCount
            } else if (period.ratePeriod === 'Super Off-Peak') {
              personalRatePeriods.superOffPeak.kwh += period.kwh / splitCount
              personalRatePeriods.superOffPeak.cost += period.cost / splitCount
            }
          })
        }
      }
    })

    // Convert to member array
    const members = householdMembers.map(member => ({
      name: member.name,
      kwh: userTotals[member.id]?.kwh || 0,
      cost: userTotals[member.id]?.cost || 0
    }))

    // Get top devices
    const topDevices = Object.values(deviceTotals)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 15)
      .map(device => ({
        name: device.name,
        kwh: device.kwh,
        cost: device.cost
      }))

    // Calculate personal usage for current user
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    // Get first day of current month
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    
    // Get first day of current week (Sunday)
    const currentDay = now.getDay()
    const firstDayOfWeek = new Date(now.getTime() - currentDay * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    // Get first day of current year
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]

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

          // Use stored values if available (from bulk entry), otherwise use calculated values
          const logKwh = log.total_kwh ?? calculation.totalKwh
          const logCost = log.calculated_cost ?? calculation.totalCost

          const assignedUsers = log.assigned_users && log.assigned_users.length > 0 
            ? log.assigned_users 
            : [log.created_by]

          if (assignedUsers.includes(user?.id || '')) {
            const splitCount = assignedUsers.length
            kwh += logKwh / splitCount
            cost += logCost / splitCount
          }
        })

      return { kwh, cost }
    }
    
    // Calculate comparison periods
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const lastWeekStart = new Date(now.getTime() - (currentDay + 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const lastWeekEnd = new Date(now.getTime() - (currentDay + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
    
    const dailyCurrent = calculatePersonalUsage(today, today)
    const dailyPrevious = calculatePersonalUsage(yesterday, yesterday)
    
    const weeklyCurrent = calculatePersonalUsage(firstDayOfWeek)
    const weeklyPrevious = calculatePersonalUsage(lastWeekStart, lastWeekEnd)
    
    const monthlyCurrent = calculatePersonalUsage(firstDayOfMonth)
    const monthlyPrevious = calculatePersonalUsage(lastMonthStart, lastMonthEnd)
    
    // Current user's totals within the selected timeframe
    const personalInFilter = user?.id ? (userTotals[user.id] || { kwh: 0, cost: 0 }) : { kwh: 0, cost: 0 }

    return {
      personalUsage: {
        daily: { 
          ...dailyCurrent, 
          comparison: dailyPrevious.kwh > 0 
            ? ((dailyCurrent.kwh - dailyPrevious.kwh) / dailyPrevious.kwh * 100) 
            : 0 
        },
        weekly: { 
          ...weeklyCurrent, 
          comparison: weeklyPrevious.kwh > 0 
            ? ((weeklyCurrent.kwh - weeklyPrevious.kwh) / weeklyPrevious.kwh * 100) 
            : 0 
        },
        monthly: { 
          ...monthlyCurrent, 
          comparison: monthlyPrevious.kwh > 0 
            ? ((monthlyCurrent.kwh - monthlyPrevious.kwh) / monthlyPrevious.kwh * 100) 
            : 0 
        },
        yearToDate: calculatePersonalUsage(firstDayOfYear)
      },
      householdUsage: {
        total: { kwh: totalKwh, cost: totalCost },
        members
      },
      personalInFilter,
      topDevices,
      ratePeriods: {
        personal: personalRatePeriods,
        household: ratePeriods
      },
      // Add projection data (personal and household)
      monthProjection: {
        personal: {
          currentCost: monthlyCurrent.cost,
          daysElapsed: now.getDate(),
          daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
          projectedCost: monthlyCurrent.cost > 0 
            ? (monthlyCurrent.cost / now.getDate()) * new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
            : 0
        },
        household: {
          // Calculate household total for CURRENT MONTH only
          currentCost: (() => {
            let householdMonthCost = 0
            energyLogs
              .filter(log => log.usage_date >= firstDayOfMonth && log.usage_date <= today)
              .forEach(log => {
                const device = devices.find(d => d.id === log.device_id)
                if (!device) return
                const calculation = calculateUsageCost(
                  device.wattage,
                  log.start_time,
                  log.end_time,
                  log.usage_date
                )
                householdMonthCost += log.calculated_cost ?? calculation.totalCost
              })
            return householdMonthCost
          })(),
          daysElapsed: now.getDate(),
          daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
          get projectedCost() {
            return this.currentCost > 0 
              ? (this.currentCost / this.daysElapsed) * this.daysInMonth
              : 0
          }
        }
      }
    }
  }, [filteredLogs, devices, householdMembers, user])

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
        if (hour >= 16 && hour < 21) return { name: 'On-Peak', rate: 0.55, color: '#ef4444' }
        return { name: 'Off-Peak', rate: 0.25, color: '#22c55e' }
      } else {
        if (hour >= 16 && hour < 21) return { name: 'Mid-Peak', rate: 0.37, color: '#f59e0b' }
        return { name: 'Off-Peak', rate: 0.25, color: '#22c55e' }
      }
    }
    // Winter rates (October-May)
    else {
      if (hour >= 21 || hour < 8) return { name: 'Off-Peak', rate: 0.24, color: '#22c55e' }
      if (hour >= 8 && hour < 16) return { name: 'Super Off-Peak', rate: 0.24, color: '#3b82f6' }
      return { name: 'Mid-Peak', rate: 0.52, color: '#f59e0b' }
    }
  }

  const currentRate = getCurrentRatePeriod()

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

        // Use stored values if available (from bulk entry), otherwise use calculated values
        const logKwh = log.total_kwh ?? calculation.totalKwh

        const assignedUsers = log.assigned_users && log.assigned_users.length > 0 
          ? log.assigned_users 
          : [log.created_by]

        const splitCount = assignedUsers.length

        assignedUsers.forEach((userId: string) => {
          const member = householdMembers.find(m => m.id === userId)
          if (member) {
            dayData[member.name] = Number((dayData[member.name] + (logKwh / splitCount)).toFixed(2))
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
          // Use stored values if available (from bulk entry), otherwise use calculated values
          totalKwh += log.total_kwh ?? calculation.totalKwh
          totalCost += log.calculated_cost ?? calculation.totalCost
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
          <BoltIcon className="w-16 h-16 md:w-24 md:h-24 mb-4 energy-pulse text-orange-400 mx-auto" />
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
            <EyeIcon className="w-8 h-8 md:w-10 md:h-10 text-yellow-500" />
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
          <h1 className="text-2xl md:text-3xl font-bold energy-pulse flex items-center gap-2">
            <BoltIcon className="w-7 h-7 md:w-8 md:h-8 text-orange-400" />
            Energy Dashboard
          </h1>
          <Badge className="bg-white/20 text-white border-white/30 text-xs md:text-sm px-2 md:px-3 py-1">
            {getSeason(currentTime) === 'summer' ? '☀️ Summer' : '☁️ Winter'} • {currentTime.getDay() === 0 || currentTime.getDay() === 6 ? 'Weekend' : 'Weekday'}
          </Badge>
        </div>
        
        {/* Combined Current Rate & Schedule */}
        <div>
          <div className="text-sm md:text-base font-semibold opacity-90 mb-2">Current Rate:</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
            {(() => {
              const season = getSeason(currentTime)
              const isWeekend = currentTime.getDay() === 0 || currentTime.getDay() === 6
              const rates = season === 'summer' 
                ? (isWeekend ? SUMMER_RATES.weekend : SUMMER_RATES.weekday)
                : WINTER_RATES
              
              return rates.map((period, idx) => {
                const isActive = currentRate.name === period.name
                
                // Format time to 12-hour format
                const formatTime = (time: string) => {
                  const [h, m] = time.split(':').map(Number)
                  if (h === 0) return '12:00 AM'
                  if (h < 12) return `${h}:${m.toString().padStart(2, '0')} AM`
                  if (h === 12) return '12:00 PM'
                  return `${h - 12}:${m.toString().padStart(2, '0')} PM`
                }
                
                // Get color scheme based on rate period
                const getColorScheme = (name: string) => {
                  if (name === 'Off-Peak') return {
                    bg: 'from-green-500/20 to-emerald-500/20',
                    border: 'border-green-500/40',
                    ring: 'ring-green-500/50',
                    activeBg: 'from-green-500/30 to-emerald-500/30'
                  }
                  if (name === 'Super Off-Peak') return {
                    bg: 'from-blue-500/20 to-cyan-500/20',
                    border: 'border-blue-500/40',
                    ring: 'ring-blue-500/50',
                    activeBg: 'from-blue-500/30 to-cyan-500/30'
                  }
                  if (name === 'Mid-Peak') return {
                    bg: 'from-yellow-500/20 to-orange-500/20',
                    border: 'border-yellow-500/40',
                    ring: 'ring-yellow-500/50',
                    activeBg: 'from-yellow-500/30 to-orange-500/30'
                  }
                  if (name === 'On-Peak') return {
                    bg: 'from-red-500/20 to-pink-500/20',
                    border: 'border-red-500/40',
                    ring: 'ring-red-500/50',
                    activeBg: 'from-red-500/30 to-pink-500/30'
                  }
                  return {
                    bg: 'from-white/10 to-white/5',
                    border: 'border-white/20',
                    ring: 'ring-white/50',
                    activeBg: 'from-white/20 to-white/10'
                  }
                }
                
                const colors = getColorScheme(period.name)
                
                return (
                  <div
                    key={idx}
                    className={`px-3 md:px-4 py-2.5 md:py-3 rounded-lg transition-all ${
                      isActive
                        ? `bg-gradient-to-r ${colors.activeBg} text-white font-bold shadow-lg ring-2 ${colors.ring} scale-105 border-2 ${colors.border}` 
                        : `bg-gradient-to-r ${colors.bg} text-white/80 border ${colors.border}`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{period.color}</span>
                        <span className="text-sm md:text-base font-semibold">{period.name}</span>
                      </div>
                      {isActive && (
                        <Badge className="bg-orange-500 text-white text-xs px-2 py-0.5 border-0">
                          NOW
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs md:text-sm opacity-90 mb-1">
                      {formatTime(period.start)} - {formatTime(period.end)}
                    </div>
                    <div className="text-sm md:text-base font-bold">
                      ${period.rate.toFixed(2)}/kWh
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      </header>

      {/* ========================================= */}
      {/* HOUSEHOLD OVERVIEW WITH YOUR SHARE      */}
      {/* ========================================= */}

      <section className="mb-6 slide-up">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3 md:mb-4">
          <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
            <HomeIcon className="w-6 h-6 text-cyan-400" />
            🏠 Household Overview
          </h2>
          <div 
            className="flex flex-wrap gap-1.5 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50"
            role="tablist"
            aria-label="Usage timeframe filter"
          >
            <button
              onClick={() => setUsageTimeframe('month')}
              role="tab"
              aria-pressed={usageTimeframe === 'month'}
              aria-label={`This Month (${filterCounts.month} logs)`}
              className={`px-3 sm:px-4 py-2 text-sm font-semibold rounded-md transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                usageTimeframe === 'month'
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              This Month <span className="opacity-70">({filterCounts.month})</span>
            </button>
            <button
              onClick={() => setUsageTimeframe('lastMonth')}
              role="tab"
              aria-pressed={usageTimeframe === 'lastMonth'}
              aria-label={`Last Month (${filterCounts.lastMonth} logs)`}
              className={`px-3 sm:px-4 py-2 text-sm font-semibold rounded-md transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                usageTimeframe === 'lastMonth'
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              Last Month <span className="opacity-70">({filterCounts.lastMonth})</span>
            </button>
            <button
              onClick={() => setUsageTimeframe('year')}
              role="tab"
              aria-pressed={usageTimeframe === 'year'}
              aria-label={`This Year (${filterCounts.year} logs)`}
              className={`px-3 sm:px-4 py-2 text-sm font-semibold rounded-md transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                usageTimeframe === 'year'
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              This Year <span className="opacity-70">({filterCounts.year})</span>
            </button>
            <button
              onClick={() => setUsageTimeframe('all')}
              role="tab"
              aria-pressed={usageTimeframe === 'all'}
              aria-label={`All Time (${filterCounts.all} logs)`}
              className={`px-3 sm:px-4 py-2 text-sm font-semibold rounded-md transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                usageTimeframe === 'all'
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              All Time <span className="opacity-70">({filterCounts.all})</span>
            </button>
          </div>
        </div>

        {/* Your Quick Summary */}
        <Card className="energy-card bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-purple-400" />
                <span className="font-semibold text-foreground">Your Quick Summary</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Today: </span>
                  <strong className="text-green-400">{dashboardData.personalUsage.daily.kwh.toFixed(1)} kWh</strong>
                  <span className="text-muted-foreground"> (${dashboardData.personalUsage.daily.cost.toFixed(2)})</span>
                </div>
                <div className="hidden sm:block text-muted-foreground">•</div>
                <div>
                  <span className="text-muted-foreground">This Week: </span>
                  <strong className="text-blue-400">{dashboardData.personalUsage.weekly.kwh.toFixed(1)} kWh</strong>
                  <span className="text-muted-foreground"> (${dashboardData.personalUsage.weekly.cost.toFixed(2)})</span>
                </div>
                <div className="hidden sm:block text-muted-foreground">•</div>
                <div>
                  <span className="text-muted-foreground">This Month: </span>
                  <strong className="text-red-400">{dashboardData.personalUsage.monthly.kwh.toFixed(1)} kWh</strong>
                  <span className="text-muted-foreground"> (${dashboardData.personalUsage.monthly.cost.toFixed(2)})</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Household with Your Share Highlighted */}
        <Card className="energy-card bg-gradient-to-br from-primary/15 via-emerald-500/10 to-cyan-500/15 border-primary/40 hover:border-primary/60 transition-all shadow-lg hover:shadow-primary/20 mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <HomeIcon className="w-5 h-5 text-cyan-400" />
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

            {/* Everyone's Share */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
              {dashboardData.householdUsage.members.map((member, index) => {
                const normalizedName = member.name.toLowerCase()
                const colorClass = normalizedName.includes('vu')
                  ? 'purple'
                  : normalizedName.includes('vy')
                  ? 'red'
                  : normalizedName.includes('thuy')
                  ? 'yellow'
                  : normalizedName.includes('han')
                  ? 'blue'
                  : ['green','yellow','red','blue','purple'][index % 5]
                const isCurrentUser = householdMembers.find(m => m.id === (user?.id || ''))?.name === member.name
                const pct = dashboardData.householdUsage.total.kwh > 0
                  ? ((member.kwh / dashboardData.householdUsage.total.kwh) * 100).toFixed(1)
                  : '0'
                const border = `border-${colorClass}-500/40`
                const text = `text-${colorClass}-400`
                const bgFrom = colorClass === 'purple' ? 'from-purple-500/20' : colorClass === 'red' ? 'from-red-500/20' : colorClass === 'yellow' ? 'from-yellow-500/20' : colorClass === 'blue' ? 'from-blue-500/20' : 'from-green-500/20'
                const bgTo = colorClass === 'purple' ? 'to-pink-500/20' : colorClass === 'red' ? 'to-pink-500/20' : colorClass === 'yellow' ? 'to-orange-500/20' : colorClass === 'blue' ? 'to-cyan-500/20' : 'to-emerald-500/20'
                return (
                  <Card key={member.name} className={`bg-gradient-to-br ${bgFrom} ${bgTo} border ${border} ${isCurrentUser ? 'ring-2 ring-current/30' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <UserIcon className={`w-5 h-5 ${text}`} />
                          <span className="font-bold text-foreground">
                            {member.name} {isCurrentUser && <span className={`${text} text-xs font-semibold`}>(You)</span>}
                          </span>
                        </div>
                        <span className={`text-xs ${text}`}>{pct}%</span>
                      </div>
                      <div className={`text-3xl font-bold mb-1 ${text}`}>
                        {member.kwh.toFixed(1)} kWh
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <strong className={`${text}`}>${member.cost.toFixed(2)}</strong>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Member Breakdown list removed to avoid repetition with cards */}
          </CardContent>
        </Card>

        {/* Usage by Rate Period */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <h3 className="text-base font-semibold text-foreground">Usage by Rate Period</h3>
            <div className="flex gap-2 bg-muted/30 rounded-lg p-1">
              <button
                onClick={() => setRatePeriodView('personal')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  ratePeriodView === 'personal'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <UserIcon className="w-3 h-3 inline mr-1" />
                My Usage
              </button>
              <button
                onClick={() => setRatePeriodView('household')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  ratePeriodView === 'household'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <UserGroupIcon className="w-3 h-3 inline mr-1" />
                Household
              </button>
            </div>
          </div>
          {(() => {
            const periods = dashboardData.ratePeriods[ratePeriodView]
            const segments = [
              { name: 'Off-Peak', kwh: periods.offPeak.kwh, cost: periods.offPeak.cost, color: '#22c55e' },
              { name: 'Mid-Peak', kwh: periods.midPeak.kwh, cost: periods.midPeak.cost, color: '#eab308' },
              { name: 'On-Peak', kwh: periods.onPeak.kwh, cost: periods.onPeak.cost, color: '#ef4444' },
              { name: 'Super Off-Peak', kwh: periods.superOffPeak.kwh, cost: periods.superOffPeak.cost, color: '#3b82f6' }
            ].filter(s => s.kwh > 0)

            const total = segments.reduce((sum, s) => sum + s.kwh, 0)

            if (total === 0) {
              return (
                <div className="h-[120px] flex items-center justify-center text-muted-foreground text-sm">
                  No usage in this timeframe.
                </div>
              )
            }

            return (
              <div className="space-y-3">
                <div className="w-full h-6 rounded-full bg-muted/30 overflow-hidden flex">
                  {segments.map((s, idx) => (
                    <div
                      key={idx}
                      title={`${s.name}: ${s.kwh.toFixed(1)} kWh ($${s.cost.toFixed(2)})`}
                      style={{ width: `${(s.kwh / total) * 100}%`, backgroundColor: s.color }}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {segments.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-muted-foreground">{s.name}:</span>
                      <span className="font-semibold">{s.kwh.toFixed(1)} kWh</span>
                      <span className="text-muted-foreground">(${s.cost.toFixed(2)})</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
        
        {/* Dynamic Peak Alert (only when currently in highest-priced period) */}
        {(() => {
          const season = getSeason(currentTime)
          const isWeekend = currentTime.getDay() === 0 || currentTime.getDay() === 6
          const highestName = season === 'summer' ? (isWeekend ? 'Mid-Peak' : 'On-Peak') : 'Mid-Peak'

          if (currentRate.name === highestName) {
            return highestName === 'On-Peak' ? (
              <div className="mt-4 bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20 border-2 border-red-500/50 rounded-lg p-3 md:p-4 shadow-lg">
                <div className="flex items-center justify-center gap-2 md:gap-3">
                  <ExclamationTriangleIcon className="w-8 h-8 md:w-10 md:h-10 text-yellow-400 animate-pulse" />
                  <div className="text-center">
                    <div className="text-red-400 font-bold text-base md:text-lg mb-1 flex items-center justify-center gap-2">
                      <BoltIcon className="w-4 h-4 md:w-5 md:h-5 text-orange-400" />
                      Avoid Peak Hours
                    </div>
                    <div className="text-white font-semibold text-sm md:text-base flex items-center justify-center gap-2">
                      <ClockIcon className="w-4 h-4" />
                      4:01 PM - 9:00 PM (Weekdays)
                    </div>
                    <div className="text-red-300 text-xs md:text-sm mt-1">
                      On-Peak Period - Highest Rates ($0.55/kWh)
                    </div>
                  </div>
                  <ExclamationTriangleIcon className="w-8 h-8 md:w-10 md:h-10 text-yellow-400 animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="mt-4 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 border-2 border-yellow-500/50 rounded-lg p-3 md:p-4 shadow-lg">
                <div className="flex items-center justify-center gap-2 md:gap-3">
                  <ExclamationTriangleIcon className="w-8 h-8 md:w-10 md:h-10 text-yellow-400 animate-pulse" />
                  <div className="text-center">
                    <div className="text-yellow-400 font-bold text-base md:text-lg mb-1 flex items-center justify-center gap-2">
                      <BoltIcon className="w-4 h-4 md:w-5 md:h-5 text-orange-400" />
                      Watch Peak Hours
                    </div>
                    <div className="text-white font-semibold text-sm md:text-base flex items-center justify-center gap-2">
                      <ClockIcon className="w-4 h-4" />
                      4:00 PM - 8:59 PM (Daily)
                    </div>
                    <div className="text-yellow-300 text-xs md:text-sm mt-1">
                      Mid-Peak Period - Higher Rates ($0.52/kWh)
                    </div>
                  </div>
                  <ExclamationTriangleIcon className="w-8 h-8 md:w-10 md:h-10 text-yellow-400 animate-pulse" />
                </div>
              </div>
            )
          }
          return null
        })()}
      </section>

      {/* Device Analysis */}
      <section className="mb-6 slide-up">
        <Card className="energy-card">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <CpuChipIcon className="w-5 h-5 text-cyan-400" />
              Top Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.topDevices.length > 0 ? (
              <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {dashboardData.topDevices.map((device, index) => {
                  const COLORS = ['#22c55e', '#eab308', '#ef4444', '#3b82f6', '#8b5cf6']
                  const percentage = dashboardData.householdUsage.total.kwh > 0 
                    ? ((device.kwh / dashboardData.householdUsage.total.kwh) * 100).toFixed(1)
                    : 0
                  
                  const getCostColor = (cost: number) => {
                    if (cost > 100) return 'text-red-400'
                    if (cost > 20) return 'text-yellow-400'
                    return 'text-green-400'
                  }
                  
                  return (
                    <div key={index} className="group p-2.5 rounded-lg hover:bg-muted/50 transition-all">
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2.5 flex-1">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
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
            ) : (
              <div className="text-center text-muted-foreground text-sm py-12">
                <CpuChipIcon className="w-16 h-16 mx-auto mb-3 text-cyan-400 opacity-50" />
                <p className="text-base font-medium">No device usage data available</p>
                <p className="text-xs mt-1">Start logging energy usage to see device breakdown</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>


      {/* Data Visualization Charts */}
      <section className="mb-8 slide-up">
        <h2 className="mb-3 md:mb-5 text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
          <ChartPieIcon className="w-6 h-6 text-blue-400" />
          Usage Trends & Analysis
        </h2>
        
        {/* Weekly Usage */}
        <div className="mb-4 md:mb-6">
          <Card className="energy-card chart-hover">
            <CardHeader>
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-blue-400" />
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
                    <ChartBarIcon className="w-16 h-16 mx-auto mb-2 text-blue-400 opacity-50" />
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
              <ArrowTrendingUpIcon className="w-5 h-5 text-green-400" />
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
                  <ArrowTrendingUpIcon className="w-16 h-16 mx-auto mb-3 text-primary opacity-50" />
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
