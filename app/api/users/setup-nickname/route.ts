import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/infrastructure/database/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    // リクエストボディを取得
    const body = await request.json();
    const { nickname } = body;

    // バリデーション
    if (!nickname || typeof nickname !== 'string') {
      return NextResponse.json(
        { error: 'ニックネームを入力してください' },
        { status: 400 }
      );
    }

    const trimmedNickname = nickname.trim();

    if (!trimmedNickname) {
      return NextResponse.json(
        { error: 'ニックネームを入力してください' },
        { status: 400 }
      );
    }

    if (trimmedNickname.length > 50) {
      return NextResponse.json(
        { error: 'ニックネームは50文字以内で入力してください' },
        { status: 400 }
      );
    }

    // ニックネームを更新
    await prisma.user.update({
      where: { id: session.user.id },
      data: { nickname: trimmedNickname },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating nickname:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
