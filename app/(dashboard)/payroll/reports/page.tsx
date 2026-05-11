"use client"

import { useMemo } from "react"
import {
  Download,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEmployees } from "@/hooks/useEmployees"
import { usePayroll } from "@/hooks/usePayroll"
import {
  formatIDR,
  MOCK_MONTHLY_TREND,
  MOCK_GRADE_DISTRIBUTION,
} from "@/lib/mock-payroll-data"

export default function ReportsPage() {
  const { employees } = useEmployees()
  const { details } = usePayroll()

  const costAnalysis = useMemo(() => {
    const basicSalaryTotal = details.reduce((s: number, d: any) => s + Number(d.basic_salary || 0), 0)
    const allowancesTotal = details.reduce((s: number, d: any) => s + Number(d.total_allowances || 0), 0)
    const bpjsTotal = details.reduce((s: number, d: any) => s + Number(d.bpjs_tk_amount || 0) + Number(d.bpjs_kes_amount || 0), 0)
    const pph21Total = details.reduce((s: number, d: any) => s + Number(d.pph21_amount || 0), 0)
    const total = basicSalaryTotal + allowancesTotal + bpjsTotal + pph21Total

    if (total === 0) return [
      { label: "Gaji Pokok",       pct: 58, value: 0, color: "bg-blue-500" },
      { label: "Tunjangan",        pct: 23, value: 0, color: "bg-emerald-500" },
      { label: "BPJS (Karyawan)", pct: 11, value: 0, color: "bg-amber-500" },
      { label: "PPh21",           pct:  8, value: 0, color: "bg-purple-500" },
    ]

    return [
      { label: "Gaji Pokok",       pct: Math.round((basicSalaryTotal / total) * 100), value: basicSalaryTotal, color: "bg-blue-500" },
      { label: "Tunjangan",        pct: Math.round((allowancesTotal / total) * 100),  value: allowancesTotal,  color: "bg-emerald-500" },
      { label: "BPJS (Karyawan)", pct: Math.round((bpjsTotal / total) * 100),        value: bpjsTotal,        color: "bg-amber-500" },
      { label: "PPh21",           pct: Math.round((pph21Total / total) * 100),        value: pph21Total,       color: "bg-purple-500" },
    ]
  }, [details])

  const deptBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>()
    employees.forEach((e: any) => {
      const name = e.departments?.name ?? "Tidak Ada Departemen"
      const dept = map.get(name) ?? { name, count: 0 }
      dept.count++
      map.set(name, dept)
    })
    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [employees])

  const totalEmployees = employees.length || 1

  const monthlyWithDelta = useMemo(() => {
    return MOCK_MONTHLY_TREND.map((row, i) => {
      const prev = MOCK_MONTHLY_TREND[i - 1]
      const deltaPct = prev && prev.net > 0
        ? ((row.net - prev.net) / prev.net * 100).toFixed(1)
        : null
      return { ...row, deltaPct }
    })
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Laporan Payroll</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Analisis dan ekspor data penggajian</p>
        </div>
        <span className="text-xs text-muted-foreground border border-border rounded-md px-3 py-1.5">
          01 Apr – 30 Apr 2026
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Card 1: Cost Analysis */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-foreground text-sm">Analisis Biaya Payroll</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1 text-muted-foreground">
                <Download className="w-3 h-3" />CSV
              </Button>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1 text-muted-foreground">
                <FileText className="w-3 h-3" />PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {costAnalysis.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-foreground flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    {item.label}
                  </span>
                  <span className="text-muted-foreground">
                    {item.pct}%{item.value > 0 && <> · {formatIDR(item.value)}</>}
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Card 2: Headcount per Grade */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-foreground text-sm">Headcount per Grade</CardTitle>
            </div>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1 text-muted-foreground">
              <Download className="w-3 h-3" />CSV
            </Button>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs text-muted-foreground py-1.5 font-medium">Grade</th>
                  <th className="text-right text-xs text-muted-foreground py-1.5 font-medium">Karyawan</th>
                  <th className="text-right text-xs text-muted-foreground py-1.5 font-medium">Rata-rata Gaji</th>
                  <th className="text-right text-xs text-muted-foreground py-1.5 font-medium">% Total</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_GRADE_DISTRIBUTION.map((g) => (
                  <tr key={g.grade} className="border-b border-border/50 hover:bg-muted/40">
                    <td className="py-2 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${g.bg} shrink-0`} />
                      <span className="text-foreground">{g.grade}</span>
                    </td>
                    <td className="py-2 text-right text-foreground">{g.count}</td>
                    <td className="py-2 text-right text-foreground">{formatIDR(g.avg_salary)}</td>
                    <td className="py-2 text-right text-muted-foreground">{g.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Card 3: Monthly Comparison */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-foreground text-sm">Perbandingan Bulanan</CardTitle>
            </div>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1 text-muted-foreground">
              <Download className="w-3 h-3" />CSV
            </Button>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs text-muted-foreground py-1.5 font-medium">Bulan</th>
                  <th className="text-right text-xs text-muted-foreground py-1.5 font-medium">Karyawan</th>
                  <th className="text-right text-xs text-muted-foreground py-1.5 font-medium">Total Net</th>
                  <th className="text-right text-xs text-muted-foreground py-1.5 font-medium">Δ vs Prev</th>
                </tr>
              </thead>
              <tbody>
                {monthlyWithDelta.map((row) => (
                  <tr key={row.period_label} className="border-b border-border/50 hover:bg-muted/40">
                    <td className="py-2 text-foreground font-medium">{row.period_label}</td>
                    <td className="py-2 text-right text-foreground">{row.employee_count}</td>
                    <td className="py-2 text-right text-emerald-600 font-medium">{formatIDR(row.net)}</td>
                    <td className="py-2 text-right">
                      {row.deltaPct !== null ? (
                        <span className={`flex items-center justify-end gap-0.5 text-xs font-medium ${Number(row.deltaPct) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {Number(row.deltaPct) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {Number(row.deltaPct) >= 0 ? "+" : ""}{row.deltaPct}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Card 4: Department Breakdown */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-foreground text-sm">Breakdown per Departemen</CardTitle>
            </div>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1 text-muted-foreground">
              <Download className="w-3 h-3" />CSV
            </Button>
          </CardHeader>
          <CardContent>
            {deptBreakdown.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">Memuat data departemen...</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs text-muted-foreground py-1.5 font-medium">Departemen</th>
                    <th className="text-right text-xs text-muted-foreground py-1.5 font-medium">Karyawan</th>
                    <th className="text-right text-xs text-muted-foreground py-1.5 font-medium">% Total</th>
                  </tr>
                </thead>
                <tbody>
                  {deptBreakdown.map((d) => {
                    const pct = ((d.count / totalEmployees) * 100).toFixed(1)
                    return (
                      <tr key={d.name} className="border-b border-border/50 hover:bg-muted/40">
                        <td className="py-2 text-foreground">{d.name}</td>
                        <td className="py-2 text-right text-foreground">{d.count}</td>
                        <td className="py-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-muted-foreground text-xs w-8 text-right">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
