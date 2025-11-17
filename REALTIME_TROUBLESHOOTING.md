# Supabase Realtime トラブルシューティングガイド

マイグレーションを実行してもRealtimeが動作しない場合の診断手順です。

## 1. データベース設定の確認

### ステップ1: SQL Editorで診断クエリを実行

`REALTIME_DIAGNOSTICS.sql`のクエリをSupabase SQL Editorで実行してください。

#### 確認項目：

1. **REPLICA IDENTITY**: 両テーブルとも `FULL` であること
2. **Publication**: 両テーブルが `supabase_realtime` に含まれていること
3. **カラム名**: `session_id`と`id`カラムが存在すること

### ステップ2: ブラウザコンソールでログを確認

ブラウザの開発者ツール（F12）→ コンソールタブで以下のログを確認：

```
[Supabase] Realtime client initialized
[Supabase] URL: https://...
[Realtime] Starting polling for updates
[Realtime] Session ID: xxx
[Realtime] Share Token: xxx
[Realtime] Filters will be:
[Realtime]   - estimates: session_id=eq.xxx
[Realtime]   - estimation_sessions: id=eq.xxx
[Realtime] Subscription status: SUBSCRIBED
[Realtime] ✅ Successfully connected, polling stopped
[Realtime] Waiting for database events...
```

## 2. 考えられる原因と解決方法

### 原因1: Row Level Security (RLS) が有効

**症状**: 接続は成功するがイベントが来ない

**確認方法**:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('estimates', 'estimation_sessions');
```

**解決方法**:

#### オプションA: RLSを無効化（開発環境のみ）
```sql
ALTER TABLE estimates DISABLE ROW LEVEL SECURITY;
ALTER TABLE estimation_sessions DISABLE ROW LEVEL SECURITY;
```

#### オプションB: ポリシーを追加
```sql
-- すべてのユーザーに読み取り権限を付与
CREATE POLICY "Enable read access for all users"
ON estimates FOR SELECT
USING (true);

CREATE POLICY "Enable read access for all users"
ON estimation_sessions FOR SELECT
USING (true);
```

### 原因2: Publicationにテーブルが追加されていない

**確認方法**:
```sql
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

**解決方法**:
```sql
-- テーブルを追加
ALTER PUBLICATION supabase_realtime ADD TABLE estimates;
ALTER PUBLICATION supabase_realtime ADD TABLE estimation_sessions;

-- すでに追加されている場合は削除してから再追加
ALTER PUBLICATION supabase_realtime DROP TABLE estimates;
ALTER PUBLICATION supabase_realtime DROP TABLE estimation_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE estimates;
ALTER PUBLICATION supabase_realtime ADD TABLE estimation_sessions;
```

### 原因3: Supabaseダッシュボードで Realtime が無効

**確認方法**:
1. Supabaseダッシュボード → Database → Replication
2. `estimates`と`estimation_sessions`テーブルが有効になっているか確認

**解決方法**:
1. Database → Replication
2. `estimates`と`estimation_sessions`を探す
3. トグルをONにする

### 原因4: データベース接続の問題

**症状**: `CHANNEL_ERROR` または `TIMED_OUT` が表示される

**解決方法**:
1. Supabaseプロジェクトが稼働しているか確認
2. 環境変数が正しいか確認:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
3. ネットワーク接続を確認

### 原因5: フィルター条件が間違っている

**確認方法**:
コンソールログで表示されるフィルターと、実際のデータベースの値を比較

```
[Realtime]   - estimates: session_id=eq.xxx
```

**解決方法**:
1. SQLで実際のデータを確認:
   ```sql
   SELECT session_id, nickname, value
   FROM estimates
   WHERE session_id = 'YOUR_SESSION_ID';
   ```
2. session_idが一致しているか確認

## 3. 手動テスト

### テスト1: フィルターなしで購読

一時的にフィルターを削除して、すべてのイベントを受信できるか確認：

```typescript
// hooks/useRealtimeSession.ts の一時的な変更
.on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'estimates',
  // filter を削除
}, ...)
```

この状態で、**任意の**estimateの変更がログに表示されるか確認してください。

### テスト2: SQLで手動更新

```sql
-- セッションIDを取得
SELECT id FROM estimation_sessions LIMIT 1;

-- 手動で更新
UPDATE estimation_sessions
SET "isRevealed" = NOT "isRevealed"
WHERE id = 'YOUR_SESSION_ID';
```

この更新実行後、ブラウザのコンソールに以下が表示されるべき：
```
[Realtime] ✅ Session change received: ...
```

### テスト3: 新しい見積もりを投稿

1. 見積もり画面でカードを選択
2. ネットワークタブでPOSTリクエストが成功したことを確認
3. ブラウザのコンソールに以下が表示されるべき：
   ```
   [Realtime] ✅ Estimate change received: ...
   ```

## 4. よくある問題

### Q: SUBSCRIBEDになるがイベントが来ない

A: 以下を確認してください：
1. RLSポリシー（上記の原因1参照）
2. Publicationの設定（原因2参照）
3. フィルター条件（原因5参照）

### Q: 緑色（リアルタイム）になるが2秒ごとにポーリングも続いている

A: これは正常な動作です。最初はポーリング、接続確立後にリアルタイムに切り替わります。

### Q: すぐに黄色（ポーリング）に戻ってしまう

A: 接続が不安定です：
1. Supabaseプロジェクトの状態を確認
2. ネットワーク接続を確認
3. コンソールにエラーが出ていないか確認

### Q: Subscription errorが表示される

A: エラー内容を確認：
- `permission denied`: RLSの問題
- `publication does not exist`: Publicationが作成されていない
- その他のエラー: コンソールログを共有してサポートを受ける

## 5. デバッグ手順

1. **コンソールログを全てコピー**
   - ページを開いてから
   - 見積もりを投稿するまでの
   - すべてのログをコピー

2. **SQL診断結果をコピー**
   - `REALTIME_DIAGNOSTICS.sql`の結果

3. **ネットワークタブを確認**
   - WebSocketの接続状態
   - POSTリクエストの成功/失敗

4. **環境変数を確認**
   ```bash
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

## 6. 緊急回避策

Realtimeが動作しない場合、ポーリングモードで使い続けることができます：

1. 黄色インジケーター（ポーリング）でも機能は正常に動作します
2. 2秒ごとに更新されます
3. Realtimeほど即座ではありませんが、実用上問題ありません

## 7. サポート

上記の手順で解決しない場合は、以下の情報を含めてissueを作成してください：

- ブラウザのコンソールログ（全て）
- SQL診断結果
- エラーメッセージ（あれば）
- Supabaseプロジェクトの設定スクリーンショット

---

**最終更新**: 2025-11-17
