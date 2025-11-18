## ステップ7: プロジェクト管理

### 目標
プロジェクトを作成し、その配下にタスクを管理

### 実装する機能
- [ ] プロジェクト作成機能
- [ ] プロジェクト一覧表示
- [ ] プロジェクト詳細画面
- [ ] プロジェクト配下のタスク管理
- [ ] プロジェクト統計情報

### データベーススキーマ追加（Step 7）

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

### ファイル構成追加（Step 7）

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

### 実装タスク（Step 7）

#### 7-1. データベース（1時間）
- [ ] Project テーブル追加
- [ ] リレーション設定
- [ ] マイグレーション

#### 7-2. プロジェクトAPI（3時間）
- [ ] プロジェクト作成API
- [ ] プロジェクト一覧取得API
- [ ] プロジェクト詳細取得API
- [ ] プロジェクト更新API
- [ ] プロジェクト削除API

#### 7-3. プロジェクトUI（5時間）
- [ ] プロジェクト一覧画面
- [ ] プロジェクト作成フォーム
- [ ] プロジェクト詳細画面
- [ ] プロジェクト編集フォーム

#### 7-4. 統計情報（3時間）
- [ ] プロジェクト全体の工数合計
- [ ] タスク完了率
- [ ] プログレスバー表示
- [ ] ダッシュボード機能

#### 7-5. ナビゲーション改善（2時間）
- [ ] パンくずリスト
- [ ] グローバルナビゲーション
- [ ] サイドバー追加

**合計見積もり: 14時間（約2日）**
---
## 完了条件
### Step 7
- [ ] プロジェクト作成ができる
- [ ] プロジェクト配下にタスクを追加できる
- [ ] プロジェクトの統計が表示される
- [ ] 階層構造が正しく動作する
---

## 開発ログ

### 2025-11-18

#### 実装完了項目

**7-1. データベース（完了）**
- ✅ Project モデル追加（id, name, description, ownerId, createdAt, updatedAt）
- ✅ Task モデル追加（id, name, description, projectId, finalEstimate, createdAt, updatedAt）
- ✅ EstimationSession に taskId フィールド追加（任意、タスクに紐付かない一時セッション対応）
- ✅ リレーション設定
  - User → Project (一対多)
  - Project → Task (一対多、カスケード削除)
  - Task → EstimationSession (一対多、カスケード削除)
- ✅ マイグレーションファイル作成 (`20251118000000_add_project_and_task_models`)
- ⚠️ 注: Prismaバイナリサーバーの一時的な障害により、手動でマイグレーションSQL作成

**7-2. プロジェクトAPI（完了）**
- ✅ `POST /api/projects` - プロジェクト作成
  - 認証ユーザーのみ可能
  - ゲストユーザーは403エラー
  - バリデーション: name必須
- ✅ `GET /api/projects` - プロジェクト一覧取得
  - 自分が作成したプロジェクトのみ表示
  - 統計情報含む（タスク数、完了タスク数、総工数）
- ✅ `GET /api/projects/[projectId]` - プロジェクト詳細取得
  - タスク一覧と各タスクのセッション情報を含む
  - 統計情報（タスク数、完了数、総工数、進捗率）
  - オーナー権限チェック
- ✅ `PATCH /api/projects/[projectId]` - プロジェクト更新
  - name, description 更新可能
  - オーナー権限チェック
- ✅ `DELETE /api/projects/[projectId]` - プロジェクト削除
  - カスケードでタスクも削除
  - オーナー権限チェック

**7-3. タスクAPI（完了）**
- ✅ `POST /api/projects/[projectId]/tasks` - タスク作成
  - プロジェクトオーナーのみ可能
  - バリデーション: name必須
- ✅ `GET /api/projects/[projectId]/tasks` - タスク一覧取得
  - プロジェクト配下のタスク全件取得
  - セッション情報含む
- ✅ `GET /api/tasks/[taskId]` - タスク詳細取得
  - プロジェクト情報、セッション一覧含む
  - オーナー権限チェック
- ✅ `PATCH /api/tasks/[taskId]` - タスク更新
  - name, description, finalEstimate 更新可能
  - オーナー権限チェック
- ✅ `DELETE /api/tasks/[taskId]` - タスク削除
  - カスケードでセッションも削除
  - オーナー権限チェック

**7-4. プロジェクトUI（完了）**
- ✅ プロジェクト一覧画面 (`/projects`)
  - カード形式でプロジェクト表示
  - 統計情報（タスク数、完了数、総工数、進捗率）
  - プログレスバー表示
  - プロジェクト削除機能
  - 空状態の適切な表示
- ✅ プロジェクト作成フォーム (`/projects/new`)
  - name, description 入力
  - バリデーション付き
  - パンくずリスト
- ✅ プロジェクト詳細画面 (`/projects/[projectId]`)
  - プロジェクト情報表示・編集機能
  - 統計ダッシュボード（4つの指標）
  - プログレスバー
  - タスク一覧表示
  - タスク削除機能
  - パンくずリスト
- ✅ タスク作成フォーム (`/projects/[projectId]/tasks/new`)
  - name, description 入力
  - バリデーション付き
  - パンくずリスト

**7-5. 統計情報（完了）**
- ✅ プロジェクト全体の工数合計
  - タスクのfinalEstimateの合計を計算
- ✅ タスク完了率
  - finalEstimateが設定されているタスクを完了とカウント
- ✅ プログレスバー表示
  - 進捗率を視覚的に表示
- ✅ ダッシュボード機能
  - プロジェクト詳細画面に4つの指標を表示
  - タスク数、完了タスク数、総工数、進捗率

**7-6. ナビゲーション改善（完了）**
- ✅ パンくずリスト
  - 各画面に適切なパンくずリスト実装
- ✅ ページ間ナビゲーション
  - マイページ → プロジェクト管理ボタン追加（認証ユーザーのみ）
  - プロジェクト一覧 → マイページに戻るリンク
  - 各詳細画面に戻るリンク

#### 実装の特記事項

**セキュリティ対応**
- すべてのAPIエンドポイントで認証チェック実装
- プロジェクト・タスクのオーナー権限チェック
- ゲストユーザーはプロジェクト作成不可

**データ整合性**
- カスケード削除設定
  - プロジェクト削除 → タスク削除 → セッション削除
- トランザクション処理は将来の改善ポイント

**UI/UX**
- レスポンシブデザイン対応
- ローディング状態の適切な表示
- エラーハンドリングとユーザーへのフィードバック
- 空状態の親切な表示

**将来の改善点**
- [ ] タスクに対する見積もりセッション作成機能
- [ ] プロジェクト・タスクの並び替え機能
- [ ] タスクの編集画面（現在はPATCH APIのみ実装）
- [ ] プロジェクトのアーカイブ機能
- [ ] プロジェクト・タスクの検索機能
- [ ] バルク操作（複数タスクの一括削除など）
