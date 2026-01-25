import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCurrentUser, requireAuth } from '@/infrastructure/auth/authHelpers';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));
vi.mock('@/infrastructure/auth/nextAuthConfig', () => ({
  authOptions: {},
}));

const mockedGetServerSession = vi.mocked(getServerSession);

describe('authHelpers', () => {
  beforeEach(() => {
    mockedGetServerSession.mockReset();
  });

  it('should return the current user when session exists', async () => {
    mockedGetServerSession.mockResolvedValue({
      user: { id: 'user-1', name: 'Ada Lovelace' },
    });

    await expect(getCurrentUser()).resolves.toEqual({
      id: 'user-1',
      name: 'Ada Lovelace',
    });
  });

  it('should return undefined when session is missing', async () => {
    mockedGetServerSession.mockResolvedValue(null);

    await expect(getCurrentUser()).resolves.toBeUndefined();
  });

  it('should return the user when authenticated', async () => {
    mockedGetServerSession.mockResolvedValue({
      user: { id: 'user-2', email: 'test@example.com' },
    });

    await expect(requireAuth()).resolves.toEqual({
      id: 'user-2',
      email: 'test@example.com',
    });
  });

  it('should throw an error when unauthenticated', async () => {
    mockedGetServerSession.mockResolvedValue({ user: undefined });

    await expect(requireAuth()).rejects.toThrow('Unauthorized');
  });
});
