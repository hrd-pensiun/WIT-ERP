"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLeave } from "@/hooks/useLeave"
import { useEmployees } from "@/hooks/useEmployees"
import Link from "next/link"

export default function NewLeavePage() {
  const router = useRouter()
  const { createLeave, loading } = useLeave()
  const { employees } = useEmployees()
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    employee_id: "",
    leave_type: "annual",
    start_date: "",
    end_date: "",
    reason: "",
  })

  const calculateDays = () => {
    if (!formData.start_date || !formData.end_date) return 0
    const start = new Date(formData.start_date)
    const end = new Date(formData.end_date)
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return diff > 0 ? diff : 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await createLeave({
        tenant_id: "00000000-0000-0000-0000-000000000000",
        employee_id: formData.employee_id,
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        days: calculateDays(),
        reason: formData.reason || null,
        status: "pending",
      })
      router.push("/hr/leave")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create leave request")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/hr/leave"><Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div><h1 className="text-2xl font-bold text-slate-100">Pengajuan Cuti</h1><p className="text-slate-400 text-sm">Ajukan cuti baru</p></div>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">{error}</div>}
      <form onSubmit={handleSubmit}>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader><CardTitle className="text-slate-100 flex items-center gap-2"><Calendar className="w-5 h-5 text-emerald-500" /> Form Cuti</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-200">Karyawan <span className="text-red-400">*</span></Label>
              <Select value={formData.employee_id} onValueChange={(value) => setFormData({ ...formData, employee_id: value })}>
                <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue placeholder="Pilih karyawan" /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name} ({e.employee_number})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Jenis Cuti <span className="text-red-400">*</span></Label>
              <Select value={formData.leave_type} onValueChange={(value) => setFormData({ ...formData, leave_type: value })}>
                <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="annual">Cuti Tahunan</SelectItem>
                  <SelectItem value="sick">Cuti Sakit</SelectItem>
                  <SelectItem value="maternity">Cuti Melahirkan</SelectItem>
                  <SelectItem value="paternity">Cuti Ayah</SelectItem>
                  <SelectItem value="marriage">Cuti Menikah</SelectItem>
                  <SelectItem value="bereavement">Cuti Duka</SelectItem>
                  <SelectItem value="unpaid">Cuti Tidak Dibayar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label className="text-slate-200">Tanggal Mulai <span className="text-red-400">*</span></Label><Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required className="bg-slate-950 border-slate-800 text-slate-100" /></div>
              <div className="space-y-2"><Label className="text-slate-200">Tanggal Selesai <span className="text-red-400">*</span></Label><Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} required className="bg-slate-950 border-slate-800 text-slate-100" /></div>
            </div>
            {formData.start_date && formData.end_date && (
              <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <p className="text-sm text-emerald-400">Total hari: <span className="font-bold">{calculateDays()} hari</span></p>
              </div>
            )}
            <div className="space-y-2"><Label className="text-slate-200">Alasan</Label><Textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Alasan cuti..." rows={3} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
              <Link href="/hr/leave"><Button type="button" variant="ghost" className="text-slate-400">Batal</Button></Link>
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : "Ajukan Cuti"}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
