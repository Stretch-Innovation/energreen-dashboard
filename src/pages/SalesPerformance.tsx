import { useMemo } from 'react'
import { useFilters } from '@/hooks/useFilters'
import { useLeadStats } from '@/hooks/useLeads'
import { useOpportunityStats } from '@/hooks/useOpportunities'
import { FilterBar } from '@/components/dashboard/FilterBar'
import { DataTable } from '@/components/dashboard/DataTable'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/formatters'
import { Users } from 'lucide-react'

interface SalesRepRow {
  rank: number
  rep: string
  branch: string
  opps: number
  won: number
  winRate: number
  revenue: number
  avgDeal: number
  [key: string]: unknown
}

export default function SalesPerformance() {
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

  const rows = useMemo<SalesRepRow[]>(() => {
    const map: Record<string, { branch: string; opps: number; won: number; revenue: number }> = {}

    opps.forEach((o) => {
      const rep = o.owner || 'Unknown'
      if (!map[rep]) map[rep] = { branch: o.branch || '—', opps: 0, won: 0, revenue: 0 }
      map[rep].opps++
      if (o.status_reason === 'Won') {
        map[rep].won++
        map[rep].revenue += o.actual_revenue || 0
      }
    })

    return Object.entries(map)
      .map(([rep, d]) => ({
        rep,
        branch: d.branch,
        opps: d.opps,
        won: d.won,
        winRate: d.opps > 0 ? (d.won / d.opps) * 100 : 0,
        revenue: d.revenue,
        avgDeal: d.won > 0 ? d.revenue / d.won : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .map((r, i) => ({ ...r, rank: i + 1 }))
  }, [opps])

  const top10 = useMemo(() => rows.slice(0, 10), [rows])

  const totalRevenue = useMemo(() => rows.reduce((s, r) => s + r.revenue, 0), [rows])
  const totalWon = useMemo(() => rows.reduce((s, r) => s + r.won, 0), [rows])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-sm">
              <Users className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Sales Performance</h1>
          </div>
          <p className="text-sm text-slate-500">Individual sales rep metrics and leaderboard</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-xs text-slate-400">Total Won</p>
            <p className="text-2xl font-bold text-slate-900">{formatNumber(totalWon)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Total Revenue</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(totalRevenue)}</p>
          </div>
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

      {/* Top 10 leaderboard cards */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Top 10 by Revenue</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {top10.map((rep) => {
            const revShare = totalRevenue > 0 ? (rep.revenue / totalRevenue) * 100 : 0
            const medalColor =
              rep.rank === 1
                ? 'bg-yellow-400 text-yellow-900'
                : rep.rank === 2
                ? 'bg-slate-300 text-slate-700'
                : rep.rank === 3
                ? 'bg-orange-300 text-orange-800'
                : 'bg-slate-100 text-slate-500'

            return (
              <div
                key={rep.rep}
                className="flex items-center gap-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div className="absolute-none">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${medalColor}`}
                  >
                    {rep.rank}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-800 truncate">{rep.rep}</p>
                    <p className="text-sm font-bold text-green-700 ml-2 shrink-0">
                      {formatCurrency(rep.revenue)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5">
                    <span className="text-xs text-slate-400">{rep.branch}</span>
                    <span className="text-xs text-slate-500">{rep.won} won</span>
                    <span className="text-xs text-slate-500">{formatPercent(rep.winRate)} WR</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all"
                      style={{ width: `${revShare}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Full table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">All Sales Reps</h3>
        <DataTable
          data={rows as Record<string, unknown>[]}
          loading={oppsLoading}
          defaultSort="revenue"
          pageSize={25}
          columns={[
            {
              key: 'rank',
              label: '#',
              sortable: false,
              align: 'center',
              render: (v) => {
                const rank = v as number
                const cls =
                  rank === 1
                    ? 'bg-yellow-400 text-yellow-900'
                    : rank === 2
                    ? 'bg-slate-300 text-slate-700'
                    : rank === 3
                    ? 'bg-orange-300 text-orange-800'
                    : 'bg-slate-100 text-slate-400'
                return (
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${cls}`}
                  >
                    {rank}
                  </span>
                )
              },
            },
            { key: 'rep', label: 'Sales Rep', sortable: true, render: (v) => <span className="font-medium text-slate-800">{String(v)}</span> },
            { key: 'branch', label: 'Branch', sortable: true },
            {
              key: 'opps',
              label: 'Opps Assigned',
              align: 'right',
              sortable: true,
              render: (v) => formatNumber(v as number),
            },
            {
              key: 'won',
              label: 'Won',
              align: 'right',
              sortable: true,
              render: (v) => (
                <span className="font-semibold text-green-700">{formatNumber(v as number)}</span>
              ),
            },
            {
              key: 'winRate',
              label: 'Win Rate',
              align: 'right',
              sortable: true,
              render: (v) => {
                const val = v as number
                return (
                  <span className={val >= 30 ? 'text-green-700 font-bold' : 'text-slate-600'}>
                    {formatPercent(val)}
                  </span>
                )
              },
            },
            {
              key: 'revenue',
              label: 'Revenue',
              align: 'right',
              sortable: true,
              render: (v) => (
                <span className="font-semibold text-slate-800">{formatCurrency(v as number)}</span>
              ),
            },
            {
              key: 'avgDeal',
              label: 'Avg Deal',
              align: 'right',
              sortable: true,
              render: (v) => {
                const val = v as number
                return val > 0 ? formatCurrency(val) : '—'
              },
            },
          ]}
        />
      </div>
    </div>
  )
}
