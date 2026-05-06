import { insForge } from "@/lib/insforge"
import type { Perf360AssignmentKind } from "@/lib/perf360-assignments"
import type { Perf360StoredAnswer } from "@/lib/perf360-draft-storage"

export type Perf360SubmissionRow = {
  id: string
  tenant_id: string
  template_id: string
  rater_user_profile_id: string
  assessed_user_profile_id: string
  assignment_kind: Perf360AssignmentKind
  assignment_key: string
  status: "draft" | "submitted"
  submitted_at: string | null
}

export type Perf360SubmissionAnswerRow = {
  question_id: string
  rating: number | null
  reason_text: string | null
}

export async function fetchPerf360SubmissionsForTemplate(
  tenantId: string,
  templateId: string
): Promise<Perf360SubmissionRow[]> {
  if (!insForge) return []
  const { data, error } = await insForge
    .from("performance_360_submissions")
    .select(
      "id, tenant_id, template_id, rater_user_profile_id, assessed_user_profile_id, assignment_kind, assignment_key, status, submitted_at"
    )
    .eq("tenant_id", tenantId)
    .eq("template_id", templateId)
  if (error) throw error
  return (data ?? []) as Perf360SubmissionRow[]
}

export async function fetchPerf360SubmissionAnswers(
  submissionId: string
): Promise<Record<string, Perf360StoredAnswer>> {
  if (!insForge) return {}
  const { data, error } = await insForge
    .from("performance_360_submission_answers")
    .select("question_id, rating, reason_text")
    .eq("submission_id", submissionId)
  if (error) throw error
  const out: Record<string, Perf360StoredAnswer> = {}
  for (const row of (data ?? []) as Perf360SubmissionAnswerRow[]) {
    out[row.question_id] = {
      rating: row.rating != null ? Number(row.rating) : null,
      reason: row.reason_text ?? "",
    }
  }
  return out
}

export async function loadPerf360DraftFromServer(params: {
  tenantId: string
  templateId: string
  assignmentKey: string
}): Promise<{ submission: Perf360SubmissionRow; answers: Record<string, Perf360StoredAnswer> } | null> {
  if (!insForge) return null
  const { data: sub, error } = await insForge
    .from("performance_360_submissions")
    .select(
      "id, tenant_id, template_id, rater_user_profile_id, assessed_user_profile_id, assignment_kind, assignment_key, status, submitted_at"
    )
    .eq("tenant_id", params.tenantId)
    .eq("template_id", params.templateId)
    .eq("assignment_key", params.assignmentKey)
    .maybeSingle()
  if (error) throw error
  if (!sub) return null
  const submission = sub as Perf360SubmissionRow
  const answers = await fetchPerf360SubmissionAnswers(submission.id)
  return { submission, answers }
}

export async function submitPerf360ToDatabase(params: {
  tenantId: string
  templateId: string
  assignmentKey: string
  assignmentKind: Perf360AssignmentKind
  raterUserProfileId: string
  assessedUserProfileId: string
  answers: Record<string, Perf360StoredAnswer>
}): Promise<Perf360SubmissionRow> {
  if (!insForge) throw new Error("Database not connected")

  const now = new Date().toISOString()
  const { data: saved, error: upErr } = await insForge
    .from("performance_360_submissions")
    .upsert(
      {
        tenant_id: params.tenantId,
        template_id: params.templateId,
        rater_user_profile_id: params.raterUserProfileId,
        assessed_user_profile_id: params.assessedUserProfileId,
        assignment_kind: params.assignmentKind,
        assignment_key: params.assignmentKey,
        status: "submitted",
        submitted_at: now,
        updated_at: now,
      },
      { onConflict: "tenant_id,template_id,assignment_key" }
    )
    .select(
      "id, tenant_id, template_id, rater_user_profile_id, assessed_user_profile_id, assignment_kind, assignment_key, status, submitted_at"
    )
    .single()

  if (upErr) throw upErr
  const submission = saved as Perf360SubmissionRow

  const { error: delErr } = await insForge
    .from("performance_360_submission_answers")
    .delete()
    .eq("submission_id", submission.id)
  if (delErr) throw delErr

  const rows = Object.entries(params.answers).map(([question_id, a]) => ({
    submission_id: submission.id,
    question_id,
    rating: a.rating,
    reason_text: a.reason?.trim() ? a.reason.trim() : null,
    updated_at: now,
  }))

  if (rows.length > 0) {
    const { error: insErr } = await insForge.from("performance_360_submission_answers").insert(rows)
    if (insErr) throw insErr
  }

  return submission
}
