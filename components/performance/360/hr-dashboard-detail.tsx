"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Perf360BehavioralCompetencies } from "@/components/performance/360/perf360-behavioral-competencies"
import { Perf360ResultsScoreMatrix } from "@/components/performance/360/perf360-results-score-matrix"
import { Performance360Shell } from "@/components/performance/360/shell"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEmployees } from "@/hooks/useEmployees"
import { formatTemplatePeriodLabel, usePerformance360Templates } from "@/hooks/usePerformance360Templates"
import { insForge, isMockMode } from "@/lib/insforge"
import { loadPerf360RaterWeights } from "@/components/performance/360/assessment-weights-storage"
import { computePerf360Assignments, type Perf360AssignmentKind } from "@/lib/perf360-assignments"
import { fetchPerf360FormMatrixData } from "@/lib/performance-360-form-matrix"
import { fetchPerf360SubmissionsForTemplate } from "@/lib/perf360-submissions"
import { getTenantId } from "@/lib/tenant"

const DEMO_NAMES: Record<string, string> = {
  "ffffffff-ffff-4fff-8fff-fffffffffff1": "Igor Tolic Kadiv",
  "ffffffff-ffff-4fff-8fff-fffffffffff2": "Royadi Nainggolan",
  "ffffffff-ffff-4fff-8fff-fffffffffff3": "Antonius Gunadharma",
}

export function Perf360HrDashboardDetail({ profileId }: { profileId: string }) {
  const tenantId = getTenantId()
  const mock = isMockMode()
  const searchParams = useSearchParams()
  const templateFromQuery = searchParams.get("template")

  const { templates, loading: templatesLoading } = usePerformance360Templates(tenantId)
  const { getEmployee } = useEmployees(tenantId)

  const [profileName, setProfileName] = useState<string | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [templateId, setTemplateId] = useState(templateFromQuery ?? "")

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

  useEffect(() => {
    setTemplateId((prev) => (templateFromQuery && templateFromQuery !== prev ? templateFromQuery : prev))
  }, [templateFromQuery])

  useEffect(() => {
    if (mock && DEMO_NAMES[profileId]) {
      setProfileName(DEMO_NAMES[profileId])
      setLoadingProfile(false)
      setProfileError(null)
      return
    }
    if (mock && !DEMO_NAMES[profileId]) {
      setProfileName("Demo karyawan")
      setLoadingProfile(false)
      return
    }
    let cancelled = false
    setLoadingProfile(true)
    setProfileError(null)
    void getEmployee(profileId)
      .then((row: any) => {
        if (cancelled) return
        const name = ((row?.full_name ?? "").trim() || row?.email || "Tanpa nama") as string
        const pos = row?.hr_positions
        const p = Array.isArray(pos) ? pos[0] : pos
        const posName = p?.name?.trim()
        setProfileName(posName ? `${name} — ${posName}` : name)
      })
      .catch(() => {
        if (cancelled) return
        setProfileError("Profil tidak ditemukan atau tidak ada akses.")
        setProfileName(DEMO_NAMES[profileId] ?? null)
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false)
      })
    return () => {
      cancelled = true
    }
  }, [getEmployee, profileId, mock])

  useEffect(() => {
    if (templatesLoading || templates.length === 0) return
    if (templateFromQuery && templates.some((t) => t.id === templateFromQuery)) return
    if (templateId && templates.some((t) => t.id === templateId)) return
    const active = templates.find((t) => t.status === "active") ?? templates[0]
    if (active) setTemplateId(active.id)
  }, [templates, templatesLoading, templateFromQuery, templateId])

  const selectedTemplate = templates.find((t) => t.id === templateId)
  const backHref =
    "/performance/360/dashboard" + (templateId ? `?template=${encodeURIComponent(templateId)}` : "")

  const replaceTemplateInUrl = useCallback((id: string) => {
    setTemplateId(id)
    if (typeof window === "undefined") return
    const u = new URL(window.location.href)
    u.searchParams.set("template", id)
    window.history.replaceState(null, "", `${u.pathname}${u.search}`)
  }, [])

  const periodLine = selectedTemplate
    ? `${formatTemplatePeriodLabel(selectedTemplate)} — ${selectedTemplate.name}`
    : "Pilih template"

  const weights = loadPerf360RaterWeights()

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

  const loadScores = useCallback(async () => {
    if (mock) {
      setScoreData(null)
      setScoreError(null)
      setScoreLoading(false)
      return
    }
    if (!insForge || !templateId) return
    setScoreLoading(true)
    setScoreError(null)
    try {
      const matrix = await fetchPerf360FormMatrixData(tenantId)
      const profiles = matrix?.profiles ?? []
      const settings = matrix?.settings ?? []

      const assignments = settings.length
        ? computePerf360Assignments(profiles, settings, null, { showAllForms: true })
        : []
      const expectedForAssessed = assignments.filter((a) => a.assessedId === profileId)
      const expectedSubordinate = expectedForAssessed.some((a) => a.kind === "subordinate")

      const submissions = await fetchPerf360SubmissionsForTemplate(tenantId, templateId)
      const relevantSubs = submissions.filter(
        (s) => s.assessed_user_profile_id === profileId && s.status === "submitted"
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

      const kindBySubmission = new Map<string, Perf360AssignmentKind>(
        relevantSubs.map((s) => [s.id, s.assignment_kind])
      )

      type Agg = { sum: number; wsum: number }
      const kindAgg: Record<Perf360AssignmentKind, Agg> = {
        self: { sum: 0, wsum: 0 },
        manager: { sum: 0, wsum: 0 },
        peer: { sum: 0, wsum: 0 },
        subordinate: { sum: 0, wsum: 0 },
      }
      const kindCounts: Record<Perf360AssignmentKind, number> = { self: 0, manager: 0, peer: 0, subordinate: 0 }
      for (const s of relevantSubs) kindCounts[s.assignment_kind] += 1

      // category -> kind -> agg
      const catAgg = new Map<string, Record<Perf360AssignmentKind, Agg>>()
      const ensureCat = (cat: string) => {
        const cur = catAgg.get(cat)
        if (cur) return cur
        const next: Record<Perf360AssignmentKind, Agg> = {
          self: { sum: 0, wsum: 0 },
          manager: { sum: 0, wsum: 0 },
          peer: { sum: 0, wsum: 0 },
          subordinate: { sum: 0, wsum: 0 },
        }
        catAgg.set(cat, next)
        return next
      }

      for (const row of (ansRows ?? []) as {
        submission_id: string
        question_id: string
        rating: number | null
      }[]) {
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

      // effective weights (subordinate -> peer if not expected)
      let wSelf = weights.self
      let wMgr = weights.manager
      let wPeer = weights.peer
      let wSub = weights.subordinate
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

      const categories = [...new Set((qrows ?? []).map((r: any) => String(r.category ?? "—")))].sort((a, b) =>
        a.localeCompare(b)
      )

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

        const vals = [cSelf, cMgr, cPeer, cSub].filter((x): x is number => typeof x === "number" && Number.isFinite(x))
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
          avgTone: (avg != null && avg < 3.8 ? "warn" : "neutral") as "warn" | "neutral",
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

      setScoreData({
        cards,
        rows,
        totalRow: { self: sSelf, atasan: sMgr, rekan: sPeer, bawahan: sSub, overall },
      })
    } catch (e) {
      setScoreError(e instanceof Error ? e.message : "Gagal menghitung skor")
      setScoreData(null)
    } finally {
      setScoreLoading(false)
    }
  }, [mock, profileId, templateId, tenantId, weights.manager, weights.peer, weights.self, weights.subordinate])

  useEffect(() => {
    void loadScores()
  }, [loadScores])

  return (
    <Performance360Shell
      title={
        loadingProfile ? "Memuat profil…" : profileError ? "Detail hasil 360" : profileName ?? "Karyawan"
      }
      subtitle={`${scoreData ? "Hasil penilaian (real data)" : "Hasil penilaian (demo UI)"} · ${periodLine}`}
      action={
        <Button variant="outline" size="sm" className="border-border text-foreground" asChild>
          <Link href={backHref}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Kembali ke daftar
          </Link>
        </Button>
      }
    >
      {profileError ? (
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {profileError} Tampilan di bawah tetap menggunakan contoh hingga profil dapat dimuat.
        </div>
      ) : null}

      <Card>
        <CardHeader className="space-y-2 pb-4">
          <CardTitle className="text-base text-foreground">Periode penilaian</CardTitle>
          <CardDescription className="text-muted-foreground">
            Mengganti template memperbarui query string; skor dihitung dari submission yang sudah submitted.
          </CardDescription>
          <Label className="text-xs text-muted-foreground">Template</Label>
          <Select
            value={templateId || undefined}
            onValueChange={replaceTemplateInUrl}
            disabled={templatesLoading || templates.length === 0}
          >
            <SelectTrigger className="max-w-xl border-border bg-background text-foreground">
              <SelectValue placeholder="Pilih template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {formatTemplatePeriodLabel(t)} — {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>

      {scoreLoading ? (
        <div className="flex items-center gap-2 rounded-lg border /80 px-4 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
          Menghitung skor…
        </div>
      ) : scoreError ? (
        <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {scoreError}
        </div>
      ) : null}

      <Perf360BehavioralCompetencies rows={behavioralRows} />
      <Perf360ResultsScoreMatrix data={scoreData} />
    </Performance360Shell>
  )
}
