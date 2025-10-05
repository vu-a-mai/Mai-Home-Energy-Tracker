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
  source_type?: 'manual' | 'template' | 'recurring'
  source_id?: string
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

export interface EnergyLogTemplate {
  id: string
  household_id: string
  template_name: string
  device_id: string
  default_start_time: string
  default_end_time: string
  assigned_users: string[]
  created_by: string
  created_at: string
  updated_at: string
  // Joined fields (from queries)
  device_name?: string
  device_wattage?: number
}

export interface RecurringSchedule {
  id: string
  household_id: string
  schedule_name: string
  device_id: string
  recurrence_type: 'daily' | 'weekly' | 'custom'
  days_of_week: number[] // [0=Sun, 1=Mon, ..., 6=Sat]
  start_time: string
  end_time: string
  schedule_start_date: string
  schedule_end_date: string | null
  assigned_users: string[]
  is_active: boolean
  auto_create: boolean
  created_by: string
  created_at: string
  updated_at: string
  // Joined fields (from queries)
  device_name?: string
  device_wattage?: number
}

export interface TemplateFormData {
  template_name: string
  device_id: string
  default_start_time: string
  default_end_time: string
  assigned_users: string[]
}

export interface ScheduleFormData {
  schedule_name: string
  device_id: string
  recurrence_type: 'daily' | 'weekly' | 'custom'
  days_of_week: number[]
  start_time: string
  end_time: string
  schedule_start_date: string
  schedule_end_date: string | null
  assigned_users: string[]
  auto_create: boolean
}
