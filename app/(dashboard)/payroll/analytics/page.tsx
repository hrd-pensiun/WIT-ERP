"use client"

import { useMemo } from "react"
import {
  TrendingUp,
  TrendingDown,
  Users,
  Banknote,
  Percent,
  Shield,
  FileCheck,
  Award,
  Calendar,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useEmployees } from "@/hooks/useEmployees"
import { usePayroll } from "@/hooks/usePayroll"
import {
  formatIDR,
  MOCK_MONTHLY_TREND,
  MOCK_GRADE_DISTRIBUTION,
  MOCK_TOP_ALLOWANCES,
} from "@/lib/mock-payroll-data"

function BarChart({ data }: { data: typeof MOCK_MONTHLY_TREND }) {
  const maxVal = Math.max(...data.map((d) => d.gross))
  const chartH = 120

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2" style={{ height: chartH + 8 }}>
        {data.map((row) => {
          const grossH = Math.round((row.gross / maxVal) * chartH)
          const netH = Math.round((row.net / maxVal) * chartH)
          return (
            <div key={row.month} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: chartH }}>
                <div
                  className="w-3 bg-blue-500/30 border border-blue-500/50 rounded-t transition-all"
                  style={{ height: grossH }}
                  title={`Gross: ${formatIDR(row.gross)}`}
                />
                <div
                  className="w-3 bg-emerald-500 rounded-t transition-all"
                  style={{ height: netH }}
                  title={`Net: ${formatIDR(row.net)}`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{row.month}</span>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-4 justify-center text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-500/30 border border-blue-500/50" />
          Gaji Bruto
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-500" />
          Gaji Bersih
        </span>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { employees } = useEmployees()
  const { periods, details } = usePayroll()

  const kpi = useMemo(() => {
    const totalNet = MOCK_MONTHLY_TREND[MOCK_MONTHLY_TREND.length - 1].net
    const prevNet = MOCK_MONTHLY_TREND[MOCK_MONTHLY_TREND.length - 2].net
    const netDelta = prevNet > 0 ? ((totalNet - prevNet) / prevNet * 100).toFixed(1) : null

    const avgNet = details.length > 0
      ? details.reduce((s: number, d: any) => s + Number(d.net_salary || 0), 0) / details.length
      : MOCK_MONTHLY_TREND[MOCK_MONTHLY_TREND.length - 1].net / MOCK_MONTHLY_TREND[MOCK_MONTHLY_TREND.length - 1].employee_count

    const totalAllowances = details.reduce((s: number, d: any) => s + Number(d.total_allowances || 0), 0)
    const totalGross = details.reduce((s: number, d: any) => s + Number(d.gross_salary || 0), 0)
    const allowanceRatio = totalGross > 0 ? ((totalAllowances / totalGross) * 100).toFixed(1) : "23.4"
    const bpjsCompany = MOCK_MONTHLY_TREND[MOCK_MONTHLY_TREND.length - 1].bpjs_total * 1.5

    return { totalNet, netDelta, avgNet, allowanceRatio, bpjsCompany }
  }, [details])

  const totalGradeCount = MOCK_GRADE_DISTRIBUTION.reduce((s, g) => s + g.count, 0) || 1
  const maxAllowance = MOCK_TOP_ALLOWANCES[0]?.total || 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analitik Payroll</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Tren dan distribusi data penggajian</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Penggajian (Bulan Ini)"
          value={formatIDR(kpi.totalNet)}
          trend={kpi.netDelta ? `${Number(kpi.netDelta) >= 0 ? "+" : ""}${kpi.netDelta}% vs. bulan lalu` : null}
          positive={kpi.netDelta ? Number(kpi.netDelta) >= 0 : null}
          icon={<Banknote className="w-4 h-4 text-emerald-600" />}
        />
        <KpiCard
          label="Rata-rata Gaji Bersih"
          value={formatIDR(kpi.avgNet)}
          trend={null} positive={null}
          icon={<Users className="w-4 h-4 text-blue-600" />}
        />
        <KpiCard
          label="Rasio Tunjangan / Gaji"
          value={`${kpi.allowanceRatio}%`}
          trend={null} positive={null}
          icon={<Percent className="w-4 h-4 text-amber-600" />}
        />
        <KpiCard
          label="Est. Beban BPJS Perusahaan"
          value={formatIDR(kpi.bpjsCompany)}
          trend={null} positive={null}
          icon={<Shield className="w-4 h-4 text-purple-600" />}
        />
      </div>

      {/* Monthly Trend Chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <CardTitle className="text-foreground text-sm">Tren Penggajian Bulanan</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <BarChart data={MOCK_MONTHLY_TREND} />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <tbody>
                <tr>
                  <td className="py-1 font-medium text-muted-foreground w-12">Bruto</td>
                  {MOCK_MONTHLY_TREND.map((r) => (
                    <td key={r.month} className="py-1 text-right text-muted-foreground">{formatIDR(r.gross)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1 font-medium text-muted-foreground">Net</td>
                  {MOCK_MONTHLY_TREND.map((r) => (
                    <td key={r.month} className="py-1 text-right text-emerald-600 font-medium">{formatIDR(r.net)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1 font-medium text-muted-foreground">Karyawan</td>
                  {MOCK_MONTHLY_TREND.map((r) => (
                    <td key={r.month} className="py-1 text-right text-foreground">{r.employee_count}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Grade Distribution + Top Allowances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-foreground text-sm">Distribusi Grade</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {MOCK_GRADE_DISTRIBUTION.map((g) => {
              const pct = Math.round((g.count / totalGradeCount) * 100)
              return (
                <div key={g.grade} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${g.bg}`} />
                      <span className="text-foreground">{g.grade}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{g.count} orang</span>
                      <span>{formatIDR(g.avg_salary)}</span>
                      <span className="font-medium text-foreground w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-foreground text-sm">Komponen Tunjangan Teratas</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_TOP_ALLOWANCES.map((a) => {
              const barPct = Math.round((a.total / maxAllowance) * 100)
              return (
                <div key={a.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                        {a.rank}
                      </span>
                      <span className="text-foreground">{a.name}</span>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">{formatIDR(a.total)}</p>
                      <p>{a.employee_count} karyawan</p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${barPct}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground text-sm">Statistik Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            <QuickStat
              icon={<Users className="w-4 h-4 text-blue-600" />}
              label="Karyawan Aktif"
              value={String(employees.filter((e: any) => e.status === "active").length || "—")}
              sub="dari total karyawan terdaftar"
            />
            <QuickStat
              icon={<Calendar className="w-4 h-4 text-purple-600" />}
              label="Periode Selesai (YTD)"
              value={String(periods.filter((p: any) => p.status === "paid").length || "—")}
              sub="dibayar tahun ini"
            />
            <QuickStat
              icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
              label="Pertumbuhan Payroll"
              value={`+${((MOCK_MONTHLY_TREND[5].net - MOCK_MONTHLY_TREND[0].net) / MOCK_MONTHLY_TREND[0].net * 100).toFixed(1)}%`}
              sub="6 bulan terakhir"
            />
            <QuickStat
              icon={<Percent className="w-4 h-4 text-amber-600" />}
              label="Karyawan Tetap"
              value={`${employees.length > 0 ? Math.round(employees.filter((e: any) => e.employment_type === "permanent").length / employees.length * 100) : 74}%`}
              sub="dari total karyawan aktif"
            />
            <QuickStat
              icon={<FileCheck className="w-4 h-4 text-cyan-600" />}
              label="Slip Terbaru"
              value={details.length > 0 ? `${details.length}/${details.length}` : "—"}
              sub="digenerate periode ini"
            />
            <QuickStat
              icon={<Shield className="w-4 h-4 text-indigo-600" />}
              label="Compliance BPJS"
              value="100%"
              sub="seluruh karyawan terdaftar"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function KpiCard({ label, value, trend, positive, icon }: {
  label: string; value: string; trend: string | null; positive: boolean | null; icon: React.ReactNode
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <p className="text-xs text-muted-foreground leading-tight">{label}</p>
        </div>
        <p className="text-xl font-bold text-foreground">{value}</p>
        {trend !== null && (
          <div className={`flex items-center gap-1 mt-1 text-xs ${positive ? "text-emerald-600" : "text-red-600"}`}>
            {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function QuickStat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  )
}
