'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function SetupNicknamePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // ログインしていない場合はログインページにリダイレクト
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // セッションからニックネームを取得
    if (session?.user?.nickname && session.user.nickname !== session.user.email) {
      // 既にニックネームが設定されている場合はマイページにリダイレクト
      router.push('/mypage');
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // バリデーション
    if (!nickname.trim()) {
      setError('ニックネームを入力してください');
      return;
    }

    if (nickname.length > 50) {
      setError('ニックネームは50文字以内で入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/users/setup-nickname', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'ニックネームの設定に失敗しました');
      }

      // 成功したらマイページにリダイレクト
      router.push('/mypage');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-lg text-zinc-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-zinc-900">
            ニックネームを設定
          </h1>
          <p className="mb-6 text-sm text-zinc-600">
            表示名として使用するニックネームを入力してください
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                htmlFor="nickname"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                ニックネーム
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="例: 山田太郎"
                className="w-full rounded-md border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isSubmitting}
                maxLength={50}
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {isSubmitting ? '設定中...' : '設定する'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-zinc-500">
          ニックネームは後からマイページで変更できます
        </p>
      </div>
    </div>
  );
}
