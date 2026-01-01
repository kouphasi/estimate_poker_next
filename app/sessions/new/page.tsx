'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

export default function NewSessionPage() {
  const { user, isLoading: userLoading } = useUser();
  const router = useRouter();
  const [sessionName, setSessionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  // 未ログインならトップページへリダイレクト
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/');
    }
  }, [user, userLoading, router]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();

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
          name: sessionName.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'セッションの作成に失敗しました');
      }

      const data = await response.json();

      // ownerTokenとuserIdをlocalStorageに保存
      if (typeof window !== 'undefined') {
        localStorage.setItem(`ownerToken_${data.shareToken}`, data.ownerToken);
        localStorage.setItem(`userId_${data.shareToken}`, data.userId);
      }

      // 作成したセッションにリダイレクト
      router.push(`/estimate/${data.shareToken}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      setIsCreating(false);
      console.error('Session creation error:', err);
    }
  };

  if (userLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">新しいセッションを作成</h1>
          <p className="mt-2 text-sm text-gray-600">
            見積もりセッションの名前を入力してください（任意）
          </p>
        </div>

        <form onSubmit={handleCreateSession} className="mt-8 space-y-6">
          <div>
            <label
              htmlFor="sessionName"
              className="block text-sm font-medium text-gray-700"
            >
              セッション名（任意）
            </label>
            <input
              id="sessionName"
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: ユーザー認証機能の見積もり"
              disabled={isCreating}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isCreating}
            className="cursor-pointer w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isCreating ? 'セッション作成中...' : 'セッションを作成'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/mypage')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← マイページに戻る
          </button>
        </div>
      </div>
    </div>
  );
}
