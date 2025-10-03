import { supabase } from '../lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { logger } from '../utils/logger'

export interface DatabaseUser {
  id: string
  email: string
  name: string
  household_id: string
  created_at: string
}

/**
 * Sync authenticated user with database users table
 * Creates a new user record if it doesn't exist
 */
export const syncUserWithDatabase = async (authUser: SupabaseUser): Promise<DatabaseUser | null> => {
  try {
    // Check if user exists in database by ID
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()

    if (fetchError) {
      logger.error('Error checking user in database:', fetchError)
      return null
    }

    // If user exists with correct ID, return it
    if (existingUser) {
      return existingUser
    }

    // Check if email already exists with different ID
    const { data: userByEmail, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', authUser.email)
      .maybeSingle()

    if (emailError && emailError.code !== 'PGRST116') { // PGRST116 = no rows returned
      logger.error('Error checking user by email:', emailError)
      return null
    }

    if (userByEmail) {
      logger.warn('User email exists with different ID. Auth ID:', authUser.id, 'DB ID:', userByEmail.id)
      logger.warn('Please run fix-user-id-mismatch.sql to resolve this issue')
      return userByEmail // Return the existing user to prevent errors
    }

    // User doesn't exist, create them
    logger.log('User not found in database, creating record...')
    
    // Create a new household for the user
    const householdId = crypto.randomUUID()
    
    const newUser = {
      id: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
      household_id: householdId
    }

    const { data: createdUser, error: insertError } = await supabase
      .from('users')
      .insert([newUser])
      .select()
      .single()

    if (insertError) {
      logger.error('Error creating user in database:', insertError)
      
      // If it's a duplicate email error, try to fetch the existing user
      if (insertError.code === '23505') {
        const { data: fallbackUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle()
        
        if (fallbackUser) {
          logger.warn('Returning existing user due to email conflict')
          return fallbackUser
        }
      }
      
      return null
    }

    logger.log('User successfully synced with database')
    return createdUser
  } catch (error) {
    logger.error('Error syncing user with database:', error)
    return null
  }
}

/**
 * Get user's household members
 */
export const getHouseholdMembers = async (householdId: string): Promise<DatabaseUser[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('household_id', householdId)
      .order('name')

    if (error) {
      logger.error('Error fetching household members:', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error fetching household members:', error)
    return []
  }
}

/**
 * Update user's household
 * Use this to join an existing household
 */
export const updateUserHousehold = async (
  userId: string,
  householdId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ household_id: householdId })
      .eq('id', userId)

    if (error) {
      logger.error('Error updating user household:', error)
      return false
    }

    return true
  } catch (error) {
    logger.error('Error updating user household:', error)
    return false
  }
}

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<DatabaseUser | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      logger.error('Error fetching user:', error)
      return null
    }

    return data
  } catch (error) {
    logger.error('Error fetching user:', error)
    return null
  }
}
