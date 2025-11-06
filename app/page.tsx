'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!nickname.trim()) {
      setError('ニックネームを入力してください')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname: nickname.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'セッションの作成に失敗しました')
      }

      // セッション画面に遷移
      router.push(`/estimate/${data.shareToken}?nickname=${encodeURIComponent(nickname.trim())}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            見積もりポーカー
          </h1>
          <p className="text-gray-600">
            プランニングポーカー形式で工数見積もりを行います
          </p>
        </div>

        <form onSubmit={handleCreateSession} className="space-y-6">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
              ニックネーム
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="山田太郎"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '作成中...' : '部屋を作成'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">使い方</h2>
          <ol className="space-y-2 text-sm text-gray-600">
            <li>1. ニックネームを入力して部屋を作成</li>
            <li>2. 共有URLを参加者に送信</li>
            <li>3. 各自でカードを選択</li>
            <li>4. 全員の選択後に結果を公開</li>
            <li>5. 議論して最終工数を確定</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
