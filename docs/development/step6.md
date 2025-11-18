## ステップ6: セッションへの名前付け機能

### 目標
EstimationSessionに名前を付けて管理しやすくする

### 実装する機能
- [ ] セッション作成時に名前を入力
- [ ] セッション名の表示
- [ ] セッション名の編集機能
- [ ] マイページでのセッション名表示

### データベーススキーマ追加（Step 6）

```prisma
model EstimationSession {
  id            String         @id @default(cuid())
  name          String?        // セッション名（例: "ログイン機能の工数見積もり"）
  shareToken    String         @unique
  ownerToken    String         @unique
  ownerId       String
  owner         User           @relation(fields: [ownerId], references: [id])
  isRevealed    Boolean        @default(false)
  status        SessionStatus  @default(ACTIVE)
  finalEstimate Float?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  estimates     Estimate[]
}
```

### API設計追加（Step 6）

```typescript
// POST /api/sessions
// セッション作成（名前を追加）
{
  "ownerId": "clxxx...",
  "name": "ログイン機能の工数見積もり"
}
→ Response: {
  "sessionId": "clxxx...",
  "shareToken": "abc123xyz",
  "shareUrl": "https://app.com/estimate/abc123xyz",
  "name": "ログイン機能の工数見積もり"
}

// PATCH /api/sessions/[shareToken]/name
// セッション名の更新（オーナーのみ）
{
  "ownerToken": "owner123...",
  "name": "ログイン機能の工数見積もり（修正版）"
}
```

### ファイル構成追加（Step 6）

```
app/
├── sessions/
│   └── new/
│       └── page.tsx              # セッション作成（名前入力フォーム追加）
├── estimate/
│   └── [shareToken]/
│       └── page.tsx              # セッション名表示・編集機能追加
└── api/
    └── sessions/
        └── [shareToken]/
            └── name/
                └── route.ts      # PATCH: セッション名更新
```

### 実装タスク（Step 6）

#### 6-1. データベース（1時間）
- [ ] EstimationSession に name カラム追加
- [ ] マイグレーション実行
- [ ] 既存データの対応（null許容）

#### 6-2. セッション名API（2時間）
- [ ] セッション作成APIに名前パラメータ追加
- [ ] セッション名更新API実装
- [ ] オーナー権限チェック

#### 6-3. UI実装（4時間）
- [ ] セッション作成フォームに名前入力欄追加
- [ ] セッション画面にタイトル表示
- [ ] セッション名編集UI（オーナーのみ）
- [ ] マイページでのセッション名表示

#### 6-4. バリデーション（1時間）
- [ ] 名前の最大文字数制限（100文字）
- [ ] 名前の任意入力対応（未入力時のデフォルト表示）

**合計見積もり: 8時間（約1日）**

---

## 完了条件
### Step 6
- [ ] セッション作成時に名前を入力できる
- [ ] セッション名が表示される
- [ ] セッション名を編集できる
- [ ] マイページでセッション名が表示される

---

## 開発ログ

### 2025-11-17: セッション名前付け機能の実装

#### 実装内容
1. **データベーススキーマの変更**
   - `EstimationSession` モデルに `name` フィールドを追加（String型、任意）
   - マイグレーションファイルを作成: `20251117000000_add_session_name`

2. **API の変更**
   - `POST /api/sessions`: リクエストボディに `name` パラメータを追加
   - `SessionCreateData` インターフェースに `name?: string` を追加
   - セッション作成時に名前を保存できるように修正

3. **UI の変更**
   - **セッション作成画面** (`/app/sessions/new/page.tsx`)
     - 自動作成からフォーム入力に変更
     - セッション名の入力フィールドを追加（任意）
     - プレースホルダー: "例: ユーザー認証機能の見積もり"

   - **見積もり画面** (`/app/estimate/[shareToken]/page.tsx`)
     - `Session` インターフェースに `name?: string` を追加
     - ヘッダー部分にセッション名を表示（名前がある場合のみ）

#### 変更ファイル
- `prisma/schema.prisma`
- `prisma/migrations/20251117000000_add_session_name/migration.sql`
- `app/api/sessions/route.ts`
- `app/sessions/new/page.tsx`
- `app/estimate/[shareToken]/page.tsx`

#### 備考
- セッション名は任意項目として実装
- 既存のセッションには影響なし（name フィールドは NULL 許可）
- 要件（requirements.md）の「部屋名入力（任意）」に対応
