/**
 * useOpportunities - Real InsForge Database
 */

import { useState, useCallback, useEffect } from 'react'
import { insForge } from '@/lib/insforge'
import { getTenantId } from '@/lib/tenant'

const FALLBACK_STAGES = [
  { id: 'New', name: 'New', description: 'Lead baru masuk', color: '#3b82f6', probability: 10 },
  { id: 'Contacted', name: 'Contacted', description: 'Sudah dihubungi', color: '#f59e0b', probability: 20 },
  { id: 'Qualified', name: 'Qualified', description: 'Memenuhi kualifikasi', color: '#8b5cf6', probability: 40 },
  { id: 'Proposal', name: 'Proposal', description: 'Proposal dikirim', color: '#6366f1', probability: 60 },
  { id: 'Negotiation', name: 'Negotiation', description: 'Dalam negosiasi', color: '#f97316', probability: 80 },
  { id: 'Closed Won', name: 'Closed Won', description: 'Berhasil menjadi project', color: '#10b981', probability: 100 },
  { id: 'Closed Lost', name: 'Closed Lost', description: 'Tidak jadi', color: '#ef4444', probability: 0 },
]

export function useOpportunities(tenantId: string = getTenantId(), options?: { pollInterval?: number }) {
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [leadStatuses, setLeadStatuses] = useState(FALLBACK_STAGES)

  const fetchLeadStatuses = useCallback(async () => {
    if (!insForge) return
    try {
      const { data, error: apiError } = await insForge
        .from('commercial_lead_status')
        .select('name, description, color, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (apiError) throw apiError
      if (data && data.length > 0) {
        const probabilities: Record<string, number> = {
          'New': 10, 'Contacted': 20, 'Qualified': 40,
          'Proposal': 60, 'Negotiation': 80,
          'Closed Won': 100, 'Closed Lost': 0,
        }
        setLeadStatuses(data.map(s => ({
          id: s.name,
          name: s.name,
          description: s.description || '',
          color: s.color || '#3b82f6',
          probability: probabilities[s.name] ?? 50,
        })))
      }
    } catch {
      // fallback already set
    }
  }, [])

  const fetchOpportunities = useCallback(async (filters?: { stage?: string; status?: string }) => {
    if (!insForge) {
      setError('Database not connected')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      let query = insForge
        .from('crm_opportunities')
        .select(`*, crm_leads:lead_id(company_name, lead_source, priority, contact_name, contact_email, contact_phone, lead_number), pic:pic_sales_id(full_name)`)
        .eq('tenant_id', tenantId)

      if (filters?.stage) query = query.eq('stage', filters.stage)
      if (filters?.status) {
        query = filters.status === 'open'
          ? query.neq('stage', 'Closed Won').neq('stage', 'Closed Lost')
          : query.eq('stage', filters.status)
      }

      const { data, error: apiError } = await query.order('created_at', { ascending: false })

      if (apiError) throw apiError
      setOpportunities(data || [])
      return data || []
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const createOpportunity = useCallback(async (data: any) => {
    if (!insForge) throw new Error('Database not connected')
    
    const { data: result, error } = await insForge.from('crm_opportunities').insert({
      ...data,
      tenant_id: data.tenant_id ?? tenantId,
    }).select().single()
    if (error) throw error
    return result
  }, [tenantId])

  const updateOpportunity = useCallback(async (id: string, data: any) => {
    if (!insForge) throw new Error('Database not connected')
    
    const { data: result, error } = await insForge
      .from('crm_opportunities')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    if (error) throw error
    return result
  }, [tenantId])

  const updateStage = useCallback(async (id: string, stage: string) => {
    if (!insForge) throw new Error('Database not connected')

    const stageConfig = leadStatuses.find(s => s.id === stage)
    const { data: result, error } = await insForge.from('crm_opportunities')
      .update({ stage, probability: stageConfig?.probability || 0 })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select().single()

    if (error) throw error
    return result
  }, [tenantId, leadStatuses])

  const getPipelineStats = useCallback(() => {
    const totalValue = opportunities.reduce((sum, o) => sum + (o.value || 0), 0)
    const weightedValue = opportunities.reduce((sum, o) => 
      sum + ((o.value || 0) * (o.probability || 0) / 100), 0)
    
    return { totalValue, weightedValue }
  }, [opportunities])

  useEffect(() => {
    fetchLeadStatuses()
    fetchOpportunities()

    if (options?.pollInterval && options.pollInterval > 0) {
      const interval = setInterval(fetchOpportunities, options.pollInterval)
      return () => clearInterval(interval)
    }
  }, [fetchLeadStatuses, fetchOpportunities, options?.pollInterval])

  return {
    opportunities,
    loading,
    error,
    fetchOpportunities,
    createOpportunity,
    updateOpportunity,
    updateStage,
    getPipelineStats,
    PIPELINE_STAGES: leadStatuses,
  }
}
