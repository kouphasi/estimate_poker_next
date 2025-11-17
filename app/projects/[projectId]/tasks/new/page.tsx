'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Project {
  id: string;
  name: string;
}

export default function NewTaskPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // プロジェクト情報を取得
  useEffect(() => {
    const fetchProject = async () => {
      if (status !== 'authenticated') return;

      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch project');
        }
        const data = await response.json();
        setProject(data.project);
      } catch (err) {
        setError('プロジェクトの取得に失敗しました');
        console.error(err);
      }
    };

    fetchProject();
  }, [projectId, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'タスクの作成に失敗しました');
      }

      router.push(`/projects/${projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'タスクの作成に失敗しました');
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

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 lg:px-8">
          <nav className="mb-2 text-sm text-zinc-600">
            <button onClick={() => router.push('/projects')} className="hover:text-zinc-900">
              プロジェクト
            </button>
            <span className="mx-2">/</span>
            <button onClick={() => router.push(`/projects/${projectId}`)} className="hover:text-zinc-900">
              {project?.name || 'プロジェクト'}
            </button>
            <span className="mx-2">/</span>
            <span className="text-zinc-900">新規タスク作成</span>
          </nav>
          <h1 className="text-2xl font-bold text-zinc-900">新規タスク作成</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-900">
                タスク名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                placeholder="例: ログイン機能の実装"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-zinc-900">
                説明
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                placeholder="タスクの詳細を記入してください"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 cursor-pointer rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                disabled={isSubmitting}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="flex-1 cursor-pointer rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:bg-zinc-400"
                disabled={isSubmitting}
              >
                {isSubmitting ? '作成中...' : '作成'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
