"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { fetchPerf360FormMatrixData } from "@/lib/performance-360-form-matrix"
import type { Perf360MinimalProfile, Perf360RaterSettingsMinimal } from "@/lib/performance-360-form-matrix"
import {
  computePerf360Assignments,
  perf360AssignmentFormLabel,
  perf360AssignmentRaterRoleLabel,
  type Perf360Assignment,
  type Perf360AssignmentKind,
} from "@/lib/perf360-assignments"
import { getTenantId } from "@/lib/tenant"
import { isMockMode } from "@/lib/insforge"
import {
  getPerformance360TemplateDetail,
  usePerformance360Templates,
  type Performance360TemplateQuestionRow,
  type Performance360TemplateRow,
} from "@/hooks/usePerformance360Templates"
import { useAuth } from "@/hooks/useAuth"
import {
  perf360DraftStatus,
  perf360DraftStorageKey,
  readPerf360Draft,
  type Perf360DraftBundle,
} from "@/lib/perf360-draft-storage"
import { fetchPerf360SubmissionsForTemplate } from "@/lib/perf360-submissions"

/** Profil tidak punya role app / jabatan terukur → tampilkan semua form periode (tanpa filter penilai). */
export function perf360UnrestrictedFormList(
  profile: Perf360MinimalProfile | null,
  authProfileRole: string | null | undefined
): boolean {
  const normalizedRole = (authProfileRole ?? profile?.app_role ?? "").trim().toLowerCase()
  const isPrivilegedPreviewRole = normalizedRole === "hr_admin" || normalizedRole === "superadmin"
  if (!isPrivilegedPreviewRole) return false

  if (!profile) return true
  const roleOk = !!(profile.app_role?.trim() || authProfileRole?.trim())
  const jobOk = profile.job_grade_level != null || !!profile.position_name?.trim()
  if (!roleOk && !jobOk) return true
  return false
}

export function resolveViewerProfileId(
  profiles: Perf360MinimalProfile[],
  authUserId: string | undefined,
  authEmail: string | undefined
): string | null {
  const em = authEmail?.trim().toLowerCase()
  if (authUserId) {
    const byUid = profiles.find((p) => p.user_id === authUserId)
    if (byUid) return byUid.id
  }
  if (em) {
    const byEmail = profiles.find((p) => (p.email ?? "").toLowerCase() === em)
    if (byEmail) return byEmail.id
  }
  return null
}

export type Perf360FormListRowModel = {
  assignmentKey: string
  formLabel: string
  raterDisplayName: string
  raterRoleLabel: string
  assessedName: string
  kind: Perf360AssignmentKind
  status: "completed" | "in_progress" | "pending" | "not_started"
  daysLeft: number | null
  overdue: boolean
  canOpen: boolean
  assignment: Perf360Assignment
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null
  const end = new Date(iso)
  const now = new Date()
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return Number.isFinite(diff) ? diff : null
}

export function usePerf360EmployeeForms(selectedTemplateId: string | undefined) {
  const tenantId = getTenantId()
  const { user, loading: authLoading } = useAuth()
  const { templates, loading: templatesLoading } = usePerformance360Templates(tenantId)

  const [profiles, setProfiles] = useState<Perf360MinimalProfile[]>([])
  const [settings, setSettings] = useState<Perf360RaterSettingsMinimal[]>([])
  const [matrixLoading, setMatrixLoading] = useState(true)
  const [matrixError, setMatrixError] = useState<string | null>(null)

  const [questionCache, setQuestionCache] = useState<
    Record<string, Performance360TemplateQuestionRow[]>
  >({})
  const [draftTick, setDraftTick] = useState(0)
  const [serverSubmittedKeys, setServerSubmittedKeys] = useState<Set<string>>(new Set())

  const bumpDrafts = useCallback(() => setDraftTick((t) => t + 1), [])

  const refetchSubmissions = useCallback(async () => {
    if (!selectedTemplateId || isMockMode()) return
    try {
      const subs = await fetchPerf360SubmissionsForTemplate(tenantId, selectedTemplateId)
      setServerSubmittedKeys(
        new Set(subs.filter((s) => s.status === "submitted").map((s) => s.assignment_key))
      )
    } catch {
      /* biarkan set sebelumnya */
    }
  }, [tenantId, selectedTemplateId])

  useEffect(() => {
    if (isMockMode()) {
      setProfiles([])
      setSettings([])
      setMatrixLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setMatrixLoading(true)
      setMatrixError(null)
      try {
        const pack = await fetchPerf360FormMatrixData(tenantId)
        if (cancelled) return
        if (!pack) {
          setProfiles([])
          setSettings([])
          setMatrixError("Basis data tidak terhubung.")
        } else {
          setProfiles(pack.profiles)
          setSettings(pack.settings)
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setProfiles([])
          setSettings([])
          setMatrixError(e instanceof Error ? e.message : "Gagal memuat roster 360.")
        }
      } finally {
        if (!cancelled) setMatrixLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [tenantId])

  useEffect(() => {
    if (!selectedTemplateId || isMockMode()) return
    if (questionCache[selectedTemplateId]) return
    let cancelled = false
    ;(async () => {
      const detail = await getPerformance360TemplateDetail(selectedTemplateId, tenantId)
      if (cancelled || !detail) return
      setQuestionCache((prev) => ({
        ...prev,
        [selectedTemplateId]: detail.performance_360_template_questions ?? [],
      }))
    })()
    return () => {
      cancelled = true
    }
  }, [selectedTemplateId, tenantId, questionCache])

  useEffect(() => {
    void refetchSubmissions()
  }, [refetchSubmissions])

  const viewerProfileId = useMemo(
    () => resolveViewerProfileId(profiles, user?.id, user?.email),
    [profiles, user?.id, user?.email]
  )

  const viewerProfile = useMemo(
    () => (viewerProfileId ? profiles.find((p) => p.id === viewerProfileId) ?? null : null),
    [profiles, viewerProfileId]
  )

  const showAllForms = perf360UnrestrictedFormList(viewerProfile, user?.profileRole)

  const template = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId),
    [templates, selectedTemplateId]
  )

  const assignments = useMemo(() => {
    if (!settings.length || !profiles.length) return []
    const all = computePerf360Assignments(profiles, settings, viewerProfileId, { showAllForms })
    return all
  }, [profiles, settings, viewerProfileId, showAllForms])

  const enrichedRows = useMemo((): Perf360FormListRowModel[] => {
    if (!selectedTemplateId || !template) return []
    const qs = questionCache[selectedTemplateId]
    const days = daysUntil(template.period_end ?? null)

    return assignments.map((a) => {
      const storageKey = perf360DraftStorageKey(tenantId, selectedTemplateId, a.key)
      const bundle: Perf360DraftBundle | null =
        typeof window !== "undefined" ? readPerf360Draft(storageKey) : null
      const qsEff = qs ?? []
      const st = perf360DraftStatus(bundle, qsEff)
      const dbDone = serverSubmittedKeys.has(a.key)
      let status: Perf360FormListRowModel["status"] = "pending"
      if (dbDone || st === "completed") status = "completed"
      else if (st === "in_progress") status = "in_progress"
      else status = days != null && days < 0 && a.canOpen ? "not_started" : "pending"

      const overdue = days != null && days < 0 && status !== "completed"

      return {
        assignmentKey: a.key,
        formLabel: perf360AssignmentFormLabel(a.kind),
        raterDisplayName: `${a.raterName} — ${perf360AssignmentRaterRoleLabel(a.kind)}`,
        raterRoleLabel: perf360AssignmentRaterRoleLabel(a.kind),
        assessedName: a.assessedName,
        kind: a.kind,
        status,
        daysLeft: status === "completed" ? null : days,
        overdue,
        canOpen: a.canOpen,
        assignment: a,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- draftTick memaksa re-read localStorage
  }, [assignments, selectedTemplateId, template, questionCache, tenantId, draftTick, serverSubmittedKeys])

  const loading = authLoading || templatesLoading || matrixLoading

  return {
    loading,
    error: matrixError,
    templates: templates as Performance360TemplateRow[],
    template,
    selectedTemplateId,
    viewerProfileId,
    viewerProfile,
    showAllForms,
    assignments,
    rows: enrichedRows,
    bumpDrafts,
    refetchSubmissions,
    questionsForTemplate: selectedTemplateId ? questionCache[selectedTemplateId] ?? null : null,
    refetchMatrix: () => {
      if (isMockMode()) return
      void (async () => {
        setMatrixLoading(true)
        try {
          const pack = await fetchPerf360FormMatrixData(tenantId)
          if (pack) {
            setProfiles(pack.profiles)
            setSettings(pack.settings)
          }
        } finally {
          setMatrixLoading(false)
        }
      })()
    },
  }
}
