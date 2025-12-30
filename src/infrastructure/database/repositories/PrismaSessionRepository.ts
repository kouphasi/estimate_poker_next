import { PrismaClient, EstimationSession as PrismaSession } from '@prisma/client';
import { SessionRepository } from '@/domain/session/SessionRepository';
import { EstimationSession } from '@/domain/session/EstimationSession';
import { ShareToken } from '@/domain/session/ShareToken';
import { OwnerToken } from '@/domain/session/OwnerToken';
import { SessionStatus } from '@/domain/session/SessionStatus';

/**
 * PrismaSessionRepository
 * SessionRepositoryのPrisma実装
 */
export class PrismaSessionRepository implements SessionRepository {
  constructor(private prisma: PrismaClient) {}

  async findByShareToken(token: ShareToken): Promise<EstimationSession | null> {
    const data = await this.prisma.estimationSession.findUnique({
      where: { shareToken: token.value },
    });

    if (!data) return null;
    return this.toDomain(data);
  }

  async findByShareTokenString(shareToken: string): Promise<EstimationSession | null> {
    const data = await this.prisma.estimationSession.findUnique({
      where: { shareToken },
    });

    if (!data) return null;
    return this.toDomain(data);
  }

  async findById(id: string): Promise<EstimationSession | null> {
    const data = await this.prisma.estimationSession.findUnique({
      where: { id },
    });

    if (!data) return null;
    return this.toDomain(data);
  }

  async findByOwnerId(ownerId: string): Promise<EstimationSession[]> {
    const data = await this.prisma.estimationSession.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });

    return data.map((s) => this.toDomain(s));
  }

  async findByProjectId(projectId: string): Promise<EstimationSession[]> {
    const data = await this.prisma.estimationSession.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return data.map((s) => this.toDomain(s));
  }

  async save(session: EstimationSession): Promise<EstimationSession> {
    const data = await this.prisma.estimationSession.upsert({
      where: { id: session.id },
      update: {
        name: session.name,
        isRevealed: session.isRevealed,
        status: session.status,
        finalEstimate: session.finalEstimate,
      },
      create: {
        id: session.id,
        name: session.name,
        shareToken: session.shareToken.value,
        ownerToken: session.ownerToken.value,
        ownerId: session.ownerId,
        projectId: session.projectId,
        isRevealed: session.isRevealed,
        status: session.status,
        finalEstimate: session.finalEstimate,
      },
    });

    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.estimationSession.delete({
      where: { id },
    });
  }

  /**
   * Prismaモデルからドメインエンティティへの変換
   */
  private toDomain(data: PrismaSession): EstimationSession {
    return new EstimationSession(
      data.id,
      data.name,
      ShareToken.fromString(data.shareToken),
      OwnerToken.fromString(data.ownerToken),
      data.ownerId,
      data.projectId,
      data.isRevealed,
      data.status as SessionStatus,
      data.finalEstimate,
      data.createdAt
    );
  }
}
