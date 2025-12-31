/**
 * Vitestグローバルセットアップファイル
 * - Testing Libraryのマッチャーを拡張
 * - 各テスト後の自動クリーンアップ
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// 各テスト後にDOMをクリーンアップ
afterEach(() => {
  cleanup();
});
