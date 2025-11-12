## ステップ4: 本格的な認証機能

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

### データベーススキーマ変更（Step 4）

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

### ファイル構成追加（Step 4）

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

### 実装タスク（Step 4）

#### 4-1. 認証ライブラリセットアップ（3時間）
- [ ] Next-Auth インストール
- [ ] 環境変数設定
- [ ] データベーススキーマ更新
- [ ] マイグレーション

#### 4-2. 認証API（4時間）
- [ ] ユーザー登録API
- [ ] ログインAPI
- [ ] ログアウト処理
- [ ] セッション管理
- [ ] パスワードハッシュ化

#### 4-3. 認証UI（5時間）
- [ ] ログインフォーム
- [ ] 登録フォーム
- [ ] パスワードリセットフォーム
- [ ] プロフィール編集画面
- [ ] 認証ガード実装

#### 4-4. データ移行（2時間）
- [ ] ゲストユーザーのデータ保持
- [ ] 認証ユーザーへの紐付け（オプション）
- [ ] 既存データの整合性確認

#### 4-5. セキュリティ対策（2時間）
- [ ] CSRF対策
- [ ] XSS対策
- [ ] レート制限
- [ ] パスワードポリシー
---
## 完了条件
### Step 4
- [ ] メールアドレスで登録できる
- [ ] ログイン/ログアウトが動作
- [ ] 認証が必要な画面で保護される
- [ ] パスワードリセットができる
---

## 開発ログ

### 2025-11-10: 基本的なログイン機能の実装

#### 1. パッケージのインストール
- next-auth@latest
- bcryptjs と @types/bcryptjs
- @next-auth/prisma-adapter

#### 2. Prismaスキーマの更新
- Userモデルに以下のフィールドを追加:
  - email (String?, unique)
  - passwordHash (String?)
  - updatedAt (DateTime)
- Next-Auth用のモデルを追加:
  - Account (OAuth用アカウント情報)
  - Session (セッション管理)
  - VerificationToken (メール認証トークン)

#### 3. データベースマイグレーション
- マイグレーションファイルを作成: `prisma/migrations/20251110000000_add_next_auth_models/migration.sql`
- スキーマ変更:
  - usersテーブルにemail、password_hash、updated_atカラムを追加
  - accounts、sessions、verification_tokensテーブルを作成

#### 4. 環境変数の設定
- .env.exampleファイルを作成
- NEXTAUTH_URL と NEXTAUTH_SECRET を定義

#### 5. Next-Auth設定
- lib/auth/auth-options.ts: Next-Authの設定ファイルを作成
  - CredentialsProviderを使用したメール/パスワード認証
  - bcryptによるパスワード検証
  - JWT戦略でセッション管理
- app/api/auth/[...nextauth]/route.ts: Next-Auth APIルートを作成
- types/next-auth.d.ts: TypeScript型定義を拡張

#### 6. 認証API
- app/api/auth/register/route.ts: ユーザー登録APIを作成
  - メールアドレスとパスワードのバリデーション
  - bcryptによるパスワードハッシュ化
  - 重複メールアドレスのチェック

#### 7. UIコンポーネント
- app/components/auth/LoginForm.tsx: ログインフォーム
- app/components/auth/RegisterForm.tsx: 登録フォーム
- app/login/page.tsx: ログインページ
- app/register/page.tsx: 登録ページ

#### 8. 認証ガードの実装
- app/components/Providers.tsx: SessionProviderを追加
- middleware.ts: 認証が必要なページ(/mypage/*など)を保護
- lib/auth/auth-helpers.ts: 認証ヘルパー関数を作成

#### 完了した機能
- [x] ユーザー登録
- [x] ログイン/ログアウト
- [x] セッション管理
- [x] 認証ガード
- [ ] パスワードリセット (未実装)
- [ ] プロフィール編集 (未実装)

#### 技術的な決定事項
- 認証ライブラリ: Next-Auth v5 (Auth.js)
- パスワードハッシュ化: bcryptjs (ソルトラウンド: 10)
- セッション戦略: JWT (データベースセッションではなくトークンベース)
- 認証プロバイダー: Credentials (メール/パスワード)

#### 次のステップ
1. パスワードリセット機能の実装
2. プロフィール編集機能の実装
3. 既存のゲストユーザーシステムとの統合
4. メール認証機能の追加 (オプション)
