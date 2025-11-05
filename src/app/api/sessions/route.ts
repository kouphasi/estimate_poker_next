import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateShareToken } from '@/lib/utils'

/**
 * POST /api/sessions
 * 部屋（見積もりセッション）を作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nickname } = body

    if (!nickname || typeof nickname !== 'string' || nickname.trim() === '') {
      return NextResponse.json(
        { error: 'ニックネームは必須です' },
        { status: 400 }
      )
    }

    // ユニークなshareTokenを生成（重複チェック付き）
    let shareToken = generateShareToken()
    let existingSession = await prisma.estimationSession.findUnique({
      where: { shareToken },
    })

    // 万が一重複した場合は再生成
    while (existingSession) {
      shareToken = generateShareToken()
      existingSession = await prisma.estimationSession.findUnique({
        where: { shareToken },
      })
    }

    // セッションを作成
    const session = await prisma.estimationSession.create({
      data: {
        shareToken,
      },
    })

    // 作成者の見積もりを初期化（値はnullのまま）
    await prisma.estimate.create({
      data: {
        sessionId: session.id,
        nickname: nickname.trim(),
        value: 0, // 初期値として0を設定（後で更新される）
      },
    })

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/estimate/${shareToken}`

    return NextResponse.json({
      sessionId: session.id,
      shareToken: session.shareToken,
      shareUrl,
    })
  } catch (error) {
    console.error('Failed to create session:', error)
    return NextResponse.json(
      { error: 'セッションの作成に失敗しました' },
      { status: 500 }
    )
  }
}
