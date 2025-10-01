import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  email: string
  name: string
  household_id: string
  created_at: string
  updated_at: string
}

export interface Device {
  id: string
  name: string
  wattage: number
  device_type: string
  location: string
  is_shared: boolean
  household_id: string
  created_by?: string
  kwh_per_hour?: number
  created_at: string
  updated_at: string
}

export interface EnergyLog {
  id: string
  device_id: string
  start_time: string
  end_time: string
  usage_date: string
  calculated_cost: number
  total_kwh?: number  // Database column is total_kwh
  rate_breakdown?: any
  household_id: string
  created_by: string
  created_at: string
  updated_at: string
  assigned_users?: string[]
}

export interface EnergyLogUser {
  id: string
  energy_log_id: string
  user_id: string
  created_at: string
}

export interface BillSplit {
  id: string
  month: number
  year: number
  total_amount: number
  user_allocations: Record<string, number>
  household_id: string
  created_at: string
  updated_at: string
}
