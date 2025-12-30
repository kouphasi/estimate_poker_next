import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/database/prisma'
import { FinalizeSessionUseCase } from '@/application/session/FinalizeSessionUseCase'
import { PrismaSessionRepository } from '@/infrastructure/database/repositories/PrismaSessionRepository'
import { NotFoundError, UnauthorizedError, ValidationError } from '@/domain/errors/DomainError'

// POST /api/sessions/[shareToken]/finalize - 工数確定
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params
    const body = await request.json()
    const { finalEstimate, ownerToken } = body

    if (typeof finalEstimate !== 'number' || finalEstimate <= 0 || finalEstimate > 300) {
      return NextResponse.json(
        { error: '有効な工数を入力してください（0より大きく300以下の数値）' },
        { status: 400 }
      )
    }

    if (!ownerToken || typeof ownerToken !== 'string') {
      return NextResponse.json(
        { error: '認証トークンが必要です' },
        { status: 401 }
      )
    }

    // リポジトリとユースケースのインスタンス化
    const sessionRepository = new PrismaSessionRepository(prisma)
    const finalizeSessionUseCase = new FinalizeSessionUseCase(sessionRepository)

    // セッション確定
    const result = await finalizeSessionUseCase.execute({
      shareToken,
      ownerToken,
      finalEstimate,
    })

    return NextResponse.json({
      success: true,
      session: {
        id: result.id,
        shareToken: result.shareToken,
        status: result.status,
        finalEstimate: result.finalEstimate,
      }
    })
  } catch (error) {
    console.error('Finalize error:', {
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

    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: '操作する権限がありません' },
        { status: 403 }
      )
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: (error as ValidationError).message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '工数の確定に失敗しました' },
      { status: 500 }
    )
  }
}
