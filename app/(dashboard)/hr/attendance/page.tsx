"use client"

import { useState } from "react"
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAttendance } from "@/hooks/useAttendance"

export default function AttendancePage() {
  const { attendance, loading } = useAttendance()
  const [currentDate] = useState(new Date().toISOString().split('T')[0])

  const stats = {
    present: attendance?.filter((a: any) => a.status === 'present').length || 0,
    absent: attendance?.filter((a: any) => a.status === 'absent').length || 0,
    late: attendance?.filter((a: any) => a.status === 'late').length || 0,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Absensi</h1>
          <p className="text-muted-foreground mt-1">Kelola kehadiran karyawan</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Clock className="w-4 h-4 mr-2" />
          Check In
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.present}</p>
                <p className="text-sm text-muted-foreground">Hadir</p>
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
                <p className="text-2xl font-bold text-foreground">{stats.absent}</p>
                <p className="text-sm text-muted-foreground">Tidak Hadir</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.late}</p>
                <p className="text-sm text-muted-foreground">Terlambat</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle>Data Absensi Hari Ini ({currentDate})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : attendance?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Belum ada data absensi</p>
          ) : (
            <div className="space-y-2">
              {attendance?.map((record: any) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 bg-background rounded-lg"
                >
                  <div>
                    <p className="text-foreground font-medium">
                      {record.employees?.full_name || `Karyawan ${record.employee_id}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Check-in: {record.check_in ? new Date(record.check_in).toLocaleTimeString('id-ID') : '-'}
                    </p>
                  </div>
                  <Badge
                    className={
                      record.status === 'present'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : record.status === 'absent'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }
                  >
                    {record.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
