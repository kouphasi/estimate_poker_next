import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/database/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname } = body;

    if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nickname is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        nickname: nickname.trim(),
        isGuest: true,
      },
    });

    return NextResponse.json({
      userId: user.id,
      nickname: user.nickname,
    });
  } catch (error) {
    // 詳細なエラー情報をサーバーログに記録
    console.error('Error creating user:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
