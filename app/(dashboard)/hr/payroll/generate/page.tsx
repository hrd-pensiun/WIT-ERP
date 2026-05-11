"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Calculator, Loader2, CalendarDays, Info,
  Users, Building2, User, Search, CheckSquare, Square,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { usePayroll } from "@/hooks/usePayroll"
import { useEntities } from "@/hooks/useEntities"
import { usePayrollCutoffConfig } from "@/hooks/usePayrollCutoffConfig"
import { generatePayrollDetailsForPeriod } from "@/lib/payroll-engine"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"
import Link from "next/link"

const MONTHS = [
  { value: "1", label: "Januari" }, { value: "2", label: "Februari" }, { value: "3", label: "Maret" },
  { value: "4", label: "April" }, { value: "5", label: "Mei" }, { value: "6", label: "Juni" },
  { value: "7", label: "Juli" }, { value: "8", label: "Agustus" }, { value: "9", label: "September" },
  { value: "10", label: "Oktober" }, { value: "11", label: "November" }, { value: "12", label: "Desember" },
]

type ScopeMode = "all" | "department" | "individual"

interface EmpRow {
  id: string
  full_name: string
  employee_number: string
  department_id: string | null
  department_name: string | null
  division_id: string | null
  division_name: string | null
}

export default function GeneratePayrollPage() {
  const router = useRouter()
  const { createPeriod } = usePayroll()
  const { entities } = useEntities()
  const { configs, overrides, fetchConfigs, fetchOverrides, upsertOverride, resolveDates } = usePayrollCutoffConfig()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    period_year: new Date().getFullYear().toString(),
    period_month: String(new Date().getMonth() + 1),
    payment_date: "",
    entity_id: "",
  })

  // Cut-off dates
  const [attStart, setAttStart] = useState("")
  const [attEnd,   setAttEnd]   = useState("")
  const [payStart, setPayStart] = useState("")
  const [payEnd,   setPayEnd]   = useState("")
  const [datesFromConfig, setDatesFromConfig] = useState(false)

  // Scope
  const [scopeMode, setScopeMode] = useState<ScopeMode>("all")
  const [employees, setEmployees] = useState<EmpRow[]>([])
  const [loadingEmps, setLoadingEmps] = useState(false)
  const [selectedDepts, setSelectedDepts] = useState<Set<string>>(new Set())
  const [selectedEmps, setSelectedEmps] = useState<Set<string>>(new Set())
  const [empSearch, setEmpSearch] = useState("")

  // Fetch employees when entity changes
  useEffect(() => {
    if (!formData.entity_id) { setEmployees([]); return }
    setLoadingEmps(true)
    ;(async () => {
      try {
        const tenantId = getTenantId()
        const { data } = await (insForge as any)
          .from("user_profiles")
          .select(`
            id, full_name, employee_number, department_id, division_id,
            departments:department_id(name),
            divisions:division_id(name)
          `)
          .eq("tenant_id", tenantId)
          .eq("status", "active")
          .or(`entity_id.eq.${formData.entity_id},entity_id.is.null`)
          .order("full_name")

        setEmployees(
          (data || []).map((e: any) => ({
            id: e.id,
            full_name: e.full_name,
            employee_number: e.employee_number,
            department_id: e.department_id,
            department_name: e.departments?.name ?? null,
            division_id: e.division_id,
            division_name: e.divisions?.name ?? null,
          }))
        )
      } finally {
        setLoadingEmps(false)
      }
    })()
  }, [formData.entity_id])

  // Cut-off config
  useEffect(() => {
    if (!formData.entity_id) return
    const year = parseInt(formData.period_year)
    const month = parseInt(formData.period_month)
    if (!year || !month) return
    Promise.all([fetchConfigs(formData.entity_id), fetchOverrides(formData.entity_id, year, month)])
  }, [formData.entity_id, formData.period_year, formData.period_month]) // eslint-disable-line

  useEffect(() => {
    if (!formData.entity_id) return
    const year = parseInt(formData.period_year)
    const month = parseInt(formData.period_month)
    if (!year || !month) return
    const dates = resolveDates(formData.entity_id, year, month)
    setAttStart(dates.attStart); setAttEnd(dates.attEnd)
    setPayStart(dates.payStart); setPayEnd(dates.payEnd)
    setDatesFromConfig(true)
  }, [configs, overrides, formData.entity_id, formData.period_year, formData.period_month]) // eslint-disable-line

  const activeCfg = configs.find((c) => c.entity_id === formData.entity_id && !c.paygroup_name)
  const hasCutoffConfig = configs.some((c) => c.entity_id === formData.entity_id)

  // Department grouping
  const departments = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>()
    for (const e of employees) {
      const key = e.department_id ?? "__none__"
      const name = e.department_name ?? "Tanpa Departemen"
      const existing = map.get(key)
      if (existing) existing.count++
      else map.set(key, { id: key, name, count: 1 })
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [employees])

  function toggleDept(deptId: string) {
    setSelectedDepts((prev) => {
      const next = new Set(prev)
      if (next.has(deptId)) next.delete(deptId)
      else next.add(deptId)
      return next
    })
  }

  function toggleEmp(empId: string) {
    setSelectedEmps((prev) => {
      const next = new Set(prev)
      if (next.has(empId)) next.delete(empId)
      else next.add(empId)
      return next
    })
  }

  function selectAllEmps() {
    setSelectedEmps(new Set(filteredEmps.map((e) => e.id)))
  }
  function clearAllEmps() { setSelectedEmps(new Set()) }

  const filteredEmps = useMemo(() =>
    employees.filter((e) =>
      empSearch === "" ||
      e.full_name.toLowerCase().includes(empSearch.toLowerCase()) ||
      (e.employee_number || "").includes(empSearch)
    ),
  [employees, empSearch])

  // Resolve final employee IDs to generate
  function resolveEmployeeIds(): string[] | undefined {
    if (scopeMode === "all") return undefined
    if (scopeMode === "department") {
      if (selectedDepts.size === 0) return undefined
      return employees
        .filter((e) => selectedDepts.has(e.department_id ?? "__none__"))
        .map((e) => e.id)
    }
    if (scopeMode === "individual") {
      return selectedEmps.size > 0 ? [...selectedEmps] : undefined
    }
  }

  function buildPeriodName(): string {
    const monthLabel = MONTHS.find((m) => m.value === formData.period_month)?.label ?? formData.period_month
    const base = `${monthLabel} ${formData.period_year}`
    if (scopeMode === "all") return `${base} — Semua Karyawan`
    if (scopeMode === "department") {
      const names = departments
        .filter((d) => selectedDepts.has(d.id))
        .map((d) => d.name)
      if (names.length === 0) return base
      const preview = names.slice(0, 2).join(", ")
      return `${base} — ${preview}${names.length > 2 ? ` +${names.length - 2} lainnya` : ""}`
    }
    if (scopeMode === "individual") {
      const names = employees
        .filter((e) => selectedEmps.has(e.id))
        .map((e) => e.full_name)
      if (names.length === 0) return base
      const preview = names.slice(0, 2).join(", ")
      return `${base} — ${preview}${names.length > 2 ? ` +${names.length - 2} lainnya` : ""}`
    }
    return base
  }

  const scopeCount = useMemo(() => {
    if (scopeMode === "all") return employees.length
    if (scopeMode === "department") {
      return employees.filter((e) => selectedDepts.has(e.department_id ?? "__none__")).length
    }
    return selectedEmps.size
  }, [scopeMode, employees, selectedDepts, selectedEmps])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!formData.entity_id) { setError("Pilih entitas payroll terlebih dahulu"); return }

    const employeeIds = resolveEmployeeIds()
    if ((scopeMode === "department" && selectedDepts.size === 0) ||
        (scopeMode === "individual" && selectedEmps.size === 0)) {
      setError("Pilih minimal satu departemen / karyawan"); return
    }

    setLoading(true)
    try {
      const year  = parseInt(formData.period_year)
      const month = parseInt(formData.period_month)

      const resolvedDefault = resolveDates(formData.entity_id, year, month)
      const datesModified =
        attStart !== resolvedDefault.attStart || attEnd !== resolvedDefault.attEnd ||
        payStart !== resolvedDefault.payStart || payEnd !== resolvedDefault.payEnd

      if (datesModified) {
        await upsertOverride({
          entity_id: formData.entity_id, period_year: year, period_month: month,
          paygroup_name: null, attendance_start_date: attStart, attendance_end_date: attEnd,
          payroll_start_date: payStart, payroll_end_date: payEnd,
          reason: "Manual override dari halaman generate",
        })
      }

      const result = await createPeriod({
        entity_id: formData.entity_id, period_year: year, period_month: month,
        period_name: buildPeriodName(),
        start_date:  payStart || `${year}-${String(month).padStart(2,"0")}-01`,
        end_date:    payEnd   || new Date(year, month, 0).toISOString().split("T")[0],
        attendance_start_date: attStart || null, attendance_end_date: attEnd || null,
        cutoff_config_id: activeCfg?.id ?? null,
        is_prorata_enabled: activeCfg?.enable_prorata ?? true,
        prorata_divisor:    activeCfg?.prorata_divisor ?? 30,
        payment_date: formData.payment_date || null,
        status: "processing",
      })

      const summary = await generatePayrollDetailsForPeriod({
        payrollPeriodId: result.id,
        entityId: formData.entity_id,
        periodStart:     payStart,
        periodEnd:       payEnd,
        attendanceStart: attStart || undefined,
        attendanceEnd:   attEnd   || undefined,
        prorataEnabled:  activeCfg?.enable_prorata ?? true,
        prorataDivisor:  activeCfg?.prorata_divisor ?? 30,
        employeeIds,
      })

      if (summary.errors.length > 0 && summary.generated === 0) throw new Error(summary.errors[0])
      if (summary.errors.length > 0) console.warn("Partial errors:", summary.errors)
      router.push(`/hr/payroll/${result.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate payroll")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/payroll/processing">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Generate Payroll</h1>
          <p className="text-muted-foreground text-sm">Buat payroll periode baru</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Card 1: Periode ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-500" /> Periode Payroll
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Entitas <span className="text-red-400">*</span></Label>
                <Select value={formData.entity_id || undefined} onValueChange={(v) => setFormData({ ...formData, entity_id: v })}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Pilih entitas payroll" />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.map((ent) => (
                      <SelectItem key={ent.id} value={String(ent.id)}>{ent.code} — {ent.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tahun <span className="text-red-400">*</span></Label>
                <Input type="number" value={formData.period_year}
                  onChange={(e) => setFormData({ ...formData, period_year: e.target.value })}
                  className="bg-background border-border text-foreground" />
              </div>
              <div className="space-y-2">
                <Label>Bulan <span className="text-red-400">*</span></Label>
                <Select value={formData.period_month} onValueChange={(v) => setFormData({ ...formData, period_month: v })}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>{MONTHS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tanggal Pembayaran</Label>
                <Input type="date" value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  className="bg-background border-border text-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Card 2: Cut-off Dates ── */}
        {formData.entity_id && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-emerald-500" /> Periode Cut-off
                </CardTitle>
                {datesFromConfig && (
                  <span className={`text-xs px-2 py-1 rounded-md ${hasCutoffConfig ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                    {hasCutoffConfig ? "Dari konfigurasi" : "Default bulan penuh"}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 p-3 rounded-lg bg-muted/30 border border-border text-xs text-muted-foreground">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Tanggal diisi otomatis dari konfigurasi cut-off. Edit manual untuk override bulan ini.
                  {!hasCutoffConfig && <span className="text-yellow-400 ml-1">Belum ada konfigurasi — atur di <strong>Master Data → Payroll Config → Cut-off & Periode</strong>.</span>}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">Periode Absensi <span className="ml-1 text-xs font-normal text-muted-foreground">(absen, denda, lembur)</span></p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-xs text-muted-foreground">Mulai</Label><Input type="date" value={attStart} onChange={(e) => setAttStart(e.target.value)} className="text-sm" /></div>
                    <div className="space-y-1"><Label className="text-xs text-muted-foreground">Selesai</Label><Input type="date" value={attEnd} onChange={(e) => setAttEnd(e.target.value)} className="text-sm" /></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">Periode Gaji <span className="ml-1 text-xs font-normal text-muted-foreground">(gaji pokok, tunjangan tetap)</span></p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-xs text-muted-foreground">Mulai</Label><Input type="date" value={payStart} onChange={(e) => setPayStart(e.target.value)} className="text-sm" /></div>
                    <div className="space-y-1"><Label className="text-xs text-muted-foreground">Selesai</Label><Input type="date" value={payEnd} onChange={(e) => setPayEnd(e.target.value)} className="text-sm" /></div>
                  </div>
                </div>
              </div>
              {activeCfg && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={`w-1.5 h-1.5 rounded-full ${activeCfg.enable_prorata ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                  {activeCfg.enable_prorata ? `Prorata aktif — per ${activeCfg.prorata_divisor} hari` : "Prorata nonaktif"}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Card 3: Scope ── */}
        {formData.entity_id && (
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" /> Cakupan Karyawan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Mode selector */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { mode: "all" as ScopeMode, icon: <Users className="w-4 h-4" />, label: "Semua Karyawan", desc: `${employees.length} karyawan` },
                  { mode: "department" as ScopeMode, icon: <Building2 className="w-4 h-4" />, label: "Per Departemen", desc: `${departments.length} departemen` },
                  { mode: "individual" as ScopeMode, icon: <User className="w-4 h-4" />, label: "Per Karyawan", desc: "Pilih satu per satu" },
                ].map(({ mode, icon, label, desc }) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setScopeMode(mode)}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all ${
                      scopeMode === mode
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                        : "border-border text-muted-foreground hover:border-emerald-500/50 hover:text-foreground"
                    }`}
                  >
                    {icon}
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-xs opacity-70">{loadingEmps ? "..." : desc}</span>
                  </button>
                ))}
              </div>

              {/* Department selection */}
              {scopeMode === "department" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground">Pilih Departemen</p>
                    <button type="button" onClick={() => setSelectedDepts(new Set(departments.map(d => d.id)))}
                      className="text-xs text-emerald-500 hover:underline">Pilih Semua</button>
                  </div>
                  {departments.map((dept) => (
                    <label key={dept.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors">
                      <Checkbox
                        checked={selectedDepts.has(dept.id)}
                        onCheckedChange={() => toggleDept(dept.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{dept.name}</p>
                        <p className="text-xs text-muted-foreground">{dept.count} karyawan</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Individual selection */}
              {scopeMode === "individual" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input placeholder="Cari nama atau nomor karyawan..." value={empSearch}
                        onChange={(e) => setEmpSearch(e.target.value)}
                        className="pl-8 h-8 text-sm bg-background" />
                    </div>
                    <button type="button" onClick={selectAllEmps} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground whitespace-nowrap">
                      <CheckSquare className="w-3.5 h-3.5" /> Semua
                    </button>
                    <button type="button" onClick={clearAllEmps} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground whitespace-nowrap">
                      <Square className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                    {filteredEmps.map((emp) => (
                      <label key={emp.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors">
                        <Checkbox
                          checked={selectedEmps.has(emp.id)}
                          onCheckedChange={() => toggleEmp(emp.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground leading-tight">{emp.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {emp.employee_number}
                            {emp.department_name && <span> · {emp.department_name}</span>}
                          </p>
                        </div>
                      </label>
                    ))}
                    {filteredEmps.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Karyawan tidak ditemukan</p>
                    )}
                  </div>
                </div>
              )}

              {/* Summary badge */}
              {scopeMode !== "all" && scopeCount > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
                  <Users className="w-4 h-4 shrink-0" />
                  <span><strong>{scopeCount}</strong> karyawan akan di-generate</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Actions ── */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/payroll/processing">
            <Button type="button" variant="ghost" className="text-muted-foreground">Batal</Button>
          </Link>
          <Button
            type="submit"
            disabled={loading || !formData.entity_id}
            className="bg-emerald-600 hover:bg-emerald-700 min-w-40"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
              : `Generate Payroll${scopeMode !== "all" && scopeCount > 0 ? ` (${scopeCount})` : ""}`
            }
          </Button>
        </div>
      </form>
    </div>
  )
}
