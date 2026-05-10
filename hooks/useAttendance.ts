/**
 * useAttendance - Real InsForge Database
 */

import { useState, useCallback, useEffect } from 'react'
import { insForge } from '@/lib/insforge'
import { getTenantId } from '@/lib/tenant'

export function useAttendance(tenantId: string = getTenantId(), options?: { pollInterval?: number }) {
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAttendance = useCallback(async (filters?: {
    date?: string
    date_from?: string
    date_to?: string
    employee_id?: string
  }) => {
    if (!insForge) {
      setError('Database not connected')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      let query = (insForge as any)
        .from('attendance_records')
        .select(`*, user_profiles:user_profile_id(id, full_name, employee_number)`)
        .eq('tenant_id', tenantId)

      if (filters?.date) query = query.eq('date', filters.date)
      if (filters?.date_from) query = query.gte('date', filters.date_from)
      if (filters?.date_to) query = query.lte('date', filters.date_to)
      if (filters?.employee_id) query = query.eq('user_profile_id', filters.employee_id)

      const { data, error: apiError } = await query.order('date', { ascending: false }).order('user_profile_id')

      if (apiError) throw apiError
      setAttendance(data || [])
      return data || []
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const checkIn = useCallback(async (employeeId: string, location?: { lat: number; lng: number }) => {
    if (!insForge) throw new Error('Database not connected')
    
    const { data: result, error } = await insForge.from('attendance_records').insert({
      tenant_id: tenantId,
      user_profile_id: employeeId,
      date: new Date().toISOString().split('T')[0],
      check_in: new Date().toISOString(),
      status: 'present',
      check_in_lat: location?.lat,
      check_in_lng: location?.lng,
    }).select().single()
    
    if (error) throw error
    return result
  }, [tenantId])

  const checkOut = useCallback(async (attendanceId: string) => {
    if (!insForge) throw new Error('Database not connected')
    
    const { data: result, error } = await insForge.from('attendance_records')
      .update({ check_out: new Date().toISOString() })
      .eq('id', attendanceId)
      .eq('tenant_id', tenantId)
      .select().single()
    
    if (error) throw error
    return result
  }, [tenantId])

  const createAttendance = useCallback(async (data: any) => {
    if (!insForge) throw new Error('Database not connected')

    const { data: result, error } = await insForge
      .from('attendance_records')
      .insert({
        tenant_id: data.tenant_id ?? tenantId,
        user_profile_id: data.user_profile_id ?? data.employee_id,
        date: data.date,
        check_in: data.check_in ?? null,
        check_out: data.check_out ?? null,
        status: data.status ?? 'present',
        notes: data.notes ?? null,
      })
      .select()
      .single()

    if (error) throw error
    return result
  }, [tenantId])

  useEffect(() => {
    fetchAttendance()
    
    if (options?.pollInterval && options.pollInterval > 0) {
      const interval = setInterval(fetchAttendance, options.pollInterval)
      return () => clearInterval(interval)
    }
  }, [fetchAttendance, options?.pollInterval])

  return {
    attendance,
    loading,
    error,
    fetchAttendance,
    checkIn,
    checkOut,
    createAttendance
  }
}
