/**
 * useSalaryComponents - Real InsForge Database
 */

import { useState, useCallback, useEffect } from 'react'
import { insForge } from '@/lib/insforge'
import { getTenantId } from '@/lib/tenant'

export function useSalaryComponents(tenantId: string = getTenantId(), options?: { pollInterval?: number }) {
  const [components, setComponents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchComponents = useCallback(async () => {
    if (!insForge) {
      setError('Database not connected')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: apiError } = await insForge
        .from('salary_components')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('code', { ascending: true })

      if (apiError) throw apiError
      setComponents(data || [])
      return data || []
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const createComponent = useCallback(async (data: any) => {
    if (!insForge) throw new Error('Database not connected')

    const { data: result, error } = await insForge
      .from('salary_components')
      .insert({ ...data, tenant_id: data.tenant_id ?? tenantId })
      .select()
      .single()
    if (error) throw error
    return result
  }, [tenantId])

  const updateComponent = useCallback(async (id: string, data: any) => {
    if (!insForge) throw new Error('Database not connected')

    const { data: result, error } = await insForge
      .from('salary_components')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    if (error) throw error
    return result
  }, [tenantId])

  const deleteComponent = useCallback(async (id: string) => {
    if (!insForge) throw new Error('Database not connected')

    const { error } = await insForge
      .from('salary_components')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (error) throw error
    return true
  }, [tenantId])

  useEffect(() => {
    fetchComponents()

    if (options?.pollInterval && options.pollInterval > 0) {
      const interval = setInterval(fetchComponents, options.pollInterval)
      return () => clearInterval(interval)
    }
  }, [fetchComponents, options?.pollInterval])

  const earnings = components.filter(c => c.type === 'earning')
  const deductions = components.filter(c => c.type === 'deduction')

  return {
    components,
    salaryComponents: components,
    earnings,
    deductions,
    loading,
    error,
    fetchComponents,
    createComponent,
    updateComponent,
    deleteComponent,
    // Backward-compatible aliases for existing pages
    update: updateComponent,
    remove: deleteComponent
  }
}
