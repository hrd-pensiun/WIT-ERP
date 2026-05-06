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
import { Input } from "@/components/ui/input"
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
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "in_progress" | "not_started" | "overdue">(
    "all"
  )
  const [levelFilter, setLevelFilter] = useState<"all" | string>("all")

  const [matrixLoading, setMatrixLoading] = useState(!mock)
  const [profiles, setProfiles] = useState<Perf360MinimalProfile[]>([])

  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [submissions, setSubmissions] = useState<Perf360SubmissionRow[]>([])
  const [avgTotalScore, setAvgTotalScore] = useState<number | null>(null)

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
        setAvgTotalScore(null)
        setSubmissionsLoading(false)
        return
      }
      setSubmissionsLoading(true)
      try {
        const subs = await fetchPerf360SubmissionsForTemplate(tenantId, nextTemplateId)
        setSubmissions(subs)

        const submittedIds = subs.filter((s) => s.status === "submitted").map((s) => s.id)
        if (!insForge || submittedIds.length === 0) {
          setAvgTotalScore(null)
          return
        }
        const { data: answers, error } = await insForge
          .from("performance_360_submission_answers")
          .select("submission_id,rating")
          .in("submission_id", submittedIds)
        if (error) throw error
        const ratings = (answers ?? [])
          .map((r: { rating: number | null }) => (r.rating == null ? null : Number(r.rating)))
          .filter((x: number | null): x is number => typeof x === "number" && Number.isFinite(x))
        if (ratings.length === 0) {
          setAvgTotalScore(null)
          return
        }
        const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length
        setAvgTotalScore(avg)
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
      <Card className="border-slate-800 bg-slate-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-100">Filter &amp; periode</CardTitle>
          <CardDescription className="text-slate-500">
            Satu baris filter; pada layar kecil bisa digeser ke samping.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <div className="grid min-w-[980px] grid-cols-5 gap-3">
              <Select
                value={scope.departmentId || ORG_SCOPE_FILTER_ALL}
                onValueChange={(v) => scope.setDepartmentId(v === ORG_SCOPE_FILTER_ALL ? "" : v)}
                disabled={scope.loadingDepts}
              >
                <SelectTrigger className="border-slate-800 bg-slate-950 text-slate-100">
                  <SelectValue placeholder="Departemen" />
                </SelectTrigger>
                <SelectContent className="border-slate-800 bg-slate-900">
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
                <SelectTrigger className="border-slate-800 bg-slate-950 text-slate-100">
                  <SelectValue placeholder="Divisi" />
                </SelectTrigger>
                <SelectContent className="border-slate-800 bg-slate-900">
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
                <SelectTrigger className="border-slate-800 bg-slate-950 text-slate-100">
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
                <SelectContent className="border-slate-800 bg-slate-900">
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {formatTemplatePeriodLabel(t)} — {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau jabatan…"
                className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600"
              />

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void fetchEmployees({ status: "active" })
                  void loadRatees()
                  void loadMatrix()
                  void loadTemplateStats(templateId)
                }}
                className="border-slate-800 bg-slate-950 text-slate-200 hover:bg-slate-900"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {(employeesLoading || rateeLoading || matrixLoading || submissionsLoading) && !mock ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 py-16 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          Memuat dashboard…
        </div>
      ) : rosterForList.length === 0 ? (
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Users className="h-10 w-10 text-slate-600" />
            <p className="max-w-md text-sm text-slate-400">
              {mock ? (
                <>Mode demo: data contoh dapat diklik sebagai ilustrasi.</>
              ) : rateeIds.size === 0 ? (
                <>
                  Belum ada baris di{" "}
                  <span className="font-mono text-slate-500">performance_360_rater_settings</span> — daftar berisi semua
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
            <Card className="border-slate-800 bg-slate-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-slate-400">AVG Total Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-slate-100">
                  {avgTotalScore == null ? "—" : `${avgTotalScore.toFixed(1)} / 5.0`}
                </div>
                <div className="text-[11px] text-slate-500">dari {rosterForList.length} employee</div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-slate-400">Forms Completed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-semibold text-slate-100">
                  {totals.completed} / {totals.totalForms}
                </div>
                <Progress value={percent(totals.completed, totals.totalForms)} className="bg-slate-800" />
                <div className="text-[11px] text-slate-500">
                  {Math.round(percent(totals.completed, totals.totalForms))}% complete
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-slate-400">Pending Responses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-slate-100">{totals.pending}</div>
                <div className="text-[11px] text-slate-500">
                  Forms in progress
                  {templateIsOverdue && totals.overdue > 0 ? (
                    <span className="ml-2 text-amber-400">{totals.overdue} OVERDUE</span>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-slate-400">Overdue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-slate-100">{totals.overdue}</div>
                <div className="text-[11px] text-slate-500">Need follow-up</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <Card className="border-slate-800 bg-slate-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-100">By department</CardTitle>
                <CardDescription className="text-slate-500">Progress completion per departemen.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {byDept.length === 0 ? (
                  <div className="text-sm text-slate-500">Belum ada data.</div>
                ) : (
                  byDept.map((d) => {
                    const pct = percent(d.completed, d.total)
                    return (
                      <div key={d.dept} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="text-slate-300">{d.dept}</div>
                          <div className="text-slate-500">
                            {d.completed} / {d.total} ({Math.round(pct)}%) · {d.employees.size} employee
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-800">
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

            <Card className="border-slate-800 bg-slate-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-100">By job level</CardTitle>
                <CardDescription className="text-slate-500">Progress completion per level.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {byLevel.length === 0 ? (
                  <div className="col-span-full text-sm text-slate-500">Belum ada data.</div>
                ) : (
                  byLevel.slice(0, 8).map((l) => {
                    const pct = percent(l.completedForms, l.totalForms)
                    return (
                      <div key={l.level} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                        <div className="text-xs text-slate-400">Level {l.level}</div>
                        <div className="mt-1 text-lg font-semibold text-slate-100">{l.employees.size}</div>
                        <div className="mt-2 h-2 w-full rounded-full bg-slate-800">
                          <div className={cn("h-2 rounded-full", scoreColor(pct))} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
                          {l.completedForms}/{l.totalForms} ({Math.round(pct)}%)
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-800 bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-100">Response rate by rater type</CardTitle>
              <CardDescription className="text-slate-500">Completion rate tiap tipe rater.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {byRaterType.map((x) => {
                const pct = percent(x.completed, x.total)
                return (
                  <div key={x.kind} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                    <div className="text-xs text-slate-400">{kindLabel(x.kind)}</div>
                    <div className="mt-1 text-lg font-semibold text-slate-100">
                      {x.completed}/{x.total}
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-slate-800">
                      <div className={cn("h-2 rounded-full", scoreColor(pct))} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">{Math.round(pct)}%</div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-100">Assessment management</CardTitle>
              <CardDescription className="text-slate-500">
                Filter dan manage progress per employee. Periode:{" "}
                {selectedTemplate ? `${formatTemplatePeriodLabel(selectedTemplate)} — ${selectedTemplate.name}` : "—"}
                {templateIsOverdue ? <span className="ml-2 text-rose-400">Overdue</span> : null}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="-mx-1 overflow-x-auto px-1 pb-1">
                <div className="grid min-w-[860px] grid-cols-3 gap-3">
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                    <SelectTrigger className="border-slate-800 bg-slate-950 text-slate-100">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-800 bg-slate-900">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="completed">Completed (100%)</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="not_started">Not Started (0%)</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger className="border-slate-800 bg-slate-950 text-slate-100">
                      <SelectValue placeholder="Job level" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-800 bg-slate-900">
                      <SelectItem value="all">All</SelectItem>
                      {levelOptions.map((lvl) => (
                        <SelectItem key={lvl} value={lvl}>
                          Level {lvl}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari employee…"
                    className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">Employee</TableHead>
                      <TableHead className="text-slate-400">Dept</TableHead>
                      <TableHead className="text-slate-400">Level</TableHead>
                      <TableHead className="text-slate-400">Forms</TableHead>
                      <TableHead className="text-slate-400">Completed</TableHead>
                      <TableHead className="text-right text-slate-400">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableRows.length === 0 ? (
                      <TableRow className="border-slate-800">
                        <TableCell colSpan={6} className="py-10 text-center text-sm text-slate-500">
                          Tidak ada data untuk filter ini.
                        </TableCell>
                      </TableRow>
                    ) : (
                      tableRows
                        .filter((r) => {
                          const q = search.trim().toLowerCase()
                          if (!q) return true
                          return r.name.toLowerCase().includes(q)
                        })
                        .map((r) => {
                          const pct = percent(r.completed, r.total)
                          const actionLabel = pct >= 100 ? "View" : templateIsOverdue ? "Remind" : "Follow-up"
                          return (
                            <TableRow key={r.assessedId} className="border-slate-800">
                              <TableCell className="font-medium text-slate-100">
                                <Link
                                  href={`/performance/360/dashboard/${r.assessedId}${qs}`}
                                  className="inline-flex items-center gap-2 hover:underline"
                                >
                                  {r.name}
                                  <ChevronRight className="h-4 w-4 text-slate-600" />
                                </Link>
                              </TableCell>
                              <TableCell className="text-slate-400">{r.dept}</TableCell>
                              <TableCell className="text-slate-400">{r.level}</TableCell>
                              <TableCell className="text-slate-400">{r.total}</TableCell>
                              <TableCell className="text-slate-300">
                                <div className="flex items-center gap-3">
                                  <div className="w-28">
                                    <Progress value={pct} className="bg-slate-800" />
                                  </div>
                                  <span className="text-xs text-slate-400">
                                    {r.completed}/{r.total} ({Math.round(pct)}%)
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Link href={`/performance/360/dashboard/${r.assessedId}${qs}`}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-slate-800 bg-slate-950 text-slate-200 hover:bg-slate-900"
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
