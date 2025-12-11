"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import LoadingSpinner from "@/app/components/LoadingSpinner";

interface ProjectInfo {
  id: string;
  name: string;
  description: string | null;
  owner: {
    id: string;
    nickname: string;
  };
}

interface InvitationData {
  id: string;
  project: ProjectInfo;
  createdAt: string;
  expiresAt: string | null;
}

export default function JoinProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const inviteToken = params.inviteToken as string;

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const response = await fetch(`/api/invitations/${inviteToken}`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to fetch invitation");
        }

        const data = await response.json();
        setInvitation(data.invitation);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (inviteToken) {
      fetchInvitation();
    }
  }, [inviteToken]);

  const handleJoinRequest = async () => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/join/${inviteToken}`);
      return;
    }

    setRequesting(true);
    setError(null);

    try {
      const response = await fetch(`/api/invitations/${inviteToken}/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send join request");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">エラー</h1>
            <p className="text-gray-700 mb-6">{error}</p>
            <Link
              href="/mypage"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              マイページに戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mb-4 text-green-600">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              参加リクエストを送信しました
            </h1>
            <p className="text-gray-600 mb-6">
              プロジェクトオーナーの承認をお待ちください。
            </p>
            <Link
              href="/mypage"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              マイページに戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          プロジェクトへの招待
        </h1>

        <div className="mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {invitation.project.name}
            </h2>
            {invitation.project.description && (
              <p className="text-gray-700 mb-4">
                {invitation.project.description}
              </p>
            )}
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium">オーナー:</span>
              <span className="ml-2">{invitation.project.owner.nickname}</span>
            </div>
          </div>

          {status === "loading" ? (
            <div className="flex justify-center">
              <LoadingSpinner size="medium" />
            </div>
          ) : !session?.user ? (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                プロジェクトに参加するにはログインが必要です。
              </p>
              <Link
                href={`/login?callbackUrl=/join/${inviteToken}`}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                ログイン
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleJoinRequest}
                  disabled={requesting}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {requesting ? "送信中..." : "参加リクエストを送信"}
                </button>
                <Link
                  href="/mypage"
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-center font-medium"
                >
                  キャンセル
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
