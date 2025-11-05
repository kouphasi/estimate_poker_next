'use client'

interface Estimate {
  id: string
  nickname: string
  value: number | null
  hasEstimated: boolean
  updatedAt: string
}

interface ParticipantListProps {
  estimates: Estimate[]
  isRevealed: boolean
}

export default function ParticipantList({
  estimates,
  isRevealed,
}: ParticipantListProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        参加者一覧 ({estimates.length}人)
      </h2>

      <div className="space-y-3">
        {estimates.map((estimate) => (
          <div
            key={estimate.id}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                {estimate.nickname.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-gray-800">
                {estimate.nickname}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {estimate.hasEstimated && (
                <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700 font-medium">
                  提出済み
                </span>
              )}
              {isRevealed && estimate.value !== null && (
                <span className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 font-bold">
                  {estimate.value}日
                </span>
              )}
              {!isRevealed && estimate.hasEstimated && (
                <span className="text-2xl">🃏</span>
              )}
            </div>
          </div>
        ))}

        {estimates.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            まだ参加者がいません
          </p>
        )}
      </div>
    </div>
  )
}
