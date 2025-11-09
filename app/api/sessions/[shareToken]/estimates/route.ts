import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // セッションを確認
    const session = await prisma.estimationSession.findUnique({
      where: { shareToken }
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

    // ユーザーIDが提供されていない場合、新規ユーザーを作成
    let actualUserId = userId
    if (!actualUserId) {
      const user = await prisma.user.create({
        data: {
          nickname: nickname.trim(),
          isGuest: true
        }
      })
      actualUserId = user.id
    }

    // upsert で見積もりを作成または更新
    const estimate = await prisma.estimate.upsert({
      where: {
        sessionId_userId: {
          sessionId: session.id,
          userId: actualUserId
        }
      },
      update: {
        value,
        nickname: nickname.trim()
      },
      create: {
        sessionId: session.id,
        userId: actualUserId,
        nickname: nickname.trim(),
        value
      }
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
    console.error('Estimate submission error:', error)
    return NextResponse.json(
      { error: '見積もりの投稿に失敗しました' },
      { status: 500 }
    )
  }
}
