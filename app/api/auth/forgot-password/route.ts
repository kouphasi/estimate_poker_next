import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// トークンの有効期限（1時間）
const TOKEN_EXPIRY_HOURS = 1;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "メールアドレスを入力してください" },
        { status: 400 }
      );
    }

    // メールアドレスが存在するか確認
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // セキュリティ上、ユーザーが存在しない場合でも同じレスポンスを返す
    if (!user) {
      // 本番環境では、メールアドレスが存在しない場合でも成功メッセージを返す
      // （攻撃者にアカウントの存在を知らせないため）
      return NextResponse.json({
        message: "パスワードリセット用のリンクをメールで送信しました",
      });
    }

    // リセットトークンを生成
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + TOKEN_EXPIRY_HOURS);

    // 既存のトークンを削除してから新しいトークンを保存
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: resetToken,
        expires,
      },
    });

    // TODO: 本番環境では、ここでメール送信サービス（SendGrid、AWS SES等）を使用してリセットリンクを送信
    // 現在は開発用として、トークンをコンソールに出力
    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
    console.log("========================================");
    console.log("パスワードリセットリンク:");
    console.log(resetUrl);
    console.log("========================================");

    return NextResponse.json({
      message: "パスワードリセット用のリンクをメールで送信しました",
      // 開発環境でのみトークンを返す（本番では削除すべき）
      ...(process.env.NODE_ENV === "development" && { resetUrl }),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "エラーが発生しました" },
      { status: 500 }
    );
  }
}
