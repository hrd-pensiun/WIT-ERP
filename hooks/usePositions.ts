/**
 * usePositions - Real InsForge Database
 */

import { useState, useCallback, useEffect } from 'react'
import { insForge } from '@/lib/insforge'
import { getTenantId } from '@/lib/tenant'

export function usePositions(
  tenantId: string = getTenantId(),
  options?: {
    pollInterval?: number
    entityId?: string | null
    skipFetch?: boolean
  }
) {
  const [positions, setPositions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPositions = useCallback(async () => {
    if (!insForge) {
      setError('Database not connected')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      let q = insForge
        .from('hr_positions')
        .select('*, hr_job_grades:job_grade_id(id, code, name, level)')
        .eq('tenant_id', tenantId)
      if (options?.entityId) {
        q = q.eq('entity_id', options.entityId)
      }
      const { data, error: apiError } = await q.order('name', { ascending: true })

      if (apiError) throw apiError
      setPositions(data || [])
      return data || []
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [tenantId, options?.entityId])

  const createPosition = useCallback(async (data: any) => {
    if (!insForge) throw new Error('Database not connected')

    const { data: result, error } = await insForge
      .from('hr_positions')
      .insert({ ...data, tenant_id: data.tenant_id ?? tenantId })
      .select()
      .single()
    if (error) throw error
    return result
  }, [tenantId])

  const updatePosition = useCallback(async (id: string, data: any) => {
    if (!insForge) throw new Error('Database not connected')

    const { data: result, error } = await insForge
      .from('hr_positions')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    if (error) throw error
    return result
  }, [tenantId])

  const deletePosition = useCallback(async (id: string) => {
    if (!insForge) throw new Error('Database not connected')

    const { error } = await insForge
      .from('hr_positions')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (error) throw error
    return true
  }, [tenantId])

  useEffect(() => {
    if (options?.skipFetch) {
      setLoading(false)
      setPositions([])
      return
    }

    fetchPositions()

    if (options?.pollInterval && options.pollInterval > 0) {
      const interval = setInterval(fetchPositions, options.pollInterval)
      return () => clearInterval(interval)
    }
  }, [fetchPositions, options?.pollInterval, options?.entityId, options?.skipFetch])

  return {
    positions,
    loading,
    error,
    fetchPositions,
    createPosition,
    updatePosition,
    deletePosition,
    // Backward-compatible aliases for existing pages
    update: updatePosition,
    remove: deletePosition
  }
}
