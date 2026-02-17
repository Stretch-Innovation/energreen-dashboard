import { useMemo } from 'react'
import { startOfWeek, format, parseISO } from 'date-fns'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Users, CheckCircle, Briefcase, Trophy, DollarSign, TrendingUp } from 'lucide-react'
import { useFilters } from '@/hooks/useFilters'
import { useLeadStats } from '@/hooks/useLeads'
import { useOpportunityStats } from '@/hooks/useOpportunities'
import { useMetaAds, useGoogleAds, calcAdSpendSummary } from '@/hooks/useAdSpend'
import { KPICard } from '@/components/dashboard/KPICard'
import { FilterBar } from '@/components/dashboard/FilterBar'
import { FunnelChart } from '@/components/dashboard/FunnelChart'
import { DataTable } from '@/components/dashboard/DataTable'
import { formatCurrency, formatNumber, formatCompact } from '@/lib/formatters'

const GREEN_PALETTE = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#15803d', '#166534']

export default function DashboardOverview() {
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
  const { data: metaAds = [] } = useMetaAds(filters)
  const { data: googleAds = [] } = useGoogleAds(filters)

  const loading = leadsLoading || oppsLoading

  // Derive available filter options from data
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

  const adSpend = useMemo(() => calcAdSpendSummary(metaAds, googleAds), [metaAds, googleAds])

  // KPI aggregations
  const kpis = useMemo(() => {
    const totalLeads = leads.length
    const qualifiedLeads = leads.filter((l) => l.status_reason === 'Qualified').length
    const totalOpps = opps.length
    const wonOpps = opps.filter((o) => o.status_reason === 'Won')
    const wonCount = wonOpps.length
    const revenue = wonOpps.reduce((s, o) => s + (o.actual_revenue || 0), 0)
    return { totalLeads, qualifiedLeads, totalOpps, wonCount, revenue }
  }, [leads, opps])

  // Leads over time by week, stacked by top-5 quote groups
  const topQuoteGroups = useMemo(() => {
    const counts: Record<string, number> = {}
    leads.forEach((l) => {
      const g = l.quote_group || 'Other'
      counts[g] = (counts[g] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([g]) => g)
  }, [leads])

  const leadsOverTime = useMemo(() => {
    const weekMap: Record<string, Record<string, number>> = {}
    leads.forEach((l) => {
      if (!l.created_on) return
      const week = format(startOfWeek(parseISO(l.created_on), { weekStartsOn: 1 }), 'MMM dd')
      const group = topQuoteGroups.includes(l.quote_group || '') ? l.quote_group! : 'Other'
      if (!weekMap[week]) weekMap[week] = {}
      weekMap[week][group] = (weekMap[week][group] || 0) + 1
    })
    return Object.entries(weekMap)
      .map(([week, groups]) => ({ week, ...groups }))
      .sort((a, b) => a.week.localeCompare(b.week))
  }, [leads, topQuoteGroups])

  // Spend vs Revenue per month
  const spendVsRevenue = useMemo(() => {
    const monthMap: Record<string, { month: string; spend: number; revenue: number }> = {}
    ;[...metaAds, ...googleAds].forEach((ad) => {
      if (!ad.date) return
      const month = format(parseISO(ad.date), 'MMM yy')
      if (!monthMap[month]) monthMap[month] = { month, spend: 0, revenue: 0 }
      monthMap[month].spend += ad.spend || 0
    })
    opps
      .filter((o) => o.status_reason === 'Won' && o.actual_close_date)
      .forEach((o) => {
        const month = format(parseISO(o.actual_close_date!), 'MMM yy')
        if (monthMap[month]) monthMap[month].revenue += o.actual_revenue || 0
      })
    return Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month))
  }, [metaAds, googleAds, opps])

  // Win rate by source (top 15)
  const winRateBySource = useMemo(() => {
    const sourceMap: Record<string, { opps: number; won: number }> = {}
    opps.forEach((o) => {
      const src = o.quote_group || 'Unknown'
      if (!sourceMap[src]) sourceMap[src] = { opps: 0, won: 0 }
      sourceMap[src].opps++
      if (o.status_reason === 'Won') sourceMap[src].won++
    })
    return Object.entries(sourceMap)
      .map(([source, { opps: total, won }]) => ({
        source,
        winRate: total > 0 ? (won / total) * 100 : 0,
        total,
      }))
      .filter((r) => r.total >= 3)
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 15)
  }, [opps])

  // Top 10 campaigns table
  const campaignRows = useMemo(() => {
    const campMap: Record<
      string,
      { ghCode: string; type: string; leads: number; opps: number; won: number; revenue: number; spend: number }
    > = {}

    leads.forEach((l) => {
      const code = l.gh_code || 'N/A'
      if (!campMap[code]) campMap[code] = { ghCode: code, type: l.campaign_type || '—', leads: 0, opps: 0, won: 0, revenue: 0, spend: 0 }
      campMap[code].leads++
    })
    opps.forEach((o) => {
      const code = o.gh_code || 'N/A'
      if (!campMap[code]) campMap[code] = { ghCode: code, type: o.campaign_type || '—', leads: 0, opps: 0, won: 0, revenue: 0, spend: 0 }
      campMap[code].opps++
      if (o.status_reason === 'Won') {
        campMap[code].won++
        campMap[code].revenue += o.actual_revenue || 0
      }
    })
    ;[...metaAds, ...googleAds].forEach((ad) => {
      const code = ad.gh_code || 'N/A'
      if (campMap[code]) campMap[code].spend += ad.spend || 0
    })

    return Object.values(campMap)
      .map((r) => ({
        ...r,
        cpl: r.leads > 0 ? r.spend / r.leads : 0,
      }))
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 10) as Record<string, unknown>[]
  }, [leads, opps, metaAds, googleAds])

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Overview
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Performance summary across all campaigns and channels</p>
      </div>

      {/* Filter bar */}
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

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          label="Total Leads"
          value={formatNumber(kpis.totalLeads)}
          icon={<Users className="w-4 h-4" />}
          loading={loading}
        />
        <KPICard
          label="Qualified Leads"
          value={formatNumber(kpis.qualifiedLeads)}
          subtitle={kpis.totalLeads > 0 ? `${((kpis.qualifiedLeads / kpis.totalLeads) * 100).toFixed(1)}% of total` : undefined}
          icon={<CheckCircle className="w-4 h-4" />}
          loading={loading}
        />
        <KPICard
          label="Opportunities"
          value={formatNumber(kpis.totalOpps)}
          icon={<Briefcase className="w-4 h-4" />}
          loading={loading}
        />
        <KPICard
          label="Won Deals"
          value={formatNumber(kpis.wonCount)}
          subtitle={kpis.totalOpps > 0 ? `${((kpis.wonCount / kpis.totalOpps) * 100).toFixed(1)}% win rate` : undefined}
          icon={<Trophy className="w-4 h-4" />}
          loading={loading}
        />
        <KPICard
          label="Revenue (Won)"
          value={formatCompact(kpis.revenue)}
          icon={<DollarSign className="w-4 h-4" />}
          loading={loading}
        />
        <KPICard
          label="Total Ad Spend"
          value={formatCompact(adSpend.totalSpend)}
          subtitle={`CPL: ${adSpend.totalSpend > 0 && kpis.totalLeads > 0 ? formatCurrency(adSpend.totalSpend / kpis.totalLeads) : '—'}`}
          icon={<TrendingUp className="w-4 h-4" />}
          loading={loading}
        />
      </div>

      {/* Charts 2x2 grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Leads over time */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Leads over Time (by Week)</h3>
          {leadsOverTime.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-slate-400">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={leadsOverTime} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  {topQuoteGroups.map((g, i) => (
                    <linearGradient key={g} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={GREEN_PALETTE[i]} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={GREEN_PALETTE[i]} stopOpacity={0.05} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                {topQuoteGroups.map((g, i) => (
                  <Area
                    key={g}
                    type="monotone"
                    dataKey={g}
                    stackId="1"
                    stroke={GREEN_PALETTE[i]}
                    fill={`url(#grad-${i})`}
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Spend vs Revenue */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Spend vs Revenue (Monthly)</h3>
          {spendVsRevenue.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-slate-400">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={spendVsRevenue} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="spend" name="Ad Spend" fill="#86efac" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3, fill: '#16a34a' }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Funnel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Conversion Funnel</h3>
          <FunnelChart
            steps={[
              { label: 'Leads', value: kpis.totalLeads },
              { label: 'Qualified', value: kpis.qualifiedLeads },
              { label: 'Opportunities', value: kpis.totalOpps },
              { label: 'Won', value: kpis.wonCount },
            ]}
          />
        </div>

        {/* Win rate by source */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Win Rate by Quote Group</h3>
          {winRateBySource.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-slate-400">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={winRateBySource}
                layout="vertical"
                margin={{ top: 0, right: 24, bottom: 0, left: 64 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="source"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <Tooltip
                  formatter={(v: number | undefined) => `${(v ?? 0).toFixed(1)}%`}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="winRate" name="Win Rate" fill="#16a34a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top campaigns table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Top 10 Campaigns</h3>
        <DataTable
          data={campaignRows}
          defaultSort="leads"
          columns={[
            { key: 'ghCode', label: 'GH Code', sortable: true },
            { key: 'type', label: 'Type', sortable: true },
            { key: 'leads', label: 'Leads', align: 'right', sortable: true, render: (v) => formatNumber(v as number) },
            { key: 'opps', label: 'Opps', align: 'right', sortable: true, render: (v) => formatNumber(v as number) },
            { key: 'won', label: 'Won', align: 'right', sortable: true, render: (v) => formatNumber(v as number) },
            { key: 'revenue', label: 'Revenue', align: 'right', sortable: true, render: (v) => formatCurrency(v as number) },
            { key: 'spend', label: 'Spend', align: 'right', sortable: true, render: (v) => formatCurrency(v as number) },
            {
              key: 'cpl',
              label: 'CPL',
              align: 'right',
              sortable: true,
              render: (v) => {
                const val = v as number
                return val > 0 ? formatCurrency(val) : '—'
              },
            },
          ]}
          pageSize={10}
        />
      </div>
    </div>
  )
}
