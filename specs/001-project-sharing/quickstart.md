# Quickstart: プロジェクト共有機能

**Date**: 2025-12-28
**Feature**: 001-project-sharing

## 前提条件

- Node.js 18.x 以上
- PostgreSQL データベース（Supabase または Vercel Postgres）
- 既存のEstimate Poker Next環境がセットアップ済み

## セットアップ手順

### 1. ブランチをチェックアウト

```bash
git checkout 001-project-sharing
```

### 2. 依存関係をインストール

```bash
npm install
```

### 3. Prismaスキーマを更新

```bash
# マイグレーションを作成・適用
npx prisma migrate dev --name add_project_sharing

# Prismaクライアントを再生成
npx prisma generate
```

### 4. 開発サーバーを起動

```bash
npm run dev
```

## 機能の使い方

### オーナーとして招待URLを発行する

1. ログインしてマイページを開く
2. プロジェクト一覧から対象プロジェクトをクリック
3. プロジェクト詳細画面で「招待URLを発行」ボタンをクリック
4. 表示された招待URLをコピーしてチームメンバーに共有

### メンバーとして参加申請する

1. 受け取った招待URLにアクセス
2. 未ログインの場合はログイン画面にリダイレクト
3. ログイン後、参加申請ページが表示される
4. 「参加を申請する」ボタンをクリック
5. オーナーの承認を待つ

### オーナーとして参加リクエストを管理する

1. プロジェクト詳細画面を開く
2. 「参加リクエスト（N件）」バッジをクリック
3. リクエスト一覧から「承認」または「拒否」を選択

### メンバーとしてプロジェクトを利用する

1. マイページを開く
2. 「参加中のプロジェクト」セクションからプロジェクトを選択
3. セッション一覧を表示、新規セッションを作成可能

## 動作確認チェックリスト

- [ ] 招待URLが正常に発行される
- [ ] 招待URLをコピーできる
- [ ] 未ログイン時は認証後に参加申請ページに戻る
- [ ] 参加申請が送信できる
- [ ] オーナーに参加リクエストが表示される
- [ ] 承認するとメンバーに追加される
- [ ] 拒否するとリクエストが削除される
- [ ] メンバーのマイページに参加中プロジェクトが表示される
- [ ] メンバーがセッションを作成できる
- [ ] オーナーがメンバーを削除できる

## トラブルシューティング

### マイグレーションエラーが発生する

```bash
# 既存マイグレーションをリセット（開発環境のみ）
npx prisma migrate reset

# または手動でマイグレーション適用
npx prisma db push
```

### 招待URLが無効と表示される

- 招待URLが再発行されていないか確認
- プロジェクトが削除されていないか確認

### 参加申請ボタンが表示されない

- ログイン状態を確認
- 既にメンバーまたはオーナーでないか確認
- 既に申請済みでないか確認

## API テスト例

```bash
# 招待URL発行
curl -X POST http://localhost:3000/api/projects/{projectId}/invite \
  -H "Cookie: next-auth.session-token=..."

# 参加申請
curl -X POST http://localhost:3000/api/projects/{projectId}/join-requests \
  -H "Cookie: next-auth.session-token=..." \
  -H "Content-Type: application/json"

# 参加リクエスト一覧
curl http://localhost:3000/api/projects/{projectId}/join-requests \
  -H "Cookie: next-auth.session-token=..."

# リクエスト承認
curl -X PATCH http://localhost:3000/api/projects/{projectId}/join-requests/{requestId} \
  -H "Cookie: next-auth.session-token=..." \
  -H "Content-Type: application/json" \
  -d '{"action": "approve"}'

# メンバー一覧
curl http://localhost:3000/api/projects/{projectId}/members \
  -H "Cookie: next-auth.session-token=..."
```

## 次のステップ

この機能の実装が完了したら、以下を確認:

1. `npm run lint` - ESLintエラーがないこと
2. `npm run type-check` - 型エラーがないこと
3. `npm run build` - ビルドが成功すること
4. 上記チェックリストの全項目が動作すること
