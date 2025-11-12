'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import Link from 'next/link';

export default function Home() {
  const { user, isLoading: userLoading } = useUser();
  const router = useRouter();

  // 既にログイン済みならマイページへリダイレクト
  useEffect(() => {
    if (!userLoading && user) {
      router.push('/mypage');
    }
  }, [user, userLoading, router]);

  if (userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-lg text-zinc-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-zinc-900">Estimate Poker</h1>
          <p className="mt-2 text-sm text-zinc-600">
            プログラミング工数見積もりアプリケーション
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <div className="text-center text-sm font-medium text-zinc-700 mb-6">
            ログイン方法を選択してください
          </div>

          <Link
            href="/simple-login"
            className="block w-full rounded-md bg-zinc-900 px-4 py-3 text-center text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
          >
            <div className="font-medium">簡易ログイン</div>
            <div className="mt-1 text-xs text-zinc-300">
              ニックネームのみで気軽にご利用
            </div>
          </Link>

          <Link
            href="/login"
            className="block w-full rounded-md border-2 border-zinc-900 bg-white px-4 py-3 text-center text-zinc-900 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
          >
            <div className="font-medium">アカウントでログイン</div>
            <div className="mt-1 text-xs text-zinc-600">
              メールアドレスとパスワードでログイン
            </div>
          </Link>

          <div className="mt-6 text-center">
            <Link
              href="/register"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              アカウントをお持ちでない方は新規登録
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
