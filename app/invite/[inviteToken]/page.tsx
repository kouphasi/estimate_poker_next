"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useToast } from "@/app/components/Toast";

interface ProjectInfo {
  id: string;
  name: string;
  description: string | null;
  owner: {
    id: string;
    nickname: string;
  };
}

interface InviteData {
  project: ProjectInfo;
  userStatus: "none" | "pending" | "member" | "owner";
}

function InvitePageContent() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const callbackUrl = searchParams.get("callbackUrl");
  const [inviteToken, setInviteToken] = useState<string>("");
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // パスからトークンを抽出
    const pathSegments = window.location.pathname.split("/");
    const token = pathSegments[pathSegments.length - 1];
    setInviteToken(token);

    if (authStatus === "unauthenticated") {
      // ログインページにリダイレクト（戻ってくるためにcallbackUrlを設定）
      const loginUrl = `/login?callbackUrl=${encodeURIComponent(
        `/invite/${token}`
      )}`;
      router.push(loginUrl);
      return;
    }

    if (authStatus === "authenticated") {
      fetchInviteInfo(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus]);

  const fetchInviteInfo = async (token: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invite/${token}`);

      if (!response.ok) {
        if (response.status === 401) {
          router.push(`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`);
          return;
        }
        if (response.status === 404) {
          setError("この招待URLは無効です");
          return;
        }
        throw new Error("Failed to fetch invite info");
      }

      const data = await response.json();
      setInviteData(data);
    } catch (err) {
      console.error("Error fetching invite info:", err);
      setError("招待情報の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToJoin = async () => {
    if (!inviteData) return;

    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/projects/${inviteData.project.id}/join-requests`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        showToast(errorData.message || "参加申請に失敗しました", "error");
        return;
      }

      showToast("参加申請を送信しました。オーナーの承認をお待ちください。", "success");

      // 完了ページまたはマイページにリダイレクト
      setTimeout(() => {
        if (callbackUrl) {
          router.push(callbackUrl);
        } else {
          router.push("/mypage");
        }
      }, 2000);
    } catch (err) {
      console.error("Error applying to join:", err);
      showToast("参加申請に失敗しました", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
          <Link href="/mypage" className="text-blue-600 hover:text-blue-700">
            ← マイページに戻る
          </Link>
        </div>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
            招待情報を読み込んでいます...
          </div>
        </div>
      </div>
    );
  }

  const { project, userStatus } = inviteData;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* ステータスに応じたメッセージ */}
          {userStatus === "owner" && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm font-medium">
                このプロジェクトはあなたがオーナーです
              </p>
            </div>
          )}

          {userStatus === "member" && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm font-medium">
                既にこのプロジェクトのメンバーです
              </p>
            </div>
          )}

          {userStatus === "pending" && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm font-medium">
                参加申請は処理待ちです
              </p>
            </div>
          )}

          {/* プロジェクト情報 */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-gray-600 mb-3 text-sm">
                {project.description}
              </p>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">プロジェクトオーナー:</span>
              <span className="font-semibold text-gray-900">
                {project.owner.nickname}
              </span>
            </div>
          </div>

          {/* アクション */}
          {userStatus === "none" && (
            <button
              onClick={handleApplyToJoin}
              disabled={submitting}
              className="w-full px-4 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 font-medium"
            >
              {submitting ? "送信中..." : "参加を申請する"}
            </button>
          )}

          {userStatus === "owner" && (
            <Link
              href={`/projects/${project.id}`}
              className="block w-full text-center px-4 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium"
            >
              プロジェクト詳細を表示
            </Link>
          )}

          {userStatus === "member" && (
            <Link
              href={`/projects/${project.id}`}
              className="block w-full text-center px-4 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium"
            >
              プロジェクトに移動
            </Link>
          )}

          {userStatus === "pending" && (
            <Link
              href="/mypage"
              className="block w-full text-center px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
            >
              マイページに戻る
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<LoadingSpinner size="large" />}>
      <InvitePageContent />
    </Suspense>
  );
}
