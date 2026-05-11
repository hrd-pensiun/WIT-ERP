"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Save, RefreshCcw, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FilterBar, FilterBarSeparator, FilterBarActions } from "@/components/ui/filter-bar"
import { useLeaveBalance } from "@/hooks/useLeaveBalance"
import { useEmployees } from "@/hooks/useEmployees"
import type { LeaveBalanceWithMeta } from "@/types/database-extended"

const currentYear = new Date().getFullYear()
const YEARS = [currentYear - 1, currentYear, currentYear + 1]

export default function LeaveQuotaPage() {
  const { employees } = useEmployees()
  const { balances, loading, fetchBalances, initBalancesForEmployee, setCustomQuota } =
    useLeaveBalance()

  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [selectedYear, setSelectedYear] = useState(String(currentYear))
  const [editMap, setEditMap] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [initLoading, setInitLoading] = useState(false)
  const [successId, setSuccessId] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedEmployee) return
    fetchBalances({ user_profile_id: selectedEmployee, year: Number(selectedYear) })
    setEditMap({})
  }, [selectedEmployee, selectedYear, fetchBalances])

  const handleInit = async () => {
    if (!selectedEmployee) return
    setInitLoading(true)
    try {
      await initBalancesForEmployee(selectedEmployee, Number(selectedYear))
      await fetchBalances({ user_profile_id: selectedEmployee, year: Number(selectedYear) })
    } finally {
      setInitLoading(false)
    }
  }

  const handleSave = async (bal: LeaveBalanceWithMeta) => {
    const raw = editMap[bal.id]
    if (raw === undefined) return
    setSavingId(bal.id)
    try {
      const val = raw === "" ? null : parseInt(raw, 10)
      await setCustomQuota(bal.id, Number.isNaN(val as any) ? null : val)
      setSuccessId(bal.id)
      setTimeout(() => setSuccessId(null), 2000)
    } finally {
      setSavingId(null)
    }
  }

  const filteredBalances = balances.filter(
    (b) =>
      b.user_profile_id === selectedEmployee && b.year === Number(selectedYear)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/hr/leave">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-emerald-500" />
            Pengaturan Kuota Cuti
          </h1>
          <p className="text-muted-foreground text-sm">
            Set kuota custom per karyawan; kosong = pakai kuota default dari tipe cuti
          </p>
        </div>
      </div>

      {/* Filter */}
      <FilterBar>
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger className="h-8 text-sm w-auto min-w-[200px]">
            <SelectValue placeholder="Pilih karyawan" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.full_name} ({e.employee_number})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <FilterBarSeparator />

        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="h-8 text-sm w-auto min-w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <FilterBarActions>
          <Button
            variant="outline"
            size="sm"
            onClick={handleInit}
            disabled={!selectedEmployee || initLoading}
          >
            {initLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Init Saldo
          </Button>
        </FilterBarActions>
      </FilterBar>

      {/* Table */}
      {selectedEmployee ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Saldo Cuti —{" "}
              {employees.find((e) => e.id === selectedEmployee)?.full_name || "—"}{" "}
              ({selectedYear})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />Memuat...
              </div>
            ) : filteredBalances.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <p>Belum ada saldo untuk karyawan ini di tahun {selectedYear}.</p>
                <p className="mt-1">Klik <strong>Init Saldo</strong> untuk membuat dari template tipe cuti.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Tipe Cuti</th>
                      <th className="text-center py-3 pr-4 font-medium text-muted-foreground">Kuota Default</th>
                      <th className="text-center py-3 pr-4 font-medium text-muted-foreground">Kuota Custom</th>
                      <th className="text-center py-3 pr-4 font-medium text-muted-foreground">Carry Over</th>
                      <th className="text-center py-3 pr-4 font-medium text-muted-foreground">Digunakan</th>
                      <th className="text-center py-3 pr-4 font-medium text-muted-foreground">Sisa</th>
                      <th className="text-right py-3 font-medium text-muted-foreground">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBalances.map((bal) => {
                      const editVal = editMap[bal.id]
                      const isDirty = editVal !== undefined
                      const isSaving = savingId === bal.id
                      const isSuccess = successId === bal.id

                      return (
                        <tr key={bal.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-3 pr-4 font-medium text-foreground">
                            {bal.hr_leave_types?.name || bal.leave_type_id.slice(0, 8)}
                          </td>
                          <td className="py-3 pr-4 text-center text-muted-foreground">
                            {bal.base_quota} hari
                          </td>
                          <td className="py-3 pr-4">
                            <Input
                              type="number"
                              min={0}
                              max={365}
                              placeholder={String(bal.base_quota)}
                              value={editVal ?? (bal.custom_quota !== null ? String(bal.custom_quota) : "")}
                              onChange={(e) =>
                                setEditMap((prev) => ({ ...prev, [bal.id]: e.target.value }))
                              }
                              className="h-7 w-20 text-center mx-auto"
                            />
                          </td>
                          <td className="py-3 pr-4 text-center text-muted-foreground">
                            {bal.carry_over_days}
                          </td>
                          <td className="py-3 pr-4 text-center text-amber-500">{bal.used_days}</td>
                          <td className="py-3 pr-4 text-center">
                            <span
                              className={
                                bal.remaining_days < 1
                                  ? "text-red-400 font-semibold"
                                  : "text-emerald-500 font-semibold"
                              }
                            >
                              {bal.remaining_days}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            {isSuccess ? (
                              <Badge className="bg-emerald-500/20 text-emerald-400">Tersimpan</Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant={isDirty ? "default" : "ghost"}
                                className={isDirty ? "bg-emerald-600 hover:bg-emerald-700 h-7 px-3" : "h-7 px-3"}
                                onClick={() => handleSave(bal)}
                                disabled={!isDirty || isSaving}
                              >
                                {isSaving ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Save className="h-3.5 w-3.5" />
                                )}
                                {isDirty ? " Simpan" : ""}
                              </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Settings2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Pilih karyawan untuk melihat dan mengatur kuota cuti</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
