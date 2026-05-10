"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calculator, Loader2, Wallet, CalendarDays, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEmployees } from "@/hooks/useEmployees"
import { usePayroll } from "@/hooks/usePayroll"
import { useEntities } from "@/hooks/useEntities"
import { usePayrollCutoffConfig } from "@/hooks/usePayrollCutoffConfig"
import { generatePayrollDetailsForPeriod } from "@/lib/payroll-engine"
import Link from "next/link"

const MONTHS = [
  { value: "1", label: "Januari" }, { value: "2", label: "Februari" }, { value: "3", label: "Maret" },
  { value: "4", label: "April" }, { value: "5", label: "Mei" }, { value: "6", label: "Juni" },
  { value: "7", label: "Juli" }, { value: "8", label: "Agustus" }, { value: "9", label: "September" },
  { value: "10", label: "Oktober" }, { value: "11", label: "November" }, { value: "12", label: "Desember" },
]

export default function GeneratePayrollPage() {
  const router = useRouter()
  const { employees } = useEmployees()
  const { createPeriod } = usePayroll()
  const { entities } = useEntities()
  const {
    configs, overrides, fetchConfigs, fetchOverrides, upsertOverride, resolveDates,
  } = usePayrollCutoffConfig()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    period_year: new Date().getFullYear().toString(),
    period_month: String(new Date().getMonth() + 1),
    payment_date: "",
    entity_id: "",
  })

  // Computed cut-off dates (editable by user)
  const [attStart, setAttStart] = useState("")
  const [attEnd, setAttEnd]     = useState("")
  const [payStart, setPayStart] = useState("")
  const [payEnd, setPayEnd]     = useState("")
  const [datesFromConfig, setDatesFromConfig] = useState(false) // true = auto-populated

  // When entity / year / month changes → fetch config + overrides, resolve dates
  useEffect(() => {
    if (!formData.entity_id) return
    const year  = parseInt(formData.period_year)
    const month = parseInt(formData.period_month)
    if (!year || !month) return

    ;(async () => {
      await Promise.all([
        fetchConfigs(formData.entity_id),
        fetchOverrides(formData.entity_id, year, month),
      ])
    })()
  }, [formData.entity_id, formData.period_year, formData.period_month]) // eslint-disable-line

  // Re-resolve whenever configs/overrides are fetched
  useEffect(() => {
    if (!formData.entity_id) return
    const year  = parseInt(formData.period_year)
    const month = parseInt(formData.period_month)
    if (!year || !month) return

    const dates = resolveDates(formData.entity_id, year, month)
    setAttStart(dates.attStart)
    setAttEnd(dates.attEnd)
    setPayStart(dates.payStart)
    setPayEnd(dates.payEnd)
    setDatesFromConfig(true)
  }, [configs, overrides, formData.entity_id, formData.period_year, formData.period_month]) // eslint-disable-line

  // Detect active cutoff config for prorata settings
  const activeCfg = configs.find(
    (c) => c.entity_id === formData.entity_id && !c.paygroup_name
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!formData.entity_id) { setError("Pilih entitas payroll terlebih dahulu"); return }

    setLoading(true)
    try {
      const year  = parseInt(formData.period_year)
      const month = parseInt(formData.period_month)

      // If user manually edited dates, save as override
      const resolvedDefault = resolveDates(formData.entity_id, year, month)
      const datesModified =
        attStart !== resolvedDefault.attStart ||
        attEnd   !== resolvedDefault.attEnd   ||
        payStart !== resolvedDefault.payStart ||
        payEnd   !== resolvedDefault.payEnd

      if (datesModified) {
        await upsertOverride({
          entity_id: formData.entity_id,
          period_year: year,
          period_month: month,
          paygroup_name: null,
          attendance_start_date: attStart,
          attendance_end_date:   attEnd,
          payroll_start_date:    payStart,
          payroll_end_date:      payEnd,
          reason: "Manual override dari halaman generate",
        })
      }

      const result = await createPeriod({
        entity_id: formData.entity_id,
        period_year: year,
        period_month: month,
        start_date:  payStart || `${year}-${String(month).padStart(2,"0")}-01`,
        end_date:    payEnd   || new Date(year, month, 0).toISOString().split("T")[0],
        attendance_start_date: attStart || null,
        attendance_end_date:   attEnd   || null,
        cutoff_config_id:  activeCfg?.id ?? null,
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
      })

      if (summary.errors.length > 0 && summary.generated === 0) throw new Error(summary.errors[0])
      if (summary.errors.length > 0) console.warn("Payroll generation partial errors:", summary.errors)

      router.push(`/payroll/processing`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate payroll")
    } finally {
      setLoading(false)
    }
  }

  const hasCutoffConfig = configs.some((c) => c.entity_id === formData.entity_id)

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
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* ── Card 1: Pilih Periode ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-500" /> Periode Payroll
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Entitas <span className="text-red-400">*</span></Label>
                  <Select
                    value={formData.entity_id || undefined}
                    onValueChange={(v) => setFormData({ ...formData, entity_id: v })}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="Pilih entitas payroll" />
                    </SelectTrigger>
                    <SelectContent>
                      {entities.map((ent) => (
                        <SelectItem key={ent.id} value={String(ent.id)}>
                          {ent.code} — {ent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tahun <span className="text-red-400">*</span></Label>
                  <Input
                    type="number"
                    value={formData.period_year}
                    onChange={(e) => setFormData({ ...formData, period_year: e.target.value })}
                    required
                    className="bg-background border-border text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bulan <span className="text-red-400">*</span></Label>
                  <Select
                    value={formData.period_month}
                    onValueChange={(v) => setFormData({ ...formData, period_month: v })}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tanggal Pembayaran</Label>
                  <Input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>

              {/* Total karyawan */}
              <div className="p-4 bg-background rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Karyawan</p>
                    <p className="text-lg font-bold text-foreground">{employees.length} orang</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Card 2: Cut-off Dates (shown after entity selected) ── */}
          {formData.entity_id && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-emerald-500" /> Periode Cut-off
                  </CardTitle>
                  {datesFromConfig && (
                    <span className={`text-xs px-2 py-1 rounded-md ${
                      hasCutoffConfig
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {hasCutoffConfig ? "Dari konfigurasi" : "Default bulan penuh"}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Info */}
                <div className="flex gap-2 p-3 rounded-lg bg-muted/30 border border-border text-xs text-muted-foreground">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    Tanggal diisi otomatis dari konfigurasi cut-off entitas.
                    Edit manual untuk override bulan ini saja —
                    perubahan akan tersimpan sebagai pengecualian.
                    {!hasCutoffConfig && (
                      <span className="text-yellow-400 ml-1">
                        Belum ada konfigurasi cut-off untuk entitas ini — atur di
                        <strong> Master Data → Payroll Config → Cut-off & Periode</strong>.
                      </span>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {/* Attendance cut-off */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">
                      Periode Absensi
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (untuk absen, denda, lembur)
                      </span>
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Mulai</Label>
                        <Input
                          type="date"
                          value={attStart}
                          onChange={(e) => setAttStart(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Selesai</Label>
                        <Input
                          type="date"
                          value={attEnd}
                          onChange={(e) => setAttEnd(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payroll cut-off */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">
                      Periode Gaji
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (untuk gaji pokok, tunjangan tetap)
                      </span>
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Mulai</Label>
                        <Input
                          type="date"
                          value={payStart}
                          onChange={(e) => setPayStart(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Selesai</Label>
                        <Input
                          type="date"
                          value={payEnd}
                          onChange={(e) => setPayEnd(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prorata indicator */}
                {activeCfg && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${activeCfg.enable_prorata ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                    {activeCfg.enable_prorata
                      ? `Prorata aktif — karyawan baru dihitung per ${activeCfg.prorata_divisor} hari`
                      : "Prorata nonaktif"}
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
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generate detail payroll...</>
                : "Generate Payroll"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
