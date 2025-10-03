import { createContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { syncUserWithDatabase } from '../services/userService'

interface AuthContextType {
  user: SupabaseUser | null
  login: (email: string, password: string) => Promise<any>
  logout: () => Promise<any>
  loading: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Auth check timed out, proceeding without authentication')
        setLoading(false)
      }
    }, 3000) // 3 second timeout (reduced from 10)
    
    // Check active session
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (mounted) {
          if (error) {
            console.error('Session error:', error)
          }
          const currentUser = data.session?.user || null
          setUser(currentUser)
          
          // Sync user with database if authenticated (with timeout)
          if (currentUser) {
            try {
              const syncPromise = syncUserWithDatabase(currentUser)
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database sync timeout')), 5000)
              )
              await Promise.race([syncPromise, timeoutPromise])
            } catch (syncError) {
              // Silently continue - user is still authenticated
              if (syncError instanceof Error && syncError.message !== 'Database sync timeout') {
                console.warn('User sync delayed, will retry:', syncError.message)
              }
            }
          }
          
          clearTimeout(timeoutId)
          setLoading(false)
        }
      } catch (error) {
        console.error('Auth error:', error)
        if (mounted) {
          clearTimeout(timeoutId)
          setLoading(false)
        }
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (mounted) {
          const currentUser = session?.user || null
          setUser(currentUser)
          
          // Sync user with database if authenticated (with timeout)
          if (currentUser) {
            try {
              const syncPromise = syncUserWithDatabase(currentUser)
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database sync timeout')), 5000)
              )
              await Promise.race([syncPromise, timeoutPromise])
            } catch (syncError) {
              // Silently continue - user is still authenticated
              if (syncError instanceof Error && syncError.message !== 'Database sync timeout') {
                console.warn('User sync delayed, will retry:', syncError.message)
              }
            }
          }
          
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      authListener.subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const result = await supabase.auth.signInWithPassword({ email, password })
      
      // Sync user with database after successful login
      if (result.data.user) {
        await syncUserWithDatabase(result.data.user)
      }
      
      return result
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      return await supabase.auth.signOut()
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  const value = {
    user,
    login,
    logout,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
