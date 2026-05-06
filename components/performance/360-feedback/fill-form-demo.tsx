"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  coercePerf360ReasonMode,
  perf360ReasonModeLabel,
  type Perf360ReasonMode,
} from "@/lib/performance-360-reason-mode"
import {
  PERF360_RATER_ROLE_OPTIONS,
  coercePerf360RaterRole,
  perf360QuestionVisibleForRole,
  perf360RaterRoleLabel,
  type Perf360RaterRole,
} from "@/lib/performance-360-rater-role"
import { Perf360FormGuidance } from "@/components/performance/360-feedback/form360-guidance"

/** Pertanyaan demo — struktur seperti baris template (rating + reason_mode). */
const DEMO_RATINGS_TAB_QUESTIONS: {
  id: string
  section: string
  text: string
  reason_mode: Perf360ReasonMode
  applies_to_role: Perf360RaterRole
}[] = [
  {
    id: "demo-noreason",
    section: "Perilaku & kompetensi",
    text: "Menunjukkan keahlian teknis yang kuat dalam pekerjaan",
    reason_mode: "none",
    applies_to_role: "all",
  },
  {
    id: "demo-optional",
    section: "Perilaku & kompetensi",
    text: "Mengikuti perkembangan industri / praktik terbaik",
    reason_mode: "optional",
    applies_to_role: "manager",
  },
  {
    id: "demo-required",
    section: "Kepemimpinan",
    text: "Atasan memberi arahan yang jelas dan mendukung pengembangan tim",
    reason_mode: "required",
    applies_to_role: "subordinate",
  },
]

function demoInitialAnswers(): Record<string, { rating: number | null; reason: string }> {
  const init: Record<string, { rating: number | null; reason: string }> = {}
  for (const q of DEMO_RATINGS_TAB_QUESTIONS) {
    init[q.id] = { rating: null, reason: "" }
  }
  return init
}

function demoRowComplete(
  q: (typeof DEMO_RATINGS_TAB_QUESTIONS)[number],
  a: { rating: number | null; reason: string }
): boolean {
  if (a.rating == null) return false
  const mode = coercePerf360ReasonMode(q.reason_mode)
  if (mode === "required" && !a.reason.trim()) return false
  return true
}

function RatingRow({
  value,
  onChange,
}: {
  value: number | null
  onChange: (n: number) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={cn(
            "h-10 w-10 rounded-full border text-sm font-medium transition-colors",
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

/** Form isi penilaian (demo) — dipakai dari sheet/tab hingga API siklus siap. */
export function ThreeSixtyFillFormDemo() {
  const [activeRaterRole, setActiveRaterRole] = useState<Perf360RaterRole>("subordinate")
  const [answers, setAnswers] = useState(demoInitialAnswers)
  const [formError, setFormError] = useState<string | null>(null)
  const visibleQuestions = DEMO_RATINGS_TAB_QUESTIONS.filter((q) =>
    perf360QuestionVisibleForRole(q.applies_to_role, activeRaterRole)
  )

  const demoTotal = visibleQuestions.length
  const demoDone = visibleQuestions.filter((q) => demoRowComplete(q, answers[q.id])).length
  const formProgressPct = demoTotal ? (demoDone / demoTotal) * 100 : 0

  const setRating = (id: string, rating: number) => {
    setFormError(null)
    setAnswers((prev) => ({ ...prev, [id]: { ...prev[id], rating } }))
  }
  const setReason = (id: string, reason: string) => {
    setFormError(null)
    setAnswers((prev) => ({ ...prev, [id]: { ...prev[id], reason } }))
  }

  const validateDemoSubmit = (): string | null => {
    for (const q of visibleQuestions) {
      const a = answers[q.id]
      if (a.rating == null) {
        return `Pilih rating untuk: "${q.text.slice(0, 48)}${q.text.length > 48 ? "…" : ""}"`
      }
      if (coercePerf360ReasonMode(q.reason_mode) === "required" && !a.reason.trim()) {
        return `Alasan wajib diisi untuk: "${q.text.slice(0, 40)}…"`
      }
    }
    return null
  }

  return (
    <div className="space-y-6">
      <Perf360FormGuidance
        templateName="Demo 360 (tidak menyimpan ke server)"
        scaleMax={5}
        assessedName="Karyawan contoh — dari data demo"
        raterRoleLabel={perf360RaterRoleLabel(activeRaterRole)}
        raterContextLine="Penilai: Anda — ubah «Role penilai» di bawah untuk melihat filter pertanyaan."
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Isi penilaian (demo)</h2>
          <p className="text-sm text-slate-500">
            Struktur mengikuti template (reason_mode, applies_to_role).
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-500">Progres</span>
          <span className="font-semibold text-emerald-400">{Math.round(formProgressPct)}%</span>
        </div>
      </div>

      {formError ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">{formError}</p>
      ) : null}

      <Card className="border-slate-800 bg-slate-900">
        <CardHeader>
          <CardTitle className="text-base text-slate-100">Pertanyaan</CardTitle>
          <CardDescription className="text-slate-500">
            Simulasi role penilai mempengaruhi pertanyaan yang tampil.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-10">
          <div className="max-w-sm space-y-2">
            <Label className="text-slate-200">Role penilai</Label>
            <Select
              value={activeRaterRole}
              onValueChange={(v) => setActiveRaterRole(coercePerf360RaterRole(v))}
            >
              <SelectTrigger className="border-slate-800 bg-slate-950 text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-slate-800 bg-slate-900">
                {PERF360_RATER_ROLE_OPTIONS.filter((o) => o.value !== "all").map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Aktif: <span className="text-slate-400">{perf360RaterRoleLabel(activeRaterRole)}</span>
            </p>
          </div>
          {(() => {
            let lastSection = ""
            return visibleQuestions.map((q, idx) => {
              const mode = coercePerf360ReasonMode(q.reason_mode)
              const showSection = q.section !== lastSection
              lastSection = q.section
              const a = answers[q.id]
              return (
                <div key={q.id} className="space-y-3">
                  {showSection ? (
                    <h3 className="border-b border-slate-800 pb-2 text-sm font-semibold tracking-tight text-cyan-400/95">
                      {q.section}
                    </h3>
                  ) : null}
                  <div className="space-y-3 pl-0 sm:pl-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-mono text-xs text-slate-500">{idx + 1}.</span>
                      <Label className="text-slate-200">{q.text}</Label>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                      <span>
                        Alasan: <span className="text-slate-400">{perf360ReasonModeLabel(mode)}</span>
                      </span>
                      {mode !== "none" ? (
                        <span className="rounded border border-slate-700 px-2 py-0.5 font-mono text-slate-500">
                          applies_to_role=
                          <span className="text-cyan-500/90">{coercePerf360RaterRole(q.applies_to_role)}</span>
                        </span>
                      ) : null}
                    </div>
                    <RatingRow value={a.rating} onChange={(n) => setRating(q.id, n)} />
                    <p className="text-xs text-slate-500">Skala 1–5</p>
                    {mode !== "none" ? (
                      <div className="space-y-2 pt-1">
                        <Label className="text-slate-200">
                          Alasan / komentar
                          {mode === "required" ? (
                            <span className="text-red-400"> *</span>
                          ) : (
                            <span className="font-normal text-slate-500"> (opsional)</span>
                          )}
                        </Label>
                        <Textarea
                          value={a.reason}
                          onChange={(e) => setReason(q.id, e.target.value)}
                          placeholder={
                            mode === "required"
                              ? "Wajib diisi untuk mengirim penilaian…"
                              : "Anda bisa menambahkan konteks…"
                          }
                          rows={3}
                          className={cn(
                            "border-slate-800 bg-slate-950 text-slate-100",
                            mode === "required" && !a.reason.trim() && "border-amber-500/40"
                          )}
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 italic">Tanpa kolom alasan tambahan.</p>
                    )}
                  </div>
                </div>
              )
            })
          })()}
          {visibleQuestions.length === 0 ? (
            <p className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3 text-sm text-slate-500">
              Tidak ada pertanyaan untuk role ini.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" type="button" className="border-slate-700">
          Simpan progres
        </Button>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          type="button"
          onClick={() => {
            const err = validateDemoSubmit()
            if (err) {
              setFormError(err)
              return
            }
            setFormError(null)
            alert("Demo: validasi OK — produksi akan menyimpan ke database.")
          }}
        >
          Kirim penilaian
        </Button>
      </div>
    </div>
  )
}
