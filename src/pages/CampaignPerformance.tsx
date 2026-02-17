import { useMemo, useState } from 'react'
import { useFilters } from '@/hooks/useFilters'
import { useLeadStats } from '@/hooks/useLeads'
import { useOpportunityStats } from '@/hooks/useOpportunities'
import { useMetaAds, useGoogleAds } from '@/hooks/useAdSpend'
import { FilterBar } from '@/components/dashboard/FilterBar'
import { DataTable } from '@/components/dashboard/DataTable'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatNumber } from '@/lib/formatters'
import { Megaphone } from 'lucide-react'

type CampaignType = 'all' | '1' | '2' | '3' | 'N/A'

interface CampaignRow {
  ghCode: string
  type: string
  metaSpend: number
  googleSpend: number
  totalSpend: number
  leads: number
  opps: number
  won: number
  revenue: number
  cpl: number
  cpa: number
  roas: number
  [key: string]: unknown
}

const TYPE_COLORS: Record<string, string> = {
  '1': 'bg-blue-50 text-blue-700 border-blue-200',
  '2': 'bg-purple-50 text-purple-700 border-purple-200',
  '3': 'bg-orange-50 text-orange-700 border-orange-200',
}

export default function CampaignPerformance() {
  const {
    filters,
    setPresetRange,
    setQuoteGroups,
    setBranches,
    setProductTypes,
    resetFilters,
  } = useFilters()

  const [activeType, setActiveType] = useState<CampaignType>('all')

  const { data: leads = [], isLoading: leadsLoading } = useLeadStats(filters)
  const { data: opps = [], isLoading: oppsLoading } = useOpportunityStats(filters)
  const { data: metaAds = [] } = useMetaAds(filters)
  const { data: googleAds = [] } = useGoogleAds(filters)

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

  const rows = useMemo<CampaignRow[]>(() => {
    const map: Record<string, CampaignRow> = {}

    leads.forEach((l) => {
      const code = l.gh_code || 'N/A'
      if (!map[code]) {
        map[code] = {
          ghCode: code,
          type: l.campaign_type || 'N/A',
          metaSpend: 0,
          googleSpend: 0,
          totalSpend: 0,
          leads: 0,
          opps: 0,
          won: 0,
          revenue: 0,
          cpl: 0,
          cpa: 0,
          roas: 0,
        }
      }
      map[code].leads++
    })

    opps.forEach((o) => {
      const code = o.gh_code || 'N/A'
      if (!map[code]) {
        map[code] = {
          ghCode: code,
          type: o.campaign_type || 'N/A',
          metaSpend: 0,
          googleSpend: 0,
          totalSpend: 0,
          leads: 0,
          opps: 0,
          won: 0,
          revenue: 0,
          cpl: 0,
          cpa: 0,
          roas: 0,
        }
      }
      map[code].opps++
      if (o.status_reason === 'Won') {
        map[code].won++
        map[code].revenue += o.actual_revenue || 0
      }
    })

    metaAds.forEach((ad) => {
      const code = ad.gh_code || 'N/A'
      if (map[code]) map[code].metaSpend += ad.spend || 0
    })

    googleAds.forEach((ad) => {
      const code = ad.gh_code || 'N/A'
      if (map[code]) map[code].googleSpend += ad.spend || 0
    })

    return Object.values(map).map((r) => {
      const total = r.metaSpend + r.googleSpend
      return {
        ...r,
        totalSpend: total,
        cpl: r.leads > 0 ? total / r.leads : 0,
        cpa: r.won > 0 ? total / r.won : 0,
        roas: total > 0 ? r.revenue / total : 0,
      }
    })
  }, [leads, opps, metaAds, googleAds])

  const filteredRows = useMemo(() => {
    if (activeType === 'all') return rows as Record<string, unknown>[]
    return rows.filter((r) => r.type === activeType) as Record<string, unknown>[]
  }, [rows, activeType])

  const types = useMemo(
    () => ['all', ...new Set(rows.map((r) => r.type).filter(Boolean))].slice(0, 6),
    [rows]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-sm">
              <Megaphone className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Campaign Performance</h1>
          </div>
          <p className="text-sm text-slate-500">Spend, leads, conversions and ROI by GH campaign code</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Total campaigns</p>
          <p className="text-2xl font-bold text-slate-900">{rows.length}</p>
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

      {/* Type tabs */}
      <Tabs value={activeType} onValueChange={(v) => setActiveType(v as CampaignType)}>
        <TabsList className="bg-slate-100 rounded-xl">
          {types.map((t) => (
            <TabsTrigger key={t} value={t} className="rounded-lg text-sm capitalize">
              {t === 'all' ? 'All Types' : `Type ${t}`}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <DataTable
        data={filteredRows}
        loading={leadsLoading || oppsLoading}
        defaultSort="leads"
        pageSize={25}
        columns={[
          {
            key: 'ghCode',
            label: 'GH Code',
            sortable: true,
            render: (v) => (
              <span className="font-mono font-semibold text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded">
                {String(v)}
              </span>
            ),
          },
          {
            key: 'type',
            label: 'Type',
            sortable: true,
            render: (v) => {
              const t = String(v)
              const cls = TYPE_COLORS[t] || 'bg-slate-50 text-slate-600 border-slate-200'
              return (
                <Badge className={`text-xs border ${cls}`}>{t}</Badge>
              )
            },
          },
          {
            key: 'metaSpend',
            label: 'Meta Spend',
            align: 'right',
            sortable: true,
            render: (v) => formatCurrency(v as number),
          },
          {
            key: 'googleSpend',
            label: 'Google Spend',
            align: 'right',
            sortable: true,
            render: (v) => formatCurrency(v as number),
          },
          {
            key: 'totalSpend',
            label: 'Total Spend',
            align: 'right',
            sortable: true,
            render: (v) => (
              <span className="font-semibold text-slate-800">{formatCurrency(v as number)}</span>
            ),
          },
          {
            key: 'leads',
            label: 'Leads',
            align: 'right',
            sortable: true,
            render: (v) => formatNumber(v as number),
          },
          {
            key: 'opps',
            label: 'Opps',
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
            key: 'revenue',
            label: 'Revenue',
            align: 'right',
            sortable: true,
            render: (v) => (
              <span className="font-semibold text-slate-800">{formatCurrency(v as number)}</span>
            ),
          },
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
          {
            key: 'cpa',
            label: 'CPA',
            align: 'right',
            sortable: true,
            render: (v) => {
              const val = v as number
              return val > 0 ? formatCurrency(val) : '—'
            },
          },
          {
            key: 'roas',
            label: 'ROAS',
            align: 'right',
            sortable: true,
            render: (v) => {
              const val = v as number
              if (val <= 0) return '—'
              const cls = val >= 3 ? 'text-green-700 font-bold' : val >= 1 ? 'text-slate-700' : 'text-red-500'
              return <span className={cls}>{val.toFixed(2)}x</span>
            },
          },
        ]}
      />
    </div>
  )
}
