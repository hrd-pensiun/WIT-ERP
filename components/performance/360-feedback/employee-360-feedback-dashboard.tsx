"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  BarChart3,
  ClipboardList,
  Lightbulb,
  LineChart as LineChartIcon,
  Loader2,
  MessageCircle,
  Settings2,
  Sparkles,
  Users,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Performance360Shell } from "@/components/performance/360/shell"
import { Perf360BehavioralCompetencies } from "@/components/performance/360/perf360-behavioral-competencies"
import { Perf360ResultsScoreMatrix } from "@/components/performance/360/perf360-results-score-matrix"
import { ThreeSixtyFillFormDemo } from "@/components/performance/360-feedback/fill-form-demo"
import { Perf360TemplateFillForm } from "@/components/performance/360-feedback/template-fill-form"
import { formatTemplatePeriodLabel } from "@/hooks/usePerformance360Templates"
import { usePerf360EmployeeForms, type Perf360FormListRowModel } from "@/hooks/usePerf360EmployeeForms"
import { perf360DraftStorageKey } from "@/lib/perf360-draft-storage"
import type { Perf360AssignmentKind } from "@/lib/perf360-assignments"
import { computePerf360Assignments, type Perf360AssignmentKind as Perf360AssignmentKindLive } from "@/lib/perf360-assignments"
import { fetchPerf360FormMatrixData } from "@/lib/performance-360-form-matrix"
import { fetchPerf360SubmissionsForTemplate } from "@/lib/perf360-submissions"
import { loadPerf360RaterWeights } from "@/components/performance/360/assessment-weights-storage"
import { insForge, isMockMode } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"
import { cn } from "@/lib/utils"

type FormStatus = "completed" | "in_progress" | "pending" | "not_started"
type RaterKind = "self" | "superior" | "peer" | "subordinate"

type FormListRow = {
  id: string
  formLabel: string
  raterName: string
  raterRoleLabel: string
  raterKind: RaterKind
  status: FormStatus
  /** hari tersisa; null jika selesai */
  daysLeft: number | null
  overdue: boolean
}

const CYCLES = [
  { id: "q2-2024", label: "Q2 2024 Review" },
  { id: "q3-2024", label: "Q3 2024 Review" },
  { id: "annual-2024", label: "Annual 2024" },
] as const

/** Baris demo — struktur sesuai docs/360-emptab.md Tab 1. */
const FORM_LIST_SOURCE: FormListRow[] = [
  {
    id: "1",
    formLabel: "Self Assessment",
    raterName: "Igor Tolic Kadiv",
    raterRoleLabel: "Diri sendiri",
    raterKind: "self",
    status: "completed",
    daysLeft: null,
    overdue: false,
  },
  {
    id: "2",
    formLabel: "Superior Assessment",
    raterName: "Royadi Nainggolan",
    raterRoleLabel: "Atasan",
    raterKind: "superior",
    status: "pending",
    daysLeft: 5,
    overdue: false,
  },
  {
    id: "3",
    formLabel: "Peer Assessment",
    raterName: "Antonius Gunadharma",
    raterRoleLabel: "Rekan",
    raterKind: "peer",
    status: "in_progress",
    daysLeft: 3,
    overdue: false,
  },
  {
    id: "4",
    formLabel: "Subordinate Assessment",
    raterName: "Fadhilah Abdul Aziz",
    raterRoleLabel: "Bawahan",
    raterKind: "subordinate",
    status: "not_started",
    daysLeft: 0,
    overdue: true,
  },
]

const TREND_SERIES = [
  { cycle: "Q4 2023", score: 3.8 },
  { cycle: "Q1 2024", score: 4.0 },
  { cycle: "Q2 2024", score: 4.2 },
]

const SELF_VS_OTHERS = [
  { type: "Self", score: 4.3, note: "Anda menilai diri sedikit lebih tinggi" },
  { type: "Superior", score: 4.4, note: "Perspektif paling positif" },
  { type: "Peer", score: 4.1, note: "Seimbang" },
  { type: "Subordinate", score: 4.0, note: "Sedikit lebih rendah" },
]

const ORG_COMPARE = [
  { competency: "Technical", you: 4.5, org: 3.8, gap: 0.7 },
  { competency: "Leadership", you: 4.0, org: 3.9, gap: 0.1 },
  { competency: "Communication", you: 3.8, org: 3.9, gap: -0.1 },
]

function FormStatusBadge({ status, overdue }: { status: FormStatus; overdue: boolean }) {
  if (status === "completed") {
    return (
      <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
        Selesai
      </Badge>
    )
  }
  if (status === "in_progress") {
    return (
      <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-400">
        Berjalan
      </Badge>
    )
  }
  if (status === "pending") {
    return (
      <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-400">
        Menunggu
      </Badge>
    )
  }
  if (overdue) {
    return (
      <Badge className="border-red-500/30 bg-red-500/15 text-red-400">
        Terlambat
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="border-red-500/20 bg-red-500/10 text-red-300">
      Belum mulai
    </Badge>
  )
}

function liveKindMatchesFilter(kind: Perf360AssignmentKind, filter: string): boolean {
  if (filter === "all") return true
  const map: Record<string, Perf360AssignmentKind> = {
    self: "self",
    superior: "manager",
    peer: "peer",
    subordinate: "subordinate",
  }
  return map[filter] === kind
}

type SheetOpen =
  | { mode: "mock"; row: FormListRow }
  | { mode: "live"; row: Perf360FormListRowModel }

type FormListUnion = FormListRow | Perf360FormListRowModel

export function Employee360FeedbackDashboard() {
  const mockMode = isMockMode()
  const tenantId = getTenantId()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [raterFilter, setRaterFilter] = useState<string>("all")
  const [periodId, setPeriodId] = useState<string>(CYCLES[0].id)
  const [templateId, setTemplateId] = useState<string>("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetPayload, setSheetPayload] = useState<SheetOpen | null>(null)
  const sheetCloseAfterSubmitRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [scoreLoading, setScoreLoading] = useState(false)
  const [scoreError, setScoreError] = useState<string | null>(null)
  const [scoreData, setScoreData] = useState<{
    cards: { label: string; valueText: string; subtitle: string; className: string }[]
    rows: {
      category: string
      self: number | null
      atasan: number | null
      rekan: number | null
      bawahan: number | null
      total: number | null
      avg: number | null
      avgTone?: "neutral" | "warn"
    }[]
    totalRow: { self: number | null; atasan: number | null; rekan: number | null; bawahan: number | null; overall: number | null }
  } | null>(null)

  const pf360 = usePerf360EmployeeForms(mockMode ? undefined : templateId || undefined)

  useEffect(() => {
    return () => {
      if (sheetCloseAfterSubmitRef.current) {
        clearTimeout(sheetCloseAfterSubmitRef.current)
        sheetCloseAfterSubmitRef.current = null
      }
    }
  }, [])

  const activeTemplates = useMemo(
    () => pf360.templates.filter((t) => t.status === "active"),
    [pf360.templates]
  )

  useEffect(() => {
    if (mockMode) return
    if (!templateId && activeTemplates.length > 0) {
      setTemplateId(activeTemplates[0].id)
    }
  }, [mockMode, templateId, activeTemplates])

  const [chkQ, setChkQ] = useState({
    q1: false,
    q2: false,
    q3: false,
    n1: false,
    n2: false,
    n3: false,
  })

  const selectedTemplateForLatest = useMemo(() => {
    if (mockMode) return null
    return templateId ? (pf360.templates.find((t) => t.id === templateId) ?? null) : null
  }, [mockMode, templateId, pf360.templates])

  const scoreWeights = useMemo(() => loadPerf360RaterWeights(), [])

  useEffect(() => {
    if (mockMode || !insForge || !templateId || !pf360.viewerProfileId) {
      setScoreData(null)
      setScoreError(null)
      setScoreLoading(false)
      return
    }

    let cancelled = false
    setScoreLoading(true)
    setScoreError(null)

    void (async () => {
      try {
        const matrix = await fetchPerf360FormMatrixData(tenantId)
        const profiles = matrix?.profiles ?? []
        const settings = matrix?.settings ?? []
        const assignments = settings.length
          ? computePerf360Assignments(profiles, settings, null, { showAllForms: true })
          : []
        const expectedForAssessed = assignments.filter((a) => a.assessedId === pf360.viewerProfileId)
        const expectedSubordinate = expectedForAssessed.some((a) => a.kind === "subordinate")

        const submissions = await fetchPerf360SubmissionsForTemplate(tenantId, templateId)
        const relevantSubs = submissions.filter(
          (s) => s.assessed_user_profile_id === pf360.viewerProfileId && s.status === "submitted"
        )
        const submittedIds = relevantSubs.map((s) => s.id)

        const { data: qrows, error: qerr } = await insForge
          .from("performance_360_template_questions")
          .select("id,category,weight")
          .eq("template_id", templateId)
        if (qerr) throw qerr

        const questionMeta = new Map<string, { category: string; weight: number }>(
          (qrows ?? []).map((r: { id: string; category: string; weight: number | null }) => [
            r.id,
            { category: r.category ?? "—", weight: r.weight == null ? 1 : Number(r.weight) },
          ])
        )

        const { data: ansRows, error: aerr } = submittedIds.length
          ? await insForge
              .from("performance_360_submission_answers")
              .select("submission_id,question_id,rating")
              .in("submission_id", submittedIds)
          : { data: [], error: null }
        if (aerr) throw aerr

        const kindBySubmission = new Map<string, Perf360AssignmentKindLive>(
          relevantSubs.map((s) => [s.id, s.assignment_kind as Perf360AssignmentKindLive])
        )

        type Agg = { sum: number; wsum: number }
        const kindAgg: Record<Perf360AssignmentKindLive, Agg> = {
          self: { sum: 0, wsum: 0 },
          manager: { sum: 0, wsum: 0 },
          peer: { sum: 0, wsum: 0 },
          subordinate: { sum: 0, wsum: 0 },
        }
        const kindCounts: Record<Perf360AssignmentKindLive, number> = {
          self: 0,
          manager: 0,
          peer: 0,
          subordinate: 0,
        }
        for (const s of relevantSubs) {
          const kind = s.assignment_kind as Perf360AssignmentKindLive
          kindCounts[kind] += 1
        }

        const catAgg = new Map<string, Record<Perf360AssignmentKindLive, Agg>>()
        const ensureCat = (cat: string) => {
          const cur = catAgg.get(cat)
          if (cur) return cur
          const next: Record<Perf360AssignmentKindLive, Agg> = {
            self: { sum: 0, wsum: 0 },
            manager: { sum: 0, wsum: 0 },
            peer: { sum: 0, wsum: 0 },
            subordinate: { sum: 0, wsum: 0 },
          }
          catAgg.set(cat, next)
          return next
        }

        for (const row of (ansRows ?? []) as { submission_id: string; question_id: string; rating: number | null }[]) {
          if (row.rating == null) continue
          const kind = kindBySubmission.get(row.submission_id)
          if (!kind) continue
          const qm = questionMeta.get(row.question_id)
          if (!qm) continue
          const w = qm.weight
          kindAgg[kind].sum += Number(row.rating) * w
          kindAgg[kind].wsum += w
          const byKind = ensureCat(qm.category)
          byKind[kind].sum += Number(row.rating) * w
          byKind[kind].wsum += w
        }

        const score = (a: Agg) => (a.wsum > 0 ? a.sum / a.wsum : null)
        const sSelf = score(kindAgg.self)
        const sMgr = score(kindAgg.manager)
        const sPeer = score(kindAgg.peer)
        const sSub = score(kindAgg.subordinate)

        let wSelf = scoreWeights.self
        let wMgr = scoreWeights.manager
        let wPeer = scoreWeights.peer
        let wSub = scoreWeights.subordinate
        if (!expectedSubordinate) {
          wPeer += wSub
          wSub = 0
        }

        const parts: { w: number; v: number }[] = []
        if (sSelf != null) parts.push({ w: wSelf, v: sSelf })
        if (sMgr != null) parts.push({ w: wMgr, v: sMgr })
        if (sPeer != null) parts.push({ w: wPeer, v: sPeer })
        if (sSub != null) parts.push({ w: wSub, v: sSub })
        const wsum = parts.reduce((a, b) => a + b.w, 0)
        const overall = wsum > 0 ? parts.reduce((a, b) => a + (b.w / wsum) * b.v, 0) : null

        const categories = [...new Set((qrows ?? []).map((r: { category?: string | null }) => String(r.category ?? "—")))]
          .sort((a, b) => a.localeCompare(b))

        const rows = categories.map((cat) => {
          const a = catAgg.get(cat) ?? {
            self: { sum: 0, wsum: 0 },
            manager: { sum: 0, wsum: 0 },
            peer: { sum: 0, wsum: 0 },
            subordinate: { sum: 0, wsum: 0 },
          }
          const cSelf = score(a.self)
          const cMgr = score(a.manager)
          const cPeer = score(a.peer)
          const cSub = score(a.subordinate)
          const vals = [cSelf, cMgr, cPeer, cSub].filter(
            (x): x is number => typeof x === "number" && Number.isFinite(x)
          )
          const avg = vals.length ? vals.reduce((x, y) => x + y, 0) / vals.length : null
          const total = vals.length ? vals.reduce((x, y) => x + y, 0) : null
          return {
            category: cat,
            self: cSelf,
            atasan: cMgr,
            rekan: cPeer,
            bawahan: cSub,
            total,
            avg,
            avgTone: avg != null && avg < 3.8 ? "warn" : "neutral" as const,
          }
        })

        const cards = [
          {
            label: "Self Assessment",
            valueText: sSelf == null ? "—" : sSelf.toFixed(1),
            subtitle: `dari 5.0 (${kindCounts.self} response)`,
            className: "from-emerald-600/90 to-cyan-600/80",
          },
          {
            label: "Manager / Atasan",
            valueText: sMgr == null ? "—" : sMgr.toFixed(1),
            subtitle: `dari 5.0 (${kindCounts.manager} response)`,
            className: "from-fuchsia-600/85 to-rose-600/75",
          },
          {
            label: "Rekan / Peer",
            valueText: sPeer == null ? "—" : sPeer.toFixed(1),
            subtitle: `dari 5.0 (${kindCounts.peer} response)`,
            className: "from-sky-600/85 to-cyan-500/75",
          },
          {
            label: "Bawahan / Subordinate",
            valueText: sSub == null ? "—" : sSub.toFixed(1),
            subtitle: `dari 5.0 (${kindCounts.subordinate} response)`,
            className: "from-green-600/85 to-emerald-500/75",
          },
        ]

        if (!cancelled) {
          setScoreData({
            cards,
            rows,
            totalRow: { self: sSelf, atasan: sMgr, rekan: sPeer, bawahan: sSub, overall },
          })
        }
      } catch (e) {
        if (!cancelled) {
          setScoreError(e instanceof Error ? e.message : "Gagal memuat hasil terbaru.")
          setScoreData(null)
        }
      } finally {
        if (!cancelled) setScoreLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [mockMode, pf360.viewerProfileId, scoreWeights.manager, scoreWeights.peer, scoreWeights.self, scoreWeights.subordinate, templateId, tenantId])

  const filteredRows = useMemo((): FormListUnion[] => {
    if (mockMode) {
      return FORM_LIST_SOURCE.filter((row) => {
        if (statusFilter !== "all" && row.status !== statusFilter) return false
        if (raterFilter !== "all" && row.raterKind !== raterFilter) return false
        return true
      })
    }
    return pf360.rows.filter((row) => {
      if (!row.canOpen) return false
      if (statusFilter !== "all" && row.status !== statusFilter) return false
      if (!liveKindMatchesFilter(row.kind, raterFilter)) return false
      return true
    })
  }, [mockMode, statusFilter, raterFilter, pf360.rows])

  const progressStats = useMemo(() => {
    const total = filteredRows.length
    const completed = filteredRows.filter((r) => r.status === "completed").length
    const pct = total ? Math.round((completed / total) * 100) : 0
    return { completed, total, pct }
  }, [filteredRows])

  const behavioralRows = useMemo(() => {
    if (!scoreData?.rows?.length) return undefined
    return scoreData.rows
      .map((r) => ({
        key: r.category.toLowerCase().replace(/\s+/g, "_"),
        subject: r.category,
        score: r.avg ?? 0,
      }))
      .sort((a, b) => a.subject.localeCompare(b.subject))
  }, [scoreData])

  const deadlineStats = useMemo(() => {
    let soonest: number | null = null
    let overdueCount = 0
    for (const r of filteredRows) {
      if (r.status === "completed") continue
      if (r.overdue) overdueCount++
      else if (r.daysLeft != null && (soonest === null || r.daysLeft < soonest)) soonest = r.daysLeft
    }
    const pending = filteredRows.filter(
      (r) => r.status === "pending" || r.status === "in_progress"
    ).length
    const displaySoonest = soonest ?? (overdueCount > 0 ? 0 : 7)
    return { soonest: displaySoonest, overdue: overdueCount, pending }
  }, [filteredRows])

  function openForm(row: FormListUnion) {
    if (mockMode) {
      const r = row as FormListRow
      if (r.status === "completed") return
      setSheetPayload({ mode: "mock", row: r })
    } else {
      const r = row as Perf360FormListRowModel
      if (!r.canOpen) return
      setSheetPayload({ mode: "live", row: r })
    }
    setSheetOpen(true)
  }

  return (
    <Performance360Shell
      title="360 Feedback"
      subtitle={
        mockMode
          ? "Dashboard personal: form yang perlu diisi, hasil siklus sebelumnya, dan insight pengembangan. Tab Daftar form memakai data contoh."
          : "Dashboard personal: daftar formulir mengikuti template & roster aktual. Draf lokal + tombol kirim menyimpan jawaban di performance_360_submissions."
      }
      action={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300" asChild>
            <Link href="/performance/360/template">
              <Settings2 className="mr-1.5 h-4 w-4" />
              Template
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300" asChild>
            <Link href="/performance/360/dashboard">
              <BarChart3 className="mr-1.5 h-4 w-4" />
              Dashboard HR
            </Link>
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2.5 text-sm text-slate-500">
        <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
        <p>
          {mockMode ? (
            <>
              Tab <span className="text-slate-400">Daftar form</span> membuka form isi (demo) dari baris yang belum selesai.
              Hasil &amp; insight memakai data ilustrasi hingga agregasi kompetensi tersedia di backend.
            </>
          ) : (
            <>
              Pilih <span className="text-slate-400">periode</span> (template 360) untuk melihat form penilaian yang dihitung dari roster.
              Secara default hanya form di mana Anda penilai yang ditampilkan.
              Mode pratinjau semua form hanya tersedia untuk role HR/Admin tertentu jika profil belum lengkap.
              {pf360.showAllForms ? (
                <span className="mt-1 block text-amber-500/90">
                  Mode pratinjau aktif: profil belum lengkap/tidak tertaut, sehingga semua form periode bisa dibuka.
                </span>
              ) : null}
            </>
          )}
        </p>
      </div>

      <Tabs defaultValue="form-list" className="gap-4">
        <TabsList
          variant="line"
          className="h-auto w-full flex-wrap justify-start gap-0 rounded-none border-b border-slate-800 bg-transparent p-0"
        >
          <TabsTrigger
            value="form-list"
            className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <ClipboardList className="mr-1.5 h-4 w-4 opacity-70" />
            Daftar form
          </TabsTrigger>
          <TabsTrigger
            value="latest"
            className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <Sparkles className="mr-1.5 h-4 w-4 opacity-70" />
            Hasil terbaru
          </TabsTrigger>
          <TabsTrigger
            value="insights"
            className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <Lightbulb className="mr-1.5 h-4 w-4 opacity-70" />
            Insight saya
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form-list" className="mt-6 space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-slate-800 bg-slate-950 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-800 bg-slate-900">
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="pending">Menunggu</SelectItem>
                  <SelectItem value="in_progress">Berjalan</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                  <SelectItem value="not_started">Belum mulai</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Tipe penilai</Label>
              <Select value={raterFilter} onValueChange={setRaterFilter}>
                <SelectTrigger className="border-slate-800 bg-slate-950 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-800 bg-slate-900">
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="self">Self</SelectItem>
                  <SelectItem value="superior">Atasan</SelectItem>
                  <SelectItem value="peer">Rekan</SelectItem>
                  <SelectItem value="subordinate">Bawahan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Periode</Label>
              <Select
                value={mockMode ? periodId : templateId}
                onValueChange={mockMode ? setPeriodId : setTemplateId}
                disabled={!mockMode && !pf360.templates.length}
              >
                <SelectTrigger className="border-slate-800 bg-slate-950 text-slate-100">
                  <SelectValue placeholder={mockMode ? undefined : "Pilih template"} />
                </SelectTrigger>
                <SelectContent className="border-slate-800 bg-slate-900">
                  {mockMode
                    ? CYCLES.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label}
                        </SelectItem>
                      ))
                    : pf360.templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {formatTemplatePeriodLabel(t)}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!mockMode && pf360.error ? (
            <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {pf360.error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-slate-800 bg-slate-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-slate-100">Progres</CardTitle>
                <CardDescription>Form selesai dalam siklus ini</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-2xl font-bold text-emerald-400">
                  {progressStats.completed} dari {progressStats.total} selesai{" "}
                  <span className="text-lg font-semibold text-slate-400">({progressStats.pct}%)</span>
                </p>
                <Progress
                  value={progressStats.pct}
                  className="h-2 bg-slate-800 [&>[data-slot=progress-indicator]]:bg-emerald-500"
                />
              </CardContent>
            </Card>
            <Card className="border-slate-800 bg-slate-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-slate-100">Deadline terdekat</CardTitle>
                <CardDescription>Ringkasan urgensi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-2xl font-bold text-amber-400">
                  {deadlineStats.overdue > 0 ? "Ada terlambat" : `${deadlineStats.soonest} hari`}
                </p>
                <p className="text-sm text-slate-400">
                  Status:{" "}
                  <span className="text-red-400">{deadlineStats.overdue} terlambat</span>
                  {", "}
                  <span className="text-amber-400">
                    {filteredRows.filter((r) => r.status === "pending" || r.status === "in_progress").length}{" "}
                    aktif / menunggu
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden border-slate-800 bg-slate-900">
            {!mockMode && pf360.loading ? (
              <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                Memuat form &amp; roster…
              </div>
            ) : !mockMode && !templateId ? (
              <div className="px-4 py-12 text-center text-sm text-slate-500">
                Belum ada template 360. Buat dan aktifkan template di halaman Template.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Form penilaian</TableHead>
                    <TableHead className="text-slate-400">Penilai</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-right text-slate-400">Deadline</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockMode
                    ? (filteredRows as FormListRow[]).map((row) => (
                        <TableRow
                          key={row.id}
                          className={cn(
                            "border-slate-800",
                            row.status !== "completed" && "cursor-pointer hover:bg-slate-950/80"
                          )}
                          onClick={() => openForm(row)}
                        >
                          <TableCell className="font-medium text-slate-200">{row.formLabel}</TableCell>
                          <TableCell className="text-slate-400">
                            {row.raterName}
                            <span className="text-slate-600"> — {row.raterRoleLabel}</span>
                          </TableCell>
                          <TableCell>
                            <FormStatusBadge status={row.status} overdue={row.overdue} />
                          </TableCell>
                          <TableCell className="text-right text-slate-400">
                            {row.status === "completed" ? (
                              "—"
                            ) : row.overdue ? (
                              <span className="font-medium text-red-400">TERLAMBAT</span>
                            ) : row.daysLeft != null ? (
                              `${row.daysLeft} hari`
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    : (filteredRows as Perf360FormListRowModel[]).map((row) => (
                        <TableRow
                          key={row.assignmentKey}
                          className={cn(
                            "border-slate-800",
                            row.status !== "completed" && "cursor-pointer hover:bg-slate-950/80"
                          )}
                          onClick={() => openForm(row)}
                        >
                          <TableCell className="font-medium text-slate-200">
                            <span className="block">{row.formLabel}</span>
                            <span className="text-xs font-normal text-slate-500">
                              Dinilai: {row.assessedName}
                            </span>
                          </TableCell>
                          <TableCell className="text-slate-400">{row.raterDisplayName}</TableCell>
                          <TableCell>
                            <FormStatusBadge status={row.status} overdue={row.overdue} />
                          </TableCell>
                          <TableCell className="text-right text-slate-400">
                            {row.status === "completed" ? (
                              "—"
                            ) : row.overdue ? (
                              <span className="font-medium text-red-400">TERLAMBAT</span>
                            ) : row.daysLeft != null ? (
                              `${row.daysLeft} hari`
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  {!mockMode && templateId && !filteredRows.length ? (
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableCell colSpan={4} className="py-12 text-center text-slate-500">
                        Tidak ada baris (cek roster atau pengaturan rater di template).
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            )}
          </Card>
          <p className="text-xs text-slate-600">
            {mockMode
              ? "Klik baris (belum selesai) untuk membuka form isi demo. Baris selesai hanya untuk baca status."
              : pf360.showAllForms
                ? "Role HR/Admin dalam mode pratinjau: semua form untuk template ini ditampilkan dan dapat dibuka."
                : "Klik baris tugas Anda untuk mengisi atau membuka lagi jawaban yang sudah dikirim ke server."}
          </p>
        </TabsContent>

        <TabsContent value="latest" className="mt-6 space-y-6">
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-slate-100">Informasi profil</CardTitle>
              <CardDescription className="text-slate-500">
                {mockMode
                  ? "Profil contoh untuk preview hasil 360."
                  : "Profil dinamis dari user yang sedang login."}
              </CardDescription>
            </CardHeader>
            <CardContent className="-mx-1 overflow-x-auto px-1">
              <div className="grid min-w-[920px] grid-cols-4 gap-3">
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Nama</p>
                <p className="mt-1 text-sm font-medium text-slate-100">
                  {mockMode ? "Igor Tolic Kadiv" : pf360.viewerProfile?.full_name ?? "—"}
                </p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Divisi</p>
                  <p className="mt-1 text-sm font-medium text-slate-100">
                    {mockMode ? "Product Engineering" : pf360.viewerProfile?.division_name ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Departemen</p>
                  <p className="mt-1 text-sm font-medium text-slate-100">
                    {mockMode ? "Engineering" : pf360.viewerProfile?.department_name ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Total score</p>
                  <p className="mt-1 text-sm font-medium text-emerald-400">3.9 / 5.0</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-slate-100">
                {mockMode
                  ? (CYCLES.find((c) => c.id === periodId)?.label ?? "Hasil terbaru")
                  : selectedTemplateForLatest
                    ? formatTemplatePeriodLabel(selectedTemplateForLatest)
                    : "Pilih periode (template)"}
              </CardTitle>
              <CardDescription className="space-y-1 text-slate-400">
                {mockMode ? (
                  <>
                    <p>Matrix skor mengikuti tampilan dashboard HR (data ilustrasi).</p>
                    <p className="mt-1">
                      Samakan periode dengan pilihan di tab <span className="text-slate-500">Daftar form</span> jika perlu.
                    </p>
                  </>
                ) : !templateId || !selectedTemplateForLatest ? (
                  <p>Belum ada template dipilih. Atur periode di tab Daftar form.</p>
                ) : (
                  <p>
                    {selectedTemplateForLatest.name ? (
                      <>
                        Template:{" "}
                        <span className="text-slate-300">{selectedTemplateForLatest.name}</span>.{" "}
                      </>
                    ) : null}
                    Angka di bawah merupakan demo; agregasi dari{" "}
                    <span className="font-mono text-slate-500">submission</span> akan menggantikan saat tersedia.
                  </p>
                )}
              </CardDescription>
            </CardHeader>
          </Card>

          {scoreLoading ? (
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 px-4 py-4 text-sm text-slate-400">
              Memuat ringkasan skor terbaru...
            </div>
          ) : null}
          {!scoreLoading && scoreError ? (
            <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {scoreError}
            </div>
          ) : null}
          <Perf360BehavioralCompetencies rows={behavioralRows} />
          <Perf360ResultsScoreMatrix data={scoreData} />
        </TabsContent>

        <TabsContent value="insights" className="mt-6 space-y-6">
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <LineChartIcon className="h-5 w-5 text-cyan-400" />
                Tren skor (3+ siklus)
              </CardTitle>
              <CardDescription>Ilustrasi — data historis penuh mengikuti penyimpanan siklus</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={TREND_SERIES} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="cycle" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis domain={[3, 5]} tick={{ fill: "#94a3b8", fontSize: 12 }} width={32} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
                </LineChart>
              </ResponsiveContainer>
              <p className="mt-4 text-sm text-slate-400">
                Q1 2024: 4.0 (↑ +0.2) · Q2 2024: 4.2 (↑ +0.2) —{" "}
                <span className="text-emerald-400">cenderung meningkat</span>.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-slate-800 bg-slate-900">
              <CardHeader>
                <CardTitle className="text-base text-slate-100">Kekuatan (skor tertinggi)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-400">
                <div>
                  <p className="font-medium text-slate-200">1. Technical Competence (4.5)</p>
                  <p className="mt-1">Konsisten dari penilai — pertahankan dan bagikan pengetahuan.</p>
                </div>
                <div>
                  <p className="font-medium text-slate-200">2. Accountability (4.3)</p>
                  <p className="mt-1">Tanggung jawab jelas — cocok untuk memimpin proyek.</p>
                </div>
                <div>
                  <p className="font-medium text-slate-200">3. Teamwork (4.2)</p>
                  <p className="mt-1">Kolaborasi baik — fokus mentoring junior.</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-800 bg-slate-900">
              <CardHeader>
                <CardTitle className="text-base text-slate-100">Area pengembangan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-400">
                <div>
                  <p className="font-medium text-slate-200">1. Leadership &amp; Delegation (4.0)</p>
                  <p className="mt-1">Selisih dengan kekuatan utama: 0.5 — coaching / pelatihan kepemimpinan (3–6 bulan).</p>
                </div>
                <div>
                  <p className="font-medium text-slate-200">2. Communication (3.8)</p>
                  <p className="mt-1">Kursus presentasi atau pembicaraan publik — kuartal berikutnya.</p>
                </div>
                <div>
                  <p className="font-medium text-slate-200">3. Continuous Learning (4.1)</p>
                  <p className="mt-1">Program learning internal — progres berkelanjutan.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-slate-100">
                <Users className="h-5 w-5 text-cyan-400" />
                Self vs penilai lain
              </CardTitle>
              <CardDescription>Rata-rata per tipe penilai (contoh)</CardDescription>
            </CardHeader>
            <CardContent className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SELF_VS_OTHERS} layout="vertical" margin={{ left: 12, right: 12 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis type="number" domain={[3, 5]} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis type="category" dataKey="type" width={88} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
                    formatter={(v: number) => [v.toFixed(1), "Skor"]}
                  />
                  <Bar dataKey="score" fill="#059669" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="mt-3 text-sm text-slate-400">
                Persepsi diri sedikit lebih tinggi dari rekan — peluang untuk mendengarkan umpan balik terbuka.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-base text-slate-100">Perbandingan dengan rata-rata organisasi</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Kompetensi</TableHead>
                    <TableHead className="text-slate-400">Anda</TableHead>
                    <TableHead className="text-slate-400">Rata org</TableHead>
                    <TableHead className="text-slate-400">Selisih</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ORG_COMPARE.map((row) => (
                    <TableRow key={row.competency} className="border-slate-800">
                      <TableCell className="text-slate-200">{row.competency}</TableCell>
                      <TableCell className="font-mono text-slate-300">{row.you.toFixed(1)}</TableCell>
                      <TableCell className="font-mono text-slate-500">{row.org.toFixed(1)}</TableCell>
                      <TableCell
                        className={cn(
                          "font-mono",
                          row.gap >= 0 ? "text-emerald-400" : "text-amber-400"
                        )}
                      >
                        {row.gap >= 0 ? "+" : ""}
                        {row.gap.toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-3 text-sm text-slate-500">
                Skor keseluruhan Anda 4.2 vs rata-rata org 3.9 (+0.3, di atas rata-rata).
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-600 bg-slate-950/80 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-100">Rencana pengembangan (disarankan)</CardTitle>
              <CardDescription>Berdasarkan skor &amp; tema umpan balik — akan dipersonalisasi oleh HR</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-400">
              <div>
                <p className="font-medium text-emerald-400">Prioritas 1: Leadership &amp; Delegation</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>Aksi: workshop Leading Teams</li>
                  <li>Jadwal: 3 bulan ke depan</li>
                  <li>Mentor: atasan langsung</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-emerald-400">Prioritas 2: Communication</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>Aksi: pelatihan presentasi / Toastmasters</li>
                  <li>Jadwal: 6 bulan</li>
                  <li>Buddy: rekan dari umpan balik</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-base text-slate-100">Tindakan disarankan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Kuartal ini</p>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="cq1"
                  checked={chkQ.q1}
                  onCheckedChange={(v) => setChkQ((s) => ({ ...s, q1: Boolean(v) }))}
                />
                <Label htmlFor="cq1" className="text-slate-300">
                  Jadwalkan 1-on-1 dengan atasan untuk membahas rencana
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="cq2"
                  checked={chkQ.q2}
                  onCheckedChange={(v) => setChkQ((s) => ({ ...s, q2: Boolean(v) }))}
                />
                <Label htmlFor="cq2" className="text-slate-300">
                  Daftar pelatihan kepemimpinan (akhir bulan)
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="cq3"
                  checked={chkQ.q3}
                  onCheckedChange={(v) => setChkQ((s) => ({ ...s, q3: Boolean(v) }))}
                />
                <Label htmlFor="cq3" className="text-slate-300">
                  Tentukan buddy akuntabilitas
                </Label>
              </div>
              <p className="pt-4 text-xs font-medium uppercase tracking-wide text-slate-500">Kuartal berikutnya</p>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="cn1"
                  checked={chkQ.n1}
                  onCheckedChange={(v) => setChkQ((s) => ({ ...s, n1: Boolean(v) }))}
                />
                <Label htmlFor="cn1" className="text-slate-300">
                  Pengecekan pertengahan siklus
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="cn2"
                  checked={chkQ.n2}
                  onCheckedChange={(v) => setChkQ((s) => ({ ...s, n2: Boolean(v) }))}
                />
                <Label htmlFor="cn2" className="text-slate-300">
                  Sesuaikan rencana setelah umpan balik
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="cn3"
                  checked={chkQ.n3}
                  onCheckedChange={(v) => setChkQ((s) => ({ ...s, n3: Boolean(v) }))}
                />
                <Label htmlFor="cn3" className="text-slate-300">
                  Mulai siklus penilaian Q3
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet
        open={sheetOpen}
        onOpenChange={(o) => {
          setSheetOpen(o)
          if (!o) {
            if (sheetCloseAfterSubmitRef.current) {
              clearTimeout(sheetCloseAfterSubmitRef.current)
              sheetCloseAfterSubmitRef.current = null
            }
            setSheetPayload(null)
          }
        }}
      >
        <SheetContent
          side="right"
          className="max-sm:w-full max-sm:max-w-full w-full overflow-y-auto border-slate-800 bg-slate-900 sm:!w-[50vw] sm:!max-w-[50vw] sm:min-w-0"
        >
          <SheetHeader>
            <SheetTitle className="text-slate-100">
              {sheetPayload?.mode === "mock"
                ? sheetPayload.row.formLabel
                : sheetPayload?.mode === "live"
                  ? sheetPayload.row.formLabel
                  : "Form"}
            </SheetTitle>
            <SheetDescription className="text-slate-500">
              {sheetPayload?.mode === "mock" ? (
                <>
                  Penilai: {sheetPayload.row.raterName} ({sheetPayload.row.raterRoleLabel})
                </>
              ) : sheetPayload?.mode === "live" ? (
                <>
                  {sheetPayload.row.raterDisplayName} · dinilai: {sheetPayload.row.assessedName}
                </>
              ) : null}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-8">
            {sheetPayload?.mode === "mock" ? <ThreeSixtyFillFormDemo /> : null}
            {sheetPayload?.mode === "live" && pf360.template ? (
              pf360.questionsForTemplate === null ? (
                <div className="flex items-center gap-2 py-12 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                  Memuat pertanyaan…
                </div>
              ) : (
                <Perf360TemplateFillForm
                  tenantId={tenantId}
                  templateId={templateId}
                  assignmentKey={sheetPayload.row.assignmentKey}
                  raterUserProfileId={sheetPayload.row.assignment.raterId}
                  assessedUserProfileId={sheetPayload.row.assignment.assessedId}
                  storageKey={perf360DraftStorageKey(tenantId, templateId, sheetPayload.row.assignmentKey)}
                  templateName={pf360.template.name}
                  scaleMax={pf360.template.rating_scale_max ?? 5}
                  assessedName={sheetPayload.row.assessedName}
                  assignmentKind={sheetPayload.row.kind}
                  questions={pf360.questionsForTemplate}
                  raterContextLine={sheetPayload.row.raterDisplayName}
                  onSaved={pf360.bumpDrafts}
                  onServerSubmitted={() => {
                    pf360.bumpDrafts()
                    void (async () => {
                      await pf360.refetchSubmissions()
                      if (sheetCloseAfterSubmitRef.current) {
                        clearTimeout(sheetCloseAfterSubmitRef.current)
                      }
                      sheetCloseAfterSubmitRef.current = setTimeout(() => {
                        sheetCloseAfterSubmitRef.current = null
                        setSheetOpen(false)
                        setSheetPayload(null)
                      }, 2200)
                    })()
                  }}
                />
              )
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </Performance360Shell>
  )
}
