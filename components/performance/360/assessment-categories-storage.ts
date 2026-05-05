"use client"

export const DEFAULT_ASSESSMENT_CATEGORIES = [
  "Kompetensi Teknis",
  "Kepemimpinan",
  "Komunikasi",
  "Teamwork",
  "Inovasi",
] as const

const STORAGE_KEY = "wit-erp.performance360.assessmentCategories"

export const ASSESSMENT_CATEGORIES_UPDATED_EVENT = "wit-erp:performance360-categories-changed"

export function loadAssessmentCategories(): string[] {
  if (typeof window === "undefined") {
    return [...DEFAULT_ASSESSMENT_CATEGORIES]
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [...DEFAULT_ASSESSMENT_CATEGORIES]
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return [...DEFAULT_ASSESSMENT_CATEGORIES]
    const cleaned = parsed
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((s) => s.trim())
    const unique: string[] = []
    const seen = new Set<string>()
    for (const c of cleaned) {
      const key = c.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      unique.push(c)
    }
    return unique.length ? unique : [...DEFAULT_ASSESSMENT_CATEGORIES]
  } catch {
    return [...DEFAULT_ASSESSMENT_CATEGORIES]
  }
}

export function persistAssessmentCategories(categories: string[]): void {
  if (typeof window === "undefined") return
  const unique: string[] = []
  const seen = new Set<string>()
  for (const c of categories) {
    const t = c.trim()
    if (!t) continue
    const key = t.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(t)
  }
  const next = unique.length ? unique : [...DEFAULT_ASSESSMENT_CATEGORIES]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(ASSESSMENT_CATEGORIES_UPDATED_EVENT))
}
