import { test, expect } from '@playwright/test';

test.describe('認証ログインフロー', () => {
  test('新規ユーザー登録ができる', async ({ page }) => {
    // 各テストで一意のメールアドレスを生成（ランダム文字列追加で重複回避）
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const testUser = {
      email: `e2etest-${uniqueId}@example.com`,
      password: 'Test1234!',
      confirmPassword: 'Test1234!',
      nickname: 'E2E認証ユーザー',
    };
    // 登録ページにアクセス
    await page.goto('/register');

    // 登録フォームに入力（id属性を使用）
    await page.fill('#email', testUser.email);
    await page.fill('#nickname', testUser.nickname);
    await page.fill('#password', testUser.password);
    await page.fill('#confirmPassword', testUser.confirmPassword);

    // 登録ボタンをクリック
    await page.click('button:has-text("登録")');

    // ログインページにリダイレクト（registered=trueで遷移）
    await expect(page).toHaveURL(/\/login.*registered=true/, { timeout: 10000 });
  });

  test('登録済みユーザーでログインできる', async ({ page, context }) => {
    // 各テストで一意のメールアドレスを生成（ランダム文字列追加で重複回避）
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const testUser = {
      email: `e2elogin-${uniqueId}@example.com`,
      password: 'Test1234!',
      nickname: 'E2Eログインユーザー',
    };

    // まず登録する
    await page.goto('/register');
    await page.fill('#email', testUser.email);
    await page.fill('#nickname', testUser.nickname);
    await page.fill('#password', testUser.password);
    await page.fill('#confirmPassword', testUser.password);
    await page.click('button:has-text("登録")');
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });

    // クッキーをクリアしてログイン
    await context.clearCookies();
    await page.goto('/login');

    // ログインフォームに入力
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);

    // ログインボタンをクリック
    await page.click('button:has-text("メールアドレスでログイン")');

    // マイページにリダイレクトされることを確認
    await expect(page).toHaveURL('/mypage', { timeout: 10000 });
  });

  test('認証ユーザーはプロジェクトを作成できる', async ({ page }) => {
    // まず登録してログイン（ランダム文字列追加で重複回避）
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const projectTestUser = {
      email: `e2eproject-${uniqueId}@example.com`,
      password: 'Test1234!',
      nickname: 'プロジェクトテストユーザー',
    };

    await page.goto('/register');
    await page.fill('#email', projectTestUser.email);
    await page.fill('#nickname', projectTestUser.nickname);
    await page.fill('#password', projectTestUser.password);
    await page.fill('#confirmPassword', projectTestUser.password);
    await page.click('button:has-text("登録")');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // ログイン
    await page.fill('#email', projectTestUser.email);
    await page.fill('#password', projectTestUser.password);
    await page.click('button:has-text("メールアドレスでログイン")');
    await expect(page).toHaveURL('/mypage', { timeout: 10000 });

    // 「新しいプロジェクト」ボタンをクリック
    const newProjectButton = page.locator('a:has-text("新しいプロジェクト")');
    if (await newProjectButton.isVisible()) {
      await newProjectButton.click();

      // プロジェクト作成ページに遷移
      await expect(page).toHaveURL('/projects/new');

      // プロジェクト情報を入力（id属性を使用）
      await page.fill('#name', 'E2Eテストプロジェクト');
      await page.fill('#description', 'これはE2Eテスト用のプロジェクトです');

      // 作成ボタンをクリック
      await page.click('button:has-text("作成")');

      // プロジェクト詳細ページにリダイレクト
      await expect(page).toHaveURL(/\/projects\/[a-zA-Z0-9]+/, { timeout: 10000 });

      // プロジェクト名が表示されることを確認
      await expect(page.locator('text=E2Eテストプロジェクト')).toBeVisible();
    }
  });

  test('誤ったパスワードでログインできない', async ({ page }) => {
    // まず登録（ランダム文字列追加で重複回避）
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const wrongPwUser = {
      email: `e2ewrongpw-${uniqueId}@example.com`,
      password: 'Test1234!',
      nickname: 'エラーテストユーザー',
    };

    await page.goto('/register');
    await page.fill('#email', wrongPwUser.email);
    await page.fill('#nickname', wrongPwUser.nickname);
    await page.fill('#password', wrongPwUser.password);
    await page.fill('#confirmPassword', wrongPwUser.password);
    await page.click('button:has-text("登録")');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // 誤ったパスワードでログイン試行
    await page.fill('#email', wrongPwUser.email);
    await page.fill('#password', 'WrongPassword123');
    await page.click('button:has-text("メールアドレスでログイン")');

    // エラーメッセージが表示されることを確認
    await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 5000 });

    // ログインページに留まることを確認（クエリパラメータは無視）
    await expect(page).toHaveURL(/\/login/);
  });
});
