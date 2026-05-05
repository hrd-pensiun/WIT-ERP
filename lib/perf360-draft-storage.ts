import type { Performance360TemplateQuestionRow } from "@/hooks/usePerformance360Templates"

export type Perf360StoredAnswer = { rating: number | null; reason: string }

export type Perf360DraftBundle = {
  answers: Record<string, Perf360StoredAnswer>
  submittedAt: string | null
}

export function perf360DraftStorageKey(
  tenantId: string,
  templateId: string,
  assignmentKey: string
): string {
  return `perf360-draft:${tenantId}:${templateId}:${assignmentKey}`
}

export function readPerf360Draft(storageKey: string): Perf360DraftBundle | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null
    const p = JSON.parse(raw) as Perf360DraftBundle
    if (!p || typeof p.answers !== "object") return null
    return p
  } catch {
    return null
  }
}

export function writePerf360Draft(storageKey: string, bundle: Perf360DraftBundle) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(bundle))
  } catch {
    /* quota / private mode */
  }
}

/** Status UI dari draft lokal — belum ada tabel submission di DB */
export type Perf360LocalStatus = "pending" | "in_progress" | "completed"

export function perf360DraftStatus(bundle: Perf360DraftBundle | null, questions: Performance360TemplateQuestionRow[]): Perf360LocalStatus {
  if (bundle?.submittedAt) return "completed"
  if (!bundle || questions.length === 0) return "pending"
  const touched = questions.some((q) => {
    const a = bundle.answers[q.id]
    return a && (a.rating != null || (a.reason && a.reason.trim().length > 0))
  })
  return touched ? "in_progress" : "pending"
}
