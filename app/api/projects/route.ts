import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/projects - プロジェクト一覧取得
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const projects = await prisma.project.findMany({
      where: {
        ownerId: session.user.id
      },
      include: {
        tasks: {
          select: {
            id: true,
            finalEstimate: true
          }
        },
        _count: {
          select: {
            tasks: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // プロジェクトごとの統計情報を計算
    const projectsWithStats = projects.map(project => {
      const totalEstimate = project.tasks.reduce((sum, task) => {
        return sum + (task.finalEstimate || 0)
      }, 0)

      const completedTasks = project.tasks.filter(task => task.finalEstimate !== null).length
      const completionRate = project.tasks.length > 0
        ? (completedTasks / project.tasks.length) * 100
        : 0

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        ownerId: project.ownerId,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        taskCount: project._count.tasks,
        totalEstimate,
        completedTasks,
        completionRate: Math.round(completionRate)
      }
    })

    return NextResponse.json({ projects: projectsWithStats })
  } catch (error) {
    console.error('Project list error:', error)
    return NextResponse.json(
      { error: 'プロジェクト一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST /api/projects - プロジェクト作成
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'プロジェクト名を入力してください' },
        { status: 400 }
      )
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        ownerId: session.user.id
      }
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('Project creation error:', error)
    return NextResponse.json(
      { error: 'プロジェクトの作成に失敗しました' },
      { status: 500 }
    )
  }
}
