'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  taskCount: number;
  totalEstimate: number;
  completedTasks: number;
  completionRate: number;
}

export default function ProjectsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 未ログインならログインページへリダイレクト
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // プロジェクト一覧を取得
  useEffect(() => {
    const fetchProjects = async () => {
      if (status !== 'authenticated') return;

      try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        const data = await response.json();
        setProjects(data.projects);
      } catch (err) {
        setError('プロジェクト一覧の取得に失敗しました');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [status]);

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('このプロジェクトを削除してもよろしいですか？配下のタスクも全て削除されます。')) return;

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      // 削除成功したら一覧から除外
      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (err) {
      alert('プロジェクトの削除に失敗しました');
      console.error(err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-lg text-zinc-600">読み込み中...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">プロジェクト</h1>
              <p className="mt-1 text-sm text-zinc-600">
                プロジェクトとタスクの管理
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/mypage')}
                className="cursor-pointer rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                マイページ
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">
            プロジェクト一覧
          </h2>
          <button
            onClick={() => router.push('/projects/new')}
            className="cursor-pointer rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800"
          >
            新規プロジェクト作成
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {projects.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
            <p className="text-zinc-600">
              まだプロジェクトを作成していません。
              <br />
              新規プロジェクトを作成してみましょう！
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="rounded-lg border border-zinc-200 bg-white p-6 transition hover:shadow-md"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-zinc-900">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="mt-2 text-sm text-zinc-600 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </div>

                <div className="mb-4 space-y-2 text-sm text-zinc-600">
                  <div className="flex justify-between">
                    <span>タスク数:</span>
                    <span className="font-medium">{project.taskCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>完了タスク:</span>
                    <span className="font-medium">{project.completedTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>進捗率:</span>
                    <span className="font-medium">{project.completionRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>合計工数:</span>
                    <span className="font-medium">{project.totalEstimate.toFixed(1)}日</span>
                  </div>
                </div>

                {/* プログレスバー */}
                <div className="mb-4">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${project.completionRate}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-xs text-zinc-500">
                  作成日: {formatDate(project.createdAt)}
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="flex-1 cursor-pointer rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    詳細
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="cursor-pointer rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
