/**
 * useActivities - Real InsForge Database
 */

import { useState, useCallback, useEffect } from 'react'
import { insForge } from '@/lib/insforge'
import { getTenantId } from '@/lib/tenant'

export function useActivities(tenantId: string = getTenantId(), options?: { pollInterval?: number }) {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = useCallback(async () => {
    if (!insForge) {
      setError('Database not connected')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: apiError } = await insForge
        .from('crm_activities')
        .select(`*, crm_leads:lead_id(contact_name, company_name), user_profiles:assigned_to(full_name)`)
        .eq('tenant_id', tenantId)
        .order('scheduled_at', { ascending: false })

      if (apiError) throw apiError
      setActivities(data || [])
      return data || []
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const createActivity = useCallback(async (data: any) => {
    if (!insForge) throw new Error('Database not connected')

    const { data: result, error } = await insForge
      .from('crm_activities')
      .insert({
        ...data,
        tenant_id: data.tenant_id ?? tenantId,
      })
      .select()
      .single()
    if (error) throw error
    return result
  }, [tenantId])

  const updateActivity = useCallback(async (id: string, data: any) => {
    if (!insForge) throw new Error('Database not connected')

    const { data: result, error } = await insForge
      .from('crm_activities')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    if (error) throw error
    return result
  }, [tenantId])

  const deleteActivity = useCallback(async (id: string) => {
    if (!insForge) throw new Error('Database not connected')

    const { error } = await insForge
      .from('crm_activities')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (error) throw error
    return true
  }, [tenantId])

  useEffect(() => {
    fetchActivities()

    if (options?.pollInterval && options.pollInterval > 0) {
      const interval = setInterval(fetchActivities, options.pollInterval)
      return () => clearInterval(interval)
    }
  }, [fetchActivities, options?.pollInterval])

  return {
    activities,
    loading,
    error,
    fetchActivities,
    createActivity,
    updateActivity,
    deleteActivity,
  }
}
