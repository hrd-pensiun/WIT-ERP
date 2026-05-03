"use client"

import { Calendar, Plus, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLeave } from "@/hooks/useLeave"

export default function LeavePage() {
  const { leaves, loading } = useLeave()

  const stats = {
    approved: leaves.filter(l => l.status === 'approved').length,
    pending: leaves.filter(l => l.status === 'pending').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Cuti</h1>
          <p className="text-slate-400 mt-1">Kelola pengajuan cuti karyawan</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Ajukan Cuti
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">{stats.approved}</p>
                <p className="text-sm text-slate-400">Disetujui</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">{stats.pending}</p>
                <p className="text-sm text-slate-400">Menunggu</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">{stats.rejected}</p>
                <p className="text-sm text-slate-400">Ditolak</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave List */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">Pengajuan Cuti</CardTitle>
        </CardHeader>
        <CardContent>
          {leaves.length > 0 ? (
            <div className="space-y-2">
              {leaves.map((leave: any) => (
                <div
                  key={leave.id}
                  className="flex items-center justify-between p-4 bg-slate-950 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-slate-100 font-medium">{leave.user_profiles?.full_name || '-'}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {leave.start_date} → {leave.end_date}
                      </span>
                      <span>{leave.days_requested} hari</span>
                      <span className="text-slate-500">{leave.reason}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-slate-400">
                      {leave.hr_leave_types?.name || leave.leave_type_id}
                    </Badge>
                    <Badge
                      className={
                        leave.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : leave.status === 'rejected'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }
                    >
                      {leave.status === 'approved' ? 'Disetujui' : leave.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada pengajuan cuti</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
