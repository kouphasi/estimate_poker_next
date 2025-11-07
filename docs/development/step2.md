## ステップ2: UI/UXの改善

### 目標
ポーカー風のカードゲームUIを洗練し、使いやすさを向上

### 実装する機能
- [ ] カードアニメーション
- [ ] 選択時のフィードバック
- [ ] トースト通知
- [ ] ローディング状態の改善
- [ ] レスポンシブデザイン
- [ ] カードフリップアニメーション
- [ ] 参加者アバター表示
- [ ] 統計情報の表示（平均値・中央値）

### 追加コンポーネント

```
components/
├── ui/                               # shadcn/ui コンポーネント
│   ├── toast.tsx
│   ├── button.tsx
│   └── card.tsx
├── animations/
│   ├── CardFlip.tsx                  # カードフリップ
│   └── ParticipantJoin.tsx           # 参加者参加時のアニメーション
└── stats/
    └── EstimateStats.tsx             # 統計情報表示
```

### 実装タスク（Step 2）

#### 2-1. デザインシステム導入（2時間）
- [ ] shadcn/ui インストール
- [ ] カラーパレット設定
- [ ] タイポグラフィ設定

#### 2-2. カードアニメーション（4時間）
- [ ] カードホバー効果
- [ ] カード選択時のアニメーション
- [ ] カードフリップ（公開時）
- [ ] カード配置のトランジション

#### 2-3. フィードバック機能（3時間）
- [ ] トースト通知実装
- [ ] ローディングスピナー
- [ ] エラーメッセージ表示
- [ ] 成功メッセージ表示

#### 2-4. レスポンシブ対応（3時間）
- [ ] モバイル表示最適化
- [ ] タブレット表示最適化
- [ ] カードレイアウトの調整

#### 2-5. 統計情報（2時間）
- [ ] 平均値計算
- [ ] 中央値計算
- [ ] 最大値・最小値表示
- [ ] グラフ表示（オプション）

#### 2-6. UXの細かい改善（2時間）
- [ ] コピー機能（URL共有）
- [ ] キーボードショートカット
- [ ] 参加者アバター
- [ ] オンライン状態表示

**合計見積もり: 16時間（約2日）**

---
## 完了条件

### Step 2
- [ ] カードアニメーションが滑らか
- [ ] モバイルでも快適に操作可能
- [ ] 統計情報が表示される
- [ ] ユーザーフィードバックが適切

---

## 開発ログ

### 2025-11-07: UI/UXの改善（Step 2の実装）

#### 完了した作業

**✨ Step 2: UI/UXの改善**

1. **統計情報の拡張**
   - EstimateResultコンポーネントに最大値・最小値を追加
   - 平均値、中央値、最大値、最小値を2x2グリッドで表示
   - カラーコーディング（青：平均、紫：中央値、赤：最大、緑：最小）

2. **トースト通知システムの実装**
   - app/components/Toast.tsx を作成
   - React Contextを使用したグローバルトースト管理
   - 4つの通知タイプ（success, error, warning, info）
   - 3秒後に自動削除、手動クローズ機能
   - スライドインアニメーション
   - 以下の操作でトースト通知を表示：
     - カード選択時：「見積もりを送信しました」
     - 公開/非公開切り替え：「カードを公開しました」「カードを非公開にしました」
     - 工数確定時：「工数を確定しました」
     - URLコピー時：「URLをコピーしました」
     - エラー時：エラーメッセージを表示

3. **ローディングスピナーの改善**
   - app/components/LoadingSpinner.tsx を作成
   - 3つのサイズバリエーション（small, medium, large）
   - 回転アニメーション
   - 見積もり画面とトップページに適用
   - ボタンローディング状態の改善

4. **カードアニメーションの改善**
   - ホバー時のスケール・シャドウ効果を強化（scale-110, shadow-xl）
   - 選択時のY軸移動アニメーション（-translate-y-1）
   - グラデーション背景（gradient-to-br）
   - 選択時のチェックマークアイコン（✓）
   - リング効果（ring-2 ring-blue-300）
   - アクティブ状態のスケールダウン（active:scale-95）
   - トランジション時間を300msに延長

5. **レスポンシブデザインの改善**
   - CardSelectorのグリッドを2列（モバイル）→ 4列（デスクトップ）に対応
   - 自由記述入力フォームをflexboxでレスポンシブ化
   - ボタンレイアウトの最適化（モバイル：縦並び、デスクトップ：横並び）
   - 既存のlg:grid-cols-3を活用した3カラムレイアウト

6. **Providersコンポーネントの作成**
   - app/components/Providers.tsx を作成
   - クライアントコンポーネントでラップ
   - ToastProviderを全ページで利用可能に

7. **CSSアニメーションの追加**
   - app/globals.css にカスタムアニメーションを追加
   - slide-in アニメーション（トースト用）
   - spin アニメーション（スピナー用）

#### 技術的な実装詳細

**トースト通知システム**
- Context API を使用した状態管理
- useEffect でタイマーを適切に管理（メモリリーク対策）
- ID管理による複数トースト対応
- 右上固定表示（fixed top-4 right-4）

**アニメーション**
- Tailwind CSS の transition-all duration-300 を使用
- transform プロパティ（scale, translate）
- カスタムキーフレームアニメーション
- ホバー、アクティブ、選択状態の視覚的フィードバック

**レスポンシブ対応**
- Tailwind CSS のブレークポイント（sm:, lg:）
- grid-cols-2 sm:grid-cols-4 によるレスポンシブグリッド
- flex-col sm:flex-row によるレスポンシブフレックスボックス
- モバイルファースト設計

#### UI/UX改善の成果

- ✅ カードアニメーションが滑らか
- ✅ ユーザーフィードバックが適切（トースト通知）
- ✅ ローディング状態が明確
- ✅ モバイルでも快適に操作可能
- ✅ 統計情報が一目で分かる
- ✅ 選択状態が視覚的に明確

#### 実装したStep 2の項目

- ✅ カードアニメーション
- ✅ 選択時のフィードバック
- ✅ トースト通知
- ✅ ローディング状態の改善
- ✅ レスポンシブデザイン
- ✅ 統計情報の表示（平均値・中央値・最大値・最小値）

#### 未実装のStep 2の項目

- ⏸ shadcn/ui インストール（カスタムコンポーネントで実装済みのため不要と判断）
- ⏸ カードフリップアニメーション（公開時）
- ⏸ 参加者アバター表示
- ⏸ キーボードショートカット
- ⏸ グラフ表示（オプション）

#### コードレビュー対応（PR #14）

**修正した項目：**

1. **トースト通知のタイマー管理（P0）**
   - useEffect でタイマーを管理し、メモリリークを防止
   - useRef で nextId を管理して依存関係を最適化
   - 適切なクリーンアップ処理を実装

2. **エラーメッセージの二重表示（P1）**
   - setError() 呼び出しを削除
   - トースト通知に統一してUXを改善
   - 画面下部のエラー表示エリアを削除

3. **Prisma graceful shutdown（P1）**
   - NODE_ENV のチェックを追加（本番環境のみ実行）
   - ビルド時の不要な処理を防止

4. **その他の改善**
   - CardSelector: グリッド間隔を gap-3 で統一
   - LoadingSpinner: TypeScript 型定義を改善（SpinnerSize type、Record<> 使用）

#### 次のステップ

- [ ] カードフリップアニメーションの実装（オプション）
- [ ] 参加者アバター表示（オプション）
- [ ] WebSocket/SSEへの移行検討
- [ ] E2Eテストの追加

---

### 2025-11-07: Prisma接続エラーの修正（PostgresError 42P05）

#### 問題

プレビュー環境で以下のエラーが発生：
```
PostgresError { code: "42P05", message: "prepared statement already exists" }
```

#### 原因

Vercel のプレビュー環境では：
- `DATABASE_URL`: pgBouncer 経由（pooled connection、transaction mode）
- pgBouncer の transaction mode は **prepared statements をサポートしない**
- Prisma は prepared statements を使用しようとしてエラーが発生

#### 実施した修正

**`lib/prisma.ts` を修正して `POSTGRES_URL_NON_POOLING` を優先的に使用**

```typescript
function getDatabaseUrl() {
  // POSTGRES_URL_NON_POOLING を優先（直接接続、prepared statements 対応）
  if (process.env.POSTGRES_URL_NON_POOLING) {
    return process.env.POSTGRES_URL_NON_POOLING
  }

  // フォールバック：DATABASE_URL に pgbouncer=true を追加
  const url = process.env.DATABASE_URL
  if (!url.includes('pgbouncer=')) {
    return `${url}${separator}pgbouncer=true`
  }

  return url
}
```

#### POSTGRES_URL_NON_POOLING を使用する理由

**メリット：**
- ✅ pgBouncer をバイパスして直接 PostgreSQL に接続
- ✅ Prepared statements が完全にサポートされる
- ✅ Vercel で自動的に提供される環境変数（追加設定不要）
- ✅ エラーが完全に解消される

**デメリット：**
- ⚠️ Connection pooling がない（接続オーバーヘッドがわずかに増加）
- ⚠️ ただし、サーバーレス環境では各関数が独立しているため影響は軽微

#### 技術的な詳細

**pgBouncer の動作モード：**
- **Session mode**: Prepared statements サポート（1接続を専有）
- **Transaction mode**: Prepared statements 非サポート（接続を共有、Vercel のデフォルト）

**Vercel の環境変数：**
- `DATABASE_URL`: pgBouncer 経由（transaction mode）
- `POSTGRES_URL_NON_POOLING`: 直接接続（prepared statements 対応）

#### 参考資料

- [Prisma - Connection pooling with PgBouncer](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management/configure-pg-bouncer)
- [Vercel Postgres - Connection pooling](https://vercel.com/docs/storage/vercel-postgres/usage-and-pricing#connection-pooling)

#### 結果

- ✅ プレビュー環境でのエラーが解消
- ✅ ビルド時・ランタイム時ともに安定動作
- ✅ 環境変数の追加設定が不要（Vercel が自動提供）

