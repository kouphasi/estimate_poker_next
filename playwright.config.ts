import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright設定
 * - E2Eテスト用の設定ファイル
 * - ヘッドレスモードでChromiumを使用
 * - CI環境では並列実行をサポート（シャーディング）
 */
export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // CI環境で.onlyを禁止
  retries: 0, // リトライなし (NFR-005)
  workers: process.env.CI ? 1 : undefined, // CI: 1ワーカー, ローカル: 自動
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['github'], // GitHub Actions用の注釈
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure', // 失敗時のみトレース保持
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  timeout: 5 * 60 * 1000, // 5分 (NFR-006)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2分でタイムアウト
  },
});
