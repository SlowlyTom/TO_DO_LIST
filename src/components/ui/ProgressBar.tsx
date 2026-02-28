interface ProgressBarProps {
  value: number // 0-100
  showLabel?: boolean
  size?: 'sm' | 'md'
  className?: string
}

function colorForValue(v: number) {
  if (v >= 80) return 'bg-green-500'
  if (v >= 50) return 'bg-blue-500'
  if (v >= 20) return 'bg-yellow-500'
  return 'bg-gray-300'
}

export function ProgressBar({ value, showLabel = false, size = 'md', className = '' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, Math.round(value)))
  const h = size === 'sm' ? 'h-1.5' : 'h-2.5'
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 bg-gray-200 rounded-full overflow-hidden ${h}`}>
        <div
          className={`${h} rounded-full transition-all duration-300 ${colorForValue(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>}
    </div>
  )
}
