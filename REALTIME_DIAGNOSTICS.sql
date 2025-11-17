-- Supabase Realtime 診断クエリ
-- このクエリをSupabaseのSQL Editorで実行して、設定を確認してください

-- 1. REPLICA IDENTITYの確認
SELECT
    schemaname,
    tablename,
    CASE relreplident
        WHEN 'd' THEN 'DEFAULT'
        WHEN 'n' THEN 'NOTHING'
        WHEN 'f' THEN 'FULL'
        WHEN 'i' THEN 'INDEX'
    END as replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_tables t ON t.tablename = c.relname AND t.schemaname = n.nspname
WHERE schemaname = 'public'
  AND tablename IN ('estimates', 'estimation_sessions');

-- 期待される結果:
-- estimates          | FULL
-- estimation_sessions | FULL


-- 2. Publication設定の確認
SELECT
    pubname,
    tablename,
    schemaname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('estimates', 'estimation_sessions');

-- 期待される結果:
-- supabase_realtime | estimates          | public
-- supabase_realtime | estimation_sessions | public


-- 3. Publicationが存在するか確認
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- 期待される結果: 1行以上


-- 4. テーブル構造の確認（カラム名が正しいか）
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('estimates', 'estimation_sessions')
ORDER BY table_name, ordinal_position;

-- estimatesテーブルに session_id カラムがあることを確認
-- estimation_sessionsテーブルに id カラムがあることを確認


-- 5. Row Level Security (RLS)の確認
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('estimates', 'estimation_sessions');

-- RLSが有効な場合、ポリシーを確認する必要があります


-- 6. 手動でイベントをトリガーしてテスト
-- (テスト用のセッションIDを使用してください)
--
-- UPDATE estimation_sessions
-- SET "isRevealed" = NOT "isRevealed"
-- WHERE id = 'YOUR_SESSION_ID_HERE';
--
-- このUPDATEを実行したとき、ブラウザのコンソールに
-- [Realtime] ✅ Session change received が表示されるべきです
