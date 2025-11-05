'use client'

interface PokerCardProps {
  value: string
  isSelected?: boolean
  onClick?: () => void
  disabled?: boolean
}

export default function PokerCard({
  value,
  isSelected = false,
  onClick,
  disabled = false,
}: PokerCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-20 h-28 rounded-lg border-2 transition-all duration-200
        flex items-center justify-center text-2xl font-bold
        ${
          isSelected
            ? 'bg-blue-500 border-blue-600 text-white scale-110 shadow-lg'
            : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:shadow-md'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${!isSelected && !disabled ? 'hover:-translate-y-2' : ''}
      `}
    >
      <span>{value}</span>
    </button>
  )
}
