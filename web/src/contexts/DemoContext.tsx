import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface DemoContextType {
  isDemoMode: boolean
  enableDemoMode: () => void
  disableDemoMode: () => void
}

const DemoContext = createContext<DemoContextType | undefined>(undefined)

function readStoredDemoMode(): boolean {
  try {
    return localStorage.getItem('demo_mode') === 'true'
  } catch {
    return false
  }
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(readStoredDemoMode)

  const enableDemoMode = () => {
    setIsDemoMode(true)
    localStorage.setItem('demo_mode', 'true')
  }

  const disableDemoMode = () => {
    setIsDemoMode(false)
    localStorage.removeItem('demo_mode')
  }

  return (
    <DemoContext.Provider value={{ isDemoMode, enableDemoMode, disableDemoMode }}>
      {children}
    </DemoContext.Provider>
  )
}

export function useDemoMode() {
  const context = useContext(DemoContext)
  if (context === undefined) {
    throw new Error('useDemoMode must be used within a DemoProvider')
  }
  return context
}
