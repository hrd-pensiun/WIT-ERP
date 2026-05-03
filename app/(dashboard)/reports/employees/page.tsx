"use client"

import { 
  BarChart3, Download, Calendar, Users, 
  TrendingUp, Building2, PieChart
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEmployees } from "@/hooks/useEmployees"

export default function EmployeeReportPage() {
  const { employees } = useEmployees()
  const departmentMap = new Map<string, { name: string; count: number; totalSalary: number }>()
  for (const employee of employees) {
    const name = employee.departments?.name || "Unassigned"
    const current = departmentMap.get(name) || { name, count: 0, totalSalary: 0 }
    current.count += 1
    current.totalSalary += employee.basic_salary || 0
    departmentMap.set(name, current)
  }
  const departmentStats = Array.from(departmentMap.values()).map((item) => ({
    name: item.name,
    count: item.count,
    avgSalary: item.count > 0 ? Math.round(item.totalSalary / item.count) : 0,
  }))
  const employmentTypeStats = [
    { type: "Tetap", key: "permanent", color: "bg-emerald-500" },
    { type: "Kontrak", key: "contract", color: "bg-blue-500" },
    { type: "Freelance", key: "freelance", color: "bg-purple-500" },
    { type: "Magang", key: "intern", color: "bg-slate-500" },
  ].map((item) => ({
    ...item,
    count: employees.filter((e) => e.employment_type === item.key).length,
  }))

  const monthMap = new Map<string, { month: string; joined: number; left: number }>()
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(new Date().getFullYear(), i, 1)
    const key = d.toISOString().slice(0, 7)
    monthMap.set(key, { month: d.toLocaleString("id-ID", { month: "short" }), joined: 0, left: 0 })
  }
  for (const employee of employees) {
    if (employee.join_date) {
      const key = String(employee.join_date).slice(0, 7)
      const row = monthMap.get(key)
      if (row) row.joined += 1
    }
    if (employee.resignation_date) {
      const key = String(employee.resignation_date).slice(0, 7)
      const row = monthMap.get(key)
      if (row) row.left += 1
    }
  }
  const turnoverData = Array.from(monthMap.values())

  const totalEmployees = departmentStats.reduce((sum, d) => sum + d.count, 0)
  const avgCompanySalary = Math.round(
    (departmentStats.reduce((sum, d) => sum + (d.avgSalary * d.count), 0) || 0) / (totalEmployees || 1)
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      notation: 'compact',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-500" />
            Laporan Karyawan
          </h1>
          <p className="text-slate-400 mt-1">Analisis data karyawan dan demografi</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-700">
            <Calendar className="w-4 h-4 mr-2" />
            Periode: 2026
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Karyawan</p>
                <p className="text-2xl font-bold text-slate-100">{totalEmployees}</p>
              </div>
              <Users className="w-8 h-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Rata-rata Gaji</p>
                <p className="text-2xl font-bold text-slate-100">
                  {formatCurrency(avgCompanySalary)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Departemen</p>
                <p className="text-2xl font-bold text-slate-100">
                  {departmentStats.length}
                </p>
              </div>
              <Building2 className="w-8 h-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Turnover Rate</p>
                <p className="text-2xl font-bold text-amber-400">4.3%</p>
              </div>
              <PieChart className="w-8 h-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">Distribusi per Departemen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departmentStats.map((dept) => (
                <div key={dept.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">{dept.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400">{dept.count} orang</span>
                      <span className="text-emerald-400 text-sm">
                        {formatCurrency(dept.avgSalary)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${(dept.count / totalEmployees) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Employment Type */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">Tipe Pekerjaan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {employmentTypeStats.map((type) => (
                <div key={type.type} className="p-4 bg-slate-950 rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${type.color} mb-2`} />
                  <p className="text-2xl font-bold text-slate-100">{type.count}</p>
                  <p className="text-sm text-slate-400">{type.type}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {Math.round((type.count / totalEmployees) * 100)}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Turnover Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">Rekruitment & Turnover 2026</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Bulan</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Bergabung</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Keluar</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Net</th>
                </tr>
              </thead>
              <tbody>
                {turnoverData.map((row) => (
                  <tr key={row.month} className="border-b border-slate-800/50">
                    <td className="py-3 px-4 text-slate-200">{row.month}</td>
                    <td className="py-3 px-4 text-right text-emerald-400">+{row.joined}</td>
                    <td className="py-3 px-4 text-right text-red-400">-{row.left}</td>
                    <td className="py-3 px-4 text-right text-slate-300">{row.joined - row.left}</td>
                  </tr>
                ))}
                <tr className="bg-slate-800/30 font-medium">
                  <td className="py-3 px-4 text-slate-200">Total</td>
                  <td className="py-3 px-4 text-right text-emerald-400">
                    +{turnoverData.reduce((sum, r) => sum + r.joined, 0)}
                  </td>
                  <td className="py-3 px-4 text-right text-red-400">
                    -{turnoverData.reduce((sum, r) => sum + r.left, 0)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300">
                    {turnoverData.reduce((sum, r) => sum + r.joined - r.left, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
