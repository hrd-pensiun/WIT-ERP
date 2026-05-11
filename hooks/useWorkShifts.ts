"use client"

import { useState, useCallback, useEffect } from "react"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"

export interface WorkShift {
  id: string
  tenant_id: string
  entity_id: string | null
  code: string
  name: string
  start_time: string        // "HH:MM:SS"
  end_time: string          // "HH:MM:SS"
  grace_period_minutes: number
  break_duration_minutes: number
  is_night_shift: boolean
  description: string | null
  status: "active" | "inactive"
}

export function useWorkShifts(tenantId: string = getTenantId()) {
  const db = () => insForge as any

  const [shifts, setShifts] = useState<WorkShift[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchShifts = useCallback(
    async (entityId?: string) => {
      if (!db()) { setError("Database not connected"); return }
      setLoading(true)
      setError(null)
      try {
        let q = db()
          .from("hr_work_shifts")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("name", { ascending: true })

        if (entityId) q = q.eq("entity_id", entityId)

        const { data, error: apiError } = await q
        if (apiError) throw apiError
        setShifts((data as WorkShift[]) || [])
      } catch (err: any) {
        setError(err.message ?? "Gagal memuat shift")
      } finally {
        setLoading(false)
      }
    },
    [tenantId]
  )

  const createShift = useCallback(
    async (payload: Omit<WorkShift, "id" | "tenant_id">) => {
      if (!db()) throw new Error("Database not connected")
      const { data, error: apiError } = await db()
        .from("hr_work_shifts")
        .insert({ ...payload, tenant_id: tenantId })
        .select()
        .single()
      if (apiError) throw apiError
      setShifts((prev) => [...prev, data as WorkShift])
      return data as WorkShift
    },
    [tenantId]
  )

  const updateShift = useCallback(
    async (id: string, payload: Partial<Omit<WorkShift, "id" | "tenant_id">>) => {
      if (!db()) throw new Error("Database not connected")
      const { data, error: apiError } = await db()
        .from("hr_work_shifts")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single()
      if (apiError) throw apiError
      setShifts((prev) => prev.map((s) => (s.id === id ? (data as WorkShift) : s)))
      return data as WorkShift
    },
    [tenantId]
  )

  const deleteShift = useCallback(
    async (id: string) => {
      if (!db()) throw new Error("Database not connected")
      const { error: apiError } = await db()
        .from("hr_work_shifts")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId)
      if (apiError) throw apiError
      setShifts((prev) => prev.filter((s) => s.id !== id))
    },
    [tenantId]
  )

  useEffect(() => { fetchShifts() }, [fetchShifts])

  return { shifts, loading, error, fetchShifts, createShift, updateShift, deleteShift }
}
