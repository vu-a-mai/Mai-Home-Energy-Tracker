export interface User {
  id: string
  email: string
  name: string
  household_id: string
  created_at: string
}

export interface Device {
  id: string
  name: string
  type: string
  wattage: number
  location: string
  sharing_type: 'personal' | 'shared'
  household_id: string
  created_by: string
  created_at: string
}

export interface EnergyLog {
  id: string
  device_id: string
  usage_date: string
  start_time: string
  end_time: string
  total_kwh: number
  total_cost: number
  rate_breakdown: any
  household_id: string
  created_by: string
  created_at: string
}

export interface EnergyLogUser {
  id: string
  energy_log_id: string
  user_id: string
  cost_share: number
}

export interface BillSplit {
  id: string
  household_id: string
  billing_period_start: string
  billing_period_end: string
  total_bill_amount: number
  user_allocations: any
  created_by: string
  created_at: string
}

export interface RatePeriod {
  name: string
  start: string
  end: string
  rate: number
  color: string
}

export interface TimeRange {
  start: string
  end: string
}
