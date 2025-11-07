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
## 完了条件
### Step 3
- [ ] ニックネームでログイン可能
- [ ] 自分の部屋一覧が見れる
- [ ] 部屋の削除ができる
- [ ] ローカルストレージでセッション維持
---

## 開発ログ
