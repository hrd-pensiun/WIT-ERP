"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, User, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLeave } from "@/hooks/useLeave"
import { useLeaveBalance } from "@/hooks/useLeaveBalance"

const currentYear = new Date().getFullYear()

export default function LeaveDetailClient({ id }: { id: string }) {
  const { leaveRequests, loading, updateStatus } = useLeave()
  const { consumeBalance, reverseBalance } = useLeaveBalance()
  const [leave, setLeave] = useState<any>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const l = leaveRequests.find((r) => r.id === id)
    if (l) setLeave(l)
  }, [leaveRequests, id])

  const handleApprove = async () => {
    setProcessing(true)
    try {
      await updateStatus(id, "approved")
      // Consume leave balance
      if (leave) {
        await consumeBalance(
          leave.user_profile_id,
          leave.leave_type_id,
          currentYear,
          leave.days_requested ?? 0
        )
      }
      setLeave((prev: any) => prev ? { ...prev, status: "approved" } : prev)
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    setProcessing(true)
    try {
      // If previously approved, reverse the consumed balance
      if (leave?.status === "approved") {
        await reverseBalance(
          leave.user_profile_id,
          leave.leave_type_id,
          currentYear,
          leave.days_requested ?? 0
        )
      }
      await updateStatus(id, "rejected")
      setLeave((prev: any) => prev ? { ...prev, status: "rejected" } : prev)
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      rejected: "bg-red-500/20 text-red-400 border-red-500/30",
    }
    return variants[status] || variants.pending
  }

  if (loading && !leave) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (!leave) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Pengajuan cuti tidak ditemukan</p>
        <Link href="/hr/leave">
          <Button variant="outline" className="mt-4">Kembali</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/hr/leave">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Detail Pengajuan Cuti</h1>
            <p className="text-muted-foreground">
              {leave.hr_leave_types?.name || "—"} • {leave.start_date} s/d {leave.end_date}
            </p>
          </div>
        </div>
        <Badge className={getStatusBadge(leave.status)}>{leave.status.toUpperCase()}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informasi Cuti</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{leave.user_profiles?.full_name || "Karyawan"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{leave.days_requested || 0} hari</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Mulai</p>
              <p className="text-foreground">{leave.start_date}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Selesai</p>
              <p className="text-foreground">{leave.end_date}</p>
            </div>
          </div>

          {leave.is_advance && (
            <div className="border-t border-border pt-4 flex items-center gap-2 text-sm text-orange-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Cuti Hutang — diajukan melebihi saldo tersedia</span>
            </div>
          )}
          {leave.reason && (
            <div className="border-t border-border pt-4">
              <p className="text-sm text-muted-foreground mb-1">Alasan</p>
              <p>{leave.reason}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {leave.status === "pending" && (
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            className="border-red-700 text-red-400 hover:bg-red-500/10"
            onClick={handleReject}
            disabled={processing}
          >
            <XCircle className="w-4 h-4 mr-2" />Tolak
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={handleApprove}
            disabled={processing}
          >
            {processing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            Setuju
          </Button>
        </div>
      )}

      {leave.status === "approved" && (
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            className="border-red-700 text-red-400 hover:bg-red-500/10"
            onClick={handleReject}
            disabled={processing}
          >
            <XCircle className="w-4 h-4 mr-2" />Batalkan Persetujuan
          </Button>
        </div>
      )}
    </div>
  )
}
