import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { generateShareToken } from '@/app/lib/utils'

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

    // ユニークなshareTokenを生成
    let shareToken = generateShareToken()
    let attempts = 0
    const maxAttempts = 5

    // shareTokenの重複チェック
    while (attempts < maxAttempts) {
      const existing = await prisma.estimationSession.findUnique({
        where: { shareToken }
      })

      if (!existing) break

      shareToken = generateShareToken()
      attempts++
    }

    if (attempts === maxAttempts) {
      return NextResponse.json(
        { error: 'トークン生成に失敗しました' },
        { status: 500 }
      )
    }

    // セッション作成
    const session = await prisma.estimationSession.create({
      data: {
        shareToken,
        isRevealed: false,
        status: 'ACTIVE'
      }
    })

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
    const shareUrl = `${protocol}://${host}/estimate/${shareToken}`

    return NextResponse.json({
      sessionId: session.id,
      shareToken: session.shareToken,
      shareUrl
    })
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json(
      { error: 'セッションの作成に失敗しました' },
      { status: 500 }
    )
  }
}
