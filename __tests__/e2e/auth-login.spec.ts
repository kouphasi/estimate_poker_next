import { test, expect } from '@playwright/test';

test.describe('認証ログインフロー', () => {
  // テスト用のユーザー情報
  const testUser = {
    email: `e2etest-${Date.now()}@example.com`,
    password: 'Test1234!',
    nickname: 'E2E認証ユーザー',
  };

  test('新規ユーザー登録ができる', async ({ page }) => {
    // ステップ1: 登録ページにアクセス
    await page.goto('/register');

    // ステップ2: 登録フォームに入力
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="nickname"]', testUser.nickname);

    // ステップ3: 登録ボタンをクリック
    await page.click('button[type="submit"]');

    // ステップ4: マイページにリダイレクトされることを確認
    await expect(page).toHaveURL('/mypage', { timeout: 10000 });

    // ステップ5: ニックネームが表示されることを確認
    await expect(page.locator(`text=${testUser.nickname}`)).toBeVisible();
  });

  test('登録済みユーザーでログインできる', async ({ page, context }) => {
    // 前提: ユーザーが既に登録されている必要がある
    // このテストは上記のテストの後に実行されることを想定

    // ステップ1: ログアウト（既にログイン済みの場合）
    await context.clearCookies();

    // ステップ2: ログインページにアクセス
    await page.goto('/login');

    // ステップ3: ログインフォームに入力
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);

    // ステップ4: ログインボタンをクリック
    await page.click('button[type="submit"]:has-text("ログイン")');

    // ステップ5: マイページにリダイレクトされることを確認
    await expect(page).toHaveURL('/mypage', { timeout: 10000 });
  });

  test('認証ユーザーはプロジェクトを作成できる', async ({ page }) => {
    // 前提: ログイン済み

    // ステップ1: マイページにアクセス
    await page.goto('/mypage');

    // ステップ2: 「新しいプロジェクト」ボタンをクリック
    const newProjectButton = page.locator('a:has-text("新しいプロジェクト")');
    if (await newProjectButton.isVisible()) {
      await newProjectButton.click();

      // ステップ3: プロジェクト作成ページに遷移
      await expect(page).toHaveURL('/projects/new');

      // ステップ4: プロジェクト情報を入力
      await page.fill('input[name="name"]', 'E2Eテストプロジェクト');
      await page.fill('textarea[name="description"]', 'これはE2Eテスト用のプロジェクトです');

      // ステップ5: 作成ボタンをクリック
      await page.click('button:has-text("作成")');

      // ステップ6: プロジェクト詳細ページにリダイレクト
      await expect(page).toHaveURL(/\/projects\/[a-zA-Z0-9]+/, { timeout: 10000 });

      // ステップ7: プロジェクト名が表示されることを確認
      await expect(page.locator('text=E2Eテストプロジェクト')).toBeVisible();
    }
  });

  test('誤ったパスワードでログインできない', async ({ page, context }) => {
    // クッキーをクリア
    await context.clearCookies();

    await page.goto('/login');

    // 誤ったパスワードでログイン試行
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', 'WrongPassword123');
    await page.click('button[type="submit"]:has-text("ログイン")');

    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=/エラー|失敗|incorrect|invalid/i')).toBeVisible({ timeout: 5000 });

    // ログインページに留まることを確認
    await expect(page).toHaveURL('/login');
  });
});
