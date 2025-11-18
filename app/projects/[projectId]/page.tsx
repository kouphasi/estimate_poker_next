"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LoadingSpinner from "@/app/components/LoadingSpinner";

interface EstimationSession {
  id: string;
  name: string | null;
  status: string;
  finalEstimate: number | null;
  createdAt: string;
}

interface Task {
  id: string;
  name: string;
  description: string | null;
  finalEstimate: number | null;
  createdAt: string;
  updatedAt: string;
  sessions: EstimationSession[];
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
  stats: {
    taskCount: number;
    completedTaskCount: number;
    totalEstimate: number;
    completionRate: number;
  };
}

export default function ProjectDetailPage({
  params,
}: {
  params: { projectId: string };
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchProject();
    }
  }, [status, router, params.projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/projects/${params.projectId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("プロジェクトが見つかりません");
        }
        throw new Error("Failed to fetch project");
      }

      const data = await response.json();
      setProject(data);
      setEditName(data.name);
      setEditDescription(data.description || "");
    } catch (err) {
      console.error("Error fetching project:", err);
      setError(
        err instanceof Error ? err.message : "プロジェクトの取得に失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!editName.trim()) {
      alert("プロジェクト名を入力してください");
      return;
    }

    try {
      const response = await fetch(`/api/projects/${params.projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update project");
      }

      setIsEditing(false);
      fetchProject();
    } catch (err) {
      console.error("Error updating project:", err);
      alert("プロジェクトの更新に失敗しました");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (
      !confirm(
        "このタスクを削除してもよろしいですか？関連する見積もりセッションもすべて削除されます。"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      fetchProject();
    } catch (err) {
      console.error("Error deleting task:", err);
      alert("タスクの削除に失敗しました");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
          <Link
            href="/projects"
            className="mt-4 inline-block text-blue-600 hover:text-blue-700"
          >
            ← プロジェクト一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* パンくずリスト */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center space-x-2 text-gray-600">
            <li>
              <Link href="/projects" className="hover:text-blue-600">
                プロジェクト
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900">{project.name}</li>
          </ol>
        </nav>

        {/* プロジェクト情報 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  プロジェクト名
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  説明
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleUpdateProject}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  保存
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(project.name);
                    setEditDescription(project.description || "");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {project.name}
                  </h1>
                  {project.description && (
                    <p className="mt-2 text-gray-600">{project.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="ml-4 text-gray-600 hover:text-blue-600 transition-colors"
                  title="編集"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              </div>

              {/* 統計情報 */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">タスク数</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {project.stats.taskCount}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">完了タスク</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {project.stats.completedTaskCount}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">総工数</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {project.stats.totalEstimate.toFixed(1)}
                    <span className="text-sm text-gray-600 ml-1">日</span>
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">進捗率</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {project.stats.completionRate.toFixed(0)}
                    <span className="text-sm text-gray-600 ml-1">%</span>
                  </p>
                </div>
              </div>

              {/* プログレスバー */}
              <div className="mt-6">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${project.stats.completionRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* タスク一覧 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">タスク一覧</h2>
            <Link
              href={`/projects/${params.projectId}/tasks/new`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              新規タスク作成
            </Link>
          </div>

          {project.tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">タスクがありません</p>
              <Link
                href={`/projects/${params.projectId}/tasks/new`}
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                最初のタスクを作成
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {project.tasks.map((task) => (
                <div
                  key={task.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {task.name}
                      </h3>
                      {task.description && (
                        <p className="mt-1 text-sm text-gray-600">
                          {task.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                        <span>
                          セッション数: {task.sessions.length}
                        </span>
                        {task.finalEstimate !== null && (
                          <span className="text-blue-600 font-medium">
                            確定工数: {task.finalEstimate.toFixed(1)}日
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="削除"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
