'use client'

import { useState, useEffect, use } from 'react'
import { useSearchParams } from 'next/navigation'
import CardSelector from '@/components/CardSelector'
import ParticipantList from '@/components/ParticipantList'
import EstimateResult from '@/components/EstimateResult'

interface Session {
  id: string
  shareToken: string
  isRevealed: boolean
  status: string
  finalEstimate: number | null
  createdAt: string
}

interface Estimate {
  id: string
  nickname: string
  value: number | null
  hasEstimated: boolean
  updatedAt: string
}

interface SessionData {
  session: Session
  estimates: Estimate[]
}

export default function EstimatePage({
  params,
}: {
  params: Promise<{ shareToken: string }>
}) {
  const resolvedParams = use(params)
  const searchParams = useSearchParams()
  const nicknameFromUrl = searchParams.get('nickname')

  const [nickname, setNickname] = useState(nicknameFromUrl || '')
  const [showNicknameInput, setShowNicknameInput] = useState(!nicknameFromUrl)
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [finalEstimateInput, setFinalEstimateInput] = useState('')

  // セッション情報を取得（ポーリング）
  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/sessions/${resolvedParams.shareToken}`)

      if (!response.ok) {
        throw new Error('セッション情報の取得に失敗しました')
      }

      const data = await response.json()
      setSessionData(data)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // 初回ロード時とポーリング
  useEffect(() => {
    fetchSession()

    // 2秒間隔でポーリング
    const interval = setInterval(fetchSession, 2000)

    return () => clearInterval(interval)
  }, [resolvedParams.shareToken])

  // 共有URL生成
  useEffect(() => {
    const url = `${window.location.origin}/estimate/${resolvedParams.shareToken}`
    setShareUrl(url)
  }, [resolvedParams.shareToken])

  // 見積もりを投稿
  const handleSubmitEstimate = async (value: number) => {
    if (!nickname.trim()) {
      setError('ニックネームを入力してください')
      return
    }

    try {
      const response = await fetch(
        `/api/sessions/${resolvedParams.shareToken}/estimates`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ nickname: nickname.trim(), value }),
        }
      )

      if (!response.ok) {
        throw new Error('見積もりの投稿に失敗しました')
      }

      // すぐに再取得
      await fetchSession()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    }
  }

  // 公開/非公開切り替え
  const handleToggleReveal = async () => {
    if (!sessionData) return

    try {
      const response = await fetch(
        `/api/sessions/${resolvedParams.shareToken}/reveal`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isRevealed: !sessionData.session.isRevealed }),
        }
      )

      if (!response.ok) {
        throw new Error('公開/非公開の切り替えに失敗しました')
      }

      await fetchSession()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    }
  }

  // 工数確定
  const handleFinalize = async () => {
    const value = parseFloat(finalEstimateInput)
    if (isNaN(value) || value < 0) {
      setError('正しい工数を入力してください')
      return
    }

    try {
      const response = await fetch(
        `/api/sessions/${resolvedParams.shareToken}/finalize`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ finalEstimate: value }),
        }
      )

      if (!response.ok) {
        throw new Error('工数の確定に失敗しました')
      }

      await fetchSession()
      setFinalEstimateInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    }
  }

  // URLをコピー
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ニックネーム入力画面
  if (showNicknameInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            見積もりセッションに参加
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ニックネーム
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="山田太郎"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => {
                if (nickname.trim()) {
                  setShowNicknameInput(false)
                } else {
                  setError('ニックネームを入力してください')
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              参加する
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error && !sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-blue-600 hover:underline"
            >
              再読み込み
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!sessionData) return null

  const currentUserEstimate = sessionData.estimates.find(
    (e) => e.nickname === nickname
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                見積もりセッション
              </h1>
              <p className="text-sm text-gray-600">
                参加者: <span className="font-medium">{nickname}</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 flex-1"
                />
                <button
                  onClick={handleCopyUrl}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                >
                  {copied ? 'コピー済み!' : 'URLコピー'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* メインエリア */}
          <div className="lg:col-span-2 space-y-6">
            {/* カード選択 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                カードを選択
              </h2>
              <CardSelector
                onSelect={handleSubmitEstimate}
                disabled={sessionData.session.status === 'FINALIZED'}
                currentValue={currentUserEstimate?.value}
              />
              {currentUserEstimate && currentUserEstimate.value !== null && currentUserEstimate.value > 0 && (
                <p className="mt-4 text-center text-green-600 font-medium">
                  選択済み: {currentUserEstimate.value}日
                </p>
              )}
            </div>

            {/* 見積もり結果 */}
            <EstimateResult
              estimates={sessionData.estimates}
              isRevealed={sessionData.session.isRevealed}
              finalEstimate={sessionData.session.finalEstimate}
              status={sessionData.session.status}
            />

            {/* 工数確定エリア */}
            {sessionData.session.status !== 'FINALIZED' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800">
                  セッション管理
                </h2>
                <div className="space-y-4">
                  <button
                    onClick={handleToggleReveal}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                      sessionData.session.isRevealed
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {sessionData.session.isRevealed ? '非公開にする' : '公開する'}
                  </button>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={finalEstimateInput}
                      onChange={(e) => setFinalEstimateInput(e.target.value)}
                      placeholder="確定工数（日）"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={handleFinalize}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
                    >
                      確定
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* サイドバー */}
          <div className="lg:col-span-1">
            <ParticipantList
              estimates={sessionData.estimates}
              isRevealed={sessionData.session.isRevealed}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
