"use client"

import { useState } from "react"
import { Plus, Wallet, Calculator, Percent, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useSalaryComponents } from "@/hooks/useSalaryComponents"
import { useJobGrades } from "@/hooks/useJobGrades"

export default function PayrollConfigPage() {
  const [activeTab, setActiveTab] = useState("components")
  const [actionError, setActionError] = useState<string | null>(null)
  const { components, loading: compLoading, deleteComponent, fetchComponents } = useSalaryComponents()
  const { jobGrades, loading: gradeLoading } = useJobGrades()

  const handleDeleteComponent = async (id: string) => {
    if (!confirm("Hapus komponen gaji ini?")) return
    setActionError(null)
    try {
      await deleteComponent(id)
      await fetchComponents()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menghapus komponen")
    }
  }

  const earnings = components.filter((c) => c.type === "earning")
  const deductions = components.filter((c) => c.type === "deduction")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Konfigurasi Payroll</h1>
        <p className="text-slate-400 mt-1">Setup komponen gaji dan matrix</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {actionError && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {actionError}
          </div>
        )}
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="components" className="data-[state=active]:bg-emerald-600">
            Komponen Gaji
          </TabsTrigger>
          <TabsTrigger value="matrix" className="data-[state=active]:bg-emerald-600">
            Salary Matrix
          </TabsTrigger>
          <TabsTrigger value="bopp" className="data-[state=active]:bg-emerald-600">
            BOPP Formula
          </TabsTrigger>
        </TabsList>

        {/* Salary Components Tab */}
        <TabsContent value="components" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Earnings */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-500" />
                  Penghasilan
                </CardTitle>
                <Link href="/master-data/payroll/component/new">
                  <Button size="sm" variant="ghost" className="text-emerald-400">
                    <Plus className="w-4 h-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-2">
                {compLoading ? (
                  <div className="text-center py-8 text-slate-400">Loading...</div>
                ) : earnings.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">Belum ada komponen</div>
                ) : (
                  earnings.map((comp) => (
                    <div
                      key={comp.id}
                      className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500/10 rounded flex items-center justify-center">
                          <span className="text-emerald-500 text-sm font-medium">{comp.code}</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-100">{comp.name}</p>
                          <p className="text-xs text-slate-400">
                            {comp.calculation_type} • {comp.is_taxable ? "Taxable" : "Non-taxable"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            comp.status === "active"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-slate-700"
                          }
                        >
                          {comp.status}
                        </Badge>
                        <Link href={`/master-data/payroll/component/${comp.id}/edit`}>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-red-400"
                          onClick={() => handleDeleteComponent(comp.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Deductions */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <Percent className="w-5 h-5 text-red-400" />
                  Potongan
                </CardTitle>
                <Button size="sm" variant="ghost" className="text-emerald-400">
                  <Plus className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {compLoading ? (
                  <div className="text-center py-8 text-slate-400">Loading...</div>
                ) : deductions.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">Belum ada komponen</div>
                ) : (
                  deductions.map((comp) => (
                    <div
                      key={comp.id}
                      className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-500/10 rounded flex items-center justify-center">
                          <span className="text-red-400 text-sm font-medium">{comp.code}</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-100">{comp.name}</p>
                          <p className="text-xs text-slate-400">
                            {comp.calculation_type} • {comp.is_taxable ? "Taxable" : "Non-taxable"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            comp.status === "active"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-slate-700"
                          }
                        >
                          {comp.status}
                        </Badge>
                        <Link href={`/master-data/payroll/component/${comp.id}/edit`}>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-red-400"
                          onClick={() => handleDeleteComponent(comp.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Salary Matrix Tab */}
        <TabsContent value="matrix">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-100">Salary Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              {gradeLoading ? (
                <div className="text-center py-8 text-slate-400">Loading...</div>
              ) : jobGrades.length === 0 ? (
                <div className="text-center py-8 text-slate-400">Buat Job Grade terlebih dahulu</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Grade</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Step 1</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Step 2</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Step 3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobGrades.map((grade) => (
                        <tr key={grade.id} className="border-b border-slate-800/50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-slate-100">{grade.name}</p>
                              <p className="text-xs text-slate-400">{grade.code}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-300">
                            {grade.min_salary
                              ? `Rp ${Number(grade.min_salary).toLocaleString("id-ID")}`
                              : "-"}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-300">-</td>
                          <td className="py-3 px-4 text-center text-slate-300">-</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* BOPP Formula Tab */}
        <TabsContent value="bopp">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="py-8 text-center text-slate-400">
              BOPP Formula configuration coming soon...
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
