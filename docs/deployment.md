# デプロイメント設定ガイド

このドキュメントでは、GitHub Actionsを使用したPreview/Production環境への自動デプロイの設定方法を説明します。

## 概要

- **Preview環境**: PRやpreview/claude/devブランチへのpush時に自動デプロイ
- **Production環境**: mainブランチへのmerge/push時に自動デプロイ

## GitHub Secretsの設定

GitHub Environmentsを使用して、環境ごとに同じ変数名で異なる値を設定します。

### 1. GitHub Environmentsの設定画面を開く

1. リポジトリページで `Settings` > `Environments` を開く
2. 環境を選択（`preview` または `production`）
3. `Add secret` をクリック

### 2. 必要なSecrets一覧

`preview` と `production` 両方の環境に以下のSecretsを設定します：

| Secret名 | 説明 | 取得方法 |
|---------|------|---------|
| `POSTGRES_URL` | PostgreSQL接続URL | Supabase Settings > Database > Connection string > URI |
| `POSTGRES_PRISMA_URL` | Prisma用接続URL（プーリング対応） | Supabase Settings > Database > Connection pooling > Transaction mode |
| `POSTGRES_URL_NON_POOLING` | 非プーリング接続URL | Supabase Settings > Database > Connection string > URI (Direct) |
| `POSTGRES_USER` | データベースユーザー名 | Supabase Settings > Database > User |
| `POSTGRES_PASSWORD` | データベースパスワード | Supabaseプロジェクト作成時に設定したパスワード |
| `POSTGRES_DATABASE` | データベース名 | 通常は `postgres` |
| `POSTGRES_HOST` | データベースホスト | Supabase Settings > Database > Host |
| `SUPABASE_URL` | SupabaseプロジェクトURL | Supabase Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL（公開用） | 上記と同じ |
| `SUPABASE_ANON_KEY` | Supabase匿名キー | Supabase Settings > API > Project API keys > anon public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase匿名キー（公開用） | 上記と同じ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabaseサービスロールキー | Supabase Settings > API > Project API keys > service_role |
| `SUPABASE_JWT_SECRET` | Supabase JWT秘密鍵 | Supabase Settings > API > JWT Settings > JWT Secret |

**重要:**
- 両環境で同じ変数名を使用しますが、GitHub Environmentsの機能により環境ごとに異なる値が適用されます
- Preview環境とProduction環境では**必ず異なるSupabaseプロジェクト**を使用してください

## Supabaseを使用する場合

### Preview環境用データベース作成

1. [Supabase](https://supabase.com/)で新しいプロジェクトを作成
2. プロジェクト名: `estimate-poker-preview`
3. Supabase Settings画面で以下の情報を取得:
   - Database タブ:
     - Connection string (URI) → `POSTGRES_URL`
     - Connection pooling (Transaction mode) → `POSTGRES_PRISMA_URL`
     - Connection string (Direct) → `POSTGRES_URL_NON_POOLING`
     - Host → `POSTGRES_HOST`
     - User → `POSTGRES_USER`
     - Database → `POSTGRES_DATABASE`
     - Password → `POSTGRES_PASSWORD` (プロジェクト作成時に設定したもの)
   - API タブ:
     - Project URL → `SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_URL`
     - Project API keys > anon public → `SUPABASE_ANON_KEY` と `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - Project API keys > service_role → `SUPABASE_SERVICE_ROLE_KEY`
   - API > JWT Settings:
     - JWT Secret → `SUPABASE_JWT_SECRET`
4. GitHub Settings > Environments > `preview` で上記すべてのSecretsを追加

### Production環境用データベース作成

1. Supabaseで**別の**新しいプロジェクトを作成
2. プロジェクト名: `estimate-poker-production`
3. Preview環境と同様に、Settings画面ですべての環境変数を取得
4. GitHub Settings > Environments > `production` で上記すべてのSecretsを追加

**重要:** Preview環境とProduction環境では必ず異なるSupabaseプロジェクトを使用してください。

## GitHub Environments の設定

### 1. Preview環境の作成

1. リポジトリページで `Settings` > `Environments` を開く
2. `New environment` をクリック
3. 環境名: `preview`
4. 必要に応じて Protection rules を設定（任意）

### 2. Production環境の作成

1. `New environment` をクリック
2. 環境名: `production`
3. Protection rules を設定（推奨）:
   - ✅ Required reviewers (レビュアーを1名以上設定)
   - ✅ Wait timer: 5分（任意）
4. Deployment branches:
   - `Selected branches` を選択
   - `main` ブランチのみ許可

## ワークフローの動作

### Preview デプロイメント

**トリガー条件:**
- Pull Requestが作成・更新された時
- `claude/**`, `preview/**`, `dev/**` ブランチへのpush時

**実行内容:**
1. コードのチェックアウト
2. Node.js環境のセットアップ
3. 依存関係のインストール
4. Prisma Clientの生成
5. データベースマイグレーションの実行
6. アプリケーションのビルド
7. デプロイ通知

### Production デプロイメント

**トリガー条件:**
- `main` ブランチへのpush/merge時
- 手動実行（workflow_dispatch）

**実行内容:**
1. コードのチェックアウト
2. Node.js環境のセットアップ
3. 依存関係のインストール
4. Prisma Clientの生成
5. データベースマイグレーションの実行
6. アプリケーションのビルド
7. テストの実行（存在する場合）
8. デプロイ通知

## データベースマイグレーション

### 新しいマイグレーションの作成

ローカルで開発中に新しいマイグレーションを作成した場合：

```bash
# マイグレーションファイルの生成
npx prisma migrate dev --name your_migration_name
```

マイグレーションファイルは `prisma/migrations/` ディレクトリに保存されます。
これらのファイルをgitにコミットすると、CI/CDで自動的に適用されます。

### マイグレーションの確認

```bash
# マイグレーション履歴の確認
npx prisma migrate status
```

## トラブルシューティング

### マイグレーションが失敗する場合

1. データベース接続文字列が正しいか確認
2. データベースに接続権限があるか確認
3. マイグレーションファイルが正しくコミットされているか確認

```bash
# ローカルでマイグレーションをテスト
DATABASE_URL="your_preview_db_url" npx prisma migrate deploy
```

### ビルドが失敗する場合

1. ローカルでビルドが成功するか確認: `npm run build`
2. TypeScriptエラーがないか確認
3. 環境変数が正しく設定されているか確認

### Prisma Clientの生成エラー

GitHub Actionsでは `npm ci` の後に自動的に `prisma generate` が実行されます（`postinstall` スクリプト）。
エラーが発生する場合は、package.jsonの `postinstall` スクリプトを確認してください。

## セキュリティのベストプラクティス

1. **Secrets の管理**
   - データベース接続文字列には強力なパスワードを使用
   - Secretsは絶対にコードにハードコードしない

2. **環境の分離**
   - Preview と Production のデータベースは必ず分離
   - 本番データをPreview環境で使用しない

3. **アクセス制御**
   - Production環境にはデプロイ前のレビューを必須に設定
   - 必要最小限の権限のみを付与

4. **データベースバックアップ**
   - Productionデータベースは定期的にバックアップ
   - Supabaseの自動バックアップ機能を有効化

## デプロイフロー例

### 機能開発からリリースまで

1. **機能開発**
   ```bash
   git checkout -b claude/new-feature
   # 開発作業
   git push origin claude/new-feature
   ```
   → Preview環境に自動デプロイ ✅

2. **Pull Request作成**
   - GitHubでPRを作成
   → Preview環境が更新される ✅

3. **レビューと承認**
   - コードレビュー
   - Preview環境で動作確認

4. **mainブランチにマージ**
   ```bash
   # GitHub上でマージ
   ```
   → Production環境に自動デプロイ ✅

## 参考リンク

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Supabase Documentation](https://supabase.com/docs)
