/**
 * Copy-on-create: duplikasi master data bert Scoped entity dari kantor sumber ke entity baru.
 * Memperhatikan UNIQUE (tenant_id, code) pada beberapa tabel — kode diselaraskan dengan suffix kode entity baru.
 */

import { insForge } from "@/lib/insforge"

function uniquifyCode(baseCode: string, newEntityCode: string): string {
  const raw = `${baseCode}_${newEntityCode}`
    .replace(/[^A-Za-z0-9_]/g, "")
    .toUpperCase()
  return raw.length <= 20 ? raw : raw.slice(0, 20)
}

function omitGenerated(row: Record<string, unknown>) {
  const { id, created_at, updated_at, deleted_at, ...rest } = row
  return rest
}

export type CopyMasterResult = {
  shifts: number
  salaryComponents: number
  calendars: number
  positions: number
  payrollConfigs: number
  errors: string[]
}

export async function copyEntityMasterFromSource(
  tenantId: string,
  sourceEntityId: string,
  targetEntityId: string,
  newEntityCode: string
): Promise<CopyMasterResult> {
  const result: CopyMasterResult = {
    shifts: 0,
    salaryComponents: 0,
    calendars: 0,
    positions: 0,
    payrollConfigs: 0,
    errors: [],
  }

  if (!insForge) {
    result.errors.push("Database tidak terhubung")
    return result
  }

  const codeSuffix = newEntityCode.replace(/[^A-Za-z0-9]/g, "").toUpperCase() || "NEW"

  /* ---------- hr_work_shifts ---------- */
  try {
    const { data: shifts, error } = await insForge
      .from("hr_work_shifts")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("entity_id", sourceEntityId)

    if (error) throw error
    for (const row of shifts || []) {
      const payload = {
        ...omitGenerated(row as Record<string, unknown>),
        tenant_id: tenantId,
        entity_id: targetEntityId,
        code: uniquifyCode(String((row as { code: string }).code), codeSuffix),
      }
      const { error: insErr } = await insForge.from("hr_work_shifts").insert(payload)
      if (insErr) result.errors.push(`Shift ${(row as { code: string }).code}: ${insErr.message}`)
      else result.shifts++
    }
  } catch (e) {
    result.errors.push(`Shift: ${e instanceof Error ? e.message : String(e)}`)
  }

  /* ---------- salary_components ---------- */
  try {
    const { data: comps, error } = await insForge
      .from("salary_components")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("entity_id", sourceEntityId)

    if (error) throw error
    for (const row of comps || []) {
      const payload = {
        ...omitGenerated(row as Record<string, unknown>),
        tenant_id: tenantId,
        entity_id: targetEntityId,
        code: uniquifyCode(String((row as { code: string }).code), codeSuffix),
      }
      const { error: insErr } = await insForge.from("salary_components").insert(payload)
      if (insErr)
        result.errors.push(`Komponen ${(row as { code: string }).code}: ${insErr.message}`)
      else result.salaryComponents++
    }
  } catch (e) {
    result.errors.push(`Salary components: ${e instanceof Error ? e.message : String(e)}`)
  }

  /* ---------- hr_work_calendars ---------- */
  try {
    const { data: cals, error } = await insForge
      .from("hr_work_calendars")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("entity_id", sourceEntityId)

    if (error) throw error
    for (const row of cals || []) {
      const rest = omitGenerated(row as Record<string, unknown>) as Record<
        string,
        unknown
      >
      /* Shift baru punya UUID lain — jangan pakai FK shift sumber */
      rest.work_shift_id = null
      const { error: insErr } = await insForge.from("hr_work_calendars").insert({
        ...rest,
        tenant_id: tenantId,
        entity_id: targetEntityId,
      })
      if (insErr) result.errors.push(`Kalender ${(row as { date: string }).date}: ${insErr.message}`)
      else result.calendars++
    }
  } catch (e) {
    result.errors.push(`Kalender: ${e instanceof Error ? e.message : String(e)}`)
  }

  /* ---------- hr_positions (job title) ---------- */
  try {
    const { data: pos, error } = await insForge
      .from("hr_positions")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("entity_id", sourceEntityId)

    if (error) throw error
    for (const row of pos || []) {
      const payload = {
        ...omitGenerated(row as Record<string, unknown>),
        tenant_id: tenantId,
        entity_id: targetEntityId,
        code: uniquifyCode(String((row as { code: string }).code), codeSuffix),
      }
      const { error: insErr } = await insForge.from("hr_positions").insert(payload)
      if (insErr)
        result.errors.push(`Jabatan ${(row as { code: string }).code}: ${insErr.message}`)
      else result.positions++
    }
  } catch (e) {
    result.errors.push(`Posisi: ${e instanceof Error ? e.message : String(e)}`)
  }

  /* ---------- entity_payroll_configs ---------- */
  try {
    const { data: cfgs, error } = await insForge
      .from("entity_payroll_configs")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("entity_id", sourceEntityId)
      .eq("status", "active")
      .order("effective_date", { ascending: false })
      .limit(1)
    if (error) throw error
    for (const row of cfgs || []) {
      const payload = {
        ...omitGenerated(row as Record<string, unknown>),
        tenant_id: tenantId,
        entity_id: targetEntityId,
      }
      const { error: insErr } = await insForge
        .from("entity_payroll_configs")
        .insert(payload)
      if (insErr) {
        result.errors.push(
          `Konfigurasi payroll ${(row as { effective_date: string }).effective_date}: ${insErr.message}`
        )
      } else {
        result.payrollConfigs++
      }
    }
  } catch (e) {
    result.errors.push(
      `Konfigurasi payroll: ${e instanceof Error ? e.message : String(e)}`
    )
  }

  return result
}
