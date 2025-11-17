import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase環境変数の存在確認
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// リアルタイム機能が利用可能かどうかのフラグ
export const isRealtimeAvailable = !!(supabaseUrl && supabaseAnonKey)

// Supabaseクライアントの初期化（環境変数が設定されている場合のみ）
let supabaseClient: SupabaseClient | null = null

if (isRealtimeAvailable) {
  supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!, {
    realtime: {
      params: {
        eventsPerSecond: 10, // リアルタイムイベントのレート制限
      },
    },
  })
}

export const supabase = supabaseClient

/**
 * リアルタイム機能が利用可能かチェック
 * @returns {boolean} Supabaseクライアントが初期化されているか
 */
export function canUseRealtime(): boolean {
  return isRealtimeAvailable && supabaseClient !== null
}
