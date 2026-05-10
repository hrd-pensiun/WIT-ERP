"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import {
  ArrowLeft, Wallet, Download, Loader2, SlidersHorizontal,
  CheckCircle2, ChevronRight, Plus, Trash2,
  CalendarCheck, CalendarX, Clock, CalendarDays, Info,
} from "lucide-react"
import { insForge } from "@/lib/insforge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet"
import { usePayroll } from "@/hooks/usePayroll"
import { generatePayrollDetailsForPeriod } from "@/lib/payroll-engine"

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(n)
}

function parseIDR(s: string) {
  const n = parseInt(s.replace(/\D/g, ""), 10)
  return isNaN(n) ? 0 : n
}

function fmtInput(s: string) {
  const digits = s.replace(/\D/g, "")
  if (!digits) return ""
  return new Intl.NumberFormat("id-ID").format(parseInt(digits, 10))
}

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  approved: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  paid: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
}

const SYSTEM_DEDUCTION_KEYS = ["BPJS TK", "BPJS Kesehatan", "PPh21", "Potongan Absensi"]

// ── Calibration Sheet ─────────────────────────────────────────────────────────

type AllowanceRow = { name: string; amount: number; is_fixed?: boolean }
type DeductionRow = { name: string; amount: number }

interface KalibrasiState {
  basicSalary: string
  allowances: AllowanceRow[]
  bpjsTk: string
  bpjsKes: string
  pph21: string
  attendanceDeduction: string
  customDeductions: DeductionRow[]
}

interface AttSummary {
  workingDays: number
  present: number
  late: number
  absent: number
}

function buildState(row: any): KalibrasiState {
  const fmt = (n: number) => n > 0 ? fmtInput(String(Math.round(n))) : ""
  const allowances: AllowanceRow[] = (row.allowance_details || []).map((a: any) => ({
    name: a.name, amount: a.amount, is_fixed: a.is_fixed,
  }))
  const customDeductions: DeductionRow[] = (row.deduction_details || [])
    .filter((d: any) => !SYSTEM_DEDUCTION_KEYS.includes(d.name))
    .map((d: any) => ({ name: d.name, amount: d.amount }))
  return {
    basicSalary: fmt(row.basic_salary || 0),
    allowances,
    bpjsTk: fmt(row.bpjs_tk_amount || 0),
    bpjsKes: fmt(row.bpjs_kes_amount || 0),
    pph21: fmt(row.pph21_amount || 0),
    attendanceDeduction: fmt(row.attendance_deduction_amount || 0),
    customDeductions,
  }
}

function computeTotals(state: KalibrasiState) {
  const basic = parseIDR(state.basicSalary)
  const totalAllowances = state.allowances.reduce((s, a) => s + a.amount, 0)
  const grossSalary = basic + totalAllowances
  const bpjsTk = parseIDR(state.bpjsTk)
  const bpjsKes = parseIDR(state.bpjsKes)
  const pph21 = parseIDR(state.pph21)
  const attendance = parseIDR(state.attendanceDeduction)
  const customDed = state.customDeductions.reduce((s, d) => s + d.amount, 0)
  const totalDeductions = bpjsTk + bpjsKes + pph21 + attendance + customDed
  const netSalary = grossSalary - totalDeductions
  return { basic, totalAllowances, grossSalary, bpjsTk, bpjsKes, pph21, attendance, customDed, totalDeductions, netSalary }
}

function pct(amount: number, base: number) {
  if (!base) return "—"
  return `${(amount / base * 100).toFixed(1)}%`
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">
      {children}
    </p>
  )
}

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-tight">{children}</p>
  )
}

function EditableAmount({
  value, onChange, className,
}: { value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(fmtInput(e.target.value))}
      className={`text-right text-sm rounded-md px-3 py-1.5 border border-border bg-background text-foreground focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 ${className ?? ""}`}
      placeholder="0"
    />
  )
}

function KalibrasiSheet({
  row,
  periodData,
  open,
  onClose,
  onSaved,
  updateDetail,
}: {
  row: any
  periodData: any
  open: boolean
  onClose: () => void
  onSaved: (updated: any) => void
  updateDetail: (id: string, patch: Record<string, any>) => Promise<void>
}) {
  const [state, setState] = useState<KalibrasiState>(() => buildState(row))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [att, setAtt] = useState<AttSummary | null>(null)

  useEffect(() => { setState(buildState(row)) }, [row?.id])

  // Fetch attendance summary for this employee in the period window
  useEffect(() => {
    if (!row?.user_profile_id || !periodData) return
    const start = String(periodData.attendance_start_date || periodData.start_date).slice(0, 10)
    const end   = String(periodData.attendance_end_date   || periodData.end_date).slice(0, 10)
    ;(async () => {
      try {
        const { data } = await (insForge as any)
          .from("attendance_records")
          .select("status, check_in_status")
          .eq("tenant_id", periodData.tenant_id || "00000000-0000-0000-0000-000000000000")
          .eq("user_profile_id", row.user_profile_id)
          .gte("date", start)
          .lte("date", end)
        if (!data) return
        const absent  = data.filter((r: any) => r.status === "absent").length
        const late    = data.filter((r: any) => r.check_in_status === "late").length
        const present = data.filter((r: any) => r.status === "present").length
        setAtt({ workingDays: data.length, present, late, absent })
      } catch { /* ignore */ }
    })()
  }, [row?.user_profile_id, row?.id, periodData])

  const totals = useMemo(() => computeTotals(state), [state])

  const setAllowanceAmount = (idx: number, raw: string) => {
    const amount = parseIDR(raw)
    setState((prev) => ({ ...prev, allowances: prev.allowances.map((a, i) => i === idx ? { ...a, amount } : a) }))
  }

  const addCustomDeduction = () =>
    setState((prev) => ({ ...prev, customDeductions: [...prev.customDeductions, { name: "", amount: 0 }] }))

  const setCustomDeduction = (idx: number, field: "name" | "amount", val: string) =>
    setState((prev) => ({
      ...prev,
      customDeductions: prev.customDeductions.map((d, i) =>
        i === idx ? { ...d, [field]: field === "amount" ? parseIDR(val) : val } : d
      ),
    }))

  const removeCustomDeduction = (idx: number) =>
    setState((prev) => ({ ...prev, customDeductions: prev.customDeductions.filter((_, i) => i !== idx) }))

  const handleSave = async () => {
    setSaving(true); setError(null)
    try {
      const t = totals
      const allowanceDetails = state.allowances.map((a) => ({ name: a.name, amount: a.amount, is_fixed: a.is_fixed ?? true }))
      const deductionDetails: DeductionRow[] = [
        ...(t.attendance > 0 ? [{ name: "Potongan Absensi", amount: t.attendance }] : []),
        { name: "BPJS TK", amount: t.bpjsTk },
        { name: "BPJS Kesehatan", amount: t.bpjsKes },
        { name: "PPh21", amount: t.pph21 },
        ...state.customDeductions.filter((d) => d.name.trim()),
      ]
      await updateDetail(row.id, {
        basic_salary: t.basic, allowance_details: allowanceDetails, total_allowances: t.totalAllowances,
        deduction_details: deductionDetails, total_deductions: t.totalDeductions,
        bpjs_tk_amount: t.bpjsTk, bpjs_kes_amount: t.bpjsKes, pph21_amount: t.pph21,
        attendance_deduction_amount: t.attendance, gross_salary: t.grossSalary,
        net_salary: t.netSalary, take_home_pay: t.netSalary,
      })
      onSaved({ ...row, ...{ basic_salary: t.basic, total_allowances: t.totalAllowances, total_deductions: t.totalDeductions, gross_salary: t.grossSalary, net_salary: t.netSalary } })
      onClose()
    } catch (err: any) {
      setError(err.message ?? "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  const dpp = Math.max(0, totals.grossSalary - totals.attendance - totals.bpjsTk - totals.bpjsKes)

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent side="right" className="w-full sm:w-1/2 sm:max-w-none flex flex-col p-0 gap-0">

        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
          <SheetTitle className="text-base">
            Kalibrasi — {row?.user_profiles?.full_name ?? "—"}
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            {row?.user_profiles?.employee_number} · Periode {row?._periodLabel}
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── Ringkasan Absensi ── */}
          <section className="rounded-lg border border-border bg-muted/20 p-4">
            <SectionLabel>Ringkasan Absensi</SectionLabel>
            {att ? (
              <div className="grid grid-cols-4 gap-3">
                {[
                  { icon: <CalendarDays className="w-3.5 h-3.5" />, label: "Hari Kerja", value: att.workingDays, color: "text-foreground" },
                  { icon: <CalendarCheck className="w-3.5 h-3.5" />, label: "Hadir", value: att.present, color: "text-emerald-500" },
                  { icon: <Clock className="w-3.5 h-3.5" />, label: "Terlambat", value: att.late, color: "text-yellow-500" },
                  { icon: <CalendarX className="w-3.5 h-3.5" />, label: "Absen", value: att.absent, color: "text-red-400" },
                ].map(({ icon, label, value, color }) => (
                  <div key={label} className="text-center">
                    <div className={`flex justify-center mb-1 ${color}`}>{icon}</div>
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Memuat data absensi...</p>
            )}
            {att && att.workingDays > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50 flex gap-4 text-xs text-muted-foreground">
                <span>
                  <span className="text-foreground font-medium">Gaji/hari</span>:{" "}
                  {fmtIDR(Math.round(parseIDR(state.basicSalary) / att.workingDays))}
                </span>
                {att.absent > 0 && (
                  <span className="text-red-400">
                    Potongan absensi: {att.absent} hari × {fmtIDR(Math.round(parseIDR(state.basicSalary) / att.workingDays))}
                  </span>
                )}
              </div>
            )}
          </section>

          {/* ── Gaji Pokok ── */}
          <section>
            <SectionLabel>Gaji Pokok</SectionLabel>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-6 shrink-0">Rp</span>
              <EditableAmount
                value={state.basicSalary}
                onChange={(v) => setState((p) => ({ ...p, basicSalary: v }))}
                className="flex-1"
              />
            </div>
          </section>

          {/* ── Tunjangan ── */}
          <section>
            <SectionLabel>Tunjangan</SectionLabel>
            <div className="space-y-2">
              {state.allowances.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Tidak ada tunjangan</p>
              ) : (
                state.allowances.map((a, idx) => (
                  <div key={idx}>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-foreground truncate block">{a.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium ${
                          a.is_fixed === false
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {a.is_fixed === false ? "Variabel" : "Tetap"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">Rp</span>
                      <EditableAmount
                        value={a.amount > 0 ? fmtInput(String(Math.round(a.amount))) : ""}
                        onChange={(v) => setAllowanceAmount(idx, v)}
                        className="w-36"
                      />
                    </div>
                    {a.is_fixed === false && att && att.workingDays > 0 && (
                      <Formula>
                        Rp {fmtInput(String(Math.round(a.amount / (att.present + att.late || 1))))} /hari × {att.present + att.late} hari hadir
                      </Formula>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 pt-2 border-t border-border/50 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Tunjangan</span>
                <span className="font-medium text-emerald-600">{fmtIDR(totals.totalAllowances)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-foreground">Gross Salary</span>
                <span className="text-foreground">{fmtIDR(totals.grossSalary)}</span>
              </div>
            </div>
          </section>

          {/* ── Potongan ── */}
          <section>
            <SectionLabel>Potongan</SectionLabel>
            <div className="space-y-3">

              {/* Potongan Absensi */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground flex-1">Potongan Absensi</span>
                  <span className="text-xs text-muted-foreground shrink-0">Rp</span>
                  <EditableAmount
                    value={state.attendanceDeduction}
                    onChange={(v) => setState((p) => ({ ...p, attendanceDeduction: v }))}
                    className="w-36"
                  />
                </div>
                {att && att.workingDays > 0 && att.absent > 0 && (
                  <Formula>
                    {fmtIDR(parseIDR(state.basicSalary))} ÷ {att.workingDays} hari × {att.absent} hari absen
                  </Formula>
                )}
              </div>

              {/* BPJS TK */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground flex-1">BPJS Tenaga Kerja</span>
                  <span className="text-xs text-muted-foreground shrink-0">Rp</span>
                  <EditableAmount
                    value={state.bpjsTk}
                    onChange={(v) => setState((p) => ({ ...p, bpjsTk: v }))}
                    className="w-36"
                  />
                </div>
                <Formula>
                  {fmtIDR(parseIDR(state.basicSalary))} × {pct(parseIDR(state.bpjsTk), parseIDR(state.basicSalary))} (iuran karyawan)
                </Formula>
              </div>

              {/* BPJS Kesehatan */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground flex-1">BPJS Kesehatan</span>
                  <span className="text-xs text-muted-foreground shrink-0">Rp</span>
                  <EditableAmount
                    value={state.bpjsKes}
                    onChange={(v) => setState((p) => ({ ...p, bpjsKes: v }))}
                    className="w-36"
                  />
                </div>
                <Formula>
                  {fmtIDR(parseIDR(state.basicSalary))} × {pct(parseIDR(state.bpjsKes), parseIDR(state.basicSalary))} (iuran karyawan)
                </Formula>
              </div>

              {/* PPh21 */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground flex-1">PPh21</span>
                  <span className="text-xs text-muted-foreground shrink-0">Rp</span>
                  <EditableAmount
                    value={state.pph21}
                    onChange={(v) => setState((p) => ({ ...p, pph21: v }))}
                    className="w-36"
                  />
                </div>
                <Formula>
                  DPP {fmtIDR(dpp)} × {pct(parseIDR(state.pph21), dpp)}
                </Formula>
                <div className="mt-1 text-[10px] text-muted-foreground/60 flex items-start gap-1">
                  <Info className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                  <span>DPP = Gross − Potongan Absensi − BPJS TK − BPJS Kes</span>
                </div>
              </div>

              {/* Custom deductions */}
              {state.customDeductions.map((d, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={d.name}
                    onChange={(e) => setCustomDeduction(idx, "name", e.target.value)}
                    placeholder="Nama potongan lainnya"
                    className="flex-1 text-sm rounded-md px-3 py-1.5 border border-border bg-background text-foreground focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs text-muted-foreground shrink-0">Rp</span>
                  <EditableAmount
                    value={d.amount > 0 ? fmtInput(String(Math.round(d.amount))) : ""}
                    onChange={(v) => setCustomDeduction(idx, "amount", v)}
                    className="w-36"
                  />
                  <button onClick={() => removeCustomDeduction(idx)} className="text-muted-foreground hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <button
                onClick={addCustomDeduction}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah potongan lainnya
              </button>
            </div>

            <div className="mt-3 pt-2 border-t border-border/50 flex justify-between text-sm">
              <span className="text-muted-foreground">Total Potongan</span>
              <span className="font-medium text-red-500">{fmtIDR(totals.totalDeductions)}</span>
            </div>
          </section>

          {/* ── Kalkulasi Akhir ── */}
          <section className="rounded-lg border border-border bg-muted/10 p-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Gross Salary</span><span>{fmtIDR(totals.grossSalary)}</span>
            </div>
            <div className="flex justify-between text-red-400">
              <span>Total Potongan</span><span>− {fmtIDR(totals.totalDeductions)}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-foreground border-t border-border pt-2 mt-1">
              <span>Take Home Pay</span>
              <span className="text-emerald-500">{fmtIDR(totals.netSalary)}</span>
            </div>
          </section>

          {error && (
            <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        <SheetFooter className="px-6 py-4 border-t border-border shrink-0 flex gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving} className="flex-1">Batal</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</>
              : <><CheckCircle2 className="w-4 h-4" />Simpan Kalibrasi</>
            }
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PayrollPeriodClient({ period }: { period: string }) {
  const { getPeriod, fetchDetails, updateDetail, approvePeriod, loading } = usePayroll()
  const [periodData, setPeriodData] = useState<any>(null)
  const [payrollData, setPayrollData] = useState<any[]>([])
  const [selectedRow, setSelectedRow] = useState<any>(null)
  const [approving, setApproving] = useState(false)
  const [approveError, setApproveError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  useEffect(() => {
    getPeriod(period).then(setPeriodData).catch(() => setPeriodData(null))
    fetchDetails(period).then(setPayrollData).catch(() => setPayrollData([]))
  }, [period, getPeriod, fetchDetails])

  const totalNet = payrollData.reduce((sum, p) => sum + (p.net_salary || 0), 0)
  const totalGross = payrollData.reduce((sum, p) => sum + (p.gross_salary || 0), 0)
  const draftCount = payrollData.filter((p) => p.status === "draft").length

  const periodLabel = periodData
    ? `${String(periodData.period_month).padStart(2, "0")}/${periodData.period_year}`
    : period

  const handleRowSaved = (updated: any) => {
    setPayrollData((prev) => prev.map((r) => r.id === updated.id ? updated : r))
  }

  const handleGenerate = async () => {
    if (!periodData) return
    setGenerating(true)
    setGenerateError(null)
    try {
      const d = (s: string | null) => s ? String(s).slice(0, 10) : undefined
      const summary = await generatePayrollDetailsForPeriod({
        payrollPeriodId: period,
        entityId:        periodData.entity_id,
        periodStart:     d(periodData.start_date)!,
        periodEnd:       d(periodData.end_date)!,
        attendanceStart: d(periodData.attendance_start_date ?? null),
        attendanceEnd:   d(periodData.attendance_end_date   ?? null),
        prorataEnabled:  periodData.is_prorata_enabled ?? true,
        prorataDivisor:  periodData.prorata_divisor    ?? 30,
      })
      if (summary.errors.length > 0 && summary.generated === 0) {
        throw new Error(summary.errors[0])
      }
      if (summary.errors.length > 0) console.warn("Partial errors:", summary.errors)
      // Reload detail
      const details = await fetchDetails(period)
      setPayrollData(details)
    } catch (err: any) {
      setGenerateError(err.message ?? "Gagal generate payroll")
    } finally {
      setGenerating(false)
    }
  }

  const handleApprove = async () => {
    if (!confirm(`Setujui semua ${draftCount} entri draft? Tindakan ini tidak dapat dibatalkan.`)) return
    setApproving(true)
    setApproveError(null)
    try {
      await approvePeriod(period)
      setPeriodData((p: any) => p ? { ...p, status: "approved" } : p)
      setPayrollData((prev) => prev.map((r) => r.status === "draft" ? { ...r, status: "approved" } : r))
    } catch (err: any) {
      setApproveError(err.message ?? "Gagal approve")
    } finally {
      setApproving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/payroll/processing">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Detail Payroll</h1>
            <p className="text-muted-foreground text-sm">Periode: {periodLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {draftCount > 0 && (
            <Button
              onClick={handleApprove}
              disabled={approving}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              {approving
                ? <><Loader2 className="w-4 h-4 animate-spin" />Memproses...</>
                : <><CheckCircle2 className="w-4 h-4" />Validasi Semua ({draftCount})</>
              }
            </Button>
          )}
          <Button variant="outline" className="border-border gap-1.5">
            <Download className="w-4 h-4" />Export
          </Button>
        </div>
      </div>

      {(approveError || generateError) && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {approveError || generateError}
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Karyawan</p>
            <p className="text-2xl font-bold text-foreground">{payrollData.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Gross</p>
            <p className="text-xl font-bold text-foreground">{fmtIDR(totalGross)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Net Salary</p>
            <p className="text-xl font-bold text-emerald-500">{fmtIDR(totalNet)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Status Periode</p>
            <Badge className={`${STATUS_BADGE[periodData?.status || "draft"]} mt-1`}>
              {(periodData?.status || "draft").toUpperCase()}
            </Badge>
            {draftCount > 0 && (
              <p className="text-[10px] text-muted-foreground mt-1">{draftCount} menunggu validasi</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar Gaji Karyawan</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : payrollData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Karyawan</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Gaji Pokok</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Tunjangan</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Potongan</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Net Salary</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {payrollData.map((row) => (
                    <tr key={row.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="py-3 px-4">
                        <p className="font-medium text-foreground">{row.user_profiles?.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{row.user_profiles?.employee_number || "—"}</p>
                      </td>
                      <td className="py-3 px-4 text-right text-foreground tabular-nums">
                        {fmtIDR(row.basic_salary || 0)}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-500 tabular-nums">
                        +{fmtIDR(row.total_allowances || 0)}
                      </td>
                      <td className="py-3 px-4 text-right text-red-400 tabular-nums">
                        -{fmtIDR(row.total_deductions || 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-foreground tabular-nums">
                        {fmtIDR(row.net_salary || 0)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={STATUS_BADGE[row.status] ?? STATUS_BADGE.draft}>
                          {row.status?.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedRow({ ...row, _periodLabel: periodLabel })}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1.5 hover:bg-muted transition-colors whitespace-nowrap"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          Kalibrasi
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground space-y-4">
              <Wallet className="w-12 h-12 mx-auto opacity-40" />
              <div>
                <p className="font-medium text-foreground">Belum ada data payroll</p>
                <p className="text-sm mt-1">Klik tombol di bawah untuk generate detail gaji karyawan</p>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={generating || !periodData}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {generating
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                  : "Generate Payroll Detail"
                }
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kalibrasi Sheet */}
      {selectedRow && (
        <KalibrasiSheet
          row={selectedRow}
          periodData={periodData}
          open={!!selectedRow}
          onClose={() => setSelectedRow(null)}
          onSaved={handleRowSaved}
          updateDetail={updateDetail}
        />
      )}
    </div>
  )
}
