/**
 * useEntities - Real InsForge Database
 */

import { useState, useCallback, useEffect } from 'react'
import { insForge } from '@/lib/insforge'
import { getTenantId } from '@/lib/tenant'

export function useEntities(tenantId: string = getTenantId(), options?: { pollInterval?: number }) {
  const [entities, setEntities] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEntities = useCallback(async () => {
    if (!insForge) {
      setError('Database not connected')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: apiError } = await insForge
        .from('entities')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (apiError) throw apiError
      setEntities(data || [])
      return data || []
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const getEntity = useCallback(async (id: string) => {
    if (!insForge) throw new Error('Database not connected')

    const { data, error } = await insForge
      .from('entities')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) throw error
    return data
  }, [tenantId])

  const createEntity = useCallback(async (data: any) => {
    if (!insForge) throw new Error('Database not connected')

    const { data: result, error } = await insForge
      .from('entities')
      .insert({ ...data, tenant_id: data.tenant_id ?? tenantId })
      .select()
      .single()
    if (error) throw error
    return result
  }, [tenantId])

  const updateEntity = useCallback(async (id: string, data: any) => {
    if (!insForge) throw new Error('Database not connected')

    const { data: result, error } = await insForge
      .from('entities')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    if (error) throw error
    return result
  }, [tenantId])

  const deleteEntity = useCallback(async (id: string) => {
    if (!insForge) throw new Error('Database not connected')

    const { error } = await insForge
      .from('entities')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (error) throw error
    return true
  }, [tenantId])

  useEffect(() => {
    fetchEntities()

    if (options?.pollInterval && options.pollInterval > 0) {
      const interval = setInterval(fetchEntities, options.pollInterval)
      return () => clearInterval(interval)
    }
  }, [fetchEntities, options?.pollInterval])

  return {
    entities,
    loading,
    error,
    fetchEntities,
    getEntity,
    createEntity,
    updateEntity,
    deleteEntity,
    // Backward-compatible aliases for existing pages
    update: updateEntity,
    remove: deleteEntity
  }
}
