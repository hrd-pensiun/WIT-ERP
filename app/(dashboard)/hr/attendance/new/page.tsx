"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAttendance } from "@/hooks/useAttendance"
import { useEmployees } from "@/hooks/useEmployees"
import Link from "next/link"

export default function NewAttendancePage() {
  const router = useRouter()
  const { createAttendance, loading } = useAttendance()
  const { employees } = useEmployees()
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    employee_id: "",
    date: new Date().toISOString().split('T')[0],
    check_in: "08:00",
    check_out: "17:00",
    status: "present",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await createAttendance({
        tenant_id: "00000000-0000-0000-0000-000000000000",
        employee_id: formData.employee_id,
        date: formData.date,
        check_in: `${formData.date}T${formData.check_in}:00`,
        check_out: formData.check_out ? `${formData.date}T${formData.check_out}:00` : null,
        status: formData.status,
        notes: formData.notes || null,
      })
      router.push("/hr/attendance")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create attendance")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/hr/attendance"><Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div><h1 className="text-2xl font-bold text-slate-100">Input Presensi Manual</h1><p className="text-slate-400 text-sm">Catat kehadiran karyawan</p></div>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">{error}</div>}
      <form onSubmit={handleSubmit}>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader><CardTitle className="text-slate-100 flex items-center gap-2"><Clock className="w-5 h-5 text-emerald-500" /> Data Presensi</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-200">Karyawan <span className="text-red-400">*</span></Label>
                <Select value={formData.employee_id} onValueChange={(value) => setFormData({ ...formData, employee_id: value })}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue placeholder="Pilih karyawan" /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name} ({e.employee_number})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label className="text-slate-200">Tanggal <span className="text-red-400">*</span></Label><Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required className="bg-slate-950 border-slate-800 text-slate-100" /></div>
              <div className="space-y-2"><Label className="text-slate-200">Check In</Label><Input type="time" value={formData.check_in} onChange={(e) => setFormData({ ...formData, check_in: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
              <div className="space-y-2"><Label className="text-slate-200">Check Out</Label><Input type="time" value={formData.check_out} onChange={(e) => setFormData({ ...formData, check_out: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
              <div className="space-y-2">
                <Label className="text-slate-200">Status <span className="text-red-400">*</span></Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="present">Hadir</SelectItem>
                    <SelectItem value="absent">Tidak Hadir</SelectItem>
                    <SelectItem value="late">Terlambat</SelectItem>
                    <SelectItem value="leave">Cuti</SelectItem>
                    <SelectItem value="sick">Sakit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label className="text-slate-200">Catatan</Label><Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Catatan tambahan..." className="bg-slate-950 border-slate-800 text-slate-100" /></div>
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
              <Link href="/hr/attendance"><Button type="button" variant="ghost" className="text-slate-400">Batal</Button></Link>
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : "Simpan"}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
