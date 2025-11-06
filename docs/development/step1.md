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

### 2025-11-06: 基本的な部屋機能とポーリングの実装

#### 完了した作業

1. **Prismaスキーマの更新**
   - EstimationSessionモデルを追加（id, shareToken, isRevealed, status, finalEstimate, createdAt）
   - Estimateモデルを追加（id, sessionId, nickname, value, createdAt, updatedAt）
   - SessionStatus enumを追加（ACTIVE, FINALIZED）
   - マイグレーションファイルを作成（20251106143400_add_estimation_session_models）

2. **API実装**
   - ✅ POST /api/sessions - 部屋作成API
   - ✅ GET /api/sessions/[shareToken] - セッション情報取得API（ポーリング用）
   - ✅ POST /api/sessions/[shareToken]/estimates - 見積もり投稿API
   - ✅ PATCH /api/sessions/[shareToken]/reveal - 公開/非公開切り替えAPI
   - ✅ POST /api/sessions/[shareToken]/finalize - 工数確定API

3. **ユーティリティ実装**
   - app/lib/prisma.ts - Prismaクライアントのセットアップ
   - app/lib/utils.ts - 共有トークン生成関数

4. **UIコンポーネント実装**
   - ✅ PokerCard.tsx - カードコンポーネント
   - ✅ CardSelector.tsx - カード選択UI（1h, 2h, 4h, 8h, 1d, 1.5d, 2d, 3d + 自由記述）
   - ✅ ParticipantList.tsx - 参加者一覧表示
   - ✅ EstimateResult.tsx - 結果表示（平均値・中央値・個別見積もり）

5. **ページ実装**
   - ✅ app/page.tsx - トップページ（部屋作成フォーム）
   - ✅ app/estimate/[shareToken]/page.tsx - 見積もり画面
     - ニックネーム入力フォーム
     - カード選択UI
     - 参加者一覧
     - 見積もり結果表示
     - 公開/非公開トグルボタン
     - 工数確定フォーム
     - 共有URLコピー機能

6. **ポーリング機能**
   - ✅ useEffectで2秒間隔のポーリング実装
   - ✅ セッション情報と見積もりのリアルタイム更新
   - ✅ 非公開モード時の見積もり値の隠蔽（-1で「提出済み」を表示）

7. **設定ファイル**
   - tsconfig.jsonのパスエイリアス修正（@/* -> ./*）
   - app/layout.tsx作成
   - app/globals.css作成（Tailwind CSS設定）

#### 技術的な実装詳細

- **共有トークン生成**: 英数字12文字のランダム文字列
- **見積もり状態管理**:
  - 0 = 未提出
  - -1 = 提出済み（非公開モード時）
  - 0以上の数値 = 実際の見積もり値（公開モード時）
- **見積もり投稿**: upsertで作成・更新を同時処理
- **ポーリング間隔**: 2秒（step1の要件通り）

#### 既知の問題

- Prismaエンジンのダウンロードが403エラーで失敗
  - ローカル環境の制限によるもの
  - CI/CD環境では正常に動作する見込み

#### 次のステップ

- [ ] データベースマイグレーションの実行（CI環境）
- [ ] 複数ブラウザでの動作確認
- [ ] エッジケースのテスト
- [ ] UI/UXの改善（Step 2へ）
