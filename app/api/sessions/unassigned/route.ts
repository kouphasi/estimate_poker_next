import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/sessions/unassigned - 無所属の見積もりセッション一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // 認証チェック
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 無所属セッション（taskId = null）を取得
    const sessions = await prisma.estimationSession.findMany({
      where: {
        ownerId: session.user.id,
        taskId: null, // 無所属
      },
      include: {
        estimates: {
          select: {
            id: true,
            nickname: true,
            value: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 統計情報を計算
    const sessionsWithStats = sessions.map((session) => {
      const estimateCount = session.estimates.length;
      const avgEstimate = estimateCount > 0
        ? session.estimates.reduce((sum, e) => sum + e.value, 0) / estimateCount
        : null;

      return {
        id: session.id,
        name: session.name,
        shareToken: session.shareToken,
        status: session.status,
        isRevealed: session.isRevealed,
        finalEstimate: session.finalEstimate,
        createdAt: session.createdAt,
        estimateCount,
        avgEstimate,
      };
    });

    return NextResponse.json(sessionsWithStats);
  } catch (error) {
    console.error("無所属セッション一覧取得エラー:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
