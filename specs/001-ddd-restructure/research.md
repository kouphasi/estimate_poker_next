# Research: DDD Layered Architecture Migration

**Feature**: コードベースの保守性向上とアーキテクチャ明確化
**Date**: 2025-12-30
**Phase**: 0 (Outline & Research)

## Research Areas

### 1. Next.js App Router + DDD Integration Patterns

**Decision**: src/ディレクトリにビジネスロジック層を配置し、app/ディレクトリをプレゼンテーション層として維持

**Rationale**:
- Next.js 13+は`src/`と`app/`の共存をサポート
- `app/`ディレクトリはNext.jsのファイルベースルーティングに必須
- ビジネスロジック（domain, application, infrastructure）を`src/`に配置することで、フレームワークの制約とDDDの原則を両立
- TypeScriptのパスエイリアス（`@/domain`, `@/application`, etc.）により、import文が明確になる

**Alternatives Considered**:
- ❌ すべてを`app/`配下に配置: Next.jsの規約に従うが、ビジネスロジックとルーティングが混在し、レイヤー分離が不明確
- ❌ 完全に別プロジェクトに分離（モノレポ）: 過度な複雑さ。現状の規模では不要

**References**:
- Next.js公式: `src/`ディレクトリのサポート
- DDD実践ガイド: レイヤードアーキテクチャの標準パターン

---

### 2. Repository Pattern with Prisma

**Decision**: すべてのPrisma呼び出しをリポジトリパターンでラップし、ドメイン層にリポジトリインターフェースを定義

**Rationale**:
- 依存性逆転の原則（DIP）を実現: ドメイン層がインフラストラクチャに依存しない
- テスタビリティ向上: リポジトリインターフェースをモックすることで、ドメインロジックを独立してテスト可能
- 柔軟性: 将来的にORMを変更する場合、リポジトリ実装のみを変更すれば良い

**Implementation Pattern**:
```typescript
// src/domain/user/UserRepository.ts (インターフェース)
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}

// src/infrastructure/database/repositories/PrismaUserRepository.ts (実装)
export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const data = await this.prisma.user.findUnique({ where: { id } });
    if (!data) return null;
    return new User(data); // ドメインエンティティに変換
  }
  // ...
}
```

**Alternatives Considered**:
- ❌ 直接Prisma呼び出し: シンプルだが、ドメイン層がPrismaに依存。テストとORMの交換が困難
- ❌ 汎用リポジトリパターン（Generic Repository）: 過度な抽象化。エンティティごとに必要なメソッドが異なるため、不要

**References**:
- Martin Fowler: Repository Pattern
- Domain-Driven Design (Eric Evans): Aggregate and Repository

---

### 3. Use Case / Application Service Layer

**Decision**: application層にユースケースクラスを配置し、ドメインサービスとリポジトリを組み合わせたビジネスフローを定義

**Rationale**:
- 単一責任の原則（SRP）: APIルート（コントローラー）はHTTPリクエスト/レスポンスの変換のみに集中
- 再利用性: 同じビジネスフローをWeb API、CLI、バッチ処理など複数のエントリーポイントから呼び出せる
- トランザクション境界の明確化: ユースケース単位でトランザクションを管理

**Implementation Pattern**:
```typescript
// src/application/auth/LoginUseCase.ts
export class LoginUseCase {
  constructor(
    private userRepo: UserRepository,
    private authService: AuthService
  ) {}

  async execute(email: string, password: string): Promise<LoginResult> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new AuthenticationError("Invalid credentials");

    const isValid = await this.authService.verifyPassword(password, user.passwordHash);
    if (!isValid) throw new AuthenticationError("Invalid credentials");

    return { userId: user.id, token: this.authService.generateToken(user) };
  }
}

// app/api/auth/login/route.ts (APIルート - 薄いコントローラー)
export async function POST(request: Request) {
  const { email, password } = await request.json();

  const loginUseCase = new LoginUseCase(userRepo, authService);
  const result = await loginUseCase.execute(email, password);

  return Response.json(result);
}
```

**Alternatives Considered**:
- ❌ APIルートに直接ロジック記述: シンプルだが、再利用不可。テストが困難
- ❌ Fat Domain Model（リッチドメインモデル）: ドメインエンティティにすべてのロジックを配置。Prismaとの統合が複雑

**References**:
- Clean Architecture (Robert C. Martin): Use Case Layer
- Hexagonal Architecture: Application Service

---

### 4. Entity Mapping Strategy (Prisma Model ↔ Domain Entity)

**Decision**: Prismaモデルとドメインエンティティを分離し、リポジトリ層でマッピング

**Rationale**:
- ドメインエンティティにビジネスルールをカプセル化
- Prismaモデルはデータベーススキーマに依存するが、ドメインエンティティはビジネス概念に集中
- 値オブジェクト（Value Object）の導入が可能

**Implementation Pattern**:
```typescript
// src/domain/user/User.ts (ドメインエンティティ)
export class User {
  constructor(
    public readonly id: string,
    public readonly email: Email, // 値オブジェクト
    public readonly nickname: string,
    public readonly isGuest: boolean
  ) {}

  // ビジネスルール
  canManageProjects(): boolean {
    return !this.isGuest;
  }
}

// Prismaモデルからドメインエンティティへの変換はリポジトリ内で実施
```

**Alternatives Considered**:
- ❌ Prismaモデルをそのままドメインエンティティとして使用: シンプルだが、ビジネスルールの配置場所が不明確
- ❌ DTO（Data Transfer Object）の多用: レイヤー間のマッピングが増えすぎて煩雑

**References**:
- Domain-Driven Design: Entity and Value Object
- Patterns of Enterprise Application Architecture: Data Mapper

---

### 5. TypeScript Path Aliases Configuration

**Decision**: tsconfig.jsonにパスエイリアスを追加し、レイヤー境界を明確にする

**Rationale**:
- import文が読みやすくなる（`../../../`の代わりに`@/domain/user/User`）
- レイヤー間の依存関係が明確になる
- IDEの補完機能が向上

**Configuration**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/domain/*": ["src/domain/*"],
      "@/application/*": ["src/application/*"],
      "@/infrastructure/*": ["src/infrastructure/*"],
      "@/*": ["*"]
    }
  }
}
```

**Alternatives Considered**:
- ❌ 相対パス（`../../../`）のみ使用: ファイル移動時にimport文の修正が大変
- ❌ すべてを`@/`配下に配置: レイヤー境界が不明確

**References**:
- TypeScript公式: Path Mapping
- Next.js公式: Absolute Imports and Module Path Aliases

---

### 6. Migration Strategy & Risk Mitigation

**Decision**: 機能単位（認証→セッション→プロジェクト管理）で段階的に移行。各機能の移行は混在期間を設けず一気に完了

**Rationale**:
- リスク分散: 一つの機能で問題が発生しても、他の機能は影響を受けない
- 学習曲線: 最初の機能（認証）で移行パターンを確立し、後続の機能で効率化
- ロールバック: 機能単位でGitブランチごと切り戻しが可能

**Migration Order & Justification**:
1. **認証（Auth）**: 比較的独立したモジュール。他の機能への依存が少ない。リポジトリパターンの実装パターンを確立できる
2. **セッション管理（Session/Estimate）**: 認証に依存。メインビジネスロジック。リアルタイム更新など複雑なロジックを含む
3. **プロジェクト管理（Project）**: セッションに依存。認証とセッションの移行で確立したパターンを適用

**Risk Mitigation**:
- **リスク**: import文の一括更新時にミスが発生する可能性
  - **対策**: TypeScriptの型チェックで早期発見。各機能の移行後に手動テスト実施
- **リスク**: 複雑なPrismaクエリ（JOIN、トランザクション）のリポジトリ化が困難
  - **対策**: リポジトリメソッドにそのまま複雑なクエリをカプセル化。ドメイン層のインターフェースはシンプルに保つ
- **リスク**: 移行後のテスト不足で潜在的なバグが残る
  - **対策**: 移行後にクリティカルパス（ログイン、セッション作成、見積もり投稿）のテストを追加（FR-016）

**Alternatives Considered**:
- ❌ ビッグバン移行（一度にすべて変更）: リスクが高い。問題発生時の影響範囲が広い
- ❌ レイヤー単位での移行: 各レイヤーが中途半端な状態で混在し、開発者の混乱を招く

**References**:
- Refactoring (Martin Fowler): Incremental Migration
- Working Effectively with Legacy Code (Michael Feathers): Seam-Based Refactoring

---

## Summary

すべての技術的な不明点が解決され、以下の明確な方針が確立されました：

1. **アーキテクチャ**: src/ディレクトリにDDDレイヤード構造、app/ディレクトリをプレゼンテーション層として維持
2. **リポジトリパターン**: Prismaをラップし、ドメイン層にインターフェース定義
3. **ユースケース層**: application層にビジネスフローを集約し、APIルートはシンプルに保つ
4. **エンティティマッピング**: Prismaモデルとドメインエンティティを分離
5. **TypeScriptパスエイリアス**: レイヤー境界を明確にする設定
6. **移行戦略**: 機能単位の段階的移行（認証→セッション→プロジェクト）

Phase 1（Design & Contracts）に進む準備が整いました。
