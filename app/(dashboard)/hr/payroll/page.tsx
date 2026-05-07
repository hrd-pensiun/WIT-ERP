"use client"

import Link from "next/link"
import { Calendar, Plus, Trash2, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { usePayroll } from "@/hooks/usePayroll"

const monthLabel = (month: number) =>
  new Date(2000, Math.max(0, month - 1), 1).toLocaleString("id-ID", { month: "long" })

export default function PayrollPage() {
  const { periods, loading, deletePeriod, fetchPeriods } = usePayroll()

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus periode payroll ini?")) return
    await deletePeriod(id)
    await fetchPeriods()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payroll</h1>
          <p className="text-muted-foreground text-sm">Kelola periode payroll dan hasil perhitungan</p>
        </div>
        <Link href="/hr/payroll/generate">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Generate Period
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-500" />
            Daftar Periode Payroll
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Loading...</div>
          ) : periods.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">Belum ada periode payroll</div>
          ) : (
            <div className="space-y-3">
              {periods.map((period) => (
                <div key={period.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-background">
                  <Link href={`/hr/payroll/${period.id}`} className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-foreground font-medium">
                        {monthLabel(period.period_month)} {period.period_year}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {period.start_date} - {period.end_date}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-muted text-foreground">{period.status}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-red-400"
                      onClick={() => handleDelete(period.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
