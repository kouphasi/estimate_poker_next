# API Contracts: DDD Layered Architecture Migration

**Feature**: コードベースの保守性向上とアーキテクチャ明確化
**Date**: 2025-12-30
**Phase**: 1 (Design & Contracts)

## Overview

本ドキュメントでは、リファクタリング後のAPIエンドポイントの契約を定義します。**既存のAPI仕様は変更しません**。内部実装のみをDDDレイヤードアーキテクチャに移行します。

APIルート（`app/api/**/route.ts`）は薄いコントローラーとして機能し、application層のユースケースを呼び出します。

---

## Architectural Pattern

```
HTTP Request
    ↓
APIルート (app/api/**/route.ts) - 薄いコントローラー
    ↓ リクエストの検証・変換
ユースケース (src/application/**/*UseCase.ts) - ビジネスフロー調整
    ↓ ドメインサービス・リポジトリの呼び出し
ドメイン層 (src/domain/**) - ビジネスルール
    ↓ リポジトリインターフェース経由
インフラ層 (src/infrastructure/**) - Prismaリポジトリ実装
    ↓
PostgreSQL
```

---

## Authentication APIs

### POST /api/auth/register

**Use Case**: `RegisterUseCase`

**Request**:
```typescript
{
  email: string;
  password: string;
  nickname: string;
}
```

**Response** (成功: 201 Created):
```typescript
{
  id: string;
  email: string;
  nickname: string;
  isGuest: false;
}
```

**Errors**:
- 400: 入力バリデーションエラー（メール形式不正、パスワード不足等）
- 409: メールアドレス重複

**Internal Flow**:
1. APIルート: リクエスト検証
2. `RegisterUseCase.execute(email, password, nickname)`
3. `UserRepository.findByEmail()` でメール重複チェック
4. パスワードハッシュ化（bcrypt）
5. `UserRepository.save()` で新規ユーザー作成
6. レスポンス返却

---

### POST /api/auth/[...nextauth]

**Use Case**: NextAuth標準フロー（CredentialsProvider + GoogleProvider）

**Note**: NextAuthの内部処理は変更なし。`auth-options.ts`を`src/infrastructure/auth/`に移動し、application層のサービスから呼び出す形に変更。

**Internal Changes**:
- `lib/auth/auth-options.ts` → `src/infrastructure/auth/nextAuthConfig.ts`
- CredentialsProviderのロジックを`LoginUseCase`に委譲

---

### POST /api/users

**Use Case**: `CreateGuestUserUseCase`

**Request**:
```typescript
{
  nickname: string;
}
```

**Response** (成功: 201 Created):
```typescript
{
  id: string;
  nickname: string;
  isGuest: true;
}
```

**Errors**:
- 400: ニックネーム不正

**Internal Flow**:
1. APIルート: リクエスト検証
2. `CreateGuestUserUseCase.execute(nickname)`
3. `UserRepository.createGuest(nickname)`
4. レスポンス返却

---

## Project Management APIs

### GET /api/projects

**Use Case**: `ListProjectsUseCase`

**Authentication**: Required (NextAuth session)

**Response** (成功: 200 OK):
```typescript
{
  projects: Array<{
    id: string;
    name: string;
    description: string | null;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
    _count: {
      sessions: number;
    };
  }>;
}
```

**Errors**:
- 401: 未認証

**Internal Flow**:
1. APIルート: NextAuth session検証
2. `ListProjectsUseCase.execute(userId)`
3. `ProjectRepository.findByOwnerId(userId)`
4. 各プロジェクトの`ProjectRepository.countSessions(projectId)`
5. レスポンス返却

---

### POST /api/projects

**Use Case**: `CreateProjectUseCase`

**Authentication**: Required (NextAuth session)

**Request**:
```typescript
{
  name: string;
  description?: string;
}
```

**Response** (成功: 201 Created):
```typescript
{
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}
```

**Errors**:
- 400: プロジェクト名不正
- 401: 未認証

**Internal Flow**:
1. APIルート: NextAuth session検証、リクエスト検証
2. `CreateProjectUseCase.execute(ownerId, name, description)`
3. `UserRepository.findById(ownerId)` でユーザー確認（`isGuest: false`検証）
4. 新規Projectエンティティ生成
5. `ProjectRepository.save(project)`
6. レスポンス返却

---

### GET /api/projects/[projectId]

**Use Case**: `GetProjectUseCase`

**Authentication**: Required (NextAuth session)

**Response** (成功: 200 OK):
```typescript
{
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}
```

**Errors**:
- 401: 未認証
- 403: オーナーでないユーザーがアクセス
- 404: プロジェクト未存在

**Internal Flow**:
1. APIルート: NextAuth session検証
2. `GetProjectUseCase.execute(projectId, userId)`
3. `ProjectRepository.findById(projectId)`
4. `project.isOwnedBy(userId)` で権限チェック
5. レスポンス返却

---

### PUT /api/projects/[projectId]

**Use Case**: `UpdateProjectUseCase`

**Authentication**: Required (NextAuth session)

**Request**:
```typescript
{
  name?: string;
  description?: string;
}
```

**Response** (成功: 200 OK):
```typescript
{
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}
```

**Errors**:
- 400: 入力バリデーションエラー
- 401: 未認証
- 403: オーナーでないユーザーがアクセス
- 404: プロジェクト未存在

---

### DELETE /api/projects/[projectId]

**Use Case**: `DeleteProjectUseCase`

**Authentication**: Required (NextAuth session)

**Response** (成功: 204 No Content)

**Errors**:
- 401: 未認証
- 403: オーナーでないユーザーがアクセス
- 404: プロジェクト未存在

---

## Session Management APIs

### POST /api/sessions

**Use Case**: `CreateSessionUseCase`

**Request**:
```typescript
{
  userId?: string;
  name?: string;
  projectId?: string;
}
```

**Response** (成功: 201 Created):
```typescript
{
  id: string;
  name: string | null;
  shareToken: string;
  ownerToken: string;
  ownerId: string | null;
  projectId: string | null;
  isRevealed: false;
  status: "ACTIVE";
  finalEstimate: null;
  createdAt: string;
}
```

**Errors**:
- 400: 入力バリデーションエラー
- 404: プロジェクトIDが指定されているが存在しない

**Internal Flow**:
1. APIルート: リクエスト検証
2. `CreateSessionUseCase.execute(userId, name, projectId)`
3. ShareToken, OwnerToken生成（値オブジェクト）
4. 新規EstimationSessionエンティティ生成
5. `SessionRepository.save(session)`
6. レスポンス返却

---

### GET /api/sessions/[shareToken]

**Use Case**: `GetSessionUseCase`

**Response** (成功: 200 OK):
```typescript
{
  id: string;
  name: string | null;
  shareToken: string;
  ownerId: string | null;
  projectId: string | null;
  isRevealed: boolean;
  status: "ACTIVE" | "FINALIZED";
  finalEstimate: number | null;
  createdAt: string;
  estimates: Array<{
    id: string;
    userId: string;
    nickname: string;
    value: number;
    createdAt: string;
  }>;
}
```

**Note**: `isRevealed: false`の場合、クライアント側で他の参加者の見積もりをマスクする処理が必要。APIレベルでは全見積もりを返却。

**Errors**:
- 404: セッション未存在

**Internal Flow**:
1. APIルート: パラメータ検証
2. `GetSessionUseCase.execute(shareToken)`
3. `SessionRepository.findByShareToken(shareToken)`
4. `EstimateRepository.findBySessionId(sessionId)`
5. レスポンス返却

---

### DELETE /api/sessions/[shareToken]

**Use Case**: `DeleteSessionUseCase`

**Authentication**: Owner token required (via request body)

**Request**:
```typescript
{
  ownerToken: string;
}
```

**Response** (成功: 204 No Content)

**Errors**:
- 403: ownerToken不正
- 404: セッション未存在

**Internal Flow**:
1. APIルート: リクエスト検証
2. `DeleteSessionUseCase.execute(shareToken, ownerToken)`
3. `SessionRepository.findByShareToken(shareToken)`
4. `session.canBeControlledBy(ownerToken)` で権限チェック
5. `SessionRepository.delete(sessionId)`
6. `EstimateRepository.deleteBySessionId(sessionId)` (カスケード削除)
7. レスポンス返却

---

### POST /api/sessions/[shareToken]/estimates

**Use Case**: `SubmitEstimateUseCase`

**Request**:
```typescript
{
  userId: string;
  nickname: string;
  value: number;
}
```

**Response** (成功: 200 OK):
```typescript
{
  id: string;
  sessionId: string;
  userId: string;
  nickname: string;
  value: number;
  createdAt: string;
  updatedAt: string;
}
```

**Errors**:
- 400: 見積もり値が不正（負の数等）
- 404: セッション未存在
- 409: セッションが既にFINALIZED

**Internal Flow**:
1. APIルート: リクエスト検証
2. `SubmitEstimateUseCase.execute(shareToken, userId, nickname, value)`
3. `SessionRepository.findByShareToken(shareToken)`
4. `session.isFinalized()` チェック
5. `EstimateRepository.findBySessionAndUser(sessionId, userId)`
6. 既存の見積もりがあれば更新、なければ新規作成
7. `EstimateRepository.save(estimate)`
8. レスポンス返却

---

### PATCH /api/sessions/[shareToken]/reveal

**Use Case**: `ToggleRevealUseCase`

**Authentication**: Owner token required (via request body)

**Request**:
```typescript
{
  ownerToken: string;
  isRevealed: boolean;
}
```

**Response** (成功: 200 OK):
```typescript
{
  id: string;
  isRevealed: boolean;
}
```

**Errors**:
- 403: ownerToken不正
- 404: セッション未存在

**Internal Flow**:
1. APIルート: リクエスト検証
2. `ToggleRevealUseCase.execute(shareToken, ownerToken, isRevealed)`
3. `SessionRepository.findByShareToken(shareToken)`
4. `session.canBeControlledBy(ownerToken)` で権限チェック
5. `session.reveal()` または `session.hide()`
6. `SessionRepository.save(session)`
7. レスポンス返却

---

### POST /api/sessions/[shareToken]/finalize

**Use Case**: `FinalizeSessionUseCase`

**Authentication**: Owner token required (via request body)

**Request**:
```typescript
{
  ownerToken: string;
  finalEstimate: number;
}
```

**Response** (成功: 200 OK):
```typescript
{
  id: string;
  status: "FINALIZED";
  finalEstimate: number;
}
```

**Errors**:
- 400: finalEstimateが不正（負の数等）
- 403: ownerToken不正
- 404: セッション未存在
- 409: 既にFINALIZED

**Internal Flow**:
1. APIルート: リクエスト検証
2. `FinalizeSessionUseCase.execute(shareToken, ownerToken, finalEstimate)`
3. `SessionRepository.findByShareToken(shareToken)`
4. `session.canBeControlledBy(ownerToken)` で権限チェック
5. `session.finalize(finalEstimate)`
6. `SessionRepository.save(session)`
7. レスポンス返却

---

## Summary

すべてのAPIエンドポイントの契約を定義しました。既存のAPI仕様は変更せず、内部実装のみをDDDレイヤードアーキテクチャに移行します。

**主要なパターン**:
1. **薄いコントローラー**: APIルートはHTTPリクエスト/レスポンスの変換のみ
2. **ユースケース駆動**: ビジネスロジックはapplication層のユースケースに集約
3. **ドメイン駆動**: エンティティのビジネスルールをメソッドとして実装
4. **リポジトリ抽象化**: ドメイン層のインターフェースを通じてデータアクセス
