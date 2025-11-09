'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

export default function NewSessionPage() {
  const { user, isLoading: userLoading } = useUser();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  // 未ログインならトップページへリダイレクト
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/');
    }
  }, [user, userLoading, router]);

  // ページ読み込み時に自動的にセッションを作成
  useEffect(() => {
    const createSession = async () => {
      if (!user || isCreating) return;

      setIsCreating(true);
      setError('');

      try {
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nickname: user.nickname,
            userId: user.userId,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'セッションの作成に失敗しました');
        }

        const data = await response.json();

        // ownerTokenをlocalStorageに保存
        if (typeof window !== 'undefined') {
          localStorage.setItem(`ownerToken_${data.shareToken}`, data.ownerToken);
        }

        // 作成した部屋にリダイレクト
        router.push(`/estimate/${data.shareToken}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
        setIsCreating(false);
        console.error('Session creation error:', err);
      }
    };

    createSession();
  }, [user, router, isCreating]);

  if (userLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-lg text-zinc-600">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-zinc-900">エラー</h1>
            <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
            <button
              onClick={() => router.push('/mypage')}
              className="mt-6 w-full rounded-md bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800"
            >
              マイページに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="text-center">
        <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900"></div>
        <div className="text-lg text-zinc-600">部屋を作成中...</div>
      </div>
    </div>
  );
}
