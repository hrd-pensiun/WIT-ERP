"use client"

import { useState, useCallback, useEffect } from "react"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"

export function useEmployeePayroll(employeeId: string, tenantId: string = getTenantId()) {
  const [allowances, setAllowances] = useState<any[]>([])
  const [payrollHistory, setPayrollHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!employeeId || !insForge) return
    setLoading(true)
    setError(null)
    try {
      const [{ data: ea }, { data: pd }] = await Promise.all([
        insForge
          .from("employee_allowances")
          .select("id, amount, salary_component_id, salary_components(name, type, is_fixed)")
          .eq("tenant_id", tenantId)
          .eq("user_profile_id", employeeId)
          .eq("status", "active"),
        insForge
          .from("payroll_details")
          .select(
            "id, basic_salary, gross_salary, net_salary, total_allowances, total_deductions, status, payroll_period_id, payroll_periods(name, year, month, status)"
          )
          .eq("tenant_id", tenantId)
          .eq("user_profile_id", employeeId)
          .order("created_at", { ascending: false })
          .limit(12),
      ])
      setAllowances(ea || [])
      setPayrollHistory(pd || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [employeeId, tenantId])

  useEffect(() => { fetchData() }, [fetchData])

  const latestPayroll = payrollHistory[0] ?? null
  return { allowances, payrollHistory, latestPayroll, loading, error, fetchData }
}
