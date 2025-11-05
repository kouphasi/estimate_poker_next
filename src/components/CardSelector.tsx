'use client'

import { useState } from 'react'
import PokerCard from './PokerCard'

interface CardSelectorProps {
  onSelect: (value: number) => void
  disabled?: boolean
  currentValue?: number | null
}

const CARD_OPTIONS = [
  { label: '1h', value: 1 / 8 },      // 1時間 = 0.125日
  { label: '2h', value: 2 / 8 },      // 2時間 = 0.25日
  { label: '4h', value: 4 / 8 },      // 4時間 = 0.5日
  { label: '8h', value: 1 },          // 8時間 = 1日
  { label: '1d', value: 1 },
  { label: '1.5d', value: 1.5 },
  { label: '2d', value: 2 },
  { label: '3d', value: 3 },
]

export default function CardSelector({
  onSelect,
  disabled = false,
  currentValue = null,
}: CardSelectorProps) {
  const [selectedValue, setSelectedValue] = useState<number | null>(currentValue)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customValue, setCustomValue] = useState('')

  const handleCardClick = (value: number) => {
    setSelectedValue(value)
    setShowCustomInput(false)
    onSelect(value)
  }

  const handleCustomClick = () => {
    setShowCustomInput(true)
    setSelectedValue(null)
  }

  const handleCustomSubmit = () => {
    const value = parseFloat(customValue)
    if (!isNaN(value) && value >= 0) {
      setSelectedValue(value)
      onSelect(value)
      setShowCustomInput(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {CARD_OPTIONS.map((card) => (
          <PokerCard
            key={card.label}
            value={card.label}
            isSelected={selectedValue === card.value && !showCustomInput}
            onClick={() => handleCardClick(card.value)}
            disabled={disabled}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={handleCustomClick}
          disabled={disabled}
          className={`
            px-6 py-3 rounded-lg border-2 font-medium transition-all
            ${
              showCustomInput
                ? 'bg-blue-500 border-blue-600 text-white'
                : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          自由記述
        </button>

        {showCustomInput && (
          <div className="flex gap-2 items-center">
            <input
              type="number"
              step="0.5"
              min="0"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="日数を入力"
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              disabled={disabled}
            />
            <span className="text-gray-600">日</span>
            <button
              onClick={handleCustomSubmit}
              disabled={disabled}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              決定
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
