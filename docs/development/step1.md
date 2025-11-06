## ステップ1: 基本的な部屋機能とポーリング

### 目標
URLを発行して複数人で見積もりができる最小限の機能を実装

### 実装する機能
- [ ] 部屋（見積もりセッション）の作成
- [ ] ニックネーム入力での参加
- [ ] 共有URL生成
- [ ] カード選択UI（ポーカー風）
- [ ] ポーリングによるリアルタイム更新
- [ ] 公開/非公開切り替え
- [ ] 工数確定機能

### データベーススキーマ（Step 1）

```prisma
// schema.prisma
model EstimationSession {
  id            String         @id @default(cuid())
  shareToken    String         @unique
  isRevealed    Boolean        @default(false)
  status        SessionStatus  @default(ACTIVE)
  finalEstimate Float?         // 確定工数
  createdAt     DateTime       @default(now())

  estimates     Estimate[]
}

enum SessionStatus {
  ACTIVE      // アクティブ
  FINALIZED   // 工数確定済み
}

model Estimate {
  id            String            @id @default(cuid())
  sessionId     String
  session       EstimationSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  nickname      String            // 参加者のニックネーム
  value         Float             // 工数（日数）
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  @@unique([sessionId, nickname])
}
```

### API設計（Step 1）

```typescript
// POST /api/sessions
// 部屋を作成
{
  "nickname": "山田太郎"
}
→ Response: {
  "sessionId": "clxxx...",
  "shareToken": "abc123xyz",
  "shareUrl": "https://app.com/estimate/abc123xyz"
}

// GET /api/sessions/[shareToken]
// セッション情報取得（ポーリング用）
→ Response: {
  "session": {
    "id": "clxxx...",
    "shareToken": "abc123xyz",
    "isRevealed": false,
    "status": "ACTIVE",
    "finalEstimate": null
  },
  "estimates": [
    { "nickname": "山田太郎", "value": 1.0, "updatedAt": "..." },
    { "nickname": "佐藤花子", "value": 2.0, "updatedAt": "..." }
  ]
}

// POST /api/sessions/[shareToken]/estimates
// 見積もりを投稿
{
  "nickname": "山田太郎",
  "value": 1.5
}

// PATCH /api/sessions/[shareToken]/reveal
// 公開/非公開切り替え
{
  "isRevealed": true
}

// POST /api/sessions/[shareToken]/finalize
// 工数確定
{
  "finalEstimate": 2.0
}
```

### ファイル構成（Step 1）

```
app/
├── page.tsx                          # トップページ（部屋作成）
├── estimate/
│   └── [shareToken]/
│       └── page.tsx                  # 見積もり画面
├── api/
│   └── sessions/
│       ├── route.ts                  # POST: 部屋作成
│       └── [shareToken]/
│           ├── route.ts              # GET: セッション情報取得
│           ├── estimates/
│           │   └── route.ts          # POST: 見積もり投稿
│           ├── reveal/
│           │   └── route.ts          # PATCH: 公開切り替え
│           └── finalize/
│               └── route.ts          # POST: 工数確定
├── components/
│   ├── PokerCard.tsx                 # カードコンポーネント
│   ├── CardSelector.tsx              # カード選択UI
│   ├── ParticipantList.tsx           # 参加者一覧
│   └── EstimateResult.tsx            # 結果表示
└── lib/
    ├── prisma.ts                     # Prismaクライアント
    └── utils.ts                      # ユーティリティ関数
```

### 実装タスク（Step 1）

#### 1-1. セットアップ（2時間）
- [ ] Next.js プロジェクト作成
- [ ] Prisma セットアップ
- [ ] データベース接続確認
- [ ] Tailwind CSS セットアップ

#### 1-2. データベース（1時間）
- [ ] Prisma スキーマ作成
- [ ] マイグレーション実行
- [ ] シードデータ作成（開発用）

#### 1-3. API実装（4時間）
- [ ] 部屋作成API
- [ ] セッション情報取得API
- [ ] 見積もり投稿API
- [ ] 公開切り替えAPI
- [ ] 工数確定API

#### 1-4. UI実装（6時間）
- [ ] トップページ（部屋作成フォーム）
- [ ] カードコンポーネント
- [ ] カード選択UI
- [ ] 参加者一覧
- [ ] 結果表示エリア
- [ ] 公開/非公開トグル
- [ ] 工数確定フォーム

#### 1-5. ポーリング実装（2時間）
- [ ] useEffectでポーリング実装
- [ ] 2秒間隔での自動更新
- [ ] ローディング状態の管理

#### 1-6. テスト（2時間）
- [ ] 複数ブラウザでの動作確認
- [ ] 見積もりの同期確認
- [ ] エッジケースのテスト

**合計見積もり: 17時間（約2〜3日）**

---

## ステップ2: UI/UXの改善

### 目標
ポーカー風のカードゲームUIを洗練し、使いやすさを向上

### 実装する機能
- [ ] カードアニメーション
- [ ] 選択時のフィードバック
- [ ] トースト通知
- [ ] ローディング状態の改善
- [ ] レスポンシブデザイン
- [ ] カードフリップアニメーション
- [ ] 参加者アバター表示
- [ ] 統計情報の表示（平均値・中央値）

### 追加コンポーネント

```
components/
├── ui/                               # shadcn/ui コンポーネント
│   ├── toast.tsx
│   ├── button.tsx
│   └── card.tsx
├── animations/
│   ├── CardFlip.tsx                  # カードフリップ
│   └── ParticipantJoin.tsx           # 参加者参加時のアニメーション
└── stats/
    └── EstimateStats.tsx             # 統計情報表示
```

---

## 開発ログ

### 2025-11-05

#### セットアップ（完了）
- [x] Prismaのインストールと初期化
- [x] データベーススキーマの作成（EstimationSession, Estimate, SessionStatus）
- [x] Prisma Clientライブラリの作成（src/lib/prisma.ts）
- [x] ユーティリティ関数の作成（src/lib/utils.ts）
  - shareToken生成関数
  - 平均値・中央値計算関数

#### データベース
- [x] Prisma スキーマ作成
  - EstimationSessionモデル（id, shareToken, isRevealed, status, finalEstimate, createdAt）
  - Estimateモデル（id, sessionId, nickname, value, createdAt, updatedAt）
  - SessionStatus enum（ACTIVE, FINALIZED）

#### API実装（完了）
- [x] POST /api/sessions - 部屋作成API
  - ニックネーム入力で新規セッション作成
  - ユニークなshareToken生成
  - 共有URL返却
- [x] GET /api/sessions/[shareToken] - セッション情報取得API（ポーリング用）
  - セッション情報と見積もり一覧を返却
  - isRevealedがfalseの場合は見積もり値を非表示
- [x] POST /api/sessions/[shareToken]/estimates - 見積もり投稿API
  - 見積もりのupsert（作成/更新）
  - バリデーション付き
- [x] PATCH /api/sessions/[shareToken]/reveal - 公開/非公開切り替えAPI
  - isRevealedフラグの切り替え
- [x] POST /api/sessions/[shareToken]/finalize - 工数確定API
  - 確定工数の保存
  - ステータスをFINALIZEDに変更

#### コンポーネント実装（完了）
- [x] PokerCard.tsx - カードコンポーネント
  - ホバーエフェクト
  - 選択状態の視覚化
- [x] CardSelector.tsx - カード選択UI
  - 8種類のプリセットカード（1h, 2h, 4h, 8h, 1d, 1.5d, 2d, 3d）
  - 自由記述入力機能
  - 選択状態の管理
- [x] ParticipantList.tsx - 参加者一覧
  - 参加者数の表示
  - 提出済みステータス
  - 公開時の見積もり値表示
  - 非公開時のカードアイコン表示
- [x] EstimateResult.tsx - 結果表示
  - 平均値・中央値の自動計算
  - 全見積もりの一覧表示
  - 確定工数の表示

#### ページ実装（完了）
- [x] トップページ（src/app/page.tsx）
  - ニックネーム入力フォーム
  - 新規セッション作成機能
  - 使い方ガイド表示
- [x] 見積もり画面（src/app/estimate/[shareToken]/page.tsx）
  - ニックネーム入力画面
  - カード選択UI統合
  - 参加者一覧表示
  - 見積もり結果表示
  - 公開/非公開切り替えボタン
  - 工数確定フォーム
  - 共有URLコピー機能
  - 2秒間隔のポーリング実装

#### ポーリング実装（完了）
- [x] useEffectでのポーリング実装
- [x] 2秒間隔での自動更新
- [x] ローディング状態の管理
- [x] エラーハンドリング

#### 実装の特徴
- レスポンシブデザイン対応（モバイル・タブレット・デスクトップ）
- リアルタイム性の高いUI（2秒ポーリング）
- プランニングポーカー形式のカードゲームUI
- Tailwind CSSによる洗練されたデザイン
- エラーハンドリングとバリデーション
- 直感的なUX（ホバーエフェクト、アニメーション）

#### 次のステップ
1. データベース接続設定（.envファイルにSupabase接続文字列を設定）
2. Prisma Clientの生成（`npx prisma generate`）
3. データベースマイグレーション実行（`npx prisma migrate dev --name init`）
4. 開発サーバー起動（`npm run dev`）
5. 動作確認とテスト

#### 注意事項
- DATABASE_URLを.envファイルに設定する必要があります
- Supabaseまたは他のPostgreSQLデータベースへの接続が必要です
- `npx prisma migrate dev`でマイグレーションを実行してください

---

### 2025-11-06 (continued)

#### CI/CD & デプロイメント設定（完了）

GitHub Actionsによる自動デプロイ機能を実装しました。

##### Preview環境用ワークフロー（`.github/workflows/deploy-preview.yml`）
- トリガー: PR作成/更新、claude/preview/devブランチへのpush
- 実行内容:
  - Node.js環境セットアップ
  - 依存関係インストール
  - Prisma Client生成
  - データベースマイグレーション実行
  - アプリケーションビルド
  - デプロイ通知
- 環境変数: `DATABASE_URL`, `NEXT_PUBLIC_APP_URL` (preview環境で設定)

##### Production環境用ワークフロー（`.github/workflows/deploy-production.yml`）
- トリガー: mainブランチへのmerge/push、手動実行
- 実行内容:
  - Node.js環境セットアップ
  - 依存関係インストール
  - Prisma Client生成
  - データベースマイグレーション実行
  - アプリケーションビルド
  - テスト実行（存在する場合）
  - デプロイ通知
- 環境変数: `DATABASE_URL`, `NEXT_PUBLIC_APP_URL` (production環境で設定)
- 保護設定推奨: レビュアー必須、mainブランチのみ

##### ドキュメント作成
- [x] デプロイメント設定ガイド作成（`docs/deployment.md`）
  - GitHub Secretsの設定方法
  - Supabaseデータベース作成手順
  - GitHub Environments設定
  - トラブルシューティング
  - セキュリティベストプラクティス
- [x] README更新
  - デプロイメントセクション追加
  - 必要な環境変数の説明
  - ドキュメントリンク整理

##### デプロイフロー
```
開発 → claude/** ブランチ push → Preview DB デプロイ
                     ↓
              PR作成・レビュー
                     ↓
              main merge → Production DB デプロイ
```

##### セキュリティ対策
- 環境ごとにデータベースを分離
- Production環境にはレビュー必須設定推奨
- Secretsによる機密情報管理
- マイグレーションの自動適用

この設定により、開発からリリースまでの完全な自動化が実現されました。
