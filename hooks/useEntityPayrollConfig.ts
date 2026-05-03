import { useCallback, useState } from "react"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"

export type EntityPayrollConfigInput = {
  effective_date: string
  city?: string | null
  province?: string | null
  umr_amount: number
  bpjs_tk_employee_rate: number
  bpjs_tk_company_rate: number
  bpjs_tk_salary_cap?: number | null
  bpjs_health_employee_rate: number
  bpjs_health_company_rate: number
  bpjs_health_salary_cap?: number | null
  pph21_method: "gross" | "gross_up" | "net" | "ter" | "flat"
  pph21_rate: number
  npwp_required: boolean
  notes?: string | null
  status: "active" | "inactive"
}

export function useEntityPayrollConfig(tenantId: string = getTenantId()) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getLatestConfig = useCallback(
    async (entityId: string, asOfDate?: string) => {
      if (!insForge) throw new Error("Database not connected")
      setLoading(true)
      setError(null)
      try {
        let q = insForge
          .from("entity_payroll_configs")
          .select("*")
          .eq("tenant_id", tenantId)
          .eq("entity_id", entityId)
          .eq("status", "active")
          .order("effective_date", { ascending: false })
          .limit(1)

        if (asOfDate) q = q.lte("effective_date", asOfDate)

        const { data, error: apiError } = await q
        if (apiError) throw apiError
        return data?.[0] ?? null
      } catch (err: any) {
        setError(err.message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [tenantId]
  )

  const upsertConfig = useCallback(
    async (entityId: string, payload: EntityPayrollConfigInput) => {
      if (!insForge) throw new Error("Database not connected")
      setLoading(true)
      setError(null)
      try {
        const { data, error: apiError } = await insForge
          .from("entity_payroll_configs")
          .upsert(
            {
              tenant_id: tenantId,
              entity_id: entityId,
              ...payload,
            },
            { onConflict: "tenant_id,entity_id,effective_date" }
          )
          .select()
          .single()
        if (apiError) throw apiError
        return data
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [tenantId]
  )

  return {
    loading,
    error,
    getLatestConfig,
    upsertConfig,
  }
}
