type SpinnerSize = 'small' | 'medium' | 'large'

interface LoadingSpinnerProps {
  size?: SpinnerSize
}

export default function LoadingSpinner({ size = 'medium' }: LoadingSpinnerProps) {
  const sizeClasses: Record<SpinnerSize, string> = {
    small: 'w-6 h-6 border-2',
    medium: 'w-12 h-12 border-4',
    large: 'w-16 h-16 border-4',
  }

  return (
    <div className="flex items-center justify-center">
      <div
        className={`
          ${sizeClasses[size]}
          border-blue-500 border-t-transparent
          rounded-full animate-spin
        `}
      />
    </div>
  )
}
