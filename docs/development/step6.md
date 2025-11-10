## ステップ6: タスクとの紐付け

### 目標
タスクを作成し、そのタスクに対して部屋を作成できる

### 実装する機能
- [ ] タスク作成機能
- [ ] タスク一覧表示
- [ ] タスクに紐付いた部屋作成
- [ ] タスクへの工数記録
- [ ] タスク詳細画面

### データベーススキーマ追加（Step 6）

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

### ファイル構成追加（Step 6）

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

### 実装タスク（Step 6）

#### 6-1. データベース（1時間）
- [ ] Task テーブル追加
- [ ] リレーション設定
- [ ] マイグレーション

#### 6-2. タスクAPI（3時間）
- [ ] タスク作成API
- [ ] タスク一覧取得API
- [ ] タスク詳細取得API
- [ ] タスク更新API
- [ ] タスク削除API

#### 6-3. タスクUI（5時間）
- [ ] タスク一覧画面
- [ ] タスク作成フォーム
- [ ] タスク詳細画面
- [ ] タスク編集フォーム
- [ ] 部屋一覧（タスク配下）

#### 6-4. 紐付け処理（2時間）
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
---
## 完了条件
### Step 6
- [ ] タスク作成ができる
- [ ] タスクから部屋を作成できる
- [ ] 確定工数がタスクに反映される
- [ ] タスク一覧が表示される
---

## 開発ログ
