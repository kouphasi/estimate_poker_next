import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { Prisma } from '@prisma/client'

// POST /api/sessions/[shareToken]/finalize - 工数確定
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params
    const body = await request.json()
    const { finalEstimate, ownerToken } = body

    if (typeof finalEstimate !== 'number' || finalEstimate < 0) {
      return NextResponse.json(
        { error: '有効な工数を入力してください' },
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

    // セッションを確定済みに更新
    const session = await prisma.estimationSession.update({
      where: { shareToken },
      data: {
        finalEstimate,
        status: 'FINALIZED',
        isRevealed: true // 確定時は必ず公開する
      }
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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma error:', { code: error.code, meta: error.meta })
    } else {
      console.error('Unexpected finalize error:', error)
    }
    return NextResponse.json(
      { error: '工数の確定に失敗しました' },
      { status: 500 }
    )
  }
}
