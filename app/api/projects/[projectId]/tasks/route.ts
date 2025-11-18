import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/projects/[projectId]/tasks - タスク一覧取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { projectId } = await params

    // プロジェクトの存在確認とオーナーチェック
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'プロジェクトが見つかりません' },
        { status: 404 }
      )
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'このプロジェクトにアクセスする権限がありません' },
        { status: 403 }
      )
    }

    const tasks = await prisma.task.findMany({
      where: {
        projectId: projectId
      },
      include: {
        sessions: {
          select: {
            id: true,
            status: true,
            finalEstimate: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Task list error:', error)
    return NextResponse.json(
      { error: 'タスク一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[projectId]/tasks - タスク作成
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { projectId } = await params

    // プロジェクトの存在確認とオーナーチェック
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'プロジェクトが見つかりません' },
        { status: 404 }
      )
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'このプロジェクトにタスクを追加する権限がありません' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'タスク名を入力してください' },
        { status: 400 }
      )
    }

    const task = await prisma.task.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        projectId: projectId
      }
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Task creation error:', error)
    return NextResponse.json(
      { error: 'タスクの作成に失敗しました' },
      { status: 500 }
    )
  }
}
