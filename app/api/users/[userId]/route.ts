import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ユーザー情報を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    // 自分のプロフィールのみ取得可能
    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: "権限がありません" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        isGuest: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "エラーが発生しました" },
      { status: 500 }
    );
  }
}

// ユーザー情報を更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    // 自分のプロフィールのみ更新可能
    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: "権限がありません" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { nickname, currentPassword, newPassword } = body;

    // ユーザーを取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    // 更新するデータを準備
    const updateData: {
      nickname?: string;
      passwordHash?: string;
    } = {};

    // ニックネームの更新
    if (nickname && nickname !== user.nickname) {
      if (nickname.length === 0) {
        return NextResponse.json(
          { error: "ニックネームは必須です" },
          { status: 400 }
        );
      }
      updateData.nickname = nickname;
    }

    // パスワードの更新
    if (newPassword) {
      // 現在のパスワードが必要
      if (!currentPassword) {
        return NextResponse.json(
          { error: "現在のパスワードを入力してください" },
          { status: 400 }
        );
      }

      // 現在のパスワードを確認
      if (!user.passwordHash) {
        return NextResponse.json(
          { error: "パスワードが設定されていません" },
          { status: 400 }
        );
      }

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.passwordHash
      );

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "現在のパスワードが正しくありません" },
          { status: 400 }
        );
      }

      // 新しいパスワードの検証
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "新しいパスワードは8文字以上である必要があります" },
          { status: 400 }
        );
      }

      // 新しいパスワードをハッシュ化
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    // 更新するデータがない場合
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "更新する内容がありません" },
        { status: 200 }
      );
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        nickname: true,
        isGuest: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: "プロフィールを更新しました",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "エラーが発生しました" },
      { status: 500 }
    );
  }
}
