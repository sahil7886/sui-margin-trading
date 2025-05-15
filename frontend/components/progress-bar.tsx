import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value: number
  max: number
  className?: string
  barClassName?: string
  label?: string
  showValue?: boolean
  valueFormatter?: (value: number) => string
}

export function ProgressBar({
  value,
  max,
  className,
  barClassName,
  label,
  showValue = true,
  valueFormatter = (v) => `${Math.round((v / max) * 100)}%`,
}: ProgressBarProps) {
  const percentage = (value / max) * 100

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="flex justify-between mb-1 text-sm">
          {label && <span className="text-slate-400">{label}</span>}
          {showValue && <span className="font-medium">{valueFormatter(value)}</span>}
        </div>
      )}
      <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full bg-gradient-to-r from-[#33A3FF] to-[#8EE6FF]", barClassName)}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  )
}
