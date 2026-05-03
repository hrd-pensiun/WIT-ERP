/**
 * useLeads - Real InsForge Database
 */

import { useState, useCallback, useEffect } from 'react'
import { insForge } from '@/lib/insforge'
import { getTenantId } from '@/lib/tenant'

export function useLeads(tenantId: string = getTenantId(), options?: { pollInterval?: number }) {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = useCallback(async (filters?: { status?: string; source?: string; search?: string }) => {
    if (!insForge) {
      setError('Database not connected')
      return []
    }
    
    setLoading(true)
    setError(null)
    
    try {
      let query = insForge
        .from('crm_leads')
        .select(`*, entities:entity_id(name)`)
        .eq('tenant_id', tenantId)
      
      if (filters?.status) query = query.eq('status', filters.status)
      if (filters?.source) query = query.eq('lead_source', filters.source)
      
      const { data, error: apiError } = await query.order('created_at', { ascending: false })
      
      if (apiError) throw apiError
      
      let filtered = data || []
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase()
        filtered = filtered.filter((l: any) => 
          l.company_name?.toLowerCase().includes(searchLower) ||
          l.contact_name?.toLowerCase().includes(searchLower) ||
          l.contact_email?.toLowerCase().includes(searchLower)
        )
      }
      
      setLeads(filtered)
      return filtered
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const createLead = useCallback(async (data: any) => {
    if (!insForge) throw new Error('Database not connected')
    
    const { data: result, error } = await insForge.from('crm_leads').insert({
      ...data,
      tenant_id: data.tenant_id ?? tenantId,
    }).select().single()
    if (error) throw error
    return result
  }, [tenantId])

  const updateLead = useCallback(async (id: string, data: any) => {
    if (!insForge) throw new Error('Database not connected')
    
    const { data: result, error } = await insForge
      .from('crm_leads')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    if (error) throw error
    return result
  }, [tenantId])

  const convertToOpportunity = useCallback(async (id: string) => {
    if (!insForge) throw new Error('Database not connected')
    
    const { data: lead } = await insForge
      .from('crm_leads')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()
    if (!lead) throw new Error('Lead not found')
    
    const { data: opp, error } = await insForge.from('crm_opportunities').insert({
      tenant_id: lead.tenant_id,
      lead_id: lead.id,
      title: `Opportunity from ${lead.company_name}`,
      stage: 'discovery',
      value: lead.estimated_value || 0,
      probability: lead.probability || 10,
    }).select().single()
    
    if (error) throw error
    
    await insForge.from('crm_leads').update({ status: 'qualified' }).eq('id', id).eq('tenant_id', tenantId)
    
    return opp
  }, [tenantId])

  useEffect(() => {
    fetchLeads()
    
    if (options?.pollInterval && options.pollInterval > 0) {
      const interval = setInterval(fetchLeads, options.pollInterval)
      return () => clearInterval(interval)
    }
  }, [fetchLeads, options?.pollInterval])

  return {
    leads,
    loading,
    error,
    fetchLeads,
    createLead,
    updateLead,
    convertToOpportunity
  }
}
