import { useCallback, useEffect, useState } from "react"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"

export function usePayroll(tenantId: string = getTenantId(), options?: { pollInterval?: number }) {
  const [periods, setPeriods] = useState<any[]>([])
  const [details, setDetails] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPeriods = useCallback(async () => {
    if (!insForge) {
      setError("Database not connected")
      return []
    }

    setLoading(true)
    setError(null)
    try {
      const { data, error: apiError } = await insForge
        .from("payroll_periods")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("period_year", { ascending: false })
        .order("period_month", { ascending: false })
      if (apiError) throw apiError
      const rows = data || []
      setPeriods(rows)
      return rows
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const createPeriod = useCallback(
    async (data: any) => {
      if (!insForge) throw new Error("Database not connected")

      const { data: result, error: apiError } = await insForge
        .from("payroll_periods")
        .insert({
          ...data,
          tenant_id: data.tenant_id ?? tenantId,
        })
        .select()
        .single()
      if (apiError) throw apiError
      return result
    },
    [tenantId]
  )

  const deletePeriod = useCallback(
    async (id: string) => {
      if (!insForge) throw new Error("Database not connected")

      const { error: apiError } = await insForge
        .from("payroll_periods")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId)
      if (apiError) throw apiError
      return true
    },
    [tenantId]
  )

  const getPeriod = useCallback(
    async (id: string) => {
      if (!insForge) throw new Error("Database not connected")
      const { data, error: apiError } = await insForge
        .from("payroll_periods")
        .select("*")
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .single()
      if (apiError) throw apiError
      return data
    },
    [tenantId]
  )

  const fetchDetails = useCallback(
    async (periodId: string) => {
      if (!insForge) throw new Error("Database not connected")
      setLoading(true)
      setError(null)
      try {
        const { data, error: apiError } = await insForge
          .from("payroll_details")
          .select("*, user_profiles:user_profile_id(full_name, employee_number, ptkp_status, tax_position)")
          .eq("tenant_id", tenantId)
          .eq("payroll_period_id", periodId)
          .order("created_at", { ascending: false })
        if (apiError) throw apiError
        const rows = data || []
        setDetails(rows)
        return rows
      } catch (err: any) {
        setError(err.message)
        return []
      } finally {
        setLoading(false)
      }
    },
    [tenantId]
  )

  useEffect(() => {
    fetchPeriods()
    if (options?.pollInterval && options.pollInterval > 0) {
      const timer = setInterval(fetchPeriods, options.pollInterval)
      return () => clearInterval(timer)
    }
  }, [fetchPeriods, options?.pollInterval])

  const updateDetail = useCallback(
    async (detailId: string, patch: Record<string, any>) => {
      if (!insForge) throw new Error("Database not connected")
      const { error: apiError } = await insForge
        .from("payroll_details")
        .update(patch)
        .eq("id", detailId)
        .eq("tenant_id", tenantId)
      if (apiError) throw apiError
    },
    [tenantId]
  )

  const approvePeriod = useCallback(
    async (periodId: string) => {
      if (!insForge) throw new Error("Database not connected")
      const db = insForge as any
      // Approve all draft details in this period
      const { error: detErr } = await db
        .from("payroll_details")
        .update({ status: "approved" })
        .eq("tenant_id", tenantId)
        .eq("payroll_period_id", periodId)
        .eq("status", "draft")
      if (detErr) throw detErr
      // Update period status
      const { error: perErr } = await db
        .from("payroll_periods")
        .update({ status: "approved" })
        .eq("id", periodId)
        .eq("tenant_id", tenantId)
      if (perErr) throw perErr
    },
    [tenantId]
  )

  return {
    periods,
    details,
    loading,
    error,
    fetchPeriods,
    createPeriod,
    deletePeriod,
    getPeriod,
    fetchDetails,
    updateDetail,
    approvePeriod,
  }
}
