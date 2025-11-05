import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * PATCH /api/sessions/[shareToken]/reveal
 * 公開/非公開を切り替え
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params
    const body = await request.json()
    const { isRevealed } = body

    if (typeof isRevealed !== 'boolean') {
      return NextResponse.json(
        { error: 'isRevealedはboolean型である必要があります' },
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

    // 公開/非公開を更新
    const updatedSession = await prisma.estimationSession.update({
      where: { shareToken },
      data: { isRevealed },
    })

    return NextResponse.json({
      id: updatedSession.id,
      shareToken: updatedSession.shareToken,
      isRevealed: updatedSession.isRevealed,
      status: updatedSession.status,
    })
  } catch (error) {
    console.error('Failed to update reveal status:', error)
    return NextResponse.json(
      { error: '公開/非公開の切り替えに失敗しました' },
      { status: 500 }
    )
  }
}
