import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // セッションの存在確認とオーナー認証
    const existingSession = await prisma.estimationSession.findUnique({
      where: { shareToken }
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: 'セッションが見つかりません' },
        { status: 404 }
      )
    }

    if (existingSession.ownerToken !== ownerToken) {
      return NextResponse.json(
        { error: '操作する権限がありません' },
        { status: 403 }
      )
    }

    // セッションを更新
    const session = await prisma.estimationSession.update({
      where: { shareToken },
      data: { isRevealed }
    })

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        shareToken: session.shareToken,
        isRevealed: session.isRevealed,
        status: session.status,
        finalEstimate: session.finalEstimate
      }
    })
  } catch (error) {
    // 詳細なエラー情報をサーバーログに記録
    console.error('Reveal toggle error:', {
      error,
      shareToken: (await params).shareToken,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      { error: '公開設定の変更に失敗しました' },
      { status: 500 }
    )
  }
}
