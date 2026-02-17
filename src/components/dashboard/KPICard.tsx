import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KPICardProps {
  label: string
  value: string | number
  subtitle?: string
  trend?: number // positive = good, negative = bad
  icon?: React.ReactNode
  loading?: boolean
}

export function KPICard({ label, value, subtitle, trend, icon, loading = false }: KPICardProps) {
  const hasTrend = trend !== undefined && trend !== null
  const isPositive = hasTrend && trend >= 0

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-white border border-slate-100',
        'shadow-sm transition-all duration-300',
        'hover:shadow-lg hover:-translate-y-0.5 hover:shadow-green-500/10',
        'group'
      )}
    >
      {/* Gradient border accent top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-400 via-green-500 to-emerald-600 opacity-80 group-hover:opacity-100 transition-opacity" />

      {/* Soft background glow */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-emerald-50 opacity-50 group-hover:opacity-70 transition-opacity" />

      <div className="relative p-6">
        {/* Header: label + icon */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-500 tracking-wide uppercase text-xs">
            {label}
          </span>
          {icon && (
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 text-green-600">
              {icon}
            </div>
          )}
        </div>

        {/* Main value */}
        {loading ? (
          <div className="h-9 w-32 rounded-lg bg-slate-100 animate-pulse mb-2" />
        ) : (
          <div className="text-3xl font-bold text-slate-900 tracking-tight mb-1">
            {value}
          </div>
        )}

        {/* Bottom row: subtitle + trend */}
        <div className="flex items-center justify-between mt-2 gap-2">
          {subtitle && (
            <p className="text-xs text-slate-400 truncate">{subtitle}</p>
          )}
          {hasTrend && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 ml-auto shrink-0',
                isPositive
                  ? 'text-green-700 bg-green-50'
                  : 'text-red-600 bg-red-50'
              )}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {isPositive ? '+' : ''}{trend.toFixed(1)}%
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
