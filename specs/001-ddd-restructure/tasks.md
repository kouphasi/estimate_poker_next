# Tasks: コードベースの保守性向上とアーキテクチャ明確化

**Input**: Design documents from `/specs/001-ddd-restructure/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contracts.md

**Tests**: 移行後に整備予定（FR-016）。本タスクリストではテストタスクは含まない。

**Organization**: ユーザーストーリーに基づいて構成。機能単位（認証→セッション→プロジェクト管理）で段階的に移行。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **src/**: ビジネスロジック層（domain, application, infrastructure）
- **app/**: プレゼンテーション層（Next.js App Router）
- Paths are relative to repository root

---

## Phase 1: Setup (プロジェクト構造準備)

**Purpose**: DDDレイヤードアーキテクチャの基盤ディレクトリ構造とTypeScript設定

- [x] T001 Create src/domain/ directory structure with user/, project/, session/ subdirectories
- [x] T002 [P] Create src/application/ directory structure with auth/, session/, project/, middleware/ subdirectories
- [x] T003 [P] Create src/infrastructure/ directory structure with database/repositories/, auth/ subdirectories
- [x] T004 Update tsconfig.json to add path aliases (@/domain/*, @/application/*, @/infrastructure/*)
- [x] T005 Verify TypeScript path aliases work with `npm run type-check`

**Checkpoint**: ディレクトリ構造とパスエイリアスが準備完了

---

## Phase 2: Foundational (共通基盤コンポーネント)

**Purpose**: すべての機能移行で使用する共通インフラストラクチャとドメイン基盤

**⚠️ CRITICAL**: このフェーズ完了前にユーザーストーリーの実装は開始できない

### 値オブジェクト（全機能で共有）

- [x] T006 [P] Create Email value object in src/domain/user/Email.ts
- [x] T007 [P] Create ShareToken value object in src/domain/session/ShareToken.ts
- [x] T008 [P] Create OwnerToken value object in src/domain/session/OwnerToken.ts
- [x] T009 [P] Create SessionStatus enum in src/domain/session/SessionStatus.ts

### Prismaクライアント移行

- [x] T010 Move lib/prisma.ts to src/infrastructure/database/prisma.ts
- [x] T011 Update all existing imports of lib/prisma.ts to use @/infrastructure/database/prisma

### 共通エラークラス

- [x] T012 [P] Create domain error classes in src/domain/errors/DomainError.ts (InvalidEmailError, InvalidTokenError, etc.)
- [x] T013 [P] Move lib/prisma-errors.ts to src/infrastructure/database/prismaErrors.ts

**Checkpoint**: 共通基盤コンポーネント準備完了 - ユーザーストーリー実装開始可能

---

## Phase 3: User Story 1 - 開発者がドメインロジックを明確に識別できる (Priority: P1) 🎯 MVP

**Goal**: DDDレイヤードアーキテクチャの基本構造を構築し、各レイヤーの責務を明確にする

**Independent Test**: src/ディレクトリを確認し、domain、application、infrastructure、各サブディレクトリが存在することを検証。開発者がドメインモデルを探す際に、迷わず該当ディレクトリにアクセスできる。

### ドメイン層エンティティ

- [x] T014 [P] [US1] Create User entity in src/domain/user/User.ts with canManageProjects(), canCreateSession(), isAuthenticated() methods
- [x] T015 [P] [US1] Create Project entity in src/domain/project/Project.ts with isOwnedBy(), canBeDeletedBy() methods
- [x] T016 [P] [US1] Create EstimationSession entity in src/domain/session/EstimationSession.ts with reveal(), hide(), finalize(), canBeControlledBy(), isActive(), isFinalized() methods
- [x] T017 [P] [US1] Create Estimate entity in src/domain/session/Estimate.ts with update(), belongsToSession() methods

### ドメイン層リポジトリインターフェース

- [x] T018 [P] [US1] Create UserRepository interface in src/domain/user/UserRepository.ts
- [x] T019 [P] [US1] Create ProjectRepository interface in src/domain/project/ProjectRepository.ts
- [x] T020 [P] [US1] Create SessionRepository interface in src/domain/session/SessionRepository.ts
- [x] T021 [P] [US1] Create EstimateRepository interface in src/domain/session/EstimateRepository.ts

### ドメインサービス

- [x] T022 [US1] Create EstimateCalculationService in src/domain/session/EstimateCalculationService.ts with calculateAverage(), calculateMedian(), findMin(), findMax() methods

### インフラストラクチャ層リポジトリ実装

- [x] T023 [P] [US1] Create PrismaUserRepository in src/infrastructure/database/repositories/PrismaUserRepository.ts implementing UserRepository
- [x] T024 [P] [US1] Create PrismaProjectRepository in src/infrastructure/database/repositories/PrismaProjectRepository.ts implementing ProjectRepository
- [x] T025 [P] [US1] Create PrismaSessionRepository in src/infrastructure/database/repositories/PrismaSessionRepository.ts implementing SessionRepository
- [x] T026 [P] [US1] Create PrismaEstimateRepository in src/infrastructure/database/repositories/PrismaEstimateRepository.ts implementing EstimateRepository

### インデックスファイル作成

- [x] T027 [P] [US1] Create index.ts barrel exports in src/domain/user/, src/domain/project/, src/domain/session/
- [x] T028 [P] [US1] Create index.ts barrel exports in src/infrastructure/database/repositories/

**Checkpoint**: DDDレイヤー構造が完成。開発者がドメインモデルを探す際、迷わずsrc/domain/にアクセスできる状態。

---

## Phase 4: User Story 2 - 既存機能が新しい構造で正常に動作する (Priority: P2)

**Goal**: 既存の全機能をDDDアーキテクチャに移行し、機能の破壊なくエンドユーザー体験を維持

**Independent Test**: 手動で主要フロー（ログイン、セッション作成、見積もり投稿）を実行して動作確認。すべての機能がリファクタリング前と同様に動作する。

### Phase 4.1: 認証機能の移行

#### アプリケーション層ユースケース

- [ ] T029 [P] [US2] Create CreateGuestUserUseCase in src/application/auth/CreateGuestUserUseCase.ts
- [ ] T030 [P] [US2] Create RegisterUseCase in src/application/auth/RegisterUseCase.ts
- [ ] T031 [P] [US2] Create LoginUseCase in src/application/auth/LoginUseCase.ts

#### インフラストラクチャ層認証設定

- [ ] T032 [US2] Move lib/auth/auth-options.ts to src/infrastructure/auth/nextAuthConfig.ts
- [ ] T033 [US2] Move lib/auth/auth-helpers.ts to src/infrastructure/auth/authHelpers.ts
- [ ] T034 [US2] Update NextAuth configuration to use LoginUseCase in CredentialsProvider

#### APIルート更新（認証）

- [ ] T035 [US2] Update app/api/users/route.ts to use CreateGuestUserUseCase (thin controller pattern)
- [ ] T036 [US2] Update app/api/auth/register/route.ts to use RegisterUseCase (thin controller pattern)
- [ ] T037 [US2] Update app/api/auth/[...nextauth]/route.ts to use new nextAuthConfig path

#### ミドルウェア移行

- [ ] T038 [US2] Create authMiddleware logic in src/application/middleware/authMiddleware.ts
- [ ] T039 [US2] Update middleware.ts at project root to reference src/application/middleware/authMiddleware.ts

#### 認証機能検証

- [ ] T040 [US2] Run `npm run type-check` to verify auth migration has no type errors
- [ ] T041 [US2] Run `npm run build` to verify auth migration builds successfully
- [ ] T042 [US2] Manual test: Guest login flow (simple-login page)
- [ ] T043 [US2] Manual test: Email/password registration and login flow
- [ ] T044 [US2] Manual test: Protected route access (mypage)

**Checkpoint**: 認証機能がDDDアーキテクチャで正常動作

---

### Phase 4.2: セッション管理機能の移行

#### アプリケーション層ユースケース

- [ ] T045 [P] [US2] Create CreateSessionUseCase in src/application/session/CreateSessionUseCase.ts
- [ ] T046 [P] [US2] Create GetSessionUseCase in src/application/session/GetSessionUseCase.ts
- [ ] T047 [P] [US2] Create DeleteSessionUseCase in src/application/session/DeleteSessionUseCase.ts
- [ ] T048 [P] [US2] Create SubmitEstimateUseCase in src/application/session/SubmitEstimateUseCase.ts
- [ ] T049 [P] [US2] Create ToggleRevealUseCase in src/application/session/ToggleRevealUseCase.ts
- [ ] T050 [P] [US2] Create FinalizeSessionUseCase in src/application/session/FinalizeSessionUseCase.ts

#### APIルート更新（セッション）

- [ ] T051 [US2] Update app/api/sessions/route.ts to use CreateSessionUseCase (thin controller pattern)
- [ ] T052 [US2] Update app/api/sessions/[shareToken]/route.ts GET to use GetSessionUseCase
- [ ] T053 [US2] Update app/api/sessions/[shareToken]/route.ts DELETE to use DeleteSessionUseCase
- [ ] T054 [US2] Update app/api/sessions/[shareToken]/estimates/route.ts to use SubmitEstimateUseCase
- [ ] T055 [US2] Update app/api/sessions/[shareToken]/reveal/route.ts to use ToggleRevealUseCase
- [ ] T056 [US2] Update app/api/sessions/[shareToken]/finalize/route.ts to use FinalizeSessionUseCase

#### セッション機能検証

- [ ] T057 [US2] Run `npm run type-check` to verify session migration has no type errors
- [ ] T058 [US2] Run `npm run build` to verify session migration builds successfully
- [ ] T059 [US2] Manual test: Create new session
- [ ] T060 [US2] Manual test: Join session and submit estimate
- [ ] T061 [US2] Manual test: Reveal/hide estimates (owner action)
- [ ] T062 [US2] Manual test: Finalize session

**Checkpoint**: セッション管理機能がDDDアーキテクチャで正常動作

---

### Phase 4.3: プロジェクト管理機能の移行

#### アプリケーション層ユースケース

- [ ] T063 [P] [US2] Create ListProjectsUseCase in src/application/project/ListProjectsUseCase.ts
- [ ] T064 [P] [US2] Create CreateProjectUseCase in src/application/project/CreateProjectUseCase.ts
- [ ] T065 [P] [US2] Create GetProjectUseCase in src/application/project/GetProjectUseCase.ts
- [ ] T066 [P] [US2] Create UpdateProjectUseCase in src/application/project/UpdateProjectUseCase.ts
- [ ] T067 [P] [US2] Create DeleteProjectUseCase in src/application/project/DeleteProjectUseCase.ts

#### APIルート更新（プロジェクト）

- [ ] T068 [US2] Update app/api/projects/route.ts GET to use ListProjectsUseCase
- [ ] T069 [US2] Update app/api/projects/route.ts POST to use CreateProjectUseCase
- [ ] T070 [US2] Update app/api/projects/[projectId]/route.ts GET to use GetProjectUseCase
- [ ] T071 [US2] Update app/api/projects/[projectId]/route.ts PUT to use UpdateProjectUseCase
- [ ] T072 [US2] Update app/api/projects/[projectId]/route.ts DELETE to use DeleteProjectUseCase
- [ ] T073 [US2] Update app/api/projects/[projectId]/sessions/route.ts to use new repository pattern

#### プロジェクト機能検証

- [ ] T074 [US2] Run `npm run type-check` to verify project migration has no type errors
- [ ] T075 [US2] Run `npm run build` to verify project migration builds successfully
- [ ] T076 [US2] Manual test: List projects (authenticated user)
- [ ] T077 [US2] Manual test: Create new project
- [ ] T078 [US2] Manual test: View project details
- [ ] T079 [US2] Manual test: Update project
- [ ] T080 [US2] Manual test: Delete project

**Checkpoint**: プロジェクト管理機能がDDDアーキテクチャで正常動作

---

### Phase 4.4: ユーティリティ移行と旧コード削除

#### ユーティリティ分散配置

- [ ] T081 [P] [US2] Move token generation functions from lib/utils.ts to src/domain/session/utils/tokenGenerator.ts
- [ ] T082 [P] [US2] Create src/infrastructure/utils/ for infrastructure-specific utilities if needed

#### 旧コード削除

- [ ] T083 [US2] Remove lib/ directory after verifying all imports are updated
- [ ] T084 [US2] Update any remaining imports throughout the codebase to use new paths
- [ ] T085 [US2] Run `npm run type-check` to verify all migrations complete with no type errors
- [ ] T086 [US2] Run `npm run lint` to verify code quality
- [ ] T087 [US2] Run `npm run build` to verify full build succeeds

**Checkpoint**: すべての既存機能がDDDアーキテクチャに移行完了。lib/ディレクトリ削除済み。

---

## Phase 5: User Story 3 - 開発者が新機能を適切なレイヤーに追加できる (Priority: P3)

**Goal**: 開発者が新機能追加時に各レイヤーの責務を理解し、適切な配置ができることを検証

**Independent Test**: 開発者がアーキテクチャドキュメントを参照し、新しいエンティティを5分以内に適切なレイヤーに追加できる。

### アーキテクチャドキュメント作成

- [ ] T088 [P] [US3] Create ARCHITECTURE.md at project root documenting DDD layer structure and responsibilities
- [ ] T089 [P] [US3] Update CLAUDE.md to reflect new DDD directory structure and development patterns

### レイヤー依存関係検証

- [ ] T090 [US3] Verify domain layer has no imports from infrastructure or app directories (dependency inversion principle)
- [ ] T091 [US3] Verify application layer imports only from domain layer (not infrastructure directly except via interfaces)

### インデックスファイル整備

- [ ] T092 [P] [US3] Create src/domain/index.ts barrel export for all domain entities and interfaces
- [ ] T093 [P] [US3] Create src/application/index.ts barrel export for all use cases
- [ ] T094 [P] [US3] Create src/infrastructure/index.ts barrel export for all infrastructure components

**Checkpoint**: アーキテクチャドキュメント完備。開発者が新機能追加ガイドラインを理解できる状態。

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 全体的な品質向上とクリーンアップ

- [ ] T095 [P] Run final `npm run type-check` and fix any remaining type errors
- [ ] T096 [P] Run final `npm run lint` and fix any linting issues
- [ ] T097 [P] Run final `npm run build` and verify production build succeeds
- [ ] T098 Full manual regression test: All user flows (guest login, auth login, session creation, estimation, project management)
- [ ] T099 Code cleanup: Remove any commented-out old code or unused imports
- [ ] T100 Verify all acceptance scenarios from spec.md are satisfied

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - 即時開始可能
- **Phase 2 (Foundational)**: Phase 1完了後 - **すべてのユーザーストーリーをブロック**
- **Phase 3 (US1)**: Phase 2完了後 - 構造構築
- **Phase 4 (US2)**: Phase 3完了後 - 機能移行（認証→セッション→プロジェクトの順）
- **Phase 5 (US3)**: Phase 4完了後 - ドキュメント・検証
- **Phase 6 (Polish)**: Phase 5完了後 - 最終品質確認

### User Story Dependencies

- **User Story 1 (P1)**: Foundational (Phase 2) 完了後開始可能 - 他のストーリーへの依存なし
- **User Story 2 (P2)**: User Story 1 完了後開始 - US1で作成したエンティティ・リポジトリを使用
- **User Story 3 (P3)**: User Story 2 完了後開始 - 完成したアーキテクチャをドキュメント化

### Within Each User Story

- ドメインエンティティ → リポジトリインターフェース → リポジトリ実装 → ユースケース → APIルート更新
- 各機能領域（認証/セッション/プロジェクト）は依存順に移行

### Parallel Opportunities

- Phase 1: T002, T003 は並列実行可能（異なるディレクトリ）
- Phase 2: T006, T007, T008, T009 は並列実行可能（異なるファイル）
- Phase 3: T014-T017 は並列実行可能（異なるエンティティファイル）
- Phase 3: T018-T021 は並列実行可能（異なるインターフェースファイル）
- Phase 3: T023-T026 は並列実行可能（異なるリポジトリ実装ファイル）
- Phase 4 各サブフェーズ: ユースケース作成タスクは並列実行可能

---

## Parallel Example: Phase 3 Domain Entities

```bash
# Launch all domain entity tasks together:
Task: "Create User entity in src/domain/user/User.ts"
Task: "Create Project entity in src/domain/project/Project.ts"
Task: "Create EstimationSession entity in src/domain/session/EstimationSession.ts"
Task: "Create Estimate entity in src/domain/session/Estimate.ts"

# Launch all repository interface tasks together:
Task: "Create UserRepository interface in src/domain/user/UserRepository.ts"
Task: "Create ProjectRepository interface in src/domain/project/ProjectRepository.ts"
Task: "Create SessionRepository interface in src/domain/session/SessionRepository.ts"
Task: "Create EstimateRepository interface in src/domain/session/EstimateRepository.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: DDDレイヤー構造が正しく構築されていることを確認
5. 開発者がドメインモデルを探す際に迷わないことを確認

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → DDDレイヤー構造完成 (MVP!)
3. Add User Story 2 Phase 4.1 → 認証機能移行完了
4. Add User Story 2 Phase 4.2 → セッション機能移行完了
5. Add User Story 2 Phase 4.3 → プロジェクト機能移行完了
6. Add User Story 2 Phase 4.4 → 旧コード削除完了
7. Add User Story 3 → ドキュメント・検証完了
8. Each phase adds value without breaking previous functionality

### Rollback Strategy (per FR-008)

- 各機能領域（認証/セッション/プロジェクト）の移行後にGitコミット
- 重大な問題発生時はGitブランチごと切り戻し
- 混在期間を設けないため、各機能は一気に完了させる

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- 各ユーザーストーリーは独立してテスト可能
- テストはFR-016に従い移行後に整備（本タスクリストには含まない）
- 各Phase/Subphase完了後にGitコミット推奨
- 認証→セッション→プロジェクトの順序は依存関係に基づく（FR-014）
- 避けること: 曖昧なタスク、同一ファイルの競合、ストーリー間の独立性を壊す依存関係
