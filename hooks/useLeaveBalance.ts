"use client"

import { useState, useCallback } from "react"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"
import type { LeaveBalanceWithMeta } from "@/types/database-extended"

function computeMeta(row: any): LeaveBalanceWithMeta {
  const effective_quota = row.custom_quota ?? row.base_quota
  const remaining_days = effective_quota + row.carry_over_days - row.used_days
  return { ...row, effective_quota, remaining_days }
}

export function useLeaveBalance(tenantId: string = getTenantId()) {
  const [balances, setBalances] = useState<LeaveBalanceWithMeta[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBalances = useCallback(
    async (filters?: { user_profile_id?: string; year?: number; leave_type_id?: string }) => {
      if (!insForge) { setError("Database not connected"); return [] }
      setLoading(true)
      setError(null)
      try {
        let q = insForge
          .from("employee_leave_balances")
          .select("*, hr_leave_types:leave_type_id(code, name)")
          .eq("tenant_id", tenantId)
          .order("year", { ascending: false })

        if (filters?.user_profile_id) q = q.eq("user_profile_id", filters.user_profile_id)
        if (filters?.year) q = q.eq("year", filters.year)
        if (filters?.leave_type_id) q = q.eq("leave_type_id", filters.leave_type_id)

        const { data, error: apiErr } = await q
        if (apiErr) throw apiErr
        const result = (data || []).map(computeMeta)
        setBalances(result)
        return result
      } catch (err: any) {
        setError(err.message)
        return []
      } finally {
        setLoading(false)
      }
    },
    [tenantId]
  )

  const initBalancesForEmployee = useCallback(
    async (user_profile_id: string, year: number) => {
      if (!insForge) throw new Error("Database not connected")

      // Fetch all active leave types
      const { data: leaveTypes, error: ltErr } = await insForge
        .from("hr_leave_types")
        .select("id, days_per_year")
        .eq("tenant_id", tenantId)
        .eq("status", "active")

      if (ltErr) throw ltErr

      // Fetch existing balances for this employee+year to avoid overwrite
      const { data: existing } = await insForge
        .from("employee_leave_balances")
        .select("leave_type_id")
        .eq("tenant_id", tenantId)
        .eq("user_profile_id", user_profile_id)
        .eq("year", year)

      const existingTypeIds = new Set((existing || []).map((r: any) => r.leave_type_id))

      const toInsert = (leaveTypes || [])
        .filter((lt: any) => !existingTypeIds.has(lt.id))
        .map((lt: any) => ({
          tenant_id: tenantId,
          user_profile_id,
          leave_type_id: lt.id,
          year,
          base_quota: lt.days_per_year ?? 0,
          custom_quota: null,
          carry_over_days: 0,
          used_days: 0,
        }))

      if (toInsert.length === 0) return

      const { error: insErr } = await insForge
        .from("employee_leave_balances")
        .insert(toInsert)
      if (insErr) throw insErr
    },
    [tenantId]
  )

  const setCustomQuota = useCallback(
    async (id: string, custom_quota: number | null) => {
      if (!insForge) throw new Error("Database not connected")
      const { error } = await insForge
        .from("employee_leave_balances")
        .update({ custom_quota, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("tenant_id", tenantId)
      if (error) throw error
      setBalances((prev) =>
        prev.map((b) => (b.id === id ? computeMeta({ ...b, custom_quota }) : b))
      )
    },
    [tenantId]
  )

  const consumeBalance = useCallback(
    async (user_profile_id: string, leave_type_id: string, year: number, days: number) => {
      if (!insForge) throw new Error("Database not connected")

      const { data: current, error: readErr } = await insForge
        .from("employee_leave_balances")
        .select("id, used_days")
        .eq("tenant_id", tenantId)
        .eq("user_profile_id", user_profile_id)
        .eq("leave_type_id", leave_type_id)
        .eq("year", year)
        .single()

      if (readErr) throw readErr
      if (!current) return

      const { error: updErr } = await insForge
        .from("employee_leave_balances")
        .update({ used_days: current.used_days + days, updated_at: new Date().toISOString() })
        .eq("id", current.id)
      if (updErr) throw updErr

      setBalances((prev) =>
        prev.map((b) =>
          b.id === current.id
            ? computeMeta({ ...b, used_days: current.used_days + days })
            : b
        )
      )
    },
    [tenantId]
  )

  const reverseBalance = useCallback(
    async (user_profile_id: string, leave_type_id: string, year: number, days: number) => {
      if (!insForge) throw new Error("Database not connected")

      const { data: current, error: readErr } = await insForge
        .from("employee_leave_balances")
        .select("id, used_days")
        .eq("tenant_id", tenantId)
        .eq("user_profile_id", user_profile_id)
        .eq("leave_type_id", leave_type_id)
        .eq("year", year)
        .single()

      if (readErr) throw readErr
      if (!current) return

      const newUsed = Math.max(0, current.used_days - days)
      const { error: updErr } = await insForge
        .from("employee_leave_balances")
        .update({ used_days: newUsed, updated_at: new Date().toISOString() })
        .eq("id", current.id)
      if (updErr) throw updErr

      setBalances((prev) =>
        prev.map((b) =>
          b.id === current.id ? computeMeta({ ...b, used_days: newUsed }) : b
        )
      )
    },
    [tenantId]
  )

  const getRemaining = useCallback(
    (user_profile_id: string, leave_type_id: string, year: number): number | null => {
      const bal = balances.find(
        (b) =>
          b.user_profile_id === user_profile_id &&
          b.leave_type_id === leave_type_id &&
          b.year === year
      )
      return bal ? bal.remaining_days : null
    },
    [balances]
  )

  return {
    balances,
    loading,
    error,
    fetchBalances,
    initBalancesForEmployee,
    setCustomQuota,
    consumeBalance,
    reverseBalance,
    getRemaining,
  }
}
