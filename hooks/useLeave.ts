/**
 * useLeave - Real InsForge Database
 */

import { useState, useCallback, useEffect } from 'react'
import { insForge } from '@/lib/insforge'
import { getTenantId } from '@/lib/tenant'

export function useLeave(tenantId: string = getTenantId(), options?: { pollInterval?: number }) {
  const [leaves, setLeaves] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLeaves = useCallback(async () => {
    if (!insForge) {
      setError('Database not connected')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: apiError } = await insForge
        .from('leave_requests')
        .select(`*, user_profiles:user_profile_id(full_name, employee_number), hr_leave_types:leave_type_id(code, name)`)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (apiError) throw apiError
      setLeaves(data || [])
      return data || []
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const createLeave = useCallback(async (data: any) => {
    if (!insForge) throw new Error('Database not connected')

    const { data: result, error } = await insForge
      .from('leave_requests')
      .insert({
        ...data,
        tenant_id: data.tenant_id ?? tenantId,
      })
      .select()
      .single()
    if (error) throw error
    return result
  }, [tenantId])

  const updateLeave = useCallback(async (id: string, data: any) => {
    if (!insForge) throw new Error('Database not connected')

    const { data: result, error } = await insForge
      .from('leave_requests')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    if (error) throw error
    return result
  }, [tenantId])

  useEffect(() => {
    fetchLeaves()

    if (options?.pollInterval && options.pollInterval > 0) {
      const interval = setInterval(fetchLeaves, options.pollInterval)
      return () => clearInterval(interval)
    }
  }, [fetchLeaves, options?.pollInterval])

  return {
    leaves,
    leaveRequests: leaves,
    loading,
    error,
    fetchLeaves,
    createLeave,
    updateLeave,
    updateStatus: async (id: string, status: string) => updateLeave(id, { status })
  }
}
