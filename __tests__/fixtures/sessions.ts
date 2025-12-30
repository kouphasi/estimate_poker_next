/**
 * テスト用セッションフィクスチャ
 * - アクティブセッション、公開済みセッション、確定済みセッションのテストデータ
 */

export const testSessions = {
  active: {
    id: 'test_session_001',
    name: 'アクティブセッション',
    shareToken: 'test_share_001',
    ownerToken: 'test_owner_001',
    ownerId: 'test_auth_001',
    isRevealed: false,
    status: 'ACTIVE' as const,
  },
  revealed: {
    id: 'test_session_002',
    name: '公開済みセッション',
    shareToken: 'test_share_002',
    ownerToken: 'test_owner_002',
    ownerId: 'test_auth_001',
    isRevealed: true,
    status: 'ACTIVE' as const,
  },
  finalized: {
    id: 'test_session_003',
    name: '確定済みセッション',
    shareToken: 'test_share_003',
    ownerToken: 'test_owner_003',
    ownerId: 'test_auth_001',
    isRevealed: true,
    status: 'FINALIZED' as const,
    finalEstimate: 2.5,
  },
  withProject: {
    id: 'test_session_004',
    name: 'プロジェクト配下のセッション',
    shareToken: 'test_share_004',
    ownerToken: 'test_owner_004',
    ownerId: 'test_auth_001',
    projectId: 'test_project_001',
    isRevealed: false,
    status: 'ACTIVE' as const,
  },
} as const;

export type TestSession = typeof testSessions[keyof typeof testSessions];

/**
 * テスト用見積もりフィクスチャ
 */
export const testEstimates = {
  estimate1: {
    id: 'test_estimate_001',
    sessionId: 'test_session_001',
    userId: 'test_guest_001',
    nickname: 'テストゲスト',
    value: 1.0, // 1日
  },
  estimate2: {
    id: 'test_estimate_002',
    sessionId: 'test_session_001',
    userId: 'test_auth_001',
    nickname: 'テスト認証ユーザー',
    value: 3.0, // 3日
  },
  estimate3: {
    id: 'test_estimate_003',
    sessionId: 'test_session_002',
    userId: 'test_participant_001',
    nickname: '参加者1',
    value: 2.0, // 2日
  },
} as const;

export type TestEstimate = typeof testEstimates[keyof typeof testEstimates];
