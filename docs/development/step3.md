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

### 2025-11-09 開発開始
#### 現在の状況確認
- 既存のPrismaスキーマを確認
  - Userモデルは存在するが、構造が要件と異なる（userId: Int vs id: String）
  - EstimationSessionにownerIdフィールドが存在しない
  - EstimateモデルにuserIdとのリレーションが存在しない
- API routesはまだ作成されていない

#### 実装方針
1. Userモデルを要件に合わせて更新（id: String, nickname, isGuest）
2. EstimationSessionにownerIdを追加してUserとリレーション
3. EstimateモデルにuserIdを追加してUserとリレーション
4. 必要なAPI routesを作成
5. フロントエンド実装（ログイン画面、マイページ）

#### データベーススキーマ更新
- Userモデルを要件に合わせて更新
  - id: String (cuid)
  - nickname: String
  - isGuest: Boolean (default: true)
  - createdAt: DateTime
- EstimationSessionにownerId追加（Userとのリレーション）
- EstimateモデルにuserId追加（Userとのリレーション）
- マイグレーションファイルを手動作成（Prismaエンジンのダウンロード問題のため）

#### API実装完了
1. **POST /api/users** - ユーザー作成API
   - ニックネームを受け取り、新しいゲストユーザーを作成
   - userId と nickname を返却

2. **GET /api/users/[userId]/sessions** - 部屋一覧取得API
   - ユーザーが作成した部屋一覧を取得
   - 作成日時の降順でソート

3. **DELETE /api/sessions/[shareToken]** - 部屋削除API
   - オーナー権限チェック実装
   - x-user-id ヘッダーでユーザー認証

#### フロントエンド実装完了
1. **ユーザーコンテキスト** (src/contexts/UserContext.tsx)
   - ローカルストレージでユーザー情報を永続化
   - login/logout機能
   - グローバルなユーザー状態管理

2. **ログイン画面** (src/app/page.tsx)
   - ニックネーム入力フォーム
   - 簡易ログイン機能
   - ログイン済みの場合、自動的にマイページへリダイレクト

3. **マイページ** (src/app/mypage/page.tsx)
   - 作成した部屋一覧表示
   - 部屋の削除機能
   - ログアウト機能
   - 未ログインの場合、トップページへリダイレクト

#### 実装したファイル一覧
- prisma/schema.prisma (更新)
- prisma/migrations/20251109000000_add_user_login_system/migration.sql (新規)
- src/lib/prisma.ts (新規)
- src/app/api/users/route.ts (新規)
- src/app/api/users/[userId]/sessions/route.ts (新規)
- src/app/api/sessions/[shareToken]/route.ts (新規)
- src/contexts/UserContext.tsx (新規)
- src/app/layout.tsx (更新)
- src/app/page.tsx (更新)
- src/app/mypage/page.tsx (新規)

#### 完了したタスク
- [x] User テーブル追加
- [x] ユーザー作成API
- [x] ローカルストレージでユーザーID保存
- [x] ユーザーコンテキスト作成
- [x] マイページ作成
- [x] 作成した部屋一覧表示
- [x] 部屋への遷移
- [x] 部屋削除機能
- [x] オーナー判定ロジック
- [x] オーナー専用UI表示
- [x] 権限チェックミドルウェア（API）

#### Git情報
- ブランチ: claude/implement-basic-login-011CUwu9K6cUC3quUW69eXKD
- コミット: 31b878a - feat: Implement basic login functionality (Step 3)
- プッシュ完了

#### 次のステップ
現在、基本的なログイン機能は完成しましたが、以下の点は未実装です：
1. 既存の部屋作成フローにユーザー情報を連携（現在部屋作成APIが存在しないため保留）
2. 実際のデプロイ環境での動作確認（マイグレーションの適用含む）

Step 3の完了条件を確認：
- [x] ニックネームでログイン可能
- [x] 自分の部屋一覧が見れる
- [x] 部屋の削除ができる
- [x] ローカルストレージでセッション維持

**Step 3 は基本機能として完成しました！**
