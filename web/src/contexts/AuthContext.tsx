import { createContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { syncUserWithDatabase } from '../services/userService'

interface AuthContextType {
  user: SupabaseUser | null
  login: (email: string, password: string) => Promise<any>
  signup: (email: string, password: string, name?: string) => Promise<any>
  logout: () => Promise<any>
  loading: boolean
  syncError: string | null
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const syncUser = async (currentUser: SupabaseUser) => {
      try {
        await syncUserWithDatabase(currentUser)
        if (mounted) setSyncError(null)
      } catch (syncErr) {
        const message = syncErr instanceof Error ? syncErr.message : 'Failed to sync user profile'
        console.error('User sync failed:', message)
        if (mounted) setSyncError(message)
      }
    }

    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!mounted) return

        if (error) {
          console.error('Session error:', error)
        }

        const currentUser = data.session?.user || null
        setUser(currentUser)

        if (currentUser) {
          await syncUser(currentUser)
        } else {
          setSyncError(null)
        }
      } catch (error) {
        console.error('Auth error:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    checkSession()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return

        const currentUser = session?.user || null
        setUser(currentUser)

        if (currentUser) {
          await syncUser(currentUser)
        } else {
          setSyncError(null)
        }

        setLoading(false)
      }
    )

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const result = await supabase.auth.signInWithPassword({ email, password })

      if (result.data.user) {
        await syncUserWithDatabase(result.data.user)
        setSyncError(null)
      }

      return result
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const signup = async (email: string, password: string, name?: string) => {
    try {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name?.trim() || undefined,
          },
        },
      })

      if (result.error) return result

      if (result.data.user) {
        await syncUserWithDatabase(result.data.user, {
          name: name?.trim() || undefined,
          asOwner: true,
        })
        setSyncError(null)
      }

      return result
    } catch (error) {
      console.error('Signup error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      setSyncError(null)
      return await supabase.auth.signOut()
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  const value = {
    user,
    login,
    signup,
    logout,
    loading,
    syncError
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
