import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
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
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete, onChange })

  // Update callbacks ref without causing re-subscription
  useEffect(() => {
    callbacksRef.current = { onInsert, onUpdate, onDelete, onChange }
  })

  useEffect(() => {
    // Prevent duplicate subscriptions
    if (channelRef.current) {
      return
    }

    // Create channel name
    const channelName = `${table}-changes`
    
    // Create subscription
    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        {
          event: event,
          schema: 'public',
          table: table,
          ...(filter && { filter })
        } as any,
        (payload: any) => {
          // Call specific event handlers from ref (always latest)
          const { onInsert, onUpdate, onDelete, onChange } = callbacksRef.current
          
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
      .subscribe((status: any) => {
        // Only log status changes, not every status check
        if (status === 'SUBSCRIBED' || status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.log(`[Realtime] ${table}: ${status}`)
        }
      })

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [table, event, filter]) // Only re-subscribe if these core values change

  return channelRef.current
}
