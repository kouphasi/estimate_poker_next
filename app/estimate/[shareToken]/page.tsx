'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import CardSelector from '@/app/components/CardSelector'
import ParticipantList from '@/app/components/ParticipantList'
import EstimateResult from '@/app/components/EstimateResult'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import { useToast } from '@/app/components/Toast'

interface Session {
  id: string
  shareToken: string
  isRevealed: boolean
  status: 'ACTIVE' | 'FINALIZED'
  finalEstimate: number | null
}

interface Estimate {
  nickname: string
  value: number
  updatedAt: string
}

export default function EstimatePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const shareToken = params.shareToken as string
  const nicknameFromUrl = searchParams.get('nickname')
  const { showToast } = useToast()

  const [nickname, setNickname] = useState(nicknameFromUrl || '')
  const [showNicknameForm, setShowNicknameForm] = useState(!nicknameFromUrl)
  const [session, setSession] = useState<Session | null>(null)
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [selectedValue, setSelectedValue] = useState(0)
  const [finalEstimateInput, setFinalEstimateInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [ownerToken, setOwnerToken] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)

  // ポーリング：2秒ごとにセッション情報を取得
  useEffect(() => {
    if (!shareToken) return

    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/sessions/${shareToken}`)
        if (!response.ok) {
          throw new Error('セッションが見つかりません')
        }
        const data = await response.json()
        setSession(data.session)
        setEstimates(data.estimates)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました')
        setLoading(false)
      }
    }

    fetchSession()
    const interval = setInterval(fetchSession, 2000) // 2秒ごとにポーリング

    return () => clearInterval(interval)
  }, [shareToken])

  // 共有URL生成とownerToken確認
  useEffect(() => {
    if (typeof window !== 'undefined' && shareToken) {
      setShareUrl(window.location.href.split('?')[0])
      const token = localStorage.getItem(`ownerToken_${shareToken}`)
      if (token) {
        setOwnerToken(token)
        setIsOwner(true)
      }
    }
  }, [shareToken])

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim()) {
      setError('ニックネームを入力してください')
      return
    }
    setShowNicknameForm(false)
  }

  const handleCardSelect = async (value: number) => {
    if (!nickname) return

    try {
      const response = await fetch(`/api/sessions/${shareToken}/estimates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname, value }),
      })

      if (!response.ok) {
        throw new Error('見積もりの投稿に失敗しました')
      }

      setSelectedValue(value)
      showToast('見積もりを送信しました', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'エラーが発生しました'
      showToast(message, 'error')
    }
  }

  const handleToggleReveal = async () => {
    if (!session || !ownerToken) return

    try {
      const response = await fetch(`/api/sessions/${shareToken}/reveal`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isRevealed: !session.isRevealed,
          ownerToken
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '公開設定の変更に失敗しました')
      }

      showToast(
        !session.isRevealed ? 'カードを公開しました' : 'カードを非公開にしました',
        'success'
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'エラーが発生しました'
      showToast(message, 'error')
    }
  }

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ownerToken) return

    const value = parseFloat(finalEstimateInput)

    if (isNaN(value) || value < 0) {
      showToast('有効な工数を入力してください', 'warning')
      return
    }

    try {
      const response = await fetch(`/api/sessions/${shareToken}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          finalEstimate: value,
          ownerToken
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '工数の確定に失敗しました')
      }

      setFinalEstimateInput('')
      showToast('工数を確定しました', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'エラーが発生しました'
      showToast(message, 'error')
    }
  }

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl)
    showToast('URLをコピーしました', 'success')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <LoadingSpinner size="large" />
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    )
  }

  if (showNicknameForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">セッションに参加</h1>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
                ニックネーム
              </label>
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="山田太郎"
              />
            </div>
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
            >
              参加する
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors cursor-pointer">
              見積もりポーカー
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">参加者: {nickname}</span>
              {session?.status === 'FINALIZED' && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  確定済み
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 共有URL */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            共有URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
            <button
              onClick={copyShareUrl}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              コピー
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左サイド：参加者一覧 */}
          <div>
            <ParticipantList estimates={estimates} isRevealed={session?.isRevealed || false} />
          </div>

          {/* 中央：カード選択 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">カードを選択</h2>
              <CardSelector
                selectedValue={selectedValue}
                onSelect={handleCardSelect}
                disabled={session?.status === 'FINALIZED'}
              />
              {selectedValue > 0 && (
                <div className="mt-4 p-3 bg-green-100 rounded-lg text-center">
                  <span className="text-green-800 font-medium">
                    選択中: {selectedValue}日
                  </span>
                </div>
              )}
            </div>

            {/* コントロールボタン（オーナーのみ） */}
            {isOwner && (
              <div className="mt-6 space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3">
                  <p className="text-sm text-blue-800 font-medium">あなたはこのセッションのオーナーです</p>
                </div>

                <button
                  onClick={handleToggleReveal}
                  disabled={session?.status === 'FINALIZED'}
                  className="w-full py-3 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {session?.isRevealed ? 'カードを隠す' : 'カードを公開'}
                </button>

                {session?.status !== 'FINALIZED' && (
                  <form onSubmit={handleFinalize} className="space-y-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={finalEstimateInput}
                      onChange={(e) => setFinalEstimateInput(e.target.value)}
                      placeholder="確定工数を入力（日数）"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                    />
                    <button
                      type="submit"
                      className="w-full py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
                    >
                      工数を確定
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* 右サイド：結果表示 */}
          <div>
            <EstimateResult
              estimates={estimates}
              isRevealed={session?.isRevealed || false}
              finalEstimate={session?.finalEstimate || null}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
