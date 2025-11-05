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

    if (!nickname.trim()) {
      setError('ニックネームを入力してください')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname: nickname.trim() }),
      })

      if (!response.ok) {
        throw new Error('セッションの作成に失敗しました')
      }

      const data = await response.json()
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            工数見積もりポーカー
          </h1>
          <p className="text-gray-600">
            プランニングポーカー形式で工数を見積もりましょう
          </p>
        </div>

        <form onSubmit={handleCreateSession} className="space-y-6">
          <div>
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              ニックネーム
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="山田太郎"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '作成中...' : '新しい部屋を作成'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-sm font-medium text-gray-700 mb-3">
            使い方
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>ニックネームを入力して部屋を作成</li>
            <li>共有URLを他の参加者に送信</li>
            <li>各自がカードを選択して工数を見積もり</li>
            <li>全員の見積もりを公開して確定</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
