import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/database/prisma'
import { ToggleRevealUseCase } from '@/application/session/ToggleRevealUseCase'
import { PrismaSessionRepository } from '@/infrastructure/database/repositories/PrismaSessionRepository'
import { NotFoundError, UnauthorizedError } from '@/domain/errors/DomainError'

// PATCH /api/sessions/[shareToken]/reveal - 公開/非公開切り替え
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params
    const body = await request.json()
    const { isRevealed, ownerToken } = body

    if (typeof isRevealed !== 'boolean') {
      return NextResponse.json(
        { error: '無効なリクエストです' },
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
    const toggleRevealUseCase = new ToggleRevealUseCase(sessionRepository)

    // Reveal/Hide操作
    const result = await toggleRevealUseCase.execute({
      shareToken,
      ownerToken,
      reveal: isRevealed,
    })

    return NextResponse.json({
      success: true,
      session: {
        id: result.id,
        shareToken: result.shareToken,
        isRevealed: result.isRevealed,
      }
    })
  } catch (error) {
    console.error('Reveal toggle error:', {
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

    return NextResponse.json(
      { error: '公開設定の変更に失敗しました' },
      { status: 500 }
    )
  }
}
