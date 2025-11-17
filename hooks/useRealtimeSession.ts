import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase, canUseRealtime } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

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

interface UseRealtimeSessionReturn {
  session: Session | null
  estimates: Estimate[]
  loading: boolean
  error: string
  refetch: () => Promise<void>
}

/**
 * リアルタイムセッション更新のカスタムフック
 * Supabase Realtimeが利用可能な場合はWebSocketを使用し、
 * 利用できない場合はポーリングにフォールバックする
 *
 * @param shareToken - セッションの共有トークン
 * @returns セッション情報、見積もり一覧、ローディング状態など
 */
export function useRealtimeSession(
  shareToken: string | null
): UseRealtimeSessionReturn {
  const [session, setSession] = useState<Session | null>(null)
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const channelRef = useRef<RealtimeChannel | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // セッション情報を取得する関数
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
      setLoading(false)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
      setLoading(false)
    }
  }, [shareToken])

  // ポーリング開始
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return // 既に開始されている場合は何もしない

    pollingIntervalRef.current = setInterval(() => {
      fetchSession()
    }, 2000) // 2秒ごとにポーリング
  }, [fetchSession])

  // ポーリング停止
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  // リアルタイム接続のセットアップ
  useEffect(() => {
    if (!shareToken) return

    let mounted = true

    // 初回データ取得してからリアルタイム接続を確立
    const setupRealtime = async () => {
      await fetchSession()

      if (!mounted) return

      // Supabase Realtimeが利用可能な場合
      if (canUseRealtime() && supabase) {
        console.log('[Realtime] WebSocket接続を開始します')

        // チャンネルの作成
        // 注意: SupabaseのPostgres Changesでは、テーブル全体を監視してクライアント側でフィルタリングする
        const channel = supabase
          .channel(`session:${shareToken}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'estimates',
            },
            (payload) => {
              console.log('[Realtime] Estimateテーブルの変更を検出:', payload)
              // データが変更されたら再取得
              fetchSession()
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'estimation_sessions',
            },
            (payload) => {
              console.log('[Realtime] EstimationSessionテーブルの変更を検出:', payload)
              // データが変更されたら再取得
              fetchSession()
            }
          )
          .subscribe((status) => {
            console.log('[Realtime] 接続ステータス:', status)

            if (status === 'SUBSCRIBED') {
              console.log('[Realtime] WebSocket接続が確立されました')
            } else if (status === 'CHANNEL_ERROR') {
              console.error('[Realtime] チャンネルエラー。ポーリングにフォールバックします')
              // エラーの場合はポーリングにフォールバック
              startPolling()
            } else if (status === 'TIMED_OUT') {
              console.error('[Realtime] 接続タイムアウト。ポーリングにフォールバックします')
              startPolling()
            }
          })

        channelRef.current = channel
      } else {
        // Supabase Realtimeが利用できない場合はポーリング
        console.log('[Polling] リアルタイム機能が利用できないため、ポーリングを使用します')
        startPolling()
      }
    }

    setupRealtime()

    // クリーンアップ
    return () => {
      mounted = false
      if (channelRef.current && supabase) {
        console.log('[Realtime] WebSocket接続を切断します')
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      stopPolling()
    }
  }, [shareToken, fetchSession, startPolling, stopPolling])

  return {
    session,
    estimates,
    loading,
    error,
    refetch: fetchSession,
  }
}
