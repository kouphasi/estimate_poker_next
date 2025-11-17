import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  auth: {
    persistSession: false,  // Realtimeのみ使用、認証は不要
  },
})

// デバッグ用：Realtime接続の状態をログ出力
if (typeof window !== 'undefined') {
  console.log('[Supabase] Realtime client initialized')
  console.log('[Supabase] URL:', supabaseUrl)
}
