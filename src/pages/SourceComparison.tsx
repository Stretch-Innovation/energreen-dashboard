import { useMemo } from 'react'
import { useFilters } from '@/hooks/useFilters'
import { useLeadStats } from '@/hooks/useLeads'
import { useOpportunityStats } from '@/hooks/useOpportunities'
import { FilterBar } from '@/components/dashboard/FilterBar'
import { DataTable } from '@/components/dashboard/DataTable'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/formatters'
import { Globe } from 'lucide-react'

interface SourceRow {
  source: string
  leads: number
  qualifiedRate: number
  opps: number
  winRate: number
  avgDealValue: number
  totalRevenue: number
  [key: string]: unknown
}

export default function SourceComparison() {
  const {
    filters,
    setPresetRange,
    setQuoteGroups,
    setBranches,
    setProductTypes,
    resetFilters,
  } = useFilters()

  const { data: leads = [], isLoading: leadsLoading } = useLeadStats(filters)
  const { data: opps = [], isLoading: oppsLoading } = useOpportunityStats(filters)

  const availableQuoteGroups = useMemo(
    () => [...new Set(leads.map((l) => l.quote_group).filter(Boolean) as string[])].sort(),
    [leads]
  )
  const availableBranches = useMemo(
    () => [...new Set(opps.map((o) => o.branch).filter(Boolean) as string[])].sort(),
    [opps]
  )
  const availableProductTypes = useMemo(
    () => [...new Set(leads.map((l) => l.quote_type).filter(Boolean) as string[])].sort(),
    [leads]
  )

  const rows = useMemo<SourceRow[]>(() => {
    const sourceMap: Record<
      string,
      { leads: number; qualified: number; opps: number; won: number; revenue: number }
    > = {}

    leads.forEach((l) => {
      const src = l.quote_group || 'Unknown'
      if (!sourceMap[src]) sourceMap[src] = { leads: 0, qualified: 0, opps: 0, won: 0, revenue: 0 }
      sourceMap[src].leads++
      if (l.status_reason === 'Qualified') sourceMap[src].qualified++
    })

    opps.forEach((o) => {
      const src = o.quote_group || 'Unknown'
      if (!sourceMap[src]) sourceMap[src] = { leads: 0, qualified: 0, opps: 0, won: 0, revenue: 0 }
      sourceMap[src].opps++
      if (o.status_reason === 'Won') {
        sourceMap[src].won++
        sourceMap[src].revenue += o.actual_revenue || 0
      }
    })

    return Object.entries(sourceMap).map(([source, data]) => ({
      source,
      leads: data.leads,
      qualifiedRate: data.leads > 0 ? (data.qualified / data.leads) * 100 : 0,
      opps: data.opps,
      winRate: data.opps > 0 ? (data.won / data.opps) * 100 : 0,
      avgDealValue: data.won > 0 ? data.revenue / data.won : 0,
      totalRevenue: data.revenue,
    }))
  }, [leads, opps])

  const topSources = useMemo(
    () => [...rows].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 6),
    [rows]
  )

  const maxRevenue = topSources[0]?.totalRevenue || 1

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-sm">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Source Comparison</h1>
          </div>
          <p className="text-sm text-slate-500">Lead quality, conversion rates and revenue by source</p>
        </div>
      </div>

      <FilterBar
        filters={filters}
        setPresetRange={setPresetRange}
        setQuoteGroups={setQuoteGroups}
        setBranches={setBranches}
        setProductTypes={setProductTypes}
        resetFilters={resetFilters}
        availableQuoteGroups={availableQuoteGroups}
        availableBranches={availableBranches}
        availableProductTypes={availableProductTypes}
      />

      {/* Top source cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {topSources.map((src, idx) => {
          const isTop = idx === 0
          const revPct = (src.totalRevenue / maxRevenue) * 100
          return (
            <div
              key={src.source}
              className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">#{idx + 1}</span>
                {isTop && (
                  <Badge className="text-xs bg-green-50 text-green-700 border border-green-200">Top</Badge>
                )}
              </div>
              <p className="font-bold text-slate-900 text-sm truncate mb-3">{src.source}</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Revenue</span>
                  <span className="font-semibold text-slate-700">{formatCurrency(src.totalRevenue)}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all"
                    style={{ width: `${revPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Win rate</span>
                  <span className="font-semibold text-green-700">{formatPercent(src.winRate)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Leads</span>
                  <span className="font-medium text-slate-700">{src.leads}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Full table */}
      <DataTable
        data={rows as Record<string, unknown>[]}
        loading={leadsLoading || oppsLoading}
        defaultSort="totalRevenue"
        pageSize={25}
        columns={[
          {
            key: 'source',
            label: 'Source / Quote Group',
            sortable: true,
            render: (v, row) => {
              const r = row as unknown as SourceRow
              const isHighROI = r.winRate > 30 && r.totalRevenue > 0
              return (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">{String(v)}</span>
                  {isHighROI && (
                    <Badge className="text-xs bg-green-50 text-green-700 border border-green-200">Top ROI</Badge>
                  )}
                </div>
              )
            },
          },
          {
            key: 'leads',
            label: 'Leads',
            align: 'right',
            sortable: true,
            render: (v) => formatNumber(v as number),
          },
          {
            key: 'qualifiedRate',
            label: 'Qualified %',
            align: 'right',
            sortable: true,
            render: (v) => {
              const val = v as number
              const cls = val >= 50 ? 'text-green-700 font-semibold' : 'text-slate-600'
              return <span className={cls}>{formatPercent(val)}</span>
            },
          },
          {
            key: 'opps',
            label: 'Opps',
            align: 'right',
            sortable: true,
            render: (v) => formatNumber(v as number),
          },
          {
            key: 'winRate',
            label: 'Win Rate',
            align: 'right',
            sortable: true,
            render: (v) => {
              const val = v as number
              const cls = val >= 30 ? 'text-green-700 font-bold' : val >= 15 ? 'text-slate-700' : 'text-red-500'
              return <span className={cls}>{formatPercent(val)}</span>
            },
          },
          {
            key: 'avgDealValue',
            label: 'Avg Deal Value',
            align: 'right',
            sortable: true,
            render: (v) => {
              const val = v as number
              return val > 0 ? formatCurrency(val) : '—'
            },
          },
          {
            key: 'totalRevenue',
            label: 'Total Revenue',
            align: 'right',
            sortable: true,
            render: (v) => (
              <span className="font-semibold text-slate-800">{formatCurrency(v as number)}</span>
            ),
          },
        ]}
      />
    </div>
  )
}
