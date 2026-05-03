"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, User, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLeave } from "@/hooks/useLeave"

export default function LeaveDetailClient({ id }: { id: string }) {
  const { leaveRequests, loading, updateStatus } = useLeave()
  const [leave, setLeave] = useState<any>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const l = leaveRequests.find(r => r.id === id)
    if (l) setLeave(l)
  }, [leaveRequests, id])

  const handleApprove = async () => {
    setProcessing(true)
    try {
      await updateStatus(id, 'approved')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    setProcessing(true)
    try {
      await updateStatus(id, 'rejected')
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
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
  }

  if (!leave) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-slate-400">Pengajuan cuti tidak ditemukan</p>
          <Link href="/hr/leave"><Button variant="outline" className="mt-4 border-slate-700">Kembali</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/hr/leave"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Detail Pengajuan Cuti</h1>
            <p className="text-slate-400">{leave.hr_leave_types?.name || "-"} • {leave.start_date} s/d {leave.end_date}</p>
          </div>
        </div>
        <Badge className={getStatusBadge(leave.status)}>{leave.status.toUpperCase()}</Badge>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3"><User className="w-4 h-4 text-slate-500" /><span className="text-slate-300">{leave.user_profiles?.full_name || "Karyawan"}</span></div>
            <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-slate-500" /><span className="text-slate-300">{leave.days_requested || 0} hari</span></div>
          </div>
          {leave.reason && (
            <div className="border-t border-slate-800 pt-4">
              <p className="text-sm text-slate-500 mb-1">Alasan</p>
              <p className="text-slate-300">{leave.reason}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {leave.status === 'pending' && (
        <div className="flex gap-3 justify-end">
          <Button variant="outline" className="border-red-700 text-red-400 hover:bg-red-500/10" onClick={handleReject} disabled={processing}>
            <XCircle className="w-4 h-4 mr-2" />Tolak
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleApprove} disabled={processing}>
            <CheckCircle2 className="w-4 h-4 mr-2" />Setuju
          </Button>
        </div>
      )}
    </div>
  )
}
