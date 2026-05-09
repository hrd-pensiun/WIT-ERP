"use client"

import { useState, useCallback, useEffect } from "react"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"

export function useLeaveTypes(tenantId: string = getTenantId()) {
  const [leaveTypes, setLeaveTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLeaveTypes = useCallback(async () => {
    if (!insForge) { setError("Database not connected"); return }
    setLoading(true)
    setError(null)
    try {
      const { data, error: apiError } = await insForge
        .from("hr_leave_types")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("name", { ascending: true })
      if (apiError) throw apiError
      setLeaveTypes(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const createLeaveType = useCallback(async (data: Record<string, any>) => {
    if (!insForge) throw new Error("Database not connected")
    const { data: result, error } = await insForge
      .from("hr_leave_types")
      .insert({ ...data, tenant_id: tenantId })
      .select()
      .single()
    if (error) throw error
    await fetchLeaveTypes()
    return result
  }, [tenantId, fetchLeaveTypes])

  const updateLeaveType = useCallback(async (id: string, data: Record<string, any>) => {
    if (!insForge) throw new Error("Database not connected")
    const { data: result, error } = await insForge
      .from("hr_leave_types")
      .update(data)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select()
      .single()
    if (error) throw error
    setLeaveTypes((prev) => prev.map((lt) => (lt.id === id ? { ...lt, ...data } : lt)))
    return result
  }, [tenantId])

  useEffect(() => { fetchLeaveTypes() }, [fetchLeaveTypes])

  return { leaveTypes, loading, error, fetchLeaveTypes, createLeaveType, updateLeaveType }
}
