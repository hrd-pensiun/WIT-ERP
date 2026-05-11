"use client"

import { useState, useCallback, useEffect } from "react"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"

export const SALARY_REASONS = [
  { value: "increment", label: "Kenaikan Berkala" },
  { value: "promotion", label: "Promosi" },
  { value: "market_adjustment", label: "Penyesuaian Pasar" },
  { value: "correction", label: "Koreksi" },
  { value: "other", label: "Lainnya" },
]

export function useEmployeeCompensation(employeeId: string, tenantId: string = getTenantId()) {
  const [salaryHistory, setSalaryHistory] = useState<any[]>([])
  const [allowances, setAllowances] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSalaryHistory = useCallback(async () => {
    if (!employeeId || !insForge) return
    const { data } = await insForge
      .from("employee_salaries")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("user_profile_id", employeeId)
      .order("effective_date", { ascending: false })
    setSalaryHistory(data || [])
  }, [employeeId, tenantId])

  const fetchAllowances = useCallback(async () => {
    if (!employeeId || !insForge) return
    const { data } = await insForge
      .from("employee_allowances")
      .select("id, amount, effective_date, notes, salary_component_id, salary_components(name, type, is_fixed)")
      .eq("tenant_id", tenantId)
      .eq("user_profile_id", employeeId)
      .eq("status", "active")
      .order("created_at", { ascending: true })
    setAllowances(data || [])
  }, [employeeId, tenantId])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchSalaryHistory(), fetchAllowances()])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [fetchSalaryHistory, fetchAllowances])

  useEffect(() => { fetchAll() }, [fetchAll])

  const addSalaryEntry = useCallback(async (data: {
    effective_date: string
    amount: number
    reason?: string
    reason_other?: string
    notes?: string
  }) => {
    if (!insForge) throw new Error("Database not connected")
    const { error } = await insForge.from("employee_salaries").insert({
      tenant_id: tenantId,
      user_profile_id: employeeId,
      ...data,
    })
    if (error) throw error
    await fetchSalaryHistory()
  }, [employeeId, tenantId, fetchSalaryHistory])

  const addAllowance = useCallback(async (data: {
    salary_component_id: string
    amount: number
    effective_date: string
    reason?: string
    reason_other?: string
    notes?: string
  }) => {
    if (!insForge) throw new Error("Database not connected")
    const { data: inserted, error: insErr } = await insForge
      .from("employee_allowances")
      .insert({
        tenant_id: tenantId,
        user_profile_id: employeeId,
        salary_component_id: data.salary_component_id,
        amount: data.amount,
        effective_date: data.effective_date,
        notes: data.notes,
        status: "active",
      })
      .select()
      .single()
    if (insErr) throw insErr

    await insForge.from("employee_allowance_histories").insert({
      tenant_id: tenantId,
      employee_allowance_id: inserted.id,
      user_profile_id: employeeId,
      salary_component_id: data.salary_component_id,
      change_type: "create",
      new_amount: data.amount,
      effective_date: data.effective_date,
      reason: data.reason,
      reason_other: data.reason_other,
    })

    await fetchAllowances()
  }, [employeeId, tenantId, fetchAllowances])

  const updateAllowance = useCallback(async (
    id: string,
    data: { amount: number; effective_date?: string; reason?: string; reason_other?: string; notes?: string }
  ) => {
    if (!insForge) throw new Error("Database not connected")
    const existing = allowances.find((a) => a.id === id)
    const oldAmount = existing?.amount ?? null

    const { error: updErr } = await insForge
      .from("employee_allowances")
      .update({ amount: data.amount, notes: data.notes, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("tenant_id", tenantId)
    if (updErr) throw updErr

    await insForge.from("employee_allowance_histories").insert({
      tenant_id: tenantId,
      employee_allowance_id: id,
      user_profile_id: employeeId,
      salary_component_id: existing?.salary_component_id,
      change_type: "update",
      old_amount: oldAmount,
      new_amount: data.amount,
      effective_date: data.effective_date || new Date().toISOString().slice(0, 10),
      reason: data.reason,
      reason_other: data.reason_other,
    })

    await fetchAllowances()
  }, [employeeId, tenantId, allowances, fetchAllowances])

  const deleteAllowance = useCallback(async (
    id: string,
    meta?: { reason?: string; reason_other?: string }
  ) => {
    if (!insForge) throw new Error("Database not connected")
    const existing = allowances.find((a) => a.id === id)

    const { error: delErr } = await insForge
      .from("employee_allowances")
      .update({ status: "inactive", deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("tenant_id", tenantId)
    if (delErr) throw delErr

    await insForge.from("employee_allowance_histories").insert({
      tenant_id: tenantId,
      employee_allowance_id: id,
      user_profile_id: employeeId,
      salary_component_id: existing?.salary_component_id,
      change_type: "delete",
      old_amount: existing?.amount,
      effective_date: new Date().toISOString().slice(0, 10),
      reason: meta?.reason,
      reason_other: meta?.reason_other,
    })

    await fetchAllowances()
  }, [employeeId, tenantId, allowances, fetchAllowances])

  const fetchAllowanceHistory = useCallback(async (allowanceId: string) => {
    if (!insForge) return []
    const { data } = await insForge
      .from("employee_allowance_histories")
      .select("*")
      .eq("employee_allowance_id", allowanceId)
      .order("created_at", { ascending: false })
    return data || []
  }, [])

  const currentSalary = salaryHistory[0] ?? null

  return {
    salaryHistory,
    allowances,
    currentSalary,
    loading,
    error,
    fetchAll,
    addSalaryEntry,
    addAllowance,
    updateAllowance,
    deleteAllowance,
    fetchAllowanceHistory,
  }
}
