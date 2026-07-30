import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { useDemoMode } from '../contexts/DemoContext'
import { userService } from '../services/database'
import { DEMO_HOUSEHOLD_ID, getDemoState } from '../demo/demoStore'

export interface HouseholdUser {
  id: string
  name: string
  email: string
}

export function useHouseholdUsers() {
  const [users, setUsers] = useState<HouseholdUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { isDemoMode } = useDemoMode()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        setError(null)

        if (isDemoMode) {
          const demoUsers = getDemoState().users.filter(
            (u) => u.household_id === DEMO_HOUSEHOLD_ID
          )
          setUsers(demoUsers)
        } else if (user) {
          const currentUser = await userService.getCurrentUser()
          if (currentUser?.household_id) {
            const householdMembers = await userService.getHouseholdMembers(currentUser.household_id)
            setUsers(householdMembers)
          }
        }
      } catch (err) {
        console.error('Error fetching household users:', err)
        setError('Failed to load household members')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [user, isDemoMode])

  return { users, loading, error }
}
