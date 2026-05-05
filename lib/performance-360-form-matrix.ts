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
  reports_to_profile_id: string | null | undefined
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
  department_label: string
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

function countPeersApprox(
  ratee: Perf360MinimalProfile,
  mgrId: string | null,
  directIds: Set<string>,
  idsInSameDept: Set<string>,
  rosterIds: Set<string>
): number {
  if (!ratee.department_id) return 0
  let n = 0
  for (const pid of idsInSameDept) {
    if (!rosterIds.has(pid)) continue
    if (pid === ratee.id) continue
    if (mgrId && pid === mgrId) continue
    if (directIds.has(pid)) continue
    n++
  }
  return n
}

/** Baris dept → set profile id (hanya pembanding primitif untuk peer). */
function buildDeptRosterMaps(profiles: Perf360MinimalProfile[]) {
  const deptToMembers = new Map<string, Set<string>>()
  const roster = new Set(profiles.map((p) => p.id))
  for (const p of profiles) {
    if (!p.department_id) continue
    let s = deptToMembers.get(p.department_id)
    if (!s) {
      s = new Set()
      deptToMembers.set(p.department_id, s)
    }
    s.add(p.id)
  }
  return { deptToMembers, roster }
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
  const { deptToMembers, roster: rosterIds } = buildDeptRosterMaps(roster)

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
    const sameDeptMembers = deptToMembers.get(D.department_id ?? "") ?? new Set<string>()
    const peersApprox = rs.allow_peer
      ? countPeersApprox(D, effMgr, directIds, sameDeptMembers, rosterIds)
      : 0
    const subCount = rs.allow_subordinate ? directIds.size : 0

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
      /** Hitung konkret mana peer IDs */
      const peerTargets: string[] = []
      if (D.department_id) {
        for (const pid of sameDeptMembers) {
          if (!rosterIds.has(pid)) continue
          if (pid === D.id) continue
          if (effMgr && pid === effMgr) continue
          if (directIds.has(pid)) continue
          peerTargets.push(pid)
        }
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
    const deptLabel = p.department_name?.trim()
      ? p.department_name
      : p.department_id
        ? `#${String(p.department_id).slice(0, 8)}…`
        : "—"
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
      const sameDept = deptToMembers.get(p.department_id ?? "") ?? new Set()
      inbound_peer = rs.allow_peer ? countPeersApprox(p, effMgr, directsSet, sameDept, rosterIds) : 0
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
      department_label: deptLabel,
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
    .select("id, full_name, department_id, reports_to_profile_id, departments:department_id(name)")
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

  const profiles: Perf360MinimalProfile[] = (profData as any[] | null | undefined)?.map((row) => {
    const dept = row.departments
    const deptName = Array.isArray(dept) ? dept[0]?.name : dept?.name
    return {
      id: row.id,
      full_name: row.full_name,
      department_id: row.department_id,
      department_name: deptName ?? null,
      reports_to_profile_id: row.reports_to_profile_id,
    }
  }) ?? []

  const settings: Perf360RaterSettingsMinimal[] =
    (setData as Perf360RaterSettingsMinimal[] | null | undefined) ?? []

  return { profiles, settings }
}
