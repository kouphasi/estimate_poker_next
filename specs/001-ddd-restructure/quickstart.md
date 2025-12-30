# Quickstart Guide: DDD Layered Architecture Migration

**Feature**: コードベースの保守性向上とアーキテクチャ明確化
**Date**: 2025-12-30
**Phase**: 1 (Design & Contracts)

## Overview

このガイドでは、DDD レイヤードアーキテクチャへの移行作業を開始するための手順を説明します。

---

## Prerequisites

- Node.js 18.x 以上
- TypeScript 5.x
- Next.js 16.x、React 19.x、Prisma 6.x（既存のバージョンを維持）
- PostgreSQL データベース

---

## Migration Phases

リファクタリングは以下の順序で機能単位に実施します：

1. **Phase 1: 認証（Auth）** - 比較的独立したモジュール。リポジトリパターンの実装パターンを確立
2. **Phase 2: セッション管理（Session/Estimate）** - メインビジネスロジック
3. **Phase 3: プロジェクト管理（Project）** - 確立したパターンを適用

各フェーズは以下のステップで進めます：

---

## Step 1: プロジェクト構造の準備

### 1.1 src/ ディレクトリの作成

```bash
mkdir -p src/domain
mkdir -p src/application
mkdir -p src/infrastructure/database/repositories
mkdir -p src/infrastructure/auth
```

### 1.2 TypeScript パスエイリアスの設定

`tsconfig.json`を編集：

```json
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

### 1.3 型チェックの実行

```bash
npm run type-check
```

エラーが出ないことを確認してから次に進みます。

---

## Step 2: Phase 1 - 認証モジュールの移行

### 2.1 ドメイン層の作成

#### User エンティティ

`src/domain/user/User.ts`:

```typescript
import { Email } from "./Email";

export class User {
  constructor(
    public readonly id: string,
    public readonly email: Email | null,
    public readonly nickname: string,
    public readonly isGuest: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  canManageProjects(): boolean {
    return !this.isGuest;
  }

  canCreateSession(): boolean {
    return true; // ゲストも認証ユーザーもセッション作成可能
  }

  isAuthenticated(): boolean {
    return !this.isGuest;
  }
}
```

#### Email 値オブジェクト

`src/domain/user/Email.ts`:

```typescript
export class Email {
  private constructor(public readonly value: string) {}

  static create(email: string): Email {
    if (!this.isValid(email)) {
      throw new Error(`Invalid email: ${email}`);
    }
    return new Email(email);
  }

  private static isValid(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

#### UserRepository インターフェース

`src/domain/user/UserRepository.ts`:

```typescript
import { User } from "./User";
import { Email } from "./Email";

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  createGuest(nickname: string): Promise<User>;
}
```

### 2.2 インフラストラクチャ層の作成

#### Prisma クライアントの移動

`lib/prisma.ts` → `src/infrastructure/database/prisma.ts` にコピー（後で元ファイルを削除）

#### PrismaUserRepository 実装

`src/infrastructure/database/repositories/PrismaUserRepository.ts`:

```typescript
import { PrismaClient } from "@prisma/client";
import { UserRepository } from "@/domain/user/UserRepository";
import { User } from "@/domain/user/User";
import { Email } from "@/domain/user/Email";

export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const data = await this.prisma.user.findUnique({ where: { id } });
    if (!data) return null;
    return this.toDomain(data);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const data = await this.prisma.user.findUnique({
      where: { email: email.value },
    });
    if (!data) return null;
    return this.toDomain(data);
  }

  async save(user: User): Promise<User> {
    const data = await this.prisma.user.upsert({
      where: { id: user.id },
      update: {
        nickname: user.nickname,
        updatedAt: new Date(),
      },
      create: {
        id: user.id,
        email: user.email?.value ?? null,
        nickname: user.nickname,
        isGuest: user.isGuest,
      },
    });
    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async createGuest(nickname: string): Promise<User> {
    const data = await this.prisma.user.create({
      data: {
        nickname,
        isGuest: true,
      },
    });
    return this.toDomain(data);
  }

  private toDomain(data: any): User {
    return new User(
      data.id,
      data.email ? Email.create(data.email) : null,
      data.nickname,
      data.isGuest,
      data.createdAt,
      data.updatedAt
    );
  }
}
```

### 2.3 アプリケーション層の作成

#### CreateGuestUserUseCase

`src/application/auth/CreateGuestUserUseCase.ts`:

```typescript
import { UserRepository } from "@/domain/user/UserRepository";
import { User } from "@/domain/user/User";

export class CreateGuestUserUseCase {
  constructor(private userRepo: UserRepository) {}

  async execute(nickname: string): Promise<User> {
    if (!nickname || nickname.trim().length === 0) {
      throw new Error("Nickname is required");
    }

    return await this.userRepo.createGuest(nickname.trim());
  }
}
```

### 2.4 APIルートの更新

`app/api/users/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaUserRepository } from "@/infrastructure/database/repositories/PrismaUserRepository";
import { CreateGuestUserUseCase } from "@/application/auth/CreateGuestUserUseCase";

export async function POST(request: Request) {
  try {
    const { nickname } = await request.json();

    // 依存性の組み立て
    const userRepo = new PrismaUserRepository(prisma);
    const useCase = new CreateGuestUserUseCase(userRepo);

    // ユースケース実行
    const user = await useCase.execute(nickname);

    return NextResponse.json(
      {
        id: user.id,
        nickname: user.nickname,
        isGuest: user.isGuest,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
```

### 2.5 テスト実行

```bash
# 型チェック
npm run type-check

# Lint
npm run lint

# ビルド
npm run build

# 開発サーバー起動
npm run dev
```

ブラウザで http://localhost:3000 にアクセスし、ゲストユーザー作成機能が動作することを確認。

---

## Step 3: Phase 2 & 3の繰り返し

Phase 1が完了したら、同じパターンでセッション管理とプロジェクト管理を移行します。

各フェーズ完了後：
1. 手動テスト実施（ログイン、セッション作成、見積もり投稿）
2. Gitコミット
3. 次のフェーズに進む

---

## Step 4: 旧コードの削除

すべてのフェーズが完了したら：

```bash
# lib/ ディレクトリの削除（すべてのコードがsrc/に移行済み）
rm -rf lib/

# 型チェック・ビルドの最終確認
npm run type-check
npm run build
```

---

## Step 5: テストの追加（移行後）

移行完了後、以下のテストを追加：

1. **ユニットテスト**: ドメインエンティティ、値オブジェクト、ユースケース
2. **統合テスト**: リポジトリ実装（実際のPrismaクライアントを使用）
3. **E2Eテスト**: 主要フロー（ログイン、セッション作成、見積もり投稿）

テストフレームワーク（Vitest、Jest等）の選定と設定は移行完了後に実施。

---

## Troubleshooting

### import エラーが発生する

- `tsconfig.json`のパスエイリアスが正しく設定されているか確認
- Next.jsを再起動（`npm run dev`を停止して再実行）

### Prisma クライアントが見つからない

```bash
npx prisma generate
```

### 型エラーが解決しない

- 既存の`lib/`ディレクトリからのimportが残っていないか確認
- `@/infrastructure/database/prisma`から正しくimportされているか確認

---

## Next Steps

Phase 1の移行が完了したら、`/speckit.tasks`コマンドを実行して、Phase 2, 3の詳細なタスクリストを生成します。

---

## References

- [spec.md](./spec.md) - 機能仕様
- [data-model.md](./data-model.md) - ドメインモデル定義
- [contracts/api-contracts.md](./contracts/api-contracts.md) - API契約
- [research.md](./research.md) - 技術調査結果
