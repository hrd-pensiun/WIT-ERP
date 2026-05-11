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
import { Loader2 } from "lucide-react"
import { Perf360ResultsScoreMatrix } from "@/components/performance/360/perf360-results-score-matrix"

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

export function Matrix360View() {
  const tenantId = getTenantId()
  const scope = useOrgScopeFilters()
  const { employees, loading: employeesLoading, fetchEmployees } = useEmployees(tenantId, {
    pollInterval: 60_000,
  })
  const { templates, loading: templatesLoading } = usePerformance360Templates(tenantId)

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
      <Card>
        <CardContent className="px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="filters" className="border-0">
              <AccordionTrigger className="py-1 hover:no-underline">
                <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  <span className="text-base font-medium text-foreground">Filter</span>
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
                        <Label className="text-muted-foreground text-xs">Karyawan</Label>
                        <Select
                          value={employee || undefined}
                          onValueChange={setEmployee}
                          disabled={employeesLoading || filteredEmployees.length === 0}
                        >
                          <SelectTrigger className="h-9 w-full min-w-0 overflow-hidden bg-background border-border text-foreground">
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
                          <SelectContent className="max-h-[min(320px,50vh)]">
                            {filteredEmployees.map((e) => (
                              <SelectItem key={e.id} value={e.id}>
                                {employeeFilterLabel(e)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="min-w-0 space-y-2">
                        <Label className="text-muted-foreground text-xs">Periode (dari template)</Label>
                        <Select
                          value={templateId || undefined}
                          onValueChange={setTemplateId}
                          disabled={templatesLoading || templates.length === 0}
                        >
                          <SelectTrigger className="h-9 w-full min-w-0 overflow-hidden bg-background border-border text-foreground">
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
                          <SelectContent className="max-h-[min(320px,50vh)]">
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

      <Perf360ResultsScoreMatrix />
    </Performance360Shell>
  )
}
