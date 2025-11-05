import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/sessions/[shareToken]/finalize
 * 工数を確定
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params
    const body = await request.json()
    const { finalEstimate } = body

    if (typeof finalEstimate !== 'number' || finalEstimate < 0) {
      return NextResponse.json(
        { error: '確定工数は0以上の数値である必要があります' },
        { status: 400 }
      )
    }

    // セッションの存在確認
    const session = await prisma.estimationSession.findUnique({
      where: { shareToken },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'セッションが見つかりません' },
        { status: 404 }
      )
    }

    // 工数を確定してステータスをFINALIZEDに変更
    const updatedSession = await prisma.estimationSession.update({
      where: { shareToken },
      data: {
        finalEstimate,
        status: 'FINALIZED',
      },
    })

    return NextResponse.json({
      id: updatedSession.id,
      shareToken: updatedSession.shareToken,
      status: updatedSession.status,
      finalEstimate: updatedSession.finalEstimate,
    })
  } catch (error) {
    console.error('Failed to finalize estimate:', error)
    return NextResponse.json(
      { error: '工数の確定に失敗しました' },
      { status: 500 }
    )
  }
}
