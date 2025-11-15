## ステップ4: 本格的な認証機能

### 目標
メールアドレスとパスワードでの認証を実装

### 実装する機能
- [x] ユーザー登録
- [x] ログイン/ログアウト
- [x] セッション管理
- [x] パスワードリセット
- [x] プロフィール編集

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
- [x] メールアドレスで登録できる
- [x] ログイン/ログアウトが動作
- [x] 認証が必要な画面で保護される
- [x] パスワードリセットができる
- [x] プロフィール編集ができる
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
1. ~~パスワードリセット機能の実装~~ (完了)
2. ~~プロフィール編集機能の実装~~ (完了)
3. 既存のゲストユーザーシステムとの統合
4. メール認証機能の追加 (オプション)

---

### 2025-11-15: パスワードリセット機能とプロフィール編集機能の実装

#### 1. パスワードリセット機能の実装

##### APIエンドポイントの作成
- app/api/auth/forgot-password/route.ts: パスワードリセットリクエストAPI
  - メールアドレスからリセットトークンを生成
  - VerificationTokenモデルを使用してトークンを保存
  - トークンの有効期限: 1時間
  - 開発環境ではリセットURLをコンソールとレスポンスに出力
  - 本番環境ではメール送信サービス統合が必要（TODO）

- app/api/auth/reset-password/route.ts: パスワードリセット実行API
  - トークンの検証（存在確認、有効期限チェック）
  - パスワードのバリデーション（8文字以上）
  - bcryptによるパスワードハッシュ化
  - 使用済みトークンの削除

##### UIコンポーネントの作成
- app/components/auth/ForgotPasswordForm.tsx: パスワードリセットリクエストフォーム
  - メールアドレス入力
  - 開発環境でのリセットURLの表示機能
  - 成功メッセージの表示

- app/components/auth/ResetPasswordForm.tsx: パスワードリセット実行フォーム
  - 新しいパスワードの入力
  - パスワード確認入力
  - バリデーション処理

##### ページの作成
- app/forgot-password/page.tsx: パスワードリセットリクエストページ
- app/reset-password/page.tsx: パスワードリセット実行ページ
  - トークンがない場合のエラー表示

##### 既存ページの更新
- app/login/page.tsx: ログインページの更新
  - 「パスワードを忘れた場合」リンクを追加
  - パスワードリセット成功時のメッセージ表示

#### 2. プロフィール編集機能の実装

##### APIエンドポイントの作成
- app/api/users/[userId]/route.ts: ユーザー情報の取得・更新API
  - GET: ユーザー情報の取得（認証済みユーザーのみ、自分の情報のみ）
  - PATCH: ユーザー情報の更新
    - ニックネームの変更
    - パスワードの変更（現在のパスワード確認必須）
    - セッションベースの認証チェック

##### ページの作成
- app/mypage/profile/page.tsx: プロフィール編集ページ
  - アカウント情報セクション
    - メールアドレス表示（変更不可）
    - ニックネーム編集
    - 登録日表示
  - パスワード変更セクション
    - 現在のパスワード入力
    - 新しいパスワード入力
    - パスワード確認入力
  - 成功・エラーメッセージの表示
  - セッション情報の自動更新

##### 既存ページの更新
- app/mypage/page.tsx: マイページの更新
  - 「プロフィール編集」ボタンを追加

#### 完了した機能（更新）
- [x] ユーザー登録
- [x] ログイン/ログアウト
- [x] セッション管理
- [x] 認証ガード
- [x] パスワードリセット
- [x] プロフィール編集

#### 技術的な実装詳細
- **トークン管理**: VerificationTokenモデルを使用
- **セキュリティ対策**:
  - パスワード変更時の現在のパスワード確認
  - トークンの有効期限管理（1時間）
  - 使用済みトークンの自動削除
  - 自分のプロフィールのみ編集可能
- **開発時の便利機能**:
  - パスワードリセットURLをコンソール出力
  - 開発環境でのみリセットURLをレスポンスに含める

#### 残タスク
- メール送信機能の統合（本番環境用）
- ゲストユーザーから認証ユーザーへの移行機能（オプション）
