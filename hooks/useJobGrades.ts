/**
 * useJobGrades - Real InsForge Database
 */

import { useState, useCallback, useEffect } from 'react'
import { insForge } from '@/lib/insforge'
import { getTenantId } from '@/lib/tenant'

export function useJobGrades(tenantId: string = getTenantId(), options?: { pollInterval?: number }) {
  const [jobGrades, setJobGrades] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchJobGrades = useCallback(async () => {
    if (!insForge) {
      setError('Database not connected')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: apiError } = await insForge
        .from('hr_job_grades')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('level', { ascending: true })

      if (apiError) throw apiError
      setJobGrades(data || [])
      return data || []
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const createJobGrade = useCallback(async (data: any) => {
    if (!insForge) throw new Error('Database not connected')

    const { data: result, error } = await insForge
      .from('hr_job_grades')
      .insert({ ...data, tenant_id: data.tenant_id ?? tenantId })
      .select()
      .single()
    if (error) throw error
    return result
  }, [tenantId])

  const updateJobGrade = useCallback(async (id: string, data: any) => {
    if (!insForge) throw new Error('Database not connected')

    const { data: result, error } = await insForge
      .from('hr_job_grades')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    if (error) throw error
    return result
  }, [tenantId])

  const deleteJobGrade = useCallback(async (id: string) => {
    if (!insForge) throw new Error('Database not connected')

    const { error } = await insForge
      .from('hr_job_grades')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (error) throw error
    return true
  }, [tenantId])

  useEffect(() => {
    fetchJobGrades()

    if (options?.pollInterval && options.pollInterval > 0) {
      const interval = setInterval(fetchJobGrades, options.pollInterval)
      return () => clearInterval(interval)
    }
  }, [fetchJobGrades, options?.pollInterval])

  return {
    jobGrades,
    loading,
    error,
    fetchJobGrades,
    createJobGrade,
    updateJobGrade,
    deleteJobGrade,
    // Backward-compatible aliases for existing pages
    update: updateJobGrade,
    remove: deleteJobGrade
  }
}
