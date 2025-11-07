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
---
## 完了条件
### Step 6
- [ ] メールアドレスで登録できる
- [ ] ログイン/ログアウトが動作
- [ ] 認証が必要な画面で保護される
- [ ] パスワードリセットができる
---

## 開発ログ
