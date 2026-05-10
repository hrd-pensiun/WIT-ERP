"use client"

import { useState, useEffect, useMemo } from "react"
import { CheckCircle, XCircle, AlertCircle, Settings, CalendarDays, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FilterBar, FilterBarSearch, FilterBarSeparator, FilterBarActions } from "@/components/ui/filter-bar"
import { useAttendance } from "@/hooks/useAttendance"
import { useEmployees } from "@/hooks/useEmployees"
import Link from "next/link"

const MONTHS = [
  "Jan","Feb","Mar","Apr","Mei","Jun",
  "Jul","Agu","Sep","Okt","Nov","Des",
]

function pad(n: number) { return String(n).padStart(2, "0") }

function monthRange(year: number, month: number) {
  const lastDay = new Date(year, month, 0).getDate()
  return {
    from: `${year}-${pad(month)}-01`,
    to:   `${year}-${pad(month)}-${lastDay}`,
  }
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function weekRange() {
  const d = new Date()
  const day = d.getDay() || 7
  const mon = new Date(d); mon.setDate(d.getDate() - day + 1)
  const sun = new Date(d); sun.setDate(d.getDate() + (7 - day))
  const fmt = (dt: Date) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
  return { from: fmt(mon), to: fmt(sun) }
}

export default function AttendancePage() {
  const today = new Date()
  const [dateFrom, setDateFrom] = useState(() => monthRange(today.getFullYear(), today.getMonth() + 1).from)
  const [dateTo,   setDateTo]   = useState(() => monthRange(today.getFullYear(), today.getMonth() + 1).to)
  const [search,    setSearch]    = useState("")
  const [empFilter, setEmpFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const { attendance, loading, fetchAttendance } = useAttendance()
  const { employees } = useEmployees()

  useEffect(() => {
    if (dateFrom && dateTo) {
      fetchAttendance({ date_from: dateFrom, date_to: dateTo })
    }
  }, [dateFrom, dateTo]) // eslint-disable-line

  // Quick range shortcuts
  function applyThisMonth() {
    const r = monthRange(today.getFullYear(), today.getMonth() + 1)
    setDateFrom(r.from); setDateTo(r.to)
  }
  function applyLastMonth() {
    const m = today.getMonth() === 0 ? 12 : today.getMonth()
    const y = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear()
    const r = monthRange(y, m)
    setDateFrom(r.from); setDateTo(r.to)
  }
  function applyThisWeek() {
    const r = weekRange()
    setDateFrom(r.from); setDateTo(r.to)
  }
  function applyToday() {
    const t = todayStr()
    setDateFrom(t); setDateTo(t)
  }

  const hasActiveFilters = search !== "" || empFilter !== "all" || statusFilter !== "all"
  function resetFilters() {
    setSearch(""); setEmpFilter("all"); setStatusFilter("all")
  }

  const filtered = useMemo(() => {
    return attendance.filter((r: any) => {
      const name: string = r.user_profiles?.full_name ?? ""
      const empNum: string = r.user_profiles?.employee_number ?? ""
      const matchSearch = search === "" ||
        name.toLowerCase().includes(search.toLowerCase()) ||
        empNum.includes(search)
      const matchEmp = empFilter === "all" || r.user_profile_id === empFilter
      const recStatus = r.status === "absent"
        ? "absent"
        : r.check_in_status === "late" ? "late" : "present"
      const matchStatus = statusFilter === "all" || recStatus === statusFilter
      return matchSearch && matchEmp && matchStatus
    })
  }, [attendance, search, empFilter, statusFilter])

  const stats = useMemo(() => ({
    present: filtered.filter((r: any) => r.status !== "absent" && r.check_in_status !== "late").length,
    late:    filtered.filter((r: any) => r.check_in_status === "late").length,
    absent:  filtered.filter((r: any) => r.status === "absent").length,
  }), [filtered])

  function statusBadge(r: any) {
    if (r.status === "absent")
      return <Badge className="bg-red-500/20 text-red-400 border-0 text-xs">Tidak Hadir</Badge>
    if (r.check_in_status === "late")
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-xs">Terlambat</Badge>
    return <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">Hadir</Badge>
  }

  function fmtTime(ts: string | null) {
    if (!ts) return "—"
    return new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  }

  function fmtDate(d: string) {
    const dt = new Date(d + "T00:00:00")
    return dt.toLocaleDateString("id-ID", { weekday: "short", day: "2-digit", month: "short" })
  }

  const rangeLabel = dateFrom === dateTo
    ? new Date(dateFrom + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : `${new Date(dateFrom + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" })} – ${new Date(dateTo + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Absensi</h1>
          <p className="text-muted-foreground mt-1">Kelola kehadiran karyawan</p>
        </div>
        <Link href="/hr/attendance/settings">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Pengaturan Denda
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg shrink-0">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.present}</p>
                <p className="text-xs text-muted-foreground">Hadir Tepat Waktu</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-lg shrink-0">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.late}</p>
                <p className="text-xs text-muted-foreground">Terlambat</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-lg shrink-0">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.absent}</p>
                <p className="text-xs text-muted-foreground">Tidak Hadir</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter section */}
      <div className="space-y-3">
        {/* Date range */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Dari Tanggal</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 w-40 text-sm bg-background border-border"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Sampai Tanggal</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 w-40 text-sm bg-background border-border"
            />
          </div>
          {/* Quick shortcuts */}
          <div className="flex items-center gap-1.5 pb-0.5">
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={applyToday}>Hari ini</Button>
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={applyThisWeek}>Minggu ini</Button>
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={applyThisMonth}>Bulan ini</Button>
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={applyLastMonth}>Bulan lalu</Button>
          </div>
        </div>

        {/* Search + status + employee */}
        <FilterBar>
          <FilterBarSearch
            placeholder="Cari nama atau no. karyawan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FilterBarSeparator />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-auto min-w-[140px] text-sm border-border bg-background">
              <SelectValue placeholder="Semua status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="present">Hadir</SelectItem>
              <SelectItem value="late">Terlambat</SelectItem>
              <SelectItem value="absent">Tidak Hadir</SelectItem>
            </SelectContent>
          </Select>
          <Select value={empFilter} onValueChange={setEmpFilter}>
            <SelectTrigger className="h-8 w-auto min-w-[160px] text-sm border-border bg-background">
              <SelectValue placeholder="Semua karyawan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Karyawan</SelectItem>
              {employees.map((emp: any) => (
                <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <FilterBarActions>
              <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={resetFilters}>
                <X className="w-3 h-3 mr-1" /> Reset filter
              </Button>
            </FilterBarActions>
          )}
        </FilterBar>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-foreground flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-500" />
              {rangeLabel}
            </CardTitle>
            <span className="text-sm text-muted-foreground">{filtered.length} record</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-muted-foreground text-center py-12">Memuat data...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">Tidak ada data untuk periode ini</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Tanggal</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Karyawan</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Check In</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Check Out</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Jam Kerja</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((record: any) => (
                    <tr key={record.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-foreground whitespace-nowrap">
                        {fmtDate(record.date)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-foreground font-medium leading-tight">
                          {record.user_profiles?.full_name ?? "—"}
                        </p>
                        {record.user_profiles?.employee_number && (
                          <p className="text-xs text-muted-foreground">{record.user_profiles.employee_number}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-foreground tabular-nums">
                        {fmtTime(record.check_in)}
                      </td>
                      <td className="px-4 py-3 text-center text-foreground tabular-nums">
                        {fmtTime(record.check_out)}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground tabular-nums">
                        {record.work_hours != null ? `${record.work_hours} j` : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {statusBadge(record)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
