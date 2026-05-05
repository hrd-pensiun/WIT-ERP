/**
 * Heuristik daftar penilai 360 (peer / bawahan) tanpa mengubah master HR.
 * Manager untuk 360 memakai override di performance_360_rater_settings.
 */

export function getJobGradeLevel(e: { hr_job_grades?: { level?: number | null } | null }): number | null {
  const l = e.hr_job_grades?.level
  return typeof l === "number" && Number.isFinite(l) ? l : null
}

export function suggestPeerRaters(
  ratee: Record<string, unknown>,
  pool: Record<string, unknown>[]
): Record<string, unknown>[] {
  const rl = getJobGradeLevel(ratee as { hr_job_grades?: { level?: number } })
  if (rl == null) return []
  const isUpperLevelPeerRule = rl >= 7 && rl <= 9

  return pool.filter((o) => {
    if (o.id === ratee.id) return false
    const ol = getJobGradeLevel(o as { hr_job_grades?: { level?: number } })
    if (ol == null) return false
    if (ol !== rl) return false
    if (isUpperLevelPeerRule) return true
    return o.department_id === ratee.department_id
  })
}

export type SubordinateSource = "reports_to" | "heuristic"

export function suggestSubordinateRaters(
  ratee: Record<string, unknown> & { reports_to_profile_id?: string | null },
  pool: Record<string, unknown>[]
): { list: Record<string, unknown>[]; source: SubordinateSource } {
  const direct = pool.filter(
    (o) => o.id !== ratee.id && o.reports_to_profile_id === ratee.id
  )
  if (direct.length > 0) {
    return { list: direct, source: "reports_to" }
  }

  const rl = getJobGradeLevel(ratee as { hr_job_grades?: { level?: number } })
  if (rl == null) {
    return { list: [], source: "heuristic" }
  }

  const heuristic = pool.filter((o) => {
    if (o.id === ratee.id) return false
    const ol = getJobGradeLevel(o as { hr_job_grades?: { level?: number } })
    if (ol == null) return false
    return ol < rl && o.department_id === ratee.department_id
  })

  return { list: heuristic, source: "heuristic" }
}

export function displayName(e: { full_name?: string | null; employee_number?: string | null }) {
  const n = e.full_name?.trim()
  if (n) return n
  return e.employee_number ?? "—"
}
