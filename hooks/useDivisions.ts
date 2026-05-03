/**
 * useDivisions - Real InsForge Database
 */

import { useState, useCallback, useEffect } from 'react'
import { insForge } from '@/lib/insforge'
import { getTenantId } from '@/lib/tenant'

const DIVISIONS_SELECT = `
  *,
  departments (
    id,
    code,
    name,
    entity_id
  )
`

export function useDivisions(
  tenantId: string = getTenantId(),
  options?: {
    pollInterval?: number
    /** Hanya divisi yang departemennya ber-entity_id ini (SuperAdmin / scope instansi) */
    departmentEntityId?: string | null
    skipFetch?: boolean
  }
) {
  const [divisions, setDivisions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDivisions = useCallback(async () => {
    if (!insForge) {
      setError('Database not connected')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const first = await insForge
        .from('divisions')
        .select(DIVISIONS_SELECT)
        .eq('tenant_id', tenantId)
        .order('name', { ascending: true })

      let data = first.data
      if (first.error) {
        const second = await insForge
          .from('divisions')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('name', { ascending: true })
        if (second.error) throw second.error
        data = second.data
      }

      let rows = data || []
      if (options?.departmentEntityId) {
        rows = rows.filter(
          (r: any) => r.departments?.entity_id === options.departmentEntityId
        )
      }
      setDivisions(rows)
      return rows
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [tenantId, options?.departmentEntityId])

  const createDivision = useCallback(async (data: any) => {
    if (!insForge) throw new Error('Database not connected')

    const { data: result, error } = await insForge
      .from('divisions')
      .insert({ ...data, tenant_id: data.tenant_id ?? tenantId })
      .select()
      .single()
    if (error) throw error
    return result
  }, [tenantId])

  const updateDivision = useCallback(async (id: string, data: any) => {
    if (!insForge) throw new Error('Database not connected')

    const { data: result, error } = await insForge
      .from('divisions')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    if (error) throw error
    return result
  }, [tenantId])

  const deleteDivision = useCallback(async (id: string) => {
    if (!insForge) throw new Error('Database not connected')

    const { error } = await insForge
      .from('divisions')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (error) throw error
    return true
  }, [tenantId])

  useEffect(() => {
    if (options?.skipFetch) {
      setLoading(false)
      setDivisions([])
      return
    }

    fetchDivisions()

    if (options?.pollInterval && options.pollInterval > 0) {
      const interval = setInterval(fetchDivisions, options.pollInterval)
      return () => clearInterval(interval)
    }
  }, [fetchDivisions, options?.pollInterval, options?.skipFetch, options?.departmentEntityId])

  return {
    divisions,
    loading,
    error,
    fetchDivisions,
    createDivision,
    updateDivision,
    deleteDivision,
    // Backward-compatible aliases for existing pages
    update: updateDivision,
    remove: deleteDivision
  }
}
