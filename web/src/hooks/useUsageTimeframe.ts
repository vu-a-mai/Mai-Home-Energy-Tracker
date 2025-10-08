import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

export type UsageTimeframe = 'month' | 'lastMonth' | 'year' | 'all'

const PARAM = 'range'
const STORAGE_KEY = 'dashboard.range'

const validRanges: UsageTimeframe[] = ['month', 'lastMonth', 'year', 'all']

function normalizeRange(value: string | null | undefined): UsageTimeframe | null {
  if (!value) return null
  return validRanges.includes(value as UsageTimeframe)
    ? (value as UsageTimeframe)
    : null
}

export function useUsageTimeframe(energyLogs: { usage_date: string }[]) {
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Priority: URL > localStorage > default
  const getInitialRange = (): UsageTimeframe => {
    const urlRange = normalizeRange(searchParams.get(PARAM))
    if (urlRange) return urlRange
    
    const storageRange = normalizeRange(
      typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    )
    if (storageRange) return storageRange
    
    return 'year'
  }
  
  const [timeframe, setTimeframeState] = useState<UsageTimeframe>(getInitialRange)

  // Persist to URL and storage when timeframe changes
  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    next.set(PARAM, timeframe)
    setSearchParams(next, { replace: true })
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, timeframe)
    }
  }, [timeframe, searchParams, setSearchParams])

  const setTimeframe = (next: UsageTimeframe) => setTimeframeState(next)

  const dateRange = useMemo(() => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    if (timeframe === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      return { from: start, to: today }
    }
    if (timeframe === 'lastMonth') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
      const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
      return { from: start, to: end }
    }
    if (timeframe === 'year') {
      const start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
      return { from: start, to: today }
    }
    // 'all'
    return { from: '0000-01-01', to: today }
  }, [timeframe])

  const getLabel = (range: UsageTimeframe): string => {
    const labels: Record<UsageTimeframe, string> = {
      month: 'This Month',
      lastMonth: 'Last Month',
      year: 'This Year',
      all: 'All Time'
    }
    return labels[range]
  }

  return { timeframe, setTimeframe, dateRange, label: getLabel(timeframe), getLabel }
}


