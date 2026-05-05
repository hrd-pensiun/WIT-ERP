import { useCallback, useState } from "react"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"

export type Performance360RaterSettingsRow = {
  id: string
  tenant_id: string
  ratee_user_profile_id: string
  direct_manager_user_profile_id: string | null
  allow_self: boolean
  allow_manager: boolean
  allow_peer: boolean
  allow_subordinate: boolean
  created_at?: string
  updated_at?: string
}

export type Performance360RaterSettingsInput = {
  ratee_user_profile_id: string
  direct_manager_user_profile_id: string | null
  allow_self: boolean
  allow_manager: boolean
  allow_peer: boolean
  allow_subordinate: boolean
}

export function usePerformance360RaterSettings(tenantId: string = getTenantId()) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getByRatee = useCallback(
    async (rateeId: string): Promise<Performance360RaterSettingsRow | null> => {
      if (!insForge) {
        setError("Database not connected")
        return null
      }
      setLoading(true)
      setError(null)
      try {
        const { data, error: apiError } = await insForge
          .from("performance_360_rater_settings")
          .select("*")
          .eq("tenant_id", tenantId)
          .eq("ratee_user_profile_id", rateeId)
          .maybeSingle()
        if (apiError) throw apiError
        return (data as Performance360RaterSettingsRow) ?? null
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gagal memuat pengaturan 360"
        setError(msg)
        return null
      } finally {
        setLoading(false)
      }
    },
    [tenantId]
  )

  const upsert = useCallback(
    async (input: Performance360RaterSettingsInput): Promise<Performance360RaterSettingsRow | null> => {
      if (!insForge) {
        setError("Database not connected")
        throw new Error("Database not connected")
      }
      setLoading(true)
      setError(null)
      try {
        const now = new Date().toISOString()
        const { data, error: apiError } = await insForge
          .from("performance_360_rater_settings")
          .upsert(
            {
              tenant_id: tenantId,
              ratee_user_profile_id: input.ratee_user_profile_id,
              direct_manager_user_profile_id: input.direct_manager_user_profile_id,
              allow_self: input.allow_self,
              allow_manager: input.allow_manager,
              allow_peer: input.allow_peer,
              allow_subordinate: input.allow_subordinate,
              updated_at: now,
            },
            { onConflict: "tenant_id,ratee_user_profile_id" }
          )
          .select()
          .single()
        if (apiError) throw apiError
        return data as Performance360RaterSettingsRow
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gagal menyimpan pengaturan 360"
        setError(msg)
        throw err instanceof Error ? err : new Error(msg)
      } finally {
        setLoading(false)
      }
    },
    [tenantId]
  )

  return { loading, error, getByRatee, upsert, clearError: () => setError(null) }
}
