'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import CardSelector from '@/app/components/CardSelector'
import ParticipantList from '@/app/components/ParticipantList'
import EstimateResult from '@/app/components/EstimateResult'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import { useToast } from '@/app/components/Toast'
import { useUser } from '@/contexts/UserContext'

interface Session {
  id: string
  name?: string
  shareToken: string
  isRevealed: boolean
  status: 'ACTIVE' | 'FINALIZED'
  finalEstimate: number | null
}

interface Estimate {
  nickname: string
  value: number
  updatedAt: string
  userId: string
}

interface TimerState {
  endAt: number | null
  isRunning: boolean
}

export default function EstimatePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const shareToken = params.shareToken as string
  const nicknameFromUrl = searchParams.get('nickname')
  const { showToast } = useToast()
  const { user, isLoading: userLoading } = useUser()

  // ニックネームの初期値を取得（優先順位: ログインユーザー > URLクエリパラメータ > localStorage）
  const getInitialNickname = () => {
    if (user?.nickname) return user.nickname
    if (nicknameFromUrl) return nicknameFromUrl
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`nickname_${shareToken}`) || ''
    }
    return ''
  }

  // userIdの初期値を取得
  const getInitialUserId = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`userId_${shareToken}`) || null
    }
    return null
  }

  const [nickname, setNickname] = useState(getInitialNickname())
  const [userId, setUserId] = useState<string | null>(getInitialUserId())
  const [showNicknameForm, setShowNicknameForm] = useState(!getInitialNickname())
  const [session, setSession] = useState<Session | null>(null)
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [selectedValue, setSelectedValue] = useState(0)
  const [finalEstimateInput, setFinalEstimateInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [ownerToken, setOwnerToken] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [timerMinutes, setTimerMinutes] = useState('5')
  const [timerSeconds, setTimerSeconds] = useState('0')
  const [timerEndAt, setTimerEndAt] = useState<number | null>(null)
  const [timerIsRunning, setTimerIsRunning] = useState(false)
  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState(0)
  const [timerNotified, setTimerNotified] = useState(false)
  const [timerTick, setTimerTick] = useState(0)

  // ログインユーザーのニックネームとユーザーIDを自動的に設定
  useEffect(() => {
    if (user?.nickname) {
      setNickname(user.nickname)
      setShowNicknameForm(false)
    }
    if (user?.userId) {
      setUserId(user.userId)
    }
  }, [user])

  // shareTokenが変わった時に状態をリセット
  useEffect(() => {
    setSelectedValue(0)
    setSession(null)
    setEstimates([])
    setLoading(true)
    setError('')
    setTimerEndAt(null)
    setTimerIsRunning(false)
    setTimerRemainingSeconds(0)
    setTimerNotified(false)
    setTimerTick(0)

    // ニックネームとuserIdもリセット（localStorageから再取得）
    if (typeof window !== 'undefined') {
      const storedNickname = localStorage.getItem(`nickname_${shareToken}`) || ''
      const storedUserId = localStorage.getItem(`userId_${shareToken}`) || null

      // ログインユーザーがいる場合はそちらを優先
      if (!user?.nickname) {
        setNickname(storedNickname)
        setShowNicknameForm(!storedNickname)
      }
      setUserId(storedUserId)

      const storedTimerEndAt = localStorage.getItem(`timerEndAt_${shareToken}`)
      const storedTimerIsRunning = localStorage.getItem(`timerIsRunning_${shareToken}`)
      const storedTimerNotified = localStorage.getItem(`timerNotified_${shareToken}`)

      if (storedTimerEndAt) {
        setTimerEndAt(Number(storedTimerEndAt))
      }
      if (storedTimerIsRunning) {
        setTimerIsRunning(storedTimerIsRunning === 'true')
      }
      if (storedTimerNotified) {
        setTimerNotified(storedTimerNotified === 'true')
      }
    }
  }, [shareToken, user?.nickname])

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

        if (data.timer) {
          const timerData: TimerState = data.timer
          setTimerEndAt(timerData.endAt)
          setTimerIsRunning(timerData.isRunning)
          if (timerData.isRunning) {
            setTimerNotified(false)
          }
          if (typeof window !== 'undefined') {
            if (timerData.endAt) {
              localStorage.setItem(`timerEndAt_${shareToken}`, timerData.endAt.toString())
            } else {
              localStorage.removeItem(`timerEndAt_${shareToken}`)
            }
            localStorage.setItem(`timerIsRunning_${shareToken}`, timerData.isRunning.toString())
          }
        }

        // 自分の見積もりがあればselectedValueを復元
        if (nickname) {
          const myEstimate = data.estimates.find((e: Estimate) => e.nickname === nickname)
          if (myEstimate) {
            setSelectedValue(myEstimate.value)
          }
        }

        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました')
        setLoading(false)
      }
    }

    fetchSession()
    const interval = setInterval(fetchSession, 2000) // 2秒ごとにポーリング

    return () => clearInterval(interval)
  }, [shareToken, nickname])

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

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (timerEndAt) {
      localStorage.setItem(`timerEndAt_${shareToken}`, timerEndAt.toString())
    } else {
      localStorage.removeItem(`timerEndAt_${shareToken}`)
    }

    localStorage.setItem(`timerIsRunning_${shareToken}`, timerIsRunning.toString())
    localStorage.setItem(`timerNotified_${shareToken}`, timerNotified.toString())
  }, [shareToken, timerEndAt, timerIsRunning, timerNotified])

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission === 'default') {
      try {
        await Notification.requestPermission()
      } catch {
        // no-op
      }
    }
  }

  const showTimerNotification = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('タイマー終了', {
        body: '設定した時間になりました。',
      })
      return
    }

    showToast('タイマーが終了しました', 'info')
  }

  const updateTimerState = async (nextState: TimerState) => {
    try {
      await fetch(`/api/sessions/${shareToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nextState),
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'エラーが発生しました'
      showToast(message, 'error')
    }
  }

  useEffect(() => {
    if (!timerIsRunning || !timerEndAt) {
      setTimerRemainingSeconds(0)
      return
    }

    const remaining = Math.max(0, Math.ceil((timerEndAt - Date.now()) / 1000))
    setTimerRemainingSeconds(remaining)

    if (remaining === 0) {
      if (!timerNotified) {
        setTimerNotified(true)
        showTimerNotification()
      }
      setTimerIsRunning(false)
      updateTimerState({ endAt: timerEndAt, isRunning: false })
      return
    }

    const timeoutId = window.setTimeout(() => {
      setTimerTick((prev) => prev + 1)
    }, 1000)

    return () => window.clearTimeout(timeoutId)
  }, [timerEndAt, timerIsRunning, timerNotified, timerTick, shareToken])

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim()) {
      setError('ニックネームを入力してください')
      return
    }
    // ニックネームをlocalStorageに保存
    if (typeof window !== 'undefined') {
      localStorage.setItem(`nickname_${shareToken}`, nickname.trim())
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
        body: JSON.stringify({ nickname, value, userId }),
      })

      if (!response.ok) {
        throw new Error('見積もりの投稿に失敗しました')
      }

      const data = await response.json()

      // userIdをlocalStorageに保存
      if (data.userId && typeof window !== 'undefined') {
        localStorage.setItem(`userId_${shareToken}`, data.userId)
        setUserId(data.userId)
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

    if (isNaN(value) || value <= 0 || value > 300) {
      showToast('有効な工数を入力してください（0より大きく300以下の数値）', 'warning')
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

  const handleStartTimer = async () => {
    const minutes = Number(timerMinutes)
    const seconds = Number(timerSeconds)
    const totalSeconds = minutes * 60 + seconds

    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
      showToast('タイマー時間を入力してください', 'warning')
      return
    }

    await requestNotificationPermission()

    const nextEndAt = Date.now() + totalSeconds * 1000
    setTimerEndAt(nextEndAt)
    setTimerIsRunning(true)
    setTimerNotified(false)
    setTimerTick((prev) => prev + 1)
    updateTimerState({ endAt: nextEndAt, isRunning: true })
  }

  const handleStopTimer = () => {
    setTimerIsRunning(false)
    setTimerEndAt(null)
    setTimerRemainingSeconds(0)
    setTimerNotified(false)
    setTimerTick((prev) => prev + 1)
    updateTimerState({ endAt: null, isRunning: false })
  }

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl)
    showToast('URLをコピーしました', 'success')
  }

  if (loading || userLoading) {
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
    const callbackUrl = typeof window !== 'undefined' ? window.location.href : ''

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">セッションに参加</h1>

          {/* ゲストとして参加 */}
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
                ゲストとして参加
              </label>
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="ニックネームを入力"
              />
            </div>
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
            >
              ゲストとして参加
            </button>
          </form>

          {/* 区切り線 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">または</span>
            </div>
          </div>

          {/* ログイン/新規登録オプション */}
          <div className="space-y-3">
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="block w-full py-3 text-center bg-white border-2 border-blue-500 text-blue-500 font-semibold rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
            >
              ログインして参加
            </Link>
            <Link
              href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="block w-full py-3 text-center bg-white border-2 border-green-500 text-green-500 font-semibold rounded-lg hover:bg-green-50 transition-colors cursor-pointer"
            >
              新規登録して参加
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col">
              <Link href="/" className="text-xl sm:text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors cursor-pointer">
                見積もりポーカー
              </Link>
              {session?.name && (
                <h2 className="text-sm sm:text-lg text-gray-600 mt-0.5 sm:mt-1">{session.name}</h2>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              {isOwner && (
                <Link
                  href="/mypage"
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  ← セッション一覧に戻る
                </Link>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-gray-600">参加者: {nickname}</span>
                {session?.status === 'FINALIZED' && (
                  <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-medium">
                    確定済み
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 共有URL */}
        <div className="mb-6 p-3 sm:p-4 bg-white rounded-lg shadow">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            共有URL
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg bg-gray-50"
            />
            <button
              onClick={copyShareUrl}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              コピー
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* 左サイド：参加者一覧 */}
          <div>
            <ParticipantList estimates={estimates} isRevealed={session?.isRevealed || false} />
          </div>

          {/* 中央：カード選択 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">カードを選択</h2>
              <CardSelector
                selectedValue={selectedValue}
                onSelect={handleCardSelect}
                disabled={session?.status === 'FINALIZED'}
              />
              {selectedValue > 0 && (
                <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-green-100 rounded-lg text-center">
                  <span className="text-green-800 font-medium text-sm sm:text-base">
                    選択中: {selectedValue}日
                  </span>
                </div>
              )}
            </div>

            {/* コントロールボタン（オーナーのみ） */}
            {isOwner && (
              <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                <div className="p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-blue-800 font-medium">あなたはこのセッションのオーナーです</p>
                </div>

                <div className="p-3 sm:p-4 bg-white border border-gray-200 rounded-lg space-y-3">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-800">タイマー設定</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">分</label>
                      <input
                        type="number"
                        min="0"
                        value={timerMinutes}
                        onChange={(e) => setTimerMinutes(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        disabled={timerIsRunning}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">秒</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={timerSeconds}
                        onChange={(e) => setTimerSeconds(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        disabled={timerIsRunning}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleStartTimer}
                      disabled={timerIsRunning}
                      className="flex-1 py-2 bg-indigo-500 text-white text-sm font-semibold rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      開始
                    </button>
                    <button
                      type="button"
                      onClick={handleStopTimer}
                      disabled={!timerIsRunning && !timerEndAt}
                      className="flex-1 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      停止
                    </button>
                  </div>
                  <div className="text-sm text-gray-700">
                    残り時間:{' '}
                    <span className="font-semibold">
                      {Math.floor(timerRemainingSeconds / 60)
                        .toString()
                        .padStart(2, '0')}
                      :
                      {(timerRemainingSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleToggleReveal}
                  disabled={session?.status === 'FINALIZED'}
                  className="w-full py-2.5 sm:py-3 bg-purple-500 text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {session?.isRevealed ? 'カードを隠す' : 'カードを公開'}
                </button>

                {session?.status !== 'FINALIZED' && (
                  <form onSubmit={handleFinalize} className="space-y-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="300"
                      value={finalEstimateInput}
                      onChange={(e) => setFinalEstimateInput(e.target.value)}
                      placeholder="確定工数を入力（日数）"
                      className="w-full px-3 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 sm:py-3 bg-green-500 text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-green-600 transition-colors cursor-pointer"
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
