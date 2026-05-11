"use client"

import { useState, useCallback, useEffect } from "react"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"

export type FineType = "late" | "no_checkin" | "no_checkout"

export interface PositionFineEntry {
  id: string
  tenant_id: string
  position_id: string
  fine_type: FineType
  is_subject: boolean
}

export function usePositionFineEligibility(tenantId: string = getTenantId()) {
  const [eligibility, setEligibility] = useState<PositionFineEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEligibility = useCallback(async () => {
    if (!insForge) { setError("Database not connected"); return }
    setLoading(true)
    setError(null)
    try {
      const { data, error: apiError } = await (insForge as any)
        .from("position_fine_eligibility")
        .select("id, tenant_id, position_id, fine_type, is_subject")
        .eq("tenant_id", tenantId)
      if (apiError) throw apiError
      setEligibility((data as PositionFineEntry[]) || [])
    } catch (err: any) {
      setError(err.message ?? "Gagal memuat data eligibility denda")
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  /** Batch save: upsert multiple entries at once */
  const batchUpsert = useCallback(
    async (entries: Array<{ position_id: string; fine_type: FineType; is_subject: boolean }>) => {
      if (!insForge) throw new Error("Database not connected")
      const rows = entries.map((e) => ({
        tenant_id: tenantId,
        position_id: e.position_id,
        fine_type: e.fine_type,
        is_subject: e.is_subject,
        updated_at: new Date().toISOString(),
      }))
      const { data, error: apiError } = await (insForge as any)
        .from("position_fine_eligibility")
        .upsert(rows, { onConflict: "tenant_id,position_id,fine_type" })
        .select()
      if (apiError) throw apiError
      // Merge into local state
      setEligibility((prev) => {
        const updated = [...prev]
        for (const row of (data as PositionFineEntry[]) || []) {
          const idx = updated.findIndex(
            (e) => e.position_id === row.position_id && e.fine_type === row.fine_type
          )
          if (idx >= 0) updated[idx] = row
          else updated.push(row)
        }
        return updated
      })
    },
    [tenantId]
  )

  /** Toggle satu cell — langsung upsert tanpa batch */
  const toggleOne = useCallback(
    async (positionId: string, fineType: FineType, isSubjectVal: boolean) => {
      if (!insForge) throw new Error("Database not connected")
      const { data, error: apiError } = await (insForge as any)
        .from("position_fine_eligibility")
        .upsert(
          {
            tenant_id: tenantId,
            position_id: positionId,
            fine_type: fineType,
            is_subject: isSubjectVal,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "tenant_id,position_id,fine_type" }
        )
        .select()
        .single()
      if (apiError) throw apiError
      setEligibility((prev) => {
        const idx = prev.findIndex(
          (e) => e.position_id === positionId && e.fine_type === fineType
        )
        if (idx >= 0) {
          const updated = [...prev]
          updated[idx] = data as PositionFineEntry
          return updated
        }
        return [...prev, data as PositionFineEntry]
      })
    },
    [tenantId]
  )

  /** Helper: cek apakah jabatan dikenai denda jenis tertentu (default: true = subject to fine) */
  const isSubject = useCallback(
    (positionId: string, fineType: FineType): boolean => {
      const entry = eligibility.find(
        (e) => e.position_id === positionId && e.fine_type === fineType
      )
      return entry?.is_subject ?? true // Default: semua jabatan kena denda
    },
    [eligibility]
  )

  useEffect(() => { fetchEligibility() }, [fetchEligibility])

  return { eligibility, loading, error, fetchEligibility, batchUpsert, toggleOne, isSubject }
}
