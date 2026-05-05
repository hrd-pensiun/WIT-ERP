export type Perf360RaterRole = "all" | "self" | "manager" | "peer" | "subordinate"

export const PERF360_RATER_ROLE_OPTIONS: {
  value: Perf360RaterRole
  label: string
  description: string
}[] = [
  { value: "all", label: "Semua peran", description: "Pertanyaan tampil untuk semua penilai." },
  { value: "self", label: "Diri sendiri", description: "Hanya saat penilai mengisi self-assessment." },
  { value: "manager", label: "Atasan", description: "Hanya untuk penilai yang menilai bawahan sebagai atasan." },
  { value: "peer", label: "Rekan sejawat", description: "Hanya untuk penilai dengan relasi peer." },
  { value: "subordinate", label: "Bawahan menilai atasan", description: "Hanya saat penilai menilai atasannya." },
]

export function coercePerf360RaterRole(raw: unknown): Perf360RaterRole {
  if (raw === "self" || raw === "manager" || raw === "peer" || raw === "subordinate") return raw
  return "all"
}

export function perf360RaterRoleLabel(role: string | null | undefined): string {
  const val = coercePerf360RaterRole(role)
  return PERF360_RATER_ROLE_OPTIONS.find((o) => o.value === val)?.label ?? "Semua peran"
}

export function perf360QuestionVisibleForRole(
  questionRole: string | null | undefined,
  activeRole: Perf360RaterRole
): boolean {
  const q = coercePerf360RaterRole(questionRole)
  return q === "all" || q === activeRole
}
