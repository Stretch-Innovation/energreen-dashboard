import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Opportunity, Filters } from '@/types/database'

export function useOpportunities(filters: Filters) {
  return useQuery({
    queryKey: ['opportunities', filters],
    queryFn: async () => {
      let query = supabase
        .from('opportunities')
        .select('*')

      if (filters.dateRange.from) {
        query = query.gte('created_on', filters.dateRange.from.toISOString())
      }
      if (filters.dateRange.to) {
        query = query.lte('created_on', filters.dateRange.to.toISOString())
      }
      if (filters.quoteGroups.length > 0) {
        query = query.in('quote_group', filters.quoteGroups)
      }
      if (filters.branches.length > 0) {
        query = query.in('branch', filters.branches)
      }
      if (filters.productTypes.length > 0) {
        query = query.in('quote_type', filters.productTypes)
      }

      const { data, error } = await query.order('created_on', { ascending: false })
      if (error) throw error
      return data as Opportunity[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useOpportunityStats(filters: Filters) {
  return useQuery({
    queryKey: ['opp-stats', filters],
    queryFn: async () => {
      let query = supabase
        .from('opportunities')
        .select('id, status_reason, pipeline_phase, quote_group, quote_type, branch, owner, est_revenue, actual_revenue, gh_code, campaign_type, created_on, actual_close_date, lead_id')

      if (filters.dateRange.from) {
        query = query.gte('created_on', filters.dateRange.from.toISOString())
      }
      if (filters.dateRange.to) {
        query = query.lte('created_on', filters.dateRange.to.toISOString())
      }
      if (filters.quoteGroups.length > 0) {
        query = query.in('quote_group', filters.quoteGroups)
      }
      if (filters.branches.length > 0) {
        query = query.in('branch', filters.branches)
      }
      if (filters.productTypes.length > 0) {
        query = query.in('quote_type', filters.productTypes)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Pick<Opportunity, 'id' | 'status_reason' | 'pipeline_phase' | 'quote_group' | 'quote_type' | 'branch' | 'owner' | 'est_revenue' | 'actual_revenue' | 'gh_code' | 'campaign_type' | 'created_on' | 'actual_close_date' | 'lead_id'>[]
    },
    staleTime: 5 * 60 * 1000,
  })
}
