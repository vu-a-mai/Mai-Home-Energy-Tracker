import { useEffect, useRef, useState } from 'react'

interface PerformanceMetrics {
  renderTime: number
  memoryUsage?: number
  componentMounts: number
  rerenders: number
}

interface UsePerformanceMonitorOptions {
  enabled?: boolean
  logToConsole?: boolean
  componentName?: string
}

export function usePerformanceMonitor(
  options: UsePerformanceMonitorOptions = {}
) {
  const { enabled = process.env.NODE_ENV === 'development', logToConsole = false, componentName = 'Component' } = options
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    componentMounts: 0,
    rerenders: 0
  })
  
  const renderStartTime = useRef<number>(0)
  const mountCount = useRef<number>(0)
  const rerenderCount = useRef<number>(0)
  const isFirstRender = useRef<boolean>(true)

  // Start timing before render
  if (enabled) {
    renderStartTime.current = performance.now()
  }

  useEffect(() => {
    if (!enabled) return

    const renderEndTime = performance.now()
    const renderTime = renderEndTime - renderStartTime.current

    if (isFirstRender.current) {
      mountCount.current += 1
      isFirstRender.current = false
    } else {
      rerenderCount.current += 1
    }

    // Get memory usage if available
    let memoryUsage: number | undefined
    if ('memory' in performance) {
      const memory = (performance as any).memory
      memoryUsage = memory.usedJSHeapSize / 1024 / 1024 // Convert to MB
    }

    const newMetrics: PerformanceMetrics = {
      renderTime,
      memoryUsage,
      componentMounts: mountCount.current,
      rerenders: rerenderCount.current
    }

    setMetrics(newMetrics)

    if (logToConsole) {
      console.group(`🔍 Performance Metrics - ${componentName}`)
      console.log(`Render Time: ${renderTime.toFixed(2)}ms`)
      console.log(`Component Mounts: ${mountCount.current}`)
      console.log(`Re-renders: ${rerenderCount.current}`)
      if (memoryUsage) {
        console.log(`Memory Usage: ${memoryUsage.toFixed(2)}MB`)
      }
      console.groupEnd()
    }
  })

  const resetMetrics = () => {
    mountCount.current = 0
    rerenderCount.current = 0
    setMetrics({
      renderTime: 0,
      componentMounts: 0,
      rerenders: 0
    })
  }

  return {
    metrics,
    resetMetrics,
    enabled
  }
}

// Hook for measuring async operations
export function useAsyncPerformance() {
  const measureAsync = async <T>(
    operation: () => Promise<T>,
    operationName: string = 'Async Operation'
  ): Promise<{ result: T; duration: number }> => {
    const startTime = performance.now()
    
    try {
      const result = await operation()
      const endTime = performance.now()
      const duration = endTime - startTime
      
      console.log(`⏱️ ${operationName}: ${duration.toFixed(2)}ms`)
      
      return { result, duration }
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      console.error(`❌ ${operationName} failed after ${duration.toFixed(2)}ms:`, error)
      throw error
    }
  }

  return { measureAsync }
}

// Hook for debouncing expensive operations
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Hook for throttling expensive operations
export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastExecuted = useRef<number>(Date.now())

  useEffect(() => {
    if (Date.now() >= lastExecuted.current + interval) {
      lastExecuted.current = Date.now()
      setThrottledValue(value)
    } else {
      const timerId = setTimeout(() => {
        lastExecuted.current = Date.now()
        setThrottledValue(value)
      }, interval)

      return () => clearTimeout(timerId)
    }
  }, [value, interval])

  return throttledValue
}
