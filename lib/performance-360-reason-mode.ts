/** Kebijakan kolom alasan tambahan (rating / pilihan ganda). Teks bebas tidak memakai mode ini. */
export type Perf360ReasonMode = "none" | "optional" | "required"

export const PERF360_REASON_MODE_OPTIONS: {
  value: Perf360ReasonMode
  label: string
  description: string
}[] = [
  { value: "none", label: "Tanpa alasan", description: "Hanya skor atau pilihan." },
  { value: "optional", label: "Alasan opsional", description: "Kolom teks tampil; boleh dikosongkan." },
  { value: "required", label: "Alasan wajib", description: "Penilai harus mengisi alasan sebelum mengirim." },
]

export function perf360ReasonModeLabel(mode: Perf360ReasonMode | string | null | undefined): string {
  const m = coercePerf360ReasonMode(mode)
  return PERF360_REASON_MODE_OPTIONS.find((o) => o.value === m)?.label ?? "Tanpa alasan"
}

export function coercePerf360ReasonMode(raw: unknown): Perf360ReasonMode {
  if (raw === "optional" || raw === "required") return raw
  return "none"
}

export function perf360ReasonAppliesToDbQuestionType(questionType: string): boolean {
  return questionType === "rating" || questionType === "multiple_choice"
}
