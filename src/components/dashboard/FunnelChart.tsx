import { cn } from '@/lib/utils'

interface FunnelStep {
  label: string
  value: number
  color?: string
}

interface FunnelChartProps {
  steps: FunnelStep[]
  className?: string
}

const DEFAULT_COLORS = [
  'from-green-500 to-green-600',
  'from-green-400 to-green-500',
  'from-emerald-400 to-emerald-500',
  'from-teal-400 to-teal-500',
]

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function FunnelChart({ steps, className }: FunnelChartProps) {
  if (!steps || steps.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-slate-400">
        No data available
      </div>
    )
  }

  const maxValue = steps[0].value || 1

  return (
    <div className={cn('w-full space-y-2', className)}>
      {steps.map((step, index) => {
        const widthPct = Math.max((step.value / maxValue) * 100, 8)
        const conversionRate =
          index > 0 && steps[index - 1].value > 0
            ? ((step.value / steps[index - 1].value) * 100).toFixed(1)
            : null
        const gradientClass = DEFAULT_COLORS[index % DEFAULT_COLORS.length]

        return (
          <div key={`${step.label}-${index}`} className="group">
            {/* Conversion badge between steps */}
            {conversionRate !== null && (
              <div className="flex items-center gap-2 mb-1.5 pl-2">
                <div className="w-px h-3 bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium">
                  {conversionRate}% conversion
                </span>
              </div>
            )}

            {/* Bar row */}
            <div className="flex items-center gap-3">
              {/* Label */}
              <div className="w-28 shrink-0 text-right">
                <span className="text-sm font-medium text-slate-600 truncate block">
                  {step.label}
                </span>
              </div>

              {/* Bar track */}
              <div className="flex-1 h-10 bg-slate-100 rounded-xl overflow-hidden relative">
                <div
                  className={cn(
                    'h-full rounded-xl bg-gradient-to-r transition-all duration-700 flex items-center justify-end pr-3',
                    step.color ? '' : gradientClass
                  )}
                  style={{
                    width: `${widthPct}%`,
                    ...(step.color
                      ? { background: `linear-gradient(to right, ${step.color}, ${step.color}dd)` }
                      : {}),
                  }}
                >
                  <span className="text-xs font-bold text-white drop-shadow-sm whitespace-nowrap">
                    {formatNumber(step.value)}
                  </span>
                </div>
              </div>

              {/* Absolute count on the right */}
              <div className="w-16 shrink-0 text-right">
                <span className="text-sm font-semibold text-slate-700">
                  {step.value.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )
      })}

      {/* Overall conversion summary */}
      {steps.length >= 2 && steps[0].value > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">Overall funnel conversion</span>
          <span className="text-sm font-bold text-green-600">
            {((steps[steps.length - 1].value / steps[0].value) * 100).toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  )
}
