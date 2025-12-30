# Research: プロジェクト共有機能

**Date**: 2025-12-28
**Feature**: 001-project-sharing

## 調査項目

### 1. 招待トークン生成方式

**Decision**: 既存の`generateShareToken()`パターンを踏襲し、16文字以上のbase64urlエンコードトークンを使用

**Rationale**:
- 既存コードベースに`lib/utils.ts`で`generateShareToken()`が実装済み
- `crypto.randomBytes()`による暗号学的に安全なランダム生成
- base64urlエンコードでURL-safe文字列を生成
- 16文字で十分な推測困難性（約96ビットのエントロピー）

**Alternatives considered**:
- UUID v4: 36文字と長く、URLに含めると冗長
- nanoid: 追加依存が必要、既存パターンと異なる
- ハッシュベース: 追加の複雑さが不要

### 2. 参加申請のステータス管理

**Decision**: Enumで`PENDING`, `APPROVED`, `REJECTED`の3状態を管理

**Rationale**:
- 明確な状態遷移: PENDING → APPROVED または REJECTED
- 拒否されたユーザーの再申請を許可するため、REJECTED状態のレコードは論理削除ではなく物理削除
- 既存の`SessionStatus` Enumパターンと一貫性を保つ

**Alternatives considered**:
- Boolean フラグ (`isApproved`, `isRejected`): 状態の組み合わせが曖昧になりやすい
- 4状態 (CANCELLED追加): 仕様上メンバー脱退機能がないため不要

### 3. プロジェクトメンバーシップの設計

**Decision**: `ProjectMember`中間テーブルでUser-Project多対多関係を表現

**Rationale**:
- 1ユーザーが複数プロジェクトに参加可能
- 1プロジェクトに複数メンバーが存在可能
- メンバーシップに追加属性（役割、参加日時）を持たせられる
- 既存の`Project.ownerId`はオーナー識別用に維持

**Alternatives considered**:
- Projectモデルに`memberIds`配列: Prismaでは扱いにくい、クエリ効率が低い
- 全メンバーをownerIdに含める: オーナーとメンバーの区別が困難

### 4. 招待URLのルーティング

**Decision**: `/invite/[inviteToken]` で参加申請ページにルーティング

**Rationale**:
- 既存の`/estimate/[shareToken]`パターンと一貫性
- 短くシンプルなURL構造
- inviteTokenでプロジェクトを特定できるため追加パラメータ不要

**Alternatives considered**:
- `/projects/[projectId]/invite?token=xxx`: projectIdの露出、長いURL
- `/join/[inviteToken]`: "invite"の方が招待の意図が明確

### 5. 認証リダイレクトの実装

**Decision**: NextAuth.jsのcallbackUrlパラメータを活用

**Rationale**:
- NextAuth.jsは`/api/auth/signin?callbackUrl=xxx`でリダイレクト先を指定可能
- 既存の認証フローを変更せずに対応可能
- ミドルウェアで未認証ユーザーを検出してリダイレクト

**Alternatives considered**:
- sessionStorageでURL保存: ブラウザ依存、信頼性が低い
- 独自リダイレクトロジック: 既存認証システムとの重複

### 6. カスケード削除の範囲

**Decision**: プロジェクト削除時に招待トークン・参加申請・メンバーシップも削除

**Rationale**:
- 仕様要件: 「プロジェクト削除時、関連する参加申請とメンバーシップは自動削除」
- Prismaの`onDelete: Cascade`で宣言的に実装
- 孤立データの防止

**Alternatives considered**:
- ソフトデリート: 履歴保持の要件がないため過剰
- 手動削除: 実装複雑化、削除漏れリスク

## 既存コードとの整合性

### 既存パターンの踏襲

| 項目 | 既存パターン | 本機能での適用 |
|------|-------------|---------------|
| トークン生成 | `generateShareToken()` | `generateInviteToken()`を同様に実装 |
| Enum定義 | `SessionStatus` | `JoinRequestStatus`を同様に定義 |
| 認証チェック | `getServerSession(authOptions)` | API routeで同様に使用 |
| カスケード削除 | `onDelete: Cascade` | 新モデルでも同様に設定 |

### 変更が必要な既存コード

| ファイル | 変更内容 |
|----------|----------|
| `prisma/schema.prisma` | 新モデル3つ追加、Project/Userにリレーション追加 |
| `lib/utils.ts` | `generateInviteToken()`関数追加 |
| `app/mypage/page.tsx` | 参加中プロジェクト表示セクション追加 |
| `app/projects/[projectId]/page.tsx` | メンバータブ、招待URL発行機能追加 |

## 技術的リスクと対策

| リスク | 影響度 | 対策 |
|--------|--------|------|
| 招待URLの総当たり攻撃 | 低 | 16文字トークンで十分な推測困難性、レートリミット検討 |
| 大量メンバーでのパフォーマンス | 低 | 100メンバー程度の想定、ページネーション不要 |
| 同時申請による重複 | 中 | ユニーク制約`[projectId, userId]`で防止 |
