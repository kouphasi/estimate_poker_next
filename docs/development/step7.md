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

### 2025-11-17

#### データベース実装
- ✅ Prismaスキーマに`Project`モデルを追加
  - id, name, description, ownerId, createdAt, updatedAt
  - User, Task とのリレーション設定
- ✅ Prismaスキーマに`Task`モデルを追加
  - id, name, description, projectId, finalEstimate, createdAt, updatedAt
  - Project, EstimationSession とのリレーション設定
- ✅ `EstimationSession`モデルに`taskId`フィールドを追加
  - タスクに紐付かない一時セッションの場合はnull
- ✅ マイグレーションファイルを作成: `20251117000000_add_project_and_task_models`
- ✅ Prismaクライアントを再生成

#### API実装
- ✅ プロジェクトAPI (`/api/projects`)
  - GET: プロジェクト一覧取得（統計情報付き）
  - POST: プロジェクト作成
- ✅ 個別プロジェクトAPI (`/api/projects/[projectId]`)
  - GET: プロジェクト詳細取得（タスク一覧、統計情報付き）
  - PATCH: プロジェクト更新
  - DELETE: プロジェクト削除
- ✅ プロジェクト配下のタスクAPI (`/api/projects/[projectId]/tasks`)
  - GET: タスク一覧取得
  - POST: タスク作成
- 認証: NextAuth getServerSession を使用してユーザー認証を確認
- 権限チェック: プロジェクトオーナーのみ操作可能

#### UI実装
- ✅ プロジェクト一覧ページ (`/projects`)
  - グリッドレイアウトでプロジェクトカードを表示
  - 各プロジェクトの統計情報表示（タスク数、完了タスク、進捗率、合計工数）
  - プログレスバーで進捗を視覚化
  - 新規プロジェクト作成ボタン
  - プロジェクト削除機能
- ✅ 新規プロジェクト作成ページ (`/projects/new`)
  - プロジェクト名、説明の入力フォーム
  - バリデーション機能
  - 作成後、プロジェクト詳細ページへ遷移
- ✅ プロジェクト詳細ページ (`/projects/[projectId]`)
  - プロジェクト情報の表示と編集機能
  - 統計情報カード（総タスク数、完了タスク、進捗率、合計工数）
  - プログレスバーで進捗を視覚化
  - タスク一覧表示
  - 新規タスク作成ボタン
  - パンくずリスト実装
- ✅ タスク作成ページ (`/projects/[projectId]/tasks/new`)
  - タスク名、説明の入力フォーム
  - 作成後、プロジェクト詳細ページへ遷移
  - パンくずリスト実装

#### ナビゲーション改善
- ✅ マイページにプロジェクトへのリンクを追加
- ✅ 各ページにパンくずリストを実装（プロジェクト > タスク）
- ✅ middlewareを更新してプロジェクトページを認証保護
  - `/projects/:path*` を保護されたパスに追加

#### 統計機能
- ✅ プロジェクト全体の工数合計を計算・表示
- ✅ タスク完了率を計算・表示
- ✅ プログレスバー表示（完了率を視覚化）
- ✅ 各プロジェクトカードに統計情報を表示

#### 完了条件チェック
- ✅ プロジェクト作成ができる
- ✅ プロジェクト配下にタスクを追加できる
- ✅ プロジェクトの統計が表示される
- ✅ 階層構造が正しく動作する（プロジェクト > タスク > セッション）

#### 備考
- プロジェクト機能は認証ユーザーのみ利用可能
- ゲストユーザーは従来通り、一時的な見積もりセッションのみ作成可能
- タスクと見積もりセッションの連携は既存の機能を活用
- NextAuthを使用した認証により、セキュアなプロジェクト管理を実現
