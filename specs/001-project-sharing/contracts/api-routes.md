# API Contracts: プロジェクト共有機能

**Date**: 2025-12-28
**Feature**: 001-project-sharing

## 概要

本ドキュメントでは、プロジェクト共有機能で追加するAPIエンドポイントを定義する。
全てのエンドポイントは認証済みユーザー（NextAuth.jsセッション）が必要。

---

## 1. 招待URL発行

### `POST /api/projects/[projectId]/invite`

プロジェクトの招待URLを発行（または再発行）する。

**認可**: プロジェクトオーナーのみ

**Request**:
```typescript
// パスパラメータ
projectId: string  // プロジェクトID
```

**Response**:

```typescript
// 200 OK
{
  inviteUrl: string    // 完全な招待URL (例: "https://example.com/invite/abc123...")
  token: string        // 招待トークン
  createdAt: string    // ISO 8601 日時
}

// 403 Forbidden - オーナーでない場合
{
  error: "Forbidden"
  message: "プロジェクトオーナーのみが招待URLを発行できます"
}

// 404 Not Found - プロジェクトが存在しない
{
  error: "Not Found"
  message: "プロジェクトが見つかりません"
}
```

---

## 2. 招待トークンからプロジェクト情報取得

### `GET /api/invite/[token]`

招待トークンから対象プロジェクトの情報を取得する。

**認可**: 認証済みユーザー

**Request**:
```typescript
// パスパラメータ
token: string  // 招待トークン
```

**Response**:

```typescript
// 200 OK
{
  project: {
    id: string
    name: string
    description: string | null
    owner: {
      id: string
      nickname: string
    }
  }
  userStatus: "none" | "pending" | "member" | "owner"
  // none: 未申請
  // pending: 申請中
  // member: 既にメンバー
  // owner: 自分がオーナー
}

// 404 Not Found - トークンが無効
{
  error: "Not Found"
  message: "この招待URLは無効です"
}
```

---

## 3. 参加申請

### `POST /api/projects/[projectId]/join-requests`

プロジェクトへの参加を申請する。

**認可**: 認証済みユーザー（オーナー・既存メンバー以外）

**Request**:
```typescript
// パスパラメータ
projectId: string  // プロジェクトID

// ボディ (optional)
{
  inviteToken?: string  // 招待トークン（検証用）
}
```

**Response**:

```typescript
// 201 Created
{
  id: string           // 参加申請ID
  status: "PENDING"
  createdAt: string    // ISO 8601 日時
}

// 400 Bad Request - 既に申請済み
{
  error: "Bad Request"
  message: "既に参加申請済みです"
}

// 400 Bad Request - 既にメンバー
{
  error: "Bad Request"
  message: "既にこのプロジェクトのメンバーです"
}

// 400 Bad Request - オーナー自身
{
  error: "Bad Request"
  message: "このプロジェクトはあなたがオーナーです"
}

// 404 Not Found
{
  error: "Not Found"
  message: "プロジェクトが見つかりません"
}
```

---

## 4. 参加リクエスト一覧取得

### `GET /api/projects/[projectId]/join-requests`

プロジェクトの参加リクエスト一覧を取得する。

**認可**: プロジェクトオーナーのみ

**Request**:
```typescript
// パスパラメータ
projectId: string  // プロジェクトID

// クエリパラメータ (optional)
status?: "PENDING" | "APPROVED" | "REJECTED"  // フィルタ (default: PENDING)
```

**Response**:

```typescript
// 200 OK
{
  requests: Array<{
    id: string
    user: {
      id: string
      nickname: string
      email: string | null
    }
    status: "PENDING" | "APPROVED" | "REJECTED"
    createdAt: string  // ISO 8601 日時
  }>
  count: number
}

// 403 Forbidden
{
  error: "Forbidden"
  message: "プロジェクトオーナーのみがリクエストを確認できます"
}
```

---

## 5. 参加リクエスト承認/拒否

### `PATCH /api/projects/[projectId]/join-requests/[requestId]`

参加リクエストを承認または拒否する。

**認可**: プロジェクトオーナーのみ

**Request**:
```typescript
// パスパラメータ
projectId: string   // プロジェクトID
requestId: string   // 参加申請ID

// ボディ
{
  action: "approve" | "reject"
}
```

**Response**:

```typescript
// 200 OK (approve)
{
  message: "参加を承認しました"
  member: {
    id: string        // ProjectMember ID
    userId: string
    nickname: string
    role: "MEMBER"
    joinedAt: string  // ISO 8601 日時
  }
}

// 200 OK (reject)
{
  message: "参加を拒否しました"
}

// 400 Bad Request - 既に処理済み
{
  error: "Bad Request"
  message: "このリクエストは既に処理されています"
}

// 403 Forbidden
{
  error: "Forbidden"
  message: "プロジェクトオーナーのみがリクエストを処理できます"
}

// 404 Not Found
{
  error: "Not Found"
  message: "リクエストが見つかりません"
}
```

---

## 6. メンバー一覧取得

### `GET /api/projects/[projectId]/members`

プロジェクトのメンバー一覧を取得する。

**認可**: プロジェクトオーナーまたはメンバー

**Request**:
```typescript
// パスパラメータ
projectId: string  // プロジェクトID
```

**Response**:

```typescript
// 200 OK
{
  members: Array<{
    id: string          // ProjectMember ID
    user: {
      id: string
      nickname: string
      email: string | null
    }
    role: "OWNER" | "MEMBER"
    joinedAt: string    // ISO 8601 日時
  }>
  count: number
}

// 403 Forbidden
{
  error: "Forbidden"
  message: "プロジェクトメンバーのみが一覧を確認できます"
}

// 404 Not Found
{
  error: "Not Found"
  message: "プロジェクトが見つかりません"
}
```

---

## 7. メンバー削除

### `DELETE /api/projects/[projectId]/members/[memberId]`

メンバーをプロジェクトから削除する。

**認可**: プロジェクトオーナーのみ

**Request**:
```typescript
// パスパラメータ
projectId: string   // プロジェクトID
memberId: string    // ProjectMember ID
```

**Response**:

```typescript
// 200 OK
{
  message: "メンバーを削除しました"
}

// 400 Bad Request - オーナー自身を削除しようとした
{
  error: "Bad Request"
  message: "オーナー自身は削除できません"
}

// 403 Forbidden
{
  error: "Forbidden"
  message: "プロジェクトオーナーのみがメンバーを削除できます"
}

// 404 Not Found
{
  error: "Not Found"
  message: "メンバーが見つかりません"
}
```

---

## 8. 参加中プロジェクト一覧取得

### `GET /api/users/me/projects`

自分がメンバーとして参加しているプロジェクト一覧を取得する。

**認可**: 認証済みユーザー

**Request**:
```typescript
// クエリパラメータ (optional)
role?: "OWNER" | "MEMBER"  // フィルタ
```

**Response**:

```typescript
// 200 OK
{
  projects: Array<{
    id: string
    name: string
    description: string | null
    role: "OWNER" | "MEMBER"
    owner: {
      id: string
      nickname: string
    }
    joinedAt: string       // ISO 8601 日時
    sessionCount: number   // セッション数
  }>
}
```

---

## 共通エラーレスポンス

### 401 Unauthorized

```typescript
{
  error: "Unauthorized"
  message: "ログインが必要です"
}
```

### 500 Internal Server Error

```typescript
{
  error: "Internal Server Error"
  message: "サーバーエラーが発生しました"
}
```

---

## 型定義 (TypeScript)

```typescript
// types/project-sharing.ts

export type JoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export type MemberRole = "OWNER" | "MEMBER";
export type UserProjectStatus = "none" | "pending" | "member" | "owner";

export interface ProjectInviteResponse {
  inviteUrl: string;
  token: string;
  createdAt: string;
}

export interface JoinRequestResponse {
  id: string;
  user: {
    id: string;
    nickname: string;
    email: string | null;
  };
  status: JoinRequestStatus;
  createdAt: string;
}

export interface ProjectMemberResponse {
  id: string;
  user: {
    id: string;
    nickname: string;
    email: string | null;
  };
  role: MemberRole;
  joinedAt: string;
}

export interface ProjectWithMembershipResponse {
  id: string;
  name: string;
  description: string | null;
  role: MemberRole;
  owner: {
    id: string;
    nickname: string;
  };
  joinedAt: string;
  sessionCount: number;
}
```
