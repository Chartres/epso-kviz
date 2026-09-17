interface ProgressBarProps {
  value: number
  max: number
  label?: string
  tone?: 'brass' | 'verdigris'
}

export function ProgressBar({ value, max, label, tone = 'brass' }: ProgressBarProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  const fill = tone === 'verdigris' ? 'bg-verdigris-500' : 'bg-brass-500'
  return (
    <div>
      {label && (
        <div className="mb-1 flex justify-between text-xs text-steel-400">
          <span>{label}</span>
          <span className="font-mono tabular-nums">
            {value}/{max}
          </span>
        </div>
      )}
      <div
        className="h-1.5 overflow-hidden rounded-[1px] bg-steel-800"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className={`h-full rounded-[1px] transition-[width] duration-500 ${fill}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
