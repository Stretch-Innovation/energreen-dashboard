import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Lead, Filters } from '@/types/database'

export function useLeads(filters: Filters) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: async () => {
      let query = supabase
        .from('leads')
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
      if (filters.productTypes.length > 0) {
        query = query.in('quote_type', filters.productTypes)
      }

      const { data, error } = await query.order('created_on', { ascending: false })
      if (error) throw error
      return data as Lead[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useLeadStats(filters: Filters) {
  return useQuery({
    queryKey: ['lead-stats', filters],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('id, status_reason, quote_group, quote_type, gh_code, campaign_type, created_on, owner')

      if (filters.dateRange.from) {
        query = query.gte('created_on', filters.dateRange.from.toISOString())
      }
      if (filters.dateRange.to) {
        query = query.lte('created_on', filters.dateRange.to.toISOString())
      }
      if (filters.quoteGroups.length > 0) {
        query = query.in('quote_group', filters.quoteGroups)
      }
      if (filters.productTypes.length > 0) {
        query = query.in('quote_type', filters.productTypes)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Pick<Lead, 'id' | 'status_reason' | 'quote_group' | 'quote_type' | 'gh_code' | 'campaign_type' | 'created_on' | 'owner'>[]
    },
    staleTime: 5 * 60 * 1000,
  })
}
