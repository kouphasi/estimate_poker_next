import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateShareToken, generateOwnerToken } from '@/lib/utils'
import { isPrismaError } from '@/lib/prisma-errors'

// POST /api/sessions - セッションを作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // TODO: セキュリティ改善 - userIdはリクエストボディから来るため改ざん可能
    // 将来的にはサーバー側セッション管理（HttpOnly Cookie等）で認証を行う
    const { nickname, userId, name } = body

    if (!nickname || typeof nickname !== 'string' || nickname.trim() === '') {
      return NextResponse.json(
        { error: 'ニックネームを入力してください' },
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

    // セッション作成（トークン衝突時は自動リトライ）
    const session = await createSessionWithRetry({
      shareToken: generateShareToken(),
      ownerToken: generateOwnerToken(),
      ownerId: actualUserId,
      name: name && typeof name === 'string' && name.trim() !== '' ? name.trim() : undefined,
      isRevealed: false,
      status: 'ACTIVE'
    }, 5)

    // 作成者の見積もりエントリを作成
    await prisma.estimate.create({
      data: {
        sessionId: session.id,
        userId: actualUserId,
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
      shareUrl,
      userId: actualUserId
    })
  } catch (error) {
    // 詳細なエラー情報をサーバーログに記録
    console.error('Session creation error:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      errorName: error instanceof Error ? error.name : undefined,
    })

    return NextResponse.json(
      { error: 'セッションの作成に失敗しました' },
      { status: 500 }
    )
  }
}

// トークン衝突時の再試行ロジック
interface SessionCreateData {
  shareToken: string
  ownerToken: string
  ownerId: string
  name?: string
  isRevealed: boolean
  status: 'ACTIVE' | 'FINALIZED'
}

async function createSessionWithRetry(
  data: SessionCreateData,
  maxAttempts: number
): Promise<{ id: string; shareToken: string; ownerToken: string; isRevealed: boolean; status: string; finalEstimate: number | null; createdAt: Date }> {
  try {
    return await prisma.estimationSession.create({ data })
  } catch (error) {
    // リトライのための詳細ログ
    console.error('Create session attempt failed:', {
      error,
      remainingAttempts: maxAttempts,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorCode: isPrismaError(error) ? error.code : undefined,
    })

    // P2002: ユニーク制約違反エラーの場合のみ再試行
    if (isPrismaError(error) && error.code === 'P2002' && maxAttempts > 0) {
      console.log('Unique constraint violation detected, retrying with new tokens...')
      return createSessionWithRetry(
        {
          ...data,
          shareToken: generateShareToken(),
          ownerToken: generateOwnerToken()
        },
        maxAttempts - 1
      )
    }

    // それ以外のエラーは即座にスロー
    throw error
  }
}
