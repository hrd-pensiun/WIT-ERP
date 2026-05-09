"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Calendar, Plus, CheckCircle, XCircle, Clock, Loader2, Settings2, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLeave } from "@/hooks/useLeave"
import { useLeaveBalance } from "@/hooks/useLeaveBalance"

const currentYear = new Date().getFullYear()

export default function LeavePage() {
  const { leaves, loading } = useLeave()
  const { balances, fetchBalances, loading: balLoading } = useLeaveBalance()

  useEffect(() => {
    fetchBalances({ year: currentYear })
  }, [fetchBalances])

  const stats = {
    approved: leaves.filter((l) => l.status === "approved").length,
    pending: leaves.filter((l) => l.status === "pending").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
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
          <h1 className="text-3xl font-bold text-foreground">Cuti</h1>
          <p className="text-muted-foreground mt-1">Kelola pengajuan cuti karyawan</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/hr/leave/settings">
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Tipe Cuti
            </Button>
          </Link>
          <Link href="/hr/leave/quota">
            <Button variant="outline" size="sm">
              <Settings2 className="w-4 h-4 mr-2" />
              Atur Kuota
            </Button>
          </Link>
          <Link href="/hr/leave/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Ajukan Cuti
            </Button>
          </Link>
        </div>
      </div>

      {/* Request Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.approved}</p>
                <p className="text-sm text-muted-foreground">Disetujui</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Menunggu</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.rejected}</p>
                <p className="text-sm text-muted-foreground">Ditolak</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Balance Summary */}
      {(balances.length > 0 || balLoading) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              Ringkasan Saldo Cuti {currentYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {balLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="w-4 h-4 animate-spin" />Memuat saldo...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Karyawan</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Tipe Cuti</th>
                      <th className="text-center py-2 pr-4 font-medium text-muted-foreground">Kuota</th>
                      <th className="text-center py-2 pr-4 font-medium text-muted-foreground">Carry Over</th>
                      <th className="text-center py-2 pr-4 font-medium text-muted-foreground">Digunakan</th>
                      <th className="text-center py-2 font-medium text-muted-foreground">Sisa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balances.map((b) => (
                      <tr key={b.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 pr-4 text-foreground">
                          {(b as any).user_profiles?.full_name || b.user_profile_id.slice(0, 8)}
                        </td>
                        <td className="py-2 pr-4 text-foreground">
                          {b.hr_leave_types?.name || b.leave_type_id.slice(0, 8)}
                        </td>
                        <td className="py-2 pr-4 text-center">{b.effective_quota}</td>
                        <td className="py-2 pr-4 text-center text-muted-foreground">{b.carry_over_days}</td>
                        <td className="py-2 pr-4 text-center text-amber-500">{b.used_days}</td>
                        <td className="py-2 text-center">
                          <span className={b.remaining_days < 1 ? "text-red-400 font-semibold" : "text-emerald-500 font-semibold"}>
                            {b.remaining_days}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Leave List */}
      <Card>
        <CardHeader>
          <CardTitle>Pengajuan Cuti</CardTitle>
        </CardHeader>
        <CardContent>
          {leaves.length > 0 ? (
            <div className="space-y-2">
              {leaves.map((leave: any) => (
                <Link key={leave.id} href={`/hr/leave/${leave.id}`}>
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex-1">
                      <p className="text-foreground font-medium">
                        {leave.user_profiles?.full_name || "-"}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {leave.start_date} → {leave.end_date}
                        </span>
                        <span>{leave.days_requested} hari</span>
                        {leave.reason && <span className="truncate max-w-[200px]">{leave.reason}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {leave.is_advance && (
                        <Badge className="bg-orange-500/20 text-orange-400 text-xs border-orange-500/30">Hutang</Badge>
                      )}
                      <Badge variant="outline" className="text-muted-foreground">
                        {leave.hr_leave_types?.name || leave.leave_type_id}
                      </Badge>
                      <Badge
                        className={
                          leave.status === "approved"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : leave.status === "rejected"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }
                      >
                        {leave.status === "approved"
                          ? "Disetujui"
                          : leave.status === "rejected"
                          ? "Ditolak"
                          : "Menunggu"}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada pengajuan cuti</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
