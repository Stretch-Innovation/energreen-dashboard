import { useMemo } from 'react'
import { useFilters } from '@/hooks/useFilters'
import { useLeadStats } from '@/hooks/useLeads'
import { useOpportunityStats } from '@/hooks/useOpportunities'
import { FilterBar } from '@/components/dashboard/FilterBar'
import { FunnelChart } from '@/components/dashboard/FunnelChart'
import { DataTable } from '@/components/dashboard/DataTable'
import { formatNumber, formatPercent, formatCurrency } from '@/lib/formatters'
import { TrendingUp } from 'lucide-react'

export default function FunnelView() {
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

  const funnelSteps = useMemo(() => {
    const totalLeads = leads.length
    const qualified = leads.filter((l) => l.status_reason === 'Qualified').length
    const totalOpps = opps.length
    const won = opps.filter((o) => o.status_reason === 'Won').length
    return [
      { label: 'Leads', value: totalLeads },
      { label: 'Qualified', value: qualified },
      { label: 'Opportunities', value: totalOpps },
      { label: 'Won', value: won },
    ]
  }, [leads, opps])

  // Conversion rates between steps
  const convRates = useMemo(() => {
    return funnelSteps.map((step, i) => {
      if (i === 0) return null
      const prev = funnelSteps[i - 1].value
      return prev > 0 ? (step.value / prev) * 100 : 0
    })
  }, [funnelSteps])

  // Breakdown by source (quote_group)
  const bySource = useMemo(() => {
    const map: Record<
      string,
      { leads: number; qualified: number; opps: number; won: number; revenue: number }
    > = {}

    leads.forEach((l) => {
      const src = l.quote_group || 'Unknown'
      if (!map[src]) map[src] = { leads: 0, qualified: 0, opps: 0, won: 0, revenue: 0 }
      map[src].leads++
      if (l.status_reason === 'Qualified') map[src].qualified++
    })

    opps.forEach((o) => {
      const src = o.quote_group || 'Unknown'
      if (!map[src]) map[src] = { leads: 0, qualified: 0, opps: 0, won: 0, revenue: 0 }
      map[src].opps++
      if (o.status_reason === 'Won') {
        map[src].won++
        map[src].revenue += o.actual_revenue || 0
      }
    })

    return Object.entries(map)
      .map(([source, d]) => ({
        source,
        leads: d.leads,
        qualRate: d.leads > 0 ? (d.qualified / d.leads) * 100 : 0,
        opps: d.opps,
        winRate: d.opps > 0 ? (d.won / d.opps) * 100 : 0,
        revenue: d.revenue,
        overallConv: d.leads > 0 ? (d.won / d.leads) * 100 : 0,
      }))
      .sort((a, b) => b.leads - a.leads) as Record<string, unknown>[]
  }, [leads, opps])

  // Breakdown by product type
  const byProduct = useMemo(() => {
    const map: Record<string, { opps: number; won: number; revenue: number }> = {}

    opps.forEach((o) => {
      const pt = o.quote_type || 'Unknown'
      if (!map[pt]) map[pt] = { opps: 0, won: 0, revenue: 0 }
      map[pt].opps++
      if (o.status_reason === 'Won') {
        map[pt].won++
        map[pt].revenue += o.actual_revenue || 0
      }
    })

    return Object.entries(map)
      .map(([product, d]) => ({
        product,
        opps: d.opps,
        won: d.won,
        winRate: d.opps > 0 ? (d.won / d.opps) * 100 : 0,
        revenue: d.revenue,
        avgDeal: d.won > 0 ? d.revenue / d.won : 0,
      }))
      .sort((a, b) => b.opps - a.opps) as Record<string, unknown>[]
  }, [opps])

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-sm">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Conversion Funnel</h1>
        </div>
        <p className="text-sm text-slate-500">Track conversion rates across each stage of the sales funnel</p>
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

      {/* Main funnel + conversion rates */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <h3 className="text-sm font-semibold text-slate-700 mb-6">Full Funnel</h3>
          <FunnelChart steps={funnelSteps} />
        </div>

        {/* Conversion rate cards */}
        <div className="space-y-4">
          {funnelSteps.map((step, i) => (
            <div
              key={step.label}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {step.label}
                </span>
                <span className="text-2xl font-bold text-slate-900 tabular-nums">
                  {formatNumber(step.value)}
                </span>
              </div>
              {convRates[i] !== null && convRates[i] !== undefined && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                      style={{ width: `${Math.min(convRates[i]!, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-green-700 tabular-nums">
                    {formatPercent(convRates[i]!)} conv.
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* Overall conversion */}
          {funnelSteps[0]?.value > 0 && (
            <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-5 text-white shadow-md shadow-green-500/20">
              <p className="text-xs font-semibold text-green-100 uppercase tracking-wide mb-1">
                Overall Conversion
              </p>
              <p className="text-3xl font-bold tabular-nums">
                {formatPercent((funnelSteps[3]?.value / funnelSteps[0].value) * 100)}
              </p>
              <p className="text-xs text-green-200 mt-1">Lead → Won</p>
            </div>
          )}
        </div>
      </div>

      {/* Breakdown by source */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Funnel by Source</h3>
        <DataTable
          data={bySource}
          loading={leadsLoading || oppsLoading}
          defaultSort="leads"
          pageSize={15}
          columns={[
            { key: 'source', label: 'Source', sortable: true },
            { key: 'leads', label: 'Leads', align: 'right', sortable: true, render: (v) => formatNumber(v as number) },
            {
              key: 'qualRate',
              label: 'Qual %',
              align: 'right',
              sortable: true,
              render: (v) => <span className="text-blue-600 font-medium">{formatPercent(v as number)}</span>,
            },
            { key: 'opps', label: 'Opps', align: 'right', sortable: true, render: (v) => formatNumber(v as number) },
            {
              key: 'winRate',
              label: 'Win Rate',
              align: 'right',
              sortable: true,
              render: (v) => {
                const val = v as number
                const cls = val >= 25 ? 'text-green-700 font-bold' : 'text-slate-600'
                return <span className={cls}>{formatPercent(val)}</span>
              },
            },
            {
              key: 'overallConv',
              label: 'Overall Conv.',
              align: 'right',
              sortable: true,
              render: (v) => <span className="font-semibold text-slate-700">{formatPercent(v as number)}</span>,
            },
            {
              key: 'revenue',
              label: 'Revenue',
              align: 'right',
              sortable: true,
              render: (v) => formatCurrency(v as number),
            },
          ]}
        />
      </div>

      {/* Breakdown by product type */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Funnel by Product Type</h3>
        <DataTable
          data={byProduct}
          loading={oppsLoading}
          defaultSort="opps"
          pageSize={15}
          columns={[
            { key: 'product', label: 'Product Type', sortable: true },
            { key: 'opps', label: 'Opportunities', align: 'right', sortable: true, render: (v) => formatNumber(v as number) },
            { key: 'won', label: 'Won', align: 'right', sortable: true, render: (v) => <span className="font-semibold text-green-700">{formatNumber(v as number)}</span> },
            {
              key: 'winRate',
              label: 'Win Rate',
              align: 'right',
              sortable: true,
              render: (v) => {
                const val = v as number
                const cls = val >= 30 ? 'text-green-700 font-bold' : 'text-slate-600'
                return <span className={cls}>{formatPercent(val)}</span>
              },
            },
            { key: 'avgDeal', label: 'Avg Deal', align: 'right', sortable: true, render: (v) => formatCurrency(v as number) },
            { key: 'revenue', label: 'Revenue', align: 'right', sortable: true, render: (v) => <span className="font-semibold text-slate-800">{formatCurrency(v as number)}</span> },
          ]}
        />
      </div>
    </div>
  )
}
