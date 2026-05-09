"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Loader2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLeave } from "@/hooks/useLeave"
import { useLeaveBalance } from "@/hooks/useLeaveBalance"
import { useEmployees } from "@/hooks/useEmployees"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"
import Link from "next/link"

export default function NewLeavePage() {
  const router = useRouter()
  const tenantId = getTenantId()
  const { createLeave, loading } = useLeave()
  const { employees } = useEmployees()
  const { fetchBalances, getRemaining } = useLeaveBalance()

  const [error, setError] = useState<string | null>(null)
  const [leaveTypes, setLeaveTypes] = useState<any[]>([])
  const [formData, setFormData] = useState({
    user_profile_id: "",
    leave_type_id: "",
    start_date: "",
    end_date: "",
    reason: "",
  })
  const currentYear = new Date().getFullYear()

  // Load leave types from DB
  useEffect(() => {
    if (!insForge) return
    insForge
      .from("hr_leave_types")
      .select("id, code, name, days_per_year, is_paid")
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .then(({ data }: { data: any[] | null }) => setLeaveTypes(data || []))
  }, [tenantId])

  // Load balances when employee changes
  useEffect(() => {
    if (!formData.user_profile_id) return
    fetchBalances({ user_profile_id: formData.user_profile_id, year: currentYear })
  }, [formData.user_profile_id, currentYear, fetchBalances])

  const calculateDays = () => {
    if (!formData.start_date || !formData.end_date) return 0
    const start = new Date(formData.start_date)
    const end = new Date(formData.end_date)
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return diff > 0 ? diff : 0
  }

  const remaining =
    formData.user_profile_id && formData.leave_type_id
      ? getRemaining(formData.user_profile_id, formData.leave_type_id, currentYear)
      : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const days = calculateDays()
    const isAdvance = remaining !== null && days > remaining

    try {
      await createLeave({
        tenant_id: tenantId,
        user_profile_id: formData.user_profile_id,
        leave_type_id: formData.leave_type_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        days_requested: days,
        reason: formData.reason || null,
        status: "pending",
        is_advance: isAdvance,
      })
      router.push("/hr/leave")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat pengajuan cuti")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/hr/leave">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pengajuan Cuti</h1>
          <p className="text-muted-foreground text-sm">Ajukan cuti baru</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" /> Form Cuti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Karyawan */}
            <div className="space-y-2">
              <Label>Karyawan <span className="text-red-400">*</span></Label>
              <Select
                value={formData.user_profile_id}
                onValueChange={(v) => setFormData({ ...formData, user_profile_id: v, leave_type_id: "" })}
              >
                <SelectTrigger><SelectValue placeholder="Pilih karyawan" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.full_name} ({e.employee_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Jenis Cuti */}
            <div className="space-y-2">
              <Label>Jenis Cuti <span className="text-red-400">*</span></Label>
              <Select
                value={formData.leave_type_id}
                onValueChange={(v) => setFormData({ ...formData, leave_type_id: v })}
                disabled={!formData.user_profile_id}
              >
                <SelectTrigger><SelectValue placeholder="Pilih jenis cuti" /></SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((lt) => (
                    <SelectItem key={lt.id} value={lt.id}>
                      {lt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Saldo indicator */}
              {formData.user_profile_id && formData.leave_type_id && (
                <div className="flex items-center gap-2 text-sm">
                  <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  {remaining === null ? (
                    <span className="text-muted-foreground">
                      Saldo belum diinisialisasi — minta HR untuk set kuota.
                    </span>
                  ) : (
                    <span className={remaining < 1 ? "text-red-400" : "text-muted-foreground"}>
                      Sisa: <strong>{remaining} hari</strong>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Tanggal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Tanggal Mulai <span className="text-red-400">*</span></Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Selesai <span className="text-red-400">*</span></Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>
            </div>

            {formData.start_date && formData.end_date && (
              <div className={`p-3 rounded-lg border ${remaining !== null && calculateDays() > remaining ? "bg-yellow-500/10 border-yellow-500/20" : "bg-emerald-500/10 border-emerald-500/20"}`}>
                <p className="text-sm">
                  Total hari:{" "}
                  <span className="font-bold">{calculateDays()} hari</span>
                  {remaining !== null && calculateDays() > remaining && (
                    <span className="text-yellow-400 ml-2">— melebihi saldo ({remaining} hari), akan dicatat sebagai cuti hutang</span>
                  )}
                </p>
              </div>
            )}

            {/* Alasan */}
            <div className="space-y-2">
              <Label>Alasan</Label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Alasan cuti..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
              <Link href="/hr/leave">
                <Button type="button" variant="ghost" className="text-muted-foreground">Batal</Button>
              </Link>
              <Button
                type="submit"
                disabled={loading || !formData.user_profile_id || !formData.leave_type_id}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</>
                ) : (
                  "Ajukan Cuti"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
