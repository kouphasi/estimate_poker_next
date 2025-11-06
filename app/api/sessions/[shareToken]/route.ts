import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

// GET /api/sessions/[shareToken] - セッション情報取得（ポーリング用）
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
            createdAt: 'asc'
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'セッションが見つかりません' },
        { status: 404 }
      )
    }

    // 公開モードでない場合は、見積もり値を隠す
    const estimates = session.isRevealed
      ? session.estimates.map((e: { nickname: string; value: number; updatedAt: Date }) => ({
          nickname: e.nickname,
          value: e.value,
          updatedAt: e.updatedAt
        }))
      : session.estimates.map((e: { nickname: string; value: number; updatedAt: Date }) => ({
          nickname: e.nickname,
          value: e.value > 0 ? -1 : 0, // -1は「提出済み」を示す
          updatedAt: e.updatedAt
        }))

    return NextResponse.json({
      session: {
        id: session.id,
        shareToken: session.shareToken,
        isRevealed: session.isRevealed,
        status: session.status,
        finalEstimate: session.finalEstimate
      },
      estimates
    })
  } catch (error) {
    console.error('Session fetch error:', error)
    return NextResponse.json(
      { error: 'セッション情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}
