# アーキテクチャドキュメント

## 概要

このプロジェクトは、Domain-Driven Design (DDD) のレイヤードアーキテクチャを採用しています。
コードは責務に応じて4つの主要なレイヤーに分割され、依存関係は一方向に保たれています。

## ディレクトリ構造

```
src/
├── domain/              # ドメイン層（ビジネスロジックの中核）
│   ├── errors/          # ドメインエラー
│   ├── user/            # ユーザードメイン
│   ├── project/         # プロジェクトドメイン
│   └── session/         # セッションドメイン
├── application/         # アプリケーション層（ユースケース）
│   ├── auth/            # 認証ユースケース
│   ├── project/         # プロジェクト管理ユースケース
│   ├── session/         # セッション管理ユースケース
│   └── middleware/      # アプリケーションミドルウェア
├── infrastructure/      # インフラストラクチャ層（技術的実装）
│   ├── database/        # データベース関連
│   │   └── repositories/ # リポジトリ実装
│   └── auth/            # 認証インフラ
└── presentation/        # プレゼンテーション層（UI/API）
    └── (Next.jsのappディレクトリがこの役割を担う)
```

## レイヤーの責務と依存関係

### 依存関係の方向

```
Presentation → Application → Domain ← Infrastructure
```

- **Domain層**: 他のどのレイヤーにも依存しない（完全に独立）
- **Application層**: Domain層のみに依存
- **Infrastructure層**: Domain層とApplication層に依存（リポジトリインターフェースを実装）
- **Presentation層**: Application層とInfrastructure層に依存

### 1. Domain層 (`src/domain/`)

**責務**:
- ビジネスルールとドメインロジックの定義
- エンティティとValue Objectの実装
- リポジトリインターフェースの定義

**重要な原則**:
- 技術的な詳細（データベース、フレームワーク等）に依存しない
- 他のレイヤーからのインポートは一切禁止
- ビジネスルールのみに集中

**含まれるもの**:
- **Entities**: ビジネスの中核となるオブジェクト（User, Project, EstimationSession, Estimate）
- **Value Objects**: 不変の値オブジェクト（Email, ShareToken, OwnerToken）
- **Repository Interfaces**: データ永続化の抽象化（UserRepository, ProjectRepository, SessionRepository）
- **Domain Errors**: ビジネスルールの違反を表すエラー（ValidationError, UnauthorizedError, NotFoundError）

**ファイル例**:
```typescript
// src/domain/user/User.ts
export class User {
  private constructor(
    public readonly id: string,
    private email: Email | null,
    public readonly nickname: string,
    public readonly isGuest: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  // ビジネスロジック
  canManageProjects(): boolean {
    return !this.isGuest;
  }

  // ファクトリメソッド
  static create(/* ... */): User {
    // バリデーション + インスタンス生成
  }
}
```

### 2. Application層 (`src/application/`)

**責務**:
- ユースケースの実装（ビジネスプロセスのオーケストレーション）
- トランザクション境界の定義
- ドメインオブジェクトの調整

**重要な原則**:
- Domain層のみをインポート（Infrastructureは依存性注入で受け取る）
- 1つのユースケース = 1つのビジネスプロセス
- ドメインロジックは書かない（ドメインオブジェクトに委譲）

**含まれるもの**:
- **Use Cases**: ビジネスプロセスの実装（CreateProjectUseCase, GetSessionUseCaseなど）
- **Input/Output DTOs**: ユースケースの入出力定義
- **Application Services**: 複数ドメインにまたがる処理の調整

**ファイル例**:
```typescript
// src/application/project/CreateProjectUseCase.ts
export class CreateProjectUseCase {
  constructor(
    private projectRepository: ProjectRepository,  // インターフェース
    private userRepository: UserRepository          // インターフェース
  ) {}

  async execute(input: CreateProjectInput): Promise<CreateProjectOutput> {
    // 1. ユーザー取得
    const user = await this.userRepository.findById(input.userId);

    // 2. ビジネスルール検証（ドメインオブジェクトに委譲）
    if (!user.canManageProjects()) {
      throw new UnauthorizedError("Guest users cannot create projects");
    }

    // 3. エンティティ作成
    const project = Project.create(/* ... */);

    // 4. 永続化
    return await this.projectRepository.save(project);
  }
}
```

### 3. Infrastructure層 (`src/infrastructure/`)

**責務**:
- リポジトリインターフェースの実装
- 外部サービスとの連携（データベース、認証など）
- 技術的な詳細の実装

**重要な原則**:
- Domain層のインターフェースを実装
- 技術的な詳細はこの層に閉じ込める
- ドメインロジックは書かない

**含まれるもの**:
- **Repository Implementations**: Prismaを使用したリポジトリ実装（PrismaUserRepository, PrismaProjectRepositoryなど）
- **Database Client**: Prismaクライアントのセットアップ
- **Auth Configuration**: NextAuthの設定

**ファイル例**:
```typescript
// src/infrastructure/database/repositories/PrismaProjectRepository.ts
export class PrismaProjectRepository implements ProjectRepository {
  constructor(private prisma: PrismaClient) {}

  async save(project: Project): Promise<Project> {
    // ドメインオブジェクト → Prismaモデルへの変換
    const data = {
      id: project.id,
      name: project.name,
      description: project.description,
      ownerId: project.ownerId,
      // ...
    };

    // Prismaでの永続化
    const saved = await this.prisma.project.upsert({
      where: { id: project.id },
      create: data,
      update: data,
    });

    // Prismaモデル → ドメインオブジェクトへの変換
    return Project.reconstruct(/* ... */);
  }
}
```

### 4. Presentation層 (`app/`)

**責務**:
- HTTPリクエスト/レスポンスの処理
- ユーザーインターフェースの提供
- ユースケースの呼び出し

**重要な原則**:
- 薄いコントローラー（ロジックはユースケースに委譲）
- リクエスト検証とレスポンス整形のみ
- ビジネスロジックは書かない

**含まれるもの**:
- **API Routes**: RESTful APIエンドポイント
- **Page Components**: Reactコンポーネント
- **Middleware**: 認証・認可チェック

**ファイル例**:
```typescript
// app/api/projects/route.ts
export async function POST(request: NextRequest) {
  // 1. 認証確認
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. リクエストボディ取得
  const body = await request.json();

  // 3. 依存性注入
  const projectRepository = new PrismaProjectRepository(prisma);
  const userRepository = new PrismaUserRepository(prisma);
  const createProjectUseCase = new CreateProjectUseCase(
    projectRepository,
    userRepository
  );

  // 4. ユースケース実行
  try {
    const result = await createProjectUseCase.execute({
      userId: session.user.id,
      name: body.name,
      description: body.description,
    });
    return NextResponse.json({ project: result }, { status: 201 });
  } catch (error) {
    // 5. エラーハンドリング
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    // ...
  }
}
```

## 主要なパターン

### 1. Repository パターン

**目的**: データアクセスの抽象化

**実装**:
```typescript
// Domain層: インターフェース定義
export interface ProjectRepository {
  save(project: Project): Promise<Project>;
  findById(id: string): Promise<Project | null>;
  delete(id: string): Promise<void>;
}

// Infrastructure層: 実装
export class PrismaProjectRepository implements ProjectRepository {
  // Prismaを使用した実装
}
```

### 2. Value Object パターン

**目的**: 不変の値を型安全に扱う

**実装**:
```typescript
export class Email {
  private constructor(private readonly value: string) {}

  static fromString(email: string): Email {
    if (!Email.isValid(email)) {
      throw new ValidationError("Invalid email format");
    }
    return new Email(email);
  }

  private static isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  toString(): string {
    return this.value;
  }
}
```

### 3. Factory Method パターン

**目的**: エンティティ生成時のバリデーションとロジックの集約

**実装**:
```typescript
export class Project {
  static create(
    name: string,
    description: string | null,
    ownerId: string
  ): Project {
    // バリデーション
    if (!name.trim()) {
      throw new ValidationError("Project name cannot be empty");
    }

    // インスタンス生成
    return new Project(
      generateId(),
      name.trim(),
      description?.trim() || null,
      ownerId,
      new Date(),
      new Date()
    );
  }

  static reconstruct(/* データベースから取得したデータ */): Project {
    // バリデーション不要（既に検証済みのデータ）
    return new Project(/* ... */);
  }
}
```

## 新機能追加ガイドライン

### ステップ1: ドメインモデルの定義

1. **エンティティの作成** (`src/domain/<domain-name>/<EntityName>.ts`)
   - ビジネスルールをメソッドとして実装
   - privateコンストラクタ + ファクトリメソッド
   - バリデーションをファクトリメソッドに集約

2. **Value Objectの作成** (必要に応じて)
   - 不変性を保証
   - バリデーションロジックを内包

3. **Repositoryインターフェースの定義** (`src/domain/<domain-name>/<EntityName>Repository.ts`)
   - 必要なデータアクセスメソッドのみ定義

### ステップ2: ユースケースの実装

4. **Use Caseの作成** (`src/application/<domain-name>/<ActionName>UseCase.ts`)
   - Input/Output DTOを定義
   - ビジネスプロセスをオーケストレーション
   - ドメインオブジェクトに処理を委譲

### ステップ3: インフラストラクチャの実装

5. **Repositoryの実装** (`src/infrastructure/database/repositories/Prisma<EntityName>Repository.ts`)
   - Repositoryインターフェースを実装
   - Prismaモデルとドメインオブジェクトの変換

### ステップ4: APIエンドポイントの作成

6. **API Routeの作成** (`app/api/<resource>/route.ts`)
   - 薄いコントローラーとして実装
   - 認証・認可チェック
   - ユースケースの呼び出し
   - エラーハンドリング

## 依存関係の検証

### 禁止されているインポート

```typescript
// ❌ Domain層からInfrastructureをインポート
// src/domain/user/User.ts
import { PrismaClient } from '@prisma/client';  // 禁止！

// ❌ Application層からInfrastructureをインポート（DI以外）
// src/application/project/CreateProjectUseCase.ts
import { PrismaProjectRepository } from '@/infrastructure/...';  // 禁止！

// ❌ Domain層からApplicationをインポート
// src/domain/project/Project.ts
import { CreateProjectUseCase } from '@/application/...';  // 禁止！
```

### 許可されているインポート

```typescript
// ✅ Application層からDomainをインポート
// src/application/project/CreateProjectUseCase.ts
import { Project } from '@/domain/project/Project';
import { ProjectRepository } from '@/domain/project/ProjectRepository';

// ✅ Infrastructure層からDomainをインポート
// src/infrastructure/database/repositories/PrismaProjectRepository.ts
import { Project } from '@/domain/project/Project';
import { ProjectRepository } from '@/domain/project/ProjectRepository';

// ✅ Presentation層からApplication、Infrastructureをインポート
// app/api/projects/route.ts
import { CreateProjectUseCase } from '@/application/project/CreateProjectUseCase';
import { PrismaProjectRepository } from '@/infrastructure/database/repositories/PrismaProjectRepository';
```

## テスト戦略

### Domain層のテスト

- **対象**: エンティティ、Value Object、ドメインロジック
- **方針**: 純粋な単体テスト（外部依存なし）
- **例**:
  ```typescript
  describe('Project', () => {
    it('should create project with valid data', () => {
      const project = Project.create('Test Project', 'Description', 'user-id');
      expect(project.name).toBe('Test Project');
    });

    it('should throw error for empty name', () => {
      expect(() => Project.create('', null, 'user-id'))
        .toThrow(ValidationError);
    });
  });
  ```

### Application層のテスト

- **対象**: ユースケース
- **方針**: Repositoryをモック化
- **例**:
  ```typescript
  describe('CreateProjectUseCase', () => {
    it('should create project for authenticated user', async () => {
      const mockRepo = {
        save: jest.fn().mockResolvedValue(mockProject),
      };
      const useCase = new CreateProjectUseCase(mockRepo, mockUserRepo);

      const result = await useCase.execute({ /* ... */ });

      expect(mockRepo.save).toHaveBeenCalled();
      expect(result.name).toBe('Test Project');
    });
  });
  ```

### Infrastructure層のテスト

- **対象**: Repository実装
- **方針**: 統合テスト（実際のDBまたはテストDB使用）

### Presentation層のテスト

- **対象**: APIエンドポイント、Reactコンポーネント
- **方針**: E2Eテストまたは統合テスト

## よくある質問

### Q: ビジネスロジックをどこに書くべき？

**A**: ドメイン層のエンティティまたはValue Objectに書きます。
- ✅ `User.canManageProjects()`
- ❌ UseCaseやAPI Routeにビジネスロジックを書く

### Q: データベースアクセスはどこで行う？

**A**: Infrastructure層のRepositoryで行います。
- ✅ `PrismaProjectRepository.save()`
- ❌ UseCaseやDomainでPrismaを直接使用

### Q: バリデーションはどこで行う？

**A**: レイヤーごとに異なるバリデーションを行います。
- **Presentation層**: リクエスト形式の検証（型、必須項目など）
- **Application層**: ユースケース固有のビジネスルール検証
- **Domain層**: ドメイン不変条件の検証（Entity/Value Objectの整合性）

### Q: エラーハンドリングはどうする？

**A**: ドメインエラーを投げ、Presentation層でHTTPステータスに変換します。
```typescript
// Domain/Application: ドメインエラーを投げる
throw new UnauthorizedError("Guest users cannot create projects");

// Presentation: HTTPステータスに変換
catch (error) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}
```

## まとめ

このアーキテクチャは以下を実現します：

1. **関心の分離**: 各レイヤーが明確な責務を持つ
2. **テスト容易性**: 各レイヤーを独立してテスト可能
3. **保守性**: ビジネスロジックが技術的詳細から分離
4. **拡張性**: 新機能追加時の影響範囲が明確
5. **依存性の管理**: 依存関係が一方向に保たれる

新機能を追加する際は、このドキュメントを参照し、適切なレイヤーに配置してください。
