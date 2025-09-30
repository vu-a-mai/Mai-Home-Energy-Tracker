// Jest setup file for React Testing Library
import '@testing-library/jest-dom'

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock performance.memory for performance monitoring tests
Object.defineProperty(performance, 'memory', {
  writable: true,
  value: {
    usedJSHeapSize: 1024 * 1024 * 10, // 10MB
    totalJSHeapSize: 1024 * 1024 * 50, // 50MB
    jsHeapSizeLimit: 1024 * 1024 * 100, // 100MB
  }
})

// Mock console methods to reduce noise in tests
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return
    }
    originalError.call(console, ...args)
  }

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
       args[0].includes('componentWillUpdate'))
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})

// Global test utilities
export const mockUser = {
  id: 'test-user-id',
  email: 'test@maihome.com',
  user_metadata: {
    name: 'Test User'
  }
}

export const mockDevice = {
  id: 'test-device-id',
  name: 'Test TV',
  device_type: 'TV',
  location: 'Living Room',
  wattage: 150,
  kwh_per_hour: 0.15,
  is_shared: true,
  household_id: 'test-household-id',
  created_by: 'test-user-id',
  created_at: '2024-01-01T00:00:00Z'
}

export const mockEnergyLog = {
  id: 'test-log-id',
  device_id: 'test-device-id',
  device_name: 'Test TV',
  device_wattage: 150,
  start_time: '18:00',
  end_time: '22:00',
  usage_date: '2024-07-15',
  calculated_cost: 0.33,
  calculated_kwh: 0.6,
  household_id: 'test-household-id',
  created_by: 'test-user-id',
  created_at: '2024-01-01T00:00:00Z'
}

// Helper function to create mock Supabase response
export const createMockSupabaseResponse = <T>(data: T, error: any = null) => ({
  data,
  error,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK'
})

// Helper function to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))
