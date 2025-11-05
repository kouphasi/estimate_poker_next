# 開発計画書 - 段階的実装ガイド

## 概要

プログラミング工数見積もりアプリケーションを、7つのステップに分けて段階的に開発します。各ステップは独立して動作可能なMVPとして設計されています。

---

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

### 実装タスク（Step 2）

#### 2-1. デザインシステム導入（2時間）
- [ ] shadcn/ui インストール
- [ ] カラーパレット設定
- [ ] タイポグラフィ設定

#### 2-2. カードアニメーション（4時間）
- [ ] カードホバー効果
- [ ] カード選択時のアニメーション
- [ ] カードフリップ（公開時）
- [ ] カード配置のトランジション

#### 2-3. フィードバック機能（3時間）
- [ ] トースト通知実装
- [ ] ローディングスピナー
- [ ] エラーメッセージ表示
- [ ] 成功メッセージ表示

#### 2-4. レスポンシブ対応（3時間）
- [ ] モバイル表示最適化
- [ ] タブレット表示最適化
- [ ] カードレイアウトの調整

#### 2-5. 統計情報（2時間）
- [ ] 平均値計算
- [ ] 中央値計算
- [ ] 最大値・最小値表示
- [ ] グラフ表示（オプション）

#### 2-6. UXの細かい改善（2時間）
- [ ] コピー機能（URL共有）
- [ ] キーボードショートカット
- [ ] 参加者アバター
- [ ] オンライン状態表示

**合計見積もり: 16時間（約2日）**

---

## ステップ3: 簡易ログイン機能

### 目標
認証なしで「ログイン」して部屋を管理できる機能（ニックネーム保存程度）

### 実装する機能
- [ ] ローカルストレージでのユーザー情報保存
- [ ] ユーザーIDの生成
- [ ] 自分が作成した部屋の一覧表示
- [ ] 部屋の削除機能

### データベーススキーマ追加（Step 3）

```prisma
model User {
  id            String    @id @default(cuid())
  nickname      String
  isGuest       Boolean   @default(true)
  createdAt     DateTime  @default(now())

  sessions      EstimationSession[]
}

model EstimationSession {
  // 既存のフィールド...
  ownerId       String?
  owner         User?     @relation(fields: [ownerId], references: [id])
}
```

### API設計追加（Step 3）

```typescript
// POST /api/users
// 簡易ユーザー作成（認証なし）
{
  "nickname": "山田太郎"
}
→ Response: {
  "userId": "clxxx...",
  "nickname": "山田太郎"
}

// GET /api/users/[userId]/sessions
// 自分が作成した部屋一覧
→ Response: {
  "sessions": [
    {
      "id": "clxxx...",
      "shareToken": "abc123",
      "status": "ACTIVE",
      "createdAt": "..."
    }
  ]
}

// DELETE /api/sessions/[shareToken]
// 部屋削除（オーナーのみ）
```

### 実装タスク（Step 3）

#### 3-1. ユーザー管理（3時間）
- [ ] User テーブル追加
- [ ] ユーザー作成API
- [ ] ローカルストレージでユーザーID保存
- [ ] ユーザーコンテキスト作成

#### 3-2. 部屋一覧画面（4時間）
- [ ] マイページ作成
- [ ] 作成した部屋一覧表示
- [ ] 部屋への遷移
- [ ] 部屋削除機能

#### 3-3. オーナー権限（2時間）
- [ ] オーナー判定ロジック
- [ ] オーナー専用UI表示
- [ ] 権限チェックミドルウェア

**合計見積もり: 9時間（約1日）**

---

## ステップ4: タスクとの紐付け

### 目標
タスクを作成し、そのタスクに対して部屋を作成できる

### 実装する機能
- [ ] タスク作成機能
- [ ] タスク一覧表示
- [ ] タスクに紐付いた部屋作成
- [ ] タスクへの工数記録
- [ ] タスク詳細画面

### データベーススキーマ追加（Step 4）

```prisma
model Task {
  id            String    @id @default(cuid())
  name          String
  description   String?
  ownerId       String
  owner         User      @relation(fields: [ownerId], references: [id])
  finalEstimate Float?    // 確定工数
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  sessions      EstimationSession[]
}

model EstimationSession {
  // 既存のフィールド...
  taskId        String?
  task          Task?     @relation(fields: [taskId], references: [id])
}
```

### ファイル構成追加（Step 4）

```
app/
├── tasks/
│   ├── page.tsx                      # タスク一覧
│   ├── new/
│   │   └── page.tsx                  # タスク作成
│   └── [taskId]/
│       ├── page.tsx                  # タスク詳細
│       └── sessions/
│           └── new/
│               └── page.tsx          # 部屋作成
└── api/
    └── tasks/
        ├── route.ts                  # GET: 一覧, POST: 作成
        ├── [taskId]/
        │   ├── route.ts              # GET: 詳細, PATCH: 更新, DELETE: 削除
        │   └── sessions/
        │       └── route.ts          # POST: 部屋作成
```

### 実装タスク（Step 4）

#### 4-1. データベース（1時間）
- [ ] Task テーブル追加
- [ ] リレーション設定
- [ ] マイグレーション

#### 4-2. タスクAPI（3時間）
- [ ] タスク作成API
- [ ] タスク一覧取得API
- [ ] タスク詳細取得API
- [ ] タスク更新API
- [ ] タスク削除API

#### 4-3. タスクUI（5時間）
- [ ] タスク一覧画面
- [ ] タスク作成フォーム
- [ ] タスク詳細画面
- [ ] タスク編集フォーム
- [ ] 部屋一覧（タスク配下）

#### 4-4. 紐付け処理（2時間）
- [ ] タスクから部屋作成
- [ ] 確定工数のタスクへの反映
- [ ] タスク詳細での部屋履歴表示

**合計見積もり: 11時間（約1.5日）**

---

## ステップ5: プロジェクト管理

### 目標
プロジェクトを作成し、その配下にタスクを管理

### 実装する機能
- [ ] プロジェクト作成機能
- [ ] プロジェクト一覧表示
- [ ] プロジェクト詳細画面
- [ ] プロジェクト配下のタスク管理
- [ ] プロジェクト統計情報

### データベーススキーマ追加（Step 5）

```prisma
model Project {
  id            String    @id @default(cuid())
  name          String
  description   String?
  ownerId       String
  owner         User      @relation(fields: [ownerId], references: [id])
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  tasks         Task[]
}

model Task {
  // 既存のフィールド...
  projectId     String
  project       Project   @relation(fields: [projectId], references: [id])
}
```

### ファイル構成追加（Step 5）

```
app/
├── projects/
│   ├── page.tsx                      # プロジェクト一覧
│   ├── new/
│   │   └── page.tsx                  # プロジェクト作成
│   └── [projectId]/
│       ├── page.tsx                  # プロジェクト詳細
│       └── tasks/
│           └── new/
│               └── page.tsx          # タスク作成
└── api/
    └── projects/
        ├── route.ts                  # GET: 一覧, POST: 作成
        ├── [projectId]/
        │   ├── route.ts              # GET: 詳細, PATCH: 更新, DELETE: 削除
        │   └── tasks/
        │       └── route.ts          # GET: タスク一覧, POST: タスク作成
```

### 実装タスク（Step 5）

#### 5-1. データベース（1時間）
- [ ] Project テーブル追加
- [ ] リレーション設定
- [ ] マイグレーション

#### 5-2. プロジェクトAPI（3時間）
- [ ] プロジェクト作成API
- [ ] プロジェクト一覧取得API
- [ ] プロジェクト詳細取得API
- [ ] プロジェクト更新API
- [ ] プロジェクト削除API

#### 5-3. プロジェクトUI（5時間）
- [ ] プロジェクト一覧画面
- [ ] プロジェクト作成フォーム
- [ ] プロジェクト詳細画面
- [ ] プロジェクト編集フォーム

#### 5-4. 統計情報（3時間）
- [ ] プロジェクト全体の工数合計
- [ ] タスク完了率
- [ ] プログレスバー表示
- [ ] ダッシュボード機能

#### 5-5. ナビゲーション改善（2時間）
- [ ] パンくずリスト
- [ ] グローバルナビゲーション
- [ ] サイドバー追加

**合計見積もり: 14時間（約2日）**

---

## ステップ6: 本格的な認証機能

### 目標
メールアドレスとパスワードでの認証を実装

### 実装する機能
- [ ] ユーザー登録
- [ ] ログイン/ログアウト
- [ ] セッション管理
- [ ] パスワードリセット
- [ ] プロフィール編集

### 技術選定

**推奨**: Next-Auth（Auth.js）または Supabase Auth

```typescript
// Next-Auth を使用する場合
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // 認証ロジック
      }
    })
  ]
}
```

### データベーススキーマ変更（Step 6）

```prisma
model User {
  id            String    @id @default(cuid())
  email         String?   @unique
  passwordHash  String?   // bcryptでハッシュ化
  nickname      String
  isGuest       Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Next-Auth用
  accounts      Account[]
  sessions      Session[]

  projects      Project[]
  estimations   EstimationSession[]
}

// Next-Auth用テーブル
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

### ファイル構成追加（Step 6）

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx                  # ログイン
│   ├── register/
│   │   └── page.tsx                  # 新規登録
│   └── forgot-password/
│       └── page.tsx                  # パスワードリセット
├── api/
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts              # Next-Auth エンドポイント
│   └── users/
│       └── [userId]/
│           └── route.ts              # PATCH: プロフィール更新
└── components/
    └── auth/
        ├── LoginForm.tsx
        ├── RegisterForm.tsx
        └── AuthProvider.tsx
```

### 実装タスク（Step 6）

#### 6-1. 認証ライブラリセットアップ（3時間）
- [ ] Next-Auth インストール
- [ ] 環境変数設定
- [ ] データベーススキーマ更新
- [ ] マイグレーション

#### 6-2. 認証API（4時間）
- [ ] ユーザー登録API
- [ ] ログインAPI
- [ ] ログアウト処理
- [ ] セッション管理
- [ ] パスワードハッシュ化

#### 6-3. 認証UI（5時間）
- [ ] ログインフォーム
- [ ] 登録フォーム
- [ ] パスワードリセットフォーム
- [ ] プロフィール編集画面
- [ ] 認証ガード実装

#### 6-4. データ移行（2時間）
- [ ] ゲストユーザーのデータ保持
- [ ] 認証ユーザーへの紐付け（オプション）
- [ ] 既存データの整合性確認

#### 6-5. セキュリティ対策（2時間）
- [ ] CSRF対策
- [ ] XSS対策
- [ ] レート制限
- [ ] パスワードポリシー

**合計見積もり: 16時間（約2日）**

---

## ステップ7: リアルタイム通信への移行

### 目標
ポーリングからWebSocketベースのリアルタイム通信に移行

### 技術選定

**オプション1**: Supabase Realtime
```typescript
const channel = supabase
  .channel('estimation-session')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'Estimate' },
    (payload) => {
      // リアルタイム更新処理
    }
  )
  .subscribe()
```

**オプション2**: Socket.io
```typescript
// server
io.on('connection', (socket) => {
  socket.on('join-session', (sessionId) => {
    socket.join(sessionId)
  })

  socket.on('submit-estimate', (data) => {
    io.to(data.sessionId).emit('estimate-updated', data)
  })
})

// client
socket.emit('submit-estimate', { sessionId, value })
socket.on('estimate-updated', (data) => {
  // 更新処理
})
```

**オプション3**: Pusher
```typescript
const pusher = new Pusher(appKey, { cluster })
const channel = pusher.subscribe(`session-${sessionId}`)
channel.bind('estimate-updated', (data) => {
  // 更新処理
})
```

### 実装タスク（Step 7）

#### 7-1. 技術選定と設計（2時間）
- [ ] リアルタイム通信ライブラリの比較
- [ ] アーキテクチャ設計
- [ ] コスト試算

#### 7-2. セットアップ（3時間）
- [ ] ライブラリインストール
- [ ] 環境変数設定
- [ ] 接続確認

#### 7-3. サーバーサイド実装（4時間）
- [ ] WebSocketサーバー構築
- [ ] イベントハンドラ実装
- [ ] ルーム管理
- [ ] 切断処理

#### 7-4. クライアントサイド実装（4時間）
- [ ] WebSocket接続
- [ ] イベントリスナー
- [ ] リトライロジック
- [ ] フォールバック処理（ポーリング）

#### 7-5. 移行とテスト（3時間）
- [ ] 既存コードからの移行
- [ ] パフォーマンステスト
- [ ] 負荷テスト
- [ ] フォールバック動作確認

#### 7-6. 最適化（2時間）
- [ ] 接続プール管理
- [ ] メモリリーク対策
- [ ] エラーハンドリング強化

**合計見積もり: 18時間（約2〜3日）**

---

## 全体スケジュール

| ステップ | 内容 | 見積もり工数 | 累計工数 |
|---------|------|------------|---------|
| Step 1 | 基本的な部屋機能とポーリング | 17時間 | 17時間 |
| Step 2 | UI/UXの改善 | 16時間 | 33時間 |
| Step 3 | 簡易ログイン機能 | 9時間 | 42時間 |
| Step 4 | タスクとの紐付け | 11時間 | 53時間 |
| Step 5 | プロジェクト管理 | 14時間 | 67時間 |
| Step 6 | 本格的な認証機能 | 16時間 | 83時間 |
| Step 7 | リアルタイム通信への移行 | 18時間 | 101時間 |

**合計: 約101時間（約13日）**

※1日8時間作業として計算

---

## 各ステップの完了条件

### Step 1
- [ ] 部屋作成からURL共有まで動作
- [ ] 複数人で同時に見積もり可能
- [ ] ポーリングで更新が反映される
- [ ] 工数確定まで完了できる

### Step 2
- [ ] カードアニメーションが滑らか
- [ ] モバイルでも快適に操作可能
- [ ] 統計情報が表示される
- [ ] ユーザーフィードバックが適切

### Step 3
- [ ] ニックネームでログイン可能
- [ ] 自分の部屋一覧が見れる
- [ ] 部屋の削除ができる
- [ ] ローカルストレージでセッション維持

### Step 4
- [ ] タスク作成ができる
- [ ] タスクから部屋を作成できる
- [ ] 確定工数がタスクに反映される
- [ ] タスク一覧が表示される

### Step 5
- [ ] プロジェクト作成ができる
- [ ] プロジェクト配下にタスクを追加できる
- [ ] プロジェクトの統計が表示される
- [ ] 階層構造が正しく動作する

### Step 6
- [ ] メールアドレスで登録できる
- [ ] ログイン/ログアウトが動作
- [ ] 認証が必要な画面で保護される
- [ ] パスワードリセットができる

### Step 7
- [ ] WebSocketで即座に更新される
- [ ] 接続が切れても自動再接続
- [ ] ポーリングからの移行が完了
- [ ] パフォーマンスが改善される

---

## 推奨する開発の進め方

### 1. 各ステップの終わりにデプロイ
- Vercel等にデプロイして動作確認
- 実際のユーザーフィードバックを得る
- バグ修正やマイナー改善を実施

### 2. ブランチ戦略
```
main (本番環境)
  └── develop (開発環境)
      ├── feature/step-1
      ├── feature/step-2
      ├── feature/step-3
      └── ...
```

### 3. マイルストーン設定
- Step 1-3: MVP（2週間）
- Step 4-5: フル機能版（2週間）
- Step 6-7: エンタープライズ版（2週間）

### 4. テストとドキュメント
各ステップで以下を実施：
- [ ] 単体テスト
- [ ] E2Eテスト（Playwright推奨）
- [ ] API仕様書更新
- [ ] README更新

---

## リスクと対策

### リスク1: スケジュールの遅延
**対策**:
- 各ステップを独立させているため、優先度の低い機能をスキップ可能
- Step 2（UI改善）は後回しにできる

### リスク2: リアルタイム通信の複雑さ
**対策**:
- Step 1でポーリングを完成させて動作を保証
- Step 7は最後なので、必要に応じて見送り可能

### リスク3: 認証の複雑さ
**対策**:
- Step 3で簡易ログインを先に実装
- Step 6で本格認証に移行
- 既存のライブラリ（Next-Auth）を活用

---

## 次のアクション

Step 1から開始する場合、以下の準備を推奨します：

1. **環境構築**
   ```bash
   npx create-next-app@latest estimation-app
   cd estimation-app
   npm install prisma @prisma/client
   npx prisma init
   ```

2. **データベース準備**
   - PostgreSQLの準備（Supabase/Vercel Postgres推奨）
   - 接続文字列の設定

3. **最初のタスク**
   - Prisma スキーマ作成
   - 部屋作成APIの実装
   - シンプルなフォーム作成

開発を始める準備ができましたら、各ステップの詳細な実装ガイドを提供できます！
