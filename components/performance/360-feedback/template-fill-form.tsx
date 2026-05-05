"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  coercePerf360ReasonMode,
  perf360ReasonModeLabel,
} from "@/lib/performance-360-reason-mode"
import {
  perf360QuestionVisibleForRole,
  perf360RaterRoleLabel,
  type Perf360RaterRole,
} from "@/lib/performance-360-rater-role"
import type { Performance360TemplateQuestionRow } from "@/hooks/usePerformance360Templates"
import type { Perf360AssignmentKind } from "@/lib/perf360-assignments"
import {
  readPerf360Draft,
  writePerf360Draft,
  type Perf360DraftBundle,
  type Perf360StoredAnswer,
} from "@/lib/perf360-draft-storage"

function kindToActiveRaterRole(kind: Perf360AssignmentKind): Perf360RaterRole {
  switch (kind) {
    case "self":
      return "self"
    case "manager":
      return "manager"
    case "peer":
      return "peer"
    case "subordinate":
      return "subordinate"
    default:
      return "self"
  }
}

function initialAnswers(questions: Performance360TemplateQuestionRow[]): Record<string, Perf360StoredAnswer> {
  const o: Record<string, Perf360StoredAnswer> = {}
  for (const q of questions) o[q.id] = { rating: null, reason: "" }
  return o
}

function rowComplete(
  q: Performance360TemplateQuestionRow,
  a: Perf360StoredAnswer
): boolean {
  if (q.question_type !== "rating" && q.question_type !== "multiple_choice") return true
  if (a.rating == null) return false
  const mode = coercePerf360ReasonMode(q.reason_mode)
  if (mode === "required" && !a.reason.trim()) return false
  return true
}

function RatingRow({
  value,
  max,
  onChange,
}: {
  value: number | null
  max: number
  onChange: (n: number) => void
}) {
  const scale = Array.from({ length: max }, (_, i) => i + 1)
  return (
    <div className="flex flex-wrap gap-2">
      {scale.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={cn(
            "h-10 min-w-10 rounded-full border px-2 text-sm font-medium transition-colors",
            value === n
              ? "border-emerald-500 bg-emerald-600 text-white"
              : "border-slate-700 bg-slate-950 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400"
          )}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

type Props = {
  storageKey: string
  templateName: string
  scaleMax: number
  assessedName: string
  assignmentKind: Perf360AssignmentKind
  questions: Performance360TemplateQuestionRow[]
  onSaved?: () => void
}

export function Perf360TemplateFillForm({
  storageKey,
  templateName,
  scaleMax,
  assessedName,
  assignmentKind,
  questions,
  onSaved,
}: Props) {
  const activeRole = kindToActiveRaterRole(assignmentKind)
  const visibleQuestions = useMemo(
    () =>
      questions.filter(
        (q) =>
          (q.question_type === "rating" || q.question_type === "multiple_choice") &&
          perf360QuestionVisibleForRole(q.applies_to_role, activeRole)
      ),
    [questions, activeRole]
  )

  const [answers, setAnswers] = useState<Record<string, Perf360StoredAnswer>>(() =>
    initialAnswers(visibleQuestions)
  )
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    const existing = readPerf360Draft(storageKey)
    const base = initialAnswers(visibleQuestions)
    if (existing?.answers) {
      for (const q of visibleQuestions) {
        const ex = existing.answers[q.id]
        if (ex) base[q.id] = { rating: ex.rating, reason: ex.reason ?? "" }
      }
    }
    setAnswers(base)
  }, [storageKey, visibleQuestions])

  const flush = useCallback(
    (next: Record<string, Perf360StoredAnswer>, submittedAt: string | null) => {
      const bundle: Perf360DraftBundle = { answers: next, submittedAt }
      writePerf360Draft(storageKey, bundle)
      onSaved?.()
    },
    [storageKey, onSaved]
  )

  const setRating = (id: string, rating: number) => {
    setFormError(null)
    setAnswers((prev) => {
      const next = { ...prev, [id]: { ...prev[id], rating } }
      const sub = readPerf360Draft(storageKey)?.submittedAt ?? null
      flush(next, sub)
      return next
    })
  }

  const setReason = (id: string, reason: string) => {
    setFormError(null)
    setAnswers((prev) => {
      const next = { ...prev, [id]: { ...prev[id], reason } }
      const sub = readPerf360Draft(storageKey)?.submittedAt ?? null
      flush(next, sub)
      return next
    })
  }

  const done = visibleQuestions.filter((q) => rowComplete(q, answers[q.id] ?? { rating: null, reason: "" })).length
  const total = visibleQuestions.length
  const pct = total ? (done / total) * 100 : 0

  const validateSubmit = (): string | null => {
    for (const q of visibleQuestions) {
      const a = answers[q.id] ?? { rating: null, reason: "" }
      if (a.rating == null) {
        return `Pilih nilai untuk: "${q.question_text.slice(0, 56)}${q.question_text.length > 56 ? "…" : ""}"`
      }
      if (coercePerf360ReasonMode(q.reason_mode) === "required" && !a.reason.trim()) {
        return `Alasan wajib untuk pertanyaan yang dipilih.`
      }
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">{templateName}</p>
        <h2 className="text-lg font-semibold text-slate-100">Dinilai: {assessedName}</h2>
        <p className="text-sm text-slate-500">
          Peran Anda mengisi: <span className="text-slate-300">{perf360RaterRoleLabel(activeRole)}</span> — skala 1–
          {scaleMax}
        </p>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-slate-500">Progres</span>
        <span className="font-semibold text-emerald-400">{Math.round(pct)}%</span>
      </div>
      <Progress
        value={pct}
        className="h-2 max-w-md bg-slate-800 [&>[data-slot=progress-indicator]]:bg-cyan-500"
      />

      {formError ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">{formError}</p>
      ) : null}

      <Card className="border-slate-800 bg-slate-900">
        <CardHeader>
          <CardTitle className="text-base text-slate-100">Pertanyaan dari template</CardTitle>
          <CardDescription className="text-slate-500">
            Hanya tipe nilai &amp; multiple choice; filter <code className="text-cyan-500/90">applies_to_role</code>{" "}
            sesuai peran Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-10">
          {(() => {
            let lastSection = ""
            return visibleQuestions.map((q, idx) => {
              const mode = coercePerf360ReasonMode(q.reason_mode)
              const sec = q.section_title?.trim() ?? ""
              const showSection = sec && sec !== lastSection
              lastSection = sec || lastSection
              const a = answers[q.id] ?? { rating: null, reason: "" }
              return (
                <div key={q.id} className="space-y-3">
                  {showSection ? (
                    <h3 className="border-b border-slate-800 pb-2 text-sm font-semibold text-cyan-400/95">{sec}</h3>
                  ) : null}
                  <div className="space-y-3 pl-0 sm:pl-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-mono text-xs text-slate-500">{idx + 1}.</span>
                      <Label className="text-slate-200">{q.question_text}</Label>
                      {q.category ? (
                        <span className="text-xs text-slate-600">({q.category})</span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Alasan: {perf360ReasonModeLabel(mode)}
                    </p>
                    <RatingRow max={scaleMax} value={a.rating} onChange={(n) => setRating(q.id, n)} />
                    {mode !== "none" ? (
                      <div className="space-y-2 pt-1">
                        <Label className="text-slate-200">
                          Alasan / komentar
                          {mode === "required" ? <span className="text-red-400"> *</span> : null}
                        </Label>
                        <Textarea
                          value={a.reason}
                          onChange={(e) => setReason(q.id, e.target.value)}
                          rows={3}
                          className="border-slate-800 bg-slate-950 text-slate-100"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })
          })()}
          {visibleQuestions.length === 0 ? (
            <p className="text-sm text-slate-500">
              Tidak ada pertanyaan nilai untuk peran ini pada template — cek pengaturan template atau mapping penilai.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-3">
        <Button
          variant="outline"
          type="button"
          className="border-slate-700"
          onClick={() => {
            const sub = readPerf360Draft(storageKey)?.submittedAt ?? null
            flush(answers, sub)
          }}
        >
          Simpan draf
        </Button>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          type="button"
          onClick={() => {
            const err = validateSubmit()
            if (err) {
              setFormError(err)
              return
            }
            setFormError(null)
            const ts = new Date().toISOString()
            flush(answers, ts)
          }}
        >
          Tandai selesai (lokal)
        </Button>
      </div>
      <p className="text-xs text-slate-600">
        Penyimpanan sementara di perangkat ini. Tabel submission 360 di backend akan menggantikan localStorage ketika
        tersedia.
      </p>
    </div>
  )
}
