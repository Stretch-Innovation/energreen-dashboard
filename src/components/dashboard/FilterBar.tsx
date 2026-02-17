import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, X, RotateCcw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Filters } from '@/types/database'

interface FilterBarProps {
  filters: Filters
  setPresetRange: (preset: string) => void
  setQuoteGroups: (groups: string[]) => void
  setBranches: (branches: string[]) => void
  setProductTypes: (types: string[]) => void
  resetFilters: () => void
  availableQuoteGroups: string[]
  availableBranches: string[]
  availableProductTypes: string[]
}

const DATE_PRESETS = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: 'All', value: 'all' },
]

interface MultiSelectProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder?: string
}

function MultiSelect({ label, options, selected, onChange, placeholder }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const hasSelection = selected.length > 0

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-2 h-9 px-3 rounded-lg text-sm border transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-green-500/30',
          hasSelection
            ? 'border-green-400 bg-green-50 text-green-800 font-medium'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
        )}
      >
        <span className="truncate max-w-[120px]">
          {hasSelection ? `${label} (${selected.length})` : placeholder ?? label}
        </span>
        <ChevronDown className={cn('w-3.5 h-3.5 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 min-w-[200px] bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/60 py-2">
          {/* Search */}
          <div className="px-2 pb-2">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="flex-1 text-xs bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                autoFocus
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-2 text-xs text-slate-400">No results found</p>
            ) : (
              filtered.map(opt => {
                const isChecked = selected.includes(opt)
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggle(opt)}
                    className={cn(
                      'flex items-center gap-2.5 w-full px-3 py-1.5 text-sm text-left transition-colors',
                      isChecked
                        ? 'text-green-700 bg-green-50 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <span
                      className={cn(
                        'flex items-center justify-center w-4 h-4 rounded border transition-all shrink-0',
                        isChecked
                          ? 'bg-green-500 border-green-500'
                          : 'border-slate-300 bg-white'
                      )}
                    >
                      {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                    </span>
                    <span className="truncate">{opt}</span>
                  </button>
                )
              })
            )}
          </div>

          {/* Clear selection */}
          {hasSelection && (
            <div className="pt-2 px-2 border-t border-slate-100 mt-1">
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full flex items-center justify-center gap-1.5 py-1 text-xs text-slate-500 hover:text-red-500 transition-colors rounded"
              >
                <X className="w-3 h-3" />
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function getActivePreset(filters: Filters): string {
  const now = new Date()
  const from = filters.dateRange.from
  const diffDays = Math.round((now.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays <= 8) return '7d'
  if (diffDays <= 31) return '30d'
  if (diffDays <= 92) return '90d'
  return 'all'
}

export function FilterBar({
  filters,
  setPresetRange,
  setQuoteGroups,
  setBranches,
  setProductTypes,
  resetFilters,
  availableQuoteGroups,
  availableBranches,
  availableProductTypes,
}: FilterBarProps) {
  const activePreset = getActivePreset(filters)

  const hasActiveFilters =
    filters.quoteGroups.length > 0 ||
    filters.branches.length > 0 ||
    filters.productTypes.length > 0

  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
      <div className="px-6 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Date range presets */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {DATE_PRESETS.map(preset => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setPresetRange(preset.value)}
                className={cn(
                  'px-3 py-1 text-sm rounded-md font-medium transition-all duration-200',
                  activePreset === preset.value
                    ? 'bg-white text-green-700 shadow-sm font-semibold'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-slate-200 mx-1" />

          {/* Multi-selects */}
          <MultiSelect
            label="Quote Group"
            options={availableQuoteGroups}
            selected={filters.quoteGroups}
            onChange={setQuoteGroups}
          />
          <MultiSelect
            label="Branch"
            options={availableBranches}
            selected={filters.branches}
            onChange={setBranches}
          />
          <MultiSelect
            label="Product Type"
            options={availableProductTypes}
            selected={filters.productTypes}
            onChange={setProductTypes}
          />

          {/* Reset */}
          {hasActiveFilters && (
            <>
              <div className="w-px h-6 bg-slate-200 mx-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="gap-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
