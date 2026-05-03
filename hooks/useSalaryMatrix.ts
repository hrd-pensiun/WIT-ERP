/**
 * useSalaryMatrix - Real InsForge Database
 */

import { useState, useCallback, useEffect } from 'react'
import { insForge } from '@/lib/insforge'
import { getTenantId } from '@/lib/tenant'

export function useSalaryMatrix(tenantId: string = getTenantId(), options?: { pollInterval?: number }) {
  const [matrix, setMatrix] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMatrix = useCallback(async () => {
    if (!insForge) {
      setError('Database not connected')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: apiError } = await insForge
        .from('salary_matrix')
        .select(`*, hr_job_grades:job_grade_id(code, name, level)`)
        .eq('tenant_id', tenantId)
        .order('job_grade_id', { ascending: true })

      if (apiError) throw apiError
      setMatrix(data || [])
      return data || []
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const createMatrixEntry = useCallback(async (data: any) => {
    if (!insForge) throw new Error('Database not connected')

    const { data: result, error } = await insForge
      .from('salary_matrix')
      .insert({
        ...data,
        tenant_id: data.tenant_id ?? tenantId,
      })
      .select()
      .single()
    if (error) throw error
    return result
  }, [tenantId])

  const updateMatrixEntry = useCallback(async (id: string, data: any) => {
    if (!insForge) throw new Error('Database not connected')

    const { data: result, error } = await insForge
      .from('salary_matrix')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    if (error) throw error
    return result
  }, [tenantId])

  useEffect(() => {
    fetchMatrix()

    if (options?.pollInterval && options.pollInterval > 0) {
      const interval = setInterval(fetchMatrix, options.pollInterval)
      return () => clearInterval(interval)
    }
  }, [fetchMatrix, options?.pollInterval])

  return {
    matrix,
    loading,
    error,
    fetchMatrix,
    createMatrixEntry,
    updateMatrixEntry
  }
}
