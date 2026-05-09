"use client"

import { useState, useCallback, useEffect } from "react"
import { insForge } from "@/lib/insforge"

const db = () => insForge as any
import { getTenantId } from "@/lib/tenant"

export interface AllowanceMatrixEntry {
  id: string
  tenant_id: string
  job_grade_id: string
  salary_component_id: string
  amount: number
  hr_job_grades?: { name: string; code: string; level: number }
  salary_components?: { name: string; code: string; type: string }
}

export function useAllowanceMatrix(tenantId: string = getTenantId()) {
  const [matrix, setMatrix] = useState<AllowanceMatrixEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMatrix = useCallback(async () => {
    if (!db()) { setError("Database not connected"); return }
    setLoading(true)
    setError(null)
    try {
      // @ts-ignore — .from() is proxied at runtime via insforge.ts
      const { data, error: apiError } = await db()
        .from("allowance_matrix")
        .select("*, hr_job_grades(name, code, level), salary_components(name, code, type)")
        .eq("tenant_id", tenantId)
        .order("job_grade_id", { ascending: true })
      if (apiError) throw apiError
      setMatrix((data as AllowanceMatrixEntry[]) || [])
    } catch (err: any) {
      setError(err.message ?? "Gagal memuat matriks tunjangan")
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const upsertEntry = useCallback(
    async (jobGradeId: string, salaryComponentId: string, amount: number) => {
      if (!db()) throw new Error("Database not connected")
      // @ts-ignore
      const { data, error: apiError } = await db()
        .from("allowance_matrix")
        .upsert(
          {
            tenant_id: tenantId,
            job_grade_id: jobGradeId,
            salary_component_id: salaryComponentId,
            amount,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "tenant_id,job_grade_id,salary_component_id" }
        )
        .select()
        .single()
      if (apiError) throw apiError
      // Update local state optimistically
      setMatrix((prev) => {
        const key = (e: AllowanceMatrixEntry) =>
          e.job_grade_id === jobGradeId && e.salary_component_id === salaryComponentId
        const exists = prev.some(key)
        if (exists) {
          return prev.map((e) => (key(e) ? { ...e, amount } : e))
        }
        return [...prev, data as AllowanceMatrixEntry]
      })
      return data
    },
    [tenantId]
  )

  const deleteEntry = useCallback(
    async (id: string) => {
      if (!db()) throw new Error("Database not connected")
      // @ts-ignore
      const { error: apiError } = await db()
        .from("allowance_matrix")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId)
      if (apiError) throw apiError
      setMatrix((prev) => prev.filter((e) => e.id !== id))
    },
    [tenantId]
  )

  useEffect(() => {
    fetchMatrix()
  }, [fetchMatrix])

  return { matrix, loading, error, fetchMatrix, upsertEntry, deleteEntry }
}
