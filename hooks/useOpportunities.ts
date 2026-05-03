/**
 * useOpportunities - Real InsForge Database
 */

import { useState, useCallback, useEffect } from 'react'
import { insForge } from '@/lib/insforge'
import { getTenantId } from '@/lib/tenant'

const PIPELINE_STAGES = [
  { id: 'discovery', name: 'Discovery', color: 'bg-slate-500', probability: 10 },
  { id: 'proposal', name: 'Proposal', color: 'bg-blue-500', probability: 30 },
  { id: 'negotiation', name: 'Negotiation', color: 'bg-yellow-500', probability: 60 },
  { id: 'contract', name: 'Contract', color: 'bg-purple-500', probability: 80 },
  { id: 'won', name: 'Won', color: 'bg-emerald-500', probability: 100 },
  { id: 'lost', name: 'Lost', color: 'bg-red-500', probability: 0 }
]

export function useOpportunities(tenantId: string = getTenantId(), options?: { pollInterval?: number }) {
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        .select(`*, crm_leads:lead_id(company_name)`)
        .eq('tenant_id', tenantId)
      
      if (filters?.stage) query = query.eq('stage', filters.stage)
      if (filters?.status) {
        query = filters.status === 'open'
          ? query.neq('stage', 'won').neq('stage', 'lost')
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
    
    const stageConfig = PIPELINE_STAGES.find(s => s.id === stage)
    const { data: result, error } = await insForge.from('crm_opportunities')
      .update({ stage, probability: stageConfig?.probability || 0 })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select().single()
    
    if (error) throw error
    return result
  }, [tenantId])

  const getPipelineStats = useCallback(() => {
    const totalValue = opportunities.reduce((sum, o) => sum + (o.value || 0), 0)
    const weightedValue = opportunities.reduce((sum, o) => 
      sum + ((o.value || 0) * (o.probability || 0) / 100), 0)
    
    return { totalValue, weightedValue }
  }, [opportunities])

  useEffect(() => {
    fetchOpportunities()
    
    if (options?.pollInterval && options.pollInterval > 0) {
      const interval = setInterval(fetchOpportunities, options.pollInterval)
      return () => clearInterval(interval)
    }
  }, [fetchOpportunities, options?.pollInterval])

  return {
    opportunities,
    loading,
    error,
    fetchOpportunities,
    createOpportunity,
    updateOpportunity,
    updateStage,
    getPipelineStats,
    PIPELINE_STAGES
  }
}
