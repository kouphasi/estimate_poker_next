import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/sessions/[shareToken]
 * セッション情報を取得（ポーリング用）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params

    const session = await prisma.estimationSession.findUnique({
      where: { shareToken },
      include: {
        estimates: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'セッションが見つかりません' },
        { status: 404 }
      )
    }

    // isRevealedがfalseの場合、他の参加者の見積もり値を隠す
    const estimates = session.estimates.map((estimate) => ({
      id: estimate.id,
      nickname: estimate.nickname,
      value: session.isRevealed ? estimate.value : null,
      hasEstimated: estimate.value > 0, // 見積もり済みかどうか
      updatedAt: estimate.updatedAt.toISOString(),
    }))

    return NextResponse.json({
      session: {
        id: session.id,
        shareToken: session.shareToken,
        isRevealed: session.isRevealed,
        status: session.status,
        finalEstimate: session.finalEstimate,
        createdAt: session.createdAt.toISOString(),
      },
      estimates,
    })
  } catch (error) {
    console.error('Failed to fetch session:', error)
    return NextResponse.json(
      { error: 'セッション情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}
