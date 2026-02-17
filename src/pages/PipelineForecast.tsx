import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useFilters } from '@/hooks/useFilters'
import { useLeadStats } from '@/hooks/useLeads'
import { useOpportunityStats } from '@/hooks/useOpportunities'
import { FilterBar } from '@/components/dashboard/FilterBar'
import { DataTable } from '@/components/dashboard/DataTable'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/formatters'
import { GitBranch, TrendingUp } from 'lucide-react'

// Historical win rate weights per pipeline phase
const PHASE_WEIGHTS: Record<string, number> = {
  Qualify: 0.2,
  Visit: 0.5,
  Quote: 0.8,
  Negotiation: 0.9,
}

function getPhaseWeight(phase: string | null): number {
  if (!phase) return 0.1
  for (const [key, weight] of Object.entries(PHASE_WEIGHTS)) {
    if (phase.toLowerCase().includes(key.toLowerCase())) return weight
  }
  return 0.3
}

const PHASE_COLORS = ['#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d']

export default function PipelineForecast() {
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

  // In-progress opportunities grouped by phase
  const inProgressOpps = useMemo(
    () =>
      opps.filter(
        (o) =>
          o.status_reason !== 'Won' &&
          o.status_reason !== 'Lost' &&
          o.status_reason !== 'Cancelled'
      ),
    [opps]
  )

  const phaseData = useMemo(() => {
    const map: Record<
      string,
      { count: number; estRevenue: number; weightedRevenue: number; weight: number }
    > = {}

    inProgressOpps.forEach((o) => {
      const phase = o.pipeline_phase || 'Unknown'
      if (!map[phase]) {
        const w = getPhaseWeight(phase)
        map[phase] = { count: 0, estRevenue: 0, weightedRevenue: 0, weight: w }
      }
      const est = o.est_revenue || 0
      map[phase].count++
      map[phase].estRevenue += est
      map[phase].weightedRevenue += est * map[phase].weight
    })

    return Object.entries(map)
      .map(([phase, d]) => ({ phase, ...d }))
      .sort((a, b) => b.weight - a.weight)
  }, [inProgressOpps])

  const totalWeightedRevenue = useMemo(
    () => phaseData.reduce((s, p) => s + p.weightedRevenue, 0),
    [phaseData]
  )

  const totalPipelineRevenue = useMemo(
    () => phaseData.reduce((s, p) => s + p.estRevenue, 0),
    [phaseData]
  )

  const tableData = useMemo(
    () =>
      inProgressOpps
        .map((o) => ({
          contact: o.owner || '—',
          branch: o.branch || '—',
          phase: o.pipeline_phase || '—',
          quoteType: o.quote_type || '—',
          estRevenue: o.est_revenue || 0,
          probability: getPhaseWeight(o.pipeline_phase) * 100,
          weightedRevenue: (o.est_revenue || 0) * getPhaseWeight(o.pipeline_phase),
          closeDate: o.actual_close_date
            ? new Date(o.actual_close_date).toLocaleDateString('nl-BE')
            : '—',
        }))
        .sort((a, b) => b.weightedRevenue - a.weightedRevenue) as Record<string, unknown>[],
    [inProgressOpps]
  )

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-sm">
            <GitBranch className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Pipeline Forecast</h1>
        </div>
        <p className="text-sm text-slate-500">Weighted revenue forecast based on pipeline phase probability</p>
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

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-6 text-white shadow-lg shadow-green-500/20">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-green-200" />
            <span className="text-xs font-semibold text-green-100 uppercase tracking-wide">
              Projected Revenue
            </span>
          </div>
          <p className="text-3xl font-bold tabular-nums">{formatCurrency(totalWeightedRevenue)}</p>
          <p className="text-xs text-green-200 mt-1">Weighted by phase probability</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Pipeline Value
          </p>
          <p className="text-3xl font-bold text-slate-900 tabular-nums">
            {formatCurrency(totalPipelineRevenue)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Total estimated (unweighted)</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Active Opportunities
          </p>
          <p className="text-3xl font-bold text-slate-900 tabular-nums">
            {formatNumber(inProgressOpps.length)}
          </p>
          <p className="text-xs text-slate-400 mt-1">In progress</p>
        </div>
      </div>

      {/* Phase breakdown chart + table */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Weighted Revenue by Phase</h3>
          {phaseData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-slate-400">No in-progress opportunities</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={phaseData} margin={{ top: 4, right: 8, bottom: 40, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="phase"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  angle={-30}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `€${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(value: number | undefined, name) => [formatCurrency(value ?? 0), name]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="weightedRevenue" name="Weighted Revenue" radius={[4, 4, 0, 0]}>
                  {phaseData.map((_, i) => (
                    <Cell key={i} fill={PHASE_COLORS[i % PHASE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Phase summary table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Phase Summary</h3>
          <div className="space-y-3">
            {phaseData.map((p, i) => (
              <div key={p.phase} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: PHASE_COLORS[i % PHASE_COLORS.length] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 truncate">{p.phase}</span>
                    <span className="text-xs text-slate-400 ml-2 shrink-0">{formatPercent(p.weight * 100, 0)} prob.</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-slate-400">{p.count} opps</span>
                    <span className="text-sm font-semibold text-green-700">{formatCurrency(p.weightedRevenue)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Opportunity list */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Pipeline Detail</h3>
        <DataTable
          data={tableData}
          loading={oppsLoading}
          defaultSort="weightedRevenue"
          pageSize={20}
          columns={[
            { key: 'contact', label: 'Contact', sortable: true },
            { key: 'branch', label: 'Branch', sortable: true },
            { key: 'phase', label: 'Phase', sortable: true },
            { key: 'quoteType', label: 'Type', sortable: true },
            {
              key: 'estRevenue',
              label: 'Est. Revenue',
              align: 'right',
              sortable: true,
              render: (v) => formatCurrency(v as number),
            },
            {
              key: 'probability',
              label: 'Probability',
              align: 'right',
              sortable: true,
              render: (v) => <span className="text-green-700 font-medium">{formatPercent(v as number, 0)}</span>,
            },
            {
              key: 'weightedRevenue',
              label: 'Weighted',
              align: 'right',
              sortable: true,
              render: (v) => <span className="font-semibold text-slate-800">{formatCurrency(v as number)}</span>,
            },
            { key: 'closeDate', label: 'Est. Close', sortable: true },
          ]}
        />
      </div>
    </div>
  )
}
