import { useState, useCallback, useMemo } from 'react'
import { subDays, startOfDay } from 'date-fns'
import type { Filters, DateRange } from '@/types/database'

const defaultDateRange: DateRange = {
  from: new Date('2024-12-01'),
  to: new Date(),
}

export function useFilters() {
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange)
  const [quoteGroups, setQuoteGroups] = useState<string[]>([])
  const [branches, setBranches] = useState<string[]>([])
  const [productTypes, setProductTypes] = useState<string[]>([])

  const filters: Filters = useMemo(() => ({
    dateRange,
    quoteGroups,
    branches,
    productTypes,
  }), [dateRange, quoteGroups, branches, productTypes])

  const setPresetRange = useCallback((preset: string) => {
    const to = new Date()
    let from: Date
    switch (preset) {
      case '7d': from = subDays(to, 7); break
      case '30d': from = subDays(to, 30); break
      case '90d': from = subDays(to, 90); break
      case 'all': from = new Date('2024-12-01'); break
      default: from = subDays(to, 30)
    }
    setDateRange({ from: startOfDay(from), to })
  }, [])

  const resetFilters = useCallback(() => {
    setDateRange(defaultDateRange)
    setQuoteGroups([])
    setBranches([])
    setProductTypes([])
  }, [])

  return {
    filters,
    setDateRange,
    setQuoteGroups,
    setBranches,
    setProductTypes,
    setPresetRange,
    resetFilters,
  }
}
