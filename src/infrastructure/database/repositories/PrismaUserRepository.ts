import { PrismaClient, User as PrismaUser } from '@prisma/client';
import { UserRepository } from '@/domain/user/UserRepository';
import { User } from '@/domain/user/User';
import { Email } from '@/domain/user/Email';

/**
 * PrismaUserRepository
 * UserRepositoryのPrisma実装
 */
export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const data = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!data) return null;
    return this.toDomain(data);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const data = await this.prisma.user.findUnique({
      where: { email: email.value },
    });

    if (!data) return null;
    return this.toDomain(data);
  }

  async save(user: User): Promise<User> {
    const data = await this.prisma.user.upsert({
      where: { id: user.id },
      update: {
        nickname: user.nickname,
        email: user.email?.value ?? null,
        isGuest: user.isGuest,
        updatedAt: new Date(),
      },
      create: {
        id: user.id,
        email: user.email?.value ?? null,
        nickname: user.nickname,
        isGuest: user.isGuest,
        passwordHash: user.passwordHash ?? null,
      },
    });

    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async createGuest(nickname: string): Promise<User> {
    const data = await this.prisma.user.create({
      data: {
        nickname,
        isGuest: true,
      },
    });

    return this.toDomain(data);
  }

  async createAuthenticated(
    email: Email,
    nickname: string,
    passwordHash: string
  ): Promise<User> {
    const data = await this.prisma.user.create({
      data: {
        email: email.value,
        nickname,
        isGuest: false,
        passwordHash,
      },
    });

    return this.toDomain(data);
  }

  /**
   * Prismaモデルからドメインエンティティへの変換
   */
  private toDomain(data: PrismaUser): User {
    return new User(
      data.id,
      data.email ? Email.create(data.email) : null,
      data.nickname,
      data.isGuest,
      data.createdAt,
      data.updatedAt,
      data.passwordHash
    );
  }
}
