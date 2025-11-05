import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/sessions/[shareToken]/estimates
 * 見積もりを投稿または更新
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params
    const body = await request.json()
    const { nickname, value } = body

    if (!nickname || typeof nickname !== 'string' || nickname.trim() === '') {
      return NextResponse.json(
        { error: 'ニックネームは必須です' },
        { status: 400 }
      )
    }

    if (typeof value !== 'number' || value < 0) {
      return NextResponse.json(
        { error: '見積もり値は0以上の数値である必要があります' },
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

    if (session.status === 'FINALIZED') {
      return NextResponse.json(
        { error: 'このセッションは既に確定済みです' },
        { status: 400 }
      )
    }

    // 見積もりをupsert（既存なら更新、なければ作成）
    const estimate = await prisma.estimate.upsert({
      where: {
        sessionId_nickname: {
          sessionId: session.id,
          nickname: nickname.trim(),
        },
      },
      update: {
        value,
      },
      create: {
        sessionId: session.id,
        nickname: nickname.trim(),
        value,
      },
    })

    return NextResponse.json({
      id: estimate.id,
      nickname: estimate.nickname,
      value: estimate.value,
      updatedAt: estimate.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Failed to submit estimate:', error)
    return NextResponse.json(
      { error: '見積もりの投稿に失敗しました' },
      { status: 500 }
    )
  }
}
