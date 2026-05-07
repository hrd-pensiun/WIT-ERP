"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronRight, Loader2, RefreshCcw, Users } from "lucide-react"
import { Performance360Shell } from "@/components/performance/360/shell"
import {
  ORG_SCOPE_FILTER_ALL,
  useOrgScopeFilters,
} from "@/components/performance/360/org-scope-filters"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterBar, FilterBarActions } from "@/components/ui/filter-bar"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEmployees } from "@/hooks/useEmployees"
import { formatTemplatePeriodLabel, usePerformance360Templates } from "@/hooks/usePerformance360Templates"
import { insForge, isMockMode } from "@/lib/insforge"
import { computePerf360Assignments, type Perf360AssignmentKind } from "@/lib/perf360-assignments"
import { fetchPerf360FormMatrixData, type Perf360MinimalProfile } from "@/lib/performance-360-form-matrix"
import { fetchPerf360SubmissionsForTemplate, type Perf360SubmissionRow } from "@/lib/perf360-submissions"
import { getTenantId } from "@/lib/tenant"
import { cn } from "@/lib/utils"
import { loadPerf360RaterWeights } from "@/components/performance/360/assessment-weights-storage"

type EmployeeRow = {
  id: string
  full_name?: string | null
  status?: string
  department_id?: string | null
  division_id?: string | null
  hr_positions?: { name?: string | null } | null | { name?: string | null }[]
}

const DEMO_RATEES: { id: string; full_name: string }[] = [
  { id: "ffffffff-ffff-4fff-8fff-fffffffffff1", full_name: "Igor Tolic Kadiv" },
  { id: "ffffffff-ffff-4fff-8fff-fffffffffff2", full_name: "Royadi Nainggolan" },
  { id: "ffffffff-ffff-4fff-8fff-fffffffffff3", full_name: "Antonius Gunadharma" },
]

function displayName(p: { full_name?: string | null } | null | undefined): string {
  const n = p?.full_name?.trim()
  return n || "Tanpa nama"
}

function percent(n: number, d: number): number {
  if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0) return 0
  return Math.max(0, Math.min(100, (n / d) * 100))
}

function kindLabel(kind: Perf360AssignmentKind): string {
  switch (kind) {
    case "self":
      return "Self"
    case "manager":
      return "Superior"
    case "peer":
      return "Peer"
    case "subordinate":
      return "Subordinate"
    default:
      return "—"
  }
}

function scoreColor(pct: number): string {
  if (pct >= 100) return "bg-emerald-500"
  if (pct >= 75) return "bg-amber-500"
  return "bg-rose-500"
}

function templateSortTimestamp(t: {
  period_end: string | null
  period_start: string | null
  period_year: number | null
}): number {
  const end = t.period_end ? new Date(t.period_end).getTime() : NaN
  if (Number.isFinite(end)) return end
  const start = t.period_start ? new Date(t.period_start).getTime() : NaN
  if (Number.isFinite(start)) return start
  return Number(t.period_year ?? 0)
}

function shortTemplateOptionLabel(t: { name: string; period_kind: string; period_year: number | null; period_custom_label: string | null; period_start: string | null; period_end: string | null }): string {
  const compactName = t.name.trim().replace(/\s+/g, " ")
  if (!compactName) return formatTemplatePeriodLabel(t)
  return compactName.length > 36 ? `${compactName.slice(0, 36)}...` : compactName
}

export function Perf360HrDashboardOverview() {
  const searchParams = useSearchParams()
  const templateFromUrl = searchParams.get("template")

  const tenantId = getTenantId()
  const mock = isMockMode()
  const scope = useOrgScopeFilters()
  const { employees, loading: employeesLoading, fetchEmployees } = useEmployees(tenantId, {
    pollInterval: 60_000,
  })
  const { templates, loading: templatesLoading } = usePerformance360Templates(tenantId)

  const [rateeIds, setRateeIds] = useState<Set<string>>(new Set())
  const [rateeLoading, setRateeLoading] = useState(!mock)
  const [templateId, setTemplateId] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "in_progress" | "not_started" | "overdue">(
    "all"
  )
  const [levelFilter, setLevelFilter] = useState<"all" | string>("all")

  const [matrixLoading, setMatrixLoading] = useState(!mock)
  const [profiles, setProfiles] = useState<Perf360MinimalProfile[]>([])

  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [submissions, setSubmissions] = useState<Perf360SubmissionRow[]>([])
  const weights = loadPerf360RaterWeights()
  const [kindAggByAssessed, setKindAggByAssessed] = useState<
    Record<string, Partial<Record<Perf360AssignmentKind, { sum: number; wsum: number }>>>
  >({})

  const loadRatees = useCallback(async () => {
    if (!insForge) {
      setRateeLoading(false)
      return
    }
    setRateeLoading(true)
    try {
      const { data, error } = await (insForge as unknown as { from: (t: string) => any })
        .from("performance_360_rater_settings")
        .select("ratee_user_profile_id")
        .eq("tenant_id", tenantId)
      if (error) throw error
      const ids = new Set<string>(
        (data ?? []).map((r: { ratee_user_profile_id: string }) => r.ratee_user_profile_id)
      )
      setRateeIds(ids)
    } catch {
      setRateeIds(new Set())
    } finally {
      setRateeLoading(false)
    }
  }, [tenantId])

  const loadMatrix = useCallback(async () => {
    if (mock) {
      setMatrixLoading(false)
      setProfiles(
        DEMO_RATEES.map((d, idx) => ({
          id: d.id,
          user_id: null,
          email: null,
          app_role: null,
          full_name: d.full_name,
          department_id: null,
          department_name: idx === 0 ? "Technology" : idx === 1 ? "Operational" : "Technology",
          position_name: idx === 1 ? "CTO" : null,
          reports_to_profile_id: null,
          job_grade_level: idx === 0 ? 6 : idx === 1 ? 8 : 1,
        }))
      )
      return
    }
    setMatrixLoading(true)
    try {
      const data = await fetchPerf360FormMatrixData(tenantId)
      setProfiles(data?.profiles ?? [])
    } finally {
      setMatrixLoading(false)
    }
  }, [mock, tenantId])

  const loadTemplateStats = useCallback(
    async (nextTemplateId: string) => {
      if (mock || !nextTemplateId) {
        setSubmissions([])
        setKindAggByAssessed({})
        setSubmissionsLoading(false)
        return
      }
      setSubmissionsLoading(true)
      try {
        const subs = await fetchPerf360SubmissionsForTemplate(tenantId, nextTemplateId)
        setSubmissions(subs)

        const submittedSubs = subs.filter((s) => s.status === "submitted")
        const submittedIds = submittedSubs.map((s) => s.id)
        if (!insForge || submittedIds.length === 0) {
          setKindAggByAssessed({})
          return
        }

        const { data: qrows, error: qerr } = await insForge
          .from("performance_360_template_questions")
          .select("id,weight")
          .eq("template_id", nextTemplateId)
        if (qerr) throw qerr
        const weightByQuestion = new Map<string, number>(
          (qrows ?? []).map((r: { id: string; weight: number | null }) => [
            r.id,
            r.weight == null ? 1 : Number(r.weight),
          ])
        )

        const { data: answers, error: aerr } = await insForge
          .from("performance_360_submission_answers")
          .select("submission_id,question_id,rating")
          .in("submission_id", submittedIds)
        if (aerr) throw aerr

        // submission_id -> meta
        const metaBySubmission = new Map<string, { assessedId: string; kind: Perf360AssignmentKind }>(
          submittedSubs.map((s) => [s.id, { assessedId: s.assessed_user_profile_id, kind: s.assignment_kind }])
        )

        // assessedId -> kind -> sum(rating*weight), sum(weight)
        const agg = new Map<string, Map<Perf360AssignmentKind, { sum: number; wsum: number }>>()
        for (const row of (answers ?? []) as {
          submission_id: string
          question_id: string
          rating: number | null
        }[]) {
          if (row.rating == null) continue
          const m = metaBySubmission.get(row.submission_id)
          if (!m) continue
          const w = weightByQuestion.get(row.question_id) ?? 1
          const byKind = agg.get(m.assessedId) ?? new Map()
          const cur = byKind.get(m.kind) ?? { sum: 0, wsum: 0 }
          cur.sum += Number(row.rating) * w
          cur.wsum += w
          byKind.set(m.kind, cur)
          agg.set(m.assessedId, byKind)
        }

        const out: Record<string, Partial<Record<Perf360AssignmentKind, { sum: number; wsum: number }>>> = {}
        for (const [assessedId, byKind] of agg.entries()) {
          out[assessedId] = Object.fromEntries(byKind.entries()) as Partial<
            Record<Perf360AssignmentKind, { sum: number; wsum: number }>
          >
        }
        setKindAggByAssessed(out)
      } finally {
        setSubmissionsLoading(false)
      }
    },
    [mock, tenantId]
  )

  useEffect(() => {
    void fetchEmployees({ status: "active" })
  }, [fetchEmployees])

  useEffect(() => {
    void loadRatees()
  }, [loadRatees])

  useEffect(() => {
    void loadMatrix()
  }, [loadMatrix])

  useEffect(() => {
    if (templates.length === 0) {
      setTemplateId("")
      return
    }
    if (templateFromUrl && templates.some((t) => t.id === templateFromUrl)) {
      setTemplateId(templateFromUrl)
      return
    }
    setTemplateId((prev) => {
      if (prev && templates.some((t) => t.id === prev)) return prev
      const active = templates.find((t) => t.status === "active")
      return active?.id ?? templates[0].id
    })
  }, [templates, templateFromUrl])

  useEffect(() => {
    void loadTemplateStats(templateId)
  }, [loadTemplateStats, templateId])

  const employeeById = useMemo(() => {
    const m = new Map<string, EmployeeRow>()
    for (const e of employees as EmployeeRow[]) m.set(e.id, e)
    return m
  }, [employees])

  const filteredProfiles = useMemo(() => {
    const list = profiles.slice()
    return list.filter((p) => {
      if (scope.departmentId && p.department_id !== scope.departmentId) return false
      if (scope.divisionId) {
        const e = employeeById.get(p.id)
        if (!e || e.division_id !== scope.divisionId) return false
      }
      return true
    })
  }, [profiles, scope.departmentId, scope.divisionId, employeeById])

  const rosterForList = useMemo(() => {
    if (mock) {
      return filteredProfiles
    }
    if (rateeIds.size === 0) return filteredProfiles
    return filteredProfiles.filter((p) => rateeIds.has(p.id))
  }, [mock, rateeIds, filteredProfiles])

  const selectedTemplate = templates.find((t) => t.id === templateId)
  const templatesForSelect = useMemo(
    () => [...templates].sort((a, b) => templateSortTimestamp(b) - templateSortTimestamp(a)),
    [templates]
  )
  const qs = templateId ? `?template=${encodeURIComponent(templateId)}` : ""
  const filterSummary = `${scope.deptLabel} · ${scope.divLabel}`

  const templateIsOverdue =
    selectedTemplate?.period_end ? new Date(selectedTemplate.period_end).getTime() < Date.now() : false

  // Untuk dashboard admin: kita perlu rater settings minimal agar bisa menghitung total form (assignments).
  const [raterSettings, setRaterSettings] = useState<
    { ratee_user_profile_id: string; direct_manager_user_profile_id: string | null; allow_self: boolean; allow_manager: boolean; allow_peer: boolean; allow_subordinate: boolean }[]
  >([])

  const loadSettings = useCallback(async () => {
    if (mock || !insForge) return
    try {
      const { data, error } = await insForge
        .from("performance_360_rater_settings")
        .select(
          "ratee_user_profile_id,direct_manager_user_profile_id,allow_self,allow_manager,allow_peer,allow_subordinate"
        )
        .eq("tenant_id", tenantId)
      if (error) throw error
      setRaterSettings((data ?? []) as any)
    } catch {
      setRaterSettings([])
    }
  }, [mock, tenantId])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  const computedAssignments = useMemo(() => {
    if (mock) {
      // Demo: asumsikan 3 employee, masing-masing 4 form (self+manager+peer+subordinate) untuk ilustrasi.
      const out: { kind: Perf360AssignmentKind; assessedId: string; raterId: string; key: string }[] = []
      for (const p of rosterForList) {
        for (const kind of ["self", "manager", "peer", "subordinate"] as Perf360AssignmentKind[]) {
          out.push({ kind, assessedId: p.id, raterId: p.id, key: `${kind}:${p.id}:${p.id}` })
        }
      }
      return out
    }
    if (raterSettings.length === 0) return []
    return computePerf360Assignments(rosterForList, raterSettings as any, null, { showAllForms: true })
  }, [mock, rosterForList, raterSettings])

  const submissionByKey = useMemo(() => {
    const m = new Map<string, Perf360SubmissionRow>()
    for (const s of submissions) m.set(s.assignment_key, s)
    return m
  }, [submissions])

  const totals = useMemo(() => {
    const totalForms = computedAssignments.length
    const completed = computedAssignments.filter((a) => submissionByKey.get(a.key)?.status === "submitted").length
    const pending = totalForms - completed
    const overdue = templateIsOverdue
      ? computedAssignments.filter((a) => submissionByKey.get(a.key)?.status !== "submitted").length
      : 0
    return { totalForms, completed, pending, overdue }
  }, [computedAssignments, submissionByKey, templateIsOverdue])

  const hasExpectedSubordinateByAssessed = useMemo(() => {
    const m = new Map<string, boolean>()
    for (const a of computedAssignments) {
      if (a.kind !== "subordinate") continue
      m.set(a.assessedId, true)
    }
    return m
  }, [computedAssignments])

  const overallByAssessed = useMemo(() => {
    const out = new Map<string, number>()
    for (const [assessedId, byKind] of Object.entries(kindAggByAssessed)) {
      const score = (x?: { sum: number; wsum: number }) => (x && x.wsum > 0 ? x.sum / x.wsum : null)
      const sSelf = score(byKind.self)
      const sMgr = score(byKind.manager)
      const sPeer = score(byKind.peer)
      const sSub = score(byKind.subordinate)

      let wSelf = weights.self
      let wMgr = weights.manager
      let wPeer = weights.peer
      let wSub = weights.subordinate

      // Rule requested: if assessed has NO subordinate raters structurally, shift subordinate weight to peer.
      const expectedSub = hasExpectedSubordinateByAssessed.get(assessedId) === true
      if (!expectedSub) {
        wPeer += wSub
        wSub = 0
      }

      const parts: { w: number; v: number }[] = []
      if (sSelf != null) parts.push({ w: wSelf, v: sSelf })
      if (sMgr != null) parts.push({ w: wMgr, v: sMgr })
      if (sPeer != null) parts.push({ w: wPeer, v: sPeer })
      if (sSub != null) parts.push({ w: wSub, v: sSub })

      const wsum = parts.reduce((a, b) => a + b.w, 0)
      if (wsum <= 0) continue
      out.set(
        assessedId,
        parts.reduce((a, b) => a + (b.w / wsum) * b.v, 0)
      )
    }
    return out
  }, [kindAggByAssessed, weights.self, weights.manager, weights.peer, weights.subordinate, hasExpectedSubordinateByAssessed])

  const avgTotalScore = useMemo(() => {
    const vals = [...overallByAssessed.values()]
    if (vals.length === 0) return null
    return vals.reduce((a, b) => a + b, 0) / vals.length
  }, [overallByAssessed])

  const byDept = useMemo(() => {
    const m = new Map<string, { dept: string; total: number; completed: number; employees: Set<string> }>()
    const profById = new Map(rosterForList.map((p) => [p.id, p]))
    for (const a of computedAssignments) {
      const p = profById.get(a.assessedId)
      const dept = p?.department_name?.trim() || "—"
      const row = m.get(dept) ?? { dept, total: 0, completed: 0, employees: new Set<string>() }
      row.total += 1
      row.employees.add(a.assessedId)
      if (submissionByKey.get(a.key)?.status === "submitted") row.completed += 1
      m.set(dept, row)
    }
    return [...m.values()].sort((a, b) => b.total - a.total)
  }, [computedAssignments, rosterForList, submissionByKey])

  const byLevel = useMemo(() => {
    const m = new Map<string, { level: string; totalForms: number; completedForms: number; employees: Set<string> }>()
    const profById = new Map(rosterForList.map((p) => [p.id, p]))
    for (const a of computedAssignments) {
      const p = profById.get(a.assessedId)
      const lvl = p?.job_grade_level != null ? String(p.job_grade_level) : "—"
      const row = m.get(lvl) ?? { level: lvl, totalForms: 0, completedForms: 0, employees: new Set<string>() }
      row.totalForms += 1
      row.employees.add(a.assessedId)
      if (submissionByKey.get(a.key)?.status === "submitted") row.completedForms += 1
      m.set(lvl, row)
    }
    return [...m.values()].sort((a, b) => (b.level === "—" ? -1 : Number(b.level)) - (a.level === "—" ? -1 : Number(a.level)))
  }, [computedAssignments, rosterForList, submissionByKey])

  const byRaterType = useMemo(() => {
    const m = new Map<Perf360AssignmentKind, { kind: Perf360AssignmentKind; total: number; completed: number }>()
    for (const a of computedAssignments) {
      const row = m.get(a.kind) ?? { kind: a.kind, total: 0, completed: 0 }
      row.total += 1
      if (submissionByKey.get(a.key)?.status === "submitted") row.completed += 1
      m.set(a.kind, row)
    }
    const order: Perf360AssignmentKind[] = ["self", "manager", "peer", "subordinate"]
    return order.map((k) => m.get(k) ?? { kind: k, total: 0, completed: 0 })
  }, [computedAssignments, submissionByKey])

  const tableRows = useMemo(() => {
    const profById = new Map(rosterForList.map((p) => [p.id, p]))
    const byAssessed = new Map<
      string,
      { assessedId: string; name: string; dept: string; level: string; total: number; completed: number }
    >()
    for (const a of computedAssignments) {
      const p = profById.get(a.assessedId)
      const row =
        byAssessed.get(a.assessedId) ?? {
          assessedId: a.assessedId,
          name: displayName(p),
          dept: p?.department_name?.trim() || "—",
          level: p?.job_grade_level != null ? String(p.job_grade_level) : "—",
          total: 0,
          completed: 0,
        }
      row.total += 1
      if (submissionByKey.get(a.key)?.status === "submitted") row.completed += 1
      byAssessed.set(a.assessedId, row)
    }

    const list = [...byAssessed.values()]

    const filtered = list.filter((r) => {
      if (levelFilter !== "all" && r.level !== levelFilter) return false
      const p = percent(r.completed, r.total)
      if (statusFilter === "completed") return p >= 100
      if (statusFilter === "not_started") return r.completed === 0
      if (statusFilter === "overdue") return templateIsOverdue && p < 100
      if (statusFilter === "in_progress") return r.completed > 0 && p < 100
      return true
    })

    filtered.sort((a, b) => {
      const pa = percent(a.completed, a.total)
      const pb = percent(b.completed, b.total)
      if (pb !== pa) return pb - pa
      return a.name.localeCompare(b.name)
    })
    return filtered
  }, [computedAssignments, rosterForList, submissionByKey, statusFilter, levelFilter, templateIsOverdue])

  const levelOptions = useMemo(() => {
    const s = new Set<string>()
    for (const p of rosterForList) if (p.job_grade_level != null) s.add(String(p.job_grade_level))
    return [...s].sort((a, b) => Number(b) - Number(a))
  }, [rosterForList])

  return (
    <Performance360Shell
      title="Dashboard 360 HR"
      subtitle={`${filterSummary} — Monitoring & management assessment 360.`}
    >
      <FilterBar>
        <Select
          value={scope.departmentId || ORG_SCOPE_FILTER_ALL}
          onValueChange={(v) => scope.setDepartmentId(v === ORG_SCOPE_FILTER_ALL ? "" : v)}
          disabled={scope.loadingDepts}
        >
          <SelectTrigger className="h-8 text-sm w-auto min-w-[160px]">
            <SelectValue placeholder="Departemen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ORG_SCOPE_FILTER_ALL}>Semua departemen</SelectItem>
            {scope.departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={scope.divisionId || ORG_SCOPE_FILTER_ALL}
          onValueChange={(v) => scope.setDivisionId(v === ORG_SCOPE_FILTER_ALL ? "" : v)}
          disabled={scope.loadingDivs}
        >
          <SelectTrigger className="h-8 text-sm w-auto min-w-[160px]">
            <SelectValue placeholder="Divisi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ORG_SCOPE_FILTER_ALL}>Semua divisi</SelectItem>
            {scope.divisionsFiltered.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.departments?.name ? `${d.name} (${d.departments.name})` : d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={templateId || undefined}
          onValueChange={setTemplateId}
          disabled={templatesLoading || templates.length === 0}
        >
          <SelectTrigger className="h-8 text-sm w-auto min-w-[200px] [&>span]:truncate">
            <SelectValue
              placeholder={
                templatesLoading
                  ? "Memuat template…"
                  : templates.length === 0
                    ? "Belum ada template"
                    : "Template / periode"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {templatesForSelect.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {shortTemplateOptionLabel(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <FilterBarActions>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void fetchEmployees({ status: "active" })
              void loadRatees()
              void loadMatrix()
              void loadTemplateStats(templateId)
            }}
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </FilterBarActions>
      </FilterBar>

      {(employeesLoading || rateeLoading || matrixLoading || submissionsLoading) && !mock ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border /80 py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          Memuat dashboard…
        </div>
      ) : rosterForList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground" />
            <p className="max-w-md text-sm text-muted-foreground">
              {mock ? (
                <>Mode demo: data contoh dapat diklik sebagai ilustrasi.</>
              ) : rateeIds.size === 0 ? (
                <>
                  Belum ada baris di{" "}
                  <span className="font-mono text-muted-foreground">performance_360_rater_settings</span> — daftar berisi semua
                  karyawan aktif dalam filter. Atur roster di Struktur bila Anda ingin hanya nama terkonfigurasi.
                  {filteredProfiles.length === 0
                    ? " Tidak ada karyawan aktif pada filter ini."
                    : ""}
                </>
              ) : (
                <>Tidak ada karyawan yang cocok dengan pencarian / filter ini.</>
              )}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">AVG Total Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-foreground">
                  {avgTotalScore == null ? "—" : `${avgTotalScore.toFixed(1)} / 5.0`}
                </div>
                <div className="text-[11px] text-muted-foreground">dari {rosterForList.length} employee</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Forms Completed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-semibold text-foreground">
                  {totals.completed} / {totals.totalForms}
                </div>
                <Progress value={percent(totals.completed, totals.totalForms)} className="bg-muted" />
                <div className="text-[11px] text-muted-foreground">
                  {Math.round(percent(totals.completed, totals.totalForms))}% complete
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Pending Responses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-foreground">{totals.pending}</div>
                <div className="text-[11px] text-muted-foreground">
                  Forms in progress
                  {templateIsOverdue && totals.overdue > 0 ? (
                    <span className="ml-2 text-amber-400">{totals.overdue} OVERDUE</span>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Overdue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-foreground">{totals.overdue}</div>
                <div className="text-[11px] text-muted-foreground">Need follow-up</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-foreground">By department</CardTitle>
                <CardDescription className="text-muted-foreground">Progress completion per departemen.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {byDept.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Belum ada data.</div>
                ) : (
                  byDept.map((d) => {
                    const pct = percent(d.completed, d.total)
                    return (
                      <div key={d.dept} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="text-foreground">{d.dept}</div>
                          <div className="text-muted-foreground">
                            {d.completed} / {d.total} ({Math.round(pct)}%) · {d.employees.size} employee
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className={cn("h-2 rounded-full", scoreColor(pct))}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-foreground">By job level</CardTitle>
                <CardDescription className="text-muted-foreground">Progress completion per level.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {byLevel.length === 0 ? (
                  <div className="col-span-full text-sm text-muted-foreground">Belum ada data.</div>
                ) : (
                  byLevel.slice(0, 8).map((l) => {
                    const pct = percent(l.completedForms, l.totalForms)
                    return (
                      <div key={l.level} className="rounded-lg border border-border bg-background/40 p-3">
                        <div className="text-xs text-muted-foreground">Level {l.level}</div>
                        <div className="mt-1 text-lg font-semibold text-foreground">{l.employees.size}</div>
                        <div className="mt-2 h-2 w-full rounded-full bg-muted">
                          <div className={cn("h-2 rounded-full", scoreColor(pct))} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          {l.completedForms}/{l.totalForms} ({Math.round(pct)}%)
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-foreground">Response rate by rater type</CardTitle>
              <CardDescription className="text-muted-foreground">Completion rate tiap tipe rater.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {byRaterType.map((x) => {
                const pct = percent(x.completed, x.total)
                return (
                  <div key={x.kind} className="rounded-lg border border-border bg-background/40 p-3">
                    <div className="text-xs text-muted-foreground">{kindLabel(x.kind)}</div>
                    <div className="mt-1 text-lg font-semibold text-foreground">
                      {x.completed}/{x.total}
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-muted">
                      <div className={cn("h-2 rounded-full", scoreColor(pct))} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{Math.round(pct)}%</div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-foreground">Assessment management</CardTitle>
              <CardDescription className="text-muted-foreground">
                Filter dan manage progress per employee. Periode:{" "}
                {selectedTemplate ? `${formatTemplatePeriodLabel(selectedTemplate)} — ${selectedTemplate.name}` : "—"}
                {templateIsOverdue ? <span className="ml-2 text-rose-400">Overdue</span> : null}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="-mx-1 overflow-x-auto px-1 pb-1">
                <div className="grid min-w-[860px] grid-cols-2 gap-3">
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                    <SelectTrigger className="border-border bg-background text-foreground">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="completed">Completed (100%)</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="not_started">Not Started (0%)</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger className="border-border bg-background text-foreground">
                      <SelectValue placeholder="Job level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {levelOptions.map((lvl) => (
                        <SelectItem key={lvl} value={lvl}>
                          Level {lvl}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">Employee</TableHead>
                      <TableHead className="text-muted-foreground">Dept</TableHead>
                      <TableHead className="text-muted-foreground">Level</TableHead>
                      <TableHead className="text-muted-foreground">Forms</TableHead>
                      <TableHead className="text-muted-foreground">Completed</TableHead>
                      <TableHead className="text-right text-muted-foreground">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableRows.length === 0 ? (
                      <TableRow className="border-border">
                        <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                          Tidak ada data untuk filter ini.
                        </TableCell>
                      </TableRow>
                    ) : (
                      tableRows.map((r) => {
                          const pct = percent(r.completed, r.total)
                          const actionLabel = pct >= 100 ? "View" : templateIsOverdue ? "Remind" : "Follow-up"
                          return (
                            <TableRow key={r.assessedId} className="border-border">
                              <TableCell className="font-medium text-foreground">
                                <Link
                                  href={`/performance/360/dashboard/${r.assessedId}${qs}`}
                                  className="inline-flex items-center gap-2 hover:underline"
                                >
                                  {r.name}
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </Link>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{r.dept}</TableCell>
                              <TableCell className="text-muted-foreground">{r.level}</TableCell>
                              <TableCell className="text-muted-foreground">{r.total}</TableCell>
                              <TableCell className="text-foreground">
                                <div className="flex items-center gap-3">
                                  <div className="w-28">
                                    <Progress value={pct} className="bg-muted" />
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {r.completed}/{r.total} ({Math.round(pct)}%)
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Link href={`/performance/360/dashboard/${r.assessedId}${qs}`}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-border bg-background text-foreground hover:bg-card"
                                  >
                                    {actionLabel}
                                  </Button>
                                </Link>
                              </TableCell>
                            </TableRow>
                          )
                        })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Performance360Shell>
  )
}
