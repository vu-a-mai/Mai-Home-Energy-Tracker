import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeSubscriptionOptions {
  table: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  onInsert?: (payload: any) => void
  onUpdate?: (payload: any) => void
  onDelete?: (payload: any) => void
  onChange?: (payload: any) => void
}

export function useRealtimeSubscription({
  table,
  event = '*',
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onChange
}: UseRealtimeSubscriptionOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    // Create channel name
    const channelName = `realtime-${table}${filter ? `-${filter}` : ''}`
    
    // Create subscription
    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: event,
          schema: 'public',
          table: table,
          ...(filter && { filter })
        },
        (payload) => {
          console.log(`Real-time ${payload.eventType} on ${table}:`, payload)
          
          // Call specific event handlers
          switch (payload.eventType) {
            case 'INSERT':
              onInsert?.(payload)
              break
            case 'UPDATE':
              onUpdate?.(payload)
              break
            case 'DELETE':
              onDelete?.(payload)
              break
          }
          
          // Call general change handler
          onChange?.(payload)
        }
      )
      .subscribe((status) => {
        console.log(`Subscription status for ${table}:`, status)
      })

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [table, event, filter, onInsert, onUpdate, onDelete, onChange])

  return channelRef.current
}
