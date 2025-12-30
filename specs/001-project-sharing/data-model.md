# Data Model: プロジェクト共有機能

**Date**: 2025-12-28
**Feature**: 001-project-sharing

## 新規モデル

### ProjectInvite (プロジェクト招待)

プロジェクトへの招待URLを管理するモデル。

| フィールド | 型 | 説明 | 制約 |
|------------|------|------|------|
| id | String | 主キー | cuid() |
| projectId | String | 対象プロジェクトID | FK → Project, unique |
| token | String | 招待トークン | unique, 16文字以上 |
| createdAt | DateTime | 作成日時 | default: now() |
| updatedAt | DateTime | 更新日時 | @updatedAt |

**リレーション**:
- `project`: Project (1対1、onDelete: Cascade)

**ユニーク制約**:
- `projectId`: 1プロジェクトにつき1招待URL
- `token`: トークンの一意性保証

**Prisma定義**:
```prisma
model ProjectInvite {
  id        String   @id @default(cuid())
  projectId String   @unique @map("project_id")
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  token     String   @unique
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("project_invites")
}
```

---

### JoinRequest (参加申請)

ユーザーからプロジェクトへの参加リクエストを管理するモデル。

| フィールド | 型 | 説明 | 制約 |
|------------|------|------|------|
| id | String | 主キー | cuid() |
| projectId | String | 対象プロジェクトID | FK → Project |
| userId | String | 申請者ユーザーID | FK → User |
| status | JoinRequestStatus | 申請ステータス | default: PENDING |
| createdAt | DateTime | 申請日時 | default: now() |
| updatedAt | DateTime | 更新日時 | @updatedAt |

**リレーション**:
- `project`: Project (多対1、onDelete: Cascade)
- `user`: User (多対1、onDelete: Cascade)

**ユニーク制約**:
- `[projectId, userId]`: 同一ユーザーから同一プロジェクトへの重複申請を防止

**Enum: JoinRequestStatus**:
```prisma
enum JoinRequestStatus {
  PENDING   // 保留中（承認待ち）
  APPROVED  // 承認済み
  REJECTED  // 拒否
}
```

**Prisma定義**:
```prisma
model JoinRequest {
  id        String            @id @default(cuid())
  projectId String            @map("project_id")
  project   Project           @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId    String            @map("user_id")
  user      User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  status    JoinRequestStatus @default(PENDING)
  createdAt DateTime          @default(now()) @map("created_at")
  updatedAt DateTime          @updatedAt @map("updated_at")

  @@unique([projectId, userId])
  @@map("join_requests")
}
```

---

### ProjectMember (プロジェクトメンバー)

プロジェクトとユーザーの多対多関係を管理する中間テーブル。

| フィールド | 型 | 説明 | 制約 |
|------------|------|------|------|
| id | String | 主キー | cuid() |
| projectId | String | プロジェクトID | FK → Project |
| userId | String | メンバーユーザーID | FK → User |
| role | MemberRole | メンバーの役割 | default: MEMBER |
| joinedAt | DateTime | 参加日時 | default: now() |

**リレーション**:
- `project`: Project (多対1、onDelete: Cascade)
- `user`: User (多対1、onDelete: Cascade)

**ユニーク制約**:
- `[projectId, userId]`: 同一ユーザーが同一プロジェクトに複数回登録されることを防止

**Enum: MemberRole**:
```prisma
enum MemberRole {
  OWNER   // プロジェクトオーナー
  MEMBER  // 一般メンバー
}
```

**Prisma定義**:
```prisma
model ProjectMember {
  id        String     @id @default(cuid())
  projectId String     @map("project_id")
  project   Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId    String     @map("user_id")
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      MemberRole @default(MEMBER)
  joinedAt  DateTime   @default(now()) @map("joined_at")

  @@unique([projectId, userId])
  @@map("project_members")
}
```

---

## 既存モデルへの変更

### Project モデル

**追加リレーション**:
```prisma
model Project {
  // ... 既存フィールド ...

  // 追加
  invite       ProjectInvite?
  joinRequests JoinRequest[]
  members      ProjectMember[]
}
```

### User モデル

**追加リレーション**:
```prisma
model User {
  // ... 既存フィールド ...

  // 追加
  joinRequests      JoinRequest[]
  projectMemberships ProjectMember[]
}
```

---

## 状態遷移図

### JoinRequest ステータス遷移

```
                  ┌─────────────┐
                  │   PENDING   │
                  └──────┬──────┘
                         │
           ┌─────────────┼─────────────┐
           │                           │
           ▼                           ▼
    ┌─────────────┐             ┌─────────────┐
    │   APPROVED  │             │  REJECTED   │
    └─────────────┘             └──────┬──────┘
           │                           │
           ▼                           ▼
    ProjectMember               レコード削除
    レコード作成                 (再申請可能)
```

### 招待フロー

```
1. オーナー: 招待URL発行
   → ProjectInvite レコード作成/更新

2. ユーザー: 招待URLアクセス
   → 認証チェック → JoinRequest (PENDING) 作成

3. オーナー: 承認
   → JoinRequest.status = APPROVED
   → ProjectMember レコード作成

4. オーナー: 拒否
   → JoinRequest レコード削除
   → (ユーザーは再申請可能)
```

---

## データ整合性ルール

1. **ProjectInvite は Project と 1対1**
   - 1プロジェクトにつき最大1つの有効な招待URL
   - 再発行時は既存レコードを更新（新トークン生成）

2. **JoinRequest の重複防止**
   - `[projectId, userId]` ユニーク制約
   - 既に申請済みの場合はエラー返却

3. **ProjectMember の重複防止**
   - `[projectId, userId]` ユニーク制約
   - 承認時に既存メンバーチェック

4. **オーナーはメンバーにも登録**
   - プロジェクト作成時に `MemberRole.OWNER` で登録
   - クエリの一貫性を保つ

5. **カスケード削除**
   - Project 削除 → ProjectInvite, JoinRequest, ProjectMember 自動削除
   - User 削除 → JoinRequest, ProjectMember 自動削除

---

## マイグレーション計画

### Step 1: Enum 追加
```sql
CREATE TYPE "JoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'MEMBER');
```

### Step 2: テーブル作成
```sql
CREATE TABLE "project_invites" (...);
CREATE TABLE "join_requests" (...);
CREATE TABLE "project_members" (...);
```

### Step 3: 既存プロジェクトのオーナーをメンバーに登録
```sql
INSERT INTO "project_members" (id, project_id, user_id, role, joined_at)
SELECT gen_random_uuid(), id, owner_id, 'OWNER', created_at
FROM "projects";
```

**注意**: Step 3 は既存データがある場合のみ必要。新規環境では不要。
