"use client"

import { useEffect, useMemo, useState } from "react"
import { Performance360Shell } from "@/components/performance/360/shell"
import { OrgScopeFilterFields, useOrgScopeFilters } from "@/components/performance/360/org-scope-filters"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"
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
import { getTenantId } from "@/lib/tenant"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

type EmployeeRow = {
  id: string
  full_name?: string | null
  status?: string
  department_id?: string | null
  division_id?: string | null
  departments?: { entity_id?: string | null } | null | { entity_id?: string | null }[]
  hr_positions?: { name?: string | null } | null | { name?: string | null }[]
}

function positionName(e: EmployeeRow): string | null {
  const p = e.hr_positions
  const row = Array.isArray(p) ? p[0] : p
  return row?.name?.trim() ? row.name.trim() : null
}

function employeeFilterLabel(e: EmployeeRow): string {
  const name = (e.full_name ?? "").trim() || "Tanpa nama"
  const pos = positionName(e)
  return pos ? `${name} — ${pos}` : name
}

const SCORE_CARDS = [
  {
    label: "Self Assessment",
    value: "4.2",
    subtitle: "dari 5.0 (3 responses)",
    className: "from-emerald-600/90 to-cyan-600/80",
  },
  {
    label: "Manager / Atasan",
    value: "3.8",
    subtitle: "dari 5.0 (1 response)",
    className: "from-fuchsia-600/85 to-rose-600/75",
  },
  {
    label: "Rekan / Peer",
    value: "4.0",
    subtitle: "dari 5.0 (4 responses)",
    className: "from-sky-600/85 to-cyan-500/75",
  },
  {
    label: "Bawahan / Subordinate",
    value: "3.5",
    subtitle: "dari 5.0 (3 responses)",
    className: "from-green-600/85 to-emerald-500/75",
  },
] as const

type MatrixRow = {
  category: string
  self: number
  atasan: number
  rekan: number
  bawahan: number
  total: number
  avg: number
  avgTone?: "neutral" | "warn"
}

const MATRIX_ROWS: MatrixRow[] = [
  { category: "Kompetensi Teknis", self: 4.3, atasan: 4.1, rekan: 4.2, bawahan: 3.8, total: 16.4, avg: 4.1 },
  { category: "Kepemimpinan", self: 4.1, atasan: 3.9, rekan: 4.0, bawahan: 3.6, total: 15.6, avg: 3.9 },
  {
    category: "Komunikasi",
    self: 4.0,
    atasan: 3.5,
    rekan: 3.8,
    bawahan: 3.3,
    total: 14.6,
    avg: 3.7,
    avgTone: "warn",
  },
  { category: "Teamwork", self: 4.2, atasan: 4.0, rekan: 4.1, bawahan: 3.9, total: 16.2, avg: 4.0 },
]

const TOTAL_ROW = { self: 4.2, atasan: 3.9, rekan: 4.0, bawahan: 3.6, overall: 3.9 }

function ScoreBar({ value, max = 5 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="mt-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
      <div
        className="h-full rounded-full bg-emerald-500/90 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function CellScore({ value }: { value: number }) {
  return (
    <div className="min-w-[100px]">
      <span className="text-sm font-medium text-slate-200">{value.toFixed(1)}</span>
      <ScoreBar value={value} />
    </div>
  )
}

export function Matrix360View() {
  const tenantId = getTenantId()
  const scope = useOrgScopeFilters()
  const { employees, loading: employeesLoading, fetchEmployees } = useEmployees(tenantId, {
    pollInterval: 60_000,
  })
  const { templates, loading: templatesLoading } = usePerformance360Templates(tenantId, {
    pollInterval: 60_000,
  })

  const [employee, setEmployee] = useState("")
  const [templateId, setTemplateId] = useState("")

  useEffect(() => {
    void fetchEmployees({ status: "active" })
  }, [fetchEmployees])

  useEffect(() => {
    if (templates.length === 0) {
      setTemplateId("")
      return
    }
    setTemplateId((prev) => (templates.some((t) => t.id === prev) ? prev : templates[0].id))
  }, [templates])

  const filteredEmployees = useMemo(() => {
    const list = (employees as EmployeeRow[]).filter((e) => e.status === "active")
    return list.filter((e) => {
      if (scope.departmentId && e.department_id !== scope.departmentId) return false
      if (scope.divisionId && e.division_id !== scope.divisionId) return false
      return true
    })
  }, [employees, scope.departmentId, scope.divisionId])

  useEffect(() => {
    if (filteredEmployees.length === 0) {
      setEmployee("")
      return
    }
    setEmployee((prev) =>
      filteredEmployees.some((e) => e.id === prev) ? prev : filteredEmployees[0].id
    )
  }, [filteredEmployees])

  const selectedEmployee = filteredEmployees.find((e) => e.id === employee)
  const employeeLine = selectedEmployee ? employeeFilterLabel(selectedEmployee) : "—"

  const selectedTemplate = templates.find((t) => t.id === templateId)
  const periodLine = selectedTemplate
    ? `${formatTemplatePeriodLabel(selectedTemplate)} · ${selectedTemplate.name}`
    : templatesLoading
      ? "Memuat template…"
      : "Belum ada template penilaian"

  const filterSummary = `${scope.deptLabel} · ${scope.divLabel}`

  return (
    <Performance360Shell
      title="Dashboard"
      subtitle={`${filterSummary} — Matrix & perhitungan skor (demo) · ${employeeLine} · ${periodLine}`}
    >
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="filters" className="border-0">
              <AccordionTrigger className="py-1 hover:no-underline">
                <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  <span className="text-base font-medium text-slate-200">Filter</span>
                  {scope.filtersLoading ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-emerald-500" aria-hidden />
                  ) : null}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <OrgScopeFilterFields
                  scope={scope}
                  hideHeader
                  hideEntity
                  trailing={
                    <>
                      <div className="min-w-0 space-y-2">
                        <Label className="text-slate-400 text-xs">Karyawan</Label>
                        <Select
                          value={employee || undefined}
                          onValueChange={setEmployee}
                          disabled={employeesLoading || filteredEmployees.length === 0}
                        >
                          <SelectTrigger className="h-9 w-full min-w-0 overflow-hidden bg-slate-950 border-slate-800 text-slate-100">
                            <SelectValue
                              placeholder={
                                employeesLoading
                                  ? "Memuat…"
                                  : filteredEmployees.length === 0
                                    ? "Tidak ada karyawan"
                                    : "Pilih karyawan"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800 max-h-[min(320px,50vh)]">
                            {filteredEmployees.map((e) => (
                              <SelectItem key={e.id} value={e.id}>
                                {employeeFilterLabel(e)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="min-w-0 space-y-2">
                        <Label className="text-slate-400 text-xs">Periode (dari template)</Label>
                        <Select
                          value={templateId || undefined}
                          onValueChange={setTemplateId}
                          disabled={templatesLoading || templates.length === 0}
                        >
                          <SelectTrigger className="h-9 w-full min-w-0 overflow-hidden bg-slate-950 border-slate-800 text-slate-100">
                            <SelectValue
                              placeholder={
                                templatesLoading
                                  ? "Memuat template…"
                                  : templates.length === 0
                                    ? "Belum ada template"
                                    : "Pilih template / periode"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800 max-h-[min(320px,50vh)]">
                            {templates.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {formatTemplatePeriodLabel(t)} — {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  }
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SCORE_CARDS.map((c) => (
          <div
            key={c.label}
            className={cn(
              "rounded-xl p-4 text-white shadow-lg bg-gradient-to-br border border-white/10",
              c.className
            )}
          >
            <p className="text-sm opacity-90">{c.label}</p>
            <p className="text-3xl font-bold mt-2">{c.value}</p>
            <p className="text-xs opacity-80 mt-1">{c.subtitle}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-slate-200 font-medium mb-4">Rincian skor per kategori</h3>
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Kategori</TableHead>
                <TableHead className="text-slate-400">Self</TableHead>
                <TableHead className="text-slate-400">Atasan</TableHead>
                <TableHead className="text-slate-400">Rekan</TableHead>
                <TableHead className="text-slate-400">Bawahan</TableHead>
                <TableHead className="text-slate-400">Total skor</TableHead>
                <TableHead className="text-slate-400">Rata-rata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MATRIX_ROWS.map((row) => (
                <TableRow key={row.category} className="border-slate-800">
                  <TableCell className="text-slate-200 font-medium">{row.category}</TableCell>
                  <TableCell>
                    <CellScore value={row.self} />
                  </TableCell>
                  <TableCell>
                    <CellScore value={row.atasan} />
                  </TableCell>
                  <TableCell>
                    <CellScore value={row.rekan} />
                  </TableCell>
                  <TableCell>
                    <CellScore value={row.bawahan} />
                  </TableCell>
                  <TableCell className="text-slate-200 font-semibold">{row.total.toFixed(1)}</TableCell>
                  <TableCell
                    className={cn(
                      "font-semibold",
                      row.avgTone === "warn" ? "text-amber-400" : "text-emerald-400"
                    )}
                  >
                    {row.avg.toFixed(1)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-slate-800 bg-slate-950/80 font-semibold">
                <TableCell className="text-slate-200">SKOR TOTAL</TableCell>
                <TableCell className="text-emerald-400">{TOTAL_ROW.self.toFixed(1)}</TableCell>
                <TableCell className="text-emerald-400">{TOTAL_ROW.atasan.toFixed(1)}</TableCell>
                <TableCell className="text-emerald-400">{TOTAL_ROW.rekan.toFixed(1)}</TableCell>
                <TableCell className="text-emerald-400">{TOTAL_ROW.bawahan.toFixed(1)}</TableCell>
                <TableCell className="text-slate-500">—</TableCell>
                <TableCell className="text-emerald-400 text-lg">{TOTAL_ROW.overall.toFixed(1)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      </div>

      <Card className="bg-slate-950/80 border-slate-800 border-l-4 border-l-cyan-500">
        <CardContent className="pt-6 text-sm text-slate-400 space-y-2">
          <p className="text-slate-200 font-medium">Formula perhitungan</p>
          <p>
            Skor total = (Self × 20% + Atasan × 30% + Rekan × 25% + Bawahan × 25%)
          </p>
          <p className="text-slate-500 text-xs">
            Bobot dapat disesuaikan di halaman Konfigurasi.
          </p>
        </CardContent>
      </Card>
    </Performance360Shell>
  )
}
