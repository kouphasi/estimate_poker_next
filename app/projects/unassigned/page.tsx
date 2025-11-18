"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LoadingSpinner from "@/app/components/LoadingSpinner";

interface UnassignedSession {
  id: string;
  name: string | null;
  shareToken: string;
  status: string;
  isRevealed: boolean;
  finalEstimate: number | null;
  createdAt: string;
  estimateCount: number;
  avgEstimate: number | null;
}

export default function UnassignedSessionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<UnassignedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchSessions();
    }
  }, [status, router]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/sessions/unassigned");

      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }

      const data = await response.json();
      setSessions(data);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError("無所属セッションの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (shareToken: string) => {
    if (
      !confirm(
        "このセッションを削除してもよろしいですか？関連する見積もりもすべて削除されます。"
      )
    ) {
      return;
    }

    try {
      // ownerToken を取得（localStorage に保存されている）
      const ownerToken = localStorage.getItem(`ownerToken_${shareToken}`);

      const response = await fetch(`/api/sessions/${shareToken}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ownerToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete session");
      }

      // セッション一覧を再取得
      fetchSessions();
    } catch (err) {
      console.error("Error deleting session:", err);
      alert("セッションの削除に失敗しました");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ナビゲーション */}
        <nav className="mb-6">
          <Link
            href="/projects"
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            プロジェクト一覧に戻る
          </Link>
        </nav>

        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                無所属セッション
              </h1>
              <p className="mt-2 text-gray-600">
                プロジェクトに紐付けない見積もりセッション
              </p>
            </div>
            <Link
              href="/sessions/new?unassigned=true"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              新規セッション作成
            </Link>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* セッション一覧 */}
        {sessions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              無所属セッションがありません
            </h3>
            <p className="text-gray-600 mb-6">
              新しいセッションを作成して見積もりを始めましょう
            </p>
            <Link
              href="/sessions/new?unassigned=true"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              最初のセッションを作成
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const createdDate = new Date(session.createdAt).toLocaleDateString(
                "ja-JP"
              );

              return (
                <div
                  key={session.id}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {session.name || `セッション (${session.shareToken})`}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            session.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {session.status === "ACTIVE" ? "アクティブ" : "確定済み"}
                        </span>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                        <span>作成日: {createdDate}</span>
                        <span>参加者: {session.estimateCount}人</span>
                        {session.avgEstimate !== null && (
                          <span>平均: {session.avgEstimate.toFixed(1)}日</span>
                        )}
                        {session.finalEstimate !== null && (
                          <span className="text-blue-600 font-medium">
                            確定工数: {session.finalEstimate}日
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-gray-500">
                        共有トークン: {session.shareToken}
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <Link
                        href={`/estimate/${session.shareToken}`}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition-colors"
                      >
                        開く
                      </Link>
                      <button
                        onClick={() => handleDeleteSession(session.shareToken)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-2"
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
