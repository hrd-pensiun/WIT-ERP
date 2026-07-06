"use client"

const STORAGE_KEY = "wit-erp:module-visibility"
const CHANGE_EVENT = "wit-erp:module-visibility-changed"

export type ModuleKey = "workforce" | "commercial" | "projects" | "finance" | "reportsNonHris"

export type ModuleVisibility = Record<ModuleKey, boolean>

export const MODULE_TOGGLES: { key: ModuleKey; label: string; description: string }[] = [
  { key: "workforce", label: "Workforce", description: "Workload, alokasi, dan timesheet." },
  { key: "commercial", label: "Commercial", description: "Kalkulator, rate card, leads, klien, perusahaan." },
  { key: "projects", label: "Projects", description: "Manajemen proyek dan kanban." },
  { key: "finance", label: "Finance", description: "BOPP calculator, invoice, dan expenses." },
  { key: "reportsNonHris", label: "Laporan Non-HRIS", description: "Laporan Sales dan Projects di menu Reports." },
]

const DEFAULT_VISIBILITY: ModuleVisibility = {
  workforce: false,
  commercial: false,
  projects: false,
  finance: false,
  reportsNonHris: false,
}

export function getModuleVisibility(): ModuleVisibility {
  if (typeof window === "undefined") return DEFAULT_VISIBILITY
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_VISIBILITY
    const parsed = JSON.parse(raw) as Partial<ModuleVisibility>
    return { ...DEFAULT_VISIBILITY, ...parsed }
  } catch {
    return DEFAULT_VISIBILITY
  }
}

export function setModuleVisibility(next: ModuleVisibility) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }))
}

export function subscribeModuleVisibility(callback: (visibility: ModuleVisibility) => void) {
  if (typeof window === "undefined") return () => {}

  const handleCustomEvent = (event: Event) => {
    callback((event as CustomEvent<ModuleVisibility>).detail)
  }
  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback(getModuleVisibility())
  }

  window.addEventListener(CHANGE_EVENT, handleCustomEvent)
  window.addEventListener("storage", handleStorageEvent)
  return () => {
    window.removeEventListener(CHANGE_EVENT, handleCustomEvent)
    window.removeEventListener("storage", handleStorageEvent)
  }
}
