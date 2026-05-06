/**
 * Estimasi jumlah formulir 360 dari data HR + `performance_360_rater_settings`.
 * Bukan pengganti runtime siklus — hanya untuk pratinjau di halaman detail template.
 */

import { insForge } from "@/lib/insforge"

export type Perf360MinimalProfile = {
  id: string
  full_name: string | null
  department_id: string | null
  department_name?: string | null
  division_name?: string | null
  position_name?: string | null
  reports_to_profile_id: string | null | undefined
  /** Level jabatan efektif (profil `job_grade_id`, fallback ke grade jabatan). */
  job_grade_level: number | null
  /** Untuk menghubungkan auth login → profil karyawan. */
  user_id?: string | null
  email?: string | null
  app_role?: string | null
}

export type Perf360RaterSettingsMinimal = {
  ratee_user_profile_id: string
  direct_manager_user_profile_id: string | null
  allow_self: boolean
  allow_manager: boolean
  allow_peer: boolean
  allow_subordinate: boolean
}

export type Perf360FormEstimateRow = {
  profile_id: string
  full_name: string
  position_label: string
  job_grade_level: number | null
  inbound_total: number | null
  inbound_self: number | null
  inbound_manager: number | null
  inbound_peer: number | null
  inbound_subordinate: number | null
  outbound_total: number
  outbound_as_manager: number
  outbound_as_peer: number
  outbound_as_subordinate: number
  outbound_as_self: number
  configured_as_ratee: boolean
}

/** Minimal penilai (estimasi form masuk) per `docs/6-05-360.md` — CEO tier kecuali lainnya min 4. */
export function perf360MinRatersRequired(jobLevel: number | null): number | null {
  if (jobLevel == null || !Number.isFinite(jobLevel)) return null
  if (jobLevel >= 10) return 3
  return 4
}

function effectiveManager(
  p: Perf360MinimalProfile,
  rs: Perf360RaterSettingsMinimal | undefined
): string | null {
  if (rs) {
    return rs.direct_manager_user_profile_id ?? p.reports_to_profile_id ?? null
  }
  return p.reports_to_profile_id ?? null
}

/** ID bawahan langsung untuk setiap orang (berdasarkan `reports_to_profile_id`). */
function buildDirectsMap(profiles: Perf360MinimalProfile[]): Map<string, string[]> {
  const m = new Map<string, string[]>()
  for (const p of profiles) {
    const r = p.reports_to_profile_id
    if (r) {
      const arr = m.get(r)
      if (arr) arr.push(p.id)
      else m.set(r, [p.id])
    }
  }
  return m
}

/**
 * Jumlah perkiraan peer — selaras `lib/performance360-raters.ts` suggestPeerRaters:
 * level sama; untuk level 7–9 boleh lintas departemen; selain itu harus dept sama.
 */
function countPeersHeuristic(
  ratee: Perf360MinimalProfile,
  mgrId: string | null,
  directIds: Set<string>,
  rosterIds: Set<string>,
  roster: Perf360MinimalProfile[]
): number {
  const rl = ratee.job_grade_level
  if (rl == null) return 0
  const isUpperLevelPeerRule = rl >= 7 && rl <= 9

  let n = 0
  for (const o of roster) {
    if (o.id === ratee.id) continue
    if (!rosterIds.has(o.id)) continue
    const ol = o.job_grade_level
    if (ol == null || ol !== rl) continue
    if (!isUpperLevelPeerRule && ratee.department_id !== o.department_id) continue
    if (mgrId && o.id === mgrId) continue
    if (directIds.has(o.id)) continue
    n++
  }
  return n
}

function buildDeptRosterMaps(profiles: Perf360MinimalProfile[]) {
  const roster = new Set(profiles.map((p) => p.id))
  return { roster }
}

/**
 * outbound: hanya menghitung sasaran orang yang punya konfig mapping (`rs` terdefinisi).
 * inbound: hanya bernilai jika orang itu punya `rs`; jika tidak, null.
 */
export function buildPerf360FormEstimates(
  profiles: Perf360MinimalProfile[],
  settings: Perf360RaterSettingsMinimal[]
): Perf360FormEstimateRow[] {
  const roster = profiles.slice()
  const profById = new Map(roster.map((p) => [p.id, p]))
  const rsByRatee = new Map(settings.map((s) => [s.ratee_user_profile_id, s]))
  const directsMap = buildDirectsMap(roster)
  const { roster: rosterIds } = buildDeptRosterMaps(roster)

  type OutboundBucket = { manager: number; peer: number; subordinate: number; self: number }
  const emptyBucket = (): OutboundBucket => ({ manager: 0, peer: 0, subordinate: 0, self: 0 })

  const outboundDetail = new Map<string, OutboundBucket>()
  for (const p of roster) outboundDetail.set(p.id, emptyBucket())

  /** Daftar orang yang akan dinilai (punya pengaturan di mapping). */
  const configuredRatees = [...rsByRatee.keys()].filter((id) => profById.has(id))

  for (const rateeId of configuredRatees) {
    const D = profById.get(rateeId)
    const rs = rsByRatee.get(rateeId)!
    if (!D) continue
    const effMgr = effectiveManager(D, rs)
    const directIds = new Set(directsMap.get(D.id) ?? [])
    /** Penilai-pembentuk formulir outbound. */
    const selfAdds = rs.allow_self && rosterIds.has(D.id)
    const mgrAdds =
      rs.allow_manager && effMgr && rosterIds.has(effMgr) && effMgr !== D.id ? effMgr : null
    /** Peer: perkiraan; tiap peer × 1 form tentang D. */
    /** Subordinate: tiap langsung kirim satu form tentang D. */

    /** Akum outbound per penilai. */
    if (selfAdds) {
      const b = outboundDetail.get(D.id)!
      b.self += 1
    }
    if (mgrAdds) {
      const b = outboundDetail.get(mgrAdds)!
      b.manager += 1
    }
    if (rs.allow_peer) {
      const peerTargets: string[] = []
      const rl = D.job_grade_level
      const isUpperLevelPeerRule = rl != null && rl >= 7 && rl <= 9
      for (const op of roster) {
        const pid = op.id
        if (!rosterIds.has(pid)) continue
        if (pid === D.id) continue
        const ol = op.job_grade_level
        if (rl == null || ol == null || ol !== rl) continue
        if (!isUpperLevelPeerRule && D.department_id !== op.department_id) continue
        if (effMgr && pid === effMgr) continue
        if (directIds.has(pid)) continue
        peerTargets.push(pid)
      }
      for (const vid of peerTargets) {
        const b = outboundDetail.get(vid)
        if (b) b.peer += 1
      }
    }
    if (rs.allow_subordinate) {
      for (const sid of directIds) {
        const b = outboundDetail.get(sid)
        if (b) b.subordinate += 1
      }
    }
  }

  return roster.map((p) => {
    const positionLabel = p.position_name?.trim() ? p.position_name : "—"
    const rs = rsByRatee.get(p.id)
    let inbound_self: number | null = null
    let inbound_manager: number | null = null
    let inbound_peer: number | null = null
    let inbound_subordinate: number | null = null

    let inbound_total: number | null = null
    if (rs) {
      const effMgr = effectiveManager(p, rs)
      const directs = directsMap.get(p.id) ?? []
      const directsSet = new Set(directs)
      inbound_self = rs.allow_self ? 1 : 0
      inbound_manager = rs.allow_manager && effMgr ? 1 : 0
      inbound_peer = rs.allow_peer ? countPeersHeuristic(p, effMgr, directsSet, rosterIds, roster) : 0
      inbound_subordinate = rs.allow_subordinate ? directs.length : 0
      inbound_total =
        inbound_self +
        inbound_manager +
        inbound_peer +
        inbound_subordinate
    }

    const ob = outboundDetail.get(p.id)!
    const outbound_total = ob.self + ob.manager + ob.peer + ob.subordinate

    return {
      profile_id: p.id,
      full_name: p.full_name || "Tanpa nama",
      position_label: positionLabel,
      job_grade_level: p.job_grade_level,
      inbound_total,
      inbound_self,
      inbound_manager,
      inbound_peer,
      inbound_subordinate,
      outbound_total,
      outbound_as_manager: ob.manager,
      outbound_as_peer: ob.peer,
      outbound_as_subordinate: ob.subordinate,
      outbound_as_self: ob.self,
      configured_as_ratee: Boolean(rs),
    }
  })
}

/** Ambil roster + pengaturan penilai satu tenant untuk pratinjau matriks. */
export async function fetchPerf360FormMatrixData(tenantId: string): Promise<{
  profiles: Perf360MinimalProfile[]
  settings: Perf360RaterSettingsMinimal[]
} | null> {
  if (!insForge) return null

  const { data: profData, error: pErr } = await insForge
    .from("user_profiles")
    .select(
      "id, user_id, email, app_role, full_name, department_id, division_id, reports_to_profile_id, job_grade_id, position_id, departments:department_id(name), divisions:division_id(name), hr_positions:position_id(name, hr_job_grades:job_grade_id(level)), hr_job_grades:job_grade_id(level)"
    )
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("full_name", { ascending: true })

  if (pErr) throw pErr

  const { data: setData, error: sErr } = await insForge
    .from("performance_360_rater_settings")
    .select(
      "ratee_user_profile_id, direct_manager_user_profile_id, allow_self, allow_manager, allow_peer, allow_subordinate"
    )
    .eq("tenant_id", tenantId)

  if (sErr) throw sErr

  const profiles: Perf360MinimalProfile[] =
    (profData as Record<string, unknown>[] | null | undefined)?.map((row) => {
      const dept = row.departments
      const deptName = Array.isArray(dept) ? (dept[0] as { name?: string })?.name : (dept as { name?: string })?.name
      const div = row.divisions
      const divName = Array.isArray(div) ? (div[0] as { name?: string })?.name : (div as { name?: string })?.name
      const position = row.hr_positions
      const posRow = Array.isArray(position) ? position[0] : position
      const positionName = posRow && typeof posRow === "object" && "name" in posRow ? String((posRow as { name?: string }).name ?? "") : ""
      const directGrade =
        row.hr_job_grades && typeof row.hr_job_grades === "object"
          ? (row.hr_job_grades as { level?: number | null }).level
          : null
      const posGrade =
        posRow &&
        typeof posRow === "object" &&
        "hr_job_grades" in posRow &&
        posRow.hr_job_grades &&
        typeof posRow.hr_job_grades === "object"
          ? (posRow.hr_job_grades as { level?: number | null }).level
          : null
      const rawLevel =
        typeof directGrade === "number" && Number.isFinite(directGrade)
          ? directGrade
          : typeof posGrade === "number" && Number.isFinite(posGrade)
            ? posGrade
            : null

      return {
        id: String(row.id),
        user_id: (row.user_id as string | null) ?? null,
        email: typeof row.email === "string" ? row.email.trim().toLowerCase() : null,
        app_role: (row.app_role as string | null) ?? null,
        full_name: (row.full_name as string | null) ?? null,
        department_id: (row.department_id as string | null) ?? null,
        department_name: deptName ?? null,
        division_name: divName ?? null,
        position_name: positionName?.trim() ? positionName : null,
        reports_to_profile_id: (row.reports_to_profile_id as string | null) ?? null,
        job_grade_level: rawLevel,
      }
    }) ?? []

  const settings: Perf360RaterSettingsMinimal[] =
    (setData as Perf360RaterSettingsMinimal[] | null | undefined) ?? []

  return { profiles, settings }
}
