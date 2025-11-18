import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/projects/[projectId] - プロジェクト詳細取得
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

    const project = await prisma.project.findUnique({
      where: {
        id: projectId
      },
      include: {
        tasks: {
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
        },
        owner: {
          select: {
            id: true,
            nickname: true,
            email: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'プロジェクトが見つかりません' },
        { status: 404 }
      )
    }

    // オーナーチェック
    if (project.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'このプロジェクトにアクセスする権限がありません' },
        { status: 403 }
      )
    }

    // 統計情報を計算
    const totalEstimate = project.tasks.reduce((sum, task) => {
      return sum + (task.finalEstimate || 0)
    }, 0)

    const completedTasks = project.tasks.filter(task => task.finalEstimate !== null).length
    const completionRate = project.tasks.length > 0
      ? (completedTasks / project.tasks.length) * 100
      : 0

    const projectWithStats = {
      ...project,
      stats: {
        totalTasks: project.tasks.length,
        completedTasks,
        completionRate: Math.round(completionRate),
        totalEstimate
      }
    }

    return NextResponse.json({ project: projectWithStats })
  } catch (error) {
    console.error('Project detail error:', error)
    return NextResponse.json(
      { error: 'プロジェクト詳細の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[projectId] - プロジェクト更新
export async function PATCH(
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
        { error: 'このプロジェクトを更新する権限がありません' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description } = body

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return NextResponse.json(
        { error: 'プロジェクト名を入力してください' },
        { status: 400 }
      )
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null })
      }
    })

    return NextResponse.json({ project: updatedProject })
  } catch (error) {
    console.error('Project update error:', error)
    return NextResponse.json(
      { error: 'プロジェクトの更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[projectId] - プロジェクト削除
export async function DELETE(
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
        { error: 'このプロジェクトを削除する権限がありません' },
        { status: 403 }
      )
    }

    await prisma.project.delete({
      where: { id: projectId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Project deletion error:', error)
    return NextResponse.json(
      { error: 'プロジェクトの削除に失敗しました' },
      { status: 500 }
    )
  }
}
