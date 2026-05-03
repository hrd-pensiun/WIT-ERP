"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calculator, Loader2, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEmployees } from "@/hooks/useEmployees"
import { usePayroll } from "@/hooks/usePayroll"
import { useEntities } from "@/hooks/useEntities"
import { generatePayrollDetailsForPeriod } from "@/lib/payroll-engine"
import Link from "next/link"

export default function GeneratePayrollPage() {
  const router = useRouter()
  const { employees } = useEmployees()
  const { createPeriod } = usePayroll()
  const { entities } = useEntities()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    period_year: new Date().getFullYear().toString(),
    period_month: String(new Date().getMonth() + 1),
    payment_date: "",
    entity_id: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const year = parseInt(formData.period_year)
      const month = parseInt(formData.period_month)
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)

      const result = await createPeriod({
        entity_id: formData.entity_id || null,
        period_year: year,
        period_month: month,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        payment_date: formData.payment_date || null,
        status: "processing",
      })
      if (!formData.entity_id) {
        throw new Error("Pilih entitas payroll terlebih dahulu")
      }
      const summary = await generatePayrollDetailsForPeriod({
        payrollPeriodId: result.id,
        entityId: formData.entity_id,
        periodStart: startDate.toISOString().split("T")[0],
        periodEnd: endDate.toISOString().split("T")[0],
      })
      if (summary.errors.length > 0) {
        console.warn("Payroll generation issues:", summary.errors)
      }
      router.push(`/hr/payroll/${result.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate payroll")
    } finally {
      setLoading(false)
    }
  }

  const months = [
    { value: "1", label: "Januari" }, { value: "2", label: "Februari" }, { value: "3", label: "Maret" },
    { value: "4", label: "April" }, { value: "5", label: "Mei" }, { value: "6", label: "Juni" },
    { value: "7", label: "Juli" }, { value: "8", label: "Agustus" }, { value: "9", label: "September" },
    { value: "10", label: "Oktober" }, { value: "11", label: "November" }, { value: "12", label: "Desember" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/hr/payroll"><Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div><h1 className="text-2xl font-bold text-slate-100">Generate Payroll</h1><p className="text-slate-400 text-sm">Buat payroll periode baru</p></div>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">{error}</div>}
      <form onSubmit={handleSubmit}>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader><CardTitle className="text-slate-100 flex items-center gap-2"><Calculator className="w-5 h-5 text-emerald-500" /> Periode Payroll</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-200">Entitas <span className="text-red-400">*</span></Label>
                <Select
                  value={formData.entity_id}
                  onValueChange={(value) => setFormData({ ...formData, entity_id: value })}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                    <SelectValue placeholder="Pilih entitas payroll" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    {entities.map((ent) => (
                      <SelectItem key={ent.id} value={String(ent.id)}>
                        {ent.code} — {ent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label className="text-slate-200">Tahun <span className="text-red-400">*</span></Label><Input type="number" value={formData.period_year} onChange={(e) => setFormData({ ...formData, period_year: e.target.value })} required className="bg-slate-950 border-slate-800 text-slate-100" /></div>
              <div className="space-y-2">
                <Label className="text-slate-200">Bulan <span className="text-red-400">*</span></Label>
                <Select value={formData.period_month} onValueChange={(value) => setFormData({ ...formData, period_month: value })}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label className="text-slate-200">Tanggal Pembayaran</Label><Input type="date" value={formData.payment_date} onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
            </div>
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="text-sm text-slate-400">Total Karyawan</p>
                  <p className="text-lg font-bold text-slate-100">{employees.length} orang</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
              <Link href="/hr/payroll"><Button type="button" variant="ghost" className="text-slate-400">Batal</Button></Link>
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generate detail payroll...</> : "Generate Payroll"}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
