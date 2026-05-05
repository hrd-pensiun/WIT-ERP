/**
 * Daftar assignment formulir 360 (siapa menilai siapa) dari roster + performance_360_rater_settings.
 * Selaras dengan heuristik `buildPerf360FormEstimates` / `lib/performance-360-form-matrix.ts`.
 */

import type { Perf360MinimalProfile, Perf360RaterSettingsMinimal } from "@/lib/performance-360-form-matrix"

export type Perf360AssignmentKind = "self" | "manager" | "peer" | "subordinate"

export type Perf360Assignment = {
  /** Stabil untuk storage & React key */
  key: string
  kind: Perf360AssignmentKind
  /** Yang dinilai */
  assessedId: string
  assessedName: string
  /** Yang mengisi form */
  raterId: string
  raterName: string
  /** Apakah pengguna yang sedang login memang penilai untuk baris ini */
  iAmRater: boolean
  /** Bisa membuka sheet isi form (fallback «semua form» menyalakan untuk semua baris) */
  canOpen: boolean
}

function displayName(p: Perf360MinimalProfile): string {
  const n = p.full_name?.trim()
  return n || "Tanpa nama"
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

function peerTargetsForRatee(
  D: Perf360MinimalProfile,
  effMgr: string | null,
  directIds: Set<string>,
  roster: Perf360MinimalProfile[],
  rosterIds: Set<string>
): string[] {
  const targets: string[] = []
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
    targets.push(pid)
  }
  return targets
}

/**
 * Bangun semua pasangan (penilai → yang dinilai) untuk setiap ratee yang punya `performance_360_rater_settings`.
 *
 * @param showAllForms — jika true, setiap baris dianggap bisa dibuka pengguna (mode fallback tanpa filter peran).
 */
export function computePerf360Assignments(
  profiles: Perf360MinimalProfile[],
  settings: Perf360RaterSettingsMinimal[],
  viewerProfileId: string | null,
  options: { showAllForms: boolean }
): Perf360Assignment[] {
  const showAllForms = options.showAllForms
  const profById = new Map(profiles.map((p) => [p.id, p]))
  const rsByRatee = new Map(settings.map((s) => [s.ratee_user_profile_id, s]))
  const directsMap = buildDirectsMap(profiles)
  const rosterIds = new Set(profiles.map((p) => p.id))

  const rows: Perf360Assignment[] = []
  const seen = new Set<string>()

  const push = (kind: Perf360AssignmentKind, assessedId: string, raterId: string, iAmRater: boolean) => {
    const key = `${kind}:${assessedId}:${raterId}`
    if (seen.has(key)) return
    seen.add(key)
    const assessed = profById.get(assessedId)
    const rater = profById.get(raterId)
    if (!assessed || !rater) return
    rows.push({
      key,
      kind,
      assessedId,
      assessedName: displayName(assessed),
      raterId,
      raterName: displayName(rater),
      iAmRater,
      canOpen: showAllForms || iAmRater,
    })
  }

  const configuredRatees = [...rsByRatee.keys()].filter((id) => profById.has(id))

  for (const rateeId of configuredRatees) {
    const D = profById.get(rateeId)!
    const rs = rsByRatee.get(rateeId)!
    const effMgr = effectiveManager(D, rs)
    const directIds = new Set(directsMap.get(D.id) ?? [])
    const peers = peerTargetsForRatee(D, effMgr, directIds, profiles, rosterIds)

    if (rs.allow_self && rosterIds.has(D.id)) {
      const iam = viewerProfileId === D.id
      push("self", D.id, D.id, iam)
    }
    if (rs.allow_manager && effMgr && rosterIds.has(effMgr) && effMgr !== D.id) {
      push("manager", D.id, effMgr, viewerProfileId === effMgr)
    }
    if (rs.allow_peer) {
      for (const pid of peers) {
        push("peer", D.id, pid, viewerProfileId === pid)
      }
    }
    if (rs.allow_subordinate) {
      for (const sid of directIds) {
        if (!rosterIds.has(sid)) continue
        push("subordinate", D.id, sid, viewerProfileId === sid)
      }
    }
  }

  return rows
}

/** Label form untuk kolom UI */
export function perf360AssignmentFormLabel(kind: Perf360AssignmentKind): string {
  switch (kind) {
    case "self":
      return "Self Assessment"
    case "manager":
      return "Penilaian atasan"
    case "peer":
      return "Penilaian rekan"
    case "subordinate":
      return "Penilaian bawahan → atasan"
    default:
      return "Form penilaian"
  }
}

/** Label peran kolom «penilai» */
export function perf360AssignmentRaterRoleLabel(kind: Perf360AssignmentKind): string {
  switch (kind) {
    case "self":
      return "Diri sendiri"
    case "manager":
      return "Atasan"
    case "peer":
      return "Rekan"
    case "subordinate":
      return "Bawahan"
    default:
      return "—"
  }
}
