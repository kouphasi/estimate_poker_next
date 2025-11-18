## ステップ7: プロジェクト管理

### 目標
プロジェクトを作成し、その配下に複数のセッションを管理

### 実装する機能
- [ ] プロジェクト作成機能
- [ ] プロジェクト一覧表示
- [ ] プロジェクト詳細画面
- [ ] プロジェクト配下のセッション管理
- [ ] プロジェクト統計情報

### データベーススキーマ追加（Step 7）

```prisma
model Project {
  id            String              @id @default(cuid())
  name          String
  description   String?
  ownerId       String
  owner         User                @relation(fields: [ownerId], references: [id])
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt

  sessions      EstimationSession[] // プロジェクト配下の見積もりセッション
}

model EstimationSession {
  // 既存のフィールド...
  projectId     String?
  project       Project?            @relation(fields: [projectId], references: [id])
}
```

### ファイル構成追加（Step 7）

```
app/
├── projects/
│   ├── page.tsx                      # プロジェクト一覧
│   ├── new/
│   │   └── page.tsx                  # プロジェクト作成
│   └── [projectId]/
│       ├── page.tsx                  # プロジェクト詳細（セッション一覧）
│       └── sessions/
│           └── new/
│               └── page.tsx          # セッション作成
└── api/
    └── projects/
        ├── route.ts                  # GET: 一覧, POST: 作成
        ├── [projectId]/
        │   ├── route.ts              # GET: 詳細, PATCH: 更新, DELETE: 削除
        │   └── sessions/
        │       └── route.ts          # GET: セッション一覧, POST: セッション作成
```

### API設計追加（Step 7）

```typescript
// POST /api/projects
// プロジェクト作成
{
  "name": "ECサイトリニューアル",
  "description": "ECサイトの全面リニューアルプロジェクト",
  "ownerId": "clxxx..."
}
→ Response: {
  "projectId": "clxxx...",
  "name": "ECサイトリニューアル"
}

// GET /api/projects/[projectId]
// プロジェクト詳細とセッション一覧
→ Response: {
  "project": {
    "id": "clxxx...",
    "name": "ECサイトリニューアル",
    "description": "...",
    "createdAt": "..."
  },
  "sessions": [
    {
      "id": "clxxx...",
      "name": "ログイン機能の工数見積もり",
      "status": "FINALIZED",
      "finalEstimate": 2.0,
      "createdAt": "..."
    }
  ]
}

// POST /api/projects/[projectId]/sessions
// プロジェクト配下にセッション作成
{
  "name": "カート機能の工数見積もり",
  "ownerId": "clxxx..."
}
```

### 実装タスク（Step 7）

#### 7-1. データベース（1時間）
- [ ] Project テーブル追加
- [ ] EstimationSession に projectId カラム追加
- [ ] リレーション設定
- [ ] マイグレーション

#### 7-2. プロジェクトAPI（3時間）
- [ ] プロジェクト作成API
- [ ] プロジェクト一覧取得API
- [ ] プロジェクト詳細取得API（セッション一覧含む）
- [ ] プロジェクト更新API
- [ ] プロジェクト削除API

#### 7-3. プロジェクト配下のセッションAPI（2時間）
- [ ] プロジェクト配下のセッション作成API
- [ ] プロジェクト配下のセッション一覧取得API

#### 7-4. プロジェクトUI（5時間）
- [ ] プロジェクト一覧画面
- [ ] プロジェクト作成フォーム
- [ ] プロジェクト詳細画面（セッション一覧表示）
- [ ] プロジェクト編集フォーム
- [ ] プロジェクトからセッション作成

#### 7-5. 統計情報（3時間）
- [ ] プロジェクト全体の工数合計
- [ ] セッション完了率
- [ ] プログレスバー表示
- [ ] ダッシュボード機能

#### 7-6. ナビゲーション改善（2時間）
- [ ] パンくずリスト
- [ ] グローバルナビゲーション
- [ ] サイドバー追加

**合計見積もり: 16時間（約2日）**

---

## 完了条件
### Step 7
- [ ] プロジェクト作成ができる
- [ ] プロジェクト配下にセッションを追加できる
- [ ] プロジェクトの統計が表示される
- [ ] 階層構造が正しく動作する

---

## 開発ログ

### 2025-11-18 - Step 7実装開始

#### データベーススキーマ更新
- ✅ Projectモデルを追加
  - id, name, description, ownerId, createdAt, updatedAt
  - User関係: User.projects
- ✅ EstimationSessionにprojectIdカラムとproject relationを追加
- ✅ Prisma Clientの生成完了

#### APIルート実装
- ✅ `/api/projects` - GET (一覧取得) & POST (作成)
- ✅ `/api/projects/[projectId]` - GET (詳細), PATCH (更新), DELETE (削除)
- ✅ `/api/projects/[projectId]/sessions` - GET (セッション一覧), POST (セッション作成)
- 全てのAPIで認証チェックとオーナー検証を実装
- Next.js 15のasync paramsに対応

#### UI実装
- ✅ `/projects` - プロジェクト一覧ページ
  - セッション数の表示
  - 空状態の処理
  - マイページへの戻るリンク
- ✅ `/projects/new` - プロジェクト作成フォーム
  - バリデーション実装
  - 文字数カウンター
  - エラーハンドリング
- ✅ `/projects/[projectId]` - プロジェクト詳細ページ
  - プロジェクト情報の表示と編集
  - プロジェクト統計情報（総セッション数、確定済み数、総工数、完了率）
  - セッション一覧表示
  - セッション作成フォーム
  - プロジェクト削除機能（確認モーダル付き）
  - パンくずリスト

#### 統計情報機能
- ✅ 総セッション数
- ✅ 確定済みセッション数
- ✅ 総工数（確定済みセッションの合計）
- ✅ 完了率（確定済み/総数）
- ✅ プログレスバー表示

#### ナビゲーション改善
- ✅ パンくずリスト実装（プロジェクト詳細ページ）
- ✅ マイページにプロジェクト管理セクション追加（認証ユーザーのみ表示）
- ✅ middlewareでプロジェクトページを保護（/projects/*）

#### 実装の特徴
- 認証ユーザーのみがプロジェクトを作成・管理可能
- プロジェクトに紐付いたセッションは通常のセッションと同様に動作
- プロジェクト削除時、関連セッションもカスケード削除（Prismaスキーマで設定）
- レスポンシブデザイン対応
- エラーハンドリングとローディング状態の適切な処理

#### 残課題
- [ ] マイグレーションの実行（環境変数設定後）
- [ ] セッション一覧で「未割り当て」カテゴリの表示（プロジェクトに紐付かないセッション）
- [ ] プロジェクト統計のダッシュボード機能拡張
- [ ] セッション作成時にプロジェクトを選択できる機能
