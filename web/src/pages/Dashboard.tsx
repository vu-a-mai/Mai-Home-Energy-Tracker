import { useAuth } from '../hooks/useAuth'
import { useDemoMode } from '../contexts/DemoContext'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts'
import { userService, deviceService, energyLogService } from '../services/database'
import { demoUserService, demoDeviceService, demoEnergyLogService } from '../demo/demoService'
import type { User, Device, EnergyLog } from '../lib/supabase'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { isDemoMode, disableDemoMode } = useDemoMode()
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [householdMembers, setHouseholdMembers] = useState<User[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [energyLogs, setEnergyLogs] = useState<EnergyLog[]>([])
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Use demo services if in demo mode, otherwise use real services
        if (isDemoMode) {
          const userData = await demoUserService.getCurrentUser()
          setCurrentUser(userData)
          
          if (userData?.household_id) {
            const [members, householdDevices, logs, monthly] = await Promise.all([
              demoUserService.getHouseholdMembers(userData.household_id),
              demoDeviceService.getHouseholdDevices(userData.household_id),
              demoEnergyLogService.getHouseholdLogs(userData.household_id, 50),
              demoEnergyLogService.getMonthlyUsage(userData.household_id, new Date().getFullYear())
            ])
            
            setHouseholdMembers(members)
            setDevices(householdDevices)
            setEnergyLogs(logs)
            setMonthlyData(monthly)
          }
        } else if (user) {
          // Fetch real data from Supabase
          const userData = await userService.getCurrentUser()
          setCurrentUser(userData)
          
          if (userData?.household_id) {
            const [members, householdDevices, logs, monthly] = await Promise.all([
              userService.getHouseholdMembers(userData.household_id),
              deviceService.getHouseholdDevices(userData.household_id),
              energyLogService.getHouseholdLogs(userData.household_id, 50),
              energyLogService.getMonthlyUsage(userData.household_id, new Date().getFullYear())
            ])
            
            setHouseholdMembers(members)
            setDevices(householdDevices)
            setEnergyLogs(logs)
            setMonthlyData(monthly)
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchDashboardData()
  }, [user, isDemoMode])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Calculate data from actual energy logs
  const calculateDashboardData = () => {
    if (energyLogs.length === 0) {
      // Fallback mock data when no logs available
      return {
        personalUsage: {
          daily: { kwh: 0, cost: 0 },
          weekly: { kwh: 0, cost: 0 },
          monthly: { kwh: 0, cost: 0 }
        },
        householdUsage: {
          total: { kwh: 0, cost: 0 },
          members: [
            { name: 'Vu', kwh: 0, cost: 0 },
            { name: 'Thuy', kwh: 0, cost: 0 },
            { name: 'Vy', kwh: 0, cost: 0 },
            { name: 'Han', kwh: 0, cost: 0 }
          ]
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

    // Calculate total household usage from energy logs
    const totalCost = energyLogs.reduce((sum, log) => sum + (log.calculated_cost || 0), 0)
    
    // Calculate kWh from device wattage and duration
    const totalKwh = energyLogs.reduce((sum, log) => {
      if (log.total_kwh) {
        return sum + log.total_kwh
      }
      // Calculate from device wattage and time if not provided
      const device = devices.find(d => d.id === log.device_id)
      if (device) {
        const startTime = new Date(`2000-01-01T${log.start_time}`)
        const endTime = new Date(`2000-01-01T${log.end_time}`)
        const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
        const kwh = (device.wattage / 1000) * hours
        return sum + kwh
      }
      return sum
    }, 0)

    // Calculate per-user totals
    const userTotals: { [key: string]: { kwh: number, cost: number } } = {}
    energyLogs.forEach(log => {
      const userId = log.created_by || 'unknown'
      if (!userTotals[userId]) {
        userTotals[userId] = { kwh: 0, cost: 0 }
      }
      
      // Calculate kWh
      let kwh = 0
      if (log.total_kwh) {
        kwh = log.total_kwh
      } else {
        const device = devices.find(d => d.id === log.device_id)
        if (device) {
          const startTime = new Date(`2000-01-01T${log.start_time}`)
          const endTime = new Date(`2000-01-01T${log.end_time}`)
          const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
          kwh = (device.wattage / 1000) * hours
        }
      }
      
      userTotals[userId].kwh += kwh
      userTotals[userId].cost += log.calculated_cost || 0
    })

    // Map user IDs to names
    const userNames: { [key: string]: string } = {
      'demo-user-vu': 'Vu',
      'demo-user-thuy': 'Thuy',
      'demo-user-vy': 'Vy',
      'demo-user-han': 'Han'
    }

    const members = Object.entries(userTotals).map(([userId, data]) => ({
      name: userNames[userId] || userId,
      kwh: data.kwh,
      cost: data.cost
    }))

    // Calculate top devices
    const deviceTotals: { [key: string]: { kwh: number, cost: number, name: string, type: string } } = {}
    energyLogs.forEach(log => {
      const deviceId = log.device_id
      const device = devices.find(d => d.id === deviceId)
      if (device) {
        if (!deviceTotals[deviceId]) {
          const isShared = (device as any).is_shared !== false // Default to shared if not specified
          deviceTotals[deviceId] = {
            name: device.name,
            kwh: 0,
            cost: 0,
            type: isShared ? 'shared' : 'personal'
          }
        }
        // Use actual kWh from log
        const kwh = log.total_kwh || 0
        const cost = log.calculated_cost || 0
        deviceTotals[deviceId].kwh += kwh
        deviceTotals[deviceId].cost += cost
      }
    })

    const topDevices = Object.values(deviceTotals)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 4)

    // Calculate rate period breakdown from energy logs
    const ratePeriods = {
      offPeak: { kwh: 0, cost: 0 },
      midPeak: { kwh: 0, cost: 0 },
      onPeak: { kwh: 0, cost: 0 },
      superOffPeak: { kwh: 0, cost: 0 }
    }

    energyLogs.forEach(log => {
      if (log.rate_breakdown) {
        const breakdown = typeof log.rate_breakdown === 'string' 
          ? JSON.parse(log.rate_breakdown) 
          : log.rate_breakdown

        if (breakdown.off_peak) {
          ratePeriods.offPeak.kwh += breakdown.off_peak.kwh || 0
          ratePeriods.offPeak.cost += breakdown.off_peak.cost || 0
        }
        if (breakdown.mid_peak) {
          ratePeriods.midPeak.kwh += breakdown.mid_peak.kwh || 0
          ratePeriods.midPeak.cost += breakdown.mid_peak.cost || 0
        }
        if (breakdown.on_peak) {
          ratePeriods.onPeak.kwh += breakdown.on_peak.kwh || 0
          ratePeriods.onPeak.cost += breakdown.on_peak.cost || 0
        }
        if (breakdown.super_off_peak) {
          ratePeriods.superOffPeak.kwh += breakdown.super_off_peak.kwh || 0
          ratePeriods.superOffPeak.cost += breakdown.super_off_peak.cost || 0
        }
      }
    })

    return {
      personalUsage: {
        daily: { kwh: totalKwh / 30, cost: totalCost / 30 },
        weekly: { kwh: totalKwh / 4, cost: totalCost / 4 },
        monthly: { kwh: totalKwh, cost: totalCost }
      },
      householdUsage: {
        total: { kwh: totalKwh, cost: totalCost },
        members
      },
      topDevices,
      ratePeriods
    }
  }

  const mockData = calculateDashboardData()

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

  // Calculate weekly usage data from real energy logs
  const calculateWeeklyUsageData = () => {
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
      
      const dayData: any = { day: dayName }
      
      // Calculate per-user usage for this day
      householdMembers.forEach(member => {
        const memberLogs = dayLogs.filter(log => log.created_by === member.id)
        const memberKwh = memberLogs.reduce((sum, log) => sum + (log.total_kwh || 0), 0)
        dayData[member.name] = Number(memberKwh.toFixed(1))
      })
      
      weeklyData.push(dayData)
    }
    
    return weeklyData.length > 0 ? weeklyData : [
      { day: 'Mon', Vu: 0, Thuy: 0, Vy: 0, Han: 0 },
      { day: 'Tue', Vu: 0, Thuy: 0, Vy: 0, Han: 0 },
      { day: 'Wed', Vu: 0, Thuy: 0, Vy: 0, Han: 0 },
      { day: 'Thu', Vu: 0, Thuy: 0, Vy: 0, Han: 0 },
      { day: 'Fri', Vu: 0, Thuy: 0, Vy: 0, Han: 0 },
      { day: 'Sat', Vu: 0, Thuy: 0, Vy: 0, Han: 0 },
      { day: 'Sun', Vu: 0, Thuy: 0, Vy: 0, Han: 0 }
    ]
  }
  
  const weeklyUsageData = calculateWeeklyUsageData()

  // Use real monthly data if available, otherwise show empty
  const monthlyTrendData = monthlyData.length > 0 ? 
    monthlyData.map(data => ({
      month: new Date(2024, data.month - 1).toLocaleDateString('en', { month: 'short' }),
      usage: data.usage,
      cost: data.cost
    })) : []

  // Use real device data from calculated top devices
  const deviceUsageData = mockData.topDevices.length > 0 ?
    mockData.topDevices.map(device => ({
      name: device.name.split(' ').slice(-1)[0],
      usage: device.kwh,
      cost: device.cost
    })) : []

  const COLORS = ['#22c55e', '#eab308', '#ef4444', '#3b82f6']

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-5 min-h-screen bg-background text-foreground font-sans fade-in flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 energy-pulse">⚡</div>
          <h2 className="text-2xl font-bold mb-2">Loading Dashboard...</h2>
          <p className="text-muted-foreground">Fetching your energy data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-5 min-h-screen bg-background text-foreground font-sans fade-in">
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="mb-4 p-4 bg-yellow-500/20 border-2 border-yellow-500 rounded-lg flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👁️</span>
            <div>
              <h3 className="font-bold text-yellow-500">Demo Mode Active</h3>
              <p className="text-sm text-yellow-200">Using demo data - Supabase connection unavailable</p>
            </div>
          </div>
          <Button 
            onClick={() => {
              disableDemoMode()
              navigate('/login')
            }}
            variant="outline"
            className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/20"
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
        <h2 className="mb-4 text-xl font-bold text-foreground">🚀 Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={handleManageDevices}
            className="quick-actions-card p-5 rounded-lg text-left flex items-center gap-4 hover:scale-105 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all duration-300 text-foreground group"
          >
            <div className="text-3xl group-hover:scale-110 transition-transform">🔌</div>
            <div>
              <div className="font-bold text-base mb-1">Manage Devices</div>
              <div className="text-xs text-muted-foreground">Add or edit devices</div>
            </div>
          </button>
          
          <button 
            onClick={handleLogEnergyUsage}
            className="quick-actions-card p-5 rounded-lg text-left flex items-center gap-4 hover:scale-105 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all duration-300 text-foreground group"
          >
            <div className="text-3xl group-hover:scale-110 transition-transform">📝</div>
            <div>
              <div className="font-bold text-base mb-1">Log Energy Usage</div>
              <div className="text-xs text-muted-foreground">Record usage sessions</div>
            </div>
          </button>
          
          <button 
            onClick={handleSplitBill}
            className="quick-actions-card p-5 rounded-lg text-left flex items-center gap-4 hover:scale-105 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all duration-300 text-foreground group"
          >
            <div className="text-3xl group-hover:scale-110 transition-transform">💳</div>
            <div>
              <div className="font-bold text-base mb-1">Split Monthly Bill</div>
              <div className="text-xs text-muted-foreground">Calculate cost allocation</div>
            </div>
          </button>
        </div>
      </section>

      {/* Rate Period Breakdown */}
      <section className="mb-6 slide-up">
        <h2 className="mb-4 text-xl font-bold text-foreground">⏰ Rate Period Breakdown</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="energy-gradient-green p-4 rounded-lg text-center rate-indicator hover:scale-105 transition-transform shadow-lg">
            <div className="text-3xl mb-2">🟢</div>
            <div className="font-bold text-white text-base mb-2">Off-Peak</div>
            <div className="text-sm text-white font-semibold">{mockData.ratePeriods.offPeak.kwh.toFixed(1)} kWh</div>
            <div className="text-xs text-white/80">${mockData.ratePeriods.offPeak.cost.toFixed(2)}</div>
          </div>
        
          <div className="energy-gradient-yellow p-4 rounded-lg text-center rate-indicator hover:scale-105 transition-transform shadow-lg">
            <div className="text-3xl mb-2">🟡</div>
            <div className="font-bold text-white text-base mb-2">Mid-Peak</div>
            <div className="text-sm text-white font-semibold">{mockData.ratePeriods.midPeak.kwh.toFixed(1)} kWh</div>
            <div className="text-xs text-white/80">${mockData.ratePeriods.midPeak.cost.toFixed(2)}</div>
          </div>
        
          <div className="energy-gradient-red p-4 rounded-lg text-center rate-indicator hover:scale-105 transition-transform shadow-lg">
            <div className="text-3xl mb-2">🔴</div>
            <div className="font-bold text-white text-base mb-2">On-Peak</div>
            <div className="text-sm text-white font-semibold">{mockData.ratePeriods.onPeak.kwh.toFixed(1)} kWh</div>
            <div className="text-xs text-white/80">${mockData.ratePeriods.onPeak.cost.toFixed(2)}</div>
          </div>
        
          <div className="energy-gradient-blue p-4 rounded-lg text-center rate-indicator hover:scale-105 transition-transform shadow-lg">
            <div className="text-3xl mb-2">🔵</div>
            <div className="font-bold text-white text-base mb-2">Super Off-Peak</div>
            <div className="text-sm text-white font-semibold">{mockData.ratePeriods.superOffPeak.kwh.toFixed(1)} kWh</div>
            <div className="text-xs text-white/80">${mockData.ratePeriods.superOffPeak.cost.toFixed(2)}</div>
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
        <h2 className="mb-4 text-xl font-bold text-foreground">📊 Personal Usage Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="energy-card bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 hover:border-green-500/50 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📅</span>
                <span className="text-xs text-muted-foreground font-semibold">Daily Usage</span>
              </div>
              <div className="text-2xl font-bold text-green-400 mb-1">
                {mockData.personalUsage.daily.kwh.toFixed(1)} kWh
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                Cost: <strong className="text-green-400">${mockData.personalUsage.daily.cost.toFixed(2)}</strong>
              </div>
              <Badge variant="off-peak" className="text-xs">
                ↓ 12% from yesterday
              </Badge>
            </CardContent>
          </Card>

          <Card className="energy-card bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30 hover:border-blue-500/50 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📈</span>
                <span className="text-xs text-muted-foreground font-semibold">Weekly Usage</span>
              </div>
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {mockData.personalUsage.weekly.kwh.toFixed(1)} kWh
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                Cost: <strong className="text-blue-400">${mockData.personalUsage.weekly.cost.toFixed(2)}</strong>
              </div>
              <Badge variant="mid-peak" className="text-xs">
                ↑ 5% from last week
              </Badge>
            </CardContent>
          </Card>

          <Card className="energy-card bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30 hover:border-red-500/50 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📊</span>
                <span className="text-xs text-muted-foreground font-semibold">Monthly Usage</span>
              </div>
              <div className="text-2xl font-bold text-red-400 mb-1">
                {mockData.personalUsage.monthly.kwh.toFixed(1)} kWh
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                Cost: <strong className="text-red-400">${mockData.personalUsage.monthly.cost.toFixed(2)}</strong>
              </div>
              <Badge variant="off-peak" className="text-xs">
                ↓ 8% from last month
              </Badge>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Household Summary & Device Analysis */}
      <section className="mb-6 slide-up">
        <h2 className="mb-4 text-xl font-bold text-foreground">🏠 Household Summary & Device Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Total Household Usage */}
          <Card className="energy-card">
            <CardHeader>
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                📈 Total Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {mockData.householdUsage.total.kwh.toFixed(1)} kWh
              </div>
              <div className="text-muted-foreground mb-4">
                Total Cost: <strong className="text-foreground">${mockData.householdUsage.total.cost.toFixed(2)}</strong>
              </div>
              
              <div className="space-y-2">
                {mockData.householdUsage.members.map((member, index) => {
                  // Color code to match bar chart
                  const getUserColor = (name: string) => {
                    switch(name) {
                      case 'Vu': return 'text-green-400'
                      case 'Thuy': return 'text-yellow-400'
                      case 'Vy': return 'text-red-400'
                      case 'Han': return 'text-blue-400'
                      default: return 'text-foreground'
                    }
                  }
                  
                  return (
                    <div key={index} className="flex justify-between items-center">
                      <span className={`text-sm font-medium ${getUserColor(member.name)}`}>{member.name}</span>
                      <div className="text-right">
                        <div className={`text-sm font-semibold ${getUserColor(member.name)}`}>
                          {member.kwh.toFixed(1)} kWh
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Device Usage Pie Chart */}
          <Card className="energy-card">
            <CardHeader>
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                🔌 Device Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={deviceUsageData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="usage"
                  >
                    {deviceUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--color-card))', 
                      border: '2px solid hsl(var(--color-border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--color-foreground)) !important',
                      fontSize: '14px',
                      fontWeight: '500',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                      padding: '8px 12px'
                    }}
                    itemStyle={{ color: 'hsl(var(--color-foreground)) !important' }}
                    labelStyle={{ color: 'hsl(var(--color-foreground)) !important' }}
                    formatter={(value, name) => [
                      <span style={{ color: 'hsl(var(--color-foreground))' }}>{Number(value).toFixed(2)} kWh</span>, 
                      <span style={{ color: 'hsl(var(--color-foreground))' }}>{name}</span>
                    ]}
                    labelFormatter={() => <span style={{ color: 'hsl(var(--color-foreground))' }}>Device Energy Usage</span>}
                    position={{ x: 10, y: 10 }}
                    offset={20}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      fontSize: '12px', 
                      color: 'hsl(var(--color-foreground))',
                      paddingTop: '10px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Devices List */}
          <Card className="energy-card">
            <CardHeader>
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                🏆 Top Devices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockData.topDevices.map((device, index) => {
                  // Color code based on cost level
                  const getCostColor = (cost: number) => {
                    if (cost > 100) return 'text-red-400'
                    if (cost > 20) return 'text-yellow-400'
                    return 'text-green-400'
                  }
                  
                  return (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-foreground text-sm flex items-center gap-2">
                          {device.name.split(' ').slice(-2).join(' ')}
                          <Badge 
                            variant={device.type === 'shared' ? 'info' : 'warning'}
                            className="text-xs"
                          >
                            {device.type}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {device.kwh.toFixed(1)} kWh
                        </div>
                      </div>
                      <div className={`text-right font-semibold text-sm ${getCostColor(device.cost)}`}>
                        ${device.cost.toFixed(2)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Data Visualization Charts */}
      <section className="mb-8 slide-up">
        <h2 className="mb-5 text-xl font-bold text-foreground">📈 Usage Trends & Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Usage by Person Chart */}
          <Card className="energy-card chart-hover">
            <CardHeader>
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                📊 Weekly Usage by Person
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                    labelFormatter={(label) => `${label} - Daily Usage by Person`}
                  />
                  <Bar dataKey="Vu" fill="#22c55e" />
                  <Bar dataKey="Thuy" fill="#eab308" />
                  <Bar dataKey="Vy" fill="#ef4444" />
                  <Bar dataKey="Han" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Trend Chart */}
          <Card className="energy-card chart-hover">
            <CardHeader>
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                📈 Monthly Usage Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--color-muted-foreground))" />
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
                    formatter={(value) => [`${value} kWh`, 'Total Household Usage']}
                    labelFormatter={(label) => {
                      const monthData = monthlyTrendData.find(d => d.month === label);
                      return `${label} 2024 - Usage: ${monthData?.usage || 0} kWh (Cost: $${monthData?.cost || 0})`;
                    }}
                  />
                  <Line type="monotone" dataKey="usage" stroke="#22c55e" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </section>

    </div>
  )
}
