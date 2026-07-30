import { supabase } from '../lib/supabase'
import { normalizeInviteCode, type HouseholdRole } from '../utils/householdAccess'
import { logger } from '../utils/logger'

export interface HouseholdInvite {
  id: string
  household_id: string
  code: string
  role: 'editor' | 'viewer'
  created_by: string
  expires_at: string
  max_uses: number
  use_count: number
  revoked_at: string | null
  created_at: string
}

export interface CreatedInvite {
  id: string
  code: string
  role: 'editor' | 'viewer'
  expires_at: string
  max_uses: number
}

export async function createHouseholdInvite(options?: {
  role?: 'editor' | 'viewer'
  expiresDays?: number
  maxUses?: number
}): Promise<CreatedInvite> {
  const { data, error } = await supabase.rpc('create_household_invite', {
    p_role: options?.role ?? 'editor',
    p_expires_days: options?.expiresDays ?? 14,
    p_max_uses: options?.maxUses ?? 10,
  })

  if (error) {
    logger.error('createHouseholdInvite failed:', error)
    throw new Error(error.message)
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row?.code) throw new Error('Invite was not created')
  return row as CreatedInvite
}

export async function acceptHouseholdInvite(code: string): Promise<{
  household_id: string
  role: HouseholdRole
  joined: boolean
}> {
  const normalized = normalizeInviteCode(code)
  const { data, error } = await supabase.rpc('accept_household_invite', {
    p_code: normalized,
  })

  if (error) {
    logger.error('acceptHouseholdInvite failed:', error)
    throw new Error(error.message)
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row?.household_id) throw new Error('Invite accept failed')
  return {
    household_id: row.household_id,
    role: row.role as HouseholdRole,
    joined: Boolean(row.joined),
  }
}

export async function revokeHouseholdInvite(inviteId: string): Promise<void> {
  const { error } = await supabase.rpc('revoke_household_invite', {
    p_invite_id: inviteId,
  })
  if (error) {
    logger.error('revokeHouseholdInvite failed:', error)
    throw new Error(error.message)
  }
}

export async function listHouseholdInvites(): Promise<HouseholdInvite[]> {
  const { data, error } = await supabase
    .from('household_invites')
    .select('*')
    .is('revoked_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('listHouseholdInvites failed:', error)
    throw new Error(error.message)
  }

  return (data || []) as HouseholdInvite[]
}
