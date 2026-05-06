"use client"

export type Perf360RaterWeights = {
  self: number
  manager: number
  peer: number
  subordinate: number
}

export const DEFAULT_PERF360_RATER_WEIGHTS: Perf360RaterWeights = {
  manager: 30,
  peer: 25,
  subordinate: 25,
  self: 20,
}

const STORAGE_KEY = "wit-erp.performance360.raterWeights"

export const PERF360_RATER_WEIGHTS_UPDATED_EVENT = "wit-erp:performance360-rater-weights-changed"

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, n))
}

function normalize(weights: Perf360RaterWeights): Perf360RaterWeights {
  const w = {
    self: clamp(weights.self, 0, 100),
    manager: clamp(weights.manager, 0, 100),
    peer: clamp(weights.peer, 0, 100),
    subordinate: clamp(weights.subordinate, 0, 100),
  }
  const sum = w.self + w.manager + w.peer + w.subordinate
  if (sum <= 0) return { ...DEFAULT_PERF360_RATER_WEIGHTS }
  const factor = 100 / sum
  // Keep 2 decimals for stability; UI typically shows integer percent.
  return {
    self: Math.round(w.self * factor * 100) / 100,
    manager: Math.round(w.manager * factor * 100) / 100,
    peer: Math.round(w.peer * factor * 100) / 100,
    subordinate: Math.round(w.subordinate * factor * 100) / 100,
  }
}

export function loadPerf360RaterWeights(): Perf360RaterWeights {
  if (typeof window === "undefined") return { ...DEFAULT_PERF360_RATER_WEIGHTS }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PERF360_RATER_WEIGHTS }
    const parsed = JSON.parse(raw) as Partial<Perf360RaterWeights> | null
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_PERF360_RATER_WEIGHTS }
    return normalize({
      self: Number(parsed.self ?? DEFAULT_PERF360_RATER_WEIGHTS.self),
      manager: Number(parsed.manager ?? DEFAULT_PERF360_RATER_WEIGHTS.manager),
      peer: Number(parsed.peer ?? DEFAULT_PERF360_RATER_WEIGHTS.peer),
      subordinate: Number(parsed.subordinate ?? DEFAULT_PERF360_RATER_WEIGHTS.subordinate),
    })
  } catch {
    return { ...DEFAULT_PERF360_RATER_WEIGHTS }
  }
}

export function persistPerf360RaterWeights(next: Perf360RaterWeights): Perf360RaterWeights {
  if (typeof window === "undefined") return normalize(next)
  const normalized = normalize(next)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  window.dispatchEvent(new CustomEvent(PERF360_RATER_WEIGHTS_UPDATED_EVENT))
  return normalized
}

