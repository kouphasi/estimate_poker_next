# Implementation Plan: プロジェクト共有機能

**Branch**: `001-project-sharing` | **Date**: 2025-12-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-project-sharing/spec.md`

## Summary

ログインユーザー間でプロジェクトを共有する機能を実装する。プロジェクトオーナーが招待URLを発行し、他のログインユーザーが参加申請を行い、オーナーが承認/拒否することでメンバーを管理する。既存のPrismaスキーマを拡張し、Next.js App RouterのページとAPIルートを追加する。

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16.x (App Router), React 19.x, NextAuth.js v4.x, Prisma 6.x
**Storage**: PostgreSQL (via Prisma ORM)
**Testing**: 手動テスト（将来的にPlaywright E2Eテスト追加予定）
**Target Platform**: Web (Vercel deployment)
**Project Type**: Web application (Next.js monolith)
**Performance Goals**: ページ読み込み3秒以内、招待URLから参加完了まで2分以内
**Constraints**: 既存の認証システム（NextAuth.js）を活用、ゲストユーザーは対象外
**Scale/Scope**: 1プロジェクトあたり最大100メンバー程度を想定

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原則 | ステータス | 確認内容 |
|------|------------|----------|
| I. ユーザー体験優先 | ✅ PASS | 招待URLから2分以内で参加完了、1クリック承認/拒否 |
| II. 認証とゲストの共存 | ✅ PASS | ログインユーザーのみ対象、権限チェックをAPIで実施 |
| III. 型安全性とスキーマ駆動開発 | ✅ PASS | Prismaマイグレーションで新モデル追加、型定義必須 |
| IV. シンプルさの維持 | ✅ PASS | 最小限の機能（招待・申請・承認のみ）、通知機能は除外 |
| V. 段階的リリース | ✅ PASS | 5つのユーザーストーリーを優先度順に独立実装可能 |

## Project Structure

### Documentation (this feature)

```text
specs/001-project-sharing/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api-routes.md    # API endpoint definitions
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
app/
├── api/
│   └── projects/
│       └── [projectId]/
│           ├── invite/
│           │   └── route.ts         # POST: 招待URL発行
│           ├── join-requests/
│           │   └── route.ts         # GET: リクエスト一覧, POST: 申請作成
│           │   └── [requestId]/
│           │       └── route.ts     # PATCH: 承認/拒否
│           └── members/
│               └── route.ts         # GET: メンバー一覧
│               └── [memberId]/
│                   └── route.ts     # DELETE: メンバー削除
├── projects/
│   └── [projectId]/
│       ├── page.tsx                 # プロジェクト詳細（メンバータブ追加）
│       └── members/
│           └── page.tsx             # メンバー管理画面
├── invite/
│   └── [inviteToken]/
│       └── page.tsx                 # 参加申請ページ
└── mypage/
    └── page.tsx                     # マイページ（参加中プロジェクト表示追加）

prisma/
└── schema.prisma                    # 新モデル追加

lib/
└── utils.ts                         # generateInviteToken() 追加
```

**Structure Decision**: Next.js App Router構造を使用。既存の`app/`ディレクトリ配下にAPI routesとページを追加。Prismaスキーマを拡張して新しいモデルを追加。

## Complexity Tracking

> **Constitution Check violations: None**

該当なし。全ての原則に準拠している。
