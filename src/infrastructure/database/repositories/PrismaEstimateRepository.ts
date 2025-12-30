import { PrismaClient, Estimate as PrismaEstimate } from '@prisma/client';
import { EstimateRepository } from '@/domain/session/EstimateRepository';
import { Estimate } from '@/domain/session/Estimate';

/**
 * PrismaEstimateRepository
 * EstimateRepositoryのPrisma実装
 */
export class PrismaEstimateRepository implements EstimateRepository {
  constructor(private prisma: PrismaClient) {}

  async findBySessionId(sessionId: string): Promise<Estimate[]> {
    const data = await this.prisma.estimate.findMany({
      where: { sessionId },
      orderBy: { updatedAt: 'desc' },
    });

    return data.map((e) => this.toDomain(e));
  }

  async findBySessionAndUser(
    sessionId: string,
    userId: string
  ): Promise<Estimate | null> {
    const data = await this.prisma.estimate.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId,
        },
      },
    });

    if (!data) return null;
    return this.toDomain(data);
  }

  async save(estimate: Estimate): Promise<Estimate> {
    // sessionIdが空の場合はエラー（不正なデータ）
    if (!estimate.sessionId || estimate.sessionId === '') {
      throw new Error('Cannot save estimate with empty sessionId');
    }

    // sessionId_userIdでupsertを使用（IDは自動生成させる）
    const data = await this.prisma.estimate.upsert({
      where: {
        sessionId_userId: {
          sessionId: estimate.sessionId,
          userId: estimate.userId,
        },
      },
      update: {
        value: estimate.value,
        nickname: estimate.nickname,
        updatedAt: new Date(),
      },
      create: {
        sessionId: estimate.sessionId,
        userId: estimate.userId,
        nickname: estimate.nickname,
        value: estimate.value,
      },
    });
    return this.toDomain(data);
  }

  async upsert(
    sessionId: string,
    userId: string,
    nickname: string,
    value: number
  ): Promise<Estimate> {
    const data = await this.prisma.estimate.upsert({
      where: {
        sessionId_userId: {
          sessionId,
          userId,
        },
      },
      update: {
        value,
        nickname,
        updatedAt: new Date(),
      },
      create: {
        sessionId,
        userId,
        nickname,
        value,
      },
    });

    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.estimate.delete({
      where: { id },
    });
  }

  async deleteBySessionId(sessionId: string): Promise<void> {
    await this.prisma.estimate.deleteMany({
      where: { sessionId },
    });
  }

  /**
   * Prismaモデルからドメインエンティティへの変換
   */
  private toDomain(data: PrismaEstimate): Estimate {
    return new Estimate(
      data.id,
      data.sessionId,
      data.userId,
      data.nickname,
      data.value,
      data.createdAt,
      data.updatedAt
    );
  }
}
