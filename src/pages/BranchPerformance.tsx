import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useFilters } from '@/hooks/useFilters'
import { useLeadStats } from '@/hooks/useLeads'
import { useOpportunityStats } from '@/hooks/useOpportunities'
import { FilterBar } from '@/components/dashboard/FilterBar'
import { DataTable } from '@/components/dashboard/DataTable'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/formatters'
import { Building2 } from 'lucide-react'

interface BranchRow {
  branch: string
  opps: number
  won: number
  winRate: number
  revenue: number
  inProgress: number
  [key: string]: unknown
}

interface SalesRepRow {
  rep: string
  branch: string
  opps: number
  won: number
  winRate: number
  revenue: number
  avgDeal: number
  [key: string]: unknown
}

export default function BranchPerformance() {
  const {
    filters,
    setPresetRange,
    setQuoteGroups,
    setBranches,
    setProductTypes,
    resetFilters,
  } = useFilters()

  const { data: leads = [] } = useLeadStats(filters)
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

  const branchRows = useMemo<BranchRow[]>(() => {
    const map: Record<string, { opps: number; won: number; revenue: number; inProgress: number }> = {}

    opps.forEach((o) => {
      const b = o.branch || 'Unknown'
      if (!map[b]) map[b] = { opps: 0, won: 0, revenue: 0, inProgress: 0 }
      map[b].opps++
      if (o.status_reason === 'Won') {
        map[b].won++
        map[b].revenue += o.actual_revenue || 0
      }
      if (o.status_reason === 'In Progress' || o.status_reason === 'Active') {
        map[b].inProgress++
      }
    })

    return Object.entries(map).map(([branch, d]) => ({
      branch,
      opps: d.opps,
      won: d.won,
      winRate: d.opps > 0 ? (d.won / d.opps) * 100 : 0,
      revenue: d.revenue,
      inProgress: d.inProgress,
    }))
  }, [opps])

  const salesRepRows = useMemo<SalesRepRow[]>(() => {
    const map: Record<string, { branch: string; opps: number; won: number; revenue: number }> = {}

    opps.forEach((o) => {
      const rep = o.owner || 'Unknown'
      if (!map[rep]) map[rep] = { branch: o.branch || 'Unknown', opps: 0, won: 0, revenue: 0 }
      map[rep].opps++
      if (o.status_reason === 'Won') {
        map[rep].won++
        map[rep].revenue += o.actual_revenue || 0
      }
    })

    return Object.entries(map).map(([rep, d]) => ({
      rep,
      branch: d.branch,
      opps: d.opps,
      won: d.won,
      winRate: d.opps > 0 ? (d.won / d.opps) * 100 : 0,
      revenue: d.revenue,
      avgDeal: d.won > 0 ? d.revenue / d.won : 0,
    }))
  }, [opps])

  const chartData = useMemo(
    () => branchRows.map((b) => ({ branch: b.branch, Opps: b.opps, Won: b.won, Revenue: b.revenue / 1000 })),
    [branchRows]
  )

  const maxRevenue = Math.max(...branchRows.map((b) => b.revenue), 1)

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-sm">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Branch Performance</h1>
        </div>
        <p className="text-sm text-slate-500">Opportunities, win rates and revenue per branch</p>
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

      {/* Branch KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {branchRows.slice(0, 6).map((b) => {
          const revPct = (b.revenue / maxRevenue) * 100
          return (
            <div
              key={b.branch}
              className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 truncate">
                {b.branch}
              </p>
              <p className="text-2xl font-bold text-slate-900 mb-3">{formatNumber(b.opps)}</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Win rate</span>
                  <span className="font-semibold text-green-700">{formatPercent(b.winRate)}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                    style={{ width: `${revPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Revenue</span>
                  <span className="font-medium text-slate-700">{formatCurrency(b.revenue)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bar chart comparison */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Branch Comparison</h3>
        {chartData.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-sm text-slate-400">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="branch" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="count" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="revenue" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `€${v}K`} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                formatter={(value, name) => {
                  if (name === 'Revenue') return [`€${Number(value).toFixed(0)}K`, name]
                  return [value, name]
                }}
              />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="count" dataKey="Opps" fill="#86efac" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="count" dataKey="Won" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="revenue" dataKey="Revenue" fill="#4ade80" radius={[4, 4, 0, 0]} opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Sales rep leaderboard */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Sales Rep Leaderboard</h3>
        <DataTable
          data={salesRepRows as Record<string, unknown>[]}
          loading={oppsLoading}
          defaultSort="revenue"
          pageSize={20}
          columns={[
            {
              key: 'rep',
              label: 'Sales Rep',
              sortable: true,
              render: (v, row) => {
                const r = row as unknown as SalesRepRow
                const idx = salesRepRows
                  .slice()
                  .sort((a, b) => b.revenue - a.revenue)
                  .findIndex((x) => x.rep === r.rep)
                return (
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0
                          ? 'bg-yellow-400 text-yellow-900'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-700'
                          : idx === 2
                          ? 'bg-orange-300 text-orange-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="font-medium text-slate-800">{String(v)}</span>
                  </div>
                )
              },
            },
            { key: 'branch', label: 'Branch', sortable: true },
            { key: 'opps', label: 'Opps', align: 'right', sortable: true, render: (v) => formatNumber(v as number) },
            { key: 'won', label: 'Won', align: 'right', sortable: true, render: (v) => <span className="font-semibold text-green-700">{formatNumber(v as number)}</span> },
            {
              key: 'winRate',
              label: 'Win Rate',
              align: 'right',
              sortable: true,
              render: (v) => {
                const val = v as number
                return <span className={val >= 30 ? 'text-green-700 font-bold' : 'text-slate-600'}>{formatPercent(val)}</span>
              },
            },
            { key: 'revenue', label: 'Revenue', align: 'right', sortable: true, render: (v) => <span className="font-semibold text-slate-800">{formatCurrency(v as number)}</span> },
            { key: 'avgDeal', label: 'Avg Deal', align: 'right', sortable: true, render: (v) => formatCurrency(v as number) },
          ]}
        />
      </div>
    </div>
  )
}
