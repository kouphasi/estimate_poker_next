import { test, expect } from '@playwright/test';

test.describe('ゲストログインフロー', () => {
  test('ニックネームを入力してマイページに遷移できる', async ({ page }) => {
    // ステップ1: ゲストログインページにアクセス
    await page.goto('/simple-login');

    // ページタイトルを確認
    await expect(page).toHaveTitle(/Estimate Poker/);

    // ステップ2: ニックネームを入力（id属性を使用）
    await page.fill('#nickname', 'E2Eテストユーザー');

    // ステップ3: ログインボタンをクリック
    await page.click('button:has-text("ログイン")');

    // ステップ4: マイページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/mypage/);

    // ステップ5: ニックネームが表示されていることを確認
    await expect(page.locator('text=E2Eテストユーザー')).toBeVisible();
  });

  test('ニックネームが空の場合はエラーメッセージが表示される', async ({ page }) => {
    await page.goto('/simple-login');

    // ニックネームを入力せずにログインをクリック
    await page.click('button:has-text("ログイン")');

    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=ニックネームを入力してください')).toBeVisible();

    // simple-loginページに留まっていることを確認
    await expect(page).toHaveURL(/\/simple-login/);
  });

  test('ゲストログイン後にセッションを作成してカードが選択できる', async ({ page }) => {
    await page.goto('/simple-login');

    // ゲストログイン
    await page.fill('#nickname', 'カード選択テスト');
    await page.click('button:has-text("ログイン")');

    // マイページに遷移
    await expect(page).toHaveURL(/\/mypage/);

    // セッション作成ボタンをクリック（セッション一覧の「新規作成」ボタン）
    await page.click('button:has-text("新規作成")');

    // セッション作成ページに遷移
    await expect(page).toHaveURL(/\/sessions\/new/);

    // セッション作成ボタンをクリック
    await page.click('button:has-text("セッションを作成")');

    // セッションページに遷移
    await expect(page).toHaveURL(/\/estimate\//);

    // カードオプションが表示されることを確認
    await expect(page.locator('text=1h')).toBeVisible();
    await expect(page.locator('text=1d')).toBeVisible();
    await expect(page.locator('text=3d')).toBeVisible();

    // カードをクリック
    await page.click('button:has-text("1d")');
  });
});
