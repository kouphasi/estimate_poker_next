'use client'

interface Estimate {
  nickname: string
  value: number
  updatedAt: string
}

interface ParticipantListProps {
  estimates: Estimate[]
  isRevealed: boolean
}

export default function ParticipantList({ estimates, isRevealed }: ParticipantListProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-bold mb-4">参加者一覧</h2>
      <div className="space-y-2">
        {estimates.map((estimate) => (
          <div
            key={estimate.nickname}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <span className="font-medium">{estimate.nickname}</span>
            <span className={`px-3 py-1 rounded-full text-sm ${
              estimate.value === 0
                ? 'bg-gray-200 text-gray-600'
                : estimate.value === -1
                ? 'bg-green-200 text-green-800'
                : 'bg-blue-200 text-blue-800'
            }`}>
              {estimate.value === 0
                ? '未提出'
                : estimate.value === -1
                ? '提出済み'
                : isRevealed
                ? `${estimate.value}日`
                : '提出済み'
              }
            </span>
          </div>
        ))}
        {estimates.length === 0 && (
          <p className="text-gray-500 text-center py-4">参加者がいません</p>
        )}
      </div>
    </div>
  )
}
