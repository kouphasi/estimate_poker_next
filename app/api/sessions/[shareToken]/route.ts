import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/database/prisma';
import { GetSessionUseCase } from '@/application/session/GetSessionUseCase';
import { DeleteSessionUseCase } from '@/application/session/DeleteSessionUseCase';
import { PrismaSessionRepository } from '@/infrastructure/database/repositories/PrismaSessionRepository';
import { PrismaEstimateRepository } from '@/infrastructure/database/repositories/PrismaEstimateRepository';
import { NotFoundError, UnauthorizedError } from '@/domain/errors/DomainError';

type TimerState = {
  endAt: number | null;
  isRunning: boolean;
};

const timerStore = new Map<string, TimerState>();

// GET /api/sessions/[shareToken] - セッション情報と見積もり一覧を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params;

    const sessionRepository = new PrismaSessionRepository(prisma);
    const estimateRepository = new PrismaEstimateRepository(prisma);
    const getSessionUseCase = new GetSessionUseCase(sessionRepository, estimateRepository);

    const result = await getSessionUseCase.execute(shareToken);

    const timerState = timerStore.get(shareToken) ?? { endAt: null, isRunning: false };

    return NextResponse.json({
      session: {
        id: result.id,
        name: result.name,
        shareToken: result.shareToken,
        isRevealed: result.isRevealed,
        status: result.status,
        finalEstimate: result.finalEstimate,
      },
      timer: timerState,
      estimates: result.estimates.map((est) => ({
        userId: est.userId,
        nickname: est.nickname,
        value: est.value,
        updatedAt: est.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching session:', {
      error,
      shareToken: (await params).shareToken,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params;
    const body = await request.json();
    const { endAt, isRunning } = body ?? {};

    if (typeof isRunning !== 'boolean') {
      return NextResponse.json(
        { error: 'isRunning is required' },
        { status: 400 }
      );
    }

    if (endAt !== null && typeof endAt !== 'number') {
      return NextResponse.json(
        { error: 'endAt must be a number or null' },
        { status: 400 }
      );
    }

    const timerState: TimerState = {
      endAt: endAt ?? null,
      isRunning,
    };

    timerStore.set(shareToken, timerState);

    return NextResponse.json({ timer: timerState });
  } catch (error) {
    console.error('Error updating timer:', {
      error,
      shareToken: (await params).shareToken,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'Failed to update timer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params;
    const body = await request.json();
    const { ownerToken } = body;

    if (!ownerToken) {
      return NextResponse.json(
        { error: 'Owner token is required' },
        { status: 401 }
      );
    }

    const sessionRepository = new PrismaSessionRepository(prisma);
    const deleteSessionUseCase = new DeleteSessionUseCase(sessionRepository);

    await deleteSessionUseCase.execute({ shareToken, ownerToken });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', {
      error,
      shareToken: (await params).shareToken,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: 'Invalid owner token' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
