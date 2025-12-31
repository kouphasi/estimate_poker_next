import { test, expect } from '@playwright/test';

test.describe('プロジェクト共有フロー', () => {
  test('オーナーが招待URLを発行し、ユーザーが参加申請して承認される', async ({ browser }) => {
    // 2つの独立したコンテキスト（オーナーと参加者）を作成
    const ownerContext = await browser.newContext();
    const memberContext = await browser.newContext();

    const ownerPage = await ownerContext.newPage();
    const memberPage = await memberContext.newPage();

    try {
      // ユニークなユーザー情報を生成
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const owner = {
        email: `e2eowner-${uniqueId}@example.com`,
        password: 'Test1234!',
        nickname: 'E2Eプロジェクトオーナー',
      };
      const member = {
        email: `e2emember-${uniqueId}@example.com`,
        password: 'Test1234!',
        nickname: 'E2E参加メンバー',
      };

      // === オーナーの登録とログイン ===
      await ownerPage.goto('/register');
      await ownerPage.fill('#email', owner.email);
      await ownerPage.fill('#nickname', owner.nickname);
      await ownerPage.fill('#password', owner.password);
      await ownerPage.fill('#confirmPassword', owner.password);
      await ownerPage.click('button:has-text("登録")');
      await expect(ownerPage).toHaveURL(/\/login/, { timeout: 15000 });

      // オーナーでログイン
      await ownerPage.fill('#email', owner.email);
      await ownerPage.fill('#password', owner.password);
      await ownerPage.click('button[type="submit"]:has-text("ログイン")');
      await expect(ownerPage).toHaveURL('/mypage', { timeout: 15000 });

      // === プロジェクトを作成 ===
      await ownerPage.click('button:has-text("新規作成")');
      await expect(ownerPage).toHaveURL('/projects/new');

      await ownerPage.fill('#name', `E2Eテストプロジェクト-${uniqueId}`);
      await ownerPage.fill('#description', 'E2Eテスト用のプロジェクトです');
      await ownerPage.click('button:has-text("プロジェクトを作成")');

      // プロジェクト詳細ページにリダイレクト
      await expect(ownerPage).toHaveURL(/\/projects\/[a-z0-9]+$/, { timeout: 15000 });

      // === 招待URLを発行 ===
      // ページが完全にロードされるまで待機
      await ownerPage.waitForLoadState('networkidle', { timeout: 15000 });

      const inviteButton = ownerPage.locator('button:has-text("招待URLを発行")');
      await expect(inviteButton).toBeVisible({ timeout: 15000 });
      await inviteButton.click();

      // 招待URLが表示されるまで待機
      const inviteUrlInput = ownerPage.locator('input[readonly][value*="/invite/"]');
      await expect(inviteUrlInput).toBeVisible({ timeout: 10000 });

      // 招待URLを取得
      const inviteUrl = await inviteUrlInput.inputValue();
      expect(inviteUrl).toContain('/invite/');

      // トークンを抽出
      const inviteToken = inviteUrl.split('/invite/')[1];
      expect(inviteToken).toHaveLength(16);

      // === メンバーの登録とログイン ===
      await memberPage.goto('/register');
      await memberPage.fill('#email', member.email);
      await memberPage.fill('#nickname', member.nickname);
      await memberPage.fill('#password', member.password);
      await memberPage.fill('#confirmPassword', member.password);
      await memberPage.click('button:has-text("登録")');
      await expect(memberPage).toHaveURL(/\/login/, { timeout: 15000 });

      // メンバーでログイン
      await memberPage.fill('#email', member.email);
      await memberPage.fill('#password', member.password);
      await memberPage.click('button[type="submit"]:has-text("ログイン")');
      await expect(memberPage).toHaveURL('/mypage', { timeout: 15000 });

      // === 招待URLにアクセスして参加申請 ===
      await memberPage.goto(inviteUrl);

      // プロジェクト情報が表示されることを確認
      await expect(memberPage.locator(`text=E2Eテストプロジェクト-${uniqueId}`)).toBeVisible({ timeout: 10000 });

      // 申請ボタンをクリック
      const applyButton = memberPage.locator('button:has-text("申請する")');
      await expect(applyButton).toBeVisible({ timeout: 10000 });
      await applyButton.click();

      // 申請完了メッセージを確認
      await expect(memberPage.locator('text=参加申請を送信しました')).toBeVisible({ timeout: 10000 });

      // === オーナーが参加リクエストを承認 ===
      // オーナーのプロジェクト詳細ページをリロード
      await ownerPage.reload();
      await ownerPage.waitForLoadState('networkidle', { timeout: 15000 });

      // デバッグ: ページの内容を確認
      const pageContent = await ownerPage.content();
      console.log('Page contains "参加リクエスト":', pageContent.includes('参加リクエスト'));

      // 参加リクエスト数のバッジが表示されることを確認
      const requestBadge = ownerPage.locator('text=/参加リクエスト.*1/');
      await expect(requestBadge).toBeVisible({ timeout: 10000 });

      // 参加リクエストモーダルを開く
      await ownerPage.click('button:has-text("参加リクエスト")');

      // メンバーのニックネームが表示されることを確認
      await expect(ownerPage.locator(`text=${member.nickname}`)).toBeVisible({ timeout: 10000 });

      // 承認ボタンをクリック
      await ownerPage.click('button:has-text("承認")');

      // 確認ダイアログで承認
      ownerPage.on('dialog', dialog => dialog.accept());

      // トーストメッセージを確認
      await expect(ownerPage.locator('text=参加を承認しました')).toBeVisible({ timeout: 10000 });

      // === メンバーのマイページで参加中プロジェクトを確認 ===
      await memberPage.goto('/mypage');

      // 参加中のプロジェクトセクションにプロジェクトが表示されることを確認
      const memberProjectSection = memberPage.locator('h2:has-text("参加中のプロジェクト")').locator('..');
      await expect(memberProjectSection.locator(`text=E2Eテストプロジェクト-${uniqueId}`)).toBeVisible({ timeout: 10000 });

      // ロールバッジが表示されることを確認
      await expect(memberProjectSection.locator('text=MEMBER')).toBeVisible({ timeout: 10000 });

      // === オーナーがメンバー一覧を確認 ===
      await ownerPage.goto(await ownerPage.url()); // 現在のプロジェクト詳細ページ

      // メンバー管理ページに移動
      await ownerPage.click('a:has-text("メンバー管理")');
      await expect(ownerPage).toHaveURL(/\/projects\/[a-z0-9]+\/members/, { timeout: 15000 });

      // メンバーが一覧に表示されることを確認
      await expect(ownerPage.locator(`text=${member.nickname}`)).toBeVisible({ timeout: 10000 });
      await expect(ownerPage.locator('text=MEMBER')).toBeVisible({ timeout: 10000 });

    } finally {
      // クリーンアップ
      await ownerPage.close();
      await memberPage.close();
      await ownerContext.close();
      await memberContext.close();
    }
  });

  test('オーナーが参加リクエストを拒否できる', async ({ browser }) => {
    const ownerContext = await browser.newContext();
    const memberContext = await browser.newContext();

    const ownerPage = await ownerContext.newPage();
    const memberPage = await memberContext.newPage();

    try {
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const owner = {
        email: `e2eowner2-${uniqueId}@example.com`,
        password: 'Test1234!',
        nickname: 'E2Eオーナー2',
      };
      const member = {
        email: `e2emember2-${uniqueId}@example.com`,
        password: 'Test1234!',
        nickname: 'E2Eメンバー2',
      };

      // オーナー登録・ログイン
      await ownerPage.goto('/register');
      await ownerPage.fill('#email', owner.email);
      await ownerPage.fill('#nickname', owner.nickname);
      await ownerPage.fill('#password', owner.password);
      await ownerPage.fill('#confirmPassword', owner.password);
      await ownerPage.click('button:has-text("登録")');
      await expect(ownerPage).toHaveURL(/\/login/, { timeout: 15000 });

      await ownerPage.fill('#email', owner.email);
      await ownerPage.fill('#password', owner.password);
      await ownerPage.click('button[type="submit"]:has-text("ログイン")');
      await expect(ownerPage).toHaveURL('/mypage', { timeout: 15000 });

      // プロジェクト作成
      await ownerPage.click('button:has-text("新規作成")');
      await ownerPage.fill('#name', `拒否テストプロジェクト-${uniqueId}`);
      await ownerPage.fill('#description', '拒否テスト用');
      await ownerPage.click('button:has-text("プロジェクトを作成")');
      await expect(ownerPage).toHaveURL(/\/projects\/[a-z0-9]+$/, { timeout: 15000 });

      // 招待URL発行
      await ownerPage.waitForLoadState('networkidle', { timeout: 15000 });
      await ownerPage.click('button:has-text("招待URLを発行")');
      const inviteUrlInput = ownerPage.locator('input[readonly][value*="/invite/"]');
      await expect(inviteUrlInput).toBeVisible({ timeout: 10000 });
      const inviteUrl = await inviteUrlInput.inputValue();

      // メンバー登録・ログイン
      await memberPage.goto('/register');
      await memberPage.fill('#email', member.email);
      await memberPage.fill('#nickname', member.nickname);
      await memberPage.fill('#password', member.password);
      await memberPage.fill('#confirmPassword', member.password);
      await memberPage.click('button:has-text("登録")');
      await expect(memberPage).toHaveURL(/\/login/, { timeout: 15000 });

      await memberPage.fill('#email', member.email);
      await memberPage.fill('#password', member.password);
      await memberPage.click('button[type="submit"]:has-text("ログイン")');
      await expect(memberPage).toHaveURL('/mypage', { timeout: 15000 });

      // 参加申請
      await memberPage.goto(inviteUrl);
      await memberPage.click('button:has-text("申請する")');
      await expect(memberPage.locator('text=参加申請を送信しました')).toBeVisible({ timeout: 10000 });

      // オーナーが拒否
      await ownerPage.reload();
      await ownerPage.click('button:has-text("参加リクエスト")');
      await expect(ownerPage.locator(`text=${member.nickname}`)).toBeVisible({ timeout: 10000 });

      ownerPage.on('dialog', dialog => dialog.accept());
      await ownerPage.click('button:has-text("拒否")');

      await expect(ownerPage.locator('text=参加を拒否しました')).toBeVisible({ timeout: 10000 });

      // メンバーのマイページに参加中プロジェクトが表示されないことを確認
      await memberPage.goto('/mypage');
      const memberProjectSection = memberPage.locator('h2:has-text("参加中のプロジェクト")').locator('..');
      await expect(memberProjectSection.locator(`text=拒否テストプロジェクト-${uniqueId}`)).not.toBeVisible({ timeout: 5000 });

    } finally {
      await ownerPage.close();
      await memberPage.close();
      await ownerContext.close();
      await memberContext.close();
    }
  });

  test('オーナーがメンバーを削除できる', async ({ browser }) => {
    const ownerContext = await browser.newContext();
    const memberContext = await browser.newContext();

    const ownerPage = await ownerContext.newPage();
    const memberPage = await memberContext.newPage();

    try {
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const owner = {
        email: `e2eowner3-${uniqueId}@example.com`,
        password: 'Test1234!',
        nickname: 'E2Eオーナー3',
      };
      const member = {
        email: `e2emember3-${uniqueId}@example.com`,
        password: 'Test1234!',
        nickname: 'E2Eメンバー3',
      };

      // オーナー登録・ログイン・プロジェクト作成・招待URL発行
      await ownerPage.goto('/register');
      await ownerPage.fill('#email', owner.email);
      await ownerPage.fill('#nickname', owner.nickname);
      await ownerPage.fill('#password', owner.password);
      await ownerPage.fill('#confirmPassword', owner.password);
      await ownerPage.click('button:has-text("登録")');
      await expect(ownerPage).toHaveURL(/\/login/, { timeout: 15000 });

      await ownerPage.fill('#email', owner.email);
      await ownerPage.fill('#password', owner.password);
      await ownerPage.click('button[type="submit"]:has-text("ログイン")');
      await expect(ownerPage).toHaveURL('/mypage', { timeout: 15000 });

      await ownerPage.click('button:has-text("新規作成")');
      await ownerPage.fill('#name', `削除テストプロジェクト-${uniqueId}`);
      await ownerPage.fill('#description', '削除テスト用');
      await ownerPage.click('button:has-text("プロジェクトを作成")');
      await expect(ownerPage).toHaveURL(/\/projects\/[a-z0-9]+$/, { timeout: 15000 });

      await ownerPage.waitForLoadState('networkidle', { timeout: 15000 });
      await ownerPage.click('button:has-text("招待URLを発行")');
      const inviteUrlInput = ownerPage.locator('input[readonly][value*="/invite/"]');
      await expect(inviteUrlInput).toBeVisible({ timeout: 10000 });
      const inviteUrl = await inviteUrlInput.inputValue();

      // メンバー登録・ログイン・参加申請
      await memberPage.goto('/register');
      await memberPage.fill('#email', member.email);
      await memberPage.fill('#nickname', member.nickname);
      await memberPage.fill('#password', member.password);
      await memberPage.fill('#confirmPassword', member.password);
      await memberPage.click('button:has-text("登録")');
      await expect(memberPage).toHaveURL(/\/login/, { timeout: 15000 });

      await memberPage.fill('#email', member.email);
      await memberPage.fill('#password', member.password);
      await memberPage.click('button[type="submit"]:has-text("ログイン")');
      await expect(memberPage).toHaveURL('/mypage', { timeout: 15000 });

      await memberPage.goto(inviteUrl);
      await memberPage.click('button:has-text("申請する")');
      await expect(memberPage.locator('text=参加申請を送信しました')).toBeVisible({ timeout: 10000 });

      // オーナーが承認
      await ownerPage.reload();
      await ownerPage.click('button:has-text("参加リクエスト")');
      ownerPage.on('dialog', dialog => dialog.accept());
      await ownerPage.click('button:has-text("承認")');
      await expect(ownerPage.locator('text=参加を承認しました')).toBeVisible({ timeout: 10000 });

      // メンバー管理ページでメンバーを削除
      await ownerPage.click('a:has-text("メンバー管理")');
      await expect(ownerPage).toHaveURL(/\/projects\/[a-z0-9]+\/members/, { timeout: 15000 });

      await expect(ownerPage.locator(`text=${member.nickname}`)).toBeVisible({ timeout: 10000 });

      await ownerPage.click('button:has-text("削除")');
      await expect(ownerPage.locator('text=メンバーを削除しました')).toBeVisible({ timeout: 10000 });

      // メンバーが一覧から消えたことを確認
      await expect(ownerPage.locator(`text=${member.nickname}`)).not.toBeVisible({ timeout: 5000 });

      // メンバーのマイページでプロジェクトが表示されなくなったことを確認
      await memberPage.goto('/mypage');
      const memberProjectSection = memberPage.locator('h2:has-text("参加中のプロジェクト")').locator('..');
      await expect(memberProjectSection.locator(`text=削除テストプロジェクト-${uniqueId}`)).not.toBeVisible({ timeout: 5000 });

    } finally {
      await ownerPage.close();
      await memberPage.close();
      await ownerContext.close();
      await memberContext.close();
    }
  });
});
