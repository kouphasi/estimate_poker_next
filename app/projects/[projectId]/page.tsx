"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useToast } from "@/app/components/Toast";
import ProjectInvitationManager from "@/app/components/ProjectInvitationManager";
import ProjectJoinRequestManager from "@/app/components/ProjectJoinRequestManager";

interface Session {
  id: string;
  name: string | null;
  shareToken: string;
  status: "ACTIVE" | "FINALIZED";
  finalEstimate: number | null;
  createdAt: string;
  _count: {
    estimates: number;
  };
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  role: "owner" | "member";
  sessions: Session[];
}

export default function ProjectDetailPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const { showToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [creatingSession, setCreatingSession] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (authStatus === "authenticated") {
      fetchProject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}`);

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        if (response.status === 404) {
          setError("プロジェクトが見つかりません");
          return;
        }
        throw new Error("Failed to fetch project");
      }

      const data = await response.json();
      setProject(data.project);
      setEditName(data.project.name);
      setEditDescription(data.project.description || "");
    } catch (err) {
      console.error("Error fetching project:", err);
      setError("プロジェクトの読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingSession(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: sessionName.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create session");
      }

      const data = await response.json();

      // Store owner token
      if (typeof window !== "undefined") {
        localStorage.setItem(`ownerToken_${data.shareToken}`, data.ownerToken);
      }

      showToast("セッションを作成しました", "success");

      // Redirect to the session
      router.push(`/estimate/${data.shareToken}`);
    } catch (err) {
      console.error("Error creating session:", err);
      showToast("セッションの作成に失敗しました", "error");
      setCreatingSession(false);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
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

      await fetchProject();
      setEditMode(false);
      showToast("プロジェクトを更新しました", "success");
    } catch (err) {
      console.error("Error updating project:", err);
      showToast("プロジェクトの更新に失敗しました", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteProject = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      const data = await response.json();
      showToast(
        `プロジェクトを削除しました（セッション ${data.deletedSessionsCount} 件を含む）`,
        "success"
      );
      router.push("/projects");
    } catch (err) {
      console.error("Error deleting project:", err);
      showToast("プロジェクトの削除に失敗しました", "error");
      setDeleting(false);
    }
  };

  const calculateStatistics = () => {
    if (!project) return { total: 0, finalized: 0, totalEffort: 0, completionRate: 0 };

    const total = project.sessions.length;
    const finalized = project.sessions.filter(s => s.status === "FINALIZED").length;
    const totalEffort = project.sessions
      .filter(s => s.finalEstimate !== null)
      .reduce((sum, s) => sum + (s.finalEstimate || 0), 0);
    const completionRate = total > 0 ? (finalized / total) * 100 : 0;

    return { total, finalized, totalEffort, completionRate };
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || "プロジェクトが見つかりません"}
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

  const stats = calculateStatistics();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-4 text-sm text-gray-600">
          <Link href="/mypage" className="hover:text-blue-600">マイページ</Link>
          <span className="mx-2">/</span>
          <Link href="/projects" className="hover:text-blue-600">プロジェクト一覧</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{project.name}</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          {editMode ? (
            <form onSubmit={handleUpdateProject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  プロジェクト名
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  プロジェクト説明
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {updating ? "更新中..." : "保存"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false);
                    setEditName(project.name);
                    setEditDescription(project.description || "");
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  キャンセル
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {project.name}
                  </h1>
                  {project.description && (
                    <p className="text-gray-600">{project.description}</p>
                  )}
                  <p className="text-sm text-gray-400 mt-2">
                    作成日: {new Date(project.createdAt).toLocaleDateString("ja-JP")}
                  </p>
                </div>
                {project.role === "owner" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditMode(true)}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50"
                    >
                      削除
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">総セッション数</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">確定済み</div>
            <div className="text-3xl font-bold text-green-600">{stats.finalized}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">総工数</div>
            <div className="text-3xl font-bold text-blue-600">
              {stats.totalEffort.toFixed(1)}
              <span className="text-lg ml-1">日</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">完了率</div>
            <div className="text-3xl font-bold text-purple-600">
              {stats.completionRate.toFixed(0)}%
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Invitation Management Section - オーナーのみ */}
        {project.role === "owner" && (
          <div className="mb-6">
            <ProjectInvitationManager projectId={projectId} />
          </div>
        )}

        {/* Join Request Management Section - オーナーのみ */}
        {project.role === "owner" && (
          <div className="mb-6">
            <ProjectJoinRequestManager projectId={projectId} />
          </div>
        )}

        {/* Sessions Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">見積もりセッション</h2>
            {project.role === "owner" && (
              <button
                onClick={() => setShowCreateSession(true)}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                + 新規セッション
              </button>
            )}
          </div>

          {/* Create Session Form */}
          {showCreateSession && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <form onSubmit={handleCreateSession}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    セッション名（任意）
                  </label>
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="例: ログイン機能の工数見積もり"
                    disabled={creatingSession}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={creatingSession}
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    {creatingSession ? "作成中..." : "セッションを作成"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateSession(false);
                      setSessionName("");
                    }}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Sessions List */}
          {project.sessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <p className="text-gray-600">セッションがまだありません</p>
            </div>
          ) : (
            <div className="space-y-3">
              {project.sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/estimate/${session.shareToken}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {session.name || "名称未設定"}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>{session._count?.estimates ?? 0} 名参加</span>
                        <span>
                          {new Date(session.createdAt).toLocaleDateString("ja-JP")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {session.finalEstimate !== null && (
                        <div className="text-right">
                          <div className="text-sm text-gray-600">確定工数</div>
                          <div className="text-lg font-bold text-blue-600">
                            {session.finalEstimate} 日
                          </div>
                        </div>
                      )}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          session.status === "FINALIZED"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {session.status === "FINALIZED" ? "確定済み" : "進行中"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && project && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                プロジェクトの削除
              </h3>
              <p className="text-gray-600 mb-4">
                本当にこのプロジェクトを削除しますか？
              </p>

              {/* セッション数の警告 */}
              {project.sessions.length > 0 && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-orange-800 text-sm font-medium">
                    ⚠️ このプロジェクトには <span className="font-bold">{project.sessions.length} 件</span>のセッションが含まれています
                  </p>
                </div>
              )}

              <p className="text-gray-600 mb-6">
                <span className="text-red-600 font-semibold">
                  この操作は取り消せません。プロジェクトに紐付く全てのセッションも削除されます。
                </span>
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleDeleteProject}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-300"
                >
                  {deleting ? "削除中..." : "削除する"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
