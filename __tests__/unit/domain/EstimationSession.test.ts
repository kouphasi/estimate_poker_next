import { describe, it, expect } from 'vitest';
import { EstimationSession } from '@/domain/session/EstimationSession';
import { ShareToken } from '@/domain/session/ShareToken';
import { OwnerToken } from '@/domain/session/OwnerToken';
import { SessionStatus } from '@/domain/session/SessionStatus';
import {
  SessionAlreadyFinalizedError,
  UnauthorizedError,
  InvalidEstimateValueError,
} from '@/domain/errors/DomainError';

describe('EstimationSession Entity', () => {
  const createTestSession = (overrides?: Partial<{
    id: string;
    name: string | null;
    shareToken: ShareToken;
    ownerToken: OwnerToken;
    ownerId: string | null;
    projectId: string | null;
    isRevealed: boolean;
    status: SessionStatus;
    finalEstimate: number | null;
    createdAt: Date;
  }>) => {
    return new EstimationSession(
      overrides?.id ?? 'session-123',
      overrides?.name ?? 'Test Session',
      overrides?.shareToken ?? ShareToken.fromString('ABCDabcd12340000'),
      overrides?.ownerToken ?? OwnerToken.fromString('ABCDabcd1234567890123456789012ab'),
      overrides?.ownerId ?? 'owner-123',
      overrides?.projectId ?? null,
      overrides?.isRevealed ?? false,
      overrides?.status ?? SessionStatus.ACTIVE,
      overrides?.finalEstimate ?? null,
      overrides?.createdAt ?? new Date()
    );
  };

  describe('constructor', () => {
    it('should create session with all properties', () => {
      const shareToken = ShareToken.fromString('ABCDabcd12340000');
      const ownerToken = OwnerToken.fromString('ABCDabcd1234567890123456789012ab');
      const now = new Date();

      const session = new EstimationSession(
        'session-123',
        'Test Session',
        shareToken,
        ownerToken,
        'owner-123',
        'project-123',
        false,
        SessionStatus.ACTIVE,
        null,
        now
      );

      expect(session.id).toBe('session-123');
      expect(session.name).toBe('Test Session');
      expect(session.shareToken).toBe(shareToken);
      expect(session.ownerToken).toBe(ownerToken);
      expect(session.ownerId).toBe('owner-123');
      expect(session.projectId).toBe('project-123');
      expect(session.isRevealed).toBe(false);
      expect(session.status).toBe(SessionStatus.ACTIVE);
      expect(session.finalEstimate).toBeNull();
      expect(session.createdAt).toBe(now);
    });
  });

  describe('reveal', () => {
    it('should set isRevealed to true', () => {
      const session = createTestSession({ isRevealed: false });
      const revealed = session.reveal();

      expect(revealed.isRevealed).toBe(true);
    });

    it('should preserve other properties', () => {
      const session = createTestSession();
      const revealed = session.reveal();

      expect(revealed.id).toBe(session.id);
      expect(revealed.name).toBe(session.name);
      expect(revealed.ownerId).toBe(session.ownerId);
      expect(revealed.status).toBe(session.status);
    });

    it('should not modify original session', () => {
      const session = createTestSession({ isRevealed: false });
      session.reveal();

      expect(session.isRevealed).toBe(false);
    });
  });

  describe('hide', () => {
    it('should set isRevealed to false', () => {
      const session = createTestSession({ isRevealed: true });
      const hidden = session.hide();

      expect(hidden.isRevealed).toBe(false);
    });

    it('should preserve other properties', () => {
      const session = createTestSession({ isRevealed: true });
      const hidden = session.hide();

      expect(hidden.id).toBe(session.id);
      expect(hidden.name).toBe(session.name);
      expect(hidden.ownerId).toBe(session.ownerId);
      expect(hidden.status).toBe(session.status);
    });

    it('should not modify original session', () => {
      const session = createTestSession({ isRevealed: true });
      session.hide();

      expect(session.isRevealed).toBe(true);
    });
  });

  describe('finalize', () => {
    it('should set status to FINALIZED and store estimate', () => {
      const session = createTestSession({ status: SessionStatus.ACTIVE });
      const finalized = session.finalize(5);

      expect(finalized.status).toBe(SessionStatus.FINALIZED);
      expect(finalized.finalEstimate).toBe(5);
    });

    it('should set isRevealed to true', () => {
      const session = createTestSession({ isRevealed: false });
      const finalized = session.finalize(3);

      expect(finalized.isRevealed).toBe(true);
    });

    it('should accept valid estimate values', () => {
      const session = createTestSession();

      expect(() => session.finalize(0.5)).not.toThrow();
      expect(() => session.finalize(1)).not.toThrow();
      expect(() => session.finalize(100)).not.toThrow();
      expect(() => session.finalize(300)).not.toThrow();
    });

    it('should throw SessionAlreadyFinalizedError when already finalized', () => {
      const session = createTestSession({ status: SessionStatus.FINALIZED });

      expect(() => session.finalize(5)).toThrow(SessionAlreadyFinalizedError);
    });

    it('should throw InvalidEstimateValueError for zero', () => {
      const session = createTestSession();

      expect(() => session.finalize(0)).toThrow(InvalidEstimateValueError);
    });

    it('should throw InvalidEstimateValueError for negative values', () => {
      const session = createTestSession();

      expect(() => session.finalize(-1)).toThrow(InvalidEstimateValueError);
    });

    it('should throw InvalidEstimateValueError for values over 300', () => {
      const session = createTestSession();

      expect(() => session.finalize(301)).toThrow(InvalidEstimateValueError);
    });

    it('should not modify original session', () => {
      const session = createTestSession();
      session.finalize(5);

      expect(session.status).toBe(SessionStatus.ACTIVE);
      expect(session.finalEstimate).toBeNull();
    });
  });

  describe('canBeControlledBy', () => {
    it('should return true for matching owner token', () => {
      const session = createTestSession();
      const result = session.canBeControlledBy('ABCDabcd1234567890123456789012ab');

      expect(result).toBe(true);
    });

    it('should return false for non-matching owner token', () => {
      const session = createTestSession();
      const result = session.canBeControlledBy('WrongToken00000000000000000000');

      expect(result).toBe(false);
    });
  });

  describe('isActive', () => {
    it('should return true for ACTIVE status', () => {
      const session = createTestSession({ status: SessionStatus.ACTIVE });
      expect(session.isActive()).toBe(true);
    });

    it('should return false for FINALIZED status', () => {
      const session = createTestSession({ status: SessionStatus.FINALIZED });
      expect(session.isActive()).toBe(false);
    });
  });

  describe('isFinalized', () => {
    it('should return true for FINALIZED status', () => {
      const session = createTestSession({ status: SessionStatus.FINALIZED });
      expect(session.isFinalized()).toBe(true);
    });

    it('should return false for ACTIVE status', () => {
      const session = createTestSession({ status: SessionStatus.ACTIVE });
      expect(session.isFinalized()).toBe(false);
    });
  });

  describe('verifyOwnership', () => {
    it('should not throw for valid owner token', () => {
      const session = createTestSession();
      expect(() =>
        session.verifyOwnership('ABCDabcd1234567890123456789012ab')
      ).not.toThrow();
    });

    it('should throw UnauthorizedError for invalid owner token', () => {
      const session = createTestSession();
      expect(() =>
        session.verifyOwnership('WrongToken00000000000000000000')
      ).toThrow(UnauthorizedError);
    });

    it('should throw with correct error message', () => {
      const session = createTestSession();
      expect(() =>
        session.verifyOwnership('WrongToken00000000000000000000')
      ).toThrow('You do not have permission to control this session');
    });
  });

  describe('create', () => {
    it('should create session with correct initial state', () => {
      const shareToken = ShareToken.generate();
      const ownerToken = OwnerToken.generate();

      const session = EstimationSession.create(
        'session-123',
        'New Session',
        shareToken,
        ownerToken,
        'owner-123',
        'project-123'
      );

      expect(session.id).toBe('session-123');
      expect(session.name).toBe('New Session');
      expect(session.shareToken).toBe(shareToken);
      expect(session.ownerToken).toBe(ownerToken);
      expect(session.ownerId).toBe('owner-123');
      expect(session.projectId).toBe('project-123');
      expect(session.isRevealed).toBe(false);
      expect(session.status).toBe(SessionStatus.ACTIVE);
      expect(session.finalEstimate).toBeNull();
    });

    it('should allow null name', () => {
      const shareToken = ShareToken.generate();
      const ownerToken = OwnerToken.generate();

      const session = EstimationSession.create(
        'session-123',
        null,
        shareToken,
        ownerToken,
        'owner-123',
        null
      );

      expect(session.name).toBeNull();
    });

    it('should allow null ownerId', () => {
      const shareToken = ShareToken.generate();
      const ownerToken = OwnerToken.generate();

      const session = EstimationSession.create(
        'session-123',
        'Session',
        shareToken,
        ownerToken,
        null,
        null
      );

      expect(session.ownerId).toBeNull();
    });

    it('should allow null projectId', () => {
      const shareToken = ShareToken.generate();
      const ownerToken = OwnerToken.generate();

      const session = EstimationSession.create(
        'session-123',
        'Session',
        shareToken,
        ownerToken,
        'owner-123',
        null
      );

      expect(session.projectId).toBeNull();
    });
  });
});
