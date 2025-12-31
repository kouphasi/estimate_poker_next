import { test, expect } from '@playwright/test';

test.describe('セッション作成・見積もりフロー', () => {
  // ヘルパー関数: ゲストログインしてマイページに遷移
  async function guestLogin(page: import('@playwright/test').Page, nickname: string) {
    await page.goto('/simple-login');
    await page.fill('#nickname', nickname);
    await page.click('button:has-text("ログイン")');
    await expect(page).toHaveURL(/\/mypage/);
  }

  // ヘルパー関数: セッションを作成
  async function createSession(page: import('@playwright/test').Page) {
    await page.click('button:has-text("新規作成")');
    await expect(page).toHaveURL(/\/sessions\/new/);
    await page.click('button:has-text("セッションを作成")');
    await expect(page).toHaveURL(/\/estimate\/[a-zA-Z0-9_-]+/);
  }

  test('ゲストユーザーがセッションを作成して見積もりを提出できる', async ({ page }) => {
    // ステップ1: ゲストログイン
    await guestLogin(page, 'セッションオーナー');

    // ステップ2: セッション作成
    await createSession(page);

    // ステップ3: 見積もりを選択
    await page.click('button:has-text("3d")');

    // ステップ4: 参加者一覧に自分が表示されることを確認（exactマッチで重複回避）
    await expect(page.getByText('セッションオーナー', { exact: true })).toBeVisible();

    // ステップ5: 提出状態が表示されることを確認
    await expect(page.locator('text=提出済み')).toBeVisible();
  });

  test('複数のユーザーが同じセッションに参加できる', async ({ browser }) => {
    // ユーザー1: セッションオーナー
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    await guestLogin(page1, 'ユーザー1');
    await createSession(page1);

    // セッションURLを取得
    const sessionUrl = page1.url();

    // 見積もりを選択
    await page1.click('button:has-text("1d")');

    // ユーザー2: セッションに参加
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    // ユーザー2もまずゲストログインしてからセッションに参加
    await guestLogin(page2, 'ユーザー2');

    // セッションURLに直接アクセス
    await page2.goto(sessionUrl);

    // 見積もりを選択
    await page2.click('button:has-text("2d")');

    // 両方のユーザーが参加者一覧に表示されることを確認（exactマッチで重複回避）
    await expect(page1.getByText('ユーザー1', { exact: true })).toBeVisible();
    await expect(page1.getByText('ユーザー2', { exact: true })).toBeVisible({ timeout: 10000 });

    // クリーンアップ
    await context1.close();
    await context2.close();
  });

  test('オーナーが見積もりを公開できる', async ({ page }) => {
    // セッション作成
    await guestLogin(page, '公開テストユーザー');
    await createSession(page);

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
    await guestLogin(page, '確定テストユーザー');
    await createSession(page);
    await page.click('button:has-text("2d")');

    // 公開
    await page.click('button:has-text("公開")');
    await expect(page.locator('text=平均')).toBeVisible();

    // 確定工数を入力して確定ボタンをクリック
    await page.getByPlaceholder('確定工数を入力（日数）').fill('2');
    await page.click('button:has-text("工数を確定")');

    // セッションが確定状態になることを確認（FINALIZEDステータス）
    await expect(page.getByText('確定済み')).toBeVisible({ timeout: 5000 });
  });

  test('自由記述で見積もりを入力できる', async ({ page }) => {
    await guestLogin(page, '自由記述テスト');
    await createSession(page);

    // 自由記述ボタンをクリック
    await page.click('button:has-text("自由記述")');

    // 入力フォームが表示されることを確認（placeholderで特定）
    await expect(page.getByPlaceholder('日数を入力')).toBeVisible();

    // カスタム値を入力
    await page.getByPlaceholder('日数を入力').fill('5');
    await page.click('button:has-text("決定")');

    // 提出状態になることを確認
    await expect(page.locator('text=提出済み')).toBeVisible();
  });

  test('見積もり非公開時は他のユーザーの値が見えない', async ({ browser }) => {
    // オーナー: セッション作成
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    await guestLogin(page1, '非公開テストオーナー');
    await createSession(page1);
    const sessionUrl = page1.url();

    // オーナーが見積もりを提出
    await page1.click('button:has-text("3d")');

    // 参加者: セッションに参加
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    await guestLogin(page2, '非公開テスト参加者');
    await page2.goto(sessionUrl);

    // 参加者側で具体的な値（「3日」など）が見えないことを確認
    await expect(page2.locator('text=3日')).not.toBeVisible();

    // 「提出済み」は見えるはず
    await expect(page2.locator('text=提出済み')).toBeVisible({ timeout: 10000 });

    // クリーンアップ
    await context1.close();
    await context2.close();
  });
});
