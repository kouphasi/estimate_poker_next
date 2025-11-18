"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LoadingSpinner from "@/app/components/LoadingSpinner";

export default function NewProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("プロジェクト名を入力してください");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create project");
      }

      const project = await response.json();
      router.push(`/projects/${project.id}`);
    } catch (err) {
      console.error("Error creating project:", err);
      setError(
        err instanceof Error ? err.message : "プロジェクトの作成に失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* パンくずリスト */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center space-x-2 text-gray-600">
            <li>
              <Link href="/projects" className="hover:text-blue-600">
                プロジェクト
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900">新規作成</li>
          </ol>
        </nav>

        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            新規プロジェクト作成
          </h1>
          <p className="mt-2 text-gray-600">
            プロジェクトの基本情報を入力してください
          </p>
        </div>

        {/* フォーム */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* エラー表示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* プロジェクト名 */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                プロジェクト名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例: Webサイトリニューアル"
                required
                maxLength={100}
              />
            </div>

            {/* 説明 */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                説明（任意）
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="プロジェクトの目的や概要を記入してください"
                maxLength={500}
              />
              <p className="mt-1 text-sm text-gray-500">
                {description.length} / 500文字
              </p>
            </div>

            {/* ボタン */}
            <div className="flex justify-end space-x-4">
              <Link
                href="/projects"
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading && <LoadingSpinner size="small" />}
                <span>{loading ? "作成中..." : "作成"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
