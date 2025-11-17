# Supabase Realtime 設定ガイド

## 問題

WebSocket接続は成功（SUBSCRIBED）していますが、データベースの変更イベントが発火していません。

## 原因

Supabase Realtimeを使用するには、データベース側で以下の設定が必要です：

1. **REPLICA IDENTITY**: テーブルの変更を追跡できるようにする
2. **Publication**: Supabaseにどのテーブルの変更を配信するか指定する

現在、これらの設定がされていないため、データが変更されてもイベントが送信されていません。

## 解決方法

### オプション1: マイグレーションを適用（推奨）

以下のコマンドでマイグレーションを適用します：

```bash
# 環境変数を設定（.env.localから取得）
export DATABASE_URL="your_postgres_url_here"
export POSTGRES_URL_NON_POOLING="your_non_pooling_url_here"

# マイグレーションを適用
npx prisma migrate deploy
```

このマイグレーションは以下を実行します：
- `estimates`と`estimation_sessions`テーブルに`REPLICA IDENTITY FULL`を設定
- 両テーブルを`supabase_realtime` publicationに追加

### オプション2: SQLを直接実行

Supabaseのダッシュボードまたは`psql`を使用して、以下のSQLを実行します：

```sql
-- Step 1: Enable REPLICA IDENTITY
ALTER TABLE "estimates" REPLICA IDENTITY FULL;
ALTER TABLE "estimation_sessions" REPLICA IDENTITY FULL;

-- Step 2: Add to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE "estimates";
ALTER PUBLICATION supabase_realtime ADD TABLE "estimation_sessions";
```

#### Supabaseダッシュボードでの実行方法

1. https://app.supabase.com にアクセス
2. プロジェクトを選択
3. 左メニューから「SQL Editor」を選択
4. 上記のSQLを貼り付けて実行

### オプション3: Supabase CLI（ローカル開発）

ローカルでSupabaseを実行している場合：

```bash
# Supabaseを起動
supabase start

# マイグレーションを作成して適用
supabase db reset
```

## 確認方法

マイグレーション適用後、以下の方法で動作を確認できます：

### 1. ブラウザのコンソールログを確認

以下のログが表示されるはずです：

```
[Realtime] Starting polling for updates
[Realtime] Session ID now available, attempting realtime connection
[Realtime] Setting up realtime subscription for session: xxx
[Realtime] Subscription status: SUBSCRIBED
[Realtime] Successfully connected, polling stopped
```

そして、データが変更されると：

```
[Realtime] ✅ Estimate change received: {...}
[Realtime] ✅ Session change received: {...}
```

### 2. 接続状態インジケーターを確認

- **緑色ドット + "リアルタイム"**: 正常に動作しています
- **黄色ドット + "ポーリング"**: まだポーリングモード（Realtimeが動作していない）

### 3. 実際の動作を確認

1. 2つのブラウザウィンドウで同じセッションを開く
2. 片方で見積もりを送信
3. **もう片方が即座に更新される**（リロード不要）

## トラブルシューティング

### エラー: "publication does not exist"

```sql
-- supabase_realtime publicationを作成
CREATE PUBLICATION supabase_realtime;

-- テーブルを追加
ALTER PUBLICATION supabase_realtime ADD TABLE "estimates";
ALTER PUBLICATION supabase_realtime ADD TABLE "estimation_sessions";
```

### エラー: "permission denied"

データベースユーザーに権限がない場合は、スーパーユーザーまたは適切な権限を持つユーザーで実行してください。

Supabaseのマネージドサービスを使用している場合は、Supabaseダッシュボードから実行してください。

### まだイベントが来ない場合

1. **Replicationスロットを確認**
   ```sql
   SELECT * FROM pg_replication_slots;
   ```

2. **Publicationの内容を確認**
   ```sql
   SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
   ```

3. **Supabaseのログを確認**
   - Supabaseダッシュボード → Logs → Realtime

## 参考資料

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [PostgreSQL REPLICA IDENTITY](https://www.postgresql.org/docs/current/sql-altertable.html#SQL-ALTERTABLE-REPLICA-IDENTITY)
- [PostgreSQL Publications](https://www.postgresql.org/docs/current/logical-replication-publication.html)
