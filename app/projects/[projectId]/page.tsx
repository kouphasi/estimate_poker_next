'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Session {
  id: string;
  status: 'ACTIVE' | 'FINALIZED';
  finalEstimate: number | null;
  createdAt: string;
}

interface Task {
  id: string;
  name: string;
  description: string | null;
  finalEstimate: number | null;
  createdAt: string;
  sessions: Session[];
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
  stats: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    totalEstimate: number;
  };
}

export default function ProjectDetailPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // プロジェクト詳細を取得
  useEffect(() => {
    const fetchProject = async () => {
      if (status !== 'authenticated') return;

      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('プロジェクトが見つかりません');
          }
          throw new Error('Failed to fetch project');
        }
        const data = await response.json();
        setProject(data.project);
        setEditName(data.project.name);
        setEditDescription(data.project.description || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'プロジェクトの取得に失敗しました');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId, status]);

  const handleUpdateProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      const data = await response.json();
      setProject((prev) => prev ? { ...prev, ...data.project } : null);
      setIsEditing(false);
    } catch (err) {
      alert('プロジェクトの更新に失敗しました');
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
    router.push('/login');
    return null;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="text-lg text-red-600">{error}</div>
          <button
            onClick={() => router.push('/projects')}
            className="mt-4 cursor-pointer rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800"
          >
            プロジェクト一覧へ戻る
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <nav className="mb-2 text-sm text-zinc-600">
            <button onClick={() => router.push('/projects')} className="hover:text-zinc-900">
              プロジェクト
            </button>
            <span className="mx-2">/</span>
            <span className="text-zinc-900">{project.name}</span>
          </nav>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="block w-full max-w-2xl rounded-md border border-zinc-300 px-3 py-2 text-xl font-bold text-zinc-900"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                    className="block w-full max-w-2xl rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-600"
                    placeholder="説明を入力してください"
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-zinc-900">{project.name}</h1>
                  {project.description && (
                    <p className="mt-1 text-sm text-zinc-600">{project.description}</p>
                  )}
                </>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(project.name);
                      setEditDescription(project.description || '');
                    }}
                    className="cursor-pointer rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleUpdateProject}
                    className="cursor-pointer rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800"
                  >
                    保存
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="cursor-pointer rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  編集
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 統計情報 */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <div className="text-sm text-zinc-600">総タスク数</div>
            <div className="mt-2 text-3xl font-bold text-zinc-900">
              {project.stats.totalTasks}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <div className="text-sm text-zinc-600">完了タスク</div>
            <div className="mt-2 text-3xl font-bold text-green-600">
              {project.stats.completedTasks}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <div className="text-sm text-zinc-600">進捗率</div>
            <div className="mt-2 text-3xl font-bold text-blue-600">
              {project.stats.completionRate}%
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <div className="text-sm text-zinc-600">合計工数</div>
            <div className="mt-2 text-3xl font-bold text-purple-600">
              {project.stats.totalEstimate.toFixed(1)}日
            </div>
          </div>
        </div>

        {/* プログレスバー */}
        <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-zinc-600">プロジェクト進捗</span>
            <span className="font-medium text-zinc-900">{project.stats.completionRate}%</span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${project.stats.completionRate}%` }}
            ></div>
          </div>
        </div>

        {/* タスク一覧 */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">タスク一覧</h2>
          <button
            onClick={() => router.push(`/projects/${projectId}/tasks/new`)}
            className="cursor-pointer rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800"
          >
            新規タスク作成
          </button>
        </div>

        {project.tasks.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
            <p className="text-zinc-600">
              まだタスクを作成していません。
              <br />
              新規タスクを作成してみましょう！
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {project.tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-lg border border-zinc-200 bg-white p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-zinc-900">
                      {task.name}
                    </h3>
                    {task.description && (
                      <p className="mt-1 text-sm text-zinc-600">{task.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-sm text-zinc-600">
                      <span>作成日: {formatDate(task.createdAt)}</span>
                      {task.finalEstimate !== null ? (
                        <span className="font-medium text-green-600">
                          確定工数: {task.finalEstimate}日
                        </span>
                      ) : (
                        <span className="text-zinc-400">未確定</span>
                      )}
                      <span>セッション数: {task.sessions.length}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/projects/${projectId}/tasks/${task.id}`)}
                      className="cursor-pointer rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                    >
                      詳細
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
