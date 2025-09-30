import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface DemoContextType {
  isDemoMode: boolean
  enableDemoMode: () => void
  disableDemoMode: () => void
}

const DemoContext = createContext<DemoContextType | undefined>(undefined)

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false)

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
