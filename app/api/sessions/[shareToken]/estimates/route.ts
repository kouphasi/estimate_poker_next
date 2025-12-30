import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/database/prisma'
import { SubmitEstimateUseCase } from '@/application/session/SubmitEstimateUseCase'
import { CreateGuestUserUseCase } from '@/application/auth/CreateGuestUserUseCase'
import { PrismaSessionRepository } from '@/infrastructure/database/repositories/PrismaSessionRepository'
import { PrismaEstimateRepository } from '@/infrastructure/database/repositories/PrismaEstimateRepository'
import { PrismaUserRepository } from '@/infrastructure/database/repositories/PrismaUserRepository'
import { NotFoundError, ValidationError } from '@/domain/errors/DomainError'

// POST /api/sessions/[shareToken]/estimates - 見積もりを投稿
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params
    const body = await request.json()
    const { nickname, value, userId } = body

    if (!nickname || typeof nickname !== 'string' || nickname.trim() === '') {
      return NextResponse.json(
        { error: 'ニックネームを入力してください' },
        { status: 400 }
      )
    }

    if (typeof value !== 'number' || value < 0) {
      return NextResponse.json(
        { error: '有効な見積もり値を入力してください' },
        { status: 400 }
      )
    }

    // リポジトリのインスタンス化
    const userRepository = new PrismaUserRepository(prisma)
    const sessionRepository = new PrismaSessionRepository(prisma)
    const estimateRepository = new PrismaEstimateRepository(prisma)

    // ユーザーIDが提供されていない場合、新規ゲストユーザーを作成
    let actualUserId = userId
    if (!actualUserId) {
      const createGuestUserUseCase = new CreateGuestUserUseCase(userRepository)
      const user = await createGuestUserUseCase.execute(nickname.trim())
      actualUserId = user.id
    }

    // 見積もり投稿
    const submitEstimateUseCase = new SubmitEstimateUseCase(
      sessionRepository,
      estimateRepository,
      userRepository
    )

    const estimate = await submitEstimateUseCase.execute({
      shareToken,
      userId: actualUserId,
      nickname: nickname.trim(),
      value,
    })

    return NextResponse.json({
      success: true,
      estimate: {
        nickname: estimate.nickname,
        value: estimate.value,
        updatedAt: estimate.updatedAt
      },
      userId: actualUserId
    })
  } catch (error) {
    console.error('Estimate submission error:', {
      error,
      shareToken: (await params).shareToken,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
    })

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'セッションが見つかりません' },
        { status: 404 }
      )
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: (error as ValidationError).message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '見積もりの投稿に失敗しました' },
      { status: 500 }
    )
  }
}
