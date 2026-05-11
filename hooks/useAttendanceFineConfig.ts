"use client"

import { useState, useCallback } from "react"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"

export type LateMethod = "fixed" | "tiered" | "proportional"

export interface AttendanceFineConfig {
  id: string
  tenant_id: string
  entity_id: string | null
  late_method: LateMethod
  late_fixed_amount: number
  late_fine_per_hour: number       // legacy / unused when method != 'proportional' custom
  late_min_minutes: number
  late_max_amount: number | null
  no_checkin_amount: number
  no_checkout_amount: number
  is_active: boolean
  description: string | null
}

export interface FineTier {
  id?: string
  min_minutes: number
  max_minutes: number | null
  amount: number
}

export function useAttendanceFineConfig(tenantId: string = getTenantId()) {
  const [configs, setConfigs] = useState<AttendanceFineConfig[]>([])
  const [tiers, setTiers] = useState<FineTier[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchConfigs = useCallback(async () => {
    if (!insForge) { setError("Database not connected"); return }
    setLoading(true)
    setError(null)
    try {
      const { data, error: apiError } = await (insForge as any)
        .from("attendance_fine_config")
        .select("*")
        .eq("tenant_id", tenantId)
      if (apiError) throw apiError
      setConfigs((data as AttendanceFineConfig[]) || [])
    } catch (err: any) {
      setError(err.message ?? "Gagal memuat konfigurasi denda")
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const fetchTiersForConfig = useCallback(async (fineConfigId: string) => {
    if (!insForge) return
    const { data, error: apiError } = await (insForge as any)
      .from("attendance_fine_tiers")
      .select("id, min_minutes, max_minutes, amount")
      .eq("tenant_id", tenantId)
      .eq("fine_config_id", fineConfigId)
      .order("min_minutes", { ascending: true })
    if (apiError) throw apiError
    setTiers((data as FineTier[]) || [])
  }, [tenantId])

  const upsertConfig = useCallback(
    async (payload: Omit<AttendanceFineConfig, "id" | "tenant_id">) => {
      if (!insForge) throw new Error("Database not connected")
      const { data, error: apiError } = await (insForge as any)
        .from("attendance_fine_config")
        .upsert(
          { ...payload, tenant_id: tenantId, updated_at: new Date().toISOString() },
          { onConflict: "tenant_id,entity_id" }
        )
        .select()
        .single()
      if (apiError) throw apiError
      setConfigs((prev) => {
        const exists = prev.some((c) => c.entity_id === payload.entity_id)
        return exists
          ? prev.map((c) => (c.entity_id === payload.entity_id ? (data as AttendanceFineConfig) : c))
          : [...prev, data as AttendanceFineConfig]
      })
      return data as AttendanceFineConfig
    },
    [tenantId]
  )

  /** Replace all tiers for a config — deletes old, inserts new */
  const saveTiers = useCallback(
    async (fineConfigId: string, newTiers: Omit<FineTier, "id">[]) => {
      if (!insForge) throw new Error("Database not connected")
      // Delete existing tiers for this config
      await (insForge as any)
        .from("attendance_fine_tiers")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("fine_config_id", fineConfigId)
      if (newTiers.length === 0) { setTiers([]); return }
      // Insert new tiers
      const rows = newTiers.map((t) => ({
        tenant_id: tenantId,
        fine_config_id: fineConfigId,
        min_minutes: t.min_minutes,
        max_minutes: t.max_minutes,
        amount: t.amount,
      }))
      const { data, error: apiError } = await (insForge as any)
        .from("attendance_fine_tiers")
        .insert(rows)
        .select()
      if (apiError) throw apiError
      setTiers((data as FineTier[]) || [])
    },
    [tenantId]
  )

  const getConfigForEntity = useCallback(
    (entityId: string | null): AttendanceFineConfig | undefined =>
      configs.find((c) => c.entity_id === entityId),
    [configs]
  )

  return {
    configs, tiers, loading, error,
    fetchConfigs, fetchTiersForConfig, upsertConfig, saveTiers, getConfigForEntity,
  }
}
