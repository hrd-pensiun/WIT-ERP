"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  TrendingUp,
  Loader2,
  History,
  Sparkles,
  UserCheck,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEmployees } from "@/hooks/useEmployees"
import { useEmployeeCompensation } from "@/hooks/useEmployeeCompensation"
import { useEmployeePayroll } from "@/hooks/useEmployeePayroll"
import { useResolvedCompensation } from "@/hooks/useResolvedCompensation"
import { formatIDR } from "@/lib/mock-payroll-data"

export default function CompensationDetailPage() {
  const params = useParams()
  const employeeId = params.employeeId as string

  const { getEmployee } = useEmployees()
  const { salaryHistory, loading: compLoading } = useEmployeeCompensation(employeeId)
  const { latestPayroll, loading: payLoading } = useEmployeePayroll(employeeId)
  const {
    resolvedSalary,
    salarySource,
    salaryEffectiveDate,
    earnings,
    deductions,
    grossSalary,
    loading: resolvedLoading,
  } = useResolvedCompensation(employeeId)

  const [employee, setEmployee] = useState<any>(null)
  const [empLoading, setEmpLoading] = useState(true)

  useEffect(() => {
    if (!employeeId) return
    setEmpLoading(true)
    getEmployee(employeeId)
      .then((e) => setEmployee(e))
      .finally(() => setEmpLoading(false))
  }, [employeeId, getEmployee])

  const loading = empLoading || compLoading || payLoading || resolvedLoading

  const totalAllowances = earnings.reduce((s, a) => s + a.amount, 0)
  const basicSalary = resolvedSalary ?? 0

  const historyWithChange = useMemo(() => {
    return salaryHistory.map((row: any, idx: number) => {
      const prev = salaryHistory[idx + 1]
      const pct =
        prev && Number(prev.amount) > 0
          ? (
              ((Number(row.amount) - Number(prev.amount)) / Number(prev.amount)) *
              100
            ).toFixed(1)
          : null
      return { ...row, pct }
    })
  }, [salaryHistory])

  const REASON_LABEL: Record<string, string> = {
    increment: "Kenaikan Berkala",
    promotion: "Promosi",
    market_adjustment: "Penyesuaian Pasar",
    correction: "Koreksi",
    other: "Lainnya",
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Memuat data...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <Link href="/payroll/compensation">
          <Button variant="ghost" size="sm" className="gap-1 mt-0.5">
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-lg font-bold text-emerald-700 shrink-0">
              {(employee?.full_name || "?")[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {employee?.full_name ?? "—"}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">
                  {employee?.employee_number}
                </span>
                {employee?.hr_positions?.name && (
                  <>
                    <span className="text-border">·</span>
                    <span className="text-sm text-muted-foreground">
                      {employee.hr_positions.name}
                    </span>
                  </>
                )}
                {employee?.departments?.name && (
                  <>
                    <span className="text-border">·</span>
                    <span className="text-sm text-muted-foreground">
                      {employee.departments.name}
                    </span>
                  </>
                )}
                {employee?.hr_job_grades?.name && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium border bg-amber-500/20 text-amber-700 border-amber-500/30">
                    {employee.hr_job_grades.name}
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium border ${
                    employee?.status === "active"
                      ? "bg-emerald-500/20 text-emerald-700 border-emerald-500/30"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {employee?.status === "active" ? "Aktif" : (employee?.status ?? "—")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Gaji Pokok</p>
              {salarySource && (
                <SourceBadge source={salarySource} />
              )}
            </div>
            <p className="text-xl font-bold text-foreground">
              {basicSalary > 0 ? (
                formatIDR(basicSalary)
              ) : (
                <span className="text-muted-foreground text-sm">Belum diset</span>
              )}
            </p>
            {salaryEffectiveDate && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                sejak{" "}
                {new Date(salaryEffectiveDate).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Tunjangan</p>
            <p className="text-xl font-bold text-foreground">
              {totalAllowances > 0 ? formatIDR(totalAllowances) : "—"}
            </p>
            {earnings.length > 0 && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {earnings.length} komponen
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Gaji Bersih (Terakhir)</p>
            <p className="text-xl font-bold text-emerald-600">
              {latestPayroll?.net_salary ? formatIDR(latestPayroll.net_salary) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Pendapatan</p>
            <p className="text-xl font-bold text-emerald-700">
              {grossSalary > 0 ? formatIDR(grossSalary) : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Gaji pokok + tunjangan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Components Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Earnings */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-foreground text-sm font-semibold">
              Komponen Pendapatan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {/* Gaji Pokok row */}
            <div className="flex justify-between items-center py-2.5 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">Gaji Pokok</span>
                {salarySource && <SourceBadge source={salarySource} />}
              </div>
              <span className="text-sm font-medium text-foreground">
                {basicSalary > 0 ? formatIDR(basicSalary) : "—"}
              </span>
            </div>

            {/* Tunjangan rows */}
            {earnings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-3">
                Belum ada tunjangan aktif
              </p>
            ) : (
              earnings.map((a) => (
                <div
                  key={a.salary_component_id}
                  className="flex justify-between items-center py-2.5 border-b border-border/50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm text-foreground">{a.name}</p>
                        <SourceBadge source={a.source} />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {a.is_fixed === false ? "Variabel" : "Tetap"}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-foreground shrink-0 ml-2">
                    {formatIDR(a.amount)}
                  </span>
                </div>
              ))
            )}

            {/* Total */}
            <div className="flex justify-between items-center py-2.5 mt-1">
              <span className="text-sm font-semibold text-foreground">Total Pendapatan</span>
              <span className="text-sm font-bold text-emerald-600">
                {formatIDR(grossSalary)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Deductions */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-foreground text-sm font-semibold">
              Komponen Potongan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {latestPayroll ? (
              <>
                {[
                  { label: "BPJS Tenaga Kerja", amount: latestPayroll.bpjs_tk_amount ?? 0 },
                  { label: "BPJS Kesehatan", amount: latestPayroll.bpjs_kes_amount ?? 0 },
                  { label: "PPh21", amount: latestPayroll.pph21_amount ?? 0 },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between items-center py-2 border-b border-border"
                  >
                    <span className="text-sm text-foreground">{item.label}</span>
                    <span className="text-sm font-medium text-red-600">
                      {formatIDR(item.amount)}
                    </span>
                  </div>
                ))}
                {deductions.map((a) => (
                  <div
                    key={a.salary_component_id}
                    className="flex justify-between items-center py-2 border-b border-border/50"
                  >
                    <span className="text-sm text-foreground">{a.name}</span>
                    <span className="text-sm font-medium text-red-600">
                      {formatIDR(a.amount)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2.5 mt-1">
                  <span className="text-sm font-semibold text-foreground">Total Potongan</span>
                  <span className="text-sm font-bold text-red-600">
                    {formatIDR(latestPayroll.total_deductions ?? 0)}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-4">
                Data payroll belum tersedia. Potongan BPJS &amp; PPh21 akan muncul setelah generate payroll.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Salary History */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-foreground text-sm font-semibold">
              Riwayat Kenaikan Gaji
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {salaryHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Belum ada riwayat perubahan gaji
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs text-muted-foreground py-2 font-medium">
                      Berlaku Sejak
                    </th>
                    <th className="text-right text-xs text-muted-foreground py-2 font-medium">
                      Jumlah Gaji
                    </th>
                    <th className="text-right text-xs text-muted-foreground py-2 font-medium">
                      Kenaikan
                    </th>
                    <th className="text-left text-xs text-muted-foreground py-2 pl-4 font-medium">
                      Alasan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {historyWithChange.map((row: any) => (
                    <tr
                      key={row.id}
                      className="border-b border-border/50 hover:bg-muted/40"
                    >
                      <td className="py-2.5 text-foreground">
                        {new Date(row.effective_date).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-2.5 text-right font-medium text-foreground">
                        {formatIDR(Number(row.amount))}
                      </td>
                      <td className="py-2.5 text-right">
                        {row.pct !== null ? (
                          <span
                            className={`text-xs font-medium ${
                              Number(row.pct) >= 0 ? "text-emerald-600" : "text-red-600"
                            }`}
                          >
                            {Number(row.pct) >= 0 ? "+" : ""}
                            {row.pct}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pl-4 text-muted-foreground">
                        {row.reason === "other" && row.reason_other
                          ? row.reason_other
                          : REASON_LABEL[row.reason] ?? row.reason ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart Placeholder */}
      <Card className="bg-card border-border border-dashed">
        <CardContent className="py-10 flex flex-col items-center gap-3 text-muted-foreground">
          <TrendingUp className="w-8 h-8" />
          <p className="font-medium text-sm">Grafik Tren Gaji</p>
          <p className="text-xs">
            Visualisasi riwayat gaji akan tersedia pada versi berikutnya
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Source badge ──────────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: "override" | "matrix" }) {
  if (source === "override") {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
        <UserCheck className="w-2.5 h-2.5" />
        Override
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
      <Sparkles className="w-2.5 h-2.5" />
      Default
    </span>
  )
}
