/**
 * テスト用ユーザーフィクスチャ
 * - ゲストユーザー、認証ユーザー、Googleユーザーのテストデータ
 */

export const testUsers = {
  guest: {
    id: 'test_guest_001',
    nickname: 'テストゲスト',
    isGuest: true,
  },
  authUser: {
    id: 'test_auth_001',
    email: 'test@example.com',
    nickname: 'テスト認証ユーザー',
    isGuest: false,
  },
  googleUser: {
    id: 'test_google_001',
    email: 'google@example.com',
    nickname: 'Googleユーザー',
    isGuest: false,
  },
  owner: {
    id: 'test_owner_001',
    email: 'owner@example.com',
    nickname: 'セッションオーナー',
    isGuest: false,
  },
  participant1: {
    id: 'test_participant_001',
    nickname: '参加者1',
    isGuest: true,
  },
  participant2: {
    id: 'test_participant_002',
    nickname: '参加者2',
    isGuest: true,
  },
} as const;

export type TestUser = typeof testUsers[keyof typeof testUsers];
