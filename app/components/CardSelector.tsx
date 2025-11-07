'use client'

import { useState } from 'react'
import PokerCard from './PokerCard'

interface CardSelectorProps {
  selectedValue: number
  onSelect: (value: number) => void
  disabled?: boolean
}

const CARD_OPTIONS = [
  { label: '1h', value: 1/8 },    // 1時間 = 0.125日
  { label: '2h', value: 2/8 },    // 2時間 = 0.25日
  { label: '4h', value: 4/8 },    // 4時間 = 0.5日
  { label: '8h', value: 1 },      // 8時間 = 1日
  { label: '1d', value: 1 },
  { label: '1.5d', value: 1.5 },
  { label: '2d', value: 2 },
  { label: '3d', value: 3 },
]

export default function CardSelector({ selectedValue, onSelect, disabled = false }: CardSelectorProps) {
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customValue, setCustomValue] = useState('')

  const handleCustomSubmit = () => {
    const value = parseFloat(customValue)
    if (!isNaN(value) && value > 0) {
      onSelect(value)
      setShowCustomInput(false)
      setCustomValue('')
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CARD_OPTIONS.map((option) => (
          <PokerCard
            key={option.label}
            label={option.label}
            value={option.value}
            isSelected={selectedValue === option.value}
            onClick={() => !disabled && onSelect(option.value)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {!showCustomInput ? (
          <button
            onClick={() => setShowCustomInput(true)}
            disabled={disabled}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            自由記述
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="number"
              step="0.5"
              min="0"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="日数を入力"
              disabled={disabled}
              className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCustomSubmit}
                disabled={disabled}
                className="flex-1 sm:flex-none px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                決定
              </button>
              <button
                onClick={() => {
                  setShowCustomInput(false)
                  setCustomValue('')
                }}
                disabled={disabled}
                className="flex-1 sm:flex-none px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
