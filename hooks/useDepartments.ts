/**
 * useDepartments - Real InsForge Database
 */

import { useState, useCallback, useEffect } from 'react'
import { insForge } from '@/lib/insforge'
import { getTenantId } from '@/lib/tenant'

export function useDepartments(
  tenantId: string = getTenantId(),
  options?: {
    pollInterval?: number
    entityId?: string | null
    /** Jangan fetch (mis. SuperAdmin belum memilih instansi) */
    skipFetch?: boolean
  }
) {
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDepartments = useCallback(async () => {
    if (!insForge) {
      setError('Database not connected')
      return []
    }
    
    setLoading(true)
    setError(null)
    
    try {
      let q = insForge
        .from('departments')
        .select('*')
        .eq('tenant_id', tenantId)
      if (options?.entityId) {
        q = q.eq('entity_id', options.entityId)
      }
      const { data, error: apiError } = await q.order('name', { ascending: true })
      
      if (apiError) throw apiError
      setDepartments(data || [])
      return data || []
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [tenantId, options?.entityId])

  const createDepartment = useCallback(async (data: any) => {
    if (!insForge) throw new Error('Database not connected')
    
    const { data: result, error } = await insForge.from('departments').insert(data).select().single()
    if (error) throw error
    return result
  }, [])

  const updateDepartment = useCallback(async (id: string, data: any) => {
    if (!insForge) throw new Error('Database not connected')
    
    const { data: result, error } = await insForge.from('departments').update(data).eq('id', id).select().single()
    if (error) throw error
    return result
  }, [])

  const deleteDepartment = useCallback(async (id: string) => {
    if (!insForge) throw new Error('Database not connected')
    
    const { error } = await insForge.from('departments').delete().eq('id', id)
    if (error) throw error
    return true
  }, [])

  useEffect(() => {
    if (options?.skipFetch) {
      setLoading(false)
      setDepartments([])
      return
    }

    fetchDepartments()

    if (options?.pollInterval && options.pollInterval > 0) {
      const interval = setInterval(fetchDepartments, options.pollInterval)
      return () => clearInterval(interval)
    }
  }, [fetchDepartments, options?.pollInterval, options?.entityId, options?.skipFetch])

  return {
    departments,
    loading,
    error,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    // Backward-compatible aliases for existing pages
    update: updateDepartment,
    remove: deleteDepartment
  }
}
