'use client'

interface PokerCardProps {
  label: string
  value?: number
  isSelected?: boolean
  onClick?: () => void
}

export default function PokerCard({ label, isSelected = false, onClick }: PokerCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-20 h-28 rounded-lg border-2 transition-all duration-200
        flex items-center justify-center text-2xl font-bold
        hover:scale-105 hover:shadow-lg
        ${isSelected
          ? 'border-blue-500 bg-blue-100 shadow-lg scale-105'
          : 'border-gray-300 bg-white hover:border-blue-300'
        }
      `}
    >
      {label}
    </button>
  )
}
