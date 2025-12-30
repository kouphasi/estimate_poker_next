# Implementation Plan: テストインフラストラクチャの導入

**Branch**: `002-test-infrastructure` | **Date**: 2025-12-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-test-infrastructure/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Estimate Poker Nextプロジェクトに、開発者がコード変更の影響を即座に確認できる包括的な自動テスト環境を導入します。ユニットテスト、E2Eテスト、APIテストの3層構造で、CI/CD環境での自動実行とカバレッジレポート生成を実現します。

## Technical Context

**Language/Version**: TypeScript 5.9.3 (strict mode)
**Primary Dependencies**:
- Vitest (ユニットテスト・APIテスト): Next.js 16.x互換性が高い
- Playwright (E2Eテスト): クロスブラウザ対応、ヘッドレスモード対応
- @testing-library/react (コンポーネントテスト): React 19.x対応
- @vitest/coverage-v8 (カバレッジ計測)

**Storage**: PostgreSQL (テスト専用DB、Prisma経由)
**Testing**: Vitest + Playwright + node-mocks-http
**Target Platform**: Node.js 20.x (CI/CD), ローカル開発環境
**Project Type**: Web application (Next.js App Router)
**Performance Goals**:
- ユニットテスト: 全体で30秒以内
- E2Eテスト: 並列実行で5分以内
- CI/CDパイプライン: プッシュから10分以内に完了

**Constraints**:
- ユニットテスト個別タイムアウト: 30秒
- E2Eテスト個別タイムアウト: 5分
- カバレッジ目標: 60%以上（ファイルベース）
- GitHub Actions無料枠内での実行

**Scale/Scope**:
- テスト対象ファイル数: ~50-100ファイル（現在のコードベース）
- E2Eテストケース: 主要フロー3つ（ゲストログイン、認証ログイン、セッション作成）
- 並列実行: E2Eテストを4シャードに分割

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. ユーザー体験優先
- ✅ **準拠**: テストは開発者体験を向上させるためのもの。テスト失敗時の明確なエラーメッセージ、5分以内の問題特定を保証
- ✅ **準拠**: ローカルとCI環境で同じ方法で実行可能（NFR-001）、開発者の負担を最小化

### II. 認証とゲストの共存
- ✅ **準拠**: E2Eテストで両方のフローをカバー（FR-003）
- ✅ **準拠**: APIテストで認証トークンを使用した認証エンドポイントのテスト（FR-007）

### III. 型安全性とスキーマ駆動開発
- ✅ **準拠**: TypeScript strict modeでテストコードを記述
- ✅ **準拠**: データベーススキーマのマイグレーションテストを含む（FR-011）
- ✅ **準拠**: テストデータのセットアップ時にスキーマ整合性を検証（NFR-007）

### IV. シンプルさの維持
- ✅ **準拠**: 必要な機能のみ実装（ユニット、E2E、APIテストの3種類のみ）
- ✅ **準拠**: パフォーマンステスト、セキュリティテスト、ビジュアルリグレッションテストはOut of Scope
- ✅ **準拠**: テストフレームワークは最小限（Vitest + Playwright）

### V. 段階的リリース
- ✅ **準拠**: 3つのユーザーストーリーに優先度付け（P1: CI/CD自動実行、P2: ユニットテスト、P3: E2Eテスト）
- ✅ **準拠**: 各フェーズで独立してテスト可能

**評価結果**: ✅ 全てのゲートをクリア。例外なし。

## Project Structure

### Documentation (this feature)

```text
specs/002-test-infrastructure/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (技術選定とベストプラクティス)
├── data-model.md        # Phase 1 output (テストデータモデル)
├── quickstart.md        # Phase 1 output (テスト実行クイックスタート)
├── contracts/           # Phase 1 output (テストパターンとAPI契約)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Web application structure (Next.js App Router)
__tests__/
├── unit/                      # ユニットテスト
│   ├── lib/                  # ユーティリティ関数のテスト
│   ├── components/           # コンポーネントのテスト
│   └── api/                  # APIルートハンドラのテスト
├── e2e/                      # E2Eテスト
│   ├── guest-login.spec.ts   # ゲストログインフロー
│   ├── auth-login.spec.ts    # 認証ログインフロー
│   └── session-flow.spec.ts  # セッション作成・見積もりフロー
├── fixtures/                 # テストデータ
│   ├── users.ts             # ユーザーフィクスチャ
│   ├── sessions.ts          # セッションフィクスチャ
│   └── schema-validator.ts  # スキーマ検証ヘルパー
└── helpers/                  # テストヘルパー
    ├── db-setup.ts          # DB セットアップ・クリーンアップ
    ├── auth-helpers.ts      # 認証ヘルパー
    └── snapshot-helpers.ts  # スナップショットヘルパー

playwright.config.ts          # Playwright設定
vitest.config.ts             # Vitest設定
.github/workflows/ci.yaml    # CI/CDワークフロー（拡張）
```

**Structure Decision**:
- テストは`__tests__/`ディレクトリに集約（Next.jsの慣例に従う）
- ユニットテスト、E2Eテスト、フィクスチャ、ヘルパーを明確に分離
- 既存のCI/CDワークフロー（`.github/workflows/ci.yaml`）を拡張してテストステップを追加

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

コンスティチューション違反なし。このセクションは空です。
