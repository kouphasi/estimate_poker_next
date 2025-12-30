import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaUserRepository } from "@/infrastructure/database/repositories/PrismaUserRepository";
import { RegisterUseCase } from "@/application/auth/RegisterUseCase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, nickname } = body;

    // 依存性の組み立て
    const userRepository = new PrismaUserRepository(prisma);
    const useCase = new RegisterUseCase(userRepository);

    // ユースケース実行
    const user = await useCase.execute(email, password, nickname);

    return NextResponse.json(
      {
        message: "ユーザー登録が完了しました",
        user: {
          id: user.id,
          email: user.email?.value,
          nickname: user.nickname,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    const errorMessage = error instanceof Error ? error.message : "ユーザー登録中にエラーが発生しました";
    const statusCode = error instanceof Error &&
      (errorMessage.includes('required') ||
       errorMessage.includes('already exists') ||
       errorMessage.includes('must be') ||
       errorMessage.includes('Invalid email'))
      ? 400
      : 500;

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
