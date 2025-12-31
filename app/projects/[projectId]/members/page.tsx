"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useToast } from "@/app/components/Toast";

interface Member {
  id: string;
  user: {
    id: string;
    nickname: string;
    email: string | null;
  };
  role: "OWNER" | "MEMBER";
  joinedAt: string;
}

interface Project {
  id: string;
  name: string;
}

export default function ProjectMembersPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const { showToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (authStatus === "authenticated") {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // プロジェクト情報を取得
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      if (!projectResponse.ok) {
        if (projectResponse.status === 401) {
          router.push("/login");
          return;
        }
        if (projectResponse.status === 404) {
          setError("プロジェクトが見つかりません");
          return;
        }
        throw new Error("Failed to fetch project");
      }

      const projectData = await projectResponse.json();
      setProject(projectData.project);
      setIsOwner(projectData.project.isOwner);

      // メンバー一覧を取得
      const membersResponse = await fetch(`/api/projects/${projectId}/members`);
      if (!membersResponse.ok) {
        throw new Error("Failed to fetch members");
      }

      const membersData = await membersResponse.json();
      setMembers(membersData.members);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("データの読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm("このメンバーを削除しますか?")) return;

    setDeletingMemberId(memberId);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/members/${memberId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        showToast(errorData.message || "削除に失敗しました", "error");
        return;
      }

      showToast("メンバーを削除しました", "success");
      setMembers(members.filter((m) => m.id !== memberId));
    } catch (err) {
      console.error("Error deleting member:", err);
      showToast("削除に失敗しました", "error");
    } finally {
      setDeletingMemberId(null);
    }
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
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error || "プロジェクトが見つかりません"}
          </div>
          <Link href="/projects" className="text-blue-600 hover:text-blue-700">
            ← プロジェクト一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-4 text-sm text-gray-600">
          <Link href="/mypage" className="hover:text-blue-600">
            マイページ
          </Link>
          <span className="mx-2">/</span>
          <Link href="/projects" className="hover:text-blue-600">
            プロジェクト一覧
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/projects/${projectId}`}
            className="hover:text-blue-600"
          >
            {project.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">メンバー</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            プロジェクトメンバー
          </h1>
          <p className="text-gray-600">{project.name}</p>
        </div>

        {/* Members List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            メンバー ({members.length})
          </h2>

          {members.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">メンバーがまだいません</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-4 border border-gray-200 rounded-lg flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">
                        {member.user.nickname}
                      </p>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          member.role === "OWNER"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {member.role === "OWNER" ? "オーナー" : "メンバー"}
                      </span>
                    </div>
                    {member.user.email && (
                      <p className="text-sm text-gray-600 mt-1">
                        {member.user.email}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      参加日: {new Date(member.joinedAt).toLocaleDateString("ja-JP")}
                    </p>
                  </div>

                  {/* Delete button (owner only, not for owner role) */}
                  {isOwner && member.role !== "OWNER" && (
                    <button
                      onClick={() => handleDeleteMember(member.id)}
                      disabled={deletingMemberId === member.id}
                      className="px-4 py-2 text-red-600 bg-white border border-red-300 rounded hover:bg-red-50 disabled:bg-gray-300 disabled:text-gray-700 disabled:border-gray-300 text-sm font-medium"
                    >
                      {deletingMemberId === member.id ? "削除中..." : "削除"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back button */}
        <div className="mt-6">
          <Link
            href={`/projects/${projectId}`}
            className="text-blue-600 hover:text-blue-700"
          >
            ← プロジェクト詳細に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
