import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { clearDemoStore, initDemoStore } from '../demo/demoStore'
import { supabase } from '../lib/supabase'

interface DemoContextType {
  isDemoMode: boolean
  enableDemoMode: () => Promise<void>
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
  const [isDemoMode, setIsDemoMode] = useState(() => {
    const enabled = readStoredDemoMode()
    if (enabled) {
      initDemoStore(false)
    }
    return enabled
  })

  const enableDemoMode = async () => {
    // Prevent mixed live-session + demo sandbox writes
    try {
      await supabase.auth.signOut()
    } catch {
      // Continue into demo even if sign-out fails (e.g. offline)
    }
    initDemoStore(false)
    setIsDemoMode(true)
    localStorage.setItem('demo_mode', 'true')
  }

  const disableDemoMode = () => {
    clearDemoStore()
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
