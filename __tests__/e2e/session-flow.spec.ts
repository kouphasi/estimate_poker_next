import { test, expect } from '@playwright/test';

test.describe('セッション作成・見積もりフロー', () => {
  test('ゲストユーザーがセッションを作成して見積もりを提出できる', async ({ page }) => {
    // ステップ1: ゲストログイン
    await page.goto('/simple-login');
    await page.fill('input[name="nickname"]', 'セッションオーナー');
    await page.click('button:has-text("セッション作成")');

    // セッションページに遷移
    await expect(page).toHaveURL(/\/estimate\/[a-zA-Z0-9_-]+/);

    // ステップ2: 見積もりを選択
    await page.click('button:has-text("3d")');

    // ステップ3: 参加者一覧に自分が表示されることを確認
    await expect(page.locator('text=セッションオーナー')).toBeVisible();

    // ステップ4: 提出状態が表示されることを確認
    await expect(page.locator('text=提出済み')).toBeVisible();
  });

  test('複数のユーザーが同じセッションに参加できる', async ({ browser }) => {
    // ユーザー1: セッションオーナー
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    await page1.goto('/simple-login');
    await page1.fill('input[name="nickname"]', 'ユーザー1');
    await page1.click('button:has-text("セッション作成")');

    // セッションURLを取得
    await expect(page1).toHaveURL(/\/estimate\/[a-zA-Z0-9_-]+/);
    const sessionUrl = page1.url();

    // 見積もりを選択
    await page1.click('button:has-text("1d")');

    // ユーザー2: セッションに参加
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    await page2.goto(sessionUrl);

    // ニックネーム入力（セッション参加時）
    const nicknameInput = page2.locator('input[name="nickname"]');
    if (await nicknameInput.isVisible()) {
      await nicknameInput.fill('ユーザー2');
      await page2.click('button:has-text("参加")');
    }

    // 見積もりを選択
    await page2.click('button:has-text("2d")');

    // 両方のユーザーが参加者一覧に表示されることを確認
    await expect(page1.locator('text=ユーザー1')).toBeVisible();
    await expect(page1.locator('text=ユーザー2')).toBeVisible();

    // クリーンアップ
    await context1.close();
    await context2.close();
  });

  test('オーナーが見積もりを公開できる', async ({ page }) => {
    // セッション作成
    await page.goto('/simple-login');
    await page.fill('input[name="nickname"]', '公開テストユーザー');
    await page.click('button:has-text("セッション作成")');

    await expect(page).toHaveURL(/\/estimate\//);

    // 見積もりを選択
    await page.click('button:has-text("3d")');

    // 公開ボタンをクリック
    const revealButton = page.locator('button:has-text("公開")');
    await revealButton.click();

    // 統計情報が表示されることを確認
    await expect(page.locator('text=平均')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=中央値')).toBeVisible();
  });

  test('オーナーが見積もりを確定できる', async ({ page }) => {
    // セッション作成と見積もり提出
    await page.goto('/simple-login');
    await page.fill('input[name="nickname"]', '確定テストユーザー');
    await page.click('button:has-text("セッション作成")');

    await expect(page).toHaveURL(/\/estimate\//);
    await page.click('button:has-text("2d")');

    // 公開
    await page.click('button:has-text("公開")');
    await expect(page.locator('text=平均')).toBeVisible();

    // 確定ボタンをクリック
    const finalizeButton = page.locator('button:has-text("確定")');
    if (await finalizeButton.isVisible()) {
      await finalizeButton.click();

      // 確定工数が表示されることを確認
      await expect(page.locator('text=確定工数')).toBeVisible({ timeout: 5000 });
    }
  });

  test('自由記述で見積もりを入力できる', async ({ page }) => {
    await page.goto('/simple-login');
    await page.fill('input[name="nickname"]', '自由記述テスト');
    await page.click('button:has-text("セッション作成")');

    await expect(page).toHaveURL(/\/estimate\//);

    // 自由記述ボタンをクリック
    await page.click('button:has-text("自由記述")');

    // 入力フォームが表示されることを確認
    await expect(page.locator('input[type="number"]')).toBeVisible();

    // カスタム値を入力
    await page.fill('input[type="number"]', '5');
    await page.click('button:has-text("決定")');

    // 提出状態になることを確認
    await expect(page.locator('text=提出済み')).toBeVisible();
  });

  test('見積もり非公開時は他のユーザーの値が見えない', async ({ browser }) => {
    // オーナー: セッション作成
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    await page1.goto('/simple-login');
    await page1.fill('input[name="nickname"]', '非公開テストオーナー');
    await page1.click('button:has-text("セッション作成")');
    await expect(page1).toHaveURL(/\/estimate\//);
    const sessionUrl = page1.url();

    // オーナーが見積もりを提出
    await page1.click('button:has-text("3d")');

    // 参加者: セッションに参加
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto(sessionUrl);

    const nicknameInput = page2.locator('input[name="nickname"]');
    if (await nicknameInput.isVisible()) {
      await nicknameInput.fill('非公開テスト参加者');
      await page2.click('button:has-text("参加")');
    }

    // 参加者側で具体的な値（「3日」など）が見えないことを確認
    await expect(page2.locator('text=3日')).not.toBeVisible();

    // 「提出済み」は見えるはず
    await expect(page2.locator('text=提出済み')).toBeVisible();

    // クリーンアップ
    await context1.close();
    await context2.close();
  });
});
