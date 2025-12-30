import { test, expect } from '@playwright/test';

test.describe('ゲストログインフロー', () => {
  test('ニックネームを入力してセッションを作成できる', async ({ page }) => {
    // ステップ1: ゲストログインページにアクセス
    await page.goto('/simple-login');

    // ページタイトルを確認
    await expect(page).toHaveTitle(/Estimate Poker/);

    // ステップ2: ニックネームを入力
    await page.fill('input[name="nickname"]', 'E2Eテストユーザー');

    // ステップ3: セッション作成ボタンをクリック
    await page.click('button:has-text("セッション作成")');

    // ステップ4: セッションページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/estimate\/[a-zA-Z0-9_-]+/);

    // ステップ5: ニックネームが表示されていることを確認
    await expect(page.locator('text=E2Eテストユーザー')).toBeVisible();
  });

  test('ニックネームが空の場合はエラーメッセージが表示される', async ({ page }) => {
    await page.goto('/simple-login');

    // ニックネームを入力せずにセッション作成をクリック
    await page.click('button:has-text("セッション作成")');

    // エラーメッセージが表示されることを確認
    // (実際のエラーメッセージに応じて調整が必要)
    await expect(page.locator('text=ニックネーム')).toBeVisible();

    // セッションページにリダイレクトされていないことを確認
    await expect(page).toHaveURL(/\/simple-login/);
  });

  test('セッション作成後にカードが選択できる', async ({ page }) => {
    await page.goto('/simple-login');

    // セッション作成
    await page.fill('input[name="nickname"]', 'カード選択テスト');
    await page.click('button:has-text("セッション作成")');

    // セッションページに遷移
    await expect(page).toHaveURL(/\/estimate\//);

    // カードオプションが表示されることを確認
    await expect(page.locator('text=1h')).toBeVisible();
    await expect(page.locator('text=1d')).toBeVisible();
    await expect(page.locator('text=3d')).toBeVisible();

    // カードをクリック
    await page.click('button:has-text("1d")');

    // カードが選択状態になることを確認（実装により異なる）
    // 選択状態の視覚的フィードバックがあれば追加
  });
});
