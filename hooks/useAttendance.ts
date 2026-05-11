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
        .select(`
          id, date, status, check_in_status, check_out_status,
          check_in, check_out, work_hours,
          check_in_lat, check_in_lng, check_out_lat, check_out_lng,
          check_in_location, check_out_location,
          check_in_reason, check_out_reason,
          check_in_photo, check_out_photo,
          notes,
          user_profiles:user_profile_id(id, full_name, employee_number)
        `)
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

  const getTodayRecord = useCallback(async (userProfileId: string) => {
    if (!insForge) return null
    const today = new Date().toISOString().split('T')[0]
    const { data } = await (insForge as any)
      .from('attendance_records')
      .select('id, check_in, check_out, work_hours')
      .eq('tenant_id', tenantId)
      .eq('user_profile_id', userProfileId)
      .eq('date', today)
      .maybeSingle()
    return data || null
  }, [tenantId])

  const checkInFull = useCallback(async (
    userProfileId: string,
    payload: {
      lat?: number; lng?: number
      location?: string
      reason?: string
      photo_url?: string
      check_in_status?: string
    }
  ) => {
    if (!insForge) throw new Error('Database not connected')
    const now = new Date().toISOString()
    const { data, error } = await (insForge as any)
      .from('attendance_records')
      .insert({
        tenant_id: tenantId,
        user_profile_id: userProfileId,
        date: now.split('T')[0],
        check_in: now,
        status: 'present',
        check_in_status: payload.check_in_status ?? 'on_time',
        check_in_lat: payload.lat ?? null,
        check_in_lng: payload.lng ?? null,
        check_in_location: payload.location ?? null,
        check_in_reason: payload.reason ?? null,
        check_in_photo: payload.photo_url ?? null,
      })
      .select()
      .single()
    if (error) throw error
    return data
  }, [tenantId])

  const checkOutFull = useCallback(async (
    recordId: string,
    checkInTime: string,
    payload: {
      lat?: number; lng?: number
      location?: string
      reason?: string
      photo_url?: string
    }
  ) => {
    if (!insForge) throw new Error('Database not connected')
    const now = new Date().toISOString()
    const workHours = Math.round(
      ((new Date(now).getTime() - new Date(checkInTime).getTime()) / 3600000) * 100
    ) / 100
    const { data, error } = await (insForge as any)
      .from('attendance_records')
      .update({
        check_out: now,
        work_hours: workHours,
        check_out_status: 'on_time',
        check_out_lat: payload.lat ?? null,
        check_out_lng: payload.lng ?? null,
        check_out_location: payload.location ?? null,
        check_out_reason: payload.reason ?? null,
        check_out_photo: payload.photo_url ?? null,
      })
      .eq('id', recordId)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    if (error) throw error
    return data
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
    checkInFull,
    checkOutFull,
    getTodayRecord,
    createAttendance,
  }
}
