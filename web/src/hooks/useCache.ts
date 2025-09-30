import { useState, useEffect, useCallback } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface UseCacheOptions {
  ttl?: number // Time to live in milliseconds (default: 5 minutes)
  maxSize?: number // Maximum cache size (default: 100)
}

class CacheManager<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private maxSize: number
  private ttl: number

  constructor(options: UseCacheOptions = {}) {
    this.maxSize = options.maxSize || 100
    this.ttl = options.ttl || 5 * 60 * 1000 // 5 minutes
  }

  set(key: string, data: T): void {
    const now = Date.now()
    
    // Remove expired entries
    this.cleanup()
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + this.ttl
    })
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl
    }
  }
}

// Global cache instances
const cacheInstances = new Map<string, CacheManager<any>>()

export function useCache<T>(
  namespace: string = 'default',
  options: UseCacheOptions = {}
) {
  // Get or create cache instance for this namespace
  if (!cacheInstances.has(namespace)) {
    cacheInstances.set(namespace, new CacheManager<T>(options))
  }
  
  const cache = cacheInstances.get(namespace)!
  
  const set = useCallback((key: string, data: T) => {
    cache.set(key, data)
  }, [cache])
  
  const get = useCallback((key: string): T | null => {
    return cache.get(key)
  }, [cache])
  
  const has = useCallback((key: string): boolean => {
    return cache.has(key)
  }, [cache])
  
  const remove = useCallback((key: string) => {
    cache.delete(key)
  }, [cache])
  
  const clear = useCallback(() => {
    cache.clear()
  }, [cache])
  
  const getStats = useCallback(() => {
    return cache.getStats()
  }, [cache])

  return {
    set,
    get,
    has,
    remove,
    clear,
    getStats
  }
}

// Hook for cached API calls
export function useCachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: UseCacheOptions & { enabled?: boolean } = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const cache = useCache<T>('api-cache', options)
  const { enabled = true } = options

  const execute = useCallback(async (forceRefresh = false) => {
    if (!enabled) return

    // Check cache first
    if (!forceRefresh && cache.has(key)) {
      const cachedData = cache.get(key)
      if (cachedData) {
        setData(cachedData)
        return cachedData
      }
    }

    setLoading(true)
    setError(null)

    try {
      const result = await queryFn()
      cache.set(key, result)
      setData(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [key, queryFn, cache, enabled])

  const refresh = useCallback(() => {
    return execute(true)
  }, [execute])

  const invalidate = useCallback(() => {
    cache.remove(key)
  }, [cache, key])

  useEffect(() => {
    execute()
  }, [execute])

  return {
    data,
    loading,
    error,
    refresh,
    invalidate,
    execute
  }
}
