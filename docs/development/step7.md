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
