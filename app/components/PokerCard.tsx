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
        relative w-20 h-28 rounded-lg border-2 transition-all duration-300
        flex items-center justify-center text-2xl font-bold
        hover:scale-110 hover:shadow-xl hover:-translate-y-1
        active:scale-95
        ${isSelected
          ? 'border-blue-500 bg-gradient-to-br from-blue-100 to-blue-200 shadow-xl scale-105 -translate-y-1 ring-2 ring-blue-300'
          : 'border-gray-300 bg-gradient-to-br from-white to-gray-50 hover:border-blue-300 hover:from-blue-50 hover:to-blue-100'
        }
      `}
    >
      {label}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>
      )}
    </button>
  )
}
