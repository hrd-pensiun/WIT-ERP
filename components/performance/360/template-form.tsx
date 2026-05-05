"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Copy, Loader2, Plus, Trash2 } from "lucide-react"
import {
  DEFAULT_ASSESSMENT_CATEGORIES,
  ASSESSMENT_CATEGORIES_UPDATED_EVENT,
  loadAssessmentCategories,
} from "@/components/performance/360/assessment-categories-storage"
import { Performance360Shell } from "@/components/performance/360/shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  getPerformance360TemplateDetail,
  type Performance360TemplateQuestionRow,
  type Perf360ReasonMode,
  usePerformance360Templates,
} from "@/hooks/usePerformance360Templates"
import {
  PERF360_REASON_MODE_OPTIONS,
  coercePerf360ReasonMode,
  perf360ReasonAppliesToDbQuestionType,
} from "@/lib/performance-360-reason-mode"
import {
  PERF360_RATER_ROLE_OPTIONS,
  coercePerf360RaterRole,
  type Perf360RaterRole,
} from "@/lib/performance-360-rater-role"

const QUESTION_TYPES = ["Rating", "Text", "Multiple Choice"] as const

const PERIOD_KINDS = [
  { value: "Q1", label: "Triwulan I (Q1)" },
  { value: "Q2", label: "Triwulan II (Q2)" },
  { value: "Q3", label: "Triwulan III (Q3)" },
  { value: "Q4", label: "Triwulan IV (Q4)" },
  { value: "S1", label: "Semester 1" },
  { value: "S2", label: "Semester 2" },
  { value: "annual", label: "Tahunan" },
  { value: "custom", label: "Custom / lainnya" },
] as const

type PeriodKind = (typeof PERIOD_KINDS)[number]["value"]

const VALID_PERIOD_KINDS = new Set<string>(PERIOD_KINDS.map((p) => p.value))

function coercePeriodKind(value: string): PeriodKind {
  return (VALID_PERIOD_KINDS.has(value) ? value : "Q1") as PeriodKind
}

function dbQuestionTypeToUi(db: string): (typeof QUESTION_TYPES)[number] {
  if (db === "text") return "Text"
  if (db === "multiple_choice") return "Multiple Choice"
  return "Rating"
}

function mapQuestionType(ui: (typeof QUESTION_TYPES)[number]): "rating" | "text" | "multiple_choice" {
  if (ui === "Rating") return "rating"
  if (ui === "Text") return "text"
  return "multiple_choice"
}

type QuestionRow = {
  id: string
  text: string
  category: string
  questionType: (typeof QUESTION_TYPES)[number]
  weight: string
  /** Hanya untuk rating / pilihan ganda */
  reasonMode: Perf360ReasonMode
  appliesToRole: Perf360RaterRole
}

type SectionBlock = {
  id: string
  title: string
  questions: QuestionRow[]
}

function normalizeSectionTitleForDb(title: string): string | null {
  const t = title.trim()
  return t.length ? t : null
}

function buildSectionsFromDetailQuestions(rows: Performance360TemplateQuestionRow[]): SectionBlock[] {
  const sorted = [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  if (!sorted.length) {
    return [{ id: crypto.randomUUID(), title: "", questions: [newQuestion()] }]
  }
  const sections: SectionBlock[] = []
  let currentKey: string | null = null
  let block: SectionBlock | null = null
  for (const q of sorted) {
    const keyRaw = q.section_title?.trim() ?? ""
    if (!block || currentKey !== keyRaw) {
      currentKey = keyRaw
      block = { id: crypto.randomUUID(), title: keyRaw, questions: [] }
      sections.push(block)
    }
    const qt = dbQuestionTypeToUi(q.question_type)
    block.questions.push({
      id: q.id,
      text: q.question_text,
      category: q.category,
      questionType: qt,
      weight: String(q.weight ?? 1),
      reasonMode: perf360ReasonAppliesToDbQuestionType(q.question_type)
        ? coercePerf360ReasonMode(q.reason_mode)
        : "none",
      appliesToRole: coercePerf360RaterRole(q.applies_to_role),
    })
  }
  return sections
}

function newQuestion(partial?: Partial<QuestionRow>, defaultCategory?: string): QuestionRow {
  const cat =
    partial?.category ??
    (defaultCategory ?? DEFAULT_ASSESSMENT_CATEGORIES[0])
  return {
    id: crypto.randomUUID(),
    text: partial?.text ?? "",
    category: cat,
    questionType: partial?.questionType ?? "Rating",
    weight: partial?.weight ?? "1.0",
    reasonMode: partial?.reasonMode ?? "none",
    appliesToRole: partial?.appliesToRole ?? "all",
  }
}

export function Template360Form(props?: { templateId?: string }) {
  const templateId = props?.templateId
  const router = useRouter()
  const isEdit = Boolean(templateId)
  const { createTemplate, updateTemplate, error: hookError, loading: savingRemote } = usePerformance360Templates(
    undefined,
    { loadOnMount: false }
  )
  const [bootLoading, setBootLoading] = useState(isEdit)
  const [detailLoadError, setDetailLoadError] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>(() => [...DEFAULT_ASSESSMENT_CATEGORIES])
  const [templateName, setTemplateName] = useState("")
  const [templateDesc, setTemplateDesc] = useState("")
  const [templateStatus, setTemplateStatus] = useState<"draft" | "active">("draft")
  const [periodKind, setPeriodKind] = useState<PeriodKind>("Q1")
  const [periodYear, setPeriodYear] = useState("2026")
  const [periodCustomLabel, setPeriodCustomLabel] = useState("")
  const [periodStart, setPeriodStart] = useState("")
  const [periodEnd, setPeriodEnd] = useState("")
  const [ratingScale, setRatingScale] = useState("5")
  const [sections, setSections] = useState<SectionBlock[]>(() => [
    {
      id: crypto.randomUUID(),
      title: "",
      questions: [
        newQuestion({
          text: "Demonstrasi keterampilan teknis yang kuat",
          category: DEFAULT_ASSESSMENT_CATEGORIES[0],
          weight: "1.0",
        }),
      ],
    },
  ])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const refreshCategories = () => setCategories(loadAssessmentCategories())
    refreshCategories()
    window.addEventListener(ASSESSMENT_CATEGORIES_UPDATED_EVENT, refreshCategories)
    return () => window.removeEventListener(ASSESSMENT_CATEGORIES_UPDATED_EVENT, refreshCategories)
  }, [])

  useEffect(() => {
    if (!templateId) {
      setBootLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setBootLoading(true)
      setDetailLoadError(null)
      const detail = await getPerformance360TemplateDetail(templateId)
      if (cancelled) return
      if (!detail) {
        setDetailLoadError("Template tidak ditemukan.")
        setBootLoading(false)
        return
      }
      setTemplateName(detail.name)
      setTemplateDesc(detail.description ?? "")
      setTemplateStatus(detail.status)
      setPeriodKind(coercePeriodKind(detail.period_kind))
      setPeriodYear(detail.period_year != null ? String(detail.period_year) : "")
      setPeriodCustomLabel(detail.period_custom_label ?? "")
      setPeriodStart(detail.period_start?.slice(0, 10) ?? "")
      setPeriodEnd(detail.period_end?.slice(0, 10) ?? "")
      setRatingScale(String(detail.rating_scale_max ?? 5))
      setSections(buildSectionsFromDetailQuestions(detail.performance_360_template_questions))
      setBootLoading(false)
    })().catch(() => {
      if (!cancelled) {
        setDetailLoadError("Gagal memuat template.")
        setBootLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [templateId])

  useEffect(() => {
    const fallback = categories[0] ?? DEFAULT_ASSESSMENT_CATEGORIES[0]
    setSections((prev) =>
      prev.map((sec) => ({
        ...sec,
        questions: sec.questions.map((row) =>
          categories.includes(row.category) ? row : { ...row, category: fallback }
        ),
      }))
    )
  }, [categories])

  const addQuestionToSection = useCallback(
    (sectionId: string) => {
      const def = categories[0] ?? DEFAULT_ASSESSMENT_CATEGORIES[0]
      setSections((secs) =>
        secs.map((s) =>
          s.id === sectionId ? { ...s, questions: [...s.questions, newQuestion(undefined, def)] } : s
        )
      )
    },
    [categories]
  )

  const addSection = useCallback(() => {
    const def = categories[0] ?? DEFAULT_ASSESSMENT_CATEGORIES[0]
    setSections((s) => [
      ...s,
      { id: crypto.randomUUID(), title: "Bagian baru", questions: [newQuestion(undefined, def)] },
    ])
  }, [categories])

  const removeSection = useCallback((sectionId: string) => {
    setSections((prev) => {
      if (prev.length <= 1) return prev
      const i = prev.findIndex((s) => s.id === sectionId)
      if (i < 0) return prev
      const removed = prev[i]
      const rest = prev.filter((_, j) => j !== i)
      if (rest.length === 0) return prev
      if (i === 0) {
        const first = rest[0]
        return [{ ...first, questions: [...removed.questions, ...first.questions] }, ...rest.slice(1)]
      }
      const prevSec = rest[i - 1]
      const merged = [...rest.slice(0, i - 1), { ...prevSec, questions: [...prevSec.questions, ...removed.questions] }, ...rest.slice(i)]
      return merged
    })
  }, [])

  const removeQuestion = useCallback((sectionId: string, qid: string) => {
    setSections((prev) => {
      const total = prev.reduce((n, s) => n + s.questions.length, 0)
      if (total <= 1) return prev
      const mapped = prev.map((s) =>
        s.id !== sectionId
          ? s
          : { ...s, questions: s.questions.filter((q) => q.id !== qid) }
      )
      const filtered = mapped.filter((s) => s.questions.length > 0)
      return filtered.length === 0 ? prev : filtered
    })
  }, [])

  const duplicateQuestion = useCallback((sectionId: string, qid: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s
        const i = s.questions.findIndex((q) => q.id === qid)
        if (i < 0) return s
        const src = s.questions[i]
        const row: QuestionRow = {
          ...src,
          id: crypto.randomUUID(),
        }
        const questions = [...s.questions.slice(0, i + 1), row, ...s.questions.slice(i + 1)]
        return { ...s, questions }
      })
    )
  }, [])

  const updateSectionTitle = useCallback((sectionId: string, title: string) => {
    setSections((secs) => secs.map((s) => (s.id === sectionId ? { ...s, title } : s)))
  }, [])

  const updateQuestion = useCallback((sectionId: string, qid: string, patch: Partial<QuestionRow>) => {
    setSections((secs) =>
      secs.map((s) =>
        s.id === sectionId
          ? { ...s, questions: s.questions.map((row) => (row.id === qid ? { ...row, ...patch } : row)) }
          : s
      )
    )
  }, [])

  const firstCategory = categories[0] ?? DEFAULT_ASSESSMENT_CATEGORIES[0]

  const persistPayload = () => {
    const py = parseInt(periodYear, 10)
    const scaleMax = parseInt(ratingScale, 10)
    return {
      name: templateName.trim(),
      description: templateDesc.trim() || null,
      period_kind: periodKind,
      period_year: Number.isFinite(py) ? py : null,
      period_custom_label: periodCustomLabel.trim() || null,
      period_start: periodStart || null,
      period_end: periodEnd || null,
      rating_scale_max: Number.isFinite(scaleMax) ? scaleMax : 5,
      status: templateStatus,
      questions: sections.flatMap((sec) => {
        const sectionTitle = normalizeSectionTitleForDb(sec.title)
        return sec.questions.map((q) => {
          const qt = mapQuestionType(q.questionType)
          return {
            question_text: q.text,
            category: q.category,
            question_type: qt,
            weight: Math.min(2, Math.max(0, parseFloat(q.weight) || 1)),
            section_title: sectionTitle,
            reason_mode:
              qt === "text" ? ("none" as const) : coercePerf360ReasonMode(q.reasonMode),
            applies_to_role: coercePerf360RaterRole(q.appliesToRole),
          }
        })
      }),
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = persistPayload()
      if (isEdit && templateId) {
        await updateTemplate(templateId, payload)
        router.push(`/performance/360/template/${templateId}`)
      } else {
        await createTemplate(payload)
        router.push("/performance/360/template")
      }
    } catch {
      /* hookError */
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (isEdit && templateId) {
      setBootLoading(true)
      setDetailLoadError(null)
      try {
        const detail = await getPerformance360TemplateDetail(templateId)
        if (!detail) {
          setDetailLoadError("Template tidak ditemukan.")
          setBootLoading(false)
          return
        }
        setTemplateName(detail.name)
        setTemplateDesc(detail.description ?? "")
        setTemplateStatus(detail.status)
        setPeriodKind(coercePeriodKind(detail.period_kind))
        setPeriodYear(detail.period_year != null ? String(detail.period_year) : "")
        setPeriodCustomLabel(detail.period_custom_label ?? "")
        setPeriodStart(detail.period_start?.slice(0, 10) ?? "")
        setPeriodEnd(detail.period_end?.slice(0, 10) ?? "")
        setRatingScale(String(detail.rating_scale_max ?? 5))
        setSections(buildSectionsFromDetailQuestions(detail.performance_360_template_questions))
      } catch {
        setDetailLoadError("Gagal memuat ulang template.")
      } finally {
        setBootLoading(false)
      }
      return
    }
    setTemplateName("")
    setTemplateDesc("")
    setTemplateStatus("draft")
    setPeriodKind("Q1")
    setPeriodYear("2026")
    setPeriodCustomLabel("")
    setPeriodStart("")
    setPeriodEnd("")
    setRatingScale("5")
    setSections([{ id: crypto.randomUUID(), title: "", questions: [newQuestion(undefined, firstCategory)] }])
  }

  const savingBusy = saving || savingRemote || bootLoading

  if (isEdit && bootLoading) {
    return (
      <Performance360Shell
        title="Edit template penilaian"
        subtitle="Memuat data…"
        backHref={templateId ? `/performance/360/template/${templateId}` : "/performance/360/template"}
      >
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
        </div>
      </Performance360Shell>
    )
  }

  if (isEdit && detailLoadError) {
    return (
      <Performance360Shell
        title="Edit template penilaian"
        backHref="/performance/360/template"
      >
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {detailLoadError}
        </div>
      </Performance360Shell>
    )
  }

  return (
    <Performance360Shell
      title={isEdit ? "Edit template penilaian" : "Buat template penilaian"}
      subtitle="Tenant ID diisi otomatis di backend (NEXT_PUBLIC_TENANT_ID atau fallback); Anda tidak perlu memasukkannya."
      backHref={isEdit && templateId ? `/performance/360/template/${templateId}` : "/performance/360/template"}
      action={
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          type="button"
          onClick={() => void handleSave()}
          disabled={savingBusy}
        >
          {savingBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? "Simpan perubahan" : "Simpan template"}
        </Button>
      }
    >
      {hookError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {hookError}
        </div>
      )}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100 text-lg border-b border-slate-800 pb-2">
            Informasi template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-200">Nama template</Label>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Contoh: Annual Review 2024"
              className="bg-slate-950 border-slate-800 text-slate-100"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-200">Deskripsi</Label>
            <Textarea
              value={templateDesc}
              onChange={(e) => setTemplateDesc(e.target.value)}
              placeholder="Jelaskan tujuan penilaian ini..."
              rows={3}
              className="bg-slate-950 border-slate-800 text-slate-100"
            />
          </div>

          <div className="space-y-2 max-w-md">
            <Label className="text-slate-200">Status</Label>
            <Select
              value={templateStatus}
              onValueChange={(v) => setTemplateStatus(v as "draft" | "active")}
            >
              <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-200">Periode penilaian</p>
              <p className="text-xs text-slate-500 mt-1">
                Digunakan saat menjalankan siklus 360 — filter matrix dan laporan dapat mengikuti periode ini.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-200">Jenis periode</Label>
                <Select value={periodKind} onValueChange={(v) => setPeriodKind(v as PeriodKind)}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    {PERIOD_KINDS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Tahun</Label>
                <Input
                  type="number"
                  min={2000}
                  max={2100}
                  value={periodYear}
                  onChange={(e) => setPeriodYear(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100"
                />
              </div>
            </div>
            {periodKind === "custom" && (
              <div className="space-y-2">
                <Label className="text-slate-200">Nama periode</Label>
                <Input
                  value={periodCustomLabel}
                  onChange={(e) => setPeriodCustomLabel(e.target.value)}
                  placeholder="Contoh: Proyek Alpha — Wave 2"
                  className="bg-slate-950 border-slate-800 text-slate-100"
                />
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-200">Tanggal mulai pelaksanaan</Label>
                <Input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Tanggal selesai pelaksanaan</Label>
                <Input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 max-w-md">
            <Label className="text-slate-200">Skala rating</Label>
            <Select value={ratingScale} onValueChange={setRatingScale}>
              <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="5">1–5 (Sangat tidak setuju — Sangat setuju)</SelectItem>
                <SelectItem value="10">1–10 (Numerik)</SelectItem>
                <SelectItem value="4">1–4 (Skala Likert)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100 text-lg border-b border-emerald-500/40 pb-2">
            Pertanyaan penilaian
          </CardTitle>
          <CardDescription className="text-slate-500">
            Kelompokkan pertanyaan ke dalam bagian (mis. &quot;Assessment A&quot;). Kosongkan judul bagian jika tidak perlu
            heading. Pilihan kategori diambil dari{" "}
            <span className="text-slate-400">Performance 360 → Konfigurasi</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {(() => {
            let globalQuestionIndex = 0
            return sections.map((sec, secIdx) => (
              <div
                key={sec.id}
                className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4"
              >
                <div className="flex flex-wrap items-end gap-3 border-b border-slate-800/80 pb-4">
                  <div className="min-w-[200px] flex-1 space-y-2">
                    <Label className="text-slate-200">Judul bagian</Label>
                    <Input
                      value={sec.title}
                      onChange={(e) => updateSectionTitle(sec.id, e.target.value)}
                      placeholder='Contoh: Assessment A (opsional)'
                      className="bg-slate-950 border-slate-800 text-slate-100"
                    />
                    <p className="text-xs text-slate-500">
                      Pertanyaan di bawah disimpan sebagai satu blok dengan judul ini.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-red-900/60 text-red-400 hover:bg-red-500/10"
                    disabled={sections.length <= 1}
                    onClick={() => removeSection(sec.id)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Hapus bagian
                  </Button>
                </div>

                {sec.questions.map((q) => {
                  globalQuestionIndex += 1
                  const idx = globalQuestionIndex
                  const totalQs = sections.reduce((n, s) => n + s.questions.length, 0)
                  return (
                    <div
                      key={q.id}
                      className={cn(
                        "rounded-lg border border-slate-800 p-4 space-y-4",
                        "bg-slate-950/50"
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium text-emerald-400">Pertanyaan {idx}</span>
                        <div className="flex flex-wrap items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                            onClick={() => duplicateQuestion(sec.id, q.id)}
                            title="Duplikat pertanyaan (salin ke baris berikutnya di bagian ini)"
                          >
                            <Copy className="mr-1 h-4 w-4" />
                            Duplikat
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            onClick={() => removeQuestion(sec.id, q.id)}
                            disabled={totalQs <= 1}
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Hapus
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-slate-200">Pertanyaan</Label>
                          <Input
                            value={q.text}
                            onChange={(e) => updateQuestion(sec.id, q.id, { text: e.target.value })}
                            placeholder="Masukkan pertanyaan..."
                            className="border-slate-800 bg-slate-950 text-slate-100"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-200">Kategori</Label>
                          <Select
                            value={categories.includes(q.category) ? q.category : firstCategory}
                            onValueChange={(v) => updateQuestion(sec.id, q.id, { category: v })}
                          >
                            <SelectTrigger className="border-slate-800 bg-slate-950 text-slate-100">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-slate-800 bg-slate-900">
                              {categories.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-200">Tipe pertanyaan</Label>
                          <Select
                            value={q.questionType}
                            onValueChange={(v) => {
                              const qt = v as QuestionRow["questionType"]
                              updateQuestion(sec.id, q.id, {
                                questionType: qt,
                                ...(qt === "Text" ? { reasonMode: "none" as const } : {}),
                              })
                            }}
                          >
                            <SelectTrigger className="border-slate-800 bg-slate-950 text-slate-100">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-slate-800 bg-slate-900">
                              {QUESTION_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-200">Bobot (weight)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={2}
                            step={0.1}
                            value={q.weight}
                            onChange={(e) => updateQuestion(sec.id, q.id, { weight: e.target.value })}
                            className="border-slate-800 bg-slate-950 text-slate-100"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-slate-200">Tampil untuk peran penilai</Label>
                          <Select
                            value={q.appliesToRole}
                            onValueChange={(v) =>
                              updateQuestion(sec.id, q.id, {
                                appliesToRole: coercePerf360RaterRole(v),
                              })
                            }
                          >
                            <SelectTrigger className="border-slate-800 bg-slate-950 text-slate-100">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-slate-800 bg-slate-900">
                              {PERF360_RATER_ROLE_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-slate-500">
                            {
                              PERF360_RATER_ROLE_OPTIONS.find((o) => o.value === q.appliesToRole)
                                ?.description
                            }
                          </p>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-slate-200">Alasan tambahan</Label>
                          {q.questionType === "Text" ? (
                            <p className="rounded-md border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-500 leading-relaxed">
                              Untuk tipe teks bebas tidak berlaku — jawaban responden sudah berupa narasi penuh.
                            </p>
                          ) : (
                            <>
                              <Select
                                value={q.reasonMode}
                                onValueChange={(v) =>
                                  updateQuestion(sec.id, q.id, {
                                    reasonMode: coercePerf360ReasonMode(v),
                                  })
                                }
                              >
                                <SelectTrigger className="border-slate-800 bg-slate-950 text-slate-100">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-slate-800 bg-slate-900">
                                  {PERF360_REASON_MODE_OPTIONS.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                      {o.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-slate-500">
                                {
                                  PERF360_REASON_MODE_OPTIONS.find((o) => o.value === q.reasonMode)
                                    ?.description
                                }
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-700 text-slate-200"
                  onClick={() => addQuestionToSection(sec.id)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah pertanyaan di bagian ini
                </Button>

                {secIdx < sections.length - 1 ? (
                  <div className="border-t border-dashed border-slate-800 pt-2" aria-hidden />
                ) : null}
              </div>
            ))
          })()}

          <Button type="button" variant="outline" className="border-emerald-800/80 text-emerald-200" onClick={addSection}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah bagian
          </Button>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-800">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              type="button"
              onClick={() => void handleSave()}
              disabled={savingBusy}
            >
              {savingBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Simpan template
            </Button>
            <Button type="button" variant="secondary" className="bg-slate-800 text-slate-100" onClick={handleReset}>
              Reset form
            </Button>
          </div>
        </CardContent>
      </Card>
    </Performance360Shell>
  )
}
