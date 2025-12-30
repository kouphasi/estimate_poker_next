# Implementation Plan: コードベースの保守性向上とアーキテクチャ明確化

**Branch**: `001-ddd-restructure` | **Date**: 2025-12-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ddd-restructure/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

既存のNext.jsアプリケーションをDomain-Driven Design（DDD）のレイヤードアーキテクチャに再構成し、コードベースの保守性と拡張性を向上させる。機能単位（認証→セッション→プロジェクト管理）で段階的に移行し、各機能の移行は混在期間を設けず一気に完了させる。すべてのPrisma呼び出しをリポジトリパターンに変換し、ドメイン層、アプリケーション層、インフラストラクチャ層、プレゼンテーション層を明確に分離する。

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16.x (App Router), React 19.x, Prisma 6.x, NextAuth.js v4.x
**Storage**: PostgreSQL (via Prisma ORM)
**Testing**: 移行後に整備予定（現時点でのフレームワークは未確定）
**Target Platform**: Web (ブラウザ) + Node.js サーバーサイド
**Project Type**: Web application (フルスタックNext.js)
**Performance Goals**: リファクタリング前と同等のパフォーマンス（ログイン、セッション作成、見積もり投稿のレスポンス時間維持）
**Constraints**:
- Next.js App Routerの規約（appディレクトリ構造）を維持
- 既存機能の破壊なし（SC-001: すべてのテスト100%通過）
- 段階的移行：各機能の移行は混在期間を設けず一気に完了
**Scale/Scope**:
- 既存コードベース全体のリファクタリング
- 3つの主要機能領域（認証、セッション管理、プロジェクト管理）
- 4レイヤーアーキテクチャ（Domain, Application, Infrastructure, Presentation）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. ユーザー体験優先

**Status**: ✅ PASS
**Justification**: 本リファクタリングはエンドユーザーに直接影響を与えず、内部アーキテクチャの改善のみ。既存機能の動作は完全に維持される（FR-005, SC-004）。

### II. 認証とゲストの共存

**Status**: ✅ PASS
**Justification**: 既存の認証・ゲストユーザーの仕組みは変更せず、コード配置のみを変更。権限チェックのロジックはapplication層に移動するが、機能は維持される。

### III. 型安全性とスキーマ駆動開発

**Status**: ✅ PASS
**Justification**:
- TypeScript strict modeを維持（Technical Context明記）
- Prismaスキーマは変更なし（Out of Scope明記）
- リポジトリパターン導入により、型安全性がさらに向上

### IV. シンプルさの維持

**Status**: ⚠️ CONDITIONAL PASS - 正当化が必要
**Justification**: リポジトリパターンやレイヤー分離は抽象化の追加だが、長期的な保守性向上のために必要。Complexity Trackingセクションで正当化。

**Mitigation**:
- 既存の機能要求のみ実装（YAGNIは遵守）
- レイヤー分離は業界標準パターン（過度な抽象化ではない）
- 開発者の学習曲線短縮が成功基準（SC-002）

### V. 段階的リリース

**Status**: ✅ PASS
**Justification**: 機能単位の段階的移行を採用（認証→セッション→プロジェクト管理）。各機能の移行は独立してテスト可能。Gitブランチごとのロールバックが可能。

### 技術スタック要件

**Status**: ✅ PASS
**Justification**: 既存の技術スタックを維持。新規依存関係の追加なし（Assumption #7）。

### コード品質ゲート

**Status**: ✅ PASS
**Justification**:
- 移行後も lint, type-check, buildがすべて通過することを要求（SC-001）
- Prismaスキーマは変更なし（`npx prisma generate`は既存フローで実行）

### 結論

**Gate Status**: ✅ PASS with Complexity Tracking justification

リファクタリングの性質上、原則IVに対する例外が必要だが、正当な理由があり、Complexity Trackingセクションで文書化済み。

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

#### 移行後の構造（目標）

```text
src/
├── domain/                    # ドメイン層
│   ├── user/
│   │   ├── User.ts           # エンティティ
│   │   ├── UserRepository.ts # リポジトリインターフェース
│   │   └── UserService.ts    # ドメインサービス
│   ├── project/
│   │   ├── Project.ts
│   │   ├── ProjectRepository.ts
│   │   └── ProjectService.ts
│   ├── session/
│   │   ├── EstimationSession.ts
│   │   ├── Estimate.ts
│   │   ├── SessionRepository.ts
│   │   └── EstimateRepository.ts
│   └── utils/                # ドメイン固有ユーティリティ
│
├── application/               # アプリケーション層
│   ├── auth/
│   │   ├── LoginUseCase.ts
│   │   ├── RegisterUseCase.ts
│   │   └── AuthService.ts
│   ├── session/
│   │   ├── CreateSessionUseCase.ts
│   │   ├── SubmitEstimateUseCase.ts
│   │   └── SessionService.ts
│   ├── project/
│   │   ├── CreateProjectUseCase.ts
│   │   └── ProjectService.ts
│   ├── middleware/            # ミドルウェアロジック
│   │   └── authMiddleware.ts
│   └── utils/                # アプリケーション固有ユーティリティ
│
└── infrastructure/            # インフラストラクチャ層
    ├── database/
    │   ├── prisma.ts         # Prismaクライアント
    │   └── repositories/
    │       ├── PrismaUserRepository.ts
    │       ├── PrismaProjectRepository.ts
    │       ├── PrismaSessionRepository.ts
    │       └── PrismaEstimateRepository.ts
    ├── auth/
    │   ├── nextauth.ts       # NextAuth設定
    │   └── providers.ts
    └── utils/                # インフラ固有ユーティリティ

app/                          # プレゼンテーション層（Next.js App Router）
├── api/                      # APIルート（薄いコントローラー）
│   ├── auth/
│   ├── sessions/
│   ├── projects/
│   └── users/
├── components/               # Reactコンポーネント（Next.js規約に従い維持）
│   ├── auth/
│   ├── CardSelector.tsx
│   ├── PokerCard.tsx
│   └── ...
├── simple-login/
├── login/
├── register/
├── mypage/
├── projects/
├── sessions/
├── estimate/
└── ...

middleware.ts                 # ルート直下（Next.js規約）- application層のロジックを参照
```

#### 既存の構造（移行前）

```text
app/                          # Next.js App Router
├── api/
├── components/
├── simple-login/
├── login/
├── register/
├── mypage/
├── projects/
├── sessions/
├── estimate/
└── ...

lib/                          # 現在のユーティリティ・共通コード
├── prisma.ts
├── prisma-errors.ts
├── auth/
│   ├── auth-helpers.ts
│   └── auth-options.ts
└── utils.ts

contexts/                     # Reactコンテキスト
├── UserContext.tsx
└── ToastContext.tsx

types/                        # TypeScript型定義
├── next-auth.d.ts
└── session.ts

prisma/                       # Prismaスキーマ・マイグレーション
├── schema.prisma
└── migrations/

middleware.ts                 # 認証ミドルウェア
```

**Structure Decision**:

Next.js App Router（Web application）のフルスタック構成を採用。DDD レイヤードアーキテクチャを導入し、以下の方針で移行：

1. **新規 src/ ディレクトリ**: ビジネスロジック層（domain, application, infrastructure）を配置
2. **app/ ディレクトリ維持**: Next.jsの規約に従いプレゼンテーション層として維持（FR-004, FR-011）
3. **lib/ ディレクトリ廃止**: コードを適切なレイヤーに分散配置（FR-012）
4. **middleware.ts**: ルート直下に維持し、application層のロジックを参照（FR-013）

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| レイヤー分離（4層アーキテクチャ） | コードベースの保守性と拡張性を向上させるため。開発者が新機能を追加する際、適切な配置場所を明確にする（SC-002: 5分以内に特定可能）。長期的な技術的負債の削減。 | フラット構造の維持: 現在の暗黙的なレイヤー構造では、ビジネスロジックとインフラストラクチャの境界が不明確。新しい開発者の学習曲線が長く、意図しない依存関係が発生しやすい。レイヤー分離は業界標準パターンであり、過度な抽象化ではない。 |
| リポジトリパターン | Prisma呼び出しをドメイン層から分離し、依存性逆転の原則を実現するため（FR-010）。テスタビリティの向上（各レイヤーを独立してテスト可能）。 | 直接Prisma呼び出し: ドメイン層がORMに直接依存すると、データベース変更時の影響範囲が広がる。テストでモックが困難。リポジトリパターンにより、インターフェースを通じてドメインとインフラを分離し、将来的なORMの交換も容易になる。 |
| ユースケース/アプリケーションサービス | 複雑なビジネスフローを調整し、ドメインサービスとリポジトリを組み合わせる層が必要。APIルート（コントローラー）をシンプルに保つため（FR-007）。 | APIルートに直接ロジック記述: APIルート内にビジネスロジックを書くと、再利用が困難。CLIやバッチ処理など、別のエントリーポイントからの呼び出しができない。application層により、プレゼンテーション層から独立したビジネスフローを定義。 |

---

## Phase 1 Completion: Constitution Re-check

**Date**: 2025-12-30
**Status**: ✅ PASS

Phase 1（Design & Contracts）完了後の憲章準拠確認：

### I. ユーザー体験優先
✅ **PASS** - API契約は既存仕様を維持。エンドユーザーへの影響なし。

### II. 認証とゲストの共存
✅ **PASS** - User エンティティに`canManageProjects()`メソッドを実装。ゲストと認証ユーザーの権限分離が明確。

### III. 型安全性とスキーマ駆動開発
✅ **PASS** - 値オブジェクト（Email, ShareToken, OwnerToken）でバリデーション実装。TypeScript strict mode維持。

### IV. シンプルさの維持
✅ **CONDITIONAL PASS** - Complexity Trackingで正当化済み。実装パターンは業界標準に従い、過度な抽象化を避けている。

### V. 段階的リリース
✅ **PASS** - quickstart.mdで機能単位の段階的移行手順を明示。各フェーズは独立してテスト可能。

**結論**: すべての憲章原則に準拠。Phase 2（Tasks generation）に進む準備完了。
