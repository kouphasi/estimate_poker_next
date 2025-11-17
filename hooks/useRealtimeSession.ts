import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface Session {
  id: string
  shareToken: string
  isRevealed: boolean
  status: 'ACTIVE' | 'FINALIZED'
  finalEstimate: number | null
}

interface Estimate {
  nickname: string
  value: number
  updatedAt: string
  userId: string
}

interface UseRealtimeSessionOptions {
  shareToken: string
  enabled?: boolean
}

export function useRealtimeSession({
  shareToken,
  enabled = true
}: UseRealtimeSessionOptions) {
  const [session, setSession] = useState<Session | null>(null)
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  // Fetch session data from API
  const fetchSession = useCallback(async () => {
    if (!shareToken) return

    try {
      const response = await fetch(`/api/sessions/${shareToken}`)
      if (!response.ok) {
        throw new Error('セッションが見つかりません')
      }
      const data = await response.json()
      setSession(data.session)
      setEstimates(data.estimates)
      setError('')
      setLoading(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'エラーが発生しました'
      setError(errorMessage)
      setLoading(false)
    }
  }, [shareToken])

  // Start polling fallback
  const startPolling = useCallback((immediate = false) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    console.log('[Realtime] Starting polling mode (updates every 2 seconds)')

    // Fetch immediately if requested (e.g., when falling back from realtime failure)
    if (immediate) {
      fetchSession()
    }

    pollingIntervalRef.current = setInterval(fetchSession, 2000)
  }, [fetchSession])

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  // Setup realtime subscription
  const setupRealtimeSubscription = useCallback(async () => {
    if (!shareToken || !enabled || !session?.id) return

    const sessionId = session.id

    try {
      console.log('[Realtime] Setting up realtime subscription for session:', sessionId)

      // Clean up existing channel
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current)
      }

      // Create a new channel for this session
      const channel = supabase
        .channel(`session-${shareToken}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'estimates',
            filter: `session_id=eq.${sessionId}`,  // ← データベースカラム名は session_id
          },
          (payload) => {
            console.log('[Realtime] Estimate change received:', payload)
            fetchSession()
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'estimation_sessions',
            filter: `id=eq.${sessionId}`,
          },
          (payload) => {
            console.log('[Realtime] Session change received:', payload)
            fetchSession()
          }
        )
        .subscribe((status) => {
          console.log('[Realtime] Subscription status:', status)

          if (status === 'SUBSCRIBED') {
            setIsRealtimeConnected(true)
            stopPolling()
            reconnectAttemptsRef.current = 0
            console.log('[Realtime] Successfully connected, polling stopped')
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setIsRealtimeConnected(false)
            console.error('[Realtime] Connection failed, falling back to polling')
            startPolling(true)
          } else if (status === 'CLOSED') {
            setIsRealtimeConnected(false)
            // Start polling immediately when connection is closed
            if (!pollingIntervalRef.current) {
              startPolling(true)
            }

            // Attempt to reconnect
            if (reconnectAttemptsRef.current < maxReconnectAttempts) {
              reconnectAttemptsRef.current++
              const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
              console.log(`[Realtime] Connection closed, reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`)

              reconnectTimeoutRef.current = setTimeout(() => {
                setupRealtimeSubscription()
              }, delay)
            } else {
              console.error('[Realtime] Max reconnection attempts reached, continuing with polling')
            }
          }
        })

      channelRef.current = channel
    } catch (err) {
      console.error('[Realtime] Setup error:', err)
      setIsRealtimeConnected(false)
      startPolling(true)
    }
  }, [shareToken, enabled, fetchSession, startPolling, stopPolling, session?.id])

  // Initial setup
  useEffect(() => {
    if (!shareToken) return

    // If disabled, set loading to false and return
    if (!enabled) {
      setLoading(false)
      return
    }

    // Fetch initial data and start polling
    // Polling will be stopped once realtime connection is established
    fetchSession().then(() => {
      // Start polling after initial fetch
      console.log('[Realtime] Starting polling for updates')
      startPolling()
    })

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      stopPolling()
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareToken, enabled])

  // Setup realtime subscription when session ID becomes available
  useEffect(() => {
    if (session?.id && enabled && !isRealtimeConnected) {
      console.log('[Realtime] Session ID now available, attempting realtime connection')
      setupRealtimeSubscription()
    }
  }, [session?.id, enabled, isRealtimeConnected, setupRealtimeSubscription])

  return {
    session,
    estimates,
    loading,
    error,
    isRealtimeConnected,
    refetch: fetchSession,
  }
}
