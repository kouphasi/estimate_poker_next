import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaUserRepository } from '@/infrastructure/database/repositories/PrismaUserRepository';
import { CreateGuestUserUseCase } from '@/application/auth/CreateGuestUserUseCase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname } = body;

    // 依存性の組み立て
    const userRepository = new PrismaUserRepository(prisma);
    const useCase = new CreateGuestUserUseCase(userRepository);

    // ユースケース実行
    const user = await useCase.execute(nickname);

    return NextResponse.json(
      {
        userId: user.id,
        nickname: user.nickname,
      },
      { status: 201 }
    );
  } catch (error) {
    // 詳細なエラー情報をサーバーログに記録
    console.error('Error creating user:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create user' },
      { status: error instanceof Error && error.message.includes('required') ? 400 : 500 }
    );
  }
}
