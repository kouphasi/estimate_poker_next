"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    nickname: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    email: string | null;
    nickname: string;
    createdAt: string;
  } | null>(null);

  // 認証チェック
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // ユーザー情報を取得
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch(`/api/users/${session.user.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch user info");
        }

        const data = await response.json();
        setUserInfo(data.user);
        setFormData((prev) => ({
          ...prev,
          nickname: data.user.nickname,
        }));
      } catch (error) {
        console.error("Error fetching user info:", error);
        setError("ユーザー情報の取得に失敗しました");
      }
    };

    if (status === "authenticated") {
      fetchUserInfo();
    }
  }, [session, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // パスワード変更のバリデーション
    if (formData.newPassword || formData.confirmPassword || formData.currentPassword) {
      if (!formData.currentPassword) {
        setError("現在のパスワードを入力してください");
        return;
      }

      if (!formData.newPassword) {
        setError("新しいパスワードを入力してください");
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        setError("新しいパスワードが一致しません");
        return;
      }

      if (formData.newPassword.length < 8) {
        setError("新しいパスワードは8文字以上である必要があります");
        return;
      }
    }

    setIsLoading(true);

    try {
      const updatePayload: {
        nickname?: string;
        currentPassword?: string;
        newPassword?: string;
      } = {};

      // ニックネームが変更されている場合
      if (formData.nickname !== userInfo?.nickname) {
        updatePayload.nickname = formData.nickname;
      }

      // パスワードが入力されている場合
      if (formData.newPassword) {
        updatePayload.currentPassword = formData.currentPassword;
        updatePayload.newPassword = formData.newPassword;
      }

      const response = await fetch(`/api/users/${session?.user?.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "更新に失敗しました");
        return;
      }

      setSuccess("プロフィールを更新しました");

      // パスワードをクリア
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      // セッション情報を更新（ニックネームが変更された場合）
      if (updatePayload.nickname) {
        await update({
          ...session,
          user: {
            ...session?.user,
            name: updatePayload.nickname,
          },
        });
      }

      // ユーザー情報を再取得
      if (data.user) {
        setUserInfo(data.user);
      }
    } catch {
      setError("更新中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || !userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/mypage"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            ← マイページに戻る
          </Link>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              プロフィール編集
            </h1>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* アカウント情報 */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  アカウント情報
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      メールアドレス
                    </label>
                    <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">
                      {userInfo.email}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      メールアドレスは変更できません
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="nickname"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      ニックネーム
                    </label>
                    <input
                      id="nickname"
                      type="text"
                      value={formData.nickname}
                      onChange={(e) =>
                        setFormData({ ...formData, nickname: e.target.value })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="text-xs text-gray-500">
                    登録日: {new Date(userInfo.createdAt).toLocaleDateString("ja-JP")}
                  </div>
                </div>
              </div>

              {/* パスワード変更 */}
              <div className="pb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  パスワード変更
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  パスワードを変更する場合のみ入力してください
                </p>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="currentPassword"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      現在のパスワード
                    </label>
                    <input
                      id="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentPassword: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      新しいパスワード（8文字以上）
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, newPassword: e.target.value })
                      }
                      minLength={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      新しいパスワード（確認）
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      minLength={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* 保存ボタン */}
              <div className="flex justify-end space-x-3">
                <Link
                  href="/mypage"
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? "保存中..." : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
