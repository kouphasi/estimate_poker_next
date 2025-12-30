# Data Model: DDD Layered Architecture

**Feature**: コードベースの保守性向上とアーキテクチャ明確化
**Date**: 2025-12-30
**Phase**: 1 (Design & Contracts)

## Overview

本ドキュメントでは、DDD レイヤードアーキテクチャにおけるドメインモデル（エンティティ、値オブジェクト、リポジトリインターフェース）を定義します。既存のPrismaスキーマは変更せず、ドメイン層での表現のみを定義します。

---

## Domain Entities

### 1. User（ユーザー）

**責務**: ユーザーのアイデンティティと基本情報を表現。ゲストユーザーと認証ユーザーの区別を管理。

**属性**:
- `id`: string (CUID) - 一意識別子
- `email`: Email | null - メールアドレス（値オブジェクト、認証ユーザーのみ）
- `nickname`: string - 表示名
- `isGuest`: boolean - ゲストユーザーフラグ
- `createdAt`: Date - 作成日時
- `updatedAt`: Date - 更新日時

**ビジネスルール**:
- ゲストユーザー（`isGuest: true`）はプロジェクト管理機能を使用できない
- 認証ユーザー（`isGuest: false`）はメールアドレスが必須
- ニックネームは必須（最小1文字）

**メソッド**:
```typescript
canManageProjects(): boolean
canCreateSession(): boolean
isAuthenticated(): boolean
```

**状態遷移**:
- ゲストユーザー → 認証ユーザー（将来的な移行機能、現在はOut of Scope）

---

### 2. Project（プロジェクト）

**責務**: 見積もりセッションをグループ化する単位。認証ユーザーのみが作成・管理可能。

**属性**:
- `id`: string (CUID) - 一意識別子
- `name`: string - プロジェクト名
- `description`: string | null - 説明（オプション）
- `ownerId`: string - オーナー（Userエンティティへの参照）
- `createdAt`: Date - 作成日時
- `updatedAt`: Date - 更新日時

**ビジネスルール**:
- オーナーは認証ユーザーでなければならない（`User.isGuest: false`）
- プロジェクト名は必須（最小1文字）

**メソッド**:
```typescript
isOwnedBy(userId: string): boolean
canBeDeletedBy(userId: string): boolean
```

**関係**:
- 1つのProjectは複数のEstimationSessionを持つ（1対多）

---

### 3. EstimationSession（見積もりセッション）

**責務**: 見積もりセッションの状態とメタデータを管理。参加者の見積もりを集約。

**属性**:
- `id`: string (CUID) - 一意識別子
- `name`: string | null - セッション名（オプション）
- `shareToken`: ShareToken - 共有用トークン（値オブジェクト、16文字base64url）
- `ownerToken`: OwnerToken - オーナー認証用トークン（値オブジェクト、32文字base64url）
- `ownerId`: string | null - オーナー（Userエンティティへの参照、オプション）
- `projectId`: string | null - プロジェクト（Projectエンティティへの参照、オプション）
- `isRevealed`: boolean - カード公開状態
- `status`: SessionStatus - セッションステータス（ACTIVE | FINALIZED）
- `finalEstimate`: number | null - 確定工数（日数）
- `createdAt`: Date - 作成日時

**ビジネスルール**:
- shareTokenとownerTokenは一意でなければならない
- FINALIZEDステータスのセッションは再オープンできない
- カードの公開/非公開切り替えはオーナーのみ実行可能
- 工数確定（finalize）はオーナーのみ実行可能
- isRevealedがfalseの場合、参加者は他の参加者の見積もりを見ることができない

**メソッド**:
```typescript
reveal(): void
hide(): void
finalize(estimate: number): void
canBeControlledBy(ownerToken: string): boolean
isActive(): boolean
isFinalized(): boolean
```

**状態遷移**:
```
ACTIVE (isRevealed: false) → ACTIVE (isRevealed: true) → FINALIZED
```

**関係**:
- 1つのEstimationSessionは複数のEstimateを持つ（1対多）
- 1つのEstimationSessionは0または1つのProjectに属する（多対1）

---

### 4. Estimate（見積もり）

**責務**: 特定のセッションにおける特定のユーザーの見積もり値を表現。

**属性**:
- `id`: string (CUID) - 一意識別子
- `sessionId`: string - セッション（EstimationSessionエンティティへの参照）
- `userId`: string - ユーザー（Userエンティティへの参照）
- `nickname`: string - セッション内での表示名
- `value`: number - 見積もり値（日数）
- `createdAt`: Date - 作成日時
- `updatedAt`: Date - 更新日時

**ビジネスルール**:
- 同一セッション内で同一ユーザーは1つの見積もりのみ持つ（複合一意制約: `sessionId` + `userId`）
- 見積もり値は正の数値でなければならない
- セッションがFINALIZEDの場合、見積もりは変更できない

**メソッド**:
```typescript
update(newValue: number): void
belongsToSession(sessionId: string): boolean
```

**関係**:
- 1つのEstimateは1つのEstimationSessionに属する（多対1）
- 1つのEstimateは1つのUserに関連付けられる（多対1）

---

## Value Objects（値オブジェクト）

### Email

**責務**: メールアドレスのフォーマット検証

**属性**:
- `value`: string - メールアドレス文字列

**バリデーション**:
- RFC 5322準拠の基本的なメールアドレス形式チェック

```typescript
class Email {
  private constructor(public readonly value: string) {}

  static create(email: string): Email {
    if (!this.isValid(email)) {
      throw new InvalidEmailError(email);
    }
    return new Email(email);
  }

  private static isValid(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
}
```

---

### ShareToken

**責務**: セッション共有用トークンの生成と検証

**属性**:
- `value`: string - 16文字のbase64url文字列

**生成**:
- `crypto.randomBytes(12).toString("base64url")` で生成（衝突防止のためリトライロジック付き）

```typescript
class ShareToken {
  private constructor(public readonly value: string) {}

  static generate(): ShareToken {
    const token = crypto.randomBytes(12).toString("base64url");
    return new ShareToken(token);
  }

  static fromString(value: string): ShareToken {
    if (value.length !== 16) {
      throw new InvalidTokenError("ShareToken must be 16 characters");
    }
    return new ShareToken(value);
  }
}
```

---

### OwnerToken

**責務**: セッションオーナー認証用トークンの生成と検証

**属性**:
- `value`: string - 32文字のbase64url文字列

**生成**:
- `crypto.randomBytes(24).toString("base64url")` で生成（衝突防止のためリトライロジック付き）

```typescript
class OwnerToken {
  private constructor(public readonly value: string) {}

  static generate(): OwnerToken {
    const token = crypto.randomBytes(24).toString("base64url");
    return new OwnerToken(token);
  }

  static fromString(value: string): OwnerToken {
    if (value.length !== 32) {
      throw new InvalidTokenError("OwnerToken must be 32 characters");
    }
    return new OwnerToken(value);
  }

  equals(other: OwnerToken): boolean {
    return this.value === other.value;
  }
}
```

---

## Enums

### SessionStatus

```typescript
enum SessionStatus {
  ACTIVE = "ACTIVE",
  FINALIZED = "FINALIZED"
}
```

---

## Repository Interfaces（ドメイン層で定義）

### UserRepository

```typescript
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  // ゲストユーザーの作成（ニックネームのみ）
  createGuest(nickname: string): Promise<User>;
}
```

---

### ProjectRepository

```typescript
interface ProjectRepository {
  findById(id: string): Promise<Project | null>;
  findByOwnerId(ownerId: string): Promise<Project[]>;
  save(project: Project): Promise<Project>;
  delete(id: string): Promise<void>;
  // プロジェクトに関連するセッション数を取得
  countSessions(projectId: string): Promise<number>;
}
```

---

### SessionRepository

```typescript
interface SessionRepository {
  findByShareToken(token: ShareToken): Promise<EstimationSession | null>;
  findById(id: string): Promise<EstimationSession | null>;
  findByOwnerId(ownerId: string): Promise<EstimationSession[]>;
  findByProjectId(projectId: string): Promise<EstimationSession[]>;
  save(session: EstimationSession): Promise<EstimationSession>;
  delete(id: string): Promise<void>;
}
```

---

### EstimateRepository

```typescript
interface EstimateRepository {
  findBySessionId(sessionId: string): Promise<Estimate[]>;
  findBySessionAndUser(sessionId: string, userId: string): Promise<Estimate | null>;
  save(estimate: Estimate): Promise<Estimate>;
  delete(id: string): Promise<void>;
  // セッションに関連するすべての見積もりを削除（カスケード）
  deleteBySessionId(sessionId: string): Promise<void>;
}
```

---

## Domain Services

### EstimateCalculationService

**責務**: 見積もりの統計計算（平均、中央値、最小値、最大値）

```typescript
class EstimateCalculationService {
  calculateAverage(estimates: Estimate[]): number;
  calculateMedian(estimates: Estimate[]): number;
  findMin(estimates: Estimate[]): number;
  findMax(estimates: Estimate[]): number;
}
```

---

## Mapping Strategy（Prisma ↔ Domain）

リポジトリ層（infrastructure）で、Prismaモデルとドメインエンティティの変換を実施：

```typescript
// PrismaUserRepository内でのマッピング例
private toDomain(prismaUser: PrismaUser): User {
  return new User(
    prismaUser.id,
    prismaUser.email ? Email.create(prismaUser.email) : null,
    prismaUser.nickname,
    prismaUser.isGuest,
    prismaUser.createdAt,
    prismaUser.updatedAt
  );
}

private toPrisma(user: User): Prisma.UserCreateInput {
  return {
    id: user.id,
    email: user.email?.value ?? null,
    nickname: user.nickname,
    isGuest: user.isGuest,
    // passwordHash等の他のフィールドは別途処理
  };
}
```

---

## Summary

- **4つのエンティティ**: User, Project, EstimationSession, Estimate
- **3つの値オブジェクト**: Email, ShareToken, OwnerToken
- **4つのリポジトリインターフェース**: UserRepository, ProjectRepository, SessionRepository, EstimateRepository
- **1つのドメインサービス**: EstimateCalculationService

既存のPrismaスキーマは変更せず、ドメイン層での表現のみを定義しました。リポジトリ層でマッピングを実施することで、ドメインモデルとデータベーススキーマを分離します。
