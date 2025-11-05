'use client'

import { calculateAverage, calculateMedian } from '@/lib/utils'

interface Estimate {
  id: string
  nickname: string
  value: number | null
  hasEstimated: boolean
  updatedAt: string
}

interface EstimateResultProps {
  estimates: Estimate[]
  isRevealed: boolean
  finalEstimate: number | null
  status: string
}

export default function EstimateResult({
  estimates,
  isRevealed,
  finalEstimate,
  status,
}: EstimateResultProps) {
  const values = estimates
    .filter((e) => e.value !== null && e.value > 0)
    .map((e) => e.value as number)

  const average = calculateAverage(values)
  const median = calculateMedian(values)

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">見積もり結果</h2>

      {!isRevealed && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-4xl mb-2">🃏</p>
          <p>まだ公開されていません</p>
        </div>
      )}

      {isRevealed && values.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-600 font-medium mb-1">平均値</p>
              <p className="text-2xl font-bold text-blue-700">
                {average.toFixed(2)}日
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-green-600 font-medium mb-1">中央値</p>
              <p className="text-2xl font-bold text-green-700">
                {median.toFixed(2)}日
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-medium mb-2">
              全ての見積もり
            </p>
            <div className="flex flex-wrap gap-2">
              {values.map((value, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm font-medium"
                >
                  {value}日
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {isRevealed && values.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>まだ見積もりがありません</p>
        </div>
      )}

      {status === 'FINALIZED' && finalEstimate !== null && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-300">
            <p className="text-sm text-purple-600 font-medium mb-1">
              確定工数
            </p>
            <p className="text-3xl font-bold text-purple-700">
              {finalEstimate}日
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
