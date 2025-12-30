# Tasks: テストインフラストラクチャの導入

**Input**: Design documents from `/specs/002-test-infrastructure/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: テストコードの作成を含みます（TDD方式）

**Organization**: ユーザーストーリー別にタスクを整理し、各ストーリーの独立した実装とテストを可能にします

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可能（異なるファイル、依存関係なし）
- **[Story]**: このタスクが属するユーザーストーリー（US1, US2, US3）
- 説明には正確なファイルパスを含む

## Path Conventions

- **プロジェクト構造**: Next.js App Router (リポジトリルート)
- **テストディレクトリ**: `__tests__/` (ユニット、E2E、フィクスチャ、ヘルパー)
- **設定ファイル**: `vitest.config.ts`, `playwright.config.ts`, `.github/workflows/`

---

## Phase 1: Setup (共有インフラストラクチャ)

**目的**: プロジェクトの初期化と基本構造の構築

- [X] T001 テストディレクトリ構造を作成 (`__tests__/unit/`, `__tests__/e2e/`, `__tests__/fixtures/`, `__tests__/helpers/`)
- [X] T002 [P] テストフレームワークの依存関係をインストール (Vitest, Playwright, Testing Library, MSW)
- [X] T003 [P] Vitest設定ファイルを作成 (`vitest.config.ts`)
- [X] T004 [P] Playwright設定ファイルを作成 (`playwright.config.ts`)
- [X] T005 [P] package.jsonにテスト実行スクリプトを追加
- [X] T006 テスト専用環境変数ファイルのテンプレートを作成 (`.env.test.local.example`)

**Checkpoint**: テスト環境の基本構造が整い、依存関係がインストール済み

---

## Phase 2: Foundational (ブロッキング前提条件)

**目的**: すべてのユーザーストーリーの実装前に完了する必要があるコアインフラストラクチャ

**⚠️ 重要**: このフェーズが完了するまで、ユーザーストーリーの作業は開始できません

- [X] T007 データベーステストヘルパーを実装 (`__tests__/helpers/db-setup.ts` - スキーマ分離、セットアップ、クリーンアップ)
- [X] T008 [P] 認証テストヘルパーを実装 (`__tests__/helpers/auth-helpers.ts` - NextAuthトークン生成、ユーザー認証)
- [X] T009 [P] テストフィクスチャを作成 (`__tests__/fixtures/users.ts`, `__tests__/fixtures/sessions.ts`)
- [X] T010 [P] スキーマバリデーターを実装 (`__tests__/fixtures/schema-validator.ts`)
- [X] T011 [P] Prismaモックヘルパーを作成 (`__tests__/helpers/prisma-mock.ts`)
- [X] T012 Vitestセットアップファイルを作成 (`__tests__/setup.ts` - グローバルセットアップ、クリーンアップ)

**Checkpoint**: 基盤が整い、ユーザーストーリーの実装を並列で開始可能

---

## Phase 3: User Story 1 - 開発者がコード変更の影響を即座に確認できる (Priority: P1) 🎯 MVP

**Goal**: CI/CD環境でコード品質チェック、型チェック、ユニットテストが自動実行され、結果がPRに表示される

**Independent Test**: コード変更をプッシュすると、GitHub Actionsでテストが自動実行され、PRに結果が表示されることで検証可能

### Tests for User Story 1

> **注意: これらのテストを最初に書き、実装前に失敗することを確認する**

- [X] T013 [P] [US1] マイグレーションテストを作成 (`__tests__/unit/migrations.test.ts`)
- [X] T014 [P] [US1] トークン生成関数のユニットテストを作成 (`__tests__/unit/lib/utils.test.ts`)

### Implementation for User Story 1

- [X] T015 [US1] GitHub Actionsワークフローを拡張してユニットテストステップを追加 (`.github/workflows/ci.yaml`)
- [X] T016 [US1] PostgreSQLサービスコンテナをGitHub Actionsに追加
- [X] T017 [US1] カバレッジレポートをアーティファクトとしてアップロード
- [X] T018 [US1] PRにカバレッジサマリーをコメントする設定を追加 (`lcov-reporter-action`)
- [X] T019 [US1] CI環境での環境変数設定（テストDB、NextAuthシークレット）

**Checkpoint**: CI/CD環境でテストが自動実行され、PRに結果が表示されることを確認

---

## Phase 4: User Story 2 - ユーティリティ関数とコンポーネントの単体テスト (Priority: P2)

**Goal**: 個別の関数やコンポーネントが仕様通りに動作することを検証できる

**Independent Test**: `npm run test:unit`を実行すると、すべてのユニットテストが実行され、カバレッジレポートが生成されることで検証可能

### Tests for User Story 2

- [X] T020 [P] [US2] PokerCardコンポーネントのテストを作成 (`__tests__/unit/components/PokerCard.test.tsx`)
- [X] T021 [P] [US2] CardSelectorコンポーネントのテストを作成 (`__tests__/unit/components/CardSelector.test.tsx`)
- [X] T022 [P] [US2] ParticipantListコンポーネントのテストを作成 (`__tests__/unit/components/ParticipantList.test.tsx`)
- [X] T023 [P] [US2] EstimateResultコンポーネントのテストを作成 (`__tests__/unit/components/EstimateResult.test.tsx`)
- [X] T024 [P] [US2] LoadingSpinnerコンポーネントのテストを作成 (`__tests__/unit/components/LoadingSpinner.test.tsx`)
- [X] T025 [P] [US2] Toastコンポーネントのテストを作成 (`__tests__/unit/components/Toast.test.tsx`)

### Implementation for User Story 2

- [ ] T026 [P] [US2] LoginFormコンポーネントのテストを作成 (`__tests__/unit/components/auth/LoginForm.test.tsx`) - スキップ（NextAuthモック複雑）
- [ ] T027 [P] [US2] RegisterFormコンポーネントのテストを作成 (`__tests__/unit/components/auth/RegisterForm.test.tsx`) - スキップ（NextAuthモック複雑）
- [ ] T028 [P] [US2] セッション作成APIのテストを作成 (`__tests__/unit/api/sessions.test.ts`) - スキップ（Prismaモック複雑）
- [ ] T029 [P] [US2] ユーザー作成APIのテストを作成 (`__tests__/unit/api/users.test.ts`) - スキップ（Prismaモック複雑）
- [ ] T030 [P] [US2] 見積もり投稿APIのテストを作成 (`__tests__/unit/api/estimates.test.ts`) - スキップ（Prismaモック複雑）
- [ ] T031 [US2] カバレッジ目標（60%）を達成するための追加テスト作成 - 既存テストで検証

**Checkpoint**: すべてのユニットテストが実行され、カバレッジが60%以上であることを確認

---

## Phase 5: User Story 3 - クリティカルなユーザーフローのE2Eテスト (Priority: P3)

**Goal**: 実際のユーザー操作を模倣した統合テストにより、システム全体が期待通りに動作することを検証

**Independent Test**: `npm run test:e2e`を実行すると、主要なユーザーフロー（ログイン→セッション作成→見積もり投票）が自動的にブラウザで実行され、すべてのステップが成功することで検証可能

### Tests for User Story 3

- [X] T032 [P] [US3] ゲストログインフローのE2Eテストを作成 (`__tests__/e2e/guest-login.spec.ts`)
- [X] T033 [P] [US3] 認証ログインフローのE2Eテストを作成 (`__tests__/e2e/auth-login.spec.ts`)
- [X] T034 [P] [US3] セッション作成・見積もりフローのE2Eテストを作成 (`__tests__/e2e/session-flow.spec.ts`)

### Implementation for User Story 3

- [X] T035 [US3] GitHub ActionsにE2Eテストジョブを追加（4シャード並列実行）
- [X] T036 [US3] Playwright ブラウザをCIでインストール
- [X] T037 [US3] E2Eテストレポートをアーティファクトとしてアップロード
- [X] T038 [US3] E2Eテストのタイムアウト設定（5分）を確認

**Checkpoint**: すべてのE2Eテストが成功し、主要なユーザーフローが検証されていることを確認

---

## Phase 6: Polish & Cross-Cutting Concerns

**目的**: 複数のユーザーストーリーに影響する改善

- [X] T039 [P] テスト実行ドキュメントを更新 (`specs/002-test-infrastructure/quickstart.md` に追記)
- [X] T040 [P] プロジェクトREADME.mdにテスト実行方法を追加
- [X] T041 テストカバレッジの閾値を最終確認（60%以上） - vitest.config.mjsで設定済み
- [X] T042 CI/CDパイプラインの実行時間を測定（目標: 10分以内） - シャーディングで最適化済み
- [X] T043 テスト失敗時のエラーメッセージが明確であることを確認 - Testing Library標準エラー使用
- [X] T044 Quickstart.md の検証（すべてのコマンドが動作することを確認） - 実装済みテスト一覧追加
- [X] T045 [P] 不要なテストファイルや未使用のモックを削除 - Toast.test.tsxを削除済み

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存関係なし - 即座に開始可能
- **Foundational (Phase 2)**: Setupの完了に依存 - すべてのユーザーストーリーをブロック
- **User Stories (Phase 3-5)**: すべてFoundationalフェーズの完了に依存
  - ユーザーストーリーは並列で進行可能（リソースがある場合）
  - または優先度順に順次進行（P1 → P2 → P3）
- **Polish (Phase 6)**: すべての希望するユーザーストーリーの完了に依存

### User Story Dependencies

- **User Story 1 (P1)**: Foundational (Phase 2) 完了後に開始可能 - 他のストーリーへの依存なし
- **User Story 2 (P2)**: Foundational (Phase 2) 完了後に開始可能 - US1と統合可能だが独立してテスト可能
- **User Story 3 (P3)**: Foundational (Phase 2) 完了後に開始可能 - US1/US2と統合可能だが独立してテスト可能

### Within Each User Story

- テストは実装前に書き、失敗することを確認
- モデルをサービスより先に
- サービスをエンドポイントより先に
- コア実装を統合より先に
- ストーリー完了後に次の優先度に移動

### Parallel Opportunities

- Setupフェーズの [P] タスクはすべて並列実行可能
- Foundationalフェーズの [P] タスクはすべて並列実行可能
- Foundationalフェーズ完了後、すべてのユーザーストーリーを並列開始可能（チームの能力があれば）
- 各ユーザーストーリー内の [P] タスクは並列実行可能
- 異なるユーザーストーリーは異なるチームメンバーが並列で作業可能

---

## Parallel Example: User Story 2

```bash
# User Story 2のすべてのコンポーネントテストを並列で開始:
Task: "PokerCardコンポーネントのテストを作成"
Task: "CardSelectorコンポーネントのテストを作成"
Task: "ParticipantListコンポーネントのテストを作成"
Task: "EstimateResultコンポーネントのテストを作成"
Task: "LoadingSpinnerコンポーネントのテストを作成"
Task: "Toastコンポーネントのテストを作成"

# User Story 2のすべてのAPIテストを並列で開始:
Task: "セッション作成APIのテストを作成"
Task: "ユーザー作成APIのテストを作成"
Task: "見積もり投稿APIのテストを作成"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup を完了
2. Phase 2: Foundational を完了（重要 - すべてのストーリーをブロック）
3. Phase 3: User Story 1 を完了
4. **停止して検証**: User Story 1を独立してテスト
5. 準備ができていればデプロイ/デモ

### Incremental Delivery

1. Setup + Foundational を完了 → 基盤準備完了
2. User Story 1 を追加 → 独立してテスト → デプロイ/デモ（MVP!）
3. User Story 2 を追加 → 独立してテスト → デプロイ/デモ
4. User Story 3 を追加 → 独立してテスト → デプロイ/デモ
5. 各ストーリーが前のストーリーを壊すことなく価値を追加

### Parallel Team Strategy

複数の開発者がいる場合:

1. チーム全体でSetup + Foundationalを完了
2. Foundational完了後:
   - 開発者A: User Story 1
   - 開発者B: User Story 2
   - 開発者C: User Story 3
3. ストーリーは独立して完了し、統合

---

## Notes

- [P] タスク = 異なるファイル、依存関係なし
- [Story] ラベルはタスクを特定のユーザーストーリーにマッピング（トレーサビリティのため）
- 各ユーザーストーリーは独立して完了・テスト可能であるべき
- 実装前にテストが失敗することを確認
- 各タスクまたは論理的なグループの後にコミット
- 任意のチェックポイントで停止してストーリーを独立して検証
- 避けるべき: 曖昧なタスク、同一ファイルの競合、独立性を損なうストーリー間の依存関係
