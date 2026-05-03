"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Wallet, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { usePayroll } from "@/hooks/usePayroll"

export default function PayrollPeriodClient({ period }: { period: string }) {
  const { getPeriod, fetchDetails, loading } = usePayroll()
  const [periodData, setPeriodData] = useState<any>(null)
  const [payrollData, setPayrollData] = useState<any[]>([])

  useEffect(() => {
    getPeriod(period).then(setPeriodData).catch(() => setPeriodData(null))
    fetchDetails(period).then(setPayrollData).catch(() => setPayrollData([]))
  }, [period, getPeriod, fetchDetails])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      draft: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      approved: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      paid: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    }
    return variants[status] || variants.draft
  }

  const totalNet = payrollData.reduce((sum, p) => sum + (p.net_salary || 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/hr/payroll"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Detail Payroll</h1>
            <p className="text-slate-400">
              Periode: {periodData ? `${periodData.period_month}/${periodData.period_year}` : period}
            </p>
          </div>
        </div>
        <Button variant="outline" className="border-slate-700">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-sm text-slate-400">Total Karyawan</p>
            <p className="text-2xl font-bold text-slate-100">{payrollData.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-sm text-slate-400">Total Net Salary</p>
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalNet)}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-sm text-slate-400">Status</p>
            <Badge className={`${getStatusBadge(periodData?.status || "draft")} mt-1`}>
              {(periodData?.status || "draft").toUpperCase()}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader><CardTitle className="text-slate-100">Daftar Gaji Karyawan</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : payrollData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Karyawan</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Gaji Pokok</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Tunjangan</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Potongan</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Net Salary</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollData.map((row: any) => (
                    <tr key={row.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-100">{row.user_profiles?.full_name || "-"}</p>
                        <p className="text-xs text-slate-500">{row.user_profiles?.employee_number || "-"}</p>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300">{formatCurrency(row.basic_salary)}</td>
                      <td className="py-3 px-4 text-right text-emerald-400">+{formatCurrency(row.total_allowances || 0)}</td>
                      <td className="py-3 px-4 text-right text-red-400">-{formatCurrency(row.total_deductions || 0)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-100">{formatCurrency(row.net_salary)}</td>
                      <td className="py-3 px-4 text-center"><Badge className={getStatusBadge(row.status)}>{row.status.toUpperCase()}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada data payroll untuk periode ini</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
