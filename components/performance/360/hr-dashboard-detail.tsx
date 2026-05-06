"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Perf360BehavioralCompetencies } from "@/components/performance/360/perf360-behavioral-competencies"
import { Perf360ResultsScoreMatrix } from "@/components/performance/360/perf360-results-score-matrix"
import { Performance360Shell } from "@/components/performance/360/shell"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEmployees } from "@/hooks/useEmployees"
import { formatTemplatePeriodLabel, usePerformance360Templates } from "@/hooks/usePerformance360Templates"
import { isMockMode } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"

const DEMO_NAMES: Record<string, string> = {
  "ffffffff-ffff-4fff-8fff-fffffffffff1": "Igor Tolic Kadiv",
  "ffffffff-ffff-4fff-8fff-fffffffffff2": "Royadi Nainggolan",
  "ffffffff-ffff-4fff-8fff-fffffffffff3": "Antonius Gunadharma",
}

export function Perf360HrDashboardDetail({ profileId }: { profileId: string }) {
  const tenantId = getTenantId()
  const mock = isMockMode()
  const searchParams = useSearchParams()
  const templateFromQuery = searchParams.get("template")

  const { templates, loading: templatesLoading } = usePerformance360Templates(tenantId)
  const { getEmployee } = useEmployees(tenantId)

  const [profileName, setProfileName] = useState<string | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [templateId, setTemplateId] = useState(templateFromQuery ?? "")

  useEffect(() => {
    setTemplateId((prev) => (templateFromQuery && templateFromQuery !== prev ? templateFromQuery : prev))
  }, [templateFromQuery])

  useEffect(() => {
    if (mock && DEMO_NAMES[profileId]) {
      setProfileName(DEMO_NAMES[profileId])
      setLoadingProfile(false)
      setProfileError(null)
      return
    }
    if (mock && !DEMO_NAMES[profileId]) {
      setProfileName("Demo karyawan")
      setLoadingProfile(false)
      return
    }
    let cancelled = false
    setLoadingProfile(true)
    setProfileError(null)
    void getEmployee(profileId)
      .then((row: any) => {
        if (cancelled) return
        const name = ((row?.full_name ?? "").trim() || row?.email || "Tanpa nama") as string
        const pos = row?.hr_positions
        const p = Array.isArray(pos) ? pos[0] : pos
        const posName = p?.name?.trim()
        setProfileName(posName ? `${name} — ${posName}` : name)
      })
      .catch(() => {
        if (cancelled) return
        setProfileError("Profil tidak ditemukan atau tidak ada akses.")
        setProfileName(DEMO_NAMES[profileId] ?? null)
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false)
      })
    return () => {
      cancelled = true
    }
  }, [getEmployee, profileId, mock])

  useEffect(() => {
    if (templatesLoading || templates.length === 0) return
    if (templateFromQuery && templates.some((t) => t.id === templateFromQuery)) return
    if (templateId && templates.some((t) => t.id === templateId)) return
    const active = templates.find((t) => t.status === "active") ?? templates[0]
    if (active) setTemplateId(active.id)
  }, [templates, templatesLoading, templateFromQuery, templateId])

  const selectedTemplate = templates.find((t) => t.id === templateId)
  const backHref =
    "/performance/360/dashboard" + (templateId ? `?template=${encodeURIComponent(templateId)}` : "")

  const replaceTemplateInUrl = useCallback((id: string) => {
    setTemplateId(id)
    if (typeof window === "undefined") return
    const u = new URL(window.location.href)
    u.searchParams.set("template", id)
    window.history.replaceState(null, "", `${u.pathname}${u.search}`)
  }, [])

  const periodLine = selectedTemplate
    ? `${formatTemplatePeriodLabel(selectedTemplate)} — ${selectedTemplate.name}`
    : "Pilih template"

  return (
    <Performance360Shell
      title={
        loadingProfile ? "Memuat profil…" : profileError ? "Detail hasil 360" : profileName ?? "Karyawan"
      }
      subtitle={`Hasil penilaian aggregated (demo UI) · ${periodLine}`}
      action={
        <Button variant="outline" size="sm" className="border-slate-700 text-slate-300" asChild>
          <Link href={backHref}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Kembali ke daftar
          </Link>
        </Button>
      }
    >
      {profileError ? (
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {profileError} Tampilan di bawah tetap menggunakan contoh hingga profil dapat dimuat.
        </div>
      ) : null}

      <Card className="border-slate-800 bg-slate-900">
        <CardHeader className="space-y-2 pb-4">
          <CardTitle className="text-base text-slate-100">Periode penilaian</CardTitle>
          <CardDescription className="text-slate-500">
            Mengganti template memperbarui query string — angka hasil tetap ilustrasi hingga agregasi DB tersambung.
          </CardDescription>
          <Label className="text-xs text-slate-400">Template</Label>
          <Select
            value={templateId || undefined}
            onValueChange={replaceTemplateInUrl}
            disabled={templatesLoading || templates.length === 0}
          >
            <SelectTrigger className="max-w-xl border-slate-800 bg-slate-950 text-slate-100">
              <SelectValue placeholder="Pilih template" />
            </SelectTrigger>
            <SelectContent className="border-slate-800 bg-slate-900">
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {formatTemplatePeriodLabel(t)} — {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>

      <p className="text-xs text-slate-600">
        Radar dan matrix di bawah memakai data contoh. Nantinya bisa dihitung dari{" "}
        <span className="font-mono">performance_360_submission_answers</span> per karyawan dan template.
      </p>

      <Perf360BehavioralCompetencies />
      <Perf360ResultsScoreMatrix />
    </Performance360Shell>
  )
}
