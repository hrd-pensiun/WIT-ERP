"use client"

import { useState, useCallback } from "react"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"
import { computeCutoffDates, CutoffDates } from "@/lib/payroll-cutoff-utils"

export interface PayrollCutoffConfig {
  id: string
  tenant_id: string
  entity_id: string | null
  paygroup_name: string | null
  att_cutoff_start_day: number
  att_cutoff_start_prev_month: boolean
  att_cutoff_end_day: number
  pay_cutoff_start_day: number
  pay_cutoff_start_prev_month: boolean
  pay_cutoff_end_day: number
  enable_prorata: boolean
  prorata_divisor: number
  is_default: boolean
  status: string
  notes: string | null
}

export interface PayrollPeriodOverride {
  id: string
  tenant_id: string
  entity_id: string | null
  period_year: number
  period_month: number
  paygroup_name: string | null
  attendance_start_date: string | null
  attendance_end_date: string | null
  payroll_start_date: string | null
  payroll_end_date: string | null
  reason: string | null
}

export function usePayrollCutoffConfig(tenantId: string = getTenantId()) {
  const db = () => insForge as any

  const [configs, setConfigs] = useState<PayrollCutoffConfig[]>([])
  const [overrides, setOverrides] = useState<PayrollPeriodOverride[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Config CRUD ─────────────────────────────────────────────────────────────

  const fetchConfigs = useCallback(async (entityId?: string) => {
    if (!insForge) { setError("Database not connected"); return }
    setLoading(true); setError(null)
    try {
      let q = db()
        .from("payroll_cutoff_configs")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("status", "active")
      if (entityId) q = q.eq("entity_id", entityId)
      const { data, error: apiError } = await q.order("created_at", { ascending: true })
      if (apiError) throw apiError
      setConfigs((data as PayrollCutoffConfig[]) || [])
    } catch (err: any) {
      setError(err.message ?? "Gagal memuat konfigurasi cut-off")
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const upsertConfig = useCallback(
    async (payload: Omit<PayrollCutoffConfig, "id" | "tenant_id">) => {
      if (!insForge) throw new Error("Database not connected")
      const { data, error: apiError } = await db()
        .from("payroll_cutoff_configs")
        .upsert(
          { ...payload, tenant_id: tenantId, updated_at: new Date().toISOString() },
          { onConflict: "tenant_id,entity_id,paygroup_name" }
        )
        .select()
        .single()
      if (apiError) throw apiError
      setConfigs((prev) => {
        const idx = prev.findIndex(
          (c) => c.entity_id === payload.entity_id && c.paygroup_name === payload.paygroup_name
        )
        if (idx >= 0) {
          const updated = [...prev]; updated[idx] = data as PayrollCutoffConfig; return updated
        }
        return [...prev, data as PayrollCutoffConfig]
      })
      return data as PayrollCutoffConfig
    },
    [tenantId]
  )

  const deleteConfig = useCallback(
    async (id: string) => {
      if (!insForge) throw new Error("Database not connected")
      const { error: apiError } = await db()
        .from("payroll_cutoff_configs")
        .update({ status: "inactive", updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("tenant_id", tenantId)
      if (apiError) throw apiError
      setConfigs((prev) => prev.filter((c) => c.id !== id))
    },
    [tenantId]
  )

  // ── Override CRUD ────────────────────────────────────────────────────────────

  const fetchOverrides = useCallback(
    async (entityId: string, year: number, month: number) => {
      if (!insForge) return
      const { data, error: apiError } = await db()
        .from("payroll_period_overrides")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("entity_id", entityId)
        .eq("period_year", year)
        .eq("period_month", month)
      if (apiError) throw apiError
      setOverrides((data as PayrollPeriodOverride[]) || [])
    },
    [tenantId]
  )

  const upsertOverride = useCallback(
    async (payload: Omit<PayrollPeriodOverride, "id" | "tenant_id">) => {
      if (!insForge) throw new Error("Database not connected")
      const { data, error: apiError } = await db()
        .from("payroll_period_overrides")
        .upsert(
          { ...payload, tenant_id: tenantId, updated_at: new Date().toISOString() },
          { onConflict: "tenant_id,entity_id,period_year,period_month,paygroup_name" }
        )
        .select()
        .single()
      if (apiError) throw apiError
      setOverrides((prev) => {
        const idx = prev.findIndex(
          (o) =>
            o.entity_id === payload.entity_id &&
            o.period_year === payload.period_year &&
            o.period_month === payload.period_month &&
            o.paygroup_name === payload.paygroup_name
        )
        if (idx >= 0) {
          const updated = [...prev]; updated[idx] = data as PayrollPeriodOverride; return updated
        }
        return [...prev, data as PayrollPeriodOverride]
      })
      return data as PayrollPeriodOverride
    },
    [tenantId]
  )

  const deleteOverride = useCallback(
    async (id: string) => {
      if (!insForge) throw new Error("Database not connected")
      const { error: apiError } = await db()
        .from("payroll_period_overrides")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId)
      if (apiError) throw apiError
      setOverrides((prev) => prev.filter((o) => o.id !== id))
    },
    [tenantId]
  )

  // ── Date resolution helper ───────────────────────────────────────────────────

  /**
   * Compute actual cut-off dates for a given entity + month.
   * Priority: override > config > calendar-month default.
   */
  const resolveDates = useCallback(
    (
      entityId: string,
      year: number,
      month: number,
      paygroupName?: string | null
    ): CutoffDates => {
      // 1. Check override
      const ovr = overrides.find(
        (o) =>
          o.entity_id === entityId &&
          o.period_year === year &&
          o.period_month === month &&
          (o.paygroup_name ?? null) === (paygroupName ?? null)
      )
      if (ovr?.attendance_start_date) {
        return {
          attStart: ovr.attendance_start_date!,
          attEnd:   ovr.attendance_end_date!,
          payStart: ovr.payroll_start_date!,
          payEnd:   ovr.payroll_end_date!,
        }
      }

      // 2. Check config (paygroup-specific first, then default)
      const cfg =
        configs.find((c) => c.entity_id === entityId && c.paygroup_name === (paygroupName ?? null)) ??
        configs.find((c) => c.entity_id === entityId && !c.paygroup_name)

      if (cfg) return computeCutoffDates(cfg, year, month)

      // 3. Fallback: calendar month
      const pad = (n: number) => String(n).padStart(2, "0")
      const lastDay = new Date(year, month, 0).getDate()
      return {
        attStart: `${year}-${pad(month)}-01`,
        attEnd:   `${year}-${pad(month)}-${lastDay}`,
        payStart: `${year}-${pad(month)}-01`,
        payEnd:   `${year}-${pad(month)}-${lastDay}`,
      }
    },
    [configs, overrides]
  )

  return {
    configs, overrides, loading, error,
    fetchConfigs, upsertConfig, deleteConfig,
    fetchOverrides, upsertOverride, deleteOverride,
    resolveDates,
  }
}
