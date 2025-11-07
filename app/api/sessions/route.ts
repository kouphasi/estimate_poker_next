import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateShareToken, generateOwnerToken } from '@/lib/utils'
import { Prisma } from '@prisma/client'

// POST /api/sessions - 部屋を作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nickname } = body

    if (!nickname || typeof nickname !== 'string' || nickname.trim() === '') {
      return NextResponse.json(
        { error: 'ニックネームを入力してください' },
        { status: 400 }
      )
    }

    // セッション作成（トークン衝突時は自動リトライ）
    const session = await createSessionWithRetry({
      shareToken: generateShareToken(),
      ownerToken: generateOwnerToken(),
      isRevealed: false,
      status: 'ACTIVE'
    }, 5)

    // 作成者の見積もりエントリを作成
    await prisma.estimate.create({
      data: {
        sessionId: session.id,
        nickname: nickname.trim(),
        value: 0 // 初期値
      }
    })

    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host') || 'localhost:3000'
    const shareUrl = `${protocol}://${host}/estimate/${session.shareToken}`

    return NextResponse.json({
      sessionId: session.id,
      shareToken: session.shareToken,
      ownerToken: session.ownerToken,
      shareUrl
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma error:', { code: error.code, meta: error.meta, message: error.message })

      // Prepared statement エラーの場合は再接続を試みる
      if (error.message?.includes('prepared statement')) {
        try {
          await prisma.$disconnect()
        } catch (disconnectError) {
          console.error('Disconnect error:', disconnectError)
        }
      }

      return NextResponse.json(
        { error: 'データベースエラーが発生しました' },
        { status: 500 }
      )
    }
    console.error('Unexpected session creation error:', error)
    return NextResponse.json(
      { error: 'セッションの作成に失敗しました' },
      { status: 500 }
    )
  }
}

// トークン衝突時の再試行ロジック
async function createSessionWithRetry(
  data: Prisma.EstimationSessionCreateInput,
  maxAttempts: number
): Promise<{ id: string; shareToken: string; ownerToken: string; isRevealed: boolean; status: string; finalEstimate: number | null; createdAt: Date }> {
  try {
    return await prisma.estimationSession.create({ data })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      maxAttempts > 0
    ) {
      // ユニーク制約違反の場合、新しいトークンで再試行
      return createSessionWithRetry(
        {
          ...data,
          shareToken: generateShareToken(),
          ownerToken: generateOwnerToken()
        },
        maxAttempts - 1
      )
    }
    throw error
  }
}
