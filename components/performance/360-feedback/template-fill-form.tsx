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
import { Perf360FormGuidance } from "@/components/performance/360-feedback/form360-guidance"
import { loadPerf360DraftFromServer, submitPerf360ToDatabase } from "@/lib/perf360-submissions"
import { isMockMode } from "@/lib/insforge"
import { CheckCircle2, Loader2 } from "lucide-react"

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
  disabled,
}: {
  value: number | null
  max: number
  onChange: (n: number) => void
  disabled?: boolean
}) {
  const scale = Array.from({ length: max }, (_, i) => i + 1)
  return (
    <div className={cn("flex flex-wrap gap-2", disabled && "pointer-events-none opacity-50")}>
      {scale.map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
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
  /** Nama / konteks penilai dari roster (opsional). */
  raterContextLine?: string | null
  onSaved?: () => void
  /** Setelah baris tersimpan di `performance_360_submissions` (refresh status list). */
  onServerSubmitted?: () => void
  tenantId: string
  templateId: string
  assignmentKey: string
  raterUserProfileId: string
  assessedUserProfileId: string
}

export function Perf360TemplateFillForm({
  storageKey,
  templateName,
  scaleMax,
  assessedName,
  assignmentKind,
  questions,
  raterContextLine,
  onSaved,
  onServerSubmitted,
  tenantId,
  templateId,
  assignmentKey,
  raterUserProfileId,
  assessedUserProfileId,
}: Props) {
  const activeRole = kindToActiveRaterRole(assignmentKind)
  const formattedDate = useMemo(
    () =>
      new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    []
  )
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
  const [hydrating, setHydrating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  /** Setelah POST DB sukses — tampilkan konfirmasi ke pengguna. */
  const [submitOk, setSubmitOk] = useState<{
    atLabel: string
    answerCount: number
  } | null>(null)

  const visibleQuestionKey = useMemo(
    () =>
      [...visibleQuestions]
        .map((q) => q.id)
        .sort()
        .join(","),
    [visibleQuestions]
  )

  useEffect(() => {
    setSubmitOk(null)
    setFormError(null)
  }, [assignmentKey, storageKey])

  useEffect(() => {
    const buildLocalBase = (): Record<string, Perf360StoredAnswer> => {
      const existing = readPerf360Draft(storageKey)
      const base = initialAnswers(visibleQuestions)
      if (existing?.answers) {
        for (const q of visibleQuestions) {
          const ex = existing.answers[q.id]
          if (ex) base[q.id] = { rating: ex.rating, reason: ex.reason ?? "" }
        }
      }
      return base
    }

    let cancelled = false
    const local = buildLocalBase()
    setAnswers(local)

    if (isMockMode() || !tenantId || !templateId || !assignmentKey) {
      setHydrating(false)
      return
    }

    setHydrating(true)
    ;(async () => {
      try {
        const remote = await loadPerf360DraftFromServer({
          tenantId,
          templateId,
          assignmentKey,
        })
        if (cancelled) return
        if (remote?.submission?.status === "submitted") {
          const merged = initialAnswers(visibleQuestions)
          for (const q of visibleQuestions) {
            const srv = remote.answers[q.id]
            merged[q.id] = srv ?? local[q.id] ?? merged[q.id]
          }
          setAnswers(merged)
          const bundle: Perf360DraftBundle = {
            answers: merged,
            submittedAt: remote.submission.submitted_at ?? new Date().toISOString(),
          }
          writePerf360Draft(storageKey, bundle)
          queueMicrotask(() => {
            onSaved?.()
          })
        }
      } catch {
        /* tetap pakai local */
      } finally {
        if (!cancelled) setHydrating(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [tenantId, templateId, assignmentKey, visibleQuestionKey, storageKey, onSaved])

  const flush = useCallback(
    (next: Record<string, Perf360StoredAnswer>, submittedAt: string | null) => {
      const bundle: Perf360DraftBundle = { answers: next, submittedAt }
      writePerf360Draft(storageKey, bundle)
      // Jangan panggil onSaved (setState parent) dari dalam updater setAnswers — tunda ke setelah commit.
      queueMicrotask(() => {
        onSaved?.()
      })
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
      <Perf360FormGuidance
        templateName={templateName}
        scaleMax={scaleMax}
        assessedName={assessedName}
        raterRoleLabel={perf360RaterRoleLabel(activeRole)}
        raterContextLine={raterContextLine}
        hideSummary
      />

      <div className="sticky top-0 z-20 rounded-xl border border-slate-800 bg-slate-900/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-slate-900/85">
        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-base text-slate-100">Ringkasan form</CardTitle>
            <CardDescription className="text-slate-500">
              {templateName} — Anda mengisi sebagai{" "}
              <span className="text-slate-400">{perf360RaterRoleLabel(activeRole)}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 border-t border-slate-800/80 pb-4 pt-3 text-sm text-slate-400">
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
              <span className="text-slate-500">Yang dinilai</span>
              <span className="font-medium text-slate-200">{assessedName}</span>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
              <span className="text-slate-500">Konteks penilai</span>
              <span className="text-right text-slate-300">{raterContextLine?.trim() || "—"}</span>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
              <span className="text-slate-500">Tanggal pengisian</span>
              <span className="text-slate-300">{formattedDate}</span>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
              <span className="text-slate-500">Skala rating</span>
              <span className="text-slate-300">1 sampai {scaleMax}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-100">Penilaian</h2>
        <p className="text-xs text-slate-500">
          Isi setiap pertanyaan di bawah. Perubahan disimpan sebagai draf di perangkat; gunakan tombol hijau untuk
          mengirim jawaban ke database.
        </p>
      </div>

      {hydrating ? (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
          Menyesuaikan dengan data server…
        </div>
      ) : null}

      <div className="flex items-center gap-3 text-sm">
        <span className="text-slate-500">Progres</span>
        <span className="font-semibold text-emerald-400">{Math.round(pct)}%</span>
      </div>
      <Progress
        value={pct}
        className="h-2 max-w-md bg-slate-800 [&>[data-slot=progress-indicator]]:bg-cyan-500"
      />

      {submitOk ? (
        <div
          role="status"
          className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
        >
          <p className="flex items-start gap-2 font-medium">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <span>
              Berhasil disimpan ke database — {submitOk.answerCount} jawaban untuk formulir ini.
              <span className="mt-1 block text-xs font-normal text-emerald-200/85">
                Waktu kirim (perangkat): {submitOk.atLabel}. Panel akan tertutup otomatis; daftar formulir akan
                memperbarui status ke Selesai.
              </span>
            </span>
          </p>
        </div>
      ) : null}

      {formError ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">{formError}</p>
      ) : null}

      <Card className="border-slate-800 bg-slate-900">
        <CardHeader>
          <CardTitle className="text-base text-slate-100">Pertanyaan dari template</CardTitle>
          <CardDescription className="text-slate-500">
            Hanya tipe penilaian &amp; pilihan ganda untuk periode ini; filter{" "}
            <code className="text-cyan-500/90">applies_to_role</code> sesuai peran Anda sebagai penilai.
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
                    <RatingRow
                      max={scaleMax}
                      value={a.rating}
                      disabled={!!submitOk}
                      onChange={(n) => setRating(q.id, n)}
                    />
                    {mode !== "none" ? (
                      <div className="space-y-2 pt-1">
                        <Label className="text-slate-200">
                          Alasan / komentar
                          {mode === "required" ? <span className="text-red-400"> *</span> : null}
                        </Label>
                        <Textarea
                          value={a.reason}
                          disabled={!!submitOk}
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
          disabled={submitting || !!submitOk}
          onClick={() => {
            const sub = readPerf360Draft(storageKey)?.submittedAt ?? null
            flush(answers, sub)
          }}
        >
          Simpan draf (perangkat)
        </Button>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          type="button"
          disabled={
            submitting || !!submitOk || isMockMode() || !tenantId || !templateId || !assignmentKey
          }
          onClick={() => {
            const err = validateSubmit()
            if (err) {
              setFormError(err)
              return
            }
            setFormError(null)
            setSubmitOk(null)
            if (isMockMode()) return
            setSubmitting(true)
            ;(async () => {
              try {
                const payload: Record<string, Perf360StoredAnswer> = {}
                for (const q of visibleQuestions) {
                  const a = answers[q.id]
                  if (a) payload[q.id] = a
                }
                await submitPerf360ToDatabase({
                  tenantId,
                  templateId,
                  assignmentKey,
                  assignmentKind,
                  raterUserProfileId,
                  assessedUserProfileId,
                  answers: payload,
                })
                const ts = new Date().toISOString()
                const atLabel = new Date(ts).toLocaleString("id-ID", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
                flush(answers, ts)
                setSubmitOk({ atLabel, answerCount: Object.keys(payload).length })
                onServerSubmitted?.()
              } catch (e: unknown) {
                const msg =
                  e instanceof Error
                    ? e.message
                    : typeof e === "object" &&
                        e !== null &&
                        "message" in e &&
                        (e as { message?: unknown }).message != null
                      ? String((e as { message: unknown }).message)
                      : "Gagal menyimpan ke database."
                setFormError(msg)
              } finally {
                setSubmitting(false)
              }
            })()
          }}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mengirim…
            </>
          ) : (
            "Kirim penilaian ke server"
          )}
        </Button>
      </div>
      <p className="text-xs text-slate-600">
        Setelah dikirim, baris formulir Anda muncul selesai di daftar berdasarkan tabel penyimpanan 360 (
        <span className="font-mono text-slate-500">performance_360_submissions</span>).
      </p>
    </div>
  )
}
