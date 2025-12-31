import { describe, it, expect } from 'vitest';
import { SessionStatus } from '@/domain/session/SessionStatus';

describe('SessionStatus Enum', () => {
  it('should have ACTIVE status', () => {
    expect(SessionStatus.ACTIVE).toBe('ACTIVE');
  });

  it('should have FINALIZED status', () => {
    expect(SessionStatus.FINALIZED).toBe('FINALIZED');
  });

  it('should have exactly 2 statuses', () => {
    const statuses = Object.values(SessionStatus);
    expect(statuses).toHaveLength(2);
  });

  it('should be usable in switch statements', () => {
    const getStatusMessage = (status: SessionStatus): string => {
      switch (status) {
        case SessionStatus.ACTIVE:
          return 'Session is active';
        case SessionStatus.FINALIZED:
          return 'Session is finalized';
        default:
          return 'Unknown status';
      }
    };

    expect(getStatusMessage(SessionStatus.ACTIVE)).toBe('Session is active');
    expect(getStatusMessage(SessionStatus.FINALIZED)).toBe('Session is finalized');
  });

  it('should be comparable with string values', () => {
    const status: SessionStatus = SessionStatus.ACTIVE;
    expect(status === 'ACTIVE').toBe(true);
    expect(status === 'FINALIZED').toBe(false);
  });
});
