"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Plus,
  Eye,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  RefreshCw,
  Users,
  Banknote,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePayroll } from "@/hooks/usePayroll"
import { formatIDR, periodLabel } from "@/lib/mock-payroll-data"

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  draft:      { label: "Draft",     cls: "bg-muted text-foreground border-border",                         icon: Clock },
  processing: { label: "Diproses",  cls: "bg-amber-500/20 text-amber-600 border-amber-500/30",             icon: RefreshCw },
  approved:   { label: "Disetujui", cls: "bg-blue-500/20 text-blue-600 border-blue-500/30",                icon: CheckCircle2 },
  paid:       { label: "Dibayar",   cls: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",       icon: CheckCircle2 },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>
      <cfg.icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

export default function ProcessingPage() {
  const router = useRouter()
  const { periods, loading, error, fetchPeriods } = usePayroll()

  const [filterYear, setFilterYear] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const years = useMemo(() => {
    const y = new Set(periods.map((p: any) => String(p.period_year)))
    y.add(String(new Date().getFullYear()))
    return Array.from(y).sort((a, b) => Number(b) - Number(a))
  }, [periods])

  const filtered = useMemo(() => {
    return periods.filter((p: any) => {
      if (filterYear !== "all" && String(p.period_year) !== filterYear) return false
      if (filterStatus !== "all" && p.status !== filterStatus) return false
      return true
    })
  }, [periods, filterYear, filterStatus])

  const stats = useMemo(() => {
    const active = periods.filter((p: any) => p.status === "processing" || p.status === "approved").length
    const totalEmp = periods[0]?.total_employees ?? 0
    const totalNet = periods[0]?.total_net_salary ?? 0
    const paid = periods.filter((p: any) => p.status === "paid").length
    return { active, totalEmp, totalNet, paid }
  }, [periods])

  const formatDateRange = (p: any) => {
    if (!p.period_start || !p.period_end) return "—"
    const fmt = (d: string) => new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
    return `${fmt(p.period_start)} – ${fmt(p.period_end)}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Proses Penggajian</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Kelola periode dan proses penggajian karyawan</p>
        </div>
        <Button
          onClick={() => router.push("/hr/payroll/generate")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Generate Periode Baru
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Periode Aktif", value: stats.active, sub: "Diproses / Disetujui" },
          { label: "Karyawan Terakhir", value: stats.totalEmp > 0 ? stats.totalEmp : "—", sub: "Periode terbaru" },
          { label: "Periode Selesai", value: stats.paid, sub: "Status Dibayar" },
        ].map((s) => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Net Terakhir</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">
              {stats.totalNet > 0 ? formatIDR(stats.totalNet) : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Periode terbaru</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-32 bg-background border-border">
            <SelectValue placeholder="Tahun" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tahun</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 bg-background border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="processing">Diproses</SelectItem>
            <SelectItem value="approved">Disetujui</SelectItem>
            <SelectItem value="paid">Dibayar</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchPeriods()}
          className="text-muted-foreground hover:text-foreground gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-red-500/20 bg-red-500/10">
          <CardContent className="p-4 flex items-center gap-2 text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-sm">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Periods List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Memuat data...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium">Belum ada periode penggajian</p>
            <p className="text-muted-foreground text-sm mt-1">Klik "Generate Periode Baru" untuk memulai</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((period: any) => {
            const label = periodLabel(period.period_year, period.period_month)
            return (
              <Card
                key={period.id}
                className="bg-card border-border hover:border-border/80 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Period info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDateRange(period)}</p>
                        {period.payment_date && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Tgl Bayar: {new Date(period.payment_date).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Center stats */}
                    <div className="flex items-center gap-6 shrink-0">
                      {period.total_employees > 0 && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          {period.total_employees} karyawan
                        </div>
                      )}
                      {period.total_net_salary > 0 && (
                        <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                          <Banknote className="w-4 h-4" />
                          {formatIDR(period.total_net_salary)}
                        </div>
                      )}
                    </div>

                    {/* Status + Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={period.status} />
                      <PeriodActions
                        period={period}
                        onView={() => router.push(`/hr/payroll/${period.id}`)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

    </div>
  )
}

function PeriodActions({ period, onView }: { period: any; onView: () => void }) {
  const router = useRouter()
  const status = period.status as string

  return (
    <div className="flex items-center gap-1.5">
      {status === "draft" && (
        <Button
          size="sm"
          onClick={() => router.push(`/hr/payroll/generate`)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs"
        >
          Generate
        </Button>
      )}
      {status === "processing" && (
        <Button size="sm" variant="outline" className="h-7 text-xs">
          Proses
        </Button>
      )}
      {status === "approved" && (
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs">
          Bayar
        </Button>
      )}
      {(status === "processing" || status === "approved" || status === "paid") && (
        <Button size="sm" variant="ghost" onClick={onView} className="h-7 px-2">
          <Eye className="w-3.5 h-3.5" />
        </Button>
      )}
      {status === "paid" && (
        <Button size="sm" variant="ghost" className="h-7 px-2">
          <Download className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  )
}
