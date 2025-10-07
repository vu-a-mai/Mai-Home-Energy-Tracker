/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export interface BillSplit {
  id: string
  household_id: string
  month: number
  year: number
  billing_period_start: string
  billing_period_end: string
  total_bill_amount: number
  split_method: 'even' | 'usage_based'
  user_allocations: {
    [userId: string]: {
      personalCost: number
      sharedCost: number
      totalOwed: number
    }
  }
  created_by: string
  created_at: string
  updated_at: string
}

interface BillSplitContextType {
  billSplits: BillSplit[]
  loading: boolean
  error: string | null
  saveBillSplit: (billSplit: Omit<BillSplit, 'id' | 'household_id' | 'created_by' | 'created_at' | 'updated_at'>) => Promise<void>
  deleteBillSplit: (id: string) => Promise<void>
  refreshBillSplits: () => Promise<void>
}

const BillSplitContext = createContext<BillSplitContextType | undefined>(undefined)

export function BillSplitProvider({ children }: { children: ReactNode }) {
  const [billSplits, setBillSplits] = useState<BillSplit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const refreshBillSplits = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('bill_splits')
        .select('*')
        .order('billing_period_start', { ascending: false })

      if (error) throw error

      setBillSplits(data || [])
    } catch (err) {
      console.error('Error fetching bill splits:', err)
      setError('Failed to load bill splits')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshBillSplits()
  }, [user])

  const saveBillSplit = async (billSplit: Omit<BillSplit, 'id' | 'household_id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated')

    try {
      setError(null)

      // Get user's household_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('household_id')
        .eq('id', user.id)
        .single()

      if (userError) throw userError

      const { data, error } = await supabase
        .from('bill_splits')
        .insert([{
          ...billSplit,
          household_id: userData.household_id,
          created_by: user.id
        }])
        .select()
        .single()

      if (error) throw error

      setBillSplits(prev => [data, ...prev])
    } catch (err) {
      console.error('Error saving bill split:', err)
      setError('Failed to save bill split')
      throw err
    }
  }

  const deleteBillSplit = async (id: string) => {
    try {
      setError(null)

      const { error } = await supabase
        .from('bill_splits')
        .delete()
        .eq('id', id)

      if (error) throw error

      setBillSplits(prev => prev.filter(split => split.id !== id))
    } catch (err) {
      console.error('Error deleting bill split:', err)
      setError('Failed to delete bill split')
      throw err
    }
  }

  return (
    <BillSplitContext.Provider
      value={{
        billSplits,
        loading,
        error,
        saveBillSplit,
        deleteBillSplit,
        refreshBillSplits
      }}
    >
      {children}
    </BillSplitContext.Provider>
  )
}

export function useBillSplits() {
  const context = useContext(BillSplitContext)
  if (context === undefined) {
    throw new Error('useBillSplits must be used within a BillSplitProvider')
  }
  return context
}
