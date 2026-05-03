/**
 * useBoppFormulas - Real InsForge Database
 */

import { useState, useCallback, useEffect } from 'react'
import { insForge } from '@/lib/insforge'
import { getTenantId } from '@/lib/tenant'

export function useBoppFormulas(tenantId: string = getTenantId(), options?: { pollInterval?: number }) {
  const [formulas, setFormulas] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFormulas = useCallback(async () => {
    if (!insForge) {
      setError('Database not connected')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: apiError } = await insForge
        .from('bopp_formulas')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name', { ascending: true })

      if (apiError) throw apiError
      setFormulas(data || [])
      return data || []
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const createFormula = useCallback(async (data: any) => {
    if (!insForge) throw new Error('Database not connected')

    const { data: result, error } = await insForge
      .from('bopp_formulas')
      .insert({ ...data, tenant_id: data.tenant_id ?? tenantId })
      .select()
      .single()
    if (error) throw error
    return result
  }, [tenantId])

  const updateFormula = useCallback(async (id: string, data: any) => {
    if (!insForge) throw new Error('Database not connected')

    const { data: result, error } = await insForge
      .from('bopp_formulas')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    if (error) throw error
    return result
  }, [tenantId])

  const deleteFormula = useCallback(async (id: string) => {
    if (!insForge) throw new Error('Database not connected')

    const { error } = await insForge
      .from('bopp_formulas')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (error) throw error
    return true
  }, [tenantId])

  useEffect(() => {
    fetchFormulas()

    if (options?.pollInterval && options.pollInterval > 0) {
      const interval = setInterval(fetchFormulas, options.pollInterval)
      return () => clearInterval(interval)
    }
  }, [fetchFormulas, options?.pollInterval])

  const calculateDistribution = useCallback((revenue: number, formula: any) => {
    return {
      marketing: revenue * (formula.marketing_percent / 100),
      se: revenue * (formula.se_percent / 100),
      management: revenue * (formula.management_percent / 100),
      tech: revenue * (formula.tech_percent / 100),
      operational: revenue * (formula.operational_percent / 100),
    }
  }, [])

  return {
    formulas,
    loading,
    error,
    fetchFormulas,
    createFormula,
    updateFormula,
    deleteFormula,
    calculateDistribution
  }
}
