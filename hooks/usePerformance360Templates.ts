import { useCallback, useEffect, useState } from "react"
import { insForge } from "@/lib/insforge"
import { coercePerf360ReasonMode, type Perf360ReasonMode } from "@/lib/performance-360-reason-mode"
import { getTenantId } from "@/lib/tenant"

export type { Perf360ReasonMode }

/** Baris pertanyaan dari DB (`select *`). */
export type Performance360TemplateQuestionRow = {
  id: string
  template_id: string
  sort_order: number
  question_text: string
  category: string
  question_type: string
  weight: number | string
  section_title?: string | null
  reason_mode?: string | null
}

export type Performance360TemplateRow = {
  id: string
  tenant_id: string
  name: string
  description: string | null
  period_kind: string
  period_year: number | null
  period_custom_label: string | null
  period_start: string | null
  period_end: string | null
  rating_scale_max: number
  status: "draft" | "active"
  created_at?: string
  updated_at?: string
  performance_360_template_questions?: { id: string }[] | Performance360TemplateQuestionRow[] | null
}

/** Template satu baris lengkap untuk preview / edit. */
export type Performance360TemplateDetail = Omit<Performance360TemplateRow, "performance_360_template_questions"> & {
  performance_360_template_questions: Performance360TemplateQuestionRow[]
}

export async function getPerformance360TemplateDetail(
  id: string,
  tenantId: string = getTenantId()
): Promise<Performance360TemplateDetail | null> {
  if (!insForge) return null
  const { data, error } = await insForge
    .from("performance_360_templates")
    .select("*, performance_360_template_questions (*)")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle()
  if (error || !data) return null
  const row = data as Performance360TemplateRow & {
    performance_360_template_questions?: Performance360TemplateQuestionRow[] | null
  }
  const raw = row.performance_360_template_questions ?? []
  const questions = [...raw].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  const { performance_360_template_questions: _omit, ...rest } = row
  return { ...rest, performance_360_template_questions: questions }
}

export type TemplateQuestionInput = {
  question_text: string
  category: string
  question_type: "rating" | "text" | "multiple_choice"
  weight: number
  /** Judul blok (mis. "Assessment A"); null/omit = tidak pakai nama bagian */
  section_title?: string | null
  /** Alasan tambahan untuk rating/multiple_choice; teks diabaikan di UI */
  reason_mode: Perf360ReasonMode
}

export type CreatePerformance360TemplateInput = {
  name: string
  description: string | null
  period_kind: string
  period_year: number | null
  period_custom_label: string | null
  period_start: string | null
  period_end: string | null
  rating_scale_max: number
  status: "draft" | "active"
  questions: TemplateQuestionInput[]
}

/** Label periode untuk tabel / ringkasan — tidak perlu tenant_id di pemanggil. */
export function formatTemplatePeriodLabel(t: Pick<
  Performance360TemplateRow,
  "period_kind" | "period_year" | "period_custom_label" | "period_start" | "period_end"
>): string {
  if (t.period_start && t.period_end) {
    const a = new Date(t.period_start).toLocaleDateString("id-ID")
    const b = new Date(t.period_end).toLocaleDateString("id-ID")
    return `${a} – ${b}`
  }
  if (t.period_kind === "custom" && t.period_custom_label?.trim()) {
    return t.period_custom_label.trim()
  }
  const y = t.period_year != null ? String(t.period_year) : ""
  if (t.period_kind === "annual") {
    return y ? `Tahunan ${y}` : "Tahunan"
  }
  if (t.period_kind === "Q1" || t.period_kind === "Q2" || t.period_kind === "Q3" || t.period_kind === "Q4") {
    return y ? `${t.period_kind} ${y}` : t.period_kind
  }
  if (t.period_kind === "S1" || t.period_kind === "S2") {
    return y ? `${t.period_kind} ${y}` : t.period_kind
  }
  return [t.period_kind, y].filter(Boolean).join(" ").trim() || "—"
}

export function usePerformance360Templates(
  tenantId: string = getTenantId(),
  options?: { loadOnMount?: boolean }
) {
  const loadOnMount = options?.loadOnMount !== false
  const [templates, setTemplates] = useState<Performance360TemplateRow[]>([])
  const [loading, setLoading] = useState(() => loadOnMount)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    if (!insForge) {
      setError("Database not connected")
      setTemplates([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, error: apiError } = await insForge
        .from("performance_360_templates")
        .select("*, performance_360_template_questions (id)")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
      if (apiError) throw apiError
      setTemplates((data as Performance360TemplateRow[]) ?? [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memuat template 360"
      setError(msg)
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    if (loadOnMount) void fetchTemplates()
  }, [fetchTemplates, loadOnMount])

  const createTemplate = useCallback(
    async (input: CreatePerformance360TemplateInput): Promise<Performance360TemplateRow> => {
      if (!insForge) {
        const e = new Error("Database not connected")
        setError(e.message)
        throw e
      }
      if (!input.name.trim()) {
        const e = new Error("Nama template wajib diisi")
        setError(e.message)
        throw e
      }
      if (!input.questions.length) {
        const e = new Error("Minimal satu pertanyaan")
        setError(e.message)
        throw e
      }
      for (const q of input.questions) {
        if (!q.question_text.trim()) {
          const e = new Error("Setiap pertanyaan harus berisi teks")
          setError(e.message)
          throw e
        }
      }

      setError(null)
      const now = new Date().toISOString()
      const { data: inserted, error: insErr } = await insForge
        .from("performance_360_templates")
        .insert({
          tenant_id: tenantId,
          name: input.name.trim(),
          description: input.description?.trim() || null,
          period_kind: input.period_kind,
          period_year: input.period_year,
          period_custom_label: input.period_custom_label?.trim() || null,
          period_start: input.period_start || null,
          period_end: input.period_end || null,
          rating_scale_max: input.rating_scale_max,
          status: input.status,
          updated_at: now,
        })
        .select()
        .single()

      if (insErr) {
        setError(insErr.message)
        throw insErr
      }
      const row = inserted as Performance360TemplateRow
      const qRows = input.questions.map((q, i) => ({
        template_id: row.id,
        sort_order: i + 1,
        section_title: q.section_title?.trim() ? q.section_title.trim() : null,
        reason_mode: coercePerf360ReasonMode(q.reason_mode),
        question_text: q.question_text.trim(),
        category: q.category,
        question_type: q.question_type,
        weight: q.weight,
      }))

      const { error: qErr } = await insForge.from("performance_360_template_questions").insert(qRows)
      if (qErr) {
        await insForge.from("performance_360_templates").delete().eq("id", row.id).eq("tenant_id", tenantId)
        setError(qErr.message)
        throw qErr
      }

      await fetchTemplates()
      return row
    },
    [tenantId, fetchTemplates]
  )

  const updateTemplate = useCallback(
    async (id: string, input: CreatePerformance360TemplateInput): Promise<Performance360TemplateDetail | null> => {
      if (!insForge) {
        const e = new Error("Database not connected")
        setError(e.message)
        throw e
      }
      if (!input.name.trim()) {
        const e = new Error("Nama template wajib diisi")
        setError(e.message)
        throw e
      }
      if (!input.questions.length) {
        const e = new Error("Minimal satu pertanyaan")
        setError(e.message)
        throw e
      }
      for (const q of input.questions) {
        if (!q.question_text.trim()) {
          const e = new Error("Setiap pertanyaan harus berisi teks")
          setError(e.message)
          throw e
        }
      }

      setError(null)
      const now = new Date().toISOString()
      const { error: upErr } = await insForge
        .from("performance_360_templates")
        .update({
          name: input.name.trim(),
          description: input.description?.trim() || null,
          period_kind: input.period_kind,
          period_year: input.period_year,
          period_custom_label: input.period_custom_label?.trim() || null,
          period_start: input.period_start || null,
          period_end: input.period_end || null,
          rating_scale_max: input.rating_scale_max,
          status: input.status,
          updated_at: now,
        })
        .eq("id", id)
        .eq("tenant_id", tenantId)

      if (upErr) {
        setError(upErr.message)
        throw upErr
      }

      const { error: delQ } = await insForge
        .from("performance_360_template_questions")
        .delete()
        .eq("template_id", id)
      if (delQ) {
        setError(delQ.message)
        throw delQ
      }

      const qRows = input.questions.map((q, i) => ({
        template_id: id,
        sort_order: i + 1,
        section_title: q.section_title?.trim() ? q.section_title.trim() : null,
        reason_mode: coercePerf360ReasonMode(q.reason_mode),
        question_text: q.question_text.trim(),
        category: q.category,
        question_type: q.question_type,
        weight: q.weight,
      }))
      const { error: qIns } = await insForge.from("performance_360_template_questions").insert(qRows)
      if (qIns) {
        setError(qIns.message)
        throw qIns
      }

      await fetchTemplates()
      return await getPerformance360TemplateDetail(id, tenantId)
    },
    [tenantId, fetchTemplates]
  )

  const deleteTemplate = useCallback(
    async (id: string) => {
      if (!insForge) {
        setError("Database not connected")
        throw new Error("Database not connected")
      }
      setError(null)
      const { error: delErr } = await insForge
        .from("performance_360_templates")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId)
      if (delErr) {
        setError(delErr.message)
        throw delErr
      }
      await fetchTemplates()
    },
    [tenantId, fetchTemplates]
  )

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  }
}
