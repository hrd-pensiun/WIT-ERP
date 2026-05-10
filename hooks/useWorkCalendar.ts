"use client"

import { useState, useCallback } from "react"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"

export interface WorkCalendarEntry {
  id: string
  tenant_id: string
  entity_id: string | null
  date: string            // "YYYY-MM-DD"
  is_holiday: boolean
  holiday_name: string | null
  holiday_type: "national" | "company" | "cuti_bersama" | null
  work_shift_id: string | null
  description: string | null
}

export function useWorkCalendar(tenantId: string = getTenantId()) {
  const db = () => insForge as any

  const [calendar, setCalendar] = useState<WorkCalendarEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** Fetch all entries for a given year+month (and optionally entity) */
  const fetchCalendar = useCallback(
    async (year: number, month: number, entityId?: string) => {
      if (!db()) { setError("Database not connected"); return }
      setLoading(true)
      setError(null)
      try {
        const start = `${year}-${String(month).padStart(2, "0")}-01`
        const lastDay = new Date(year, month, 0).getDate()
        const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`

        let q = db()
          .from("hr_work_calendars")
          .select("*")
          .eq("tenant_id", tenantId)
          .gte("date", start)
          .lte("date", end)

        if (entityId) q = q.eq("entity_id", entityId)

        const { data, error: apiError } = await q
        if (apiError) throw apiError
        setCalendar((data as WorkCalendarEntry[]) || [])
      } catch (err: any) {
        setError(err.message ?? "Gagal memuat kalender")
      } finally {
        setLoading(false)
      }
    },
    [tenantId]
  )

  /** Fetch holidays in a date range — used by payroll engine and leave utils */
  const fetchHolidaysInRange = useCallback(
    async (start: string, end: string, entityId?: string): Promise<WorkCalendarEntry[]> => {
      if (!db()) return []
      try {
        let q = db()
          .from("hr_work_calendars")
          .select("*")
          .eq("tenant_id", tenantId)
          .eq("is_holiday", true)
          .gte("date", start)
          .lte("date", end)

        if (entityId) {
          // Include entity-specific + global (null entity) holidays
          q = q.or(`entity_id.eq.${entityId},entity_id.is.null`)
        }

        const { data } = await q
        return (data as WorkCalendarEntry[]) || []
      } catch {
        return []
      }
    },
    [tenantId]
  )

  /** Upsert a calendar day entry */
  const upsertDay = useCallback(
    async (payload: {
      date: string
      entity_id?: string | null
      is_holiday: boolean
      holiday_name?: string | null
      holiday_type?: "national" | "company" | "cuti_bersama" | null
      work_shift_id?: string | null
      description?: string | null
    }) => {
      if (!db()) throw new Error("Database not connected")

      const { data, error: apiError } = await db()
        .from("hr_work_calendars")
        .upsert(
          {
            tenant_id: tenantId,
            entity_id: payload.entity_id ?? null,
            date: payload.date,
            is_holiday: payload.is_holiday,
            holiday_name: payload.holiday_name ?? null,
            holiday_type: payload.holiday_type ?? null,
            work_shift_id: payload.work_shift_id ?? null,
            description: payload.description ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "tenant_id,entity_id,date" }
        )
        .select()
        .single()

      if (apiError) throw apiError

      setCalendar((prev) => {
        const exists = prev.some(
          (e) => e.date === payload.date && e.entity_id === (payload.entity_id ?? null)
        )
        if (exists) {
          return prev.map((e) =>
            e.date === payload.date && e.entity_id === (payload.entity_id ?? null)
              ? (data as WorkCalendarEntry)
              : e
          )
        }
        return [...prev, data as WorkCalendarEntry]
      })
      return data as WorkCalendarEntry
    },
    [tenantId]
  )

  /** Delete a calendar entry by id */
  const deleteDay = useCallback(
    async (id: string) => {
      if (!db()) throw new Error("Database not connected")
      const { error: apiError } = await db()
        .from("hr_work_calendars")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId)
      if (apiError) throw apiError
      setCalendar((prev) => prev.filter((e) => e.id !== id))
    },
    [tenantId]
  )

  /** Quick boolean check against loaded calendar state */
  const isHoliday = useCallback(
    (date: string, entityId?: string): boolean => {
      return calendar.some(
        (e) =>
          e.date === date &&
          e.is_holiday &&
          (entityId ? e.entity_id === entityId || e.entity_id === null : true)
      )
    },
    [calendar]
  )

  return {
    calendar,
    loading,
    error,
    fetchCalendar,
    fetchHolidaysInRange,
    upsertDay,
    deleteDay,
    isHoliday,
  }
}
