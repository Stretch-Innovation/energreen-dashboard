import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { MetaAd, GoogleAd, Filters } from '@/types/database'

export function useMetaAds(filters: Filters) {
  return useQuery({
    queryKey: ['meta-ads', filters],
    queryFn: async () => {
      let query = supabase
        .from('meta_ads')
        .select('*')

      if (filters.dateRange.from) {
        query = query.gte('date', filters.dateRange.from.toISOString().split('T')[0])
      }
      if (filters.dateRange.to) {
        query = query.lte('date', filters.dateRange.to.toISOString().split('T')[0])
      }

      const { data, error } = await query.order('date', { ascending: false })
      if (error) throw error
      return data as MetaAd[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useGoogleAds(filters: Filters) {
  return useQuery({
    queryKey: ['google-ads', filters],
    queryFn: async () => {
      let query = supabase
        .from('google_ads')
        .select('*')

      if (filters.dateRange.from) {
        query = query.gte('date', filters.dateRange.from.toISOString().split('T')[0])
      }
      if (filters.dateRange.to) {
        query = query.lte('date', filters.dateRange.to.toISOString().split('T')[0])
      }

      const { data, error } = await query.order('date', { ascending: false })
      if (error) throw error
      return data as GoogleAd[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

export interface AdSpendSummary {
  totalMetaSpend: number
  totalGoogleSpend: number
  totalSpend: number
  totalImpressions: number
  totalClicks: number
  avgCPC: number
  avgCTR: number
}

export function calcAdSpendSummary(meta: MetaAd[], google: GoogleAd[]): AdSpendSummary {
  const totalMetaSpend = meta.reduce((s, r) => s + (r.spend || 0), 0)
  const totalGoogleSpend = google.reduce((s, r) => s + (r.spend || 0), 0)
  const totalImpressions = meta.reduce((s, r) => s + (r.impressions || 0), 0) + google.reduce((s, r) => s + (r.impressions || 0), 0)
  const totalClicks = meta.reduce((s, r) => s + (r.clicks || 0), 0) + google.reduce((s, r) => s + (r.clicks || 0), 0)
  const totalSpend = totalMetaSpend + totalGoogleSpend

  return {
    totalMetaSpend,
    totalGoogleSpend,
    totalSpend,
    totalImpressions,
    totalClicks,
    avgCPC: totalClicks > 0 ? totalSpend / totalClicks : 0,
    avgCTR: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
  }
}
