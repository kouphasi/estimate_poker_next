"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LoadingSpinner from "@/app/components/LoadingSpinner";

export default function NewProjectPage() {
  const { status } = useSession();
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

      const data = await response.json();
      router.push(`/projects/${data.projectId}`);
    } catch (err) {
      console.error("Error creating project:", err);
      setError(
        err instanceof Error ? err.message : "プロジェクトの作成に失敗しました"
      );
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/projects"
            className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
          >
            ← プロジェクト一覧に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">新規プロジェクト作成</h1>
          <p className="text-gray-600 mt-1">
            プロジェクト情報を入力してください
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* Project Name */}
            <div className="mb-6">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例: ECサイトリニューアル"
                required
                disabled={loading}
                maxLength={200}
              />
            </div>

            {/* Project Description */}
            <div className="mb-6">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                プロジェクト説明（任意）
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="プロジェクトの概要や目的を入力してください"
                rows={5}
                disabled={loading}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {description.length} / 1000 文字
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex-1 px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <LoadingSpinner size="small" />
                    <span className="ml-2">作成中...</span>
                  </span>
                ) : (
                  "プロジェクトを作成"
                )}
              </button>
              <Link
                href="/projects"
                className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition text-center"
              >
                キャンセル
              </Link>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            プロジェクトについて
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• プロジェクト配下に見積もりセッションを作成できます</li>
            <li>• プロジェクト全体の工数統計を確認できます</li>
            <li>• プロジェクト情報は後から編集できます</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
