import { supabase } from '../lib/supabaseClient'

// User services
export const getUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
  
  if (error) throw error
  return data
}

export const getUserById = async (id: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

// Device services
export const getDevices = async () => {
  const { data, error } = await supabase
    .from('devices')
    .select('*')
  
  if (error) throw error
  return data
}

export const getDeviceById = async (id: string) => {
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export const createDevice = async (device: any) => {
  const { data, error } = await supabase
    .from('devices')
    .insert(device)
    .select()
  
  if (error) throw error
  return data
}

export const updateDevice = async (id: string, device: any) => {
  const { data, error } = await supabase
    .from('devices')
    .update(device)
    .eq('id', id)
    .select()
  
  if (error) throw error
  return data
}

export const deleteDevice = async (id: string) => {
  const { error } = await supabase
    .from('devices')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
}

// Energy log services
export const getEnergyLogs = async () => {
  const { data, error } = await supabase
    .from('energy_logs')
    .select('*')
  
  if (error) throw error
  return data
}

export const getEnergyLogById = async (id: string) => {
  const { data, error } = await supabase
    .from('energy_logs')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export const createEnergyLog = async (log: any) => {
  const { data, error } = await supabase
    .from('energy_logs')
    .insert(log)
    .select()
  
  if (error) throw error
  return data
}

export const updateEnergyLog = async (id: string, log: any) => {
  const { data, error } = await supabase
    .from('energy_logs')
    .update(log)
    .eq('id', id)
    .select()
  
  if (error) throw error
  return data
}

export const deleteEnergyLog = async (id: string) => {
  const { error } = await supabase
    .from('energy_logs')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
}

// Bill split services
export const getBillSplits = async () => {
  const { data, error } = await supabase
    .from('bill_splits')
    .select('*')
  
  if (error) throw error
  return data
}

export const getBillSplitById = async (id: string) => {
  const { data, error } = await supabase
    .from('bill_splits')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export const createBillSplit = async (billSplit: any) => {
  const { data, error } = await supabase
    .from('bill_splits')
    .insert(billSplit)
    .select()
  
  if (error) throw error
  return data
}

export const updateBillSplit = async (id: string, billSplit: any) => {
  const { data, error } = await supabase
    .from('bill_splits')
    .update(billSplit)
    .eq('id', id)
    .select()
  
  if (error) throw error
  return data
}

export const deleteBillSplit = async (id: string) => {
  const { error } = await supabase
    .from('bill_splits')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
}
