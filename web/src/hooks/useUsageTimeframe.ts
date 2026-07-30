import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  endOfLocalMonth,
  startOfLocalMonth,
  startOfLocalYear,
  todayLocal
} from '../utils/dateUtils'

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
    localStorage.setItem(STORAGE_KEY, timeframe)
  }, [timeframe]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep unused param referenced for API compatibility
  void energyLogs

  const setTimeframe = (next: UsageTimeframe) => setTimeframeState(next)

  const dateRange = useMemo(() => {
    const now = new Date()
    const today = todayLocal()
    
    if (timeframe === 'month') {
      return { from: startOfLocalMonth(now), to: today }
    }
    if (timeframe === 'lastMonth') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return { from: startOfLocalMonth(lastMonth), to: endOfLocalMonth(lastMonth) }
    }
    if (timeframe === 'year') {
      return { from: startOfLocalYear(now), to: today }
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
