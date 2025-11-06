# 工数見積もりポーカー

プランニングポーカー形式で工数を見積もるWebアプリケーション（ステップ1実装版）

## 特徴

- ニックネーム入力で簡単に部屋を作成
- 共有URLで他の参加者を招待
- ポーカー風のカードUIで直感的に見積もり
- リアルタイム更新（2秒間隔ポーリング）
- 公開/非公開の切り替え機能
- 平均値・中央値の自動計算
- レスポンシブデザイン対応

## 技術スタック

- Next.js 16 (App Router)
- TypeScript
- Prisma (ORM)
- PostgreSQL
- Tailwind CSS

## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env`ファイルを編集して、データベース接続文字列を設定してください：

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

#### Supabaseを使用する場合

1. [Supabase](https://supabase.com/)でプロジェクトを作成
2. Settings > Database > Connection string > URI をコピー
3. `.env`ファイルに貼り付け

### 3. Prisma Clientの生成

```bash
npm run db:generate
```

### 4. データベースマイグレーション

```bash
npm run db:migrate
```

初回実行時にマイグレーション名を聞かれるので、`init`などを入力してください。

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 使い方

### 部屋を作成

1. トップページでニックネームを入力
2. 「新しい部屋を作成」ボタンをクリック
3. 共有URLが発行されます

### 参加者を招待

1. 共有URLをコピーして他の参加者に送信
2. 参加者はURLからニックネームを入力して参加

### 見積もりを行う

1. カードを選択して見積もりを投稿
2. 全員が投稿したら「公開する」ボタンをクリック
3. 平均値・中央値を参考に確定工数を入力

## プロジェクト構成

```
src/
├── app/
│   ├── page.tsx                          # トップページ
│   ├── estimate/[shareToken]/
│   │   └── page.tsx                      # 見積もり画面
│   └── api/
│       └── sessions/                     # API Routes
├── components/
│   ├── PokerCard.tsx                     # カードコンポーネント
│   ├── CardSelector.tsx                  # カード選択UI
│   ├── ParticipantList.tsx               # 参加者一覧
│   └── EstimateResult.tsx                # 結果表示
└── lib/
    ├── prisma.ts                         # Prismaクライアント
    └── utils.ts                          # ユーティリティ関数
```

## API エンドポイント

- `POST /api/sessions` - 新規セッション作成
- `GET /api/sessions/[shareToken]` - セッション情報取得
- `POST /api/sessions/[shareToken]/estimates` - 見積もり投稿
- `PATCH /api/sessions/[shareToken]/reveal` - 公開/非公開切り替え
- `POST /api/sessions/[shareToken]/finalize` - 工数確定

## 便利なコマンド

```bash
# 開発サーバー起動
npm run dev

# Prisma Client生成
npm run db:generate

# マイグレーション実行
npm run db:migrate

# データベースを直接更新（マイグレーションなし）
npm run db:push

# Prisma Studioでデータベース確認
npm run db:studio

# 本番ビルド
npm run build

# 本番サーバー起動
npm start
```

## データベーススキーマ

### EstimationSession

見積もりセッション（部屋）

- `id`: セッションID
- `shareToken`: 共有URL用のトークン
- `isRevealed`: 公開/非公開フラグ
- `status`: セッションステータス (ACTIVE | FINALIZED)
- `finalEstimate`: 確定工数
- `createdAt`: 作成日時

### Estimate

個別の見積もり

- `id`: 見積もりID
- `sessionId`: セッションID
- `nickname`: 参加者のニックネーム
- `value`: 見積もり値（日数）
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

## 実装済み機能（ステップ1）

- [x] 部屋（見積もりセッション）の作成
- [x] ニックネーム入力での参加
- [x] 共有URL生成
- [x] カード選択UI（ポーカー風）
- [x] ポーリングによるリアルタイム更新
- [x] 公開/非公開切り替え
- [x] 工数確定機能

## 今後の実装予定（ステップ2以降）

- [ ] カードアニメーション
- [ ] トースト通知
- [ ] WebSocketによるリアルタイム通信
- [ ] ユーザー認証機能
- [ ] プロジェクト・タスク管理
- [ ] 見積もり履歴

## デプロイメント

### 自動デプロイ（GitHub Actions）

このプロジェクトはGitHub Actionsで自動デプロイに対応しています。

#### Preview環境
- **トリガー**: PR作成/更新、`claude/**`, `preview/**`, `dev/**` ブランチへのpush
- **データベース**: Preview用データベース
- **用途**: 開発中の機能の確認・テスト

#### Production環境
- **トリガー**: `main` ブランチへのmerge/push
- **データベース**: Production用データベース
- **用途**: 本番環境

### デプロイ設定方法

詳細な設定手順は [docs/deployment.md](docs/deployment.md) を参照してください。

#### 必要なGitHub Secrets（環境ごと）

両環境で同じ変数名を使用し、GitHub Environmentsで環境ごとに異なる値を設定します。

**Preview環境 (`preview`) と Production環境 (`production`):**

各環境に以下のSecretsを設定してください：

| Secret名 | 説明 |
|---------|------|
| `POSTGRES_URL` | PostgreSQL接続URL |
| `POSTGRES_PRISMA_URL` | Prisma用接続URL（プーリング対応） |
| `POSTGRES_URL_NON_POOLING` | 非プーリング接続URL |
| `POSTGRES_USER` | データベースユーザー名 |
| `POSTGRES_PASSWORD` | データベースパスワード |
| `POSTGRES_DATABASE` | データベース名 |
| `POSTGRES_HOST` | データベースホスト |
| `SUPABASE_URL` | SupabaseプロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL（公開用） |
| `SUPABASE_ANON_KEY` | Supabase匿名キー |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase匿名キー（公開用） |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabaseサービスロールキー |
| `SUPABASE_JWT_SECRET` | Supabase JWT秘密鍵 |

**重要:** Preview環境とProduction環境で**異なるSupabaseプロジェクト**を使用してください。

## ライセンス

MIT

## ドキュメント

- [開発ログ (Step 1)](docs/development/step1.md) - 実装の詳細
- [デプロイメント設定](docs/deployment.md) - CI/CDの設定方法
- [要件定義](docs/requirements.md) - プロジェクト全体の要件
