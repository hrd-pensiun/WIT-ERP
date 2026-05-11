"use client"

import { useState, useCallback, useEffect } from "react"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"

export interface PositionAllowanceEntry {
  id: string
  position_id: string
  salary_component_id: string
  is_eligible: boolean
}

export function usePositionAllowanceEligibility(tenantId: string = getTenantId()) {
  const [eligibility, setEligibility] = useState<PositionAllowanceEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEligibility = useCallback(async () => {
    if (!insForge) { setError("Database not connected"); return }
    setLoading(true)
    setError(null)
    try {
      const { data, error: apiError } = await (insForge as any)
        .from("position_allowance_eligibility")
        .select("id, position_id, salary_component_id, is_eligible")
        .eq("tenant_id", tenantId)
      if (apiError) throw apiError
      setEligibility((data as PositionAllowanceEntry[]) || [])
    } catch (err: any) {
      setError(err.message ?? "Gagal memuat data eligibility")
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  /** Toggle eligibility — upsert jika belum ada, update jika sudah ada */
  const toggleEligibility = useCallback(
    async (positionId: string, salaryComponentId: string, eligible: boolean) => {
      if (!insForge) throw new Error("Database not connected")

      const { data, error: apiError } = await (insForge as any)
        .from("position_allowance_eligibility")
        .upsert(
          {
            tenant_id: tenantId,
            position_id: positionId,
            salary_component_id: salaryComponentId,
            is_eligible: eligible,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "tenant_id,position_id,salary_component_id" }
        )
        .select()
        .single()
      if (apiError) throw apiError

      // Update local state
      setEligibility((prev) => {
        const key = (e: PositionAllowanceEntry) =>
          e.position_id === positionId && e.salary_component_id === salaryComponentId
        if (prev.some(key)) {
          return prev.map((e) => (key(e) ? { ...e, is_eligible: eligible } : e))
        }
        return [...prev, data as PositionAllowanceEntry]
      })
    },
    [tenantId]
  )

  /** Helper: cek apakah jabatan + komponen eligible */
  const isEligible = useCallback(
    (positionId: string, salaryComponentId: string): boolean => {
      const entry = eligibility.find(
        (e) => e.position_id === positionId && e.salary_component_id === salaryComponentId
      )
      // Jika belum ada row → default tidak eligible (harus di-opt-in)
      return entry?.is_eligible ?? false
    },
    [eligibility]
  )

  useEffect(() => { fetchEligibility() }, [fetchEligibility])

  return { eligibility, loading, error, fetchEligibility, toggleEligibility, isEligible }
}
