'use client'

interface Estimate {
  nickname: string
  value: number
  updatedAt: string
}

interface EstimateResultProps {
  estimates: Estimate[]
  isRevealed: boolean
  finalEstimate: number | null
}

export default function EstimateResult({ estimates, isRevealed, finalEstimate }: EstimateResultProps) {
  const validEstimates = estimates.filter(e => e.value > 0)

  const average = validEstimates.length > 0
    ? validEstimates.reduce((sum, e) => sum + e.value, 0) / validEstimates.length
    : 0

  const median = (() => {
    if (validEstimates.length === 0) return 0
    const sorted = [...validEstimates].sort((a, b) => a.value - b.value)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0
      ? (sorted[mid - 1].value + sorted[mid].value) / 2
      : sorted[mid].value
  })()

  const max = validEstimates.length > 0
    ? Math.max(...validEstimates.map(e => e.value))
    : 0

  const min = validEstimates.length > 0
    ? Math.min(...validEstimates.map(e => e.value))
    : 0

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-bold mb-4">見積もり結果</h2>

      {finalEstimate !== null && (
        <div className="mb-4 p-4 bg-green-100 rounded-lg border-2 border-green-500">
          <p className="text-sm text-gray-600 mb-1">確定工数</p>
          <p className="text-3xl font-bold text-green-800">{finalEstimate}日</p>
        </div>
      )}

      {isRevealed && validEstimates.length > 0 ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">平均値</p>
              <p className="text-xl font-bold text-blue-800">{average.toFixed(2)}日</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">中央値</p>
              <p className="text-xl font-bold text-purple-800">{median.toFixed(2)}日</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">最大値</p>
              <p className="text-xl font-bold text-red-800">{max.toFixed(2)}日</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">最小値</p>
              <p className="text-xl font-bold text-green-800">{min.toFixed(2)}日</p>
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">全員の見積もり</p>
            <div className="space-y-1">
              {validEstimates.map((estimate) => (
                <div key={estimate.nickname} className="flex justify-between text-sm">
                  <span>{estimate.nickname}</span>
                  <span className="font-medium">{estimate.value}日</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          {isRevealed
            ? '見積もりが提出されていません'
            : 'カードが公開されていません'
          }
        </div>
      )}
    </div>
  )
}
